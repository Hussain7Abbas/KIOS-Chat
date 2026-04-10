"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
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
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [coinsToGift, setCoinsToGift] = useState("10")
  const [open, setOpen] = useState(false)

  const locale = i18n.language === "ar" ? "ar" : "en-US"

  const handleGiftCoins = async () => {
    if (!selectedUser) return
    const amount = parseInt(coinsToGift, 10)
    if (isNaN(amount) || amount <= 0) {
      toast.error(t("users.gift-amount-invalid"))
      return
    }

    setIsPending(true)
    const result = await giftCoinsAction(selectedUser.id, amount)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        t("users.gift-success", {
          amount,
          name: selectedUser.name,
        }),
      )
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
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(dateString))
  }

  return (
    <>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.table-user")}</TableHead>
              <TableHead>{t("users.table-role")}</TableHead>
              <TableHead>{t("users.table-coins")}</TableHead>
              <TableHead>{t("users.table-joined")}</TableHead>
              <TableHead className="text-end">{t("users.table-action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t("users.no-users")}
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
                  <TableCell className="text-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGiftDialog(user)}
                    >
                      <Gift className="me-2 h-4 w-4" />
                      {t("users.gift-coins")}
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
            <DialogTitle>{t("users.gift-dialog-title")}</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? t("users.gift-dialog-desc", { name: selectedUser.name })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("users.gift-amount-label")}</label>
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
                {t("common.cancel")}
              </Button>
              <Button onClick={handleGiftCoins} disabled={isPending}>
                {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("users.gift-confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
