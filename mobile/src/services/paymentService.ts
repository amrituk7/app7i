import { httpsCallable } from "firebase/functions";
import { firebaseFunctions } from "./firebase";

export type PaymentReminderResult = {
  ok: true;
  delivery: "in_app" | "email" | "handoff";
  phone?: string;
  message?: string;
  emailSent?: boolean;
  reminderCount: number;
};

export async function sendStudentPaymentReminder(
  lessonId: string,
): Promise<PaymentReminderResult> {
  if (!firebaseFunctions) throw new Error("Payment reminders are unavailable.");
  const call = httpsCallable<{ lessonId: string }, PaymentReminderResult>(
    firebaseFunctions,
    "sendStudentPaymentReminder",
  );
  const result = await call({ lessonId });
  return result.data;
}
