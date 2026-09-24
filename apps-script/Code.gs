// ==========================================
//           1. CONFIGURATION BLOCK
// ==========================================
// Secrets and personal details are read from Script Properties
// (Apps Script editor → Project Settings → Script Properties), never hard-coded:
//
//   TELEGRAM_TOKEN   bot token from @BotFather
//   WEB_APP_URL      this script's /exec deployment URL
//   FAMILY_MEMBERS   JSON map of Telegram user id → name, e.g. {"111111111":"Alex","222222222":"Sam"}
//   KIDS_NAMES       JSON array of lowercase names, e.g. ["kidone","kidtwo"]
//
const PROPS = PropertiesService.getScriptProperties();

const TELEGRAM_TOKEN = PROPS.getProperty('TELEGRAM_TOKEN');
const WEB_APP_URL = PROPS.getProperty('WEB_APP_URL');

const EXPENSE_SHEET = 'Expenses';
const HEALTH_SHEET = 'Health';
const REMINDER_SHEET = 'Reminders';
const CALENDAR_ID = 'primary';

const FAMILY_MEMBERS = JSON.parse(PROPS.getProperty('FAMILY_MEMBERS') || '{}');

// Only family members may use the bot
const ALLOWED_USERS = Object.keys(FAMILY_MEMBERS).map(Number);

const KIDS_NAMES = JSON.parse(PROPS.getProperty('KIDS_NAMES') || '[]');

// ==========================================
//          2. MAIN WEBHOOK LOGIC
// ==========================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return returnOk();
    }

    const contents = JSON.parse(e.postData.contents);

    // ---- DUPLICATE GUARD #1: update_id ----
    if (contents.update_id && isDuplicateUpdateId(contents.update_id)) {
      return returnOk();
    }

    const message = contents.message;
    if (!message || !message.text) {
      return returnOk();
    }

    const senderId = message.from.id;
    const chatId = message.chat.id;
    const messageId = message.message_id;
    const rawText = message.text.trim();
    const lowerText = rawText.toLowerCase();

    // Security check
    if (!ALLOWED_USERS.includes(senderId)) {
      return sendReplyToTelegram(chatId, '⚠️ You are not authorized to use this tracker.');
    }

    const senderName = FAMILY_MEMBERS[senderId] || 'Unknown';

    // ---- DUPLICATE GUARD #2: chat_id + message_id ----
    const sourceKey = `${chatId}_${messageId}`;
    if (isDuplicateSourceKey(sourceKey)) {
      return returnOk();
    }

    // Health detector
    const isHealthEntry = lowerText.includes('kg') || lowerText.includes('lbs') || lowerText.includes('weight');

    // Try reminder parsing first
    const parsedReminder = parseReminderNatural(rawText);

    if (parsedReminder) {
      if (hasReminderSourceKeyInSheet(sourceKey)) {
        return returnOk();
      }

      const calResult = createGoogleCalendarEvent(
        parsedReminder.title,
        parsedReminder.date,
        parsedReminder.time
      );

      if (calResult.ok) {
        logToReminderSheet(parsedReminder.title, parsedReminder.date, parsedReminder.time, sourceKey, calResult.eventId);
        return sendReplyToTelegram(chatId, `✅ Reminder saved + Calendar created: "${parsedReminder.title}" on ${parsedReminder.date} at ${parsedReminder.displayTime}`);
      } else {
        logToReminderSheet(parsedReminder.title, parsedReminder.date, parsedReminder.time, sourceKey, '');
        return sendReplyToTelegram(chatId, `⚠️ Reminder saved, but Calendar failed: ${calResult.error}`);
      }
    }

    // Not reminder -> health/expense
    const numberMatch = lowerText.match(/(\d+(?:\.\d{1,2})?)/);
    const extractedNumber = numberMatch ? parseFloat(numberMatch[0]) : null;

    if (extractedNumber === null || Number.isNaN(extractedNumber)) {
      return sendReplyToTelegram(chatId, "⚠️ Could not parse. Example reminder: team meeting 4pm sept 18");
    }

    // HEALTH
    if (isHealthEntry) {
      // A name in the message ("poonam 54kg") wins over the sender, so anyone
      // in the family can log a weight for anyone else.
      const knownNames = Object.values(FAMILY_MEMBERS).concat(KIDS_NAMES);
      const words = lowerText.split(/[^a-z]+/);
      const mentioned = knownNames.find((name) => words.includes(name.toLowerCase()));
      const targetName = mentioned
        ? mentioned.charAt(0).toUpperCase() + mentioned.slice(1).toLowerCase()
        : senderName;

      const unit = lowerText.includes('lbs') ? 'lbs' : 'kg';
      const weightString = extractedNumber + unit;
      logToHealthSheet(targetName, weightString);
      return sendReplyToTelegram(chatId, `⚖️ Health Logged: ${targetName}'s weight updated to ${weightString}.`);
    }

    // EXPENSE
    let itemDescription = rawText;
    if (numberMatch && numberMatch[0]) {
      itemDescription = rawText.replace(numberMatch[0], '').trim();
    }
    if (!itemDescription) itemDescription = 'Uncategorized';

    const isRecurring =
      lowerText.startsWith('rec ') ||
      lowerText.includes('mortgage') ||
      lowerText.includes('utility') ||
      lowerText.includes('bill') ||
      lowerText.includes('insurance') ||
      lowerText.includes('subscription');

    const expenseType = isRecurring ? 'Recurring' : 'Normal';
    if (lowerText.startsWith('rec ')) {
      itemDescription = itemDescription.replace(/^rec\s+/i, '').trim();
      if (!itemDescription) itemDescription = 'Uncategorized';
    }

    logToExpenseSheet(extractedNumber, itemDescription, expenseType);
    const statusIcon = isRecurring ? '🔄' : '✅';
    return sendReplyToTelegram(chatId, `${statusIcon} ${expenseType} Expense Logged: $${extractedNumber} for "${itemDescription}".`);

  } catch (error) {
    Logger.log('Error processing doPost: ' + error.toString());
    return returnOk();
  }
}

// ==========================================
//   3. FAST DUPLICATE PROTECTION (CACHE)
// ==========================================
function isDuplicateUpdateId(updateId) {
  const cache = CacheService.getScriptCache();
  const key = "UPD_" + updateId;
  if (cache.get(key)) return true;
  cache.put(key, "1", 600); 
  return false;
}

function isDuplicateSourceKey(sourceKey) {
  const cache = CacheService.getScriptCache();
  const key = "MSG_" + sourceKey;
  if (cache.get(key)) return true;
  cache.put(key, "1", 600);
  return false;
}

function hasReminderSourceKeyInSheet(sourceKey) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REMINDER_SHEET);
  if (!sheet) return false;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const sourceCol = headers.indexOf('SourceKey') + 1;
  if (sourceCol <= 0) return false;

  const values = sheet.getRange(2, sourceCol, lastRow - 1, 1).getValues().flat();
  return values.includes(sourceKey);
}

// ==========================================
// 4. NATURAL REMINDER PARSER (AM/PM + 24H)
// ==========================================
function parseReminderNatural(rawText) {
  const text = rawText.trim();

  const timeRegex = /(\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b|\b(?:[01]?\d|2[0-3]):[0-5]\d\b)/i;
  const timeMatch = text.match(timeRegex);
  if (!timeMatch) return null;

  const rawTimeOriginal = timeMatch[1].trim();
  const timeVal = normalizeTimeTo24h(rawTimeOriginal);
  if (!timeVal) return null;

  const dateRegex = /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}|today|tomorrow|tonight)\b/i;
  const dateMatch = text.match(dateRegex);
  if (!dateMatch) return null;

  const dateVal = normalizeDatePhrase(dateMatch[1]);
  if (!dateVal) return null;

  let title = text
    .replace(timeMatch[0], '')
    .replace(dateMatch[0], '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) title = 'Reminder';

  return {
    title,
    date: dateVal,
    time: timeVal,
    displayTime: rawTimeOriginal
  };
}

function normalizeTimeTo24h(input) {
  if (!input) return null;

  let t = String(input)
    .toLowerCase()
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, '')
    .replace(/\./g, '');

  let m = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;

  m = t.match(/^(\d{1,2})(?::([0-5]\d))?(am|pm)$/);
  if (!m) return null;

  let hour = parseInt(m[1], 10);
  const minute = m[2] || '00';
  const ampm = m[3];

  if (hour < 1 || hour > 12) return null;

  if (ampm === 'am' && hour === 12) hour = 0;
  if (ampm === 'pm' && hour !== 12) hour += 12;

  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function normalizeDatePhrase(input) {
  const now = new Date();
  const v = input.trim().toLowerCase();

  if (v === 'today') return formatDateYMD(now);

  if (v === 'tomorrow' || v === 'tonight') {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return formatDateYMD(t);
  }

  const m = v.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})$/i);
  if (!m) return null;

  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11
  };

  const mon = monthMap[m[1].toLowerCase()];
  const day = parseInt(m[2], 10);
  const year = now.getFullYear();

  const d = new Date(year, mon, day);
  if (d.getMonth() !== mon || d.getDate() !== day) return null;

  return formatDateYMD(d);
}

function formatDateYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ==========================================
//          5. STORAGE FUNCTIONS
// ==========================================
function logToExpenseSheet(amount, comment, type) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EXPENSE_SHEET);
  sheet.appendRow([new Date(), amount, comment, type]);
}

function logToHealthSheet(name, weight) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HEALTH_SHEET);
  sheet.appendRow([new Date(), name, weight]);
}

function logToReminderSheet(title, dateVal, timeVal, sourceKey, eventId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REMINDER_SHEET);
  ensureReminderHeaders(sheet);
  sheet.appendRow([new Date(), title, dateVal, timeVal, sourceKey, eventId || '']);
}

function ensureReminderHeaders(sheet) {
  const desired = ['Timestamp', 'Title', 'Date', 'Time', 'SourceKey', 'EventId'];
  const lastCol = Math.max(sheet.getLastColumn(), desired.length);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, desired.length).setValues([desired]);
    return;
  }

  const current = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let changed = false;

  desired.forEach((h, idx) => {
    if (current[idx] !== h) {
      current[idx] = h;
      changed = true;
    }
  });

  if (changed) {
    sheet.getRange(1, 1, 1, lastCol).setValues([current]);
  }
}

// ==========================================
//      6. GOOGLE CALENDAR SYNC HELPER
// ==========================================
function createGoogleCalendarEvent(title, dateStr, timeStr) {
  try {
    const cal = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!cal) return { ok: false, error: `Calendar not found for ID: ${CALENDAR_ID}` };

    const start = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(start.getTime())) return { ok: false, error: `Invalid date/time: ${dateStr} ${timeStr}` };

    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const event = cal.createEvent(title || 'Reminder', start, end, {
      description: 'Added via Telegram Bot'
    });
    event.addPopupReminder(10);

    Logger.log(`Calendar event created: "${title}" at ${start} | eventId=${event.getId()}`);
    return { ok: true, eventId: event.getId() };
  } catch (e) {
    Logger.log('Error creating Calendar event: ' + e.toString());
    return { ok: false, error: e.message || e.toString() };
  }
}

// ==========================================
//    7. STRICT JSON RESPONSE HELPERS
// ==========================================
// ==========================================
//    7. WEBHOOK RESPONSE HELPERS (FIXED)
// ==========================================
function returnOk() {
  // Returning undefined forces Google Apps Script to send a standard HTTP 200 OK
  // without triggering a 302 redirect. 
  return;
}

function sendReplyToTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: chatId,
      text: text
    }),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Error sending Telegram reply: " + e.toString());
  }
  
  // Return nothing to ensure a clean 200 OK to the webhook
  return returnOk();
}

// ==========================================
//      8. SETUP & DEBUG HELPERS
// ==========================================
function forceCalendarAuth() {
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  Logger.log(`Calendar: ${cal ? cal.getName() : 'NOT FOUND'} | ID: ${CALENDAR_ID}`);
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log(`Spreadsheet: ${sheet.getName()}`);
}

function forceSetTelegramWebhook() {
  const dropPendingUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${WEB_APP_URL}&drop_pending_updates=true`;
  const response = UrlFetchApp.fetch(dropPendingUrl);
  Logger.log("Telegram Webhook Setup Result: " + response.getContentText());
}