import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const FREE_UPLOAD_SECONDS = 1200 // 20 minutes
