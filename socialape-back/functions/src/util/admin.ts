import * as admin from "firebase-admin";
import { firebaseConfig } from './firebaseConfig';

admin.initializeApp(firebaseConfig);

export const db = admin.firestore();
export default admin;