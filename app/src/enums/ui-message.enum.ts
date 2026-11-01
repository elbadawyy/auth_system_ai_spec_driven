export const UiMessage = {
  SERVICE_UNAVAILABLE:
    'Service temporarily unavailable. Please try again later.',
  EMAIL_REQUIRED: 'Email is required.',
  EMAIL_INVALID: 'Enter a valid email address.',
  NAME_REQUIRED: 'Name is required.',
  NAME_TOO_SHORT: 'Name must be at least 3 characters.',
  PASSWORD_REQUIRED: 'Password is required.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
  PASSWORD_NEEDS_LETTER: 'Password must contain at least one letter.',
  PASSWORD_NEEDS_DIGIT: 'Password must contain at least one digit.',
  PASSWORD_NEEDS_SPECIAL:
    'Password must contain at least one special character.',
  SIGNUP_GENERIC_ERROR: 'Could not create your account. Please try again.',
  SIGNUP_DUPLICATE_EMAIL: 'An account with this email already exists.',
  PROFILE_SIGNED_IN: 'You are signed in.',
  PROFILE_NOT_SIGNED_IN: 'You are not signed in.',
} as const

export type UiMessage = (typeof UiMessage)[keyof typeof UiMessage]
