import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

const {
  VITE_FIREBASE_API_KEY: apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: authDomain,
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  VITE_FIREBASE_APP_ID: appId,
} = import.meta.env

if (!apiKey || !projectId) {
  throw new Error('Firebase env vars missing — check .env')
}

const app = initializeApp({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId })

export const auth      = getAuth(app)
export const db        = initializeFirestore(app, { localCache: persistentLocalCache() })
export const functions = getFunctions(app)
