import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { connectDb } from "./db/index.js";
import { requireAuth } from "./middleware/requireAuth.js";

import authRouter from "./routes/auth.js";
import checksRouter from "./routes/checks.js";
import contractsRouter from "./routes/contracts.js";
import creditsRouter from "./routes/credits.js";
import documentsRouter from "./routes/documents.js";
import ledgerRouter from "./routes/ledger.js";
import pettyCashRouter from "./routes/petty_cash.js";
import aiRouter from "./routes/ai.js";
import personsRouter from "./routes/persons.js";
import fiscalYearsRouter from "./routes/fiscalYears.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:2111",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:2111",
      ];
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/", (c) =>
  c.json({ message: "سامانه جامع نظام مالی بخش عمومی - فعال" })
);

// روت‌های عمومی (بدون نیاز به توکن)
app.route("/api/auth", authRouter);

// همه روت‌های زیر نیاز به JWT دارند
app.use("/api/*", requireAuth);
app.route("/api/ai", aiRouter);
app.route("/api/checks", checksRouter);
app.route("/api/contracts", contractsRouter);
app.route("/api/credits", creditsRouter);
app.route("/api/documents", documentsRouter);
app.route("/api/ledger", ledgerRouter);
app.route("/api/petty-cash", pettyCashRouter);
app.route("/api/persons", personsRouter);
app.route("/api/fiscal-years", fiscalYearsRouter);

connectDb().then(() => {
  serve({ fetch: app.fetch, port: 8000 }, () => {
    console.log("🚀 Server running at http://localhost:8000");
  });
}).catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});
