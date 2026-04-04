"use client"

import { useTranslation } from "react-i18next"

export function AgentPageSubheading() {
  const { t } = useTranslation()
  return (
    <h3 className="text-sm font-medium text-muted-foreground">
      {t("dashboard.agent-main-instructions")}
    </h3>
  )
}
