const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldPath } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const adminAuth = getAuth();
const messaging = getMessaging();

const PUBLIC_APP_URL = "https://app7i.com"; // v4
const ALLOWED_ORIGINS = [
  PUBLIC_APP_URL,
  "https://www.app7i.com",
  "https://roadmaster-23cbc.web.app",
  "https://roadmaster-23cbc.firebaseapp.com"
];
const APP_TIME_ZONE = "Europe/London";
const DEFAULT_MORNING_SUMMARY_TIME = "07:30";
const DEFAULT_END_OF_DAY_FLOOR_MINUTES = 18 * 60;
const VERIFY_EMAIL_FALLBACK_COOLDOWN_MS = 60 * 1000;

function verificationEmailContent(link) {
  return {
    subject: "Verify your App7i email",
    text: [
      "Verify your App7i email",
      "",
      "Open this secure link to finish verifying your account:",
      link,
      "",
      "If you did not request this, you can ignore this email."
    ].join("\n"),
    html: [
      "<h2>Verify your App7i email</h2>",
      "<p>Open this secure link to finish verifying your account.</p>",
      `<p><a href="${link}" style="display:inline-block;padding:12px 16px;border-radius:8px;background:#047857;color:#ffffff;text-decoration:none;font-weight:700;">Verify email</a></p>`,
      `<p style="word-break:break-all;color:#475569;">${link}</p>`,
      "<p>If you did not request this, you can ignore this email.</p>"
    ].join("")
  };
}

function verificationFromEmail() {
  return process.env.VERIFICATION_EMAIL_FROM
    || process.env.SENDGRID_FROM_EMAIL
    || process.env.POSTMARK_FROM_EMAIL
    || process.env.MAILGUN_FROM_EMAIL
    || "support@app7i.com";
}

async function sendVerificationViaSendGrid(to, link) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return null;
  const content = verificationEmailContent(link);
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: verificationFromEmail(), name: "App7i" },
      subject: content.subject,
      content: [
        { type: "text/plain", value: content.text },
        { type: "text/html", value: content.html }
      ]
    })
  });
  if (!response.ok) {
    throw new Error(`sendgrid_${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  return { provider: "sendgrid", statusCode: response.status };
}

async function sendVerificationViaPostmark(to, link) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) return null;
  const content = verificationEmailContent(link);
  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": token,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      From: verificationFromEmail(),
      To: to,
      Subject: content.subject,
      TextBody: content.text,
      HtmlBody: content.html,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM || "outbound"
    })
  });
  if (!response.ok) {
    throw new Error(`postmark_${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  return { provider: "postmark", statusCode: response.status };
}

async function sendVerificationViaMailgun(to, link) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) return null;
  const content = verificationEmailContent(link);
  const body = new URLSearchParams({
    from: `App7i <${verificationFromEmail()}>`,
    to,
    subject: content.subject,
    text: content.text,
    html: content.html
  });
  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  if (!response.ok) {
    throw new Error(`mailgun_${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  return { provider: "mailgun", statusCode: response.status };
}

async function sendVerificationThroughFallbackProvider(to, link) {
  const result = await sendVerificationViaSendGrid(to, link)
    || await sendVerificationViaPostmark(to, link)
    || await sendVerificationViaMailgun(to, link);
  if (!result) {
    throw new Error("fallback_email_provider_not_configured");
  }
  return result;
}

// Generic transactional email sender — reuses the same provider chain
// { to, subject, html, text, category }
async function sendEmailWithFallback({ to, subject, html, text }) {
  const fromEmail = verificationFromEmail();

  async function trySendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return null;
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: "App7i" },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html }
        ]
      })
    });
    if (!response.ok) throw new Error(`sendgrid_${response.status}: ${(await response.text()).slice(0, 500)}`);
    return { provider: "sendgrid", statusCode: response.status };
  }

  async function tryPostmark() {
    const token = process.env.POSTMARK_SERVER_TOKEN;
    if (!token) return null;
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": token,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        From: fromEmail,
        To: to,
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
        MessageStream: process.env.POSTMARK_MESSAGE_STREAM || "outbound"
      })
    });
    if (!response.ok) throw new Error(`postmark_${response.status}: ${(await response.text()).slice(0, 500)}`);
    return { provider: "postmark", statusCode: response.status };
  }

  async function tryMailgun() {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    if (!apiKey || !domain) return null;
    const body = new URLSearchParams({ from: `App7i <${fromEmail}>`, to, subject, text, html });
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    if (!response.ok) throw new Error(`mailgun_${response.status}: ${(await response.text()).slice(0, 500)}`);
    return { provider: "mailgun", statusCode: response.status };
  }

  const result = await trySendGrid() || await tryPostmark() || await tryMailgun();
  if (!result) throw new Error("no_email_provider_configured");
  return result;
}

exports.healthCheck = onRequest((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  return res.status(200).json({
    ok: true,
    service: "app7i-functions",
    timestamp: new Date().toISOString()
  });
});

// ------------------------------------------------------------
// iCal feed: instructors paste this URL into Google / Apple /
// Outlook as a "subscribed calendar". Read-only one-way export.
//
// Token is a per-instructor secret. Only the holder of the URL can
// fetch the feed. Tokens are rotated by calling ensureCalendarToken
// with `{ rotate: true }`.
// ------------------------------------------------------------

const ICS_LOOKBACK_DAYS = 30;
const ICS_LOOKAHEAD_DAYS = 365;

function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function dateToIcsLocal(dateString, timeString) {
  // RFC5545 floating local time: YYYYMMDDTHHMMSS (no Z, no offset).
  // Calendar clients render this in the viewer's local zone — fine for
  // App7i because all lessons are scheduled in London local already.
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-");
  const [hh = "00", mm = "00"] = (timeString || "00:00").split(":");
  return `${y}${m}${d}T${hh.padStart(2, "0")}${mm.padStart(2, "0")}00`;
}

function addMinutesToIcsLocal(local, minutes) {
  if (!local || !minutes) return local;
  // Parse YYYYMMDDTHHMMSS, add minutes, format back. No DST awareness needed
  // because we're working with floating local time; the calendar client
  // handles the rendering.
  const yyyy = Number(local.slice(0, 4));
  const mm = Number(local.slice(4, 6)) - 1;
  const dd = Number(local.slice(6, 8));
  const hh = Number(local.slice(9, 11));
  const min = Number(local.slice(11, 13));
  const date = new Date(Date.UTC(yyyy, mm, dd, hh, min));
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    "T",
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    "00"
  ].join("");
}

function buildIcsFeed(instructorName, instructorUid, lessons) {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}00Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//App7i//Driving lessons//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:App7i — ${escapeIcsText(instructorName || "lessons")}`,
    `X-WR-TIMEZONE:${APP_TIME_ZONE}`,
    "X-PUBLISHED-TTL:PT1H"
  ];

  for (const lesson of lessons) {
    if (isLessonCancelled(lesson)) continue;
    const start = dateToIcsLocal(lesson.date, lesson.time);
    if (!start) continue;
    const durationMinutes = Math.max(15, Math.round(Number(lesson.duration || 1) * 60));
    const end = addMinutesToIcsLocal(start, durationMinutes);
    const summary = escapeIcsText(`Lesson — ${lesson.studentName || "student"}`);
    const descriptionParts = [];
    if (lesson.studentName) descriptionParts.push(`Student: ${lesson.studentName}`);
    if (lesson.review?.paymentStatus) descriptionParts.push(`Payment: ${lesson.review.paymentStatus}`);
    if (lesson.notes) descriptionParts.push(`Notes: ${lesson.notes}`);
    descriptionParts.push("Synced from App7i");
    const description = escapeIcsText(descriptionParts.join("\n"));
    const location = escapeIcsText(lesson.pickup || lesson.location || "");
    const uid = `${lesson.id}@app7i-${instructorUid}`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${summary}`);
    if (description) lines.push(`DESCRIPTION:${description}`);
    if (location) lines.push(`LOCATION:${location}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  // RFC5545 line endings are CRLF
  return lines.join("\r\n") + "\r\n";
}

exports.lessonCalendarFeed = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).send("Method not allowed");
    return;
  }

  // Token comes either as `?token=...` or as the last path segment
  // (`/cal/{token}.ics`) so people can copy-paste a tidy URL.
  let token = (req.query?.token || "").toString();
  if (!token) {
    const path = (req.path || req.url || "").split("?")[0];
    const match = /\/([A-Za-z0-9_-]+)\.ics$/.exec(path);
    if (match) token = match[1];
  }
  if (!token || token.length < 16) {
    res.status(400).send("Missing token");
    return;
  }

  // Look up the instructor that owns this token.
  const userSnap = await db.collection("users")
    .where("calendarToken", "==", token)
    .limit(1)
    .get();
  if (userSnap.empty) {
    res.status(404).send("Calendar not found");
    return;
  }

  const instructorDoc = userSnap.docs[0];
  const instructorUid = instructorDoc.id;
  const instructorData = instructorDoc.data() || {};

  // Window: past 30 days through next 365 days. Calendar apps love a small
  // window — too many events makes refresh slow.
  const today = getLondonParts();
  const lookback = new Date(`${today.date}T00:00:00Z`);
  lookback.setUTCDate(lookback.getUTCDate() - ICS_LOOKBACK_DAYS);
  const lookahead = new Date(`${today.date}T00:00:00Z`);
  lookahead.setUTCDate(lookahead.getUTCDate() + ICS_LOOKAHEAD_DAYS);

  function isoDateOnly(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  const lessonsSnap = await db.collection("lessons")
    .where("instructorId", "==", instructorUid)
    .where("date", ">=", isoDateOnly(lookback))
    .where("date", "<=", isoDateOnly(lookahead))
    .get();

  const lessons = lessonsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const profileSnap = await db.doc(`settings/${instructorUid}-profile`).get();
  const instructorName = profileSnap.exists
    ? (profileSnap.data()?.name || instructorData.email || "Instructor")
    : (instructorData.email || "Instructor");

  const ics = buildIcsFeed(instructorName, instructorUid, lessons);

  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Cache-Control", "public, max-age=900, s-maxage=900");
  res.set("Content-Disposition", `inline; filename="app7i-${instructorUid}.ics"`);
  res.status(200).send(ics);
});

// Generate (or rotate) the instructor's calendar feed token. Returns the
// full subscription URL the client should display.
exports.ensureCalendarToken = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");

  const rotate = request.data?.rotate === true;

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new HttpsError("not-found", "User document missing.");
  const userData = userSnap.data() || {};
  if (userData.role !== "instructor") {
    throw new HttpsError("permission-denied", "Only instructors can publish a calendar feed.");
  }

  let token = userData.calendarToken || "";
  if (!token || rotate) {
    token = require("crypto").randomBytes(24).toString("hex");
    await userRef.set({
      calendarToken: token,
      calendarTokenUpdatedAt: Date.now()
    }, { merge: true });
  }

  const region = process.env.FUNCTIONS_REGION || "us-central1";
  const projectId = process.env.GCLOUD_PROJECT || "roadmaster-23cbc";
  const baseUrl = `https://${region}-${projectId}.cloudfunctions.net/lessonCalendarFeed`;
  const url = `${baseUrl}?token=${token}`;

  return { ok: true, token, url };
});

