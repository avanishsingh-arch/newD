# CS Ticket Resolution Dashboard

A Next.js 15 dashboard for visualising Customer Support ticket resolution analytics from a Google Sheet.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local and fill in your Sheet ID and API key

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/dashboard`.

> **No env vars?** The dashboard auto-loads 220 rows of realistic demo data so you can see everything working before connecting your sheet.

---

## Google Sheets Setup

### 1. Get your Sheet ID

From the sheet URL:
```
https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
```

### 2. Create a Google API Key

1. Visit [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services → Library** → search **Google Sheets API** → Enable
4. Go to **APIs & Services → Credentials** → **Create Credentials → API Key**
5. Copy the key, then click **Edit** → Restrict to **Google Sheets API** only

### 3. Make your sheet accessible

**Option A – Public (simplest):**
- Sheet → Share → "Anyone with the link" → Viewer

**Option B – Private (server-side only):**
- Use a Service Account and OAuth2 via a Next.js API route (see below)

### 4. Update .env.local

```env
NEXT_PUBLIC_SHEET_ID=your_sheet_id
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key
NEXT_PUBLIC_SHEET_RANGE=Sheet1!A2:L2000
```

Change `Sheet1` to match your tab name.

---

## Sheet Column Mapping

Your sheet must have these columns in order (row 1 = headers, data from row 2):

| Column | Field            | Example                       |
|--------|------------------|-------------------------------|
| A      | # (Ticket ID)    | 74193                         |
| B      | Type             | Inbound                       |
| C      | Status           | Conversation closed           |
| D      | Channel          | WhatsApp Business API Gupshup |
| E      | Client           | Richa                         |
| F      | Employee (Agent) | Shruti Phapale                |
| G      | Created on       | 20.05.2026 23:38:05           |
| H      | Agent closed on  | 21.05.2026 09:45:17           |
| I      | Initial response time  | 60                      |
| J      | Total response time    | 60                      |
| K      | Average response time  | 60                      |
| L      | Maximum response time  | 60                      |

Dates must be in `DD.MM.YYYY HH:MM:SS` format.

---

## Working Hours Logic

Resolution time is computed as **working minutes only**:

- **Working window:** 10:00 AM to 10:00 PM (22:00) daily
- The raw columns (I–L) from the sheet are stored but **not used** for resolution display
- The dashboard recomputes from `Created on` → `Agent closed on` timestamps
- Nights (10 PM → 10 AM) are excluded from the count

**Example:**
- Created: 21.05.2026 21:00 (9 PM)
- Closed:  22.05.2026 11:00 (11 AM next day)
- Working time: 1h (9–10 PM) + 1h (10–11 AM) = **2h**, not 14h

See `lib/workingHours.ts` → `workingMinutesBetween()` for the implementation.

---

## Features

| Feature | Details |
|---------|---------|
| **L7 / L30 toggle** | Switches all charts and KPIs between last 7 and last 30 days |
| **KPI cards** | Total tickets, resolved, open/pending, avg working-hours resolution |
| **Channel breakdown** | Bar chart per channel (color-coded), dual axis shows ticket count + avg resolution |
| **Daily trend** | Line chart of tickets created vs resolved vs avg resolution time |
| **Agent leaderboard** | Ticket count (with bar), resolution rate badge, avg resolution; sortable by any column |
| **Auto-refresh** | Click ↻ Refresh to pull latest data from the sheet |
| **Demo mode** | Auto-loads fake data if env vars aren't set |

---

## Project Structure

```
cs-ticket-dashboard/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # CSS variables + reset
│   ├── page.tsx            # Redirects / → /dashboard
│   └── dashboard/
│       └── page.tsx        # Main dashboard page
├── components/
│   ├── Header.tsx          # Top bar with L7/L30 toggle
│   ├── StatCard.tsx        # KPI card
│   ├── SectionTitle.tsx    # Section heading
│   ├── ToggleBtn.tsx       # L7/L30 button
│   ├── ChannelChart.tsx    # Channel bar chart (Recharts)
│   ├── TrendChart.tsx      # Daily trend line chart (Recharts)
│   └── AgentTable.tsx      # Sortable agent stats table
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── workingHours.ts     # Core working-hours calculation
│   ├── sheetsApi.ts        # Google Sheets API fetch + parse
│   ├── demoData.ts         # Demo data generator
│   └── utils.ts            # Shared helpers + color maps
├── .env.local.example      # Environment variable template
└── README.md
```

---

## Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Add environment variables in the Vercel dashboard under **Settings → Environment Variables**:
- `NEXT_PUBLIC_SHEET_ID`
- `NEXT_PUBLIC_GOOGLE_API_KEY`
- `NEXT_PUBLIC_SHEET_RANGE` (optional, defaults to `Sheet1!A2:L2000`)

---

## Auto-refresh Every N Minutes

In `app/dashboard/page.tsx`, replace the `useEffect`:

```ts
useEffect(() => {
  load();
  const interval = setInterval(load, 5 * 60 * 1000); // every 5 minutes
  return () => clearInterval(interval);
}, [load]);
```

---

## Private Sheets (OAuth)

For sheets that aren't publicly readable, create `app/api/tickets/route.ts`:

```ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "Sheet1!A2:L2000",
  });
  return NextResponse.json({ values: res.data.values });
}
```

Then update `lib/sheetsApi.ts` to fetch `/api/tickets` instead of the Sheets API directly.
