// Instructor-owned business ledger: expenses + mileage.
//
// These records support the net-profit calculation on Earnings and the HMRC
// tax-year summary PDF. They live in their own Firestore collections so they
// are completely separate from anything a student can see.
//
// HMRC mileage policy used in computeMileageAllowance:
//   - First 10,000 business miles in a tax year @ £0.45/mile
//   - All remaining miles in the same tax year @ £0.25/mile
// Source: https://www.gov.uk/expenses-if-youre-self-employed/travel

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { firestore } from "./firebase";
import type { Expense, ExpenseCategory, MileageEntry } from "../types";

function db() {
  if (!firestore) throw new Error("Firestore not configured.");
  return firestore;
}

function tsToMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function asExpense(id: string, data: DocumentData): Expense {
  return {
    id,
    instructorId: typeof data.instructorId === "string" ? data.instructorId : "",
    date: typeof data.date === "string" ? data.date : "",
    category: (typeof data.category === "string" ? data.category : "other") as ExpenseCategory,
    amount: Number(data.amount) || 0,
    description: typeof data.description === "string" ? data.description : "",
    vendor: typeof data.vendor === "string" ? data.vendor : undefined,
    createdAt: tsToMillis(data.createdAt),
  };
}

function asMileage(id: string, data: DocumentData): MileageEntry {
  return {
    id,
    instructorId: typeof data.instructorId === "string" ? data.instructorId : "",
    date: typeof data.date === "string" ? data.date : "",
    miles: Number(data.miles) || 0,
    description: typeof data.description === "string" ? data.description : undefined,
    lessonId: typeof data.lessonId === "string" ? data.lessonId : undefined,
    createdAt: tsToMillis(data.createdAt),
  };
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(
  instructorUid: string,
  options: { max?: number; sinceIsoDate?: string } = {},
): Promise<Expense[]> {
  const { max = 200, sinceIsoDate } = options;
  const constraints = [
    where("instructorId", "==", instructorUid),
    orderBy("date", "desc"),
    fsLimit(max),
  ];
  if (sinceIsoDate) {
    // Firestore requires the equality filter first, then range filters in
    // ascending order. We can't add `where("date", ">=", X)` here because
    // it'd require a different composite index; we filter client-side instead.
  }
  const snap = await getDocs(query(collection(db(), "expenses"), ...constraints));
  const list = snap.docs.map((d) => asExpense(d.id, d.data()));
  return sinceIsoDate ? list.filter((e) => e.date >= sinceIsoDate) : list;
}

export async function addExpense(input: Omit<Expense, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db(), "expenses"), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExpense(
  expenseId: string,
  patch: Partial<Omit<Expense, "id" | "instructorId" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db(), "expenses", expenseId), patch);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db(), "expenses", expenseId));
}

// ─── Mileage ──────────────────────────────────────────────────────────────────

export async function getMileageEntries(
  instructorUid: string,
  options: { max?: number; sinceIsoDate?: string } = {},
): Promise<MileageEntry[]> {
  const { max = 200, sinceIsoDate } = options;
  const snap = await getDocs(
    query(
      collection(db(), "mileage"),
      where("instructorId", "==", instructorUid),
      orderBy("date", "desc"),
      fsLimit(max),
    ),
  );
  const list = snap.docs.map((d) => asMileage(d.id, d.data()));
  return sinceIsoDate ? list.filter((m) => m.date >= sinceIsoDate) : list;
}

export async function addMileageEntry(
  input: Omit<MileageEntry, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db(), "mileage"), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMileageEntry(
  mileageId: string,
  patch: Partial<Omit<MileageEntry, "id" | "instructorId" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db(), "mileage", mileageId), patch);
}

export async function deleteMileageEntry(mileageId: string): Promise<void> {
  await deleteDoc(doc(db(), "mileage", mileageId));
}

// ─── Helpers: HMRC mileage allowance + tax year boundaries ────────────────────

/**
 * Compute the HMRC mileage allowance owed for a list of mileage entries.
 * Splits the total into 45p band (first 10,000 mi) and 25p band (rest).
 * Returns pounds, two-decimal-rounded.
 */
export function computeMileageAllowance(totalMiles: number): {
  total: number;
  band45: { miles: number; amount: number };
  band25: { miles: number; amount: number };
} {
  const band45Miles = Math.min(10_000, Math.max(0, totalMiles));
  const band25Miles = Math.max(0, totalMiles - 10_000);
  const band45Amount = Math.round(band45Miles * 0.45 * 100) / 100;
  const band25Amount = Math.round(band25Miles * 0.25 * 100) / 100;
  return {
    total: Math.round((band45Amount + band25Amount) * 100) / 100,
    band45: { miles: band45Miles, amount: band45Amount },
    band25: { miles: band25Miles, amount: band25Amount },
  };
}

/**
 * UK tax year covering the given date (default = today). Tax year runs
 * 6 April → 5 April. Returns ISO date strings and a friendly label.
 */
export function ukTaxYearBounds(now = new Date()): {
  startIso: string;
  endIso: string;
  label: string;
} {
  const year = now.getMonth() > 2 || (now.getMonth() === 3 && now.getDate() >= 6)
    ? now.getFullYear()
    : now.getFullYear() - 1;
  const startIso = `${year}-04-06`;
  const endIso = `${year + 1}-04-05`;
  const shortStart = String(year).slice(-2);
  const shortEnd = String(year + 1).slice(-2);
  return { startIso, endIso, label: `Tax year ${shortStart}/${shortEnd}` };
}

/** Friendly labels for the expense categories. */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: "Fuel",
  insurance: "Insurance",
  mot: "MOT",
  service: "Service",
  tax: "Vehicle tax",
  adi_badge: "ADI badge fee",
  training: "Training / CPD",
  phone: "Phone / data",
  marketing: "Marketing",
  other: "Other",
};
