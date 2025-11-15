# FileSentinel - Secure File Sharing System

## Overview

FileSentinel is a web-based application that allows users to securely upload, encrypt, and share files. It supports both public and private file sharing with RSA encryption for private files and regular key authentication for public files. The system ensures that only authorized users can access and download files.

## Features

- **User Management**: Create new users with automatically generated RSA key pairs and regular keys.
- **File Upload**:
  - Public files: Accessible to all users with a regular key.
  - Private files: Encrypted with recipient's public key, accessible only to the specified recipient.
- **File Download**: Authenticated download with proper key validation.
- **Notifications**: Track download activities for file uploaders.
- **Security**: RSA encryption for private files, key-based authentication.

## Technologies Used

- **Backend**: Node.js with Express.js
- **Encryption**: Node.js crypto module (RSA for private files)
- **File Storage**: Local file system with multer for uploads
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Data Storage**: JSON files for users and notifications

## Installation

1. Ensure Node.js is installed on your system.
2. Clone or download the project files.
3. Navigate to the project directory.
4. Install dependencies:
   ```
   npm install
   ```
5. Start the server:
   ```
   node server.js
   ```
6. Open your browser and go to `http://localhost:3000`

## Usage

### Creating a User
1. Go to the main page and click "Create New User".
2. Enter a unique User ID.
3. The system will generate RSA keys and a regular key for the user.

### Uploading Files
1. Log in with your User ID.
2. Choose file type (Public or Private).
3. For private files, select the recipient.
4. Upload the file.

### Downloading Files
1. Select a sender (user who uploaded files).
2. Choose a file from the list.
3. Enter the appropriate key (private key for private files, regular key for public files).
4. Download the file.

## API Endpoints

- `POST /api/create-user`: Create a new user
- `GET /api/users/:userId`: Check if user exists
- `GET /api/users`: Get all users
- `POST /api/upload`: Upload a file
- `GET /api/files/:currentUserId`: Get accessible files for a user
- `POST /api/download`: Download a file
- `POST /api/verify-key`: Verify a private key
- `GET /api/notifications/:userId`: Get notifications for a user

## File Structure

```
/
├── server.js              # Main server file
├── users.json             # User data storage
├── notifications.json     # Notification data storage
├── uploads/               # Directory for uploaded files
├── index.html             # Main page
├── upload.html            # File upload page
├── download.html          # File download page
├── newuser.html           # User creation page
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## Security Notes

- Private files are encrypted using RSA with the recipient's public key.
- Private keys are required to decrypt private files.
- Public files use a regular key for access control.
- All keys are generated securely using Node.js crypto module.
- File uploads are limited to 10MB.

## Limitations

- Data is stored in JSON files (not suitable for production).
- No user authentication beyond key validation.
- Files are stored locally (consider cloud storage for scalability).

## Future Improvements

- Database integration (MongoDB, PostgreSQL)
- User authentication system
- Cloud file storage
- Frontend framework (React, Vue.js)
- Additional encryption methods
- File versioning
- Admin panel

## License

This project is for educational purposes. Use at your own risk.
