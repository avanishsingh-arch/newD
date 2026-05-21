import { NextResponse } from "next/server";
import { google } from "googleapis";

const SHEET_ID    = process.env.SHEET_ID;
const SHEET_RANGE = process.env.SHEET_RANGE || "Sheet1!A2:L2000";

export async function GET() {
  try {
    if (!SHEET_ID) {
      return NextResponse.json(
        { error: "SHEET_ID env var not set" },
        { status: 500 }
      );
    }

    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!credentialsJson) {
      return NextResponse.json(
        { error: "GOOGLE_CREDENTIALS_JSON env var not set" },
        { status: 500 }
      );
    }

    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    return NextResponse.json({ values: response.data.values || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/tickets]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
