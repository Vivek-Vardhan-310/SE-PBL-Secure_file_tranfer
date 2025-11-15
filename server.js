const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Function to generate a random symmetric key
function generateSymmetricKey() {
    return crypto.randomBytes(32); // 256-bit key for AES-256
}

// Function to encrypt data with symmetric key
function encryptWithSymmetricKey(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { encryptedData: encrypted, iv };
}

// Function to decrypt data with symmetric key
function decryptWithSymmetricKey(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
}

const app = express();
const PORT = 3000;
const USERS_FILE = 'users.json';
const NOTIFICATIONS_FILE = 'notifications.json';

// Function to load users from JSON file
function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    return {};
  }
}

// Function to save users to JSON file
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// Function to load notifications
function loadNotifications() {
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

// Function to save notifications
function saveNotifications(notifications) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

// Load notifications
let notifications = loadNotifications();

// Load users from file
let users = loadUsers();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Routes
app.post('/api/create-user', (req, res) => {
    const { userId, password } = req.body;
    if (!userId || !password || users[userId]) {
        return res.status(400).json({ error: 'User ID and password are required, or user already exists' });
    }

    // Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 1024,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    users[userId] = {
        privateKey: privateKey,
        publicKey: publicKey,
        password: password,
        files: []
    };

    saveUsers(users);
    res.json({ message: 'User created successfully', publicKey, privateKey });
});

app.get('/api/users/:userId', (req, res) => {
    const { userId } = req.params;
    if (users[userId]) {
        res.json({ exists: true });
    } else {
        res.json({ exists: false });
    }
});

app.get('/api/users', (req, res) => {
    res.json(users);
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    const { currentUserId, fileType, recipientUserId } = req.body;

    if (!users[currentUserId]) {
        return res.status(400).json({ error: 'Invalid current user' });
    }

    if (fileType === 'private' && !users[recipientUserId]) {
        return res.status(400).json({ error: 'Invalid recipient user' });
    }

    const filePath = path.join(uploadsDir, req.file.filename);

    if (fileType === 'private') {
        // Generate symmetric key and encrypt file with it
        const symmetricKey = generateSymmetricKey();
        const fileBuffer = fs.readFileSync(filePath);
        const { encryptedData, iv } = encryptWithSymmetricKey(fileBuffer, symmetricKey);

        // Encrypt the symmetric key with recipient's public RSA key
        const encryptedKey = crypto.publicEncrypt({
            key: users[recipientUserId].publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        }, symmetricKey);

        // Store encrypted file, encrypted key, and IV
        const combinedData = Buffer.concat([iv, encryptedKey, encryptedData]);
        fs.writeFileSync(filePath, combinedData);
    }
    // Public files are stored unencrypted

    // Add file to uploader's files array
    const fileEntry = {
        name: req.file.originalname,
        type: fileType,
        filename: req.file.filename,
        uploaderId: currentUserId,
        uploadTime: new Date().toISOString(),
        ...(fileType === 'private' && { downloaderId: recipientUserId })
    };

    users[currentUserId].files.push(fileEntry);

    // Save updated users to file
    saveUsers(users);

    res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

app.get('/api/files/:currentUserId', (req, res) => {
    const { currentUserId } = req.params;

    if (!users[currentUserId]) {
        return res.status(400).json({ error: 'Invalid user' });
    }

    // Get all files that current user can access from all senders
    const accessibleFiles = [];
    for (const userId in users) {
        const user = users[userId];
        user.files.forEach(file => {
            if (file.type === 'public' || file.downloaderId === currentUserId) {
                accessibleFiles.push({
                    ...file,
                    senderId: userId
                });
            }
        });
    }

    res.json(accessibleFiles);
});

app.post('/api/download', (req, res) => {
    const { filename, currentUserId, password, privateKey } = req.body;

    if (!users[currentUserId]) {
        return res.status(400).json({ error: 'Invalid user' });
    }

    // Verify password
    if (users[currentUserId].password !== password) {
        return res.status(403).json({ error: 'Invalid password' });
    }

    // Find the file entry
    let fileEntry = null;
    let uploaderId = null;
    for (const userId in users) {
        const user = users[userId];
        const file = user.files.find(f => f.filename === filename);
        if (file) {
            fileEntry = file;
            uploaderId = userId;
            break;
        }
    }

    if (!fileEntry) {
        return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
    }

    let decryptedBuffer = fs.readFileSync(filePath);

    if (fileEntry.type === 'private') {
        // Extract IV, encrypted key, and encrypted data
        const iv = decryptedBuffer.subarray(0, 16);
        const encryptedKey = decryptedBuffer.subarray(16, 16 + 128); // RSA 1024 key size
        const encryptedData = decryptedBuffer.subarray(16 + 128);

        // Decrypt the symmetric key with private RSA key
        const symmetricKey = crypto.privateDecrypt({
            key: users[currentUserId].privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        }, encryptedKey);

        // Decrypt the file data with symmetric key
        decryptedBuffer = decryptWithSymmetricKey(encryptedData, symmetricKey, iv);
    }
    // Public files are not encrypted

    // Add notification to uploader
    const notification = {
        uploaderId: uploaderId,
        downloaderId: currentUserId,
        filename: fileEntry.name,
        time: new Date().toISOString()
    };
    notifications.push(notification);
    saveNotifications(notifications);

    // Send the file
    res.setHeader('Content-Disposition', `attachment; filename="${fileEntry.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(decryptedBuffer);
});

app.post('/api/verify-key', (req, res) => {
    const { userId, privateKey } = req.body;

    if (users[userId] && users[userId].privateKey === privateKey) {
        res.json({ valid: true });
    } else {
        res.json({ valid: false });
    }
});

app.get('/api/user-files/:userId', (req, res) => {
    const { userId } = req.params;
    if (!users[userId]) {
        return res.status(400).json({ error: 'Invalid user' });
    }

    // Return only files uploaded by this user
    const userUploadedFiles = users[userId].files.map(file => ({
        ...file,
        uploadTime: file.uploadTime || new Date().toISOString() // Add upload time if not present
    }));
    res.json(userUploadedFiles);
});

app.post('/api/delete', (req, res) => {
    const { filename, currentUserId, password } = req.body;

    if (!users[currentUserId]) {
        return res.status(400).json({ error: 'Invalid user' });
    }

    // Verify password
    if (users[currentUserId].password !== password) {
        return res.status(403).json({ error: 'Invalid password' });
    }

    // Find and remove the file from user's files array
    const fileIndex = users[currentUserId].files.findIndex(f => f.filename === filename);
    if (fileIndex === -1) {
        return res.status(404).json({ error: 'File not found' });
    }

    const fileEntry = users[currentUserId].files[fileIndex];

    // Remove file from disk
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Remove from user's files array
    users[currentUserId].files.splice(fileIndex, 1);

    // Save updated users to file
    saveUsers(users);

    res.json({ message: 'File deleted successfully' });
});

app.get('/api/notifications/:userId', (req, res) => {
    const { userId } = req.params;
    if (!users[userId]) {
        return res.status(400).json({ error: 'Invalid user' });
    }

    const userNotifications = notifications.filter(n => n.uploaderId === userId);
    res.json(userNotifications);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
