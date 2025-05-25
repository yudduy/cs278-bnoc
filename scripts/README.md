# BNOC Scripts

This directory contains utility scripts for managing the BNOC application.

## User Deletion Script

### Overview

The `deleteUser.js` script provides a comprehensive way to delete a user account from the BNOC app, handling all necessary cleanup operations.

### Prerequisites

1. **Firebase Admin SDK Setup**
   - Download your Firebase service account key from the Firebase Console
   - Save it as `serviceAccountKey.json` in this directory
   - **IMPORTANT**: Never commit this file to version control

2. **Dependencies**
   ```bash
   npm install firebase-admin
   ```

### Usage

```bash
node deleteUser.js <username>
```

### What the Script Does

The deletion script performs the following operations in order:

1. **Find User**: Searches for a user by username in Firestore
2. **Confirmation**: Requires typing "DELETE" to confirm the operation
3. **Remove from Pairings**: Updates any active pairings to mark them as cancelled
4. **Update Connections**: Removes the user from all other users' connections arrays
5. **Clean Notification Settings**: Removes user's notification preferences
6. **Delete Firestore Document**: Removes the user document from Firestore
7. **Delete Firebase Auth**: Removes the user from Firebase Authentication

### Example

```bash
$ node deleteUser.js testuser

🔍 Searching for user with username: testuser
✅ Found user:
   - User ID: abc123def456
   - Email: testuser@stanford.edu
   - Display Name: Test User
   - Created: 12/15/2024
   - Connections: 3

⚠️  Are you sure you want to DELETE user "testuser" (testuser@stanford.edu)?
This action cannot be undone! Type "DELETE" to confirm: DELETE

🚀 Starting deletion process for user: testuser

🔄 Removing user from active pairings...
   Found 1 pairing(s) to update
   - Updating pairing pair_123 (status: pending)
   ✅ Updated 1 pairing(s)

🔄 Removing user from other users' connections...
   Found 3 connection(s) to update
   - Removing from user: user1
   - Removing from user: user2
   - Removing from user: user3
   ✅ Updated connections

🔄 Cleaning up notification settings...
   ✅ Deleted notification settings

🔄 Deleting user document from Firestore...
   ✅ Deleted user document from Firestore

🔄 Deleting user from Firebase Authentication...
   ✅ Deleted user from Firebase Auth

✅ Successfully deleted user: testuser

📊 Summary:
   - User removed from Firebase Auth
   - User document deleted from Firestore
   - User removed from active pairings
   - User removed from 3 connection(s)
   - Notification settings cleaned up
```

### Safety Features

- **Username Validation**: Only deletes if exactly one user matches the username
- **Confirmation Required**: Must type "DELETE" to proceed
- **Detailed Logging**: Shows what operations are being performed
- **Error Handling**: Gracefully handles errors and provides detailed feedback
- **Graceful Shutdown**: Can be interrupted with Ctrl+C

### Notes

- Deleted users cannot be recovered
- Pairings involving the user are marked as "cancelled_user_deleted" rather than deleted
- Other users' connection counts are properly decremented
- The script handles cases where the user might not exist in Firebase Auth but exists in Firestore

### Troubleshooting

**"serviceAccountKey.json not found"**
- Download the service account key from Firebase Console > Project Settings > Service Accounts
- Save it as `serviceAccountKey.json` in the scripts directory

**"Multiple users found"**
- This indicates duplicate usernames in the database
- Review the displayed users and manually investigate
- Consider running the script multiple times for each duplicate

**"User not found in Firebase Auth"**
- This is normal if the user was created in Firestore but not in Firebase Auth
- The script will continue with Firestore cleanup