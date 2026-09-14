import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth'

import {
  doc,
  getDoc,
} from 'firebase/firestore'

import {
  auth,
  firestore,
} from '../config/firebase'

interface UserProfile {
  username: string
  displayName: string
  email?: string
  createdAt?: unknown
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  logout: () => Promise<void>
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
          console.log(
            'AUTH STATE:',
            currentUser
              ? `Logged in as ${currentUser.email}`
              : 'Logged out',
          )

          setUser(currentUser)

          if (!currentUser) {
            setProfile(null)
            setLoading(false)
            return
          }

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

              console.warn(
                'No Firestore profile found for user:',
                currentUser.uid,
              )
            }
          } catch (error) {
            console.error(
              'Failed to load user profile:',
              error,
            )

            setProfile(null)
          } finally {
            setLoading(false)
          }
        },
      )

    return unsubscribe
  }, [])

  async function logout() {
    try {
      await signOut(auth)

      console.log('LOGOUT SUCCESS')
    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error,
      )

      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
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
