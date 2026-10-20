import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import pino from "pino"
import { config } from "./env.js"
import { emailRouter } from "./routes/email.js"

const logger = pino({ level: config.LOG_LEVEL })

const app = express()

app.use(helmet())
app.use(cors({ origin: config.CLIENT_ORIGIN }))
app.use(express.json({ limit: "10kb" }))

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, code: "RATE_LIMITED", message: "Terlalu banyak request, coba lagi nanti" },
})
app.use("/api", limiter)

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

app.use("/api", emailRouter)

app.use((_req, res) => {
  res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Endpoint tidak ditemukan" })
})

app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next
  logger.error({ err }, "Unhandled error")
  res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Terjadi kesalahan server" })
})

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, "Server started")
})