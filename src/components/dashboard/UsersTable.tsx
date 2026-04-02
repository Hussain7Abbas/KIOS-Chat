"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { giftCoinsAction } from "@/app/actions/admin.actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Gift } from "lucide-react"

export interface UserRow {
  id: string
  name: string
  email: string
  role: string
  coinsBalance: number
  coinsPurchased: number
  createdAt: Date | string
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [coinsToGift, setCoinsToGift] = useState("10")
  const [open, setOpen] = useState(false)

  const handleGiftCoins = async () => {
    if (!selectedUser) return
    const amount = parseInt(coinsToGift, 10)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsPending(true)
    const result = await giftCoinsAction(selectedUser.id, amount)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Successfully gifted ${amount} coins to ${selectedUser.name}`)
      setOpen(false)
      router.refresh()
    }
  }

  const openGiftDialog = (user: UserRow) => {
    setSelectedUser(user)
    setCoinsToGift("10")
    setOpen(true)
  }

  const formatDate = (dateString: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(dateString))
  }

  return (
    <>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Coins balance</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.coinsBalance <= 0 ? "destructive" : "secondary"}>
                      {user.coinsBalance}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGiftDialog(user)}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Gift coins
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gift coins</DialogTitle>
            <DialogDescription>
              Add extra coins to {selectedUser?.name}&apos;s account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of coins</label>
              <Input
                type="number"
                min="1"
                value={coinsToGift}
                onChange={(e) => setCoinsToGift(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleGiftCoins} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm gift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
