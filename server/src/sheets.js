// Thin data-access layer over the Google Sheets API.
// Each tab is treated as a table: row 1 holds headers, every later row is a record.
// Records use camelCase keys derived from the headers ("Total amount" -> totalAmount)
// and carry `id` = the 1-based sheet row number, so a row can be updated in place.
import { sheets as sheetsApi, auth as googleAuth } from '@googleapis/sheets';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let client;

function getClient() {
  if (client) return client;

  // On a host like Vercel the key is passed as a JSON string; locally it's a file path.
  const options = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? { credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON), scopes: SCOPES }
    : { keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account.json', scopes: SCOPES };

  client = sheetsApi({ version: 'v4', auth: new googleAuth.GoogleAuth(options) });
  return client;
}

function spreadsheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEET_ID is not set');
  return id;
}

export function toCamelCase(header) {
  const words = String(header).trim().split(/[^A-Za-z0-9]+/).filter(Boolean);
  return words
    .map((w, i) => (i === 0 ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1)))
    .join('');
}

const isBlank = (v) => v === '' || v === null || v === undefined;

async function getValues(range) {
  const res = await getClient().spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range,
    // Raw numbers (so "$40" formatting never breaks math), but dates/times as the sheet displays them.
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });
  return res.data.values || [];
}

export async function readTab(tab) {
  const [headerRow = [], ...rows] = await getValues(`'${tab}'`);
  const keys = headerRow.map(toCamelCase);

  return rows.flatMap((row, i) => {
    if (row.every(isBlank)) return [];
    const record = { id: i + 2 };
    keys.forEach((key, col) => {
      if (key) record[key] = row[col] ?? '';
    });
    return [record];
  });
}

async function headerKeys(tab) {
  const [headerRow = []] = await getValues(`'${tab}'!1:1`);
  return headerRow.map(toCamelCase);
}

// Writes are RAW so text like "9/15/2026, 8:30:34 PM" is stored exactly as sent.
export async function updateRow(tab, id, fields) {
  const keys = await headerKeys(tab);
  const [existing = []] = await getValues(`'${tab}'!A${id}:${id}`);
  const row = keys.map((key, col) => (key in fields ? fields[key] : existing[col] ?? ''));

  await getClient().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `'${tab}'!A${id}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
  return { id, ...Object.fromEntries(keys.map((k, i) => [k, row[i]])) };
}

export async function appendRow(tab, fields) {
  const keys = await headerKeys(tab);
  const row = keys.map((key) => fields[key] ?? '');

  const res = await getClient().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `'${tab}'!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
  // updatedRange looks like "'Notes'!A4:C4"
  const id = Number(res.data.updates?.updatedRange?.match(/![A-Z]+(\d+)/)?.[1]);
  return { id, ...Object.fromEntries(keys.map((k, i) => [k, row[i]])) };
}
