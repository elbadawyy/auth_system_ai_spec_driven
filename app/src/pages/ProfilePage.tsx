import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { fetchCurrentUser, type AuthUser } from '../api/users'
import { useSignedIn } from '../context/SignedInContext'
import { AppPath } from '../enums/app-path.enum'
import { HttpStatusCode } from '../enums/http-status.enum'
import { UiLabel } from '../enums/ui-label.enum'
import { UiMessage } from '../enums/ui-message.enum'
import './ProfilePage.css'

type ProfileViewState =
  | { status: 'loading' }
  | { status: 'success'; user: AuthUser }
  | { status: 'error'; message: string }

export function ProfilePage() {
  const navigate = useNavigate()
  const { accessToken, updateSignedInUser, signOut } = useSignedIn()
  const [viewState, setViewState] = useState<ProfileViewState>({
    status: 'loading',
  })

  useEffect(() => {
    if (accessToken === null) {
      return
    }

    const controller = new AbortController()
    let cancelled = false

    void (async () => {
      try {
        const user = await fetchCurrentUser(accessToken, controller.signal)
        if (cancelled) {
          return
        }
        updateSignedInUser(user)
        setViewState({ status: 'success', user })
      } catch (error: unknown) {
        if (cancelled || controller.signal.aborted) {
          return
        }

        if (
          error instanceof ApiRequestError &&
          error.statusCode === HttpStatusCode.UNAUTHORIZED
        ) {
          signOut()
          navigate(AppPath.SIGN_IN, { replace: true })
          return
        }

        setViewState({
          status: 'error',
          message: UiMessage.PROFILE_LOAD_ERROR,
        })
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [accessToken, navigate, signOut, updateSignedInUser])

  if (accessToken === null) {
    return null
  }

  if (viewState.status === 'loading') {
    return (
      <section className="profile-page" aria-busy="true">
        <p className="profile-page__status">{UiMessage.PROFILE_LOADING}</p>
      </section>
    )
  }

  if (viewState.status === 'error') {
    return (
      <section className="profile-page">
        <p className="profile-page__error" role="alert">
          {viewState.message}
        </p>
      </section>
    )
  }

  return (
    <section className="profile-page">
      <h1 className="profile-page__title">{UiMessage.PROFILE_SIGNED_IN}</h1>
      <dl className="profile-page__fields">
        <div className="profile-page__field">
          <dt>{UiLabel.NAME}</dt>
          <dd>{viewState.user.name}</dd>
        </div>
        <div className="profile-page__field">
          <dt>{UiLabel.EMAIL}</dt>
          <dd>{viewState.user.email}</dd>
        </div>
      </dl>
    </section>
  )
}
