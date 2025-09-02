#!/usr/bin/env node

/**
 * Script to clear test data from Firebase Firestore
 * Run with: node scripts/clear-test-data.js
 * 
 * Options:
 * --all : Clear all collections
 * --users : Clear only users
 * --posts : Clear only posts (travel plans and favor requests)
 * --connections : Clear only connections
 * --dry-run : Show what would be deleted without actually deleting
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const clearAll = args.includes('--all');
const clearUsers = args.includes('--users') || clearAll;
const clearPosts = args.includes('--posts') || clearAll;

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

// Helper function to delete all documents in a collection
async function clearCollection(collectionName) {
  const collection = db.collection(collectionName);
  const snapshot = await collection.get();
  
  if (snapshot.empty) {
    console.log(`📭 ${collectionName}: No documents to delete`);
    return 0;
  }
  
  const batch = db.batch();
  let count = 0;
  
  snapshot.forEach(doc => {
    if (!dryRun) {
      batch.delete(doc.ref);
    }
    count++;
  });
  
  if (!dryRun) {
    await batch.commit();
    console.log(`✅ ${collectionName}: Deleted ${count} documents`);
  } else {
    console.log(`🔍 ${collectionName}: Would delete ${count} documents (dry-run)`);
  }
  
  return count;
}

// Main function
async function clearTestData() {
  console.log('🧹 Clearing Firebase Test Data');
  console.log('================================');
  
  if (dryRun) {
    console.log('📝 DRY RUN MODE - No data will be deleted\n');
  }
  
  if (!clearUsers && !clearPosts) {
    console.log('❌ No collections specified!');
    console.log('\nUsage:');
    console.log('  node scripts/clear-test-data.js [options]');
    console.log('\nOptions:');
    console.log('  --all         Clear all collections');
    console.log('  --users       Clear users collection');
    console.log('  --posts       Clear travel plans and favor requests');
    console.log('  --dry-run     Show what would be deleted without deleting');
    process.exit(1);
  }
  
  let totalDeleted = 0;
  
  try {
    if (clearUsers) {
      console.log('\n📋 Users Collection:');
      totalDeleted += await clearCollection('users');
    }
    
    if (clearPosts) {
      console.log('\n✈️ Travel Plans:');
      totalDeleted += await clearCollection('travelPlans');
      
      console.log('\n📦 Favor Requests:');
      totalDeleted += await clearCollection('favorRequests');
    }
    
    // Also clear premium collections if they exist
    if (clearAll) {
      console.log('\n💎 Premium Members:');
      totalDeleted += await clearCollection('premiumMembers');
      
      console.log('\n💎 Premium Posts:');
      totalDeleted += await clearCollection('premiumPosts');
    }
    
    console.log('\n================================');
    if (!dryRun) {
      console.log(`✅ Successfully deleted ${totalDeleted} documents total`);
    } else {
      console.log(`📊 Would delete ${totalDeleted} documents total (dry-run)`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing data:', error);
    process.exit(1);
  }
}

// Show confirmation prompt for production safety
async function confirmDeletion() {
  if (dryRun) {
    return clearTestData();
  }
  
  console.log('⚠️  WARNING: This will permanently delete data!');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  setTimeout(() => {
    clearTestData();
  }, 3000);
}

// Run the script
confirmDeletion();