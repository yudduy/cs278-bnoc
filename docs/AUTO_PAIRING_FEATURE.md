# Auto-Pairing Feature

## Overview

The auto-pairing feature ensures that new users are immediately paired with someone so they can start using the app right away, without waiting for manual pairing or other users to join.

## How It Works

When a new user signs up or an existing user logs in without a pairing for today, the system automatically:

1. **First Choice**: Pairs them with the designated test user `jleong222` (if available)
2. **Fallback**: Creates a new test account and pairs the user with it

This ensures every user always has someone to take photos with, making the app immediately usable.

## Implementation Details

### Auto-Pairing Logic

The system follows this prioritized logic:

```
New User Signs Up
      ↓
Check if jleong222 exists
      ↓
   [YES] → Check if jleong222 has active pairing today
      ↓
   [NO] → Pair with jleong222 ✅
      ↓
   [YES] → Create new test account (test_1, test_2, etc.)
      ↓
Pair new user with test account ✅
```

### Test Account Creation

- **Username Format**: `test_1`, `test_2`, `test_3`, etc.
- **Email Format**: `test_1@testuser.bnoc.stanford.edu`
- **Password**: `password123` (consistent for all test accounts)
- **Display Name**: `Test User 1`, `Test User 2`, etc.

### Integration Points

The auto-pairing feature is integrated into:

1. **Sign Up Flow** (`AuthContext.tsx`)
   - Triggers after successful user creation
   - Doesn't fail the sign-up process if auto-pairing fails

2. **Login Flow** (`AuthContext.tsx`)
   - Checks if existing users need pairing today
   - Automatically pairs users who don't have today's pairing

3. **Firebase Service** (`firebase.ts`)
   - Exposed through the main Firebase service facade
   - Available for manual triggering if needed

## Files Created/Modified

### New Files

- `src/services/autoPairingService.ts` - Core auto-pairing logic
- `scripts/createTestAccounts.js` - Manual test account creation utility
- `docs/AUTO_PAIRING_FEATURE.md` - This documentation

### Modified Files

- `src/context/AuthContext.tsx` - Added auto-pairing triggers
- `src/services/firebase.ts` - Added auto-pairing methods to facade

## API Reference

### Auto-Pairing Service Methods

```typescript
// Main auto-pairing function
autoPairNewUser(userId: string): Promise<boolean>

// Check if user needs pairing
needsAutoPairing(userId: string): Promise<boolean>
```

### Firebase Service Integration

```typescript
// Access through main Firebase service
import firebaseService from '../services/firebase';

// Auto-pair a user
const success = await firebaseService.autoPairNewUser(userId);

// Check if user needs pairing
const needsPairing = await firebaseService.needsAutoPairing(userId);
```

## Configuration

### Target User

The target user for pairing is configured in `autoPairingService.ts`:

```typescript
const TARGET_USER_USERNAME = 'jleong222';
```

To change the target user, modify this constant.

### Test Account Settings

```typescript
const TEST_ACCOUNT_PASSWORD = 'password123';
const TEST_ACCOUNT_EMAIL_DOMAIN = '@testuser.bnoc.stanford.edu';
```

## Manual Test Account Creation

For development and testing, you can manually create test accounts using the provided script:

```bash
cd scripts
node createTestAccounts.js
```

The script will prompt you for:
- Number of accounts to create
- Starting number for account naming

## Testing the Feature

### Test New User Auto-Pairing

1. Create a new user account
2. Check logs for auto-pairing messages
3. Verify the user has a pairing in the database
4. Confirm they can see their partner and take photos

### Test Existing User Auto-Pairing

1. Log in with an existing user who has no pairing today
2. Check logs for auto-pairing messages
3. Verify a new pairing was created

### Test jleong222 Pairing

1. Ensure jleong222 exists and has no active pairing
2. Create a new user
3. Verify they are paired with jleong222

### Test Fallback Account Creation

1. Ensure jleong222 already has an active pairing
2. Create a new user
3. Verify a new test account was created
4. Verify the new user is paired with the test account

## Error Handling

The auto-pairing system includes comprehensive error handling:

- **Graceful Degradation**: If auto-pairing fails, user sign-up/login still succeeds
- **Fallback Mechanisms**: Multiple strategies for pairing users
- **Logging**: Detailed logs for troubleshooting
- **Non-Blocking**: Doesn't prevent normal app functionality

## Monitoring and Logs

Auto-pairing activities are logged with these prefixes:

- `Successfully paired new user X with jleong222`
- `Successfully paired new user X with test account test_Y`
- `Auto-pairing failed for new user X`
- `Created test account: test_Y`

## Benefits

1. **Immediate Usability**: New users can start using the app immediately
2. **No Waiting**: No need to wait for other real users to join
3. **Consistent Experience**: Every user gets the same initial experience
4. **Development Friendly**: Easy testing with predictable test accounts
5. **Scalable**: Automatically creates test accounts as needed

## Future Enhancements

Potential improvements for the auto-pairing system:

1. **Smart Pairing**: Pair with other new users when possible
2. **Time-Based Pairing**: Different logic for different times of day
3. **Location-Based**: Consider user location for pairing
4. **Preference-Based**: Allow users to set pairing preferences
5. **Test Account Pool**: Pre-create a pool of test accounts for better performance

## Troubleshooting

### Common Issues

1. **jleong222 not found**
   - Ensure the user exists in the database
   - Check the username spelling

2. **Test account creation fails**
   - Check Firebase Auth permissions
   - Verify email domain configuration
   - Check for rate limiting

3. **Pairing creation fails**
   - Verify Firestore permissions
   - Check for duplicate pairings
   - Ensure both users exist

### Debug Logging

Enable debug logging to see detailed auto-pairing flow:

```typescript
logger.debug('Auto-pairing debug messages...');
```

## Security Considerations

- Test accounts use a known password for development convenience
- Email domain is configured to avoid conflicts with real users
- Test accounts are clearly marked in the system
- Auto-pairing doesn't expose sensitive user information

This feature significantly improves the new user experience by ensuring immediate app usability while maintaining the core pairing functionality of the BNOC app. 