// Verify Firebase ID token from Authorization header
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  try {
    const token = authHeader.split("Bearer ")[1];
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

let _stripe;
function getStripe() {
  if (!_stripe) _stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

function toDispatchDocId(dedupeKey) {
  return dedupeKey.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 500);
}

function normaliseTimeString(value) {
  if (!value || typeof value !== "string") return "";
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = String(Number(rawHour)).padStart(2, "0");
  const minute = String(Number(rawMinute)).padStart(2, "0");
  return `${hour}:${minute}`;
}

function timeToMinutes(value) {
  const [hour = "0", minute = "0"] = normaliseTimeString(value).split(":");
  return Number(hour) * 60 + Number(minute);
}

function minutesToTimeString(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getLondonParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

function formatLessonDate(dateString) {
  if (!dateString) return "your upcoming lesson";
  return new Date(`${dateString}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function formatLessonTime(timeString) {
  const normalised = normaliseTimeString(timeString);
  if (!normalised) return "";
  const [hour, minute] = normalised.split(":");
  const date = new Date(Date.UTC(2000, 0, 1, Number(hour), Number(minute)));
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatHours(totalHours) {
  const value = Number(totalHours || 0);
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(1);
}

function dateStringToUtcMidday(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
}

function daysBetweenDateStrings(targetDateString, baseDateString) {
  const target = dateStringToUtcMidday(targetDateString);
  const base = dateStringToUtcMidday(baseDateString);
  if (!target || !base) return null;
  return Math.round((target.getTime() - base.getTime()) / (24 * 60 * 60 * 1000));
}

function formatComplianceDate(dateString) {
  const parsed = dateStringToUtcMidday(dateString);
  if (!parsed) return "the saved expiry date";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function isLessonCancelled(lesson) {
  return lesson?.review?.status === "cancelled";
}

function isPaidStatus(paymentStatus) {
  return ["paid", "cash", "card", "bank", "package", "waived"].includes(paymentStatus);
}

// True once the instructor has explicitly marked payment one way or another.
// Includes "not_paid" so the +10 min reminder doesn't keep firing after the
// instructor has already deferred — they get one nudge per lesson, not many.
function isPaymentResolved(paymentStatus) {
  return isPaidStatus(paymentStatus) || paymentStatus === "not_paid";
}

function lessonEndMinutes(lesson) {
  const start = timeToMinutes(lesson.time);
  const durationHours = Number(lesson.duration || 1);
  return start + Math.round(durationHours * 60);
}

async function fetchInstructorProfileName(uid) {
  if (!uid) return "your instructor";
  const profileSnap = await db.doc(`settings/${uid}-profile`).get();
  return profileSnap.exists && profileSnap.data()?.name
    ? profileSnap.data().name
    : "your instructor";
}

function trimNotificationMessage(text, maxLength = 120) {
  const value = String(text || "").trim();
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

async function getVerifiedEmailAccountUid(uid) {
  if (!uid) return null;
  try {
    const authUser = await adminAuth.getUser(uid);
    return authUser.emailVerified === true ? uid : null;
  } catch {
    return null;
  }
}

async function resolveStudentAccountUid(studentData, instructorUid = null) {
  if (!studentData) return null;
  if (studentData.uid) return getVerifiedEmailAccountUid(studentData.uid);

  const email = typeof studentData.email === "string"
    ? studentData.email.trim().toLowerCase()
    : "";
  if (!email) return null;

  let userQuery = db.collection("users")
    .where("email", "==", email)
    .where("role", "==", "student")
    .limit(5);

  const userSnap = await userQuery.get();
  if (userSnap.empty) return null;

  const matchedUser = userSnap.docs.find((docSnap) => {
    const data = docSnap.data() || {};
    return !instructorUid || !data.instructorId || data.instructorId === instructorUid;
  }) || userSnap.docs[0];

  return getVerifiedEmailAccountUid(matchedUser.id);
}

async function linkStudentAccountByEmail({ uid, email, instructorId = null }) {
  const normalisedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!uid || !normalisedEmail) return { linked: false };
  if (!await getVerifiedEmailAccountUid(uid)) {
    return { linked: false, reason: "email-not-verified" };
  }

  const userRef = db.collection("users").doc(uid);
  const studentSnap = await db.collection("students")
    .where("email", "==", normalisedEmail)
    .get();

  if (studentSnap.empty) return { linked: false };

  const candidateDocs = studentSnap.docs.filter((docSnap) => {
    const data = docSnap.data() || {};
    return !instructorId || !data.instructorId || data.instructorId === instructorId;
  });

  const chosenDoc = candidateDocs[0] || studentSnap.docs[0];
  if (!chosenDoc) return { linked: false };

  const chosenData = chosenDoc.data() || {};
  const batch = db.batch();

  if (chosenData.uid !== uid) {
    batch.set(chosenDoc.ref, { uid }, { merge: true });
  }

  if (chosenData.instructorId && chosenData.instructorId !== instructorId) {
    batch.set(userRef, { instructorId: chosenData.instructorId }, { merge: true });
  }

  await batch.commit();

  return {
    linked: true,
    studentDocId: chosenDoc.id,
    instructorId: chosenData.instructorId || instructorId || null
  };
}

async function findLinkedStudentByUid(uid) {
  if (!uid) return { linked: false };

  const studentSnap = await db.collection("students")
    .where("uid", "==", uid)
    .limit(1)
    .get();

  if (studentSnap.empty) {
    return { linked: false };
  }

  const chosenDoc = studentSnap.docs[0];
  const chosenData = chosenDoc.data() || {};
  return {
    linked: true,
    studentDocId: chosenDoc.id,
    instructorId: chosenData.instructorId || null
  };
}

async function resolveLessonParticipants(lesson) {
  const instructorUid = lesson?.instructorId || null;
  const studentId = lesson?.studentId || null;
  const instructorName = lesson?.instructor || await fetchInstructorProfileName(instructorUid);
  let studentData = null;
  let learnerUid = null;

  if (studentId) {
    const studentSnap = await db.collection("students").doc(studentId).get();
    if (studentSnap.exists) {
      studentData = { id: studentSnap.id, ...studentSnap.data() };
      learnerUid = await resolveStudentAccountUid(studentData, instructorUid);
    }
  }

  return {
    instructorUid,
    instructorName,
    studentData,
    learnerUid
  };
}

async function resolveMessageParticipants(message) {
  const instructorUid = message?.instructorId || null;
  if (!instructorUid) {
    return {
      instructorUid: null,
      instructorName: "your instructor",
      studentData: null,
      studentDocId: null,
      learnerUid: null
    };
  }

  const instructorName = await fetchInstructorProfileName(instructorUid);
  const studentDocId = message.sender === instructorUid ? message.receiver : message.sender;
  let studentData = null;
  let learnerUid = null;

  if (studentDocId) {
    const studentSnap = await db.collection("students").doc(studentDocId).get();
    if (studentSnap.exists) {
      studentData = { id: studentSnap.id, ...studentSnap.data() };
      learnerUid = await resolveStudentAccountUid(studentData, instructorUid);
    }
  }

  return {
    instructorUid,
    instructorName,
    studentData,
    studentDocId,
    learnerUid
  };
}

async function clearInvalidPushTokens(recipientUid, badTokens) {
  if (!recipientUid || !badTokens?.length) return;
  try {
    const admin = require("firebase-admin");
    const userRef = db.collection("users").doc(recipientUid);
    const snap = await userRef.get();
    if (!snap.exists) return;
    const data = snap.data();
    const metaUpdate = {};
    for (const t of badTokens) metaUpdate[`fcmTokensMeta.${t}`] = admin.firestore.FieldValue.delete();
    const update = {
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...badTokens),
      ...metaUpdate
    };
    if (data.fcmToken && badTokens.includes(data.fcmToken)) update.fcmToken = null;
    await userRef.update(update);
  } catch (error) {
    console.warn("Failed to clear invalid push tokens", recipientUid, error.message);
  }
}

function collectUserTokens(data) {
  if (!data) return [];
  const set = new Set();
  if (Array.isArray(data.fcmTokens)) for (const t of data.fcmTokens) if (t) set.add(t);
  if (data.fcmToken) set.add(data.fcmToken);
  return Array.from(set);
}

function buildPushMessage(token, payload) {
  const channelId = payload.type === "message_received" ? "app7i-messages" : "app7i-default";
  return {
    token,
    notification: {
      title: payload.title,
      body: payload.message
    },
    android: {
      priority: "high",
      notification: {
        channelId,
        sound: "default",
        defaultSound: true,
        defaultVibrateTimings: true
      }
    },
    data: {
      type: payload.type || "general",
      lessonId: payload.lessonId || "",
      instructorId: payload.instructorId || "",
      url: payload.url || "/notifications"
    },
    webpush: {
      headers: { Urgency: "high" },
      fcmOptions: { link: `${PUBLIC_APP_URL}${payload.url || "/notifications"}` }
    }
  };
}

async function maybeSendPushNotification(recipientUid, payload) {
  const verifiedRecipientUid = await getVerifiedEmailAccountUid(recipientUid);
  if (!verifiedRecipientUid) return { attempted: false, anyDelivered: false };
  const userSnap = await db.collection("users").doc(verifiedRecipientUid).get();
  if (!userSnap.exists) return { attempted: false, anyDelivered: false };
  const tokens = collectUserTokens(userSnap.data());
  if (!tokens.length) return { attempted: false, anyDelivered: false };

  const badTokens = [];
  let anyDelivered = false;
  await Promise.all(tokens.map(async (token) => {
    try {
      await messaging.send(buildPushMessage(token, payload));
      anyDelivered = true;
    } catch (error) {
      console.error("Push delivery failed:", verifiedRecipientUid, token.slice(0, 12), error.message);
      if (error.code === "messaging/registration-token-not-registered" ||
          error.code === "messaging/invalid-registration-token") {
        badTokens.push(token);
      }
    }
  }));
  if (badTokens.length) await clearInvalidPushTokens(verifiedRecipientUid, badTokens);
  return { attempted: true, anyDelivered };
}

// Per-type mute switches, stored on users/{uid}.notificationPrefs by the
// mobile/web notification settings. Types not listed here (reminders, account
// security, test pushes) can't be muted this way — reminders have their own
// reminderPrefs, and the rest are too important to silence.
const NOTIFICATION_PREF_KEYS = {
  message_received: "messages",
  lesson_booked: "lessonActivity",
  lesson_updated: "lessonActivity",
  lesson_cancelled: "lessonActivity",
  lesson_payment_review: "paymentPrompts",
  instructor_morning_summary: "dailySummary",
  instructor_day_complete: "dailySummary",
  lesson_feedback_prompt: "feedbackPrompts",
  instructor_feedback_summary: "feedbackSummaries"
};

async function isNotificationTypeMuted(recipientUid, type) {
  const prefKey = NOTIFICATION_PREF_KEYS[type];
  if (!prefKey) return false;
  try {
    const snap = await db.collection("users").doc(recipientUid).get();
    const prefs = snap.exists ? snap.data().notificationPrefs : null;
    return !!prefs && prefs[prefKey] === false;
  } catch (error) {
    // Fail open — a prefs read hiccup must never swallow a notification.
    console.warn("notificationPrefs read failed", recipientUid, error.message);
    return false;
  }
}

async function createNotificationIfNeeded(payload) {
  const dedupeKey = payload.dedupeKey;
  if (!dedupeKey || !payload.recipientUid) return null;
  if (await isNotificationTypeMuted(payload.recipientUid, payload.type || "general")) return null;
  const storeInCenter = payload.storeInCenter !== false;

  const dispatchRef = db.collection("notificationDispatches").doc(toDispatchDocId(dedupeKey));
  const notificationsRef = storeInCenter ? db.collection("notifications").doc() : null;
  const timestamp = Date.now();

  const result = await db.runTransaction(async (tx) => {
    const existing = await tx.get(dispatchRef);
    if (existing.exists) {
      const data = existing.data() || {};
      return {
        skipped: true,
        notificationId: data.notificationId || null,
        pushDelivered: data.pushDelivered === true
      };
    }

    if (storeInCenter && notificationsRef) {
      tx.set(notificationsRef, {
        title: payload.title,
        message: payload.message,
        type: payload.type || "general",
        recipientUid: payload.recipientUid,
        recipientRole: payload.recipientRole || "instructor",
        instructorId: payload.instructorId || null,
        lessonId: payload.lessonId || null,
        read: false,
        timestamp,
        dedupeKey
      });
    }
    tx.set(dispatchRef, {
      dedupeKey,
      notificationId: notificationsRef?.id || null,
      type: payload.type || "general",
      recipientUid: payload.recipientUid,
      lessonId: payload.lessonId || null,
      instructorId: payload.instructorId || null,
      storeInCenter,
      createdAt: timestamp,
      pushDelivered: false
    });

    return { skipped: false, notificationId: notificationsRef?.id || null, pushDelivered: false };
  });

  // Retry push on any invocation where delivery hasn't been confirmed yet.
  // Center entry is already deduped by the dispatch doc, so retries won't
  // create duplicate in-app notifications, but a transient FCM failure
  // no longer means the push is lost forever.
  // `payload.pushEnabled === false` opts the recipient out of push for this
  // call (used by reminder-prefs respecting users with pushEnabled: false).
  if (!result.pushDelivered && payload.pushEnabled !== false) {
    const pushResult = await maybeSendPushNotification(payload.recipientUid, payload);
    if (pushResult.anyDelivered) {
      try {
        await dispatchRef.update({
          pushDelivered: true,
          pushDeliveredAt: Date.now()
        });
      } catch (error) {
        console.warn("Failed to mark push as delivered", dedupeKey, error.message);
      }
    }
  }

  return result.notificationId;
}

async function notifyLessonBooked(lessonId, lesson) {
  if (!lesson?.instructorId || isLessonCancelled(lesson)) return;

  const { instructorUid, instructorName, studentData, learnerUid } = await resolveLessonParticipants(lesson);
  const studentName = lesson.studentName || studentData?.name || "your student";
  const lessonDate = formatLessonDate(lesson.date);
  const lessonTime = formatLessonTime(lesson.time);

  // Weekly series: every occurrence is its own doc, so per-lesson triggers
  // would fire N near-identical notifications the moment a series is booked.
  // Dedupe on the shared group id instead — the first trigger to land wins
  // and describes the whole series; the rest are swallowed by the dispatch
  // transaction. Every doc in the group shares the weekday and time.
  const seriesId = lesson.recurringGroupId || null;
  const seriesCount = Number(lesson.recurringWeeks) || 0;
  if (seriesId && seriesCount > 1) {
    const weekday = new Date(`${lesson.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long" });
    const seriesNotifications = [
      {
        title: "Weekly lessons booked",
        message: `${studentName} is booked for ${seriesCount} weekly lessons — ${weekday}s at ${lessonTime}.`,
        type: "lesson_booked",
        recipientUid: instructorUid,
        recipientRole: "instructor",
        instructorId: instructorUid,
        lessonId,
        url: "/notifications",
        dedupeKey: `lesson_booked:group:${seriesId}:instructor`
      }
    ];
    if (learnerUid) {
      seriesNotifications.push({
        title: "Weekly lessons confirmed",
        message: `${seriesCount} weekly lessons with ${instructorName} — ${weekday}s at ${lessonTime}.`,
        type: "lesson_booked",
        recipientUid: learnerUid,
        recipientRole: "learner",
        instructorId: instructorUid,
        lessonId,
        url: "/notifications",
        dedupeKey: `lesson_booked:group:${seriesId}:learner`
      });
    }
    await Promise.all(seriesNotifications.map((item) => createNotificationIfNeeded(item)));
    return;
  }

  const notifications = [
    {
      title: "Lesson booked",
      message: `${studentName} is booked for ${lessonDate} at ${lessonTime}.`,
      type: "lesson_booked",
      recipientUid: instructorUid,
      recipientRole: "instructor",
      instructorId: instructorUid,
      lessonId,
      url: "/notifications",
      dedupeKey: `lesson_booked:${lessonId}:instructor`
    }
  ];

  if (learnerUid) {
    notifications.push({
      title: "Lesson confirmed",
      message: `${lessonDate} at ${lessonTime} with ${instructorName}.`,
      type: "lesson_booked",
      recipientUid: learnerUid,
      recipientRole: "learner",
      instructorId: instructorUid,
      lessonId,
      url: "/notifications",
      dedupeKey: `lesson_booked:${lessonId}:learner`
    });
  } else {
    notifications.push({
      title: "Learner account not linked",
      message: `${studentName} does not have a linked student account yet, so they could not receive a booking alert.`,
      type: "student_link_required",
      recipientUid: instructorUid,
      recipientRole: "instructor",
      instructorId: instructorUid,
      lessonId,
      url: `/students/${lesson.studentId || ""}`,
      dedupeKey: `student_link_required:lesson_booked:${lessonId}`
    });
  }

  await Promise.all(notifications.map((item) => createNotificationIfNeeded(item)));
}

async function processNewMessageNotification(messageId, message) {
  const {
    instructorUid,
    instructorName,
    studentData,
    studentDocId,
    learnerUid
  } = await resolveMessageParticipants(message);

  if (!instructorUid || !studentDocId) return;

  const messagePreview = trimNotificationMessage(message.text);
  const studentName = studentData?.name || "your learner";
  const senderIsInstructor = message.sender === instructorUid;

  if (senderIsInstructor) {
    if (learnerUid) {
      await createNotificationIfNeeded({
        title: `Message from ${instructorName}`,
        message: messagePreview,
        type: "message_received",
        recipientUid: learnerUid,
        recipientRole: "learner",
        instructorId: instructorUid,
        url: "/my-messages",
        dedupeKey: `message_received:${messageId}:learner`,
        storeInCenter: false
      });
    } else {
      await createNotificationIfNeeded({
        title: "Learner account not linked",
        message: `${studentName} could not receive a message notification because their student account is not linked yet.`,
        type: "student_link_required",
        recipientUid: instructorUid,
        recipientRole: "instructor",
        instructorId: instructorUid,
        url: studentDocId ? `/students/${studentDocId}` : "/students",
        dedupeKey: `student_link_required:message:${messageId}`
      });
    }
    return;
  }

  await createNotificationIfNeeded({
    title: `Message from ${studentName}`,
    message: messagePreview,
    type: "message_received",
    recipientUid: instructorUid,
    recipientRole: "instructor",
    instructorId: instructorUid,
    url: `/messages/${studentDocId}`,
    dedupeKey: `message_received:${messageId}:instructor`,
    storeInCenter: false
  });
}

async function notifyLessonUpdated(lessonId, before, after, eventId) {
  if (!after?.instructorId) return;

  // A lesson transitioning to cancelled notifies both parties — previously
  // cancellations were silently swallowed and students never found out.
  const becameCancelled = !isLessonCancelled(before) && isLessonCancelled(after);
  if (becameCancelled) {
    await notifyLessonCancelled(lessonId, after, eventId);
    return;
  }
  if (isLessonCancelled(after)) return;

  const watchedFields = ["date", "time", "duration", "notes"];
  const changed = watchedFields.some((field) => (before?.[field] || null) !== (after?.[field] || null));
  if (!changed) return;

  const { instructorUid, instructorName, studentData, learnerUid } = await resolveLessonParticipants(after);
  const studentName = after.studentName || studentData?.name || "your student";
  const lessonDate = formatLessonDate(after.date);
  const lessonTime = formatLessonTime(after.time);

  const notifications = [
    {
      title: "Lesson updated",
      message: `${studentName}'s lesson is now ${lessonDate} at ${lessonTime}.`,
      type: "lesson_updated",
      recipientUid: instructorUid,
      recipientRole: "instructor",
      instructorId: instructorUid,
      lessonId,
      url: "/notifications",
      dedupeKey: `lesson_updated:${lessonId}:instructor:${eventId}`
    }
  ];

  if (learnerUid) {
    notifications.push({
      title: "Lesson updated",
      message: `Your lesson with ${instructorName} is now ${lessonDate} at ${lessonTime}.`,
      type: "lesson_updated",
      recipientUid: learnerUid,
      recipientRole: "learner",
      instructorId: instructorUid,
      lessonId,
      url: "/notifications",
      dedupeKey: `lesson_updated:${lessonId}:learner:${eventId}`
    });
  }

  await Promise.all(notifications.map((item) => createNotificationIfNeeded(item)));
}

async function notifyLessonCancelled(lessonId, lesson, eventId) {
  const { instructorUid, instructorName, studentData, learnerUid } = await resolveLessonParticipants(lesson);
  const studentName = lesson.studentName || studentData?.name || "your student";
  const lessonDate = formatLessonDate(lesson.date);
  const lessonTime = formatLessonTime(lesson.time);

  const notifications = [
    {
      title: "Lesson cancelled",
      message: `${studentName}'s lesson on ${lessonDate} at ${lessonTime} has been cancelled.`,
      type: "lesson_cancelled",
      recipientUid: instructorUid,
      recipientRole: "instructor",
      instructorId: instructorUid,
      lessonId,
      url: "/notifications",
      dedupeKey: `lesson_cancelled:${lessonId}:instructor:${eventId}`
    }
  ];

  if (learnerUid) {
    notifications.push({
      title: "Lesson cancelled",
      message: `Your lesson with ${instructorName} on ${lessonDate} at ${lessonTime} has been cancelled.`,
      type: "lesson_cancelled",
      recipientUid: learnerUid,
      recipientRole: "learner",
      instructorId: instructorUid,
      lessonId,
      url: "/notifications",
      dedupeKey: `lesson_cancelled:${lessonId}:learner:${eventId}`
    });
  }

  await Promise.all(notifications.map((item) => createNotificationIfNeeded(item)));
}

function buildMorningSummaryMessage(lessons) {
  const sorted = [...lessons].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const totalHours = sorted.reduce((sum, lesson) => sum + Number(lesson.duration || 1), 0);
  const names = sorted.slice(0, 3).map((lesson) => lesson.studentName).filter(Boolean);
  const moreCount = Math.max(0, sorted.length - names.length);
  const learnersLine = names.length > 0
    ? ` ${names.join(", ")}${moreCount > 0 ? ` +${moreCount} more.` : "."}`
    : "";

  return {
    title: "Today's teaching overview",
    message: `${sorted.length} lesson${sorted.length === 1 ? "" : "s"} today, ${formatHours(totalHours)} teaching hour${totalHours === 1 ? "" : "s"}. First at ${formatLessonTime(sorted[0].time)}, last at ${formatLessonTime(sorted[sorted.length - 1].time)}.${learnersLine}`
  };
}

function buildEndOfDayMessage(completedLessons) {
  const totalHours = completedLessons.reduce((sum, lesson) => sum + Number(lesson.duration || 1), 0);
  return {
    title: "Day wrapped up",
    message: `${completedLessons.length} lesson${completedLessons.length === 1 ? "" : "s"} completed for ${formatHours(totalHours)} teaching hour${totalHours === 1 ? "" : "s"} today. Enjoy the rest of your day.`
  };
}

function buildComplianceNotification({ label, dateString, daysUntilExpiry }) {
  const formattedDate = formatComplianceDate(dateString);
  if (daysUntilExpiry === 30) {
    return {
      title: `${label} due in 30 days`,
      message: `Your ${label.toLowerCase()} expires on ${formattedDate}. Update your car details if anything has changed.`
    };
  }
  if (daysUntilExpiry === 7) {
    return {
      title: `${label} due in 7 days`,
      message: `Your ${label.toLowerCase()} expires on ${formattedDate}. Please review your car details this week.`
    };
  }
  if (daysUntilExpiry === 0) {
    return {
      title: `${label} expires today`,
      message: `Your ${label.toLowerCase()} expires today (${formattedDate}). Renew it and update App7i to keep your records accurate.`
    };
  }
  return {
    title: `${label} overdue`,
    message: `Your ${label.toLowerCase()} expired on ${formattedDate}. Update your car details as soon as possible.`
  };
}

exports.onLessonCreated = onDocumentCreated("lessons/{lessonId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot?.exists) return;
  await notifyLessonBooked(event.params.lessonId, snapshot.data());
});

exports.onLessonUpdated = onDocumentUpdated("lessons/{lessonId}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;
  await notifyLessonUpdated(event.params.lessonId, before, after, event.id);
});

exports.onMessageCreated = onDocumentCreated("messages/{messageId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot?.exists) return;
  await processNewMessageNotification(event.params.messageId, snapshot.data());
});

