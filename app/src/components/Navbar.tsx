import { Link } from 'react-router-dom'
import { useSignedIn } from '../context/SignedInContext'
import { AppPath } from '../enums/app-path.enum'
import { UiLabel } from '../enums/ui-label.enum'
import './Navbar.css'

export function Navbar() {
  const { isAuthenticated, signOut } = useSignedIn()

  return (
    <header className="navbar">
      <Link to={AppPath.HOME} className="navbar__brand">
        {UiLabel.APP_NAME}
      </Link>
      <div className="navbar__actions">
        {isAuthenticated ? (
          <button
            type="button"
            className="navbar__action navbar__action--link"
            onClick={() => {
              signOut()
            }}
          >
            {UiLabel.LOGOUT}
          </button>
        ) : (
          <>
            <Link
              to={AppPath.SIGN_IN}
              className="navbar__action navbar__action--link"
            >
              {UiLabel.LOGIN}
            </Link>
            <Link
              to={AppPath.SIGN_UP}
              className="navbar__action navbar__action--link"
            >
              {UiLabel.SIGN_UP}
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
