require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../../firebase-service-account.json');

const absolutePath = path.resolve(serviceAccountPath);
const serviceAccount = require(absolutePath);

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