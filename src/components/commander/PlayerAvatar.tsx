import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  name: string
  avatarUrl?: string
  colorHex?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-xl',
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function PlayerAvatar({ name, avatarUrl, colorHex, size = 'md' }: PlayerAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover ring-2 ring-primary/30', sizeClasses[size])}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-heading font-bold text-white ring-2 ring-primary/30',
        sizeClasses[size],
      )}
      style={{ backgroundColor: colorHex ?? 'var(--color-primary)' }}
    >
      {initials(name) || '?'}
    </div>
  )
}
