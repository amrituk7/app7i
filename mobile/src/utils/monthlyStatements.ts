import type { Invoice } from "../types";
import { PDFBuilder, estimateTextWidth } from "./pdfBuilder";

export type MonthlyStatement = {
  /** YYYY-MM key, e.g. "2026-06". */
  key: string;
  /** Display label, e.g. "June 2026". */
  label: string;
  /** Short label, e.g. "Jun 2026". */
  shortLabel: string;
  /** First day of the month, used for sorting. */
  date: Date;
  /** Total earnings in the month (paid invoices only). */
  total: number;
  /** Number of paid invoices in the month. */
  count: number;
  /** All paid invoices in the month, newest first. */
  invoices: Invoice[];
  /** Number of unique students who paid in the month. */
  uniqueStudents: number;
  /** Whether this statement is for the current calendar month. */
  isCurrent: boolean;
  /** How many months ago this statement is from the current month (0 = current, 1 = last month, etc.). */
  monthsAgo: number;
};

function parseInvoiceDate(invoice: Invoice): Date | null {
  if (!invoice.dueDate) return null;
  const d = new Date(`${invoice.dueDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/**
 * Group paid invoices into monthly statements. Returns newest-first.
 * Only includes months that actually had paid activity — empty months are skipped.
 */
export function buildMonthlyStatements(paidInvoices: Invoice[], now = new Date()): MonthlyStatement[] {
  const buckets = new Map<string, { date: Date; invoices: Invoice[] }>();

  for (const invoice of paidInvoices) {
    const date = parseInvoiceDate(invoice);
    if (!date) continue;
    const key = monthKey(date);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { date: new Date(date.getFullYear(), date.getMonth(), 1), invoices: [] };
      buckets.set(key, bucket);
    }
    bucket.invoices.push(invoice);
  }

  const statements: MonthlyStatement[] = [];
  const todayMonthKey = monthKey(now);

  for (const [key, bucket] of buckets) {
    const sortedInvoices = [...bucket.invoices].sort((a, b) => {
      const ad = parseInvoiceDate(a)?.getTime() ?? 0;
      const bd = parseInvoiceDate(b)?.getTime() ?? 0;
      return bd - ad;
    });
    const total = sortedInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const uniqueStudents = new Set(sortedInvoices.map((inv) => inv.studentName || "")).size;
    statements.push({
      key,
      label: bucket.date.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      shortLabel: bucket.date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      date: bucket.date,
      total,
      count: sortedInvoices.length,
      invoices: sortedInvoices,
      uniqueStudents,
      isCurrent: key === todayMonthKey,
      monthsAgo: monthsBetween(bucket.date, new Date(now.getFullYear(), now.getMonth(), 1)),
    });
  }

  return statements.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Build a single "statement" object covering an arbitrary date range. Used for
 * tax-year summaries (Apr→Apr) and per-student exports.
 */
export function buildRangeStatement(
  invoices: Invoice[],
  options: {
    label: string;
    shortLabel: string;
    startIso?: string;
    endIso?: string;
    studentNameFilter?: string;
    studentIdFilter?: string;
  },
): MonthlyStatement {
  const filtered = invoices.filter((inv) => {
    if (options.startIso && (inv.dueDate || "") < options.startIso) return false;
    if (options.endIso && (inv.dueDate || "") > options.endIso) return false;
    if (options.studentNameFilter && inv.studentName !== options.studentNameFilter) return false;
    if (options.studentIdFilter && inv.studentId !== options.studentIdFilter) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    const ad = parseInvoiceDate(a)?.getTime() ?? 0;
    const bd = parseInvoiceDate(b)?.getTime() ?? 0;
    return bd - ad;
  });
  const total = sorted.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const uniqueStudents = new Set(sorted.map((inv) => inv.studentName || "")).size;
  return {
    key: `range-${options.startIso || "all"}-${options.endIso || "all"}-${options.studentIdFilter || ""}`,
    label: options.label,
    shortLabel: options.shortLabel,
    date: options.startIso ? new Date(`${options.startIso}T00:00:00`) : new Date(0),
    total,
    count: sorted.length,
    invoices: sorted,
    uniqueStudents,
    isCurrent: false,
    monthsAgo: 0,
  };
}

/**
 * Format a statement as plain-text CSV ready to share via the React Native
 * Share API. Includes a header summary and one row per invoice.
 */
export function statementToCSV(statement: MonthlyStatement, instructorName?: string): string {
  const lines: string[] = [];
  lines.push(`App7i Earnings Statement`);
  lines.push(`Month,${statement.label}`);
  if (instructorName) lines.push(`Instructor,${escapeCSV(instructorName)}`);
  lines.push(`Total earned,£${statement.total.toFixed(2)}`);
  lines.push(`Paid lessons,${statement.count}`);
  lines.push(`Unique students,${statement.uniqueStudents}`);
  lines.push("");
  lines.push("Date,Student,Amount,Status,Reference");
  for (const inv of statement.invoices) {
    lines.push(
      [
        escapeCSV(inv.dueDate || ""),
        escapeCSV(inv.studentName || ""),
        `£${(inv.amount || 0).toFixed(2)}`,
        escapeCSV(inv.status || ""),
        escapeCSV(inv.id || ""),
      ].join(","),
    );
  }
  lines.push("");
  lines.push(`Generated,${new Date().toISOString()}`);
  return lines.join("\n");
}

/** Plain-text summary suitable for messaging apps. */
export function statementToPlainText(statement: MonthlyStatement, instructorName?: string): string {
  const lines: string[] = [];
  lines.push(`📒 ${statement.label} — App7i Earnings`);
  if (instructorName) lines.push(`Instructor: ${instructorName}`);
  lines.push("");
  lines.push(`Total earned: £${statement.total.toFixed(2)}`);
  lines.push(`Paid lessons: ${statement.count}`);
  lines.push(`Unique students: ${statement.uniqueStudents}`);
  lines.push("");
  lines.push("Lessons:");
  for (const inv of statement.invoices) {
    lines.push(
      `• ${inv.dueDate || "—"} ${inv.studentName || "Student"} — £${(inv.amount || 0).toFixed(2)}`,
    );
  }
  return lines.join("\n");
}

function escapeCSV(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeHTML(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatGBP(amount: number): string {
  return `£${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Build a self-contained HTML statement that looks like a bank statement.
 * Opens in any browser, prints to PDF cleanly, can be emailed as-is.
 */
export function statementToHTML(statement: MonthlyStatement, instructorName?: string): string {
  const periodStart = new Date(statement.date.getFullYear(), statement.date.getMonth(), 1);
  const periodEnd = new Date(statement.date.getFullYear(), statement.date.getMonth() + 1, 0);
  const generated = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows = statement.invoices
    .map((inv, i) => `
        <tr>
          <td class="num">${i + 1}</td>
          <td>${formatDate(inv.dueDate || "")}</td>
          <td>${escapeHTML(inv.studentName || "Student")}</td>
          <td>${escapeHTML((inv.status || "paid").toUpperCase())}</td>
          <td class="amount">${formatGBP(inv.amount || 0)}</td>
        </tr>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>App7i Earnings Statement — ${escapeHTML(statement.label)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1c1c1e;
    margin: 0;
    padding: 32px;
    background: #f2f2f7;
    -webkit-font-smoothing: antialiased;
  }
  .sheet {
    max-width: 720px;
    margin: 0 auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .brand {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 28px 32px 20px;
    background: linear-gradient(135deg, #115c37 0%, #1a7a4a 100%);
    color: #fff;
  }
  .brand h1 {
    margin: 0;
    font-size: 14px;
    letter-spacing: 0.8px;
    font-weight: 600;
    opacity: 0.8;
  }
  .brand h2 {
    margin: 6px 0 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.4px;
  }
  .brand .meta {
    text-align: right;
    font-size: 12px;
    opacity: 0.9;
    line-height: 1.5;
  }
  .summary {
    padding: 28px 32px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    border-bottom: 1px solid #e5e5ea;
  }
  .summary .cell {
    background: #f2f2f7;
    border-radius: 12px;
    padding: 16px;
  }
  .summary .label {
    font-size: 11px;
    letter-spacing: 0.6px;
    color: #6c6c70;
    font-weight: 600;
    text-transform: uppercase;
  }
  .summary .value {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.4px;
    margin-top: 4px;
    color: #1c1c1e;
  }
  .summary .value.accent { color: #1a7a4a; }
  .period {
    padding: 20px 32px 0;
    font-size: 13px;
    color: #6c6c70;
  }
  .period strong { color: #1c1c1e; font-weight: 600; }
  table {
    width: 100%;
    margin: 16px 0 0;
    border-collapse: collapse;
    font-size: 13px;
  }
  thead th {
    text-align: left;
    color: #6c6c70;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 12px 32px;
    background: #fafafa;
    border-top: 1px solid #e5e5ea;
    border-bottom: 1px solid #e5e5ea;
  }
  tbody td {
    padding: 14px 32px;
    border-bottom: 1px solid #f2f2f7;
    color: #1c1c1e;
  }
  tbody tr:last-child td { border-bottom: none; }
  td.num { color: #aeaeb2; width: 28px; font-variant-numeric: tabular-nums; }
  th.amount, td.amount {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 22px 32px;
    border-top: 2px solid #1c1c1e;
    background: #fafafa;
  }
  .total-row .label { font-weight: 600; font-size: 13px; }
  .total-row .value {
    font-weight: 700;
    font-size: 22px;
    color: #1a7a4a;
    letter-spacing: -0.3px;
  }
  .footer {
    padding: 18px 32px 28px;
    font-size: 11px;
    color: #aeaeb2;
    text-align: center;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="brand">
      <div>
        <h1>APP7I EARNINGS STATEMENT</h1>
        <h2>${escapeHTML(statement.label)}</h2>
      </div>
      <div class="meta">
        ${instructorName ? `<div><strong>${escapeHTML(instructorName)}</strong></div>` : ""}
        <div>Generated ${generated}</div>
      </div>
    </div>

    <div class="summary">
      <div class="cell">
        <div class="label">Total Earned</div>
        <div class="value accent">${formatGBP(statement.total)}</div>
      </div>
      <div class="cell">
        <div class="label">Paid Lessons</div>
        <div class="value">${statement.count}</div>
      </div>
      <div class="cell">
        <div class="label">Unique Students</div>
        <div class="value">${statement.uniqueStudents}</div>
      </div>
    </div>

    <div class="period">
      Statement period: <strong>${formatDate(toIso(periodStart))}</strong> — <strong>${formatDate(toIso(periodEnd))}</strong>
    </div>

    <table>
      <thead>
        <tr>
          <th></th>
          <th>Date</th>
          <th>Student</th>
          <th>Status</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="total-row">
      <div class="label">Total for ${escapeHTML(statement.label)}</div>
      <div class="value">${formatGBP(statement.total)}</div>
    </div>

    <div class="footer">
      This statement was generated by App7i. To save a permanent copy, open this file in a browser and use Print → Save as PDF.
    </div>
  </div>
</body>
</html>`;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── PDF rendering ────────────────────────────────────────────────────────────

const PDF_MARGIN_X = 48;
const COLOR_INK: [number, number, number] = [0.11, 0.11, 0.12];
const COLOR_MUTED: [number, number, number] = [0.42, 0.42, 0.44];
const COLOR_FAINT: [number, number, number] = [0.68, 0.68, 0.70];
const COLOR_EMERALD: [number, number, number] = [0.10, 0.48, 0.29];
const COLOR_EMERALD_DARK: [number, number, number] = [0.07, 0.36, 0.21];
const COLOR_SURFACE_TINT: [number, number, number] = [0.95, 0.95, 0.97];
const COLOR_BORDER: [number, number, number] = [0.89, 0.89, 0.91];
const COLOR_WHITE: [number, number, number] = [1, 1, 1];

/**
 * Build a styled PDF statement that looks like a real bank statement. Returns
 * a base64-encoded PDF string ready to write to disk.
 */
export function statementToPDF(statement: MonthlyStatement, instructorName?: string): string {
  const pdf = new PDFBuilder();
  const W = pdf.width;
  const H = pdf.height;

  const periodStart = new Date(statement.date.getFullYear(), statement.date.getMonth(), 1);
  const periodEnd = new Date(statement.date.getFullYear(), statement.date.getMonth() + 1, 0);
  const generatedAt = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // ─ Header band — emerald rectangle with title + meta ─
  const headerH = 96;
  pdf.rect(0, 0, W, headerH, COLOR_EMERALD_DARK);
  pdf.text(PDF_MARGIN_X, 32, "YOUR EARNINGS STATEMENT", {
    size: 10,
    font: "bold",
    color: COLOR_WHITE,
  });
  pdf.text(PDF_MARGIN_X, 52, statement.label, {
    size: 22,
    font: "bold",
    color: COLOR_WHITE,
  });
  if (instructorName) {
    pdf.textRight(W - PDF_MARGIN_X, 38, instructorName, {
      size: 11,
      font: "bold",
      color: COLOR_WHITE,
    });
  }
  pdf.textRight(W - PDF_MARGIN_X, 56, `Generated ${generatedAt}`, {
    size: 9,
    font: "regular",
    color: COLOR_WHITE,
  });

  // ─ Summary cells ─
  const summaryTop = headerH + 28;
  const cellGap = 12;
  const cellW = (W - PDF_MARGIN_X * 2 - cellGap * 2) / 3;
  const cellH = 64;
  const cells = [
    { label: "TOTAL EARNED", value: formatPDFCurrency(statement.total), accent: true },
    { label: "PAID LESSONS", value: String(statement.count), accent: false },
    { label: "UNIQUE STUDENTS", value: String(statement.uniqueStudents), accent: false },
  ];
  for (let i = 0; i < cells.length; i++) {
    const x = PDF_MARGIN_X + i * (cellW + cellGap);
    pdf.rect(x, summaryTop, cellW, cellH, COLOR_SURFACE_TINT);
    pdf.text(x + 12, summaryTop + 14, cells[i].label, {
      size: 8,
      font: "bold",
      color: COLOR_MUTED,
    });
    pdf.text(x + 12, summaryTop + 32, cells[i].value, {
      size: 18,
      font: "bold",
      color: cells[i].accent ? COLOR_EMERALD : COLOR_INK,
    });
  }

  // ─ Period line ─
  const periodY = summaryTop + cellH + 24;
  pdf.text(PDF_MARGIN_X, periodY, "Statement period:", {
    size: 10,
    font: "regular",
    color: COLOR_MUTED,
  });
  pdf.text(PDF_MARGIN_X + 95, periodY, `${formatPDFDate(periodStart)} — ${formatPDFDate(periodEnd)}`, {
    size: 10,
    font: "bold",
    color: COLOR_INK,
  });

  // ─ Table header ─
  let rowY = periodY + 24;
  pdf.rect(0, rowY, W, 22, COLOR_SURFACE_TINT);
  pdf.text(PDF_MARGIN_X, rowY + 8, "#", { size: 8, font: "bold", color: COLOR_MUTED });
  pdf.text(PDF_MARGIN_X + 28, rowY + 8, "DATE", { size: 8, font: "bold", color: COLOR_MUTED });
  pdf.text(PDF_MARGIN_X + 110, rowY + 8, "STUDENT", { size: 8, font: "bold", color: COLOR_MUTED });
  pdf.text(W - 180, rowY + 8, "STATUS", { size: 8, font: "bold", color: COLOR_MUTED });
  pdf.textRight(W - PDF_MARGIN_X, rowY + 8, "AMOUNT", { size: 8, font: "bold", color: COLOR_MUTED });
  rowY += 22;

  // ─ Itemised rows (truncated to fit page) ─
  const maxRows = Math.min(statement.invoices.length, computeMaxRows(rowY, H));
  for (let i = 0; i < maxRows; i++) {
    const inv = statement.invoices[i];
    const rowH = 22;
    if (i % 2 === 1) {
      pdf.rect(PDF_MARGIN_X - 12, rowY - 2, W - PDF_MARGIN_X * 2 + 24, rowH, [0.985, 0.985, 0.99]);
    }
    pdf.text(PDF_MARGIN_X, rowY + 9, String(i + 1), { size: 9, font: "regular", color: COLOR_FAINT });
    pdf.text(PDF_MARGIN_X + 28, rowY + 9, formatPDFDate(parseDate(inv.dueDate || "")), {
      size: 10,
      font: "regular",
      color: COLOR_INK,
    });
    pdf.text(PDF_MARGIN_X + 110, rowY + 9, truncate(inv.studentName || "Student", 28), {
      size: 10,
      font: "regular",
      color: COLOR_INK,
    });
    pdf.text(W - 180, rowY + 9, (inv.status || "paid").toUpperCase(), {
      size: 9,
      font: "bold",
      color: COLOR_EMERALD,
    });
    pdf.textRight(W - PDF_MARGIN_X, rowY + 9, formatPDFCurrency(inv.amount || 0), {
      size: 10,
      font: "bold",
      color: COLOR_INK,
    });
    rowY += rowH;
    pdf.hline(PDF_MARGIN_X, rowY, W - PDF_MARGIN_X * 2, { color: COLOR_BORDER });
  }

  if (statement.invoices.length > maxRows) {
    rowY += 16;
    pdf.text(
      PDF_MARGIN_X,
      rowY,
      `… and ${statement.invoices.length - maxRows} more lessons (open the CSV for the full list)`,
      { size: 9, font: "regular", color: COLOR_MUTED },
    );
    rowY += 14;
  }

  // ─ Total bar ─
  rowY += 18;
  pdf.rect(0, rowY, W, 44, COLOR_SURFACE_TINT);
  // Thick black top border
  pdf.rect(0, rowY, W, 2, COLOR_INK);
  pdf.text(PDF_MARGIN_X, rowY + 18, `Total for ${statement.label}`, {
    size: 12,
    font: "bold",
    color: COLOR_INK,
  });
  pdf.textRight(W - PDF_MARGIN_X, rowY + 14, formatPDFCurrency(statement.total), {
    size: 18,
    font: "bold",
    color: COLOR_EMERALD,
  });

  // ─ Disclaimer block + footer ─
  // Anchored to the bottom of the page so the legal notice is always present
  // even when the lesson table is short.
  drawDisclaimer(pdf, H);

  // Silence unused warnings
  void estimateTextWidth;

  return pdf.build();
}

function drawDisclaimer(pdf: PDFBuilder, pageH: number): void {
  const paragraphs = [
    "1. This statement is a personal summary of lesson payments you (the instructor) marked as paid inside the App7i app. It is generated from records you entered yourself.",
    "2. It is NOT a tax invoice, audited account, or document issued by App7i, a bank, or any financial institution. App7i is not an accountant, tax advisor, or regulated financial service.",
    "3. You are solely responsible for the accuracy of your data and for any tax, VAT, or business filings with HMRC (or your local tax authority). Verify totals against your bank statements before filing.",
    "4. App7i accepts no liability for any loss, tax penalty, or dispute arising from use of this statement. It is provided for your personal record-keeping only.",
    "5. Your data: under UK GDPR you have the right to access, export, correct or erase your records at any time via the App7i Settings screen or by emailing support@app7i.com.",
  ];

  const contentWidth = pdf.width - PDF_MARGIN_X * 2;
  const bodySize = 7;
  const lineHeight = 9;

  // Pre-wrap so we know total height, then anchor block to bottom of page.
  const wrappedLines: string[] = [];
  for (const para of paragraphs) {
    const lines = wrapText(para, contentWidth, bodySize, "regular");
    wrappedLines.push(...lines, "");
  }
  while (wrappedLines.length && wrappedLines[wrappedLines.length - 1] === "") {
    wrappedLines.pop();
  }

  const headerH = 14;
  const blockH = headerH + wrappedLines.length * lineHeight;
  const footerLineY = pageH - 18;
  const blockTopY = footerLineY - blockH - 10;

  pdf.text(PDF_MARGIN_X, blockTopY, "NOTICE & DISCLAIMER", {
    size: 8,
    font: "bold",
    color: COLOR_MUTED,
  });

  let y = blockTopY + headerH;
  for (const line of wrappedLines) {
    if (line === "") {
      y += lineHeight * 0.4;
      continue;
    }
    pdf.text(PDF_MARGIN_X, y, line, {
      size: bodySize,
      font: "regular",
      color: COLOR_FAINT,
    });
    y += lineHeight;
  }

  pdf.text(
    PDF_MARGIN_X,
    footerLineY,
    "Generated by App7i — app7i.com — support@app7i.com",
    { size: 7, font: "regular", color: COLOR_FAINT },
  );
}

function wrapText(
  text: string,
  maxWidth: number,
  size: number,
  font: "regular" | "bold",
): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (estimateTextWidth(candidate, size, font) <= maxWidth) {
      line = candidate;
    } else {
      if (line) out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  return out;
}

function parseDate(iso: string): Date {
  if (!iso) return new Date(NaN);
  return new Date(`${iso}T00:00:00`);
}

function formatPDFDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatPDFCurrency(amount: number): string {
  return `£${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + "…";
}

function computeMaxRows(startY: number, pageH: number): number {
  // Leave ~120pt of footer space (total bar + footer text).
  const available = pageH - startY - 120;
  return Math.max(1, Math.floor(available / 22));
}
