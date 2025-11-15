# TODO List for Encrypt File Project

## 1. Update server.js
- [x] Add crypto module imports
- [x] Add endpoint for new user creation: generate RSA key pair (public/private), regular key (random string)
- [x] Update user structure: add publicKey, regularKey
- [x] On upload: if private, encrypt file with recipient's public key; if public, store as is
- [x] On download: if private, decrypt with downloader's private key; if public, check regular key
- [x] Add download notifications: log to notifications.json (who downloaded what, time)
- [x] Update load/save functions for notifications

## 2. Update users.json
- [x] Add publicKey and regularKey to existing users (generate them)

## 3. Create newuser.html
- [x] Form to create new user: input userId, generate keys, save to users.json

## 4. Update index.html
- [x] Add link/button to create new user

## 5. Update upload.html
- [x] Adjust form to handle encryption (server-side)

## 6. Update download.html
- [x] Adjust to handle decryption, show notifications

## 7. Create notifications.json
- [x] Initialize empty notifications file

## 8. Test and Run
- [x] Run server locally: node server.js
- [ ] Test upload/download with encryption
- [ ] Check notifications
