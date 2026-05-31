import { Resend } from "resend"

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const FROM = "Frendr <notifications@frendr.co>"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://frendr.co"
