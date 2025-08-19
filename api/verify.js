// This is your secure serverless function.
// It now connects to Google Firestore to manage sessions with a 15-minute timeout.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK only if it hasn't been already.
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

const db = getFirestore();
const SESSION_DURATION_MINUTES = 10; // The session will expire after 10 minutes

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { passcode } = request.body;

        if (!passcode) {
            console.log('Login failed: No passcode provided.');
            return response.status(400).json({ message: 'Passcode is required.' });
        }

        // 1. Check if the passcode is valid
        const passcodeRef = db.collection('passcodes').doc(passcode);
        const passcodeDoc = await passcodeRef.get();

        if (!passcodeDoc.exists) {
            console.log(`Login failed: Invalid passcode entered - ${passcode}`);
            return response.status(401).json({ message: 'Invalid passcode' });
        }

        // 2. Check for an existing session
        const sessionRef = db.collection('sessions').doc(passcode);
        const sessionDoc = await sessionRef.get();
        const now = new Date();

        if (sessionDoc.exists) {
            const sessionData = sessionDoc.data();
            const expiresAt = new Date(sessionData.expiresAt);

            // Check if the session has expired
            if (now > expiresAt) {
                console.log(`Passcode ${passcode} had an expired session. Creating a new one.`);
                // The old session is expired, so we'll allow a new login by overwriting it.
            } else {
                // The session is still active
                console.log(`Login failed: Passcode ${passcode} is already in use and session is active.`);
                return response.status(409).json({ message: 'This passcode is already in use.' });
            }
        }
        
        // 3. Create a new session or overwrite the expired one
        const expirationDate = new Date(now.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);
        
        await sessionRef.set({
            loggedInAt: now.toISOString(),
            expiresAt: expirationDate.toISOString(), // Set the expiration time
        });

        console.log(`Login successful for passcode: ${passcode}. Session expires at ${expirationDate.toISOString()}`);
        return response.status(200).json({ message: 'Login successful' });

    } catch (error) {
        console.error('Critical error in verify function:', error);
        return response.status(500).json({ message: 'An internal server error occurred.' });
    }
}
