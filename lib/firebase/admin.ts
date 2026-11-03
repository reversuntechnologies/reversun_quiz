import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getDatabase, Database } from "firebase-admin/database";
import { getStorage, Storage } from "firebase-admin/storage";

interface DecodedTokenPayload {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

function initializeFirebaseAdmin(): App | null {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL,
        storageBucket,
      });
    } catch (e) {
      console.error("Firebase Admin cert initialization error:", e);
    }
  }

  if (projectId) {
    try {
      return initializeApp({
        projectId,
        databaseURL,
        storageBucket,
      });
    } catch (e) {
      console.error("Firebase Admin project initialization error:", e);
    }
  }

  return null;
}

export function getAdminApp(): App | null {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0]!;
  }
  return initializeFirebaseAdmin();
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export const adminApp: App | null = getAdminApp();
export const adminAuth: Auth | null = getAdminAuth();

export function getAdminDb(): Database | null {
  try {
    const app = getAdminApp();
    return app ? getDatabase(app) : null;
  } catch {
    return null;
  }
}

export function getAdminStorage(): Storage | null {
  try {
    const app = getAdminApp();
    return app ? getStorage(app) : null;
  } catch {
    return null;
  }
}

/**
 * Verify Firebase ID Token passed in Authorization header.
 * Reads solely from configured environment credentials.
 */
export async function verifyFirebaseIdToken(token: string): Promise<DecodedTokenPayload> {
  const authInstance = getAdminAuth();

  if (!authInstance) {
    if (process.env.NODE_ENV === "development" && token.startsWith("dev-token-")) {
      const mockUid = token.replace("dev-token-", "");
      return {
        uid: mockUid,
        email: `${mockUid}@reversun.dev`,
        name: mockUid.charAt(0).toUpperCase() + mockUid.slice(1),
      };
    }
    throw new Error("Firebase Admin SDK is not initialized. Ensure environment variables are set in .env.local");
  }

  try {
    const decoded = await authInstance.verifyIdToken(token);
    return {
      ...decoded,
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (err: unknown) {
    if (process.env.NODE_ENV === "development" && token.startsWith("dev-token-")) {
      const mockUid = token.replace("dev-token-", "");
      return {
        uid: mockUid,
        email: `${mockUid}@reversun.dev`,
        name: mockUid.charAt(0).toUpperCase() + mockUid.slice(1),
      };
    }
    throw err;
  }
}
