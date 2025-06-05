const admin = require('firebase-admin');

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

async function checkPhotoSubmissions() {
  console.log('=== Photo Submissions in Incomplete Pairings ===\n');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await db.collection('pairings')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();
    
    const incompletePairings = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(pairing => 
        ['pending', 'user1_submitted', 'user2_submitted'].includes(pairing.status)
      );
    
    console.log(`📋 Found ${incompletePairings.length} incomplete pairings today`);
    console.log(`📋 Total pairings today: ${snapshot.size}\n`);
    
    const usersWithPhotos = [];
    const usersWaiting = [];
    
    for (const pairing of incompletePairings) {
      const user1HasPhoto = !!pairing.user1_photoURL;
      const user2HasPhoto = !!pairing.user2_photoURL;
      
      console.log(`🔍 Pairing ${pairing.id.substring(0, 8)}... (${pairing.status})`);
      console.log(`   User1: ${user1HasPhoto ? 'HAS_PHOTO ✅' : 'NO_PHOTO ⏳'}`);
      console.log(`   User2: ${user2HasPhoto ? 'HAS_PHOTO ✅' : 'NO_PHOTO ⏳'}`);
      
      if (user1HasPhoto && !user2HasPhoto) {
        usersWithPhotos.push({
          userId: pairing.user1_id,
          pairingId: pairing.id,
          waitingFor: pairing.user2_id
        });
      } else if (user2HasPhoto && !user1HasPhoto) {
        usersWithPhotos.push({
          userId: pairing.user2_id,
          pairingId: pairing.id,
          waitingFor: pairing.user1_id
        });
      } else if (!user1HasPhoto && !user2HasPhoto) {
        usersWaiting.push({
          pairingId: pairing.id,
          user1: pairing.user1_id,
          user2: pairing.user2_id
        });
      }
      console.log('');
    }
    
    console.log(`\n📸 USERS WITH PHOTOS WAITING FOR PARTNERS: ${usersWithPhotos.length}`);
    for (const user of usersWithPhotos) {
      console.log(`   🔄 User ${user.userId.substring(0, 8)} waiting for ${user.waitingFor.substring(0, 8)} in pairing ${user.pairingId.substring(0, 8)}`);
    }
    
    console.log(`\n⏳ PAIRINGS WITH NO PHOTOS YET: ${usersWaiting.length}`);
    for (const pairing of usersWaiting) {
      console.log(`   ⌛ Pairing ${pairing.pairingId.substring(0, 8)}: ${pairing.user1.substring(0, 8)} + ${pairing.user2.substring(0, 8)}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking photo submissions:', error);
  }
}

checkPhotoSubmissions().then(() => process.exit(0)); 