// ----- Lesson reminders (configurable lead times + multi-channel) -----
const DEFAULT_REMINDER_LEAD_MINUTES = [1440, 120];
const REMINDER_WINDOW_MINUTES = 4; // +/- minutes around target — same as the original 24h block

function describeLeadMinutes(leadMinutes) {
  if (!Number.isFinite(leadMinutes)) return "soon";
  if (leadMinutes >= 1440 && leadMinutes % 1440 === 0) {
    const days = leadMinutes / 1440;
    return days === 1 ? "in 24 hours" : `in ${days} days`;
  }
  if (leadMinutes >= 60 && leadMinutes % 60 === 0) {
    const hours = leadMinutes / 60;
    return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
  }
  return `in ${leadMinutes} minutes`;
}

async function loadReminderPrefs(uid) {
  // Defaults match the v1 spec — enabled with 24h + 2h, email + in-app on, push off.
  const fallback = {
    enabled: true,
    leadMinutes: [...DEFAULT_REMINDER_LEAD_MINUTES],
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true
  };
  if (!uid) return fallback;
  try {
    const snap = await db.doc(`users/${uid}/settings/reminders`).get();
    if (!snap.exists) return fallback;
    const data = snap.data() || {};
    const leadMinutes = Array.isArray(data.leadMinutes) && data.leadMinutes.length > 0
      ? data.leadMinutes
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
      : fallback.leadMinutes;
    return {
      enabled: data.enabled !== false,
      leadMinutes,
      emailEnabled: data.emailEnabled !== false,
      pushEnabled: data.pushEnabled === true,
      inAppEnabled: data.inAppEnabled !== false
    };
  } catch (error) {
    console.warn("loadReminderPrefs failed (using defaults)", uid, error?.message);
    return fallback;
  }
}

function buildReminderEmail({ role, instructorName, studentName, lessonDate, lessonTime, leadMinutes }) {
  const leadLabel = describeLeadMinutes(leadMinutes);
  const isInstructor = role === "instructor";
  const subject = isInstructor
    ? `Lesson reminder: ${studentName} ${leadLabel}`
    : `Lesson reminder: your lesson with ${instructorName} ${leadLabel}`;
  const greeting = isInstructor
    ? `You have a lesson coming up ${leadLabel}.`
    : `You have a driving lesson coming up ${leadLabel}.`;

  const html = [
    `<h2 style="margin:0 0 12px;font-size:18px;color:#111827;">${greeting}</h2>`,
    `<table style="border-collapse:collapse;width:100%;margin:16px 0;">`,
    isInstructor
      ? `<tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%;color:#374151;">Student</td>`
        + `<td style="padding:8px 12px;color:#111827;">${studentName}</td></tr>`
      : `<tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%;color:#374151;">Instructor</td>`
        + `<td style="padding:8px 12px;color:#111827;">${instructorName}</td></tr>`,
    `<tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;color:#374151;">Date</td>`,
    `<td style="padding:8px 12px;color:#111827;">${lessonDate}</td></tr>`,
    `<tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;color:#374151;">Time</td>`,
    `<td style="padding:8px 12px;color:#111827;">${lessonTime} (London)</td></tr>`,
    `</table>`,
    `<p style="color:#374151;margin:16px 0 8px;">Open the App7i app for full details.</p>`,
    `<p style="color:#9ca3af;margin:0;font-size:12px;">You can change reminder timings or turn email reminders off in your App7i profile.</p>`
  ].join("");

  const text = [
    greeting,
    "",
    isInstructor ? `Student: ${studentName}` : `Instructor: ${instructorName}`,
    `Date: ${lessonDate}`,
    `Time: ${lessonTime} (London)`,
    "",
    "Open the App7i app for full details.",
    "Change reminder timings or turn email reminders off in your App7i profile."
  ].join("\n");

  return { subject, html, text };
}

async function sendReminderEmail({ to, role, instructorName, studentName, lessonDate, lessonTime, leadMinutes }) {
  if (!to) return null;
  const { subject, html, text } = buildReminderEmail({
    role,
    instructorName,
    studentName,
    lessonDate,
    lessonTime,
    leadMinutes
  });
  try {
    const result = await sendEmailWithFallback({ to, subject, html, text });
    return result;
  } catch (error) {
    console.warn("sendReminderEmail failed (non-fatal)", { to, error: error?.message?.slice(0, 200) });
    return null;
  }
}

async function getRecipientEmail(uid) {
  if (!uid) return null;
  try {
    const authUser = await adminAuth.getUser(uid);
    return authUser?.email || null;
  } catch (error) {
    console.warn("getRecipientEmail failed", uid, error?.message);
    return null;
  }
}

async function dispatchLessonReminder({
  lessonRef,
  lesson,
  leadMinutes,
  recipientUid,
  recipientRole,
  recipientEmail,
  prefs,
  title,
  message,
  instructorName,
  studentName,
  lessonDate,
  lessonTime
}) {
  if (!recipientUid || !prefs?.enabled) return;

  const leadKey = String(leadMinutes);
  const reminderStatus = lesson.reminderStatus || {};
  const slot = reminderStatus[leadKey] || {};
  const updatedSlot = { ...slot };
  let dirty = false;
  const recipientKey = recipientRole === "instructor" ? "instructor" : "learner";

  // In-app + push (uses the existing dedupe via notificationDispatches).
  // Push is gated by prefs.pushEnabled — we still create the in-app row so
  // notification-centre history stays complete even when push is off.
  if (prefs.inAppEnabled !== false && !slot[`inAppCreatedAt_${recipientKey}`]) {
    await createNotificationIfNeeded({
      title,
      message,
      type: `lesson_reminder_${leadMinutes}`,
      recipientUid,
      recipientRole,
      instructorId: lesson.instructorId,
      lessonId: lesson.id,
      url: "/notifications",
      dedupeKey: `lesson_reminder_${leadMinutes}:${lesson.id}:${recipientKey}`,
      // Suppress push if user has push off — center entry still gets created.
      pushEnabled: prefs.pushEnabled === true
    });
    updatedSlot[`inAppCreatedAt_${recipientKey}`] = Date.now();
    if (prefs.pushEnabled) {
      updatedSlot[`pushSentAt_${recipientKey}`] = Date.now();
    }
    dirty = true;
  }

  // Email channel — independent of in-app, gated by emailEnabled.
  if (prefs.emailEnabled !== false && !slot[`emailSentAt_${recipientKey}`]) {
    const target = recipientEmail || await getRecipientEmail(recipientUid);
    if (target) {
      const result = await sendReminderEmail({
        to: target,
        role: recipientRole === "instructor" ? "instructor" : "learner",
        instructorName,
        studentName,
        lessonDate,
        lessonTime,
        leadMinutes
      });
      if (result) {
        updatedSlot[`emailSentAt_${recipientKey}`] = Date.now();
        updatedSlot[`emailProvider_${recipientKey}`] = result.provider;
        dirty = true;
      }
    }
  }

  if (dirty) {
    try {
      await lessonRef.set(
        { reminderStatus: { ...reminderStatus, [leadKey]: updatedSlot } },
        { merge: true }
      );
    } catch (error) {
      console.warn("Failed to stamp reminderStatus", lesson.id, leadKey, error?.message);
    }
  }
}

exports.processLessonNotifications = onSchedule({
  schedule: "every 5 minutes",
  timeZone: APP_TIME_ZONE
}, async () => {
  const now = new Date();
  const londonNow = getLondonParts(now);

  // --- Multi-lead reminder pass ---
  // For every instructor's preferred lead times, find lessons whose start time
  // falls within ± REMINDER_WINDOW_MINUTES of (now + leadMinutes), and dispatch
  // the configured channels. Stamps lesson.reminderStatus[lead] so we never
  // resend even if the schedule double-fires.
  const instructorLeadGroups = new Map(); // leadMinutes -> Set<instructorUid>
  const allLeadMinutes = new Set();
  const instructorPrefsCache = new Map(); // uid -> prefs

  const reminderInstructorSnap = await db.collection("users")
    .where("role", "==", "instructor")
    .get();

  for (const instructorDoc of reminderInstructorSnap.docs) {
    const instructorUid = instructorDoc.id;
    const prefs = await loadReminderPrefs(instructorUid);
    instructorPrefsCache.set(instructorUid, prefs);
    if (!prefs.enabled) continue;
    for (const lead of prefs.leadMinutes) {
      allLeadMinutes.add(lead);
      if (!instructorLeadGroups.has(lead)) instructorLeadGroups.set(lead, new Set());
      instructorLeadGroups.get(lead).add(instructorUid);
    }
  }

  for (const leadMinutes of allLeadMinutes) {
    const targetTime = new Date(now.getTime() + leadMinutes * 60 * 1000);
    const targetParts = getLondonParts(targetTime);
    const targetMinutes = timeToMinutes(targetParts.time);

    const lessonsSnap = await db.collection("lessons")
      .where("date", "==", targetParts.date)
      .get();

    for (const lessonDoc of lessonsSnap.docs) {
      const lesson = { id: lessonDoc.id, ...lessonDoc.data() };
      if (!lesson.instructorId || isLessonCancelled(lesson)) continue;

      // Only dispatch if the instructor wanted this lead time.
      if (!instructorLeadGroups.get(leadMinutes)?.has(lesson.instructorId)) continue;

      const lessonMinutes = timeToMinutes(lesson.time);
      if (Math.abs(lessonMinutes - targetMinutes) > REMINDER_WINDOW_MINUTES) continue;

      const { instructorUid, instructorName, studentData, learnerUid } = await resolveLessonParticipants(lesson);
      const studentName = lesson.studentName || studentData?.name || "your student";
      const lessonDate = formatLessonDate(lesson.date);
      const lessonTime = formatLessonTime(lesson.time);
      const leadLabel = describeLeadMinutes(leadMinutes);

      const instructorPrefs = instructorPrefsCache.get(instructorUid)
        || await loadReminderPrefs(instructorUid);

      await dispatchLessonReminder({
        lessonRef: lessonDoc.ref,
        lesson,
        leadMinutes,
        recipientUid: instructorUid,
        recipientRole: "instructor",
        recipientEmail: null,
        prefs: instructorPrefs,
        title: "Lesson reminder",
        message: `${studentName} ${leadLabel} at ${lessonTime}.`,
        instructorName,
        studentName,
        lessonDate,
        lessonTime
      });

      if (learnerUid) {
        const learnerPrefs = await loadReminderPrefs(learnerUid);
        // Re-read the lesson so the second recipient sees the freshly-stamped slot
        // and we don't double-send the in-app/email when the same lead time fires.
        const refreshedSnap = await lessonDoc.ref.get();
        const refreshedLesson = { id: refreshedSnap.id, ...refreshedSnap.data() };

        await dispatchLessonReminder({
          lessonRef: lessonDoc.ref,
          lesson: refreshedLesson,
          leadMinutes,
          recipientUid: learnerUid,
          recipientRole: "learner",
          recipientEmail: null,
          prefs: learnerPrefs,
          title: leadMinutes >= 1440 ? "Lesson tomorrow" : "Lesson reminder",
          message: `${lessonDate} at ${lessonTime} with ${instructorName}.`,
          instructorName,
          studentName,
          lessonDate,
          lessonTime
        });
      }
    }
  }

  const instructorSnap = await db.collection("users")
    .where("role", "==", "instructor")
    .get();

  const todayDate = londonNow.date;
  const currentMinutes = timeToMinutes(londonNow.time);

  for (const instructorDoc of instructorSnap.docs) {
    const instructorUid = instructorDoc.id;
    const profileSnap = await db.doc(`settings/${instructorUid}-profile`).get();
    const profile = profileSnap.exists ? profileSnap.data() : {};
    const morningSummaryTime = normaliseTimeString(profile?.morningSummaryTime || DEFAULT_MORNING_SUMMARY_TIME);
    const morningSummaryMinutes = timeToMinutes(morningSummaryTime);

    const todayLessonsSnap = await db.collection("lessons")
      .where("instructorId", "==", instructorUid)
      .where("date", "==", todayDate)
      .get();

    const todayLessons = todayLessonsSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((lesson) => !isLessonCancelled(lesson));

    if (todayLessons.length === 0) continue;

    for (const lesson of todayLessons) {
      const paymentStatus = lesson.review?.paymentStatus || "pending";
      const endedTenMinutesAgo = lessonEndMinutes(lesson) + 10 <= currentMinutes;
      if (!endedTenMinutesAgo) continue;

      // Initialise attendance to "pending" so the lesson appears in the
      // instructor's "needs attention" list. Cancelled lessons are filtered
      // out earlier by isLessonCancelled. Once the instructor sets it to
      // attended/noshow/cancelled in the UI we never overwrite it.
      if (!lesson.attendance) {
        try {
          await db.collection("lessons").doc(lesson.id).set(
            { attendance: "pending", attendanceInitialisedAt: Date.now() },
            { merge: true }
          );
          lesson.attendance = "pending";
        } catch (error) {
          console.warn("Failed to init lesson.attendance", lesson.id, error?.message);
        }
      }

      const studentName = lesson.studentName || "your student";

      if (!isPaymentResolved(paymentStatus)) {
        // Deliberately no amount, no time, no method list in the body — the
        // instructor already knows the price; the notification is a nudge to
        // open the lesson and tap one button.
        await createNotificationIfNeeded({
          title: "Mark payment",
          message: `Mark payment for ${studentName}'s lesson`,
          type: "lesson_payment_review",
          recipientUid: instructorUid,
          recipientRole: "instructor",
          instructorId: instructorUid,
          lessonId: lesson.id,
          url: `/lessons/${lesson.id}`,
          dedupeKey: `lesson_payment_review:${lesson.id}`
        });
      }

      // Student-side: anonymous feedback prompt 10 min after lesson ends.
      // Resolves the linked auth uid via the same helper used elsewhere.
      const { learnerUid } = await resolveLessonParticipants(lesson);
      if (learnerUid) {
        // Suppress the prompt if the student already submitted feedback for
        // this lesson — doc id `${lessonId}__${learnerUid}`.
        const feedbackDocId = `${lesson.id}__${learnerUid}`;
        const feedbackSnap = await db.collection("lessonFeedback").doc(feedbackDocId).get();
        if (!feedbackSnap.exists) {
          await createNotificationIfNeeded({
            title: "How was today's lesson?",
            message: "Share anonymous feedback to help your instructor improve.",
            type: "lesson_feedback_prompt",
            recipientUid: learnerUid,
            recipientRole: "learner",
            instructorId: instructorUid,
            lessonId: lesson.id,
            url: `/lesson-feedback/${lesson.id}`,
            dedupeKey: `lesson_feedback_prompt:${lesson.id}`
          });
        }
      }
    }

    if (Math.abs(currentMinutes - morningSummaryMinutes) <= 4) {
      const morningSummary = buildMorningSummaryMessage(todayLessons);
      await createNotificationIfNeeded({
        ...morningSummary,
        type: "instructor_morning_summary",
        recipientUid: instructorUid,
        recipientRole: "instructor",
        instructorId: instructorUid,
        url: "/notifications",
        dedupeKey: `instructor_morning_summary:${instructorUid}:${todayDate}`
      });
    }

    if (profile?.endOfDaySummaryEnabled === false) continue;

    const latestEndMinutes = todayLessons.reduce((latest, lesson) => {
      return Math.max(latest, lessonEndMinutes(lesson));
    }, 0);
    const summaryThreshold = Math.max(DEFAULT_END_OF_DAY_FLOOR_MINUTES, latestEndMinutes + 15);
    if (currentMinutes < summaryThreshold) continue;

    const completedLessons = todayLessons.filter((lesson) => lessonEndMinutes(lesson) <= currentMinutes);
    if (completedLessons.length === 0) continue;

    const endOfDaySummary = buildEndOfDayMessage(completedLessons);
    await createNotificationIfNeeded({
      ...endOfDaySummary,
      type: "instructor_day_complete",
      recipientUid: instructorUid,
      recipientRole: "instructor",
      instructorId: instructorUid,
      url: "/notifications",
      dedupeKey: `instructor_day_complete:${instructorUid}:${todayDate}`
    });
  }

  console.log("Processed lesson notifications", {
    now: londonNow,
    reminderDate: reminderTargetDate.date
  });
});

exports.processVehicleComplianceNotifications = onSchedule({
  schedule: "0 7 * * *",
  timeZone: APP_TIME_ZONE
}, async () => {
  const todayDate = getLondonParts().date;
  const instructorSnap = await db.collection("users")
    .where("role", "==", "instructor")
    .get();

  let notificationsCreated = 0;

  for (const instructorDoc of instructorSnap.docs) {
    const instructorUid = instructorDoc.id;
    const carSnap = await db.doc(`settings/${instructorUid}-car`).get();
    if (!carSnap.exists) continue;

    const car = carSnap.data() || {};
    const checks = [
      { field: "insuranceExpiry", label: "Insurance", typePrefix: "insurance" },
      { field: "motExpiry", label: "MOT", typePrefix: "mot" }
    ];

    for (const check of checks) {
      const expiryDate = car?.[check.field];
      const daysUntilExpiry = daysBetweenDateStrings(expiryDate, todayDate);
      if (daysUntilExpiry === null) continue;
      if (![30, 7, 0, -1].includes(daysUntilExpiry)) continue;

      const notificationCopy = buildComplianceNotification({
        label: check.label,
        dateString: expiryDate,
        daysUntilExpiry
      });
      const stateKey = daysUntilExpiry === -1 ? "overdue" : `${daysUntilExpiry}d`;

      const notificationId = await createNotificationIfNeeded({
        ...notificationCopy,
        type: `${check.typePrefix}_${daysUntilExpiry === -1 ? "overdue" : "expiry_reminder"}`,
        recipientUid: instructorUid,
        recipientRole: "instructor",
        instructorId: instructorUid,
        url: "/car-details",
        dedupeKey: `${check.typePrefix}_compliance:${instructorUid}:${expiryDate}:${stateKey}`
      });

      if (notificationId) notificationsCreated += 1;
    }
  }

  console.log("Processed vehicle compliance notifications", {
    date: todayDate,
    notificationsCreated
  });
});

// ------------------------------------------------------------
// 1. Create Stripe Checkout Session (role-aware)
// ------------------------------------------------------------
exports.createCheckoutSession = onRequest({
  cors: ALLOWED_ORIGINS,
  secrets: [
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_INSTRUCTOR_MONTHLY",
    "STRIPE_PRICE_INSTRUCTOR_YEARLY",
    "STRIPE_PRICE_STUDENT_MONTHLY",
    "STRIPE_PRICE_STUDENT_YEARLY"
  ]
}, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const { referralCode, billingInterval, role: requestedRoleRaw } = req.body || {};

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const userRole = userData.role === "student" ? "student" : "instructor";
    const requestedRole = requestedRoleRaw === "student" ? "student" : "instructor";

    if (requestedRole !== userRole) {
      return res.status(403).json({ error: "Role mismatch for checkout session" });
    }

    const isYearly = billingInterval === "yearly";
    const priceId = requestedRole === "student"
      ? (isYearly ? process.env.STRIPE_PRICE_STUDENT_YEARLY : process.env.STRIPE_PRICE_STUDENT_MONTHLY)
      : (isYearly ? process.env.STRIPE_PRICE_INSTRUCTOR_YEARLY : process.env.STRIPE_PRICE_INSTRUCTOR_MONTHLY);

    if (!priceId) {
      return res.status(500).json({ error: `Stripe price not configured for ${requestedRole} ${isYearly ? "yearly" : "monthly"} plan` });
    }

    let customerId = userData.stripeCustomerId;

    // Create new customer or verify existing one still exists
    if (customerId) {
      try {
        await getStripe().customers.retrieve(customerId);
      } catch (e) {
        // Customer was deleted from Stripe — clear it and create fresh
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email,
        metadata: { firebaseUid: uid, role: userRole }
      });
      customerId = customer.id;
      await userDoc.ref.update({ stripeCustomerId: customerId });
    }

    const sessionParams = {
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${PUBLIC_APP_URL}${requestedRole === "student" ? "/student-dashboard" : "/pricing"}?success=true`,
      cancel_url: `${PUBLIC_APP_URL}${requestedRole === "student" ? "/student-dashboard" : "/pricing"}?cancelled=true`,
      subscription_data: {
        trial_period_days: 5
      },
      // Discount codes created in the Stripe dashboard work at checkout.
      allow_promotion_codes: true,
      metadata: { firebaseUid: uid, role: requestedRole, billingInterval: isYearly ? "yearly" : "monthly" }
    };

    const session = await getStripe().checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ------------------------------------------------------------
// 2. Stripe Webhook Handler
// ------------------------------------------------------------
exports.stripeWebhook = onRequest({ secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const stripeSubscription = session.subscription
          ? await getStripe().subscriptions.retrieve(session.subscription)
          : null;
        const updateData = {
          subscriptionStatus: stripeSubscription?.status === "trialing" ? "trialing" : "active",
          trialEnd: stripeSubscription?.trial_end ? stripeSubscription.trial_end * 1000 : null,
          currentPeriodEnd: stripeSubscription?.current_period_end ? stripeSubscription.current_period_end * 1000 : null,
          stripeSubscriptionId: session.subscription
        };

        // If this was a student with a referral code, store it
        if (session.metadata?.referralCode && session.metadata?.referredByInstructorUid) {
          updateData.referredByCode = session.metadata.referralCode;
          updateData.referredByInstructorUid = session.metadata.referredByInstructorUid;
        }

        // If instructor, generate referral code
        if (session.metadata?.role === "instructor") {
          const uid = session.metadata.firebaseUid;
          if (uid) {
            const existingCode = await db.collection("referralCodes").where("instructorUid", "==", uid).get();
            if (existingCode.empty) {
              const code = await generateUniqueReferralCode();
              await db.collection("referralCodes").add({
                code,
                instructorUid: uid,
                createdAt: Date.now()
              });
              updateData.referralCode = code;
            }
          }
        }

        await updateSubscriptionStatus(session.customer, updateData);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const status = sub.status === "active"
          ? "active"
          : sub.status === "trialing"
            ? "trialing"
            : sub.status === "past_due"
              ? "past_due"
              : sub.status;
        await updateSubscriptionStatus(sub.customer, {
          subscriptionStatus: status,
          stripeSubscriptionId: sub.id,
          trialEnd: sub.trial_end ? sub.trial_end * 1000 : null,
          currentPeriodEnd: sub.current_period_end ? sub.current_period_end * 1000 : null
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await updateSubscriptionStatus(sub.customer, {
          subscriptionStatus: "cancelled",
          stripeSubscriptionId: null,
          trialEnd: null,
          currentPeriodEnd: sub.ended_at ? sub.ended_at * 1000 : null
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.amount_paid > 0) {
          const updateData = {
            subscriptionStatus: "active"
          };
          updateData.currentPeriodEnd = invoice.lines?.data?.[0]?.period?.end
            ? invoice.lines.data[0].period.end * 1000
            : null;
          updateData.lastPaidAt = Date.now();
          await updateFirstPaidCharge(invoice.customer, invoice.status_transitions?.paid_at || invoice.created);
          await updateSubscriptionStatus(invoice.customer, updateData);
          // Credit referral earnings for student payments
          await creditReferralEarnings(invoice.customer);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await updateSubscriptionStatus(invoice.customer, {
          subscriptionStatus: "past_due"
        });
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  return res.status(200).json({ received: true });
});

// ------------------------------------------------------------
// 3. Create Stripe Customer Portal Session
// ------------------------------------------------------------
exports.createPortalSession = onRequest({ cors: ALLOWED_ORIGINS, secrets: ["STRIPE_SECRET_KEY"] }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const uid = decodedToken.uid;
    const { role: requestedRoleRaw } = req.body || {};
    const requestedRole = requestedRoleRaw === "student" ? "student" : "instructor";

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const userRole = userData.role === "student" ? "student" : "instructor";
    if (requestedRole !== userRole) {
      return res.status(403).json({ error: "Role mismatch for billing portal" });
    }
    if (!userData.stripeCustomerId) {
      return res.status(400).json({ error: "No subscription found" });
    }

    const returnUrl = `${PUBLIC_APP_URL}${requestedRole === "student" ? "/student-dashboard" : "/pricing"}`;

    const session = await getStripe().billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return res.status(500).json({ error: "Failed to create portal session" });
  }
});

// ------------------------------------------------------------
// 4. Student self-onboarding (callable from frontend)
// ------------------------------------------------------------
exports.registerStudentSelfOnboard = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const { email, password, name, phone, transmission, instructorId } = request.data || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
  const normalizedTransmission = transmission === "auto" ? "auto" : "manual";
  const normalizedInstructorId = typeof instructorId === "string" ? instructorId.trim() : "";

  if (!normalizedEmail || !password || !normalizedName || !normalizedInstructorId) {
    throw new HttpsError("invalid-argument", "Missing required onboarding details.");
  }
  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must be at least 6 characters.");
  }

  // Unified generic error message — avoids disclosing whether the failure
  // was "email already taken" vs "instructor not available", which would
  // let the callable be abused as an account/instructor enumeration oracle.
  const REGISTRATION_BLOCKED = "We couldn't complete registration with those details. Please check and try again, or sign in if you already have an account.";

  const instructorSnap = await db.collection("users").doc(normalizedInstructorId).get();
  if (!instructorSnap.exists) {
    throw new HttpsError("failed-precondition", REGISTRATION_BLOCKED);
  }

  const instructorData = instructorSnap.data();
  if (instructorData.role !== "instructor") {
    throw new HttpsError("failed-precondition", REGISTRATION_BLOCKED);
  }

  const directorySnap = await db.collection("instructorDirectory")
    .where("uid", "==", normalizedInstructorId)
    .limit(1)
    .get();
  if (directorySnap.empty) {
    throw new HttpsError("failed-precondition", REGISTRATION_BLOCKED);
  }

  try {
    await adminAuth.getUserByEmail(normalizedEmail);
    throw new HttpsError("failed-precondition", REGISTRATION_BLOCKED);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      // Expected when the student is signing up for the first time.
    } else if (error instanceof HttpsError) {
      throw error;
    } else {
      throw new HttpsError("failed-precondition", REGISTRATION_BLOCKED);
    }
  }

  let authUser;
  try {
    authUser = await adminAuth.createUser({
      email: normalizedEmail,
      password,
      displayName: normalizedName
    });
  } catch (error) {
    throw new HttpsError("failed-precondition", REGISTRATION_BLOCKED);
  }

  const studentData = {
    uid: authUser.uid,
    email: normalizedEmail,
    role: "student",
    createdAt: Date.now(),
    instructorId: normalizedInstructorId,
    name: normalizedName,
    phone: normalizedPhone,
    transmission: normalizedTransmission,
    perfectDriver: false,
    parkingPractice: false,
    confidenceLevel: 3,
    riskLevel: "steady"
  };

  const batch = db.batch();
  batch.set(db.collection("users").doc(authUser.uid), {
    uid: authUser.uid,
    email: normalizedEmail,
    role: "student",
    createdAt: Date.now(),
    instructorId: normalizedInstructorId
  });
  batch.set(db.collection("students").doc(authUser.uid), studentData);
  await batch.commit();

  return {
    ok: true,
    uid: authUser.uid,
    instructorId: normalizedInstructorId
  };
});

exports.sendVerificationEmailFallback = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }

  const authUser = await adminAuth.getUser(uid);
  if (!authUser.email) {
    throw new HttpsError("failed-precondition", "This account does not have an email address.");
  }
  if (authUser.emailVerified) {
    return {
      ok: true,
      alreadyVerified: true,
      email: authUser.email,
      provider: "none"
    };
  }

  const now = Date.now();
  const rateRef = db.collection("verificationEmailFallbacks").doc(uid);
  const rateSnap = await rateRef.get();
  const lastAttemptAt = rateSnap.exists ? Number(rateSnap.data().lastAttemptAt || 0) : 0;
  if (lastAttemptAt && now - lastAttemptAt < VERIFY_EMAIL_FALLBACK_COOLDOWN_MS) {
    throw new HttpsError("resource-exhausted", "Wait a minute before sending another verification email.");
  }

  await rateRef.set({
    uid,
    email: authUser.email,
    lastAttemptAt: now,
    updatedAt: new Date(now).toISOString()
  }, { merge: true });

  let providerResult;
  try {
    const link = await adminAuth.generateEmailVerificationLink(authUser.email);
    providerResult = await sendVerificationThroughFallbackProvider(authUser.email, link);
  } catch (error) {
    const message = error.message || String(error);
    console.error("[sendVerificationEmailFallback] failed", {
      uid,
      email: authUser.email,
      errorCode: error.code || null,
      errorMessage: message
    });
    await rateRef.set({
      lastErrorAt: new Date().toISOString(),
      lastErrorMessage: message.slice(0, 500)
    }, { merge: true });
    if (message === "fallback_email_provider_not_configured") {
      throw new HttpsError(
        "failed-precondition",
        "Backup email sender is not configured. Add SendGrid, Postmark, or Mailgun credentials."
      );
    }
    throw new HttpsError("internal", "Backup email sender failed. Check function logs.");
  }

  const sentAt = new Date().toISOString();
  await rateRef.set({
    lastSentAt: sentAt,
    lastProvider: providerResult.provider,
    lastStatusCode: providerResult.statusCode,
    lastErrorAt: "",
    lastErrorMessage: ""
  }, { merge: true });

  console.info("[sendVerificationEmailFallback] sent", {
    uid,
    email: authUser.email,
    provider: providerResult.provider,
    statusCode: providerResult.statusCode,
    sentAt
  });

  return {
    ok: true,
    alreadyVerified: false,
    email: authUser.email,
    provider: providerResult.provider,
    statusCode: providerResult.statusCode,
    sentAt
  };
});

exports.syncStudentAccountLink = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const uid = request.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User profile not found.");
  }

  const userData = userSnap.data() || {};
  if (userData.role !== "student") {
    return { linked: false, reason: "not-student" };
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Verify your email before linking your learner account.");
  }

  const existingLink = await findLinkedStudentByUid(uid);
  if (existingLink.linked) {
    return existingLink;
  }

  const email = request.auth.token.email || userData.email || "";
  const result = await linkStudentAccountByEmail({
    uid,
    email,
    instructorId: userData.instructorId || null
  });

  return result;
});

exports.fanoutLessonBookedNotification = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const lessonId = typeof request.data?.lessonId === "string" ? request.data.lessonId.trim() : "";
  if (!lessonId) {
    throw new HttpsError("invalid-argument", "lessonId is required.");
  }

  const lessonSnap = await db.collection("lessons").doc(lessonId).get();
  if (!lessonSnap.exists) {
    throw new HttpsError("not-found", "Lesson not found.");
  }

  const lesson = lessonSnap.data() || {};
  if (lesson.instructorId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "You do not have access to this lesson.");
  }

  await notifyLessonBooked(lessonId, lesson);
  return { ok: true };
});

exports.fanoutMessageNotification = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const messageId = typeof request.data?.messageId === "string" ? request.data.messageId.trim() : "";
  if (!messageId) {
    throw new HttpsError("invalid-argument", "messageId is required.");
  }

  const messageSnap = await db.collection("messages").doc(messageId).get();
  if (!messageSnap.exists) {
    throw new HttpsError("not-found", "Message not found.");
  }

  const message = messageSnap.data() || {};
  const uid = request.auth.uid;
  const { learnerUid } = await resolveMessageParticipants(message);

  if (message.instructorId !== uid && learnerUid !== uid) {
    throw new HttpsError("permission-denied", "You do not have access to this message.");
  }

  await processNewMessageNotification(messageId, message);
  return { ok: true };
});

// ------------------------------------------------------------
// 4a. Send Test Push To Self (dev-only self-diagnostic)
// ------------------------------------------------------------
exports.sendTestPushToSelf = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first");
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return { ok: false, reason: "no-user-doc" };
  const data = userSnap.data();
  const tokens = collectUserTokens(data);
  if (!tokens.length) return { ok: false, reason: "no-token" };

  const payload = {
    title: "App7i test notification",
    message: "If you see this, push notifications are working.",
    type: "test",
    url: "/notifications"
  };

  const badTokens = [];
  const results = await Promise.all(tokens.map(async (token) => {
    const platform = data?.fcmTokensMeta?.[token]?.platform || "unknown";
    try {
      const messageId = await messaging.send(buildPushMessage(token, payload));
      return { tokenPrefix: token.slice(0, 16), platform, ok: true, messageId };
    } catch (error) {
      if (error?.code === "messaging/registration-token-not-registered" ||
          error?.code === "messaging/invalid-registration-token") {
        badTokens.push(token);
      }
      return { tokenPrefix: token.slice(0, 16), platform, ok: false, error: error?.code || error?.message || "unknown" };
    }
  }));
  if (badTokens.length) await clearInvalidPushTokens(uid, badTokens);
  const anyOk = results.some((r) => r.ok);
  return { ok: anyOk, results, tokenCount: tokens.length };
});

// ------------------------------------------------------------
// 5. Validate Referral Code (callable from frontend)
// ------------------------------------------------------------
exports.validateReferralCode = onRequest({ cors: ALLOWED_ORIGINS }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code } = req.body;
    if (!code || typeof code !== "string" || code.trim().length === 0 || code.trim().length > 20) {
      return res.status(200).json({ valid: false });
    }

    const snap = await db.collection("referralCodes").where("code", "==", code.toUpperCase()).get();
    if (snap.empty) {
      return res.status(200).json({ valid: false });
    }

    const refData = snap.docs[0].data();
    // Get instructor name
    const userSnap = await db.collection("users").where("uid", "==", refData.instructorUid).get();
    let instructorName = "Your instructor";
    if (!userSnap.empty) {
      const profileDoc = await db.doc(`settings/${refData.instructorUid}-profile`).get();
      if (profileDoc.exists && profileDoc.data().name) {
        instructorName = profileDoc.data().name;
      }
    }

    return res.status(200).json({ valid: true, instructorName });
  } catch (error) {
    console.error("Validate referral error:", error);
    return res.status(500).json({ valid: false });
  }
});

// ------------------------------------------------------------
// Helper: Generate unique 6-char referral code
// ------------------------------------------------------------
async function generateUniqueReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempts = 0;
  while (attempts < 10) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const exists = await db.collection("referralCodes").where("code", "==", code).get();
    if (exists.empty) return code;
    attempts++;
  }
  // Fallback: add timestamp suffix
  return "REF" + Date.now().toString(36).toUpperCase().slice(-5);
}

// ------------------------------------------------------------
// Helper: Credit referral earnings when a student invoice is paid
// ------------------------------------------------------------
async function creditReferralEarnings(stripeCustomerId) {
  const userSnap = await db.collection("users").where("stripeCustomerId", "==", stripeCustomerId).get();
  if (userSnap.empty) return;

  const userData = userSnap.docs[0].data();
  if (!userData.referredByInstructorUid || userData.role !== "student") return;

  const instructorUid = userData.referredByInstructorUid;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Check if we already have an earnings record for this month
  const existingSnap = await db.collection("referralEarnings")
    .where("instructorUid", "==", instructorUid)
    .where("month", "==", month)
    .get();

  if (existingSnap.empty) {
    await db.collection("referralEarnings").add({
      instructorUid,
      month,
      activeStudents: 1,
      amountEarned: 0.50,
      paidOut: false,
      createdAt: Date.now()
    });
  } else {
    const doc = existingSnap.docs[0];
    await doc.ref.update({
      activeStudents: (doc.data().activeStudents || 0) + 1,
      amountEarned: (doc.data().amountEarned || 0) + 0.50
    });
  }

  // Update instructor's lifetime total (doc ID == UID)
  const instructorRef = db.collection("users").doc(instructorUid);
  const instructorSnap = await instructorRef.get();
  if (instructorSnap.exists) {
    const currentTotal = instructorSnap.data().referralEarningsTotal || 0;
    await instructorRef.update({
      referralEarningsTotal: currentTotal + 0.50
    });
  }
}

// ------------------------------------------------------------
// Helper: Update user subscription status by Stripe customer ID
// ------------------------------------------------------------
async function updateSubscriptionStatus(stripeCustomerId, data) {
  const snap = await db.collection("users").where("stripeCustomerId", "==", stripeCustomerId).get();
  if (snap.empty) {
    console.error("No user found for Stripe customer:", stripeCustomerId);
    return;
  }
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, data));
  await batch.commit();
  console.log("Updated subscription for customer", stripeCustomerId, data);
}

// ============================================================
// Phase 3: anonymous lesson feedback aggregator
// Triggers when a new lessonFeedback doc lands. Counts unprocessed
// responses for that instructor; once 10 accumulate, generates a
// deterministic, positive-tone summary and marks them processed.
// Instructors NEVER see individual rows — only the grouped summary.
// ============================================================

const FEEDBACK_SUMMARY_THRESHOLD = 10;

// Keyword buckets for deterministic theme extraction. Grouped by intent.
const POSITIVE_KEYWORDS = {
  clarity: ["clear", "explain", "understood", "understand", "explanation"],
  patience: ["patient", "patience", "calm", "kind", "supportive"],
  confidence: ["confident", "confidence", "comfortable", "safe", "reassur"],
  pacing: ["good pace", "right pace", "well-paced", "well paced"],
  helpful: ["helpful", "useful", "great", "amazing", "excellent", "brilliant"],
  feedback_quality: ["feedback", "advice", "tip", "tips"]
};

const CONSTRUCTIVE_KEYWORDS = {
  pace_slower: ["slow", "slower", "too fast", "rushed"],
  more_practice: ["more practice", "practice more", "practise more"],
  homework: ["homework", "task", "assignment"],
  recap: ["recap", "summary", "summarise", "summarize", "review"],
  exam_focus: ["exam", "test prep", "test practice", "mock"],
  examples: ["example", "demonstrate", "show me"],
  patience_more: ["impatient", "frustrated", "stressed"]
};

function bucketTextResponses(texts, buckets) {
  const counts = {};
  for (const key of Object.keys(buckets)) counts[key] = 0;
  for (const raw of texts) {
    const lower = String(raw || "").toLowerCase();
    if (!lower.trim()) continue;
    for (const [bucketKey, keywords] of Object.entries(buckets)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        counts[bucketKey] += 1;
      }
    }
  }
  return counts;
}

function topBuckets(counts, n = 3) {
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key);
}

const POSITIVE_PHRASES = {
  clarity: "your clear explanations",
  patience: "your patient and calm teaching style",
  confidence: "feeling more confident after lessons",
  pacing: "the pacing of your lessons",
  helpful: "how helpful and supportive your lessons are",
  feedback_quality: "the quality of feedback you give"
};

const CONSTRUCTIVE_PHRASES = {
  pace_slower: "a slightly slower pace during difficult topics",
  more_practice: "more time practising tricky manoeuvres",
  homework: "clearer homework tasks after each lesson",
  recap: "a short recap at the end of each lesson",
  exam_focus: "more exam-style practice and mock tests",
  examples: "more worked examples or demonstrations",
  patience_more: "extra patience during stressful moments"
};

const WANTS_MORE_PHRASES = {
  "More practice questions": "more practice questions",
  "Slower explanations": "slower-paced explanations",
  "More homework": "homework after lessons",
  "More exam practice": "exam practice",
  "More recap at the end": "a short recap at the end of each lesson",
  "More confidence building": "confidence-building drills",
  "Other": "other improvements"
};

function joinHumanList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function buildLikedSection(positiveBuckets, averageRating) {
  if (positiveBuckets.length === 0) {
    return averageRating >= 4
      ? "Students are giving consistently positive ratings — keep doing what's working."
      : "Students appreciate your effort and dedication to their progress.";
  }
  const phrases = positiveBuckets.map((k) => POSITIVE_PHRASES[k]).filter(Boolean);
  return `Students appreciate ${joinHumanList(phrases)}.`;
}

function buildWantMoreSection(constructiveBuckets, wantsMoreBuckets) {
  const phrases = [];
  for (const k of constructiveBuckets) {
    if (CONSTRUCTIVE_PHRASES[k]) phrases.push(CONSTRUCTIVE_PHRASES[k]);
  }
  for (const k of wantsMoreBuckets) {
    if (WANTS_MORE_PHRASES[k] && phrases.length < 4) phrases.push(WANTS_MORE_PHRASES[k]);
  }
  if (phrases.length === 0) {
    return "No clear improvement themes from this batch — students seem broadly happy.";
  }
  return `Some students would benefit from ${joinHumanList(phrases.slice(0, 3))}.`;
}

function buildSuggestion(constructiveBuckets, wantsMoreBuckets) {
  // Pick the single most actionable suggestion from the highest-priority bucket.
  const all = [...constructiveBuckets, ...wantsMoreBuckets];
  if (all.includes("recap") || all.includes("More recap at the end")) {
    return "Try ending each lesson with a 2-minute recap and 1-2 clear homework tasks so students know exactly what to practise before the next lesson.";
  }
  if (all.includes("homework") || all.includes("More homework")) {
    return "Consider sending a short written summary after each lesson with 1-2 specific things to practise.";
  }
  if (all.includes("pace_slower") || all.includes("Slower explanations")) {
    return "Slowing the pace slightly on harder topics, with one more example before moving on, often makes a big difference.";
  }
  if (all.includes("more_practice") || all.includes("More practice questions")) {
    return "Try adding 5 minutes of free practice on the trickiest skill at the end of each lesson.";
  }
  if (all.includes("exam_focus") || all.includes("More exam practice")) {
    return "A short mock-exam segment in every third lesson tends to lift confidence quickly.";
  }
  return "Keep doing what you're doing — student responses are positive overall. A short end-of-lesson recap is the most-requested polish.";
}

function summariseFeedback(items) {
  const ratings = items.map((i) => Number(i.rating || 0)).filter((r) => r >= 1 && r <= 5);
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0;

  const positiveCounts = bucketTextResponses(
    items.map((i) => i.positiveText || ""),
    POSITIVE_KEYWORDS
  );
  const constructiveCounts = bucketTextResponses(
    items.map((i) => i.constructiveText || ""),
    CONSTRUCTIVE_KEYWORDS
  );

  const wantsMoreCounts = {};
  for (const item of items) {
    for (const chip of (item.wantsMore || [])) {
      wantsMoreCounts[chip] = (wantsMoreCounts[chip] || 0) + 1;
    }
  }
  const topWantsMore = Object.entries(wantsMoreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const positiveBuckets = topBuckets(positiveCounts, 3);
  const constructiveBuckets = topBuckets(constructiveCounts, 3);

  return {
    averageRating,
    basedOnCount: items.length,
    liked: buildLikedSection(positiveBuckets, averageRating),
    wantMore: buildWantMoreSection(constructiveBuckets, topWantsMore),
    suggestion: buildSuggestion(constructiveBuckets, topWantsMore),
    generatedAt: Date.now()
  };
}

exports.onLessonFeedbackCreated = onDocumentCreated("lessonFeedback/{feedbackId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot?.exists) return;
  const created = snapshot.data() || {};
  const instructorId = created.instructorId;
  if (!instructorId) return;

  // Pull all feedback for this instructor and filter unprocessed in memory.
  // Client-side writes don't include `summaryId`, so equality queries miss
  // most docs. In-memory filter is simpler and cheap at this scale.
  const allSnap = await db.collection("lessonFeedback")
    .where("instructorId", "==", instructorId)
    .get();
  const candidates = allSnap.docs.filter((d) => !d.data().summaryId);

  if (candidates.length < FEEDBACK_SUMMARY_THRESHOLD) {
    console.log("[feedbackSummary] below threshold", {
      instructorId,
      have: candidates.length,
      need: FEEDBACK_SUMMARY_THRESHOLD
    });
    return;
  }

  // Batch oldest first so summaries reflect what came in earliest.
  const batchDocs = candidates
    .sort((a, b) => Number(a.data().createdAt || 0) - Number(b.data().createdAt || 0))
    .slice(0, FEEDBACK_SUMMARY_THRESHOLD);

  const items = batchDocs.map((d) => d.data());
  const summary = summariseFeedback(items);

  // Doc id encodes ordering: instructorUid_<unix-ms>
  const summaryId = `${instructorId}_${Date.now()}`;
  const summaryRef = db.collection("instructorFeedbackSummaries").doc(summaryId);

  const writeBatch = db.batch();
  writeBatch.set(summaryRef, {
    instructorId,
    ...summary
  });
  for (const docSnap of batchDocs) {
    writeBatch.update(docSnap.ref, { summaryId });
  }
  await writeBatch.commit();

  console.log("[feedbackSummary] created", {
    instructorId,
    summaryId,
    basedOnCount: summary.basedOnCount,
    averageRating: summary.averageRating
  });

  // Notify the instructor — wording deliberately positive and neutral.
  await createNotificationIfNeeded({
    title: "Student feedback summary",
    message: "Your anonymous student feedback summary is ready.",
    type: "instructor_feedback_summary",
    recipientUid: instructorId,
    recipientRole: "instructor",
    instructorId,
    url: `/feedback-summary`,
    dedupeKey: `instructor_feedback_summary:${summaryId}`
  });
});

async function updateFirstPaidCharge(stripeCustomerId, paidAtSeconds) {
  const snap = await db.collection("users").where("stripeCustomerId", "==", stripeCustomerId).get();
  if (snap.empty) return;
  const paidAt = (paidAtSeconds || Math.floor(Date.now() / 1000)) * 1000;
  const refundEligibleUntil = paidAt + (14 * 24 * 60 * 60 * 1000);
  const batch = db.batch();
  snap.docs.forEach((userDoc) => {
    if (!userDoc.data().firstPaidChargeAt) {
      batch.update(userDoc.ref, {
        firstPaidChargeAt: paidAt,
        refundEligibleUntil
      });
    }
  });
  await batch.commit();
}

// ------------------------------------------------------------
// recordSignIn — new-device sign-in security email
// Called by the client after every successful sign-in (non-blocking).
// Sends a security alert only the first time a device is seen.
// ------------------------------------------------------------
const crypto = require("crypto");
const MAX_KNOWN_DEVICES = 10;

exports.recordSignIn = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");

  const { deviceId, platform, userAgent, model } = request.data || {};

  // Build a stable device fingerprint
  const raw = [uid, deviceId || "", platform || "", model || ""].join("|");
  const deviceHash = crypto.createHash("sha256").update(raw).digest("hex");

  console.log("[recordSignIn] start", { uid, platform, deviceHash: deviceHash.slice(0, 8) });

  const devicesCol = db.collection("users").doc(uid).collection("knownDevices");
  const deviceRef = devicesCol.doc(deviceHash);
  const deviceSnap = await deviceRef.get();

  if (deviceSnap.exists) {
    // Known device — just update lastSeenAt, no email
    await deviceRef.update({ lastSeenAt: Date.now() });
    console.log("[recordSignIn] known device, skipping email", { uid, deviceHash: deviceHash.slice(0, 8) });
    return { ok: true, newDevice: false };
  }

  // New device — record it first (don't let email failure block this)
  const now = Date.now();
  await deviceRef.set({
    deviceHash,
    platform: platform || "unknown",
    model: model || "",
    userAgent: (userAgent || "").slice(0, 300),
    firstSeenAt: now,
    lastSeenAt: now
  });

  // Prune oldest devices if over the limit
  try {
    const allSnap = await devicesCol.orderBy("firstSeenAt", "asc").get();
    if (allSnap.size > MAX_KNOWN_DEVICES) {
      const toDelete = allSnap.docs.slice(0, allSnap.size - MAX_KNOWN_DEVICES);
      const batch = db.batch();
      toDelete.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (pruneErr) {
    console.warn("[recordSignIn] pruning failed (non-fatal)", pruneErr?.message);
  }

  // Fetch the user's email from Auth
  let userEmail;
  try {
    const authUser = await adminAuth.getUser(uid);
    userEmail = authUser.email;
  } catch {
    console.warn("[recordSignIn] could not fetch auth user email, skipping email", { uid });
    return { ok: true, newDevice: true, emailSent: false };
  }

  if (!userEmail) {
    return { ok: true, newDevice: true, emailSent: false };
  }

  // Build the security alert email
  const signInTime = new Date(now).toLocaleString("en-GB", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  const platformLabel = platform === "android" ? "Android" : platform === "ios" ? "iOS" : "Web / Desktop";
  const modelLabel = model ? ` (${model})` : "";
  const deviceLabel = `${platformLabel}${modelLabel}`;

  const emailHtml = [
    `<h2 style="margin:0 0 12px;font-size:18px;color:#111827;">New sign-in to your App7i account</h2>`,
    `<p style="color:#374151;margin:0 0 8px;">We noticed a sign-in from a device we haven't seen before.</p>`,
    `<table style="border-collapse:collapse;width:100%;margin:16px 0;">`,
    `<tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%;color:#374151;">Time</td>`,
    `<td style="padding:8px 12px;color:#111827;">${signInTime} (London)</td></tr>`,
    `<tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;color:#374151;">Device</td>`,
    `<td style="padding:8px 12px;color:#111827;">${deviceLabel}</td></tr>`,
    `</table>`,
    `<p style="color:#374151;margin:16px 0 8px;">If this was you, no action is needed.</p>`,
    `<p style="color:#374151;margin:0;">If you don't recognise this sign-in, `,
    `<strong>change your password immediately</strong> and contact `,
    `<a href="mailto:support@app7i.com" style="color:#047857;">support@app7i.com</a>.</p>`
  ].join("");

  const emailText = [
    "New sign-in to your App7i account",
    "",
    "We noticed a sign-in from a device we haven't seen before.",
    `Time: ${signInTime} (London)`,
    `Device: ${deviceLabel}`,
    "",
    "If this was you, no action is needed.",
    "If you don't recognise this sign-in, change your password immediately and contact support@app7i.com."
  ].join("\n");

  try {
    const result = await sendEmailWithFallback({
      to: userEmail,
      subject: "New sign-in to your App7i account",
      html: emailHtml,
      text: emailText
    });
    console.log("[recordSignIn] security email sent", { uid, provider: result.provider });
    return { ok: true, newDevice: true, emailSent: true, provider: result.provider };
  } catch (emailErr) {
    // Email failure must never block login
    console.error("[recordSignIn] email send failed (non-fatal)", {
      uid,
      error: emailErr?.message?.slice(0, 200)
    });
    return { ok: true, newDevice: true, emailSent: false };
  }
});

