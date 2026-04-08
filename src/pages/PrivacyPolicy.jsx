import React from "react";
import { Link } from "react-router-dom";

const BRAND_NAME = "App7i";
const SUPPORT_EMAIL = "support@app7i.com";
const LEGAL_ENTITY = `Amritpal Singh (trading as ${BRAND_NAME})`;

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <p className="legal-meta">{BRAND_NAME} | Last updated: March 2026</p>

      <h2>1. Who We Are</h2>
      <p>
        This Privacy Policy is issued by <strong>{LEGAL_ENTITY}</strong>, the developer and
        operator of the {BRAND_NAME} platform. Contact:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
      <p>
        This policy explains how {BRAND_NAME} collects, uses, stores, and protects your
        personal data when you use the Platform, in accordance with the UK General Data
        Protection Regulation (UK GDPR) and the Data Protection Act 2018 (DPA 2018).
      </p>

      <h2>2. Data We Collect and Why</h2>
      <p><strong>For Instructors (business accounts):</strong></p>
      <ul>
        <li>
          <strong>Account data:</strong> Email address, name, phone number, and profile
          details - used to create and manage your instructor account and to personalise the
          Platform.
        </li>
        <li>
          <strong>Lesson and earnings data:</strong> Lesson records, dates, times, durations,
          rates, and payment status - used to provide the core lesson management features.
        </li>
        <li>
          <strong>Profile and car data:</strong> ADI badge number, car details, and pricing
          information - used to generate invoices and student-facing profile content.
        </li>
        <li>
          <strong>Device tokens:</strong> Push notification tokens - used to send lesson
          reminders, only if you grant permission.
        </li>
      </ul>
      <p><strong>For Students (learner drivers):</strong></p>
      <ul>
        <li>
          <strong>Account data:</strong> Email address - used to link your student account to
          your instructor's records.
        </li>
        <li>
          <strong>Student records entered by your Instructor:</strong> Name, phone number,
          transmission preference, lesson notes, and progress data - entered and controlled by
          your Instructor.
        </li>
        <li>
          <strong>Messages:</strong> Text messages exchanged between you and your Instructor -
          stored in our database and visible to both parties.
        </li>
      </ul>

      <h2>3. Legal Basis for Processing</h2>
      <ul>
        <li>
          <strong>Contract performance (UK GDPR Art. 6(1)(b)):</strong> Processing necessary to
          provide the Platform service to Instructors and Students.
        </li>
        <li>
          <strong>Legitimate interests (UK GDPR Art. 6(1)(f)):</strong> Security monitoring,
          fraud prevention, and service improvement.
        </li>
        <li>
          <strong>Legal obligation (UK GDPR Art. 6(1)(c)):</strong> Compliance with UK law,
          including the Online Safety Act 2023 obligations.
        </li>
      </ul>

      <h2>4. Controller and Processor Roles</h2>
      <p>
        {BRAND_NAME} is the <strong>data controller</strong> for Instructor and Student account
        data, and for Platform security and operational data.
      </p>
      <p>
        Each <strong>Instructor is an independent data controller</strong> for the student
        personal data they enter into the Platform (lesson records, notes, contact details).
        The Instructor decides what student data to enter and for what purpose - {BRAND_NAME}
        processes this data as a <strong>data processor</strong> on the Instructor's behalf
        under a Data Processing Agreement embedded in our{" "}
        <Link to="/terms">Terms and Conditions (section 9)</Link>.
      </p>
      <p>
        <strong>Students</strong> who have questions about how their lesson data is used should
        contact their Instructor directly, as the Instructor is the data controller for that
        data.
      </p>

      <h2>5. Data Storage and Security</h2>
      <p>
        All data is stored in <strong>Google Firebase (Firestore)</strong> operated by Google
        LLC. Authentication is handled by Firebase Authentication. All data is transmitted over
        HTTPS. Firestore security rules restrict data access so that each user can only access
        their own data.
      </p>
      <p>
        Google LLC is a sub-processor under our Terms and Conditions. Google's data processing
        terms apply: <strong>firebase.google.com/terms/data-processing-terms</strong>. Data may
        be stored on servers outside the UK but is protected by appropriate safeguards.
      </p>
      <p>{BRAND_NAME} does not sell, share, or rent personal data to any third party.</p>

      <h2>6. Data Retention</h2>
      <ul>
        <li>
          Instructor account data is retained for the duration of the licence and deleted within
          30 days of account termination.
        </li>
        <li>Student account data (Firebase Auth) is retained until the account is deleted.</li>
        <li>
          Lesson records, messages, and progress data are retained for the duration of the
          Instructor's account and deleted with it.
        </li>
        <li>
          {BRAND_NAME} may retain certain data for longer where required by law, for example
          financial records for HMRC purposes.
        </li>
      </ul>

      <h2>7. Third-Party Services</h2>
      <ul>
        <li>
          <strong>Google Firebase (Google LLC):</strong> Authentication, Firestore database, and
          hosting. Sub-processor under our Terms and Conditions.
        </li>
        <li>
          <strong>Firebase Cloud Messaging (Google LLC):</strong> Push notification delivery for
          lesson reminders, only if permission is granted.
        </li>
      </ul>
      <p>No other third-party services receive personal data.</p>

      <h2>8. Your Rights Under UK GDPR</h2>
      <p>You have the following rights in relation to your personal data:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of the personal data {BRAND_NAME} holds about you.</li>
        <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
        <li><strong>Erasure:</strong> Request deletion of your personal data, subject to legal retention obligations.</li>
        <li><strong>Restriction:</strong> Request that {BRAND_NAME} restricts processing of your data in certain circumstances.</li>
        <li><strong>Portability:</strong> Receive your data in a structured, commonly used format.</li>
        <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
        <li><strong>Withdraw consent:</strong> Where processing is based on consent, for example push notifications, withdraw consent at any time.</li>
      </ul>
      <p>
        To exercise any of these rights, contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        {" "}{BRAND_NAME} will respond within 30 days.
      </p>
      <p>
        <strong>Students:</strong> If your request relates to data entered by your Instructor
        (lesson records, notes), {BRAND_NAME} will forward your request to your Instructor, as
        they are the data controller for that data.
      </p>
      <p>
        If you are dissatisfied with how {BRAND_NAME} handles your data, you have the right to
        complain to the <strong>Information Commissioner's Office (ICO)</strong> at{" "}
        <strong>ico.org.uk</strong> or by calling 0303 123 1113.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        Many learner drivers are aged 17, meaning the Platform is accessed by users under 18.
        {` ${BRAND_NAME}`} complies with the ICO Age Appropriate Design Code (Children's Code,
        2021):
      </p>
      <ul>
        <li>Users under 13 may not register.</li>
        <li>{BRAND_NAME} applies high default privacy settings for all users.</li>
        <li>{BRAND_NAME} does not profile, target, or market to users under 18.</li>
        <li>{BRAND_NAME} collects only the minimum data necessary to provide the Platform service.</li>
        <li>Push notifications to students under 18 are limited to lesson-related content only.</li>
      </ul>

      <h2>10. Changes to This Policy</h2>
      <p>
        {BRAND_NAME} may update this policy from time to time. Material changes will be
        communicated by email to Instructors and by a notice within the Platform to Students.
        The updated policy will always be accessible at the /privacy page of the Platform.
      </p>

      <h2>11. Contact</h2>
      <p>
        Data protection enquiries: <strong>{SUPPORT_EMAIL}</strong><br />
        Developer: {LEGAL_ENTITY} - required disclosure under Companies Act 2006 Part 41 and the
        Electronic Commerce (EC Directive) Regulations 2002.
      </p>

      <div className="legal-footer-box" style={{ marginTop: "40px" }}>
        <p>
          {BRAND_NAME} | England and Wales | <Link to="/terms">Terms and Conditions</Link> |{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <Link to="/login" style={{ fontSize: "14px" }}>Back to Login</Link>
      </div>
    </div>
  );
}
