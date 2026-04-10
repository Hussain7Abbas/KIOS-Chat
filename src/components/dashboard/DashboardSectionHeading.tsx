"use client"

import { useTranslation } from "react-i18next"

export function DashboardSectionHeading({
  titleKey,
  descriptionKey,
}: {
  titleKey: string
  descriptionKey: string
}) {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{t(titleKey)}</h2>
      <p className="text-sm text-muted-foreground">{t(descriptionKey)}</p>
    </div>
  )
}
