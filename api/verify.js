// This is your secure serverless function.
// It now connects to Google Firestore to manage sessions.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK only if it hasn't been already.
// This prevents errors in the serverless environment.
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

export default async function handler(request, response) {
    // Ensure this function only handles POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { passcode } = request.body;
        console.log(`Received login attempt with passcode: ${passcode}`);

        if (!passcode) {
            console.log('Login failed: No passcode provided.');
            return response.status(400).json({ message: 'Passcode is required.' });
        }

        // 1. Check if the passcode exists in the 'passcodes' collection
        const passcodeRef = db.collection('passcodes').doc(passcode);
        const passcodeDoc = await passcodeRef.get();

        if (!passcodeDoc.exists) {
            console.log(`Login failed: Invalid passcode entered - ${passcode}`);
            return response.status(401).json({ message: 'Invalid passcode' });
        }

        // 2. Check if the passcode is already in use in the 'sessions' collection
        const sessionRef = db.collection('sessions').doc(passcode);
        const sessionDoc = await sessionRef.get();

        if (sessionDoc.exists) {
            console.log(`Login failed: Passcode ${passcode} is already in use.`);
            return response.status(409).json({ message: 'This passcode is already in use.' });
        } else {
            // Passcode is valid and not in use, create a new session
            await sessionRef.set({
                loggedInAt: new Date().toISOString(),
            });
            console.log(`Login successful for passcode: ${passcode}`);
            return response.status(200).json({ message: 'Login successful' });
        }

    } catch (error) {
        console.error('Critical error in verify function:', error);
        return response.status(500).json({ message: 'An internal server error occurred.' });
    }
}