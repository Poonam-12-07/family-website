# Family Dashboard (SpendWise)

A family dashboard for expenses, reminders, health and shared notes. The data comes from plain-text messages sent to a Telegram bot.

```
Telegram ──webhook──▶ Google Apps Script ──▶ Google Sheet ◀── Express API ◀── React app
 "petrol 70"           parses the message      (the database)    (service account)
 "dentist 4pm oct 3"   + creates Calendar events
 "liana 19kg"
```

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend | Node.js, Express 5, Google Sheets API (service account) |
| Database | Google Sheets (`Expenses`, `Reminders`, `Health`, `Notes` tabs) |
| Ingestion | Google Apps Script (Telegram webhook, Google Calendar) |

## Pages
- **Expense Tracker**: totals, a monthly bar chart, a category donut (auto-categorized from shop names) and the ledger.
- **Monthly Reminders**: reminders grouped by month, color-coded per month.
- **Health Tracker**: latest weight, per-person weight trend lines and the log.
- **Family Board**: two editable notes, saved back to the sheet.

## Project layout
```
client/        React app (Vite). Dev server proxies /api → localhost:3001
server/        Express API over Google Sheets
apps-script/   Telegram bot / ingestion script (Code.gs)
```

## API
| Method | Path | Description |
|---|---|---|
| GET | `/api/expenses` | Rows from the Expenses tab |
| GET | `/api/reminders` | Rows from the Reminders tab |
| GET | `/api/health` | Rows from the Health tab |
| GET | `/api/notes` | Rows from the Notes tab |
| POST | `/api/notes` | Add a note `{ user, note, timestamp }` |
| PUT | `/api/notes/:id` | Update the note in sheet row `id` |
| GET | `/api/config` | Display config: family names, note boards, weather location |

Rows are returned as objects keyed by the camelCased column header (`Total amount` → `totalAmount`). `id` is the sheet row number. Blank rows are skipped.

## Running locally

**Prerequisites:** Node.js 22+ and a Google Cloud service account that has Editor access to the sheet (see below).

```bash
npm install
cp server/.env.example server/.env    # then fill in the values
# put the service account key at server/service-account.json
npm run dev
```
Open http://localhost:5173.

### Google service account
1. In [Google Cloud Console](https://console.cloud.google.com), create a project and enable the **Google Sheets API**.
2. Go to **IAM & Admin → Service Accounts → Create service account**. No roles are needed.
3. Open the account, go to **Keys → Add key → JSON**, and save the file as `server/service-account.json`.
4. Share the Google Sheet with the service account's email as an **Editor**.

## Apps Script (Telegram bot)
`apps-script/Code.gs` is the bot. It reads secrets from **Script Properties** rather than from the code:

| Property | Example |
|---|---|
| `TELEGRAM_TOKEN` | token from @BotFather |
| `WEB_APP_URL` | `https://script.google.com/macros/s/.../exec` |
| `FAMILY_MEMBERS` | `{"111111111":"Alex","222222222":"Sam"}` (Telegram user id → name) |
| `KIDS_NAMES` | `["kidone","kidtwo"]` |

It understands three kinds of message:
- **Reminder:** has a time and a date. `team meeting 4pm sept 18` → Reminders tab + a Google Calendar event.
- **Health:** mentions `kg`, `lbs` or `weight`. `liana 19kg` → Health tab.
- **Expense:** anything else with a number. `petrol 70` → Expenses tab. Messages starting with `rec`, or mentioning bills, insurance and so on, are marked Recurring.

## Deployment
The plan is Vercel: the client as a static build and the Express app as a serverless function. On Vercel, set `GOOGLE_SERVICE_ACCOUNT_JSON` (the key file's contents) instead of `GOOGLE_APPLICATION_CREDENTIALS`.
