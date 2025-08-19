// This is your secure serverless function for logging out.
// No changes were needed here, as it correctly deletes the session.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
  });
}

const db = getFirestore();

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { passcode } = request.body;

        if (!passcode) {
            return response.status(400).json({ message: 'Passcode is required.' });
        }

        // Delete the session document from Firestore to free up the passcode
        const sessionRef = db.collection('sessions').doc(passcode);
        await sessionRef.delete();

        console.log(`Logout successful for passcode: ${passcode}`);
        return response.status(200).json({ message: 'Logout successful' });

    } catch (error) {
        console.error('Error during logout:', error);
        return response.status(500).json({ message: 'An internal server error occurred.' });
    }
}
