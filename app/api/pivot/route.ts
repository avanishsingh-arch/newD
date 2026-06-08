import { NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_ID    = process.env.SHEET_ID;
const PIVOT_RANGE = process.env.PIVOT_SHEET_RANGE || "Pivot table 1!A1:G20";

export async function GET() {
  try {
    if (!SHEET_ID) return NextResponse.json({ error: "SHEET_ID not set" }, { status: 500 });

    const credJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!credJson) return NextResponse.json({ error: "GOOGLE_CREDENTIALS_JSON not set" }, { status: 500 });

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credJson),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets   = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range:         PIVOT_RANGE,
    });

    const values: string[][] = response.data.values || [];
    if (values.length < 2) return NextResponse.json({ rows: [] });

    const headers = values[0];
    const rows    = values.slice(1).map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h.trim()] = r[i] ?? ""; });
      return obj;
    });

    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}