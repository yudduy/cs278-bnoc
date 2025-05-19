# Populating Firebase with Sample Data

This script allows you to populate your Firebase database with sample users, pairings, and other data to test the BNOC app.

## Prerequisites

1. You need Firebase Admin SDK credentials
2. Node.js installed on your machine

## Setup

1. Create a service account key in the Firebase Console:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `serviceAccountKey.json` in the root directory of your project

2. Install the required dependencies:
   ```bash
   npm install firebase-admin
   ```

## Running the Script

```bash
cd scripts
node populateFirebase.js
```

## What the Script Does

The script will create:

1. Three sample users (user1, user2, user3)
2. A pending pairing for today between user1 and user2
3. A completed pairing from yesterday between user2 and user3 with sample photos
4. A comment on yesterday's pairing
5. Add yesterday's pairing to the global feed
6. Add feed entries for each user

## Customizing the Data

You can modify the script to add more users, pairings, or customize the data as needed. Just edit the arrays of users, pairings, and comments in the script.

## Manually Creating Users in Firebase Authentication

After running this script, you'll need to create matching user accounts in Firebase Authentication:

1. Go to Firebase Console > Authentication > Users
2. Click "Add User"
3. Enter the email and a password for each user
   - For user1: duy@stanford.edu
   - For user2: justin@stanford.edu
   - For user3: kelvin@stanford.edu

The auth UIDs should match the user IDs in the script (user1, user2, user3).

## Uploading Profile Photos and Pairing Photos

The script references photo URLs, but you'll need to upload the actual photos to Firebase Storage:

1. Go to Firebase Console > Storage
2. Create the following folder structure:
   - /assets/profile1.jpg (for user1)
   - /assets/profile2.jpg (for user2)
   - /assets/profile3.jpg (for user3)
   - /pairing_photos/pairing2/user2_photo.jpg
   - /pairing_photos/pairing2/user3_photo.jpg

3. Upload sample images to these locations

## Troubleshooting

If you encounter errors:
- Make sure your `serviceAccountKey.json` is correctly placed
- Check that the Firebase project ID in the key matches your actual project
- Verify that you have the correct permissions for the service account
