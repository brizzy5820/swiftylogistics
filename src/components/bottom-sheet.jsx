import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

export function BottomSheet({ open, onOpenChange, title, description, children, footer, className }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn('max-h-[85vh] rounded-t-3xl border-none bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))]', className)}>
        <DrawerHeader className="px-0 text-left">
          <DrawerTitle className="font-display text-lg font-bold text-slate-900">{title}</DrawerTitle>
          {description && <DrawerDescription className="text-sm text-slate-500">{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
        {footer && <DrawerFooter className="px-0">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  )
}
