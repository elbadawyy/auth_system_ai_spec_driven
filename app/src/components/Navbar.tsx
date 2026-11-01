import { UiLabel } from '../enums/ui-label.enum'
import './Navbar.css'

export function Navbar() {
  return (
    <header className="navbar">
      <p className="navbar__brand">{UiLabel.APP_NAME}</p>
      <button type="button" className="navbar__login">
        {UiLabel.LOGIN}
      </button>
    </header>
  )
}
