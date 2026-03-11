import { useUiStore } from '../../store/useUiStore.js'

export default function ToastViewport() {
  const { toasts, dismissToast } = useUiStore()

  if (toasts.length === 0) return null

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.kind}`}>
          <div className="toast-copy">
            <strong>{toast.title}</strong>
            {toast.description ? <span>{toast.description}</span> : null}
          </div>
          <button
            type="button"
            className="toast-dismiss"
            aria-label="Fechar notificação"
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
