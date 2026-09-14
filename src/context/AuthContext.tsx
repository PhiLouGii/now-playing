import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

import {
  doc,
  getDoc,
} from 'firebase/firestore'

import { auth, firestore } from '../config/firebase'

interface UserProfile {
  username: string
  displayName: string
  createdAt?: unknown
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  )

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null)

  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser)

          if (currentUser) {
            try {
              const userRef = doc(
                firestore,
                'users',
                currentUser.uid,
              )

              const userSnapshot =
                await getDoc(userRef)

              if (userSnapshot.exists()) {
                setProfile(
                  userSnapshot.data() as UserProfile,
                )
              } else {
                setProfile(null)
              }
            } catch (error) {
              console.error(
                'Failed to load user profile:',
                error,
              )

              setProfile(null)
            }
          } else {
            setProfile(null)
          }

          setLoading(false)
        },
      )

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}
