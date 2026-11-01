import { UiMessage } from '../enums/ui-message.enum'
import './ServiceUnavailableModal.css'

export interface ServiceUnavailableModalProps {
  open: boolean
}

export function ServiceUnavailableModal({ open }: ServiceUnavailableModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="service-unavailable-modal">
      <div
        className="service-unavailable-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-unavailable-message"
      >
        <p
          id="service-unavailable-message"
          className="service-unavailable-modal__message"
        >
          {UiMessage.SERVICE_UNAVAILABLE}
        </p>
      </div>
    </div>
  )
}
