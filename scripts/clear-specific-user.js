#!/usr/bin/env node

/**
 * Script to clear data for a specific user
 * Run with: node scripts/clear-specific-user.js <userId>
 * Example: node scripts/clear-specific-user.js 123456789
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID');
  console.log('\nUsage:');
  console.log('  node scripts/clear-specific-user.js <userId>');
  console.log('\nExample:');
  console.log('  node scripts/clear-specific-user.js 123456789');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../firebase-service-account.json');

try {
  const absolutePath = path.resolve(serviceAccountPath);
  const serviceAccount = require(absolutePath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function clearUserData() {
  console.log(`🧹 Clearing data for user: ${userId}`);
  console.log('================================\n');
  
  try {
    const batch = db.batch();
    let totalDeleted = 0;
    
    // Delete user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      batch.delete(userRef);
      console.log('✅ User profile found and marked for deletion');
      totalDeleted++;
    } else {
      console.log('📭 User profile not found');
    }
    
    // Delete user's travel plans
    const travelPlans = await db.collection('travelPlans')
      .where('userId', '==', userId)
      .get();
    
    console.log(`\n✈️ Found ${travelPlans.size} travel plans`);
    travelPlans.forEach(doc => {
      batch.delete(doc.ref);
      totalDeleted++;
    });
    
    // Delete user's favor requests
    const favorRequests = await db.collection('favorRequests')
      .where('userId', '==', userId)
      .get();
    
    console.log(`📦 Found ${favorRequests.size} favor requests`);
    favorRequests.forEach(doc => {
      batch.delete(doc.ref);
      totalDeleted++;
    });
    
    // Commit the batch delete
    if (totalDeleted > 0) {
      await batch.commit();
      console.log('\n================================');
      console.log(`✅ Successfully deleted ${totalDeleted} documents for user ${userId}`);
    } else {
      console.log('\n================================');
      console.log('📭 No data found for this user');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing user data:', error);
    process.exit(1);
  }
}

// Confirm and run
console.log('⚠️  WARNING: This will permanently delete all data for this user!');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  clearUserData();
}, 3000);