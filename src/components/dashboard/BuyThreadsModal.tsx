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

const PACKAGES = [
  { threads: 10, price: 499, label: "Starter" },
  { threads: 50, price: 1999, label: "Pro" },
  { threads: 100, price: 3499, label: "Enterprise" },
]

interface BuyThreadsModalProps {
  trigger?: React.ReactNode
}

export function BuyThreadsModal({ trigger }: BuyThreadsModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [open, setOpen] = useState(false)

  const handlePurchase = async (packageIndex: number) => {
    setIsPending(true)
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageIndex }),
      })

      if (!res.ok) {
        throw new Error("Failed to create checkout session")
      }

      const data = await res.json()
      window.location.href = data.url
    } catch {
      toast.error("Failed to initiate purchase. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ? (trigger as React.ReactElement) : <Button />}>
        {!trigger && (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy More Threads
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase Thread Packages</DialogTitle>
          <DialogDescription>
            Choose a package to add more chat threads to your account.
            Threads never expire.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {PACKAGES.map((pkg, index) => (
            <SubscriptionCard
              key={pkg.label}
              threads={pkg.threads}
              price={pkg.price}
              label={pkg.label}
              isPopular={index === 1}
              onPurchase={() => handlePurchase(index)}
              isPending={isPending}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
