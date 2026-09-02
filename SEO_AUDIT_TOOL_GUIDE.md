# Quick Guide: Running SEO Audit Console (`houtini-ai/seo-audit`)

This guide explains how to set up and run the [**SEO Audit Console**](https://github.com/houtini-ai/seo-audit) (`@houtini/seo-audit-console`) MCP tool for **Voya House**.

---

## 1. What is SEO Audit Console?

Traditional tools (like Lighthouse or generic crawlers) only inspect what your site currently outputs. **SEO Audit Console** is a Model Context Protocol (MCP) server that merges two datasets:

1. **Your live site crawl** (what your site says).
2. **Google Search Console (GSC)** historical data (what Google actually sees, ranks, and serves).

It runs **93 technical and strategic checks** (crawlability, indexation, canonicals, hreflang, structured data, Core Web Vitals, cannibalization, AI search readiness) and ranks findings by **expected clicks per dev-hour** with ready-to-apply fixes.

---

## 2. Prerequisites

1. **Node.js ≥ 20** (`node -v`)
2. **Google Search Console Property** for your domain (e.g., `sc-domain:voyahouse.com` or URL-prefix property).
3. **Google Cloud Service Account JSON Key** with Search Console API access (details below).
4. **An MCP client**: Claude Code, Claude Desktop, Antigravity / Gemini CLI, Cursor, etc.

---

## 3. Step-by-Step GSC Connection (10 Minutes)

### Step 1: Enable Search Console API
1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a project.
3. Go to **APIs & Services** → **Library**, search for **Google Search Console API**, and click **Enable**.

### Step 2: Create a Service Account & Download Key
1. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account**.
2. Name it (e.g. `seo-auditor`), and click **Done**.
3. Click on the created service account, go to the **Keys** tab → **Add Key** → **Create new key** → **JSON**.
4. Save the downloaded `.json` file securely on your machine (e.g. `~/.config/gsc-key.json`).  
   ⚠️ *Never commit this JSON file to git!*

### Step 3: Add Service Account to Google Search Console (CRITICAL)
> **The step most people miss:** Service accounts are individual robot identities.
1. Open [Google Search Console](https://search.google.com/search-console).
2. Select your property (`sc-domain:voyahouse.com` or your verified domain).
3. Navigate to **Settings** → **Users and permissions** → **Add user**.
4. Paste the service account email (ends with `.iam.gserviceaccount.com`).
5. Grant permission: **Full** (or **Owner**).

---

## 4. MCP Configuration

### Option A: Using `npx` in Claude Code / CLI (Recommended)

Run this in your terminal:

```bash
claude mcp add seo-audit-console \
  --env GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/gsc-key.json" \
  -- npx -y @houtini/seo-audit-console
```

### Option B: Project-level `.mcp.json` (Local to repo)

Add to your `.mcp.json` or MCP settings:

```json
{
  "mcpServers": {
    "seo-audit-console": {
      "command": "npx",
      "args": ["-y", "@houtini/seo-audit-console"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/absolute/path/to/gsc-key.json",
        "SAC_DATA_DIR": "./.seo-audit-data"
      }
    }
  }
}
```

### Option C: Claude Desktop Config

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "seo-audit-console": {
      "command": "npx",
      "args": ["-y", "@houtini/seo-audit-console"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/absolute/path/to/gsc-key.json"
      }
    }
  }
}
```

*(Optional API keys you can add to `env` later if you want competitor & backlink data: `DATAFORSEO_USERNAME`, `DATAFORSEO_PASSWORD`, `MAJESTIC_API_KEY`).*

---

## 5. How to Run Audits (Interactive Prompts)

Once the MCP server is active in your chat session, you interact with it naturally:

### 1. Test Connection
```text
list properties
```
*Confirms your GSC property is accessible.*

### 2. Initial Sync & First-Party Crawl
```text
Refresh sc-domain:voyahouse.com
```
*This pulls GSC click/impression history, starts an internal crawl, maps your sitemap, and computes your internal link PageRank graph.*

### 3. Run the Full Prioritized Audit
```text
Run an SEO audit on voyahouse.com
```
*Returns ranked findings ordered by expected clicks per developer-hour (Crawlability, Indexation, Hreflang, Schema, CWV, Content).*

### 4. Ask for Direct Code Fixes
```text
generate the fix for #1
```
or
```text
Show me the cannibalisation findings with evidence
```
or
```text
Score the passages on voyahouse.com for AI-search readiness
```

---

## 6. How it Complements Voya House's Current Setup

| Audit Focus | What Voya House Already Has | What SEO Audit Console Tests |
|---|---|---|
| **Bilingual Hreflang** | `/en` and `/ar` alternates with `x-default` | Verifies bidirectional tag loops & flags indexed ghost URLs |
| **Structured Data** | `WebSite`, `Organization`, `CafeOrCoffeeShop`, 2 `Restaurant` departments | Validates rich result eligibility against live Google search signals |
| **Robots & Sitemap** | `robots.ts` & `sitemap.ts` | Detects blocked pages receiving clicks or unindexed high-value URLs |
| **Search Yield** | High-contrast editorial copy & metadata | Identifies queries with high impressions but low CTR to recommend title/description rewrites |
