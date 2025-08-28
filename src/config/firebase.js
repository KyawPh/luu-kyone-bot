require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  console.log('🔧 Setting up Firebase in production mode...');
  
  // Use environment variables in production
  // Option 1: Use full service account JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('📄 Using FIREBASE_SERVICE_ACCOUNT environment variable');
    // If full service account JSON is provided as a single env var
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ Parsed service account JSON successfully');
    } catch (error) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON: ' + error.message);
    }
  } else {
    console.log('🔑 Using individual Firebase environment variables');
    
    // Check which variables are present
    console.log('Environment check:');
    console.log('  FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
    console.log('  FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
    console.log('  FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? `✅ Set (${process.env.FIREBASE_PRIVATE_KEY.substring(0, 50)}...)` : '❌ Missing');
    
    // Use individual variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('Missing required Firebase environment variables');
    }
    
    // Handle different private key formats
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    console.log('🔐 Processing private key...');
    console.log('  Key starts with:', privateKey.substring(0, 30));
    console.log('  Contains \\n:', privateKey.includes('\\n') ? 'Yes' : 'No');
    
    // If the key is JSON-escaped (has literal \n), replace them with actual newlines
    if (privateKey.includes('\\n')) {
      console.log('  Converting \\n to actual newlines...');
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Ensure proper formatting
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ Private key does not have proper BEGIN marker');
      console.error('  Key preview:', privateKey.substring(0, 100));
      throw new Error('Invalid Firebase private key format');
    }
    
    console.log('  ✅ Private key format validated');
    
    // Build complete service account object with all required fields
    serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '6092ddea0d36f9eef99ea1442bc8677f639e11c2',
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || '100510443195350436637',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
      universe_domain: 'googleapis.com'
    };
    
    console.log('📋 Service account object created:');
    console.log('  Project ID:', serviceAccount.project_id);
    console.log('  Client Email:', serviceAccount.client_email);
    console.log('  Private Key ID:', serviceAccount.private_key_id);
  }
} else {
  // Use service account file in development
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(__dirname, '../../firebase-service-account.json');
  const absolutePath = path.resolve(serviceAccountPath);
  serviceAccount = require(absolutePath);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
  console.log('✅ Firebase initialized successfully');
  console.log(`📁 Project ID: ${serviceAccount.project_id}`);
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  throw error;
}

const db = admin.firestore();
const storage = admin.storage();

// Collections
const collections = {
  users: db.collection('users'),
  travelPlans: db.collection('travelPlans'),
  favorRequests: db.collection('favorRequests'),
  connections: db.collection('connections'),
  premiumMembers: db.collection('premiumMembers'),
  premiumPosts: db.collection('premiumPosts')
};

module.exports = {
  admin,
  db,
  storage,
  collections,
  FieldValue: admin.firestore.FieldValue
};