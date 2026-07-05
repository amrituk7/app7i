// Minimal hand-rolled PDF 1.4 builder. Pure JS, no native modules, ships via OTA.
//
// Supports the bits a statement needs: single-page A4 layout, two Helvetica
// weights, text drawing with simple line-wrap, axis-aligned rectangles, and
// horizontal/vertical lines. Returns a base64 string ready to write to disk.
//
// Coordinate system follows PDF convention: origin at bottom-left, Y increases
// upward. Most callers will use the helpers below that flip Y so 0,0 is the
// top-left.

const PAGE_W = 595; // A4 width in points (72 dpi)
const PAGE_H = 842; // A4 height in points

type Font = "regular" | "bold";

type DrawOp =
  | { kind: "text"; x: number; y: number; size: number; font: Font; text: string; color?: [number, number, number] }
  | { kind: "rect"; x: number; y: number; w: number; h: number; fill: [number, number, number] }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; width: number; color: [number, number, number] };

export class PDFBuilder {
  readonly width = PAGE_W;
  readonly height = PAGE_H;
  private ops: DrawOp[] = [];

  /** Draw text at (x, y) where y is measured from the TOP of the page. */
  text(
    x: number,
    y: number,
    text: string,
    options: { size?: number; font?: Font; color?: [number, number, number] } = {},
  ): void {
    const { size = 11, font = "regular", color } = options;
    // PDF y origin is bottom-left; flip.
    this.ops.push({ kind: "text", x, y: this.height - y - size, size, font, text, color });
  }

  /** Draw text right-aligned to (x, y). */
  textRight(
    x: number,
    y: number,
    text: string,
    options: { size?: number; font?: Font; color?: [number, number, number] } = {},
  ): void {
    const { size = 11, font = "regular" } = options;
    const w = estimateTextWidth(text, size, font);
    this.text(x - w, y, text, options);
  }

  /** Filled axis-aligned rectangle. */
  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: [number, number, number],
  ): void {
    this.ops.push({ kind: "rect", x, y: this.height - y - h, w, h, fill: color });
  }

  /** Horizontal line from (x, y) of `length` points. */
  hline(
    x: number,
    y: number,
    length: number,
    options: { width?: number; color?: [number, number, number] } = {},
  ): void {
    const { width = 0.5, color = [0.9, 0.9, 0.92] } = options;
    const py = this.height - y;
    this.ops.push({ kind: "line", x1: x, y1: py, x2: x + length, y2: py, width, color });
  }

  /** Render and return base64-encoded PDF bytes. */
  build(): string {
    const objects: string[] = [];
    let n = 1;

    // Build content stream — concatenate all draw ops into PDF instructions.
    const contentLines: string[] = [];
    let currentFont: Font | null = null;
    let currentSize: number | null = null;
    let currentColor: [number, number, number] | null = null;

    for (const op of this.ops) {
      if (op.kind === "rect") {
        contentLines.push(
          `${fmt(op.fill[0])} ${fmt(op.fill[1])} ${fmt(op.fill[2])} rg`,
          `${fmt(op.x)} ${fmt(op.y)} ${fmt(op.w)} ${fmt(op.h)} re f`,
        );
      } else if (op.kind === "line") {
        contentLines.push(
          `${fmt(op.color[0])} ${fmt(op.color[1])} ${fmt(op.color[2])} RG`,
          `${fmt(op.width)} w`,
          `${fmt(op.x1)} ${fmt(op.y1)} m ${fmt(op.x2)} ${fmt(op.y2)} l S`,
        );
      } else {
        const color = op.color || [0.11, 0.11, 0.12];
        if (
          !currentColor
          || currentColor[0] !== color[0]
          || currentColor[1] !== color[1]
          || currentColor[2] !== color[2]
        ) {
          contentLines.push(`${fmt(color[0])} ${fmt(color[1])} ${fmt(color[2])} rg`);
          currentColor = color;
        }
        const font = op.font === "bold" ? "F2" : "F1";
        const fontKey = op.font;
        if (currentFont !== fontKey || currentSize !== op.size) {
          contentLines.push(`/${font} ${fmt(op.size)} Tf`);
          currentFont = fontKey;
          currentSize = op.size;
        }
        contentLines.push(
          `BT ${fmt(op.x)} ${fmt(op.y)} Td (${escapePDFString(op.text)}) Tj ET`,
        );
      }
    }
    const content = contentLines.join("\n");

    // Objects
    // 1: Catalog
    objects.push(`${n++} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
    // 2: Pages
    objects.push(`${n++} 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
    // 3: Page
    objects.push(
      `${n++} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}]`
      + ` /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>`
      + ` /Contents 4 0 R >>\nendobj`,
    );
    // 4: Contents stream
    objects.push(
      `${n++} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
    );
    // 5: Font Helvetica
    objects.push(
      `${n++} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj`,
    );
    // 6: Font Helvetica-Bold
    objects.push(
      `${n++} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj`,
    );

    // Assemble final document with proper xref + trailer.
    const header = "%PDF-1.4\n%\xC2\xB5\n";
    let body = "";
    const offsets: number[] = [];
    for (const obj of objects) {
      offsets.push(header.length + body.length);
      body += obj + "\n";
    }
    const xrefStart = header.length + body.length;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    const pdf = header + body + xref + trailer;
    return base64FromLatin1(pdf);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  // Round to 3 decimals, strip trailing zeros, avoid scientific notation.
  return Number(n.toFixed(3)).toString();
}

function escapePDFString(text: string): string {
  // PDF literal strings need ( ) and \ escaped, and non-ASCII chars get mapped
  // via WinAnsiEncoding. We strip out characters outside the safe ASCII range
  // so the output is always parseable. The £ sign gets manual mapping (it's
  // not in plain ASCII but IS in WinAnsi at byte 0xA3).
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (ch === "(") out += "\\(";
    else if (ch === ")") out += "\\)";
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code === 0xA3) out += "\\243"; // £
    else if (code === 0x2013 || code === 0x2014) out += "-"; // en/em dash
    else if (code === 0x2018 || code === 0x2019) out += "'"; // curly single
    else if (code === 0x201C || code === 0x201D) out += '"'; // curly double
    else if (code === 0x00B7 || code === 0x2022) out += "*"; // middle dot / bullet
    else if (code >= 0x20 && code <= 0x7E) out += ch;
    else if (code >= 0xA0 && code <= 0xFF) {
      // WinAnsi range — emit as octal byte.
      out += "\\" + code.toString(8).padStart(3, "0");
    }
    // anything else gets dropped — keeps the stream byte-safe
  }
  return out;
}

/** Estimate text width in points for Helvetica at the given size. */
export function estimateTextWidth(text: string, size: number, font: Font = "regular"): number {
  // Helvetica char widths in 1/1000 em. These averages keep the math cheap and
  // are accurate enough for right-alignment of column totals.
  const avg = font === "bold" ? 0.56 : 0.52;
  return text.length * size * avg;
}

/**
 * Encode a Latin-1 (ISO-8859-1) string as base64. Each character's lower 8
 * bits are taken as the byte value, which is exactly what PDF needs.
 */
function base64FromLatin1(input: string): string {
  const bytes: number[] = new Array(input.length);
  for (let i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i) & 0xff;

  // btoa is available in React Native via the JSC/Hermes globals.
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  if (typeof btoa === "function") return btoa(binary);

  // Fallback hand-rolled base64 encoder.
  return encodeBase64(bytes);
}

function encodeBase64(bytes: number[]): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += alphabet[b1 >> 2];
    out += alphabet[((b1 & 3) << 4) | (b2 >> 4)];
    out += i + 1 < bytes.length ? alphabet[((b2 & 0xf) << 2) | (b3 >> 6)] : "=";
    out += i + 2 < bytes.length ? alphabet[b3 & 0x3f] : "=";
  }
  return out;
}
