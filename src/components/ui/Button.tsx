import type { ReactNode } from 'react'
import './Button.css'

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`button button--${variant} button--${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button