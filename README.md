# 🌐 Domain Finder

> **Find brandable domains that are 100% free to be taken — instantly.**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-00e5ff?style=for-the-badge&logo=github)](https://zcross091.github.io/Domain-Finder/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ff87.svg?style=for-the-badge)](LICENSE)
[![Zero External Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Native)-a855f7?style=for-the-badge)](package.json)
[![RDAP Protocol](https://img.shields.io/badge/Protocol-Official%20RDAP%20Registry-ffb830?style=for-the-badge)](https://www.verisign.com/en_US/channel-resources/domain-registry-products/rdap/index.xhtml)

An automated registry discovery engine that synthesizes high-value brand names across multiple archetypes and checks real-time domain availability directly against official authoritative RDAP registries (Verisign, PIR, Identity Digital, Google Registry) and Cloudflare DNS-over-HTTPS.

Runs **100% natively in the browser on GitHub Pages**, as a **local web dashboard**, or as an **automated terminal radar bot**.

---

## ⚡ Live Demo (Zero Install Required)

👉 **Launch Domain Finder in your browser:**  
### **[https://zcross091.github.io/Domain-Finder/](https://zcross091.github.io/Domain-Finder/)**

- **Zero backend required:** 100% client-side browser execution.
- **Zero data tracking:** All queries go directly from your browser to authoritative registries.
- **Real-time streaming cards:** Live verification status updates without page reload.
- **1-Click claim:** Direct registrar links to claim available domains instantly.
- **1-Click clipboard export:** Copy all unclaimed domains in one click.

---

## 🚀 Three Ways to Run

### 1. GitHub Pages (Native Browser App)
Simply open the repository on GitHub Pages or fork and deploy:
1. Go to **Settings** → **Pages** in your GitHub repository.
2. Under **Build and deployment** > **Source**, choose **Deploy from a branch** (`main` / `root`) or select **GitHub Actions** (workflow already included at `.github/workflows/deploy.yml`).
3. Your app is live immediately!

---

### 2. Interactive Local Web Dashboard

Start the high-performance local server (zero npm dependencies required):

```powershell
# Clone the repository
git clone https://github.com/Zcross091/Domain-Finder.git
cd Domain-Finder

# Start local server
node server.js
```

Open your browser to:
👉 **`http://localhost:4000`**

**Features:**
- **Naming Engines:**
  - **Two-Word Compounds:** (*PeakPulse*, *VanguardFlow*, *CrestLine*)
  - **Synthetic Tech / Neologisms:** (*Stratis*, *Veltis*, *Kynex*)
  - **Minimalist Brandmarks:** Punchy 5–7 character names (*Velix*, *Straton*)
  - **Agency & Growth Brands:** (*ApexGrowth*, *PulseDigital*, *NorthMedia*)
- **Multi-TLD Radar:** `.com`, `.net`, `.org`, `.io`, `.dev`, `.app` + any custom TLD
- **Single Domain Probe:** Instantly verify any domain name with 1 click
- **Filter Available:** Toggle between all scanned candidates and unclaimed ones
- **Batch Export:** One-click copy of all confirmed available domains

---

### 3. Automated CLI Radar Bot (Terminal Mode)

For high-speed automated domain hunting directly in your terminal:

```powershell
# Run default batch of 25 candidates (.com)
node bot.js

# Hunt with a specific seed keyword
node bot.js --keyword=flux --count=30

# Target two-word compounds across multiple TLDs
node bot.js --theme=compound --tld=com,io,net --count=40

# Only print unclaimed domains (silent scan)
node bot.js --keyword=apex --only-available

# Display full CLI manual & options
node bot.js --help
```

#### CLI Options:
| Flag | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `--keyword=<seed>` | Base keyword to build brand variations around | `""` | `--keyword=pulse` |
| `--theme=<type>` | Archetype: `all`, `compound`, `invented`, `short`, `agency` | `all` | `--theme=invented` |
| `--count=<N>` | Number of domain candidates to synthesize (1–100) | `25` | `--count=50` |
| `--tld=<ext>` | Comma-separated TLDs to inspect | `com` | `--tld=com,io,org` |
| `--concurrency=<N>`| Parallel registry check workers (1–8) | `3` | `--concurrency=4` |
| `--only-available` | Suppress registered domains, showing only available hits | `false` | `--only-available` |

---

## 🔬 Technical Verification Architecture

Unlike basic WHOIS parsers that get blocked or produce false positives, Domain Finder uses a multi-layer consensus architecture:

```
                  ┌──────────────────────────────────────────────┐
                  │          Candidate Domain Synthesizer        │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Layer 1: Official Authoritative RDAP      │
                  │  (Verisign, PIR, Identity Digital, Google)   │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
           HTTP 404 (Not Found)            HTTP 200 (Registered)
                 │                               │
                 ▼                               ▼
  ┌──────────────────────────────┐        [ ✕ TAKEN ]
  │ Layer 2: DNS Consensus Cross │
  │   (Cloudflare DoH / Google)  │
  └──────────────┬───────────────┘
                 │
         Status 3: NXDOMAIN
                 │
                 ▼
      [ ● CONFIRMED AVAILABLE ]
```

1. **Layer 1: Authoritative RDAP (Registration Data Access Protocol - RFC 9082/9083):**
   - `.com` & `.net` → **Verisign RDAP** (`https://rdap.verisign.com/`)
   - `.org` → **Public Interest Registry (PIR)** (`https://rdap.publicinterestregistry.org/`)
   - `.io` → **Identity Digital** (`https://rdap.identitydigital.services/`)
   - `.dev` & `.app` → **Google Registry** (`https://pubapi.registry.google/`)
   - Other TLDs → **RDAP.org / IANA Bootstrap Redirector**
   - **Status `404 Not Found`** → Domain is not registered in the authoritative zone.
   - **Status `200 OK`** → Domain is currently registered.

2. **Layer 2: DNS-over-HTTPS Consensus Cross-Check (RFC 8484):**
   - Queries **Cloudflare DoH** (`https://cloudflare-dns.com/dns-query`) and **Google DoH** (`https://dns.google/resolve`).
   - Confirms `NXDOMAIN` (Status 3) status to ensure no active DNS zone or unlisted delegation exists.

3. **CORS & Zero-Broker Security:**
   - All chosen registry endpoints send standard `access-control-allow-origin: *` headers, allowing pure client-side verification directly inside your browser on GitHub Pages without any proxy or middleman server.

---

## 📁 Repository Structure

```
Domain-Finder/
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages CI/CD workflow
├── docs/
│   └── index.html          # Fallback deployment folder for GitHub Pages
├── public/
│   └── index.html          # Local server static assets
├── .gitignore              # Git ignore rules
├── bot.js                  # CLI Terminal Radar scanner
├── checker.js              # Authoritative RDAP & DoH verification module
├── generator.js            # Algorithmic brand synthesis engine
├── index.html              # Standalone client-side application (GitHub Pages root)
├── package.json            # Node metadata & scripts
├── README.md               # Documentation & manual
└── server.js               # Zero-dependency local dashboard server
```

---

## 🛠️ Zero Dependencies

Domain Finder is built with pure native web standards:
- **Zero npm dependencies** — runs out of the box with standard Node.js runtime.
- **Pure HTML5 / Vanilla CSS3 / Modern JavaScript (ES2022)**.
- **Zero build steps required** — edit and run instantly.

---

## 📄 License

MIT © [Zcross091](https://github.com/Zcross091) — Free for personal and commercial brand discovery.
