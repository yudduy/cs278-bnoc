# BNOC Scripts

This directory contains utility scripts for managing the BNOC application.

## Available Scripts

### 1. Manual Pairing (`manualPairing.js`)

**Purpose**: Creates daily pairings manually when Cloud Functions fail or for testing.

**Usage**:
```bash
node manualPairing.js [optional-date]
```

**What it does**:
- Fetches active users with recent activity and low flake streak
- Shuffles users and pairs them while avoiding recent repeats  
- Creates pairing documents and chat rooms
- Handles waitlisted users with priority for next pairing

**Example**:
```bash
node manualPairing.js                    # Create pairings for today
node manualPairing.js 2025-05-29         # Create pairings for specific date
```

### 2. Database Status Check (`checkStatus.js`)

**Purpose**: Comprehensive health check of the Firebase database.

**Usage**:
```bash
node checkStatus.js
```

**What it shows**:
- Active users count and details
- Today's pairings status breakdown
- Global feed items count
- Chat rooms and notifications
- Unread notifications by user

### 3. User Deletion (`deleteUser.js`)

**Purpose**: Safely delete a user account with complete cleanup.

**Usage**:
```bash
node deleteUser.js <username>
```

**What it does**:
- Finds user by username
- Requires "DELETE" confirmation
- Updates active pairings (marks as cancelled)
- Removes user from other users' connections
- Deletes Firestore document and Firebase Auth account

**Example**:
```bash
node deleteUser.js testuser
```

### 4. Test Environment Setup (`testSetup.js`)

**Purpose**: Creates a complete test environment with users and sample data.

**Usage**:
```bash
node testSetup.js
```

**What it creates**:
- 5 test users with known passwords
- Friend connections between all users
- Sample pairings with different statuses
- Test feed posts and comments
- Notification examples

**Test Users Created**:
- duy@stanford.edu / hardcarry1738
- jleong22@stanford.edu / abbabb6969  
- kelvinknguyen@stanford.edu / seaside123
- ehsu24@stanford.edu / goodta
- mb@stanford.edu / goodteacher

### 5. Firebase Auth Testing (`testFirebaseAuth.js`)

**Purpose**: Tests Firebase Authentication functionality.

**Usage**:
```bash
node testFirebaseAuth.js [command]
```

**Available commands**:
- `test` - Run authentication tests
- `users` - List Firebase Auth users
- `profiles` - Check Firestore profiles
- `pairings` - Create fresh pairings

## Prerequisites

All scripts require:

1. **Firebase Service Account Key**:
   - Download from Firebase Console > Project Settings > Service Accounts
   - Save as `serviceAccountKey.json` in the project root (not in scripts/)
   - ⚠️ **Never commit this file to version control**

2. **Dependencies**:
   ```bash
   npm install firebase-admin uuid
   ```

## Common Use Cases

### Emergency Pairing Creation
If Cloud Functions fail to create daily pairings:
```bash
cd scripts
node manualPairing.js
```

### Database Health Check
To verify everything is working:
```bash
cd scripts  
node checkStatus.js
```

### Clean Environment Setup
To reset for testing:
```bash
cd scripts
node testSetup.js
```

### Remove Test User
To clean up after testing:
```bash
cd scripts
node deleteUser.js testusername
```

## Script Maintenance Notes

### Recently Fixed Issues (May 2025)
- **Firestore Index Problems**: Fixed by deploying proper composite indexes for array-contains queries
- **Manual Pairing Script**: Updated to use simplified queries while indexes build
- **Cloud Function Scheduling**: Functions now properly run at 5:00 AM and 7:00 AM PT

### Cleanup Completed
- Removed duplicate/outdated scripts: `debugUsers.js`, `cleanupDuplicateUsernames.js`, `fixMissingProfiles.js`, `setup-firebase-auth.sh`
- Consolidated functionality into comprehensive remaining scripts

## Safety Features

- **Confirmation prompts** for destructive operations
- **Detailed logging** of all operations
- **Error handling** with graceful recovery
- **Dry-run capabilities** where applicable
- **Backup creation** before major changes

## Troubleshooting

**"serviceAccountKey.json not found"**
- Download the service account key from Firebase Console
- Save it as `serviceAccountKey.json` in the project root (not scripts folder)

**"Index required" errors**
- The Cloud Functions team has deployed proper indexes
- Wait a few minutes for indexes to build, then retry

**"No pairings for today"**
- Run `node manualPairing.js` to create missing pairings
- Check Cloud Function logs with `firebase functions:log`

**"Multiple users found"**
- Use `node checkStatus.js` to verify database state
- Manual investigation may be needed for edge cases