"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SubscriptionCard } from "./SubscriptionCard"
import { toast } from "sonner"
import { ShoppingCart } from "lucide-react"
import { useCoinPackages } from "@/hooks/useCoinPackages"
import { Skeleton } from "@/components/ui/skeleton"

interface BuyCoinsModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BuyCoinsModal({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: BuyCoinsModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  const { data: packages, isLoading, isError } = useCoinPackages()

  const handlePurchase = async (coinPackageId: string) => {
    setIsPending(true)
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinPackageId }),
      })

      if (!res.ok) {
        throw new Error("Failed to create checkout session")
      }

      const data: { url: string } = await res.json()
      window.location.href = data.url
    } catch {
      toast.error("Failed to initiate purchase. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={trigger ? (trigger as React.ReactElement) : <Button />}>
          {!trigger && (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Coins
            </>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase coin packages</DialogTitle>
          <DialogDescription>
            Choose a package to add coins to your account. Coins never expire.
          </DialogDescription>
        </DialogHeader>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive pt-4">
            Could not load packages. Please try again later.
          </p>
        )}
        {!isLoading && !isError && packages && packages.length === 0 && (
          <p className="text-sm text-muted-foreground pt-4">
            No coin packages are available yet. Contact an administrator.
          </p>
        )}
        {!isLoading && packages && packages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {packages.map((pkg) => (
              <SubscriptionCard
                key={pkg.id}
                coins={pkg.coins}
                price={pkg.priceInCents}
                label={pkg.label}
                isPopular={pkg.isPopular}
                onPurchase={() => handlePurchase(pkg.id)}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
