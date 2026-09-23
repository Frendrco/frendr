import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Hosting is free while we grow supply. This is an abuse ceiling, not a
// product tier — at ~10 hours it is far beyond any genuine creator (the
// heaviest real account currently sits at 49 minutes) while still capping
// runaway uploads. Revisit when there is activity worth monetising.
export const FREE_UPLOAD_SECONDS = 36000 // 10 hours

// Per-video ceiling sent to Cloudflare as maxDurationSeconds. The old value
// of 600 capped free accounts at two videos regardless of the total budget.
export const MAX_VIDEO_SECONDS = 7200 // 2 hours
