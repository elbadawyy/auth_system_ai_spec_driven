import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../api/users'
import {
  clearAuthStorage,
  readAuthSession,
  saveAuthSession,
} from '../auth/auth-storage'
import { isAccessTokenValid } from '../auth/jwt'

export type SignedInUser = AuthUser

interface SignInInput {
  accessToken: string
  user: AuthUser
}

interface SignedInContextValue {
  signedInUser: SignedInUser | null
  accessToken: string | null
  isAuthenticated: boolean
  signIn: (input: SignInInput) => void
  updateSignedInUser: (user: AuthUser) => void
  signOut: () => void
}

const SignedInContext = createContext<SignedInContextValue | undefined>(
  undefined,
)

export function SignedInProvider({ children }: { children: ReactNode }) {
  const initial = readAuthSession()
  const [signedInUser, setSignedInUser] = useState<SignedInUser | null>(
    initial?.user ?? null,
  )
  const [accessToken, setAccessToken] = useState<string | null>(
    initial?.accessToken ?? null,
  )

  const isAuthenticated =
    accessToken !== null &&
    signedInUser !== null &&
    isAccessTokenValid(accessToken)

  const signIn = useCallback((input: SignInInput): void => {
    saveAuthSession(input)
    setAccessToken(input.accessToken)
    setSignedInUser(input.user)
  }, [])

  const updateSignedInUser = useCallback((user: AuthUser): void => {
    setAccessToken((currentToken) => {
      if (currentToken === null || !isAccessTokenValid(currentToken)) {
        return currentToken
      }
      saveAuthSession({ accessToken: currentToken, user })
      setSignedInUser(user)
      return currentToken
    })
  }, [])

  const signOut = useCallback((): void => {
    clearAuthStorage()
    setAccessToken(null)
    setSignedInUser(null)
  }, [])

  const value: SignedInContextValue = {
    signedInUser: isAuthenticated ? signedInUser : null,
    accessToken: isAuthenticated ? accessToken : null,
    isAuthenticated,
    signIn,
    updateSignedInUser,
    signOut,
  }

  return (
    <SignedInContext.Provider value={value}>{children}</SignedInContext.Provider>
  )
}

export function useSignedIn(): SignedInContextValue {
  const context = useContext(SignedInContext)
  if (context === undefined) {
    throw new Error('useSignedIn must be used within a SignedInProvider')
  }
  return context
}
