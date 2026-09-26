const http = require("http");
const fs = require("fs");
const path = require("path");
const { generateBrandNames } = require("./generator");
const { checkDomainAvailability, batchCheckDomains, sanitizeDomain } = require("./checker");

const PORT = process.env.PORT || 4000;
const PUBLIC_DIR = path.resolve(__dirname, "public");

function parseJsonBody(req, maxBytes = 100 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    let received = 0;
    req.on("data", chunk => {
      received += chunk.length;
      if (received > maxBytes) {
        req.destroy();
        reject(new Error("Request payload exceeds size limit (100KB)"));
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Malformed JSON: " + err.message));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Security & CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, "http://localhost:" + PORT);
  const pathname = urlObj.pathname;

  // 1. API: Single domain availability check
  if (pathname === "/api/check" && req.method === "GET") {
    const rawDomain = urlObj.searchParams.get("domain");
    if (!rawDomain) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required 'domain' query parameter" }));
      return;
    }

    try {
      const result = await checkDomainAvailability(rawDomain);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Check failed", message: err.message }));
    }
    return;
  }

  // 2. API: Auto-generate & batch check available domains
  if (pathname === "/api/generate-and-check" && (req.method === "POST" || req.method === "GET")) {
    let options = {};
    try {
      if (req.method === "POST") {
        options = await parseJsonBody(req);
      } else {
        const rawTlds = urlObj.searchParams.get("tlds");
        options = {
          keyword: urlObj.searchParams.get("keyword") || "",
          theme: urlObj.searchParams.get("theme") || "all",
          count: parseInt(urlObj.searchParams.get("count") || "25", 10),
          tlds: rawTlds ? rawTlds.split(",").map(t => t.trim()) : [".com"]
        };
      }
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid request", message: err.message }));
      return;
    }

    try {
      const count = Math.min(Math.max(1, options.count || 25), 60);
      const candidates = generateBrandNames({
        keyword: options.keyword,
        theme: options.theme,
        count,
        tlds: options.tlds
      });

      const results = await batchCheckDomains(candidates, 4);
      const availableOnly = results.filter(r => r.available);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        totalScanned: results.length,
        availableCount: availableOnly.length,
        available: availableOnly,
        all: results
      }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Batch check failed", message: err.message }));
    }
    return;
  }

  // 3. Static Files with Strict Path Traversal Prevention
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
    return;
  }

  // Safe path normalization
  const normalizedPath = path.normalize(pathname === "/" ? "/index.html" : pathname);
  let safeFilePath = path.join(PUBLIC_DIR, normalizedPath);

  // Security barrier: Ensure file path stays strictly within PUBLIC_DIR
  if (!safeFilePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden: Access Denied");
    return;
  }

  const rawExt = path.extname(safeFilePath).toLowerCase();
  if (!fs.existsSync(safeFilePath) || fs.statSync(safeFilePath).isDirectory()) {
    if (rawExt && rawExt !== ".html") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }
    if (fs.existsSync(path.join(PUBLIC_DIR, "index.html"))) {
      safeFilePath = path.join(PUBLIC_DIR, "index.html");
    } else {
      safeFilePath = path.join(__dirname, "index.html");
    }
  }

  const ext = path.extname(safeFilePath).toLowerCase();
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
  };

  fs.readFile(safeFilePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Resource Not Found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400"
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log("\n======================================================");
  console.log("🚀 BRAND NAME & .COM DOMAIN BOT DASHBOARD ACTIVE");
  console.log("🌐 Open in browser: http://localhost:" + PORT);
  console.log("⚡ Direct Registry: Official Verisign RDAP Protocol");
  console.log("======================================================\n");
});
