import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as usersApi from '../api/users'
import {
  AuthStorageKey,
  clearAuthStorage,
} from '../auth/auth-storage'
import { SignedInProvider } from '../context/SignedInContext'
import { AppPath } from '../enums/app-path.enum'
import { UiLabel } from '../enums/ui-label.enum'
import { createTestJwt } from '../test/jwt-test-utils'
import { SignupPage } from './SignupPage'

vi.mock('../api/users', () => ({
  signInUser: vi.fn(),
  signupUser: vi.fn(),
}))

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={[AppPath.SIGN_UP]}>
      <SignedInProvider>
        <Routes>
          <Route path={AppPath.SIGN_UP} element={<SignupPage />} />
          <Route path={AppPath.PROFILE} element={<div>Profile ok</div>} />
        </Routes>
      </SignedInProvider>
    </MemoryRouter>,
  )
}

describe('SignupPage auth persistence', () => {
  beforeEach(() => {
    clearAuthStorage()
    vi.mocked(usersApi.signupUser).mockReset()
  })

  it('persists accessToken + user and redirects to profile on success', async () => {
    const accessToken = createTestJwt(Math.floor(Date.now() / 1000) + 3600)
    vi.mocked(usersApi.signupUser).mockResolvedValue({
      message: 'ok',
      accessToken,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Ada Lovelace',
      },
    })
    renderSignup()

    fireEvent.change(screen.getByLabelText(UiLabel.EMAIL), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(UiLabel.NAME), {
      target: { value: 'Ada Lovelace' },
    })
    fireEvent.change(screen.getByLabelText(UiLabel.PASSWORD), {
      target: { value: 'Secret1!' },
    })
    fireEvent.click(screen.getByRole('button', { name: UiLabel.SUBMIT_SIGNUP }))

    await waitFor(() => {
      expect(screen.getByText('Profile ok')).toBeInTheDocument()
    })
    expect(localStorage.getItem(AuthStorageKey.ACCESS_TOKEN)).toBe(accessToken)
    expect(localStorage.getItem(AuthStorageKey.USER)).toContain('user@example.com')
  })
})
