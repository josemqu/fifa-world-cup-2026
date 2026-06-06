import { adminAuth } from "@/lib/firebase-admin";

/**
 * Extracts and verifies the Firebase ID token from the Authorization header.
 * Returns the decoded token if valid, otherwise returns null.
 */
export async function verifyAuthToken(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return null;
  }
}
