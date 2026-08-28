import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export enum OperationType {
  GET = 'get',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export interface FirestoreErrorInfo {
  operation: OperationType;
  path: string | null;
  message: string;
  code?: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    operation: operationType,
    path,
    message: error instanceof Error ? error.message : 'Unknown Firestore error',
    code: error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : undefined,
  };

  console.error('[FIRESTORE]', errInfo);
}

const firebaseConfig = {
  apiKey: "AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8",
  authDomain: "medlink-android-app.firebaseapp.com",
  projectId: "medlink-android-app",
  storageBucket: "medlink-android-app.firebasestorage.app",
  messagingSenderId: "245661959118",
  appId: "1:245661959118:web:204dc8d047e80b36af219f",
  measurementId: "G-W238D0TGTM"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;