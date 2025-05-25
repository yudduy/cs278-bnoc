const admin = require('firebase-admin');

// Quick debug script to check current user state

try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function debugCurrentState() {
  console.log('🔍 DEBUGGING CURRENT STATE');
  console.log('=' .repeat(40));
  
  // Check Firestore users
  console.log('\n👤 FIRESTORE USERS:');
  const usersSnapshot = await db.collection('users').get();
  console.log(`Found ${usersSnapshot.size} users in Firestore:`);
  
  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`  - ID: ${doc.id} | Email: ${data.email} | Username: ${data.username}`);
  });
  
  // Check Firebase Auth users
  console.log('\n🔐 FIREBASE AUTH USERS:');
  const authUsers = await auth.listUsers(100);
  console.log(`Found ${authUsers.users.length} users in Firebase Auth:`);
  
  authUsers.users.forEach(user => {
    console.log(`  - UID: ${user.uid} | Email: ${user.email} | Created: ${user.metadata.creationTime}`);
  });
  
  // Check for mismatches
  console.log('\n🔄 CHECKING FOR ISSUES:');
  
  const firestoreUserIds = usersSnapshot.docs.map(doc => doc.id);
  const authUserIds = authUsers.users.map(user => user.uid);
  
  const firestoreOnly = firestoreUserIds.filter(id => !authUserIds.includes(id));
  const authOnly = authUserIds.filter(id => !firestoreUserIds.includes(id));
  
  if (firestoreOnly.length > 0) {
    console.log(`❌ Users in Firestore but NOT in Auth: ${firestoreOnly.join(', ')}`);
  }
  
  if (authOnly.length > 0) {
    console.log(`⚠️  Users in Auth but NOT in Firestore: ${authOnly.join(', ')}`);
  }
  
  if (firestoreOnly.length === 0 && authOnly.length === 0) {
    console.log('✅ All users properly synced between Auth and Firestore');
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`Firestore users: ${usersSnapshot.size}`);
  console.log(`Firebase Auth users: ${authUsers.users.length}`);
  console.log(`Issues found: ${firestoreOnly.length + authOnly.length}`);
}

debugCurrentState().then(() => {
  console.log('\n🎯 Debug complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
