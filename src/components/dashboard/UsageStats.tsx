"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ShoppingCart, Crown } from "lucide-react"

interface UsageStatsProps {
  user: {
    name: string
    email: string
    image?: string | null
    role: string
    threadsRemaining: number
    threadsPurchased: number
  }
}

export function UsageStats({ user }: UsageStatsProps) {
  const totalThreads = 3 + user.threadsPurchased
  const usedThreads = totalThreads - user.threadsRemaining
  const usagePercentage = Math.min((usedThreads / totalThreads) * 100, 100)

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

      {/* Usage Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Thread Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {usedThreads} of {totalThreads} used
            </span>
            <Badge
              variant={user.threadsRemaining <= 1 ? "destructive" : "secondary"}
            >
              {user.threadsRemaining} remaining
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Total Purchased
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{user.threadsPurchased}</div>
          <p className="text-sm text-muted-foreground mt-1">
            threads purchased all-time
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
