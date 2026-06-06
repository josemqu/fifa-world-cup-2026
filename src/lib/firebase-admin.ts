import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      console.warn("Firebase Admin environment variables are missing. Initialization skipped.");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

// Use a Proxy to lazily initialize and retrieve admin.auth()
// to prevent crash at module load time during Next.js build / static page collection.
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(target, prop, receiver) {
    if (!admin.apps.length) {
      throw new Error("Firebase Admin SDK was not initialized. Check your environment variables.");
    }
    const authInstance = admin.auth();
    const value = Reflect.get(authInstance, prop);
    if (typeof value === "function") {
      return value.bind(authInstance);
    }
    return value;
  }
});
