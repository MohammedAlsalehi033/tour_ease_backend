// Import the entire SDK as an 'admin' object
import * as admin from 'firebase-admin';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require("../services/firebasecrd.json");

// Initialize the app using the admin object
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tourease-544c3-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// Access services from the admin object
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const messaging = admin.messaging();

// Now 'admin' is a defined object that can be exported
export default {
  admin,
  db,
  auth,
  storage,
  messaging
};