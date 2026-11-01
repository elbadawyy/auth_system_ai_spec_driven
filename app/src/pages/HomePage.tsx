import { UiLabel } from '../enums/ui-label.enum'

export function HomePage() {
  return <h1 className="app-welcome">{UiLabel.WELCOME_HEADING}</h1>
}
