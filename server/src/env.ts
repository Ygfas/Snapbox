import { z } from "zod"

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Snapbox <no-reply@example.com>"),
  DAILY_EMAIL_LIMIT: z.coerce.number().default(200),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  RESEND_API_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment variables:")
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data