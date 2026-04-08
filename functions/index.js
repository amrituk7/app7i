const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

const PUBLIC_APP_URL = "https://app7i.com"; // v4
const ALLOWED_ORIGINS = [
  PUBLIC_APP_URL,
  "https://www.app7i.com",
  "https://roadmaster-23cbc.web.app",
  "https://roadmaster-23cbc.firebaseapp.com"
];

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
        trial_period_days: 3
      },
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
        const updateData = {
          subscriptionStatus: "active",
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
        const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status;
        await updateSubscriptionStatus(sub.customer, {
          subscriptionStatus: status,
          stripeSubscriptionId: sub.id
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await updateSubscriptionStatus(sub.customer, {
          subscriptionStatus: "cancelled",
          stripeSubscriptionId: null
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        // Credit referral earnings for student payments
        await creditReferralEarnings(invoice.customer);
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

  const instructorSnap = await db.collection("users").doc(normalizedInstructorId).get();
  if (!instructorSnap.exists) {
    throw new HttpsError("not-found", "Selected instructor could not be verified.");
  }

  const instructorData = instructorSnap.data();
  if (instructorData.role !== "instructor") {
    throw new HttpsError("permission-denied", "Selected instructor is not available.");
  }

  const directorySnap = await db.collection("instructorDirectory")
    .where("uid", "==", normalizedInstructorId)
    .limit(1)
    .get();
  if (directorySnap.empty) {
    throw new HttpsError("permission-denied", "Selected instructor is not published for self-onboarding.");
  }

  try {
    await adminAuth.getUserByEmail(normalizedEmail);
    throw new HttpsError("already-exists", "An account already exists for that email.");
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      // Expected when the student is signing up for the first time.
    } else if (error.code !== "already-exists") {
      throw new HttpsError("internal", "Unable to verify the email address.");
    } else {
      throw error;
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
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "An account already exists for that email.");
    }
    throw new HttpsError("internal", "Failed to create the account.");
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

// ------------------------------------------------------------
// 5. Validate Referral Code (callable from frontend)
// ------------------------------------------------------------
exports.validateReferralCode = onRequest({ cors: ALLOWED_ORIGINS }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code } = req.body;
    if (!code) {
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
// 6. Monthly Referral Earnings Calculation (scheduled)
// ------------------------------------------------------------
async function calculateMonthlyReferralEarningsJob() {
  // Keep the monthly rollup logic here so it can be re-enabled once Blaze/Scheduler is available.
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Get all instructors with referral codes
  const codesSnap = await db.collection("referralCodes").get();

  for (const codeDoc of codesSnap.docs) {
    const instructorUid = codeDoc.data().instructorUid;

    // Count active students referred by this instructor
    const studentsSnap = await db.collection("users")
      .where("referredByInstructorUid", "==", instructorUid)
      .where("subscriptionStatus", "==", "active")
      .get();

    const activeStudents = studentsSnap.size;
    const amountEarned = activeStudents * 0.50;

    if (activeStudents > 0) {
      const existingMonth = await db.collection("referralEarnings")
        .where("instructorUid", "==", instructorUid)
        .where("month", "==", month)
        .limit(1)
        .get();

      if (existingMonth.empty) {
        await db.collection("referralEarnings").add({
          instructorUid,
          month,
          activeStudents,
          amountEarned,
          paidOut: false,
          createdAt: Date.now()
        });
      } else {
        await existingMonth.docs[0].ref.update({
          activeStudents,
          amountEarned
        });
      }
    }
  }

  console.log("Monthly referral earnings calculated for", month);
}

// ------------------------------------------------------------
// Helper: Get or create a coupon (amount in pence, duration in months)
// ------------------------------------------------------------
async function getOrCreateCoupon(name, amountOffPence, durationMonths) {
  try {
    const coupons = await getStripe().coupons.list({ limit: 100 });
    const existing = coupons.data.find((c) => c.name === name && c.valid);
    if (existing) return existing;

    return await getStripe().coupons.create({
      name,
      amount_off: amountOffPence,
      currency: "gbp",
      duration: durationMonths === 1 ? "once" : "repeating",
      duration_in_months: durationMonths > 1 ? durationMonths : undefined
    });
  } catch (err) {
    console.error("Coupon error (non-fatal):", err.message);
    return null;
  }
}

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

  // Update instructor's lifetime total
  const instructorSnap = await db.collection("users").where("uid", "==", instructorUid).get();
  if (!instructorSnap.empty) {
    const currentTotal = instructorSnap.docs[0].data().referralEarningsTotal || 0;
    await instructorSnap.docs[0].ref.update({
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
