import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from '../api/client'
import * as usersApi from '../api/users'
import { RequireAuth } from '../auth/RequireAuth'
import {
  AuthStorageKey,
  clearAuthStorage,
  saveAuthSession,
} from '../auth/auth-storage'
import { SignedInProvider } from '../context/SignedInContext'
import { AppPath } from '../enums/app-path.enum'
import { HttpStatusCode } from '../enums/http-status.enum'
import { UiLabel } from '../enums/ui-label.enum'
import { UiMessage } from '../enums/ui-message.enum'
import { createTestJwt } from '../test/jwt-test-utils'
import { ProfilePage } from './ProfilePage'

vi.mock('../api/users', async () => {
  const actual =
    await vi.importActual<typeof import('../api/users')>('../api/users')
  return {
    ...actual,
    fetchCurrentUser: vi.fn(),
    signInUser: vi.fn(),
    signupUser: vi.fn(),
  }
})

function seedAuthenticatedSession(overrides?: {
  name?: string
  email?: string
}): string {
  const accessToken = createTestJwt(Math.floor(Date.now() / 1000) + 3600)
  saveAuthSession({
    accessToken,
    user: {
      id: 'user-1',
      email: overrides?.email ?? 'stale@example.com',
      name: overrides?.name ?? 'Stale Name',
    },
  })
  return accessToken
}

function renderProfile(initialPath: string = AppPath.PROFILE) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SignedInProvider>
        <Routes>
          <Route path={AppPath.SIGN_IN} element={<div>Sign-in page</div>} />
          <Route element={<RequireAuth />}>
            <Route path={AppPath.PROFILE} element={<ProfilePage />} />
          </Route>
        </Routes>
      </SignedInProvider>
    </MemoryRouter>,
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    clearAuthStorage()
    vi.mocked(usersApi.fetchCurrentUser).mockReset()
  })

  it('redirects unauthenticated visitors to sign-in', async () => {
    renderProfile()

    expect(await screen.findByText('Sign-in page')).toBeInTheDocument()
    expect(usersApi.fetchCurrentUser).not.toHaveBeenCalled()
  })

  it('shows loading then name and email from /users/me', async () => {
    seedAuthenticatedSession()
    let resolveFetch: ((value: usersApi.AuthUser) => void) | undefined
    vi.mocked(usersApi.fetchCurrentUser).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )

    renderProfile()

    expect(
      await screen.findByText(UiMessage.PROFILE_LOADING),
    ).toBeInTheDocument()

    resolveFetch?.({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Ada Lovelace',
    })

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText(UiLabel.NAME)).toBeInTheDocument()
    expect(screen.getByText(UiLabel.EMAIL)).toBeInTheDocument()
    expect(screen.queryByText('Stale Name')).not.toBeInTheDocument()
  })

  it('refreshes stored user after a successful profile fetch', async () => {
    const accessToken = seedAuthenticatedSession()
    vi.mocked(usersApi.fetchCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'fresh@example.com',
      name: 'Fresh Name',
    })

    renderProfile()

    expect(await screen.findByText('Fresh Name')).toBeInTheDocument()
    expect(localStorage.getItem(AuthStorageKey.ACCESS_TOKEN)).toBe(accessToken)
    expect(localStorage.getItem(AuthStorageKey.USER)).toContain('Fresh Name')
    expect(localStorage.getItem(AuthStorageKey.USER)).toContain(
      'fresh@example.com',
    )
  })

  it('shows a friendly error for non-401 failures and keeps the session', async () => {
    const accessToken = seedAuthenticatedSession()
    vi.mocked(usersApi.fetchCurrentUser).mockRejectedValue(
      new ApiRequestError(
        HttpStatusCode.NOT_FOUND,
        'missing',
        'NOT_FOUND',
      ),
    )

    renderProfile()

    expect(
      await screen.findByText(UiMessage.PROFILE_LOAD_ERROR),
    ).toBeInTheDocument()
    expect(localStorage.getItem(AuthStorageKey.ACCESS_TOKEN)).toBe(accessToken)
    expect(localStorage.getItem(AuthStorageKey.USER)).not.toBeNull()
  })

  it('clears auth and redirects to sign-in on 401', async () => {
    seedAuthenticatedSession()
    vi.mocked(usersApi.fetchCurrentUser).mockRejectedValue(
      new ApiRequestError(
        HttpStatusCode.UNAUTHORIZED,
        'unauthorized',
        'UNAUTHORIZED',
      ),
    )

    renderProfile()

    expect(await screen.findByText('Sign-in page')).toBeInTheDocument()
    await waitFor(() => {
      expect(localStorage.getItem(AuthStorageKey.ACCESS_TOKEN)).toBeNull()
      expect(localStorage.getItem(AuthStorageKey.USER)).toBeNull()
    })
  })
})
