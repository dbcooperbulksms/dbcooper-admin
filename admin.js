import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// ====== CONFIG FROM ENV ======
const TARGET_API_BASE = process.env.TARGET_API_BASE || ""; // e.g. https://tough-philippe-dbcooperbulksms-fb95388b.koyeb.app
const ADMIN_KEY = process.env.ADMIN_KEY || "";              // same key used on your main API
const BASIC_USER = process.env.BASIC_USER || "admin";
const BASIC_PASS = process.env.BASIC_PASS || "changeme";

// ====== BASIC AUTH (protect the admin UI) ======
app.use((req, res, next) => {
  if (req.path.startsWith("/public")) return next(); // allow assets
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="DBcooper Admin"');
    return res.status(401).send("Authentication required");
  }
  const b64 = auth.slice(6);
  const [u, p] = Buffer.from(b64, "base64").toString("utf8").split(":");
  if (u === BASIC_USER && p === BASIC_PASS) return next();
  res.set("WWW-Authenticate", 'Basic realm="DBcooper Admin"');
  return res.status(401).send("Unauthorized");
});

app.use(cors());
app.use(bodyParser.json());

// Serve the admin page
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use("/public", express.static(path.join(__dirname, "public")));

// Proxy to your main API /update WITHOUT exposing ADMIN_KEY to the browser
app.post("/admin/update", async (req, res) => {
  try {
    if (!TARGET_API_BASE || !ADMIN_KEY) {
      return res.status(500).json({ ok: false, error: "Server not configured" });
    }
    const r = await fetch(`${TARGET_API_BASE}/update`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ADMIN_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body || {})
    });
    const json = await r.json().catch(() => ({}));
    res.status(r.status).json(json);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔐 DBcooper Admin running on ${PORT}`);
});
