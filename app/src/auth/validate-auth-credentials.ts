import { UiMessage } from '../enums/ui-message.enum'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_HAS_LETTER = /[A-Za-z]/
const PASSWORD_HAS_DIGIT = /\d/
const PASSWORD_HAS_SPECIAL = /[^A-Za-z0-9]/
const PASSWORD_MIN_LENGTH = 8

export interface AuthCredentialFieldErrors {
  email?: string
  password?: string
}

export function validateAuthCredentials(input: {
  email: string
  password: string
}): AuthCredentialFieldErrors {
  const errors: AuthCredentialFieldErrors = {}

  if (!input.email) {
    errors.email = UiMessage.EMAIL_REQUIRED
  } else if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = UiMessage.EMAIL_INVALID
  }

  if (!input.password) {
    errors.password = UiMessage.PASSWORD_REQUIRED
  } else if (input.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = UiMessage.PASSWORD_TOO_SHORT
  } else if (!PASSWORD_HAS_LETTER.test(input.password)) {
    errors.password = UiMessage.PASSWORD_NEEDS_LETTER
  } else if (!PASSWORD_HAS_DIGIT.test(input.password)) {
    errors.password = UiMessage.PASSWORD_NEEDS_DIGIT
  } else if (!PASSWORD_HAS_SPECIAL.test(input.password)) {
    errors.password = UiMessage.PASSWORD_NEEDS_SPECIAL
  }

  return errors
}
