import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { signInUser } from '../api/users'
import { validateAuthCredentials } from '../auth/validate-auth-credentials'
import { useSignedIn } from '../context/SignedInContext'
import { AppPath } from '../enums/app-path.enum'
import { UiLabel } from '../enums/ui-label.enum'
import { UiMessage } from '../enums/ui-message.enum'
import './SignupPage.css'

const HTTP_UNAUTHORIZED = 401

interface FieldErrors {
  email?: string
  password?: string
}

function formatSignInError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.statusCode === HTTP_UNAUTHORIZED) {
      return UiMessage.INVALID_CREDENTIALS
    }
    if (Array.isArray(error.messages)) {
      return error.messages.join(' ')
    }
    return error.messages
  }
  return UiMessage.SIGNIN_GENERIC_ERROR
}

export function SignInPage() {
  const navigate = useNavigate()
  const { signIn } = useSignedIn()
  const [email, setEmail] = useState('')
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
      password,
    }
    const nextErrors = validateAuthCredentials(normalized)
    setFieldErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await signInUser(normalized)
      signIn({
        accessToken: response.accessToken,
        user: response.user,
      })
      navigate(AppPath.PROFILE)
    } catch (error: unknown) {
      setFormError(formatSignInError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="signup-page">
      <h1 className="signup-page__title">{UiLabel.SIGN_IN}</h1>
      <form className="signup-form" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <p className="signup-form__banner" role="alert">
            {formError}
          </p>
        ) : null}

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
          <span>{UiLabel.PASSWORD}</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.password ? (
            <span className="signup-form__error">{fieldErrors.password}</span>
          ) : null}
        </label>

        <button
          type="submit"
          className="signup-form__submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? UiLabel.SUBMITTING_SIGNIN : UiLabel.SUBMIT_SIGNIN}
        </button>
      </form>
    </section>
  )
}
