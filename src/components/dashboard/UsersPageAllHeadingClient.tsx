"use client"

import { useTranslation } from "react-i18next"

export function UsersPageAllHeadingClient() {
  const { t } = useTranslation()
  return (
    <h3 className="font-medium mb-4">{t("dashboard.users-all-heading")}</h3>
  )
}
