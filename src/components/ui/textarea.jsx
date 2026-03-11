import { cn } from '../../lib/utils.js'

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[112px] w-full rounded-[16px] border border-white/70 bg-white/72 px-4 py-3 text-[13px] font-normal text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-[0.32]',
        className
      )}
      {...props}
    />
  )
}
