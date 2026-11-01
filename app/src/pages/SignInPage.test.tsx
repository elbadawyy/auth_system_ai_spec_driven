import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from '../api/client'
import * as usersApi from '../api/users'
import {
  AuthStorageKey,
  clearAuthStorage,
} from '../auth/auth-storage'
import { SignedInProvider } from '../context/SignedInContext'
import { AppPath } from '../enums/app-path.enum'
import { UiLabel } from '../enums/ui-label.enum'
import { UiMessage } from '../enums/ui-message.enum'
import { createTestJwt } from '../test/jwt-test-utils'
import { SignInPage } from './SignInPage'

vi.mock('../api/users', () => ({
  signInUser: vi.fn(),
  signupUser: vi.fn(),
}))

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={[AppPath.SIGN_IN]}>
      <SignedInProvider>
        <Routes>
          <Route path={AppPath.SIGN_IN} element={<SignInPage />} />
          <Route path={AppPath.PROFILE} element={<div>Profile ok</div>} />
        </Routes>
      </SignedInProvider>
    </MemoryRouter>,
  )
}

describe('SignInPage', () => {
  beforeEach(() => {
    clearAuthStorage()
    vi.mocked(usersApi.signInUser).mockReset()
  })

  it('shows field validation errors and does not call the API', async () => {
    renderSignIn()

    fireEvent.click(screen.getByRole('button', { name: UiLabel.SUBMIT_SIGNIN }))

    expect(await screen.findByText(UiMessage.EMAIL_REQUIRED)).toBeInTheDocument()
    expect(screen.getByText(UiMessage.PASSWORD_REQUIRED)).toBeInTheDocument()
    expect(usersApi.signInUser).not.toHaveBeenCalled()
  })

  it('shows generic credentials error for 401 responses', async () => {
    vi.mocked(usersApi.signInUser).mockRejectedValue(
      new ApiRequestError(401, 'nope', 'UNAUTHORIZED'),
    )
    renderSignIn()

    fireEvent.change(screen.getByLabelText(UiLabel.EMAIL), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(UiLabel.PASSWORD), {
      target: { value: 'Secret1!' },
    })
    fireEvent.click(screen.getByRole('button', { name: UiLabel.SUBMIT_SIGNIN }))

    expect(
      await screen.findByText(UiMessage.INVALID_CREDENTIALS),
    ).toBeInTheDocument()
  })

  it('disables submit while loading to prevent duplicate requests', async () => {
    let resolveSignIn: ((value: usersApi.AuthSuccessResponse) => void) | undefined
    vi.mocked(usersApi.signInUser).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve
        }),
    )
    renderSignIn()

    fireEvent.change(screen.getByLabelText(UiLabel.EMAIL), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(UiLabel.PASSWORD), {
      target: { value: 'Secret1!' },
    })

    const submit = screen.getByRole('button', { name: UiLabel.SUBMIT_SIGNIN })
    fireEvent.click(submit)

    expect(
      await screen.findByRole('button', { name: UiLabel.SUBMITTING_SIGNIN }),
    ).toBeDisabled()
    expect(usersApi.signInUser).toHaveBeenCalledTimes(1)

    fireEvent.click(
      screen.getByRole('button', { name: UiLabel.SUBMITTING_SIGNIN }),
    )
    expect(usersApi.signInUser).toHaveBeenCalledTimes(1)

    resolveSignIn?.({
      message: 'ok',
      accessToken: createTestJwt(Math.floor(Date.now() / 1000) + 3600),
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Ada Lovelace',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Profile ok')).toBeInTheDocument()
    })
  })

  it('persists auth and redirects to profile on success', async () => {
    const accessToken = createTestJwt(Math.floor(Date.now() / 1000) + 3600)
    vi.mocked(usersApi.signInUser).mockResolvedValue({
      message: 'ok',
      accessToken,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Ada Lovelace',
      },
    })
    renderSignIn()

    fireEvent.change(screen.getByLabelText(UiLabel.EMAIL), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(UiLabel.PASSWORD), {
      target: { value: 'Secret1!' },
    })
    fireEvent.click(screen.getByRole('button', { name: UiLabel.SUBMIT_SIGNIN }))

    await waitFor(() => {
      expect(screen.getByText('Profile ok')).toBeInTheDocument()
    })
    expect(localStorage.getItem(AuthStorageKey.ACCESS_TOKEN)).toBe(accessToken)
    expect(localStorage.getItem(AuthStorageKey.USER)).toContain('Ada Lovelace')
  })
})
