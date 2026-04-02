"use client"

import { useQuery } from "@tanstack/react-query"
import type { CoinPackageData } from "@/types"

async function fetchCoinPackages(): Promise<CoinPackageData[]> {
  const res = await fetch("/api/coin-packages")
  if (!res.ok) throw new Error("Failed to fetch coin packages")
  const data = await res.json()
  const list = data.packages as CoinPackageData[] | undefined
  return list ?? []
}

export function useCoinPackages() {
  return useQuery({
    queryKey: ["coin-packages"],
    queryFn: fetchCoinPackages,
  })
}
