import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-sans font-bold uppercase tracking-[0.04em] rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white',
        secondary: 'bg-primary-100 text-primary-800',
        outline: 'border-[1.5px] border-brand-light text-brand bg-transparent',
        success: 'bg-level-bg text-level',
        level: 'bg-level-bg text-level',
        warning: 'bg-streak-bg text-streak',
        streak: 'bg-streak-bg text-streak',
        pink: 'bg-xp-bg text-xp',
        xp: 'bg-xp-bg text-xp',
        vocab: 'bg-vocab-bg text-vocab',
        retention: 'bg-retention-bg text-retention',
      },
      size: {
        md: 'text-[11px] px-2.5 py-1',
        sm: 'text-[9px] px-2 py-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export function Badge({ className, variant, size, ...props }) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
