require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
let serviceAccount;

// Option 1: Use Base64 encoded credentials (best for Railway/production)
if (process.env.FIREBASE_CREDENTIALS_BASE64) {
  try {
    const base64String = process.env.FIREBASE_CREDENTIALS_BASE64;
    const credentialsJson = Buffer.from(base64String, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(credentialsJson);
  } catch (error) {
    throw new Error(`Failed to decode Firebase credentials from Base64: ${error.message}`);
  }
}
// Option 2: Use service account file path (for local development)
else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || fs.existsSync(path.join(__dirname, '../../firebase-service-account.json'))) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(__dirname, '../../firebase-service-account.json');
  const absolutePath = path.resolve(serviceAccountPath);
  
  if (fs.existsSync(absolutePath)) {
    serviceAccount = require(absolutePath);
  } else {
    throw new Error(`Firebase service account file not found at: ${absolutePath}`);
  }
}
// Option 3: Use individual environment variables
else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  // Handle private key format
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  // Replace literal \n with actual newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    // These are optional but helpful
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_EMAIL 
      ? `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
      : undefined,
    universe_domain: 'googleapis.com'
  };
} else {
  throw new Error(
    'Firebase credentials not found. Set one of:\n' +
    '  - FIREBASE_CREDENTIALS_BASE64 (recommended for production)\n' +
    '  - FIREBASE_SERVICE_ACCOUNT_PATH or place firebase-service-account.json in project root\n' +
    '  - Individual FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL variables'
  );
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
} catch (error) {
  throw new Error(`Failed to initialize Firebase: ${error.message}`);
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