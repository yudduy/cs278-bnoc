# BNOC Scripts

This directory contains essential production utility scripts for managing the BNOC application.

## Available Scripts

### 1. Database Status Check (`checkStatus.js`) ⭐
**Purpose**: Comprehensive health check of the Firebase database.

**Usage**:
```bash
node checkStatus.js
```

**What it shows**:
- Active users count and details
- Today's pairings status breakdown
- Data integrity issues (e.g., missing users in pairings)
- getCurrentPairing function tests for all users
- Global feed, chat rooms, and notifications summary

**When to use**:
- Daily health monitoring
- Debugging pairing issues
- Verifying system status after deployments

### 2. Manual Pairing (`manualPairing.js`) ⭐
**Purpose**: Creates daily pairings manually when Cloud Functions fail or for emergency situations.

**Usage**:
```bash
node manualPairing.js [optional-date]
```

**What it does**:
- Fetches active users with recent activity and low flake streak
- Shuffles users and pairs them while avoiding recent repeats  
- Creates pairing documents and chat rooms
- Handles waitlisted users with priority for next pairing

**When to use**:
- Cloud Functions are down
- Emergency pairing creation needed
- Testing pairing algorithm

**Example**:
```bash
node manualPairing.js                    # Create pairings for today
node manualPairing.js 2025-05-29         # Create pairings for specific date
```

### 3. Complete Incomplete Pairings (`complete-incomplete-pairings.js`) ⭐
**Purpose**: Artificially complete pairings where one user submitted a photo but their partner didn't respond.

**Usage**:
```bash
# Dry run to see what would be completed
node complete-incomplete-pairings.js --dry-run

# Actually complete the pairings
node complete-incomplete-pairings.js
```

**What it does**:
- Finds all pairings with `user1_submitted` or `user2_submitted` status
- Creates artificial completion for non-responding partners
- Updates pairing status to `completed` with artificial flag
- Adds completed pairings to the global feed
- Uses placeholder images for missing partner photos

**When to use**:
- Clean up abandoned incomplete pairings
- Provide closure for users who submitted photos but partners didn't respond
- Maintain data integrity in the pairing system

**Safety Features**:
- Dry run mode for safe testing
- Confirmation prompt before making changes
- Marks artificial completions with special flags
- Detailed logging of all operations

### 4. User Account Management (`deleteUser.js`)
**Purpose**: Safely delete a user account with complete cleanup.

**Usage**:
```bash
node deleteUser.js <username>
```

**What it does**:
- Finds user by username
- Requires "DELETE" confirmation for safety
- Updates active pairings (marks as cancelled)
- Removes user from other users' connections
- Cleans up chat rooms and messages
- Deletes user's notifications and settings
- Deletes Firestore document and Firebase Auth account

**Safety Features**:
- Confirmation prompt required
- Comprehensive cleanup to prevent orphaned data
- Detailed logging of all operations

### 5. Test Account Creation (`createTestAccounts.js`)
**Purpose**: Creates test accounts for development and demo purposes.

**Usage**:
```bash
node createTestAccounts.js
```

**What it creates**:
- Test user accounts with known credentials
- Proper Firebase Auth integration
- Firestore user profiles

**When to use**:
- Setting up demo environments
- Creating accounts for manual testing
- Replacing broken test accounts

## Prerequisites

All scripts require:

1. **Firebase Service Account Key**:
   - Download from Firebase Console > Project Settings > Service Accounts
   - Save as `serviceAccountKey.json` in the project root (not in scripts/)
   - ⚠️ **Never commit this file to version control**

2. **Dependencies**:
   ```bash
   cd scripts
   npm install firebase-admin uuid
   ```

## Production Use Cases

### Daily Monitoring
```bash
# Check system health every morning
cd scripts && node checkStatus.js
```

### Emergency Response
```bash
# If auto-pairing fails
cd scripts && node manualPairing.js

# Check what went wrong
node checkStatus.js
```

### Pairing Cleanup
```bash
# Check for incomplete pairings
cd scripts && node complete-incomplete-pairings.js --dry-run

# Complete abandoned pairings
node complete-incomplete-pairings.js
```

### User Management
```bash
# Remove problematic user account
cd scripts && node deleteUser.js problemuser
```

### Account Setup
```bash
# Create test accounts for demos
cd scripts && node createTestAccounts.js
```

## System Integration

### Cloud Functions Status
These scripts complement the automated Cloud Functions:
- **pairUsers** - Runs daily at 5:00 AM PT
- **autoPairNewUser** - Triggered on user creation
- **autoPairOnUserCreate** - Firestore trigger backup

### Monitoring Integration
- Use `checkStatus.js` for daily health checks
- Monitor Firebase Function logs: `firebase functions:log --only pairUsers`
- Check for authentication issues and data integrity

## Troubleshooting

**"serviceAccountKey.json not found"**
- Download the service account key from Firebase Console
- Save it as `serviceAccountKey.json` in the project root

**"No pairings for today"**
- Run `node manualPairing.js` to create missing pairings
- Check Cloud Function status with `firebase functions:list`

**"Authentication errors"**
- Verify Firebase project configuration
- Check service account permissions
- Ensure project ID matches in scripts

**"Index required" errors**
- Contact development team - indexes may need deployment
- Use manual pairing as temporary workaround

## Safety & Best Practices

- **Always run `checkStatus.js` before manual interventions**
- **Use confirmation prompts for destructive operations**
- **Test scripts in development environment first**
- **Monitor logs for any errors during execution**
- **Keep service account key secure and never commit to version control**

## Maintenance Notes

### Recent Updates (June 2025)
- ✅ **Added incomplete pairings completion script**
- ✅ **Enhanced pairing cleanup capabilities**
- ✅ **Improved artificial completion system**

### Previous Updates (December 2024)
- ✅ **Fixed auto-pairing authentication issues**
- ✅ **Optimized Firebase queries to avoid index requirements**
- ✅ **Enhanced data integrity checking**
- ✅ **Cleaned up development/testing scripts**
- ✅ **Improved error handling and logging**

### Removed Scripts
The following development scripts were removed after production stabilization:
- `testAutoPairing.js` - Replaced by production auto-pairing system
- `repairPairings.js` - Functionality integrated into `manualPairing.js`
- `testFirebaseAuth.js` - Development testing only
- `testSetup.js` - Replaced by `createTestAccounts.js`