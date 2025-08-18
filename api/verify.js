// This is your secure serverless function.
// Vercel will run this code on its servers, never exposing it to the user's browser.

export default function handler(request, response) {
    // Ensure this function only handles POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // CORRECTLY get the company name and passcode from the request body
        const { companyName, passcode } = request.body;

        // 1. Define the correct company name (case-insensitive check)
        const validCompanyName = "Total Wireless";

        // 2. Define the secure list of valid passcodes
        const validPasscodes = new Set([
            "8k2Jp!v9", "mFv4w#q7", "sL9g@z1X", "pW5h&e3R", "aZ1x*c2V", 
            "bN6m$q7W", "eR4t%y5U", "iO2p&a3S", "dF7g!h8J", "kL1z@x9C"
        ]);

        // 3. Check if the provided credentials are valid
        if (companyName && companyName.toLowerCase() === validCompanyName.toLowerCase() && validPasscodes.has(passcode)) {
            // If valid, send a success response
            response.status(200).json({ message: 'Login successful' });
        } else {
            // If invalid, send an error response
            response.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        // If there's any other error, send a server error response
        response.status(500).json({ message: 'An internal server error occurred.' });
    }
}
