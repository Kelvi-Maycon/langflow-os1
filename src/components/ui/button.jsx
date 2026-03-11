import { Slot } from '@radix-ui/react-slot'
import { cn } from '../../lib/utils.js'

export function Button({ className, variant = 'default', size = 'default', asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'

  const isIcon = size === 'icon';
  const baseClass = isIcon ? 'ibtn' : 'btn';

  const variantToClass = {
    default: isIcon ? 'ibtn-primary' : 'btn-primary',
    secondary: isIcon ? 'ibtn-secondary' : 'btn-secondary',
    outline: isIcon ? 'ibtn-outline' : 'btn-outline',
    ghost: isIcon ? 'ibtn-ghost' : 'btn-ghost',
    dark: isIcon ? 'ibtn-dark' : 'btn-dark',
    pink: isIcon ? 'ibtn-pink' : 'btn-pink',
  };

  const sizeToClass = {
    default: isIcon ? 'ibtn-md' : 'btn-md',
    sm: isIcon ? 'ibtn-sm' : 'btn-sm',
    lg: isIcon ? 'ibtn-lg' : 'btn-lg',
    xl: isIcon ? 'ibtn-xl' : 'btn-xl',
    icon: 'ibtn-md',
  };

  const finalVariant = variantToClass[variant] || variantToClass.default;
  const finalSize = sizeToClass[size] || sizeToClass.default;

  return (
    <Comp
      className={cn(baseClass, finalVariant, finalSize, className)}
      {...props}
    />
  )
}
