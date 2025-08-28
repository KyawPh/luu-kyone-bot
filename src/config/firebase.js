require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  // Use environment variables in production
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL
  };
} else {
  // Use service account file in development
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(__dirname, '../../firebase-service-account.json');
  const absolutePath = path.resolve(serviceAccountPath);
  serviceAccount = require(absolutePath);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

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