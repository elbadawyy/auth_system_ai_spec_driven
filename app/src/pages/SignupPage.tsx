import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { signupUser } from '../api/users'
import { useSignedIn } from '../context/SignedInContext'
import { UiLabel } from '../enums/ui-label.enum'
import { UiMessage } from '../enums/ui-message.enum'
import './SignupPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_HAS_LETTER = /[A-Za-z]/
const PASSWORD_HAS_DIGIT = /\d/
const PASSWORD_HAS_SPECIAL = /[^A-Za-z0-9]/
const HTTP_CONFLICT = 409

interface FieldErrors {
  email?: string
  name?: string
  password?: string
}

function validateSignupFields(input: {
  email: string
  name: string
  password: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!input.email) {
    errors.email = UiMessage.EMAIL_REQUIRED
  } else if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = UiMessage.EMAIL_INVALID
  }

  if (!input.name) {
    errors.name = UiMessage.NAME_REQUIRED
  } else if (input.name.length < 3) {
    errors.name = UiMessage.NAME_TOO_SHORT
  }

  if (!input.password) {
    errors.password = UiMessage.PASSWORD_REQUIRED
  } else if (input.password.length < 8) {
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

function formatApiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.statusCode === HTTP_CONFLICT) {
      return UiMessage.SIGNUP_DUPLICATE_EMAIL
    }
    if (Array.isArray(error.messages)) {
      return error.messages.join(' ')
    }
    return error.messages
  }
  return UiMessage.SIGNUP_GENERIC_ERROR
}

export function SignupPage() {
  const navigate = useNavigate()
  const { setSignedInUser } = useSignedIn()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const normalized = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password,
    }
    const nextErrors = validateSignupFields(normalized)
    setFieldErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await signupUser(normalized)
      setSignedInUser(response.user)
      navigate('/profile')
    } catch (error: unknown) {
      setFormError(formatApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="signup-page">
      <h1 className="signup-page__title">{UiLabel.SIGN_UP}</h1>
      <form className="signup-form" onSubmit={handleSubmit} noValidate>
        <label className="signup-form__field">
          <span>{UiLabel.EMAIL}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.email ? (
            <span className="signup-form__error">{fieldErrors.email}</span>
          ) : null}
        </label>

        <label className="signup-form__field">
          <span>{UiLabel.NAME}</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.name ? (
            <span className="signup-form__error">{fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="signup-form__field">
          <span>{UiLabel.PASSWORD}</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.password ? (
            <span className="signup-form__error">{fieldErrors.password}</span>
          ) : null}
        </label>

        {formError ? (
          <p className="signup-form__banner" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          className="signup-form__submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? UiLabel.SUBMITTING_SIGNUP : UiLabel.SUBMIT_SIGNUP}
        </button>
      </form>
    </section>
  )
}