// ------------------------------------------------------------
// deleteAccount — full server-side account deletion
// Google Play Data Deletion policy + Apple 5.1.1(v) require in-app
// account deletion to remove the account AND its associated data.
// Clients can't do this themselves: rules block them from knownDevices,
// notificationDispatches and other users' referencing docs. This callable
// wipes everything the account owns, then deletes the Auth user.
// Lessons are kept on instructor accounts' behalf when a STUDENT deletes:
// they are the instructor's business records of services rendered.
// ------------------------------------------------------------
const DELETE_BATCH_SIZE = 400;

async function collectQueryRefs(query, refs) {
  const snap = await query.get();
  snap.docs.forEach((d) => refs.push(d.ref));
}

exports.deleteAccount = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");

  const refs = [];

  // Both sweeps run unconditionally: users/{uid}.role is client-writable at
  // create time, so branching on it would let a mislabeled account skip half
  // its cleanup. Wrong-role queries are self-scoped no-ops.

  // Instructor-owned business data (everything carries instructorId).
  const ownedCollections = [
    "students", "lessons", "expenses", "mileage", "tips", "waitingList",
    "typing", "messages", "conversationBlocks", "lessonFeedback",
    "notifications", "notificationDispatches"
  ];
  for (const coll of ownedCollections) {
    await collectQueryRefs(db.collection(coll).where("instructorId", "==", uid), refs);
  }
  await collectQueryRefs(db.collection("instructorDirectory").where("uid", "==", uid), refs);
  // Feedback summaries encode ownership in the doc id prefix `${uid}_`.
  await collectQueryRefs(
    db.collection("instructorFeedbackSummaries")
      .where(FieldPath.documentId(), ">=", `${uid}_`)
      .where(FieldPath.documentId(), "<", `${uid}_\uf8ff`),
    refs
  );
  refs.push(db.collection("settings").doc(`${uid}-car`));
  refs.push(db.collection("settings").doc(`${uid}-profile`));

  // Learner-side data.
  const studentSnap = await db.collection("students").where("uid", "==", uid).get();
  const studentIds = studentSnap.docs.map((d) => d.id);
  studentSnap.docs.forEach((d) => refs.push(d.ref));
  for (const sid of studentIds) {
    await collectQueryRefs(db.collection("messages").where("sender", "==", sid), refs);
    await collectQueryRefs(db.collection("messages").where("receiver", "==", sid), refs);
    await collectQueryRefs(db.collection("typing").where("studentId", "==", sid), refs);
    await collectQueryRefs(db.collection("conversationBlocks").where("studentId", "==", sid), refs);
  }
  // Anonymous feedback rows encode ownership in the doc id suffix `__${uid}`
  // (no student field in the body by design), so filter a full scan.
  const feedbackSnap = await db.collection("lessonFeedback").get();
  feedbackSnap.docs
    .filter((d) => d.id.endsWith(`__${uid}`))
    .forEach((d) => refs.push(d.ref));

  // Common to both roles. supportTickets store uid/email/name/message \u2014
  // admin-only by rules, so only this callable can purge them.
  await collectQueryRefs(db.collection("supportTickets").where("uid", "==", uid), refs);
  await collectQueryRefs(db.collection("notifications").where("recipientUid", "==", uid), refs);
  await collectQueryRefs(db.collection("notificationDispatches").where("recipientUid", "==", uid), refs);
  for (const sub of ["knownDevices", "settings"]) {
    const subSnap = await db.collection("users").doc(uid).collection(sub).get();
    subSnap.docs.forEach((d) => refs.push(d.ref));
  }
  refs.push(db.collection("users").doc(uid));

  for (let i = 0; i < refs.length; i += DELETE_BATCH_SIZE) {
    const batch = db.batch();
    refs.slice(i, i + DELETE_BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  await adminAuth.deleteUser(uid);

  console.log("[deleteAccount] account deleted", { uid, docsDeleted: refs.length });
  return { ok: true, docsDeleted: refs.length };
});
