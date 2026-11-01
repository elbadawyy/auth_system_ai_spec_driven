import { Link } from 'react-router-dom'
import { useSignedIn } from '../context/SignedInContext'
import { UiLabel } from '../enums/ui-label.enum'
import './Navbar.css'

export function Navbar() {
  const { signedInUser } = useSignedIn()
  const isSignedIn = signedInUser !== null

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        {UiLabel.APP_NAME}
      </Link>
      <div className="navbar__actions">
        {isSignedIn ? (
          <button
            type="button"
            className="navbar__action"
            onClick={() => {
              // Logout is a no-op placeholder until a future logout feature.
            }}
          >
            {UiLabel.LOGOUT}
          </button>
        ) : (
          <>
            <button type="button" className="navbar__action">
              {UiLabel.LOGIN}
            </button>
            <Link to="/signup" className="navbar__action navbar__action--link">
              {UiLabel.SIGN_UP}
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
