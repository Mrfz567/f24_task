import { useEffect } from 'react'

interface NotificationToastProps {
  message: string
  tone: 'error' | 'success'
  onDismiss: () => void
}

export function NotificationToast({ message, tone, onDismiss }: NotificationToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 4_000)

    return () => window.clearTimeout(timeout)
  }, [onDismiss])

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${
        tone === 'success' ? 'bg-emerald-600' : 'bg-red-600'
      }`}
      role="status"
    >
      {message}
    </div>
  )
}
