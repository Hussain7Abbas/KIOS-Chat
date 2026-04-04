"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { CoinPackageData } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"

interface CoinPackageManagerProps {
  initialPackages: CoinPackageData[]
}

function formatUsd(priceInCents: number) {
  return `$${(priceInCents / 100).toFixed(2)}`
}

export function CoinPackageManager({ initialPackages }: CoinPackageManagerProps) {
  const { t } = useTranslation()
  const [packages, setPackages] = useState(initialPackages)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState("")
  const [coins, setCoins] = useState("100")
  const [priceDollars, setPriceDollars] = useState("4.99")
  const [sortOrder, setSortOrder] = useState("0")
  const [isPopular, setIsPopular] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const resetForm = () => {
    setEditingId(null)
    setLabel("")
    setCoins("100")
    setPriceDollars("4.99")
    setSortOrder("0")
    setIsPopular(false)
    setIsActive(true)
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (pkg: CoinPackageData) => {
    setEditingId(pkg.id)
    setLabel(pkg.label)
    setCoins(String(pkg.coins))
    setPriceDollars((pkg.priceInCents / 100).toFixed(2))
    setSortOrder(String(pkg.sortOrder))
    setIsPopular(pkg.isPopular)
    setIsActive(pkg.isActive)
    setDialogOpen(true)
  }

  const parsePriceCents = (): number | null => {
    const n = Number.parseFloat(priceDollars)
    if (Number.isNaN(n) || n <= 0) return null
    return Math.round(n * 100)
  }

  const handleSave = async () => {
    const coinsNum = Number.parseInt(coins, 10)
    const sortNum = Number.parseInt(sortOrder, 10)
    const priceCents = parsePriceCents()
    if (!label.trim() || Number.isNaN(coinsNum) || coinsNum < 1) {
      toast.error(t("coin-packages-admin.validation-label-coins"))
      return
    }
    if (priceCents === null) {
      toast.error(t("coin-packages-admin.validation-price"))
      return
    }
    if (Number.isNaN(sortNum)) {
      toast.error(t("coin-packages-admin.validation-sort"))
      return
    }

    setIsPending(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/coin-packages/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: label.trim(),
            coins: coinsNum,
            priceInCents: priceCents,
            sortOrder: sortNum,
            isPopular,
            isActive,
          }),
        })
        if (!res.ok) throw new Error("update failed")
        const updated = (await res.json()) as CoinPackageData
        setPackages((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        )
        toast.success(t("coin-packages-admin.toast-updated"))
      } else {
        const res = await fetch("/api/coin-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: label.trim(),
            coins: coinsNum,
            priceInCents: priceCents,
            sortOrder: sortNum,
            isPopular,
            isActive,
          }),
        })
        if (!res.ok) throw new Error("create failed")
        const created = (await res.json()) as CoinPackageData
        setPackages((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder))
        toast.success(t("coin-packages-admin.toast-created"))
      }
      setDialogOpen(false)
      resetForm()
    } catch {
      toast.error(t("coin-packages-admin.toast-save-failed"))
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsPending(true)
    try {
      const res = await fetch(`/api/coin-packages/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("delete failed")
      setPackages((prev) => prev.filter((p) => p.id !== id))
      toast.success(t("coin-packages-admin.toast-deleted"))
      setDeleteId(null)
    } catch {
      toast.error(t("coin-packages-admin.toast-delete-failed"))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t("coin-packages-admin.card-title")}</CardTitle>
          <CardDescription>
            {t("coin-packages-admin.card-desc")}
          </CardDescription>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 me-1" />
          {t("coin-packages-admin.add-package")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("coin-packages-admin.table-label")}</TableHead>
                <TableHead>{t("coin-packages-admin.table-coins")}</TableHead>
                <TableHead>{t("coin-packages-admin.table-price")}</TableHead>
                <TableHead>{t("coin-packages-admin.table-order")}</TableHead>
                <TableHead>{t("coin-packages-admin.table-flags")}</TableHead>
                <TableHead className="text-end">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    {t("coin-packages-admin.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.label}</TableCell>
                    <TableCell>{pkg.coins}</TableCell>
                    <TableCell>{formatUsd(pkg.priceInCents)}</TableCell>
                    <TableCell>{pkg.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pkg.isPopular && <Badge variant="default">{t("common.popular")}</Badge>}
                        {pkg.isActive ? (
                          <Badge variant="secondary">{t("common.active")}</Badge>
                        ) : (
                          <Badge variant="outline">{t("common.inactive")}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-end space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(pkg)}
                        aria-label={t("coin-packages-admin.edit-aria")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(pkg.id)}
                        aria-label={t("coin-packages-admin.delete-aria")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm() }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? t("coin-packages-admin.dialog-edit") : t("coin-packages-admin.dialog-new")}</DialogTitle>
              <DialogDescription>
                {t("coin-packages-admin.dialog-desc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="pkg-label">{t("common.label")}</Label>
                <Input
                  id="pkg-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t("coin-packages-admin.placeholder-label")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-coins">{t("coin-packages-admin.field-coins")}</Label>
                <Input
                  id="pkg-coins"
                  type="number"
                  min={1}
                  value={coins}
                  onChange={(e) => setCoins(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-price">{t("coin-packages-admin.field-price-usd")}</Label>
                <Input
                  id="pkg-price"
                  type="text"
                  inputMode="decimal"
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-sort">{t("coin-packages-admin.field-sort")}</Label>
                <Input
                  id="pkg-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                  />
                  {t("coin-packages-admin.popular-check")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  {t("coin-packages-admin.active-check")}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("coin-packages-admin.delete-title")}</DialogTitle>
              <DialogDescription>
                {t("coin-packages-admin.delete-desc")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => deleteId && handleDelete(deleteId)}
              >
                {t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
