import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Detect if we have real configured keys or a fallback mock environment
export const isMockFirebase = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey.includes('mock_api') || 
  firebaseConfig.projectId.includes('mock-ecom');

let app;
let db: any;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  // The app will break without this explicit line in production according to skill constraints
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization skipped or failed. Falling back to secure in-browser simulation.', error);
  db = null;
  auth = null;
}

export { db, auth };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Custom robust Firebase error handler as requested by Firestore Security guidelines.
 * Wraps insufficient-permissions errors to help diagnose security policy failures.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth || { currentUser: null };
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth.currentUser?.uid || null,
      email: currentAuth.currentUser?.email || null,
      emailVerified: currentAuth.currentUser?.emailVerified || null,
      isAnonymous: currentAuth.currentUser?.isAnonymous || null,
      tenantId: currentAuth.currentUser?.tenantId || null,
      providerInfo: currentAuth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Encoded Payload: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Auth provider helper
export const googleProvider = new GoogleAuthProvider();
