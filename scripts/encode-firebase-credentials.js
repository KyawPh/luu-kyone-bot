#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to your firebase service account JSON file
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ firebase-service-account.json not found at:', serviceAccountPath);
  process.exit(1);
}

// Read the file
const serviceAccount = fs.readFileSync(serviceAccountPath, 'utf8');

// Convert to Base64
const base64Encoded = Buffer.from(serviceAccount).toString('base64');

console.log('✅ Base64 Encoded Firebase Credentials:');
console.log('=====================================');
console.log(base64Encoded);
console.log('=====================================');
console.log('\n📋 Instructions:');
console.log('1. Copy the Base64 string above');
console.log('2. In Railway, create a new environment variable:');
console.log('   Name: FIREBASE_CREDENTIALS_BASE64');
console.log('   Value: [paste the Base64 string]');
console.log('3. Remove the old Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.)');
console.log('\n✨ This is the cleanest way to handle Firebase credentials in production!');