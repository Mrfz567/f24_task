interface IconProps {
  className?: string
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m14.7 5.3 4 4M4 20l4.2-1 11.5-11.5a1.4 1.4 0 0 0 0-2l-1.2-1.2a1.4 1.4 0 0 0-2 0L5 15.8 4 20Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}
