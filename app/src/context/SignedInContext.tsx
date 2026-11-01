import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export interface SignedInUser {
  id: string
  email: string
  name: string
}

interface SignedInContextValue {
  signedInUser: SignedInUser | null
  setSignedInUser: (user: SignedInUser | null) => void
}

const SignedInContext = createContext<SignedInContextValue | undefined>(
  undefined,
)

export function SignedInProvider({ children }: { children: ReactNode }) {
  const [signedInUser, setSignedInUser] = useState<SignedInUser | null>(null)

  return (
    <SignedInContext.Provider value={{ signedInUser, setSignedInUser }}>
      {children}
    </SignedInContext.Provider>
  )
}

export function useSignedIn(): SignedInContextValue {
  const context = useContext(SignedInContext)
  if (context === undefined) {
    throw new Error('useSignedIn must be used within a SignedInProvider')
  }
  return context
}
