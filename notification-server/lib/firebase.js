// ============================================================
// Eventra Notification Server — Firebase Admin SDK Initialization
// ============================================================
// Uses the Admin SDK (server-side) to access RTDB and send FCM
// messages. Does NOT duplicate the frontend Firebase client.
// ============================================================

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Parse or locate the Firebase service account from multiple possible sources:
 * 1. Local serviceAccountKey.json file (auto-detected in notification-server/ or project root)
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS (file path)
 * 3. FIREBASE_SERVICE_ACCOUNT env var (JSON string or Base64 string)
 * 4. Individual env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 */
function getServiceAccount() {
  // 1. Check for local json files in notification-server folder or workspace
  const localCandidates = [
    path.join(__dirname, '..', 'serviceAccountKey.json'),
    path.join(__dirname, '..', 'service-account.json'),
    path.join(__dirname, '..', 'firebase-service-account.json'),
    path.join(process.cwd(), 'serviceAccountKey.json'),
    path.join(process.cwd(), 'service-account.json'),
  ];

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      try {
        const fileContent = fs.readFileSync(candidate, 'utf8');
        console.log(`[Firebase] Loaded credentials from local file: ${path.basename(candidate)}`);
        return JSON.parse(fileContent);
      } catch (err) {
        console.warn(`[Firebase] Found ${candidate} but failed to parse:`, err.message);
      }
    }
  }

  // 2. Custom path from env
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && fs.existsSync(envPath)) {
    try {
      const fileContent = fs.readFileSync(envPath, 'utf8');
      console.log(`[Firebase] Loaded credentials from path: ${envPath}`);
      return JSON.parse(fileContent);
    } catch (err) {
      console.error(`[Firebase] Failed to read credentials from ${envPath}:`, err.message);
    }
  }

  // 3. Stringified JSON or Base64 in FIREBASE_SERVICE_ACCOUNT
  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (rawEnv) {
    let cleanStr = rawEnv.trim();
    // Strip wrapping single or double quotes if present from .env
    if ((cleanStr.startsWith("'") && cleanStr.endsWith("'")) || (cleanStr.startsWith('"') && cleanStr.endsWith('"'))) {
      cleanStr = cleanStr.slice(1, -1).trim();
    }

    // Try direct JSON parse
    try {
      return JSON.parse(cleanStr);
    } catch (_) {
      // Try Base64 decode
      try {
        const decoded = Buffer.from(cleanStr, 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch (err) {
        console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT (neither JSON nor Base64):', err.message);
      }
    }
  }

  // 4. Individual env variables
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };
  }

  console.error('\n============================================================');
  console.error('[Firebase] ERROR: No Firebase Admin credentials found!');
  console.error('To fix this, provide credentials using ANY of these methods:');
  console.error('  1. Place `serviceAccountKey.json` inside notification-server/');
  console.error('  2. Set FIREBASE_SERVICE_ACCOUNT in .env (single-quoted JSON string or Base64)');
  console.error('  3. Set FIREBASE_SERVICE_ACCOUNT_PATH=./path-to-key.json in .env');
  console.error('  4. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env');
  console.error('============================================================\n');
  process.exit(1);
}

const serviceAccount = getServiceAccount();

const appConfig = {
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://eventra4123-default-rtdb.asia-southeast1.firebasedatabase.app/',
  credential: admin.credential.cert(serviceAccount),
};

admin.initializeApp(appConfig);

const db = admin.database();
const messaging = admin.messaging();

console.log('[Firebase] Admin SDK initialized successfully.');
console.log('[Firebase] Database URL:', appConfig.databaseURL);

module.exports = { admin, db, messaging };
