import { cn } from '../../lib/utils.js'

export function Card({ className, ...props }) {
  return <div className={cn('card', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 p-[var(--sp-5)]', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-[16px] font-semibold leading-none text-foreground font-display', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-[12px] leading-6 text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-[var(--sp-5)] pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center p-[var(--sp-5)] pt-0', className)} {...props} />
}
