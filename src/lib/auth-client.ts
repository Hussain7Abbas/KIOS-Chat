"use client"

import { createAuthClient } from "better-auth/react"

/**
 * Use the current page origin in the browser so auth calls hit the same host/port
 * as the running app (e.g. `next dev` on :3001 when :3000 is taken). A fixed
 * `NEXT_PUBLIC_APP_URL` pointing at another port would POST to the wrong server
 * (often 404 on `/api/auth/sign-in/email`). Keep `.env` `BETTER_AUTH_URL` in
 * sync with the URL you open in dev.
 */
function getAuthBaseURL(): string {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL!
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
})

export const { signIn, signOut, signUp, useSession } = authClient
