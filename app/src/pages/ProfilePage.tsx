import { useSignedIn } from '../context/SignedInContext'
import { UiMessage } from '../enums/ui-message.enum'
import './ProfilePage.css'

export function ProfilePage() {
  const { signedInUser } = useSignedIn()

  if (signedInUser === null) {
    return (
      <section className="profile-page">
        <h1 className="profile-page__title">{UiMessage.PROFILE_NOT_SIGNED_IN}</h1>
      </section>
    )
  }

  return (
    <section className="profile-page">
      <h1 className="profile-page__title">{UiMessage.PROFILE_SIGNED_IN}</h1>
      <p className="profile-page__detail">
        {signedInUser.name} ({signedInUser.email})
      </p>
    </section>
  )
}
