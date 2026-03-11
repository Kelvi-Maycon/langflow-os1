import { cn } from '../../lib/utils.js'

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-[10px] border-[1.5px] border-border bg-white px-[14px] py-0 text-[13px] font-normal text-foreground outline-none transition-all file:border-0 file:bg-transparent file:text-[13px] file:font-medium placeholder:text-muted-foreground focus-visible:border-brand-light focus-visible:ring-[3px] focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-[0.32]',
        className,
      )}
      {...props}
    />
  )
}
