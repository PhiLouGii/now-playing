import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error(
    'FIREBASE_PROJECT_ID is not defined',
  )
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error(
    'FIREBASE_CLIENT_EMAIL is not defined',
  )
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'FIREBASE_PRIVATE_KEY is not defined',
  )
}

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId:
            process.env.FIREBASE_PROJECT_ID,
          clientEmail:
            process.env.FIREBASE_CLIENT_EMAIL,
          privateKey:
            process.env.FIREBASE_PRIVATE_KEY.replace(
              /\\n/g,
              '\n',
            ),
        }),
      })
    : getApps()[0]

export const db =
  getFirestore(firebaseApp)