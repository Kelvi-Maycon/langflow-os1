import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils.js'

export function Tabs(props) {
  return <TabsPrimitive.Root {...props} />
}

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-auto items-center rounded-full border border-white/65 bg-white/62 p-1 text-muted-foreground shadow-[0_10px_20px_rgba(28,20,55,0.05)] backdrop-blur-md',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-[0_10px_24px_rgba(28,20,55,0.08)]',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn('mt-6', className)} {...props} />
}
