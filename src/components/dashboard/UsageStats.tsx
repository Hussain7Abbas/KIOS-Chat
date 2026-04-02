"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ShoppingCart, Crown, Coins } from "lucide-react"

interface UsageStatsProps {
  user: {
    name: string
    email: string
    image?: string | null
    role: string
    coinsBalance: number
    coinsPurchased: number
  }
}

export function UsageStats({ user }: UsageStatsProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base">{user.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="gap-1">
            <Crown className="h-3 w-3" />
            {user.role}
          </Badge>
        </CardContent>
      </Card>

      {/* Coins balance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Coin balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold">{user.coinsBalance}</div>
          <p className="text-sm text-muted-foreground">
            Coins available to spend on threads and future services
          </p>
          <Badge
            variant={user.coinsBalance <= 0 ? "destructive" : "secondary"}
          >
            {user.coinsBalance} coins
          </Badge>
        </CardContent>
      </Card>

      {/* Purchases Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Total purchased
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{user.coinsPurchased}</div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            coins purchased all-time (via Stripe)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
