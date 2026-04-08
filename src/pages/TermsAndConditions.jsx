import React, { useState } from "react";
import { Link } from "react-router-dom";

const BRAND_NAME = "App7i";
const SUPPORT_EMAIL = "support@app7i.com";
const LEGAL_ENTITY = `Amritpal Singh (trading as ${BRAND_NAME})`;

function Ul({ items }) {
  return (
    <ul>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export default function TermsAndConditions() {
  const [expanded, setExpanded] = useState(null);
  const toggle = (i) => setExpanded(expanded === i ? null : i);

  const sections = [
    {
      title: "1. Definitions",
      content: (
        <>
          <p>In these Terms, the following definitions apply:</p>
          <Ul items={[
            `"Developer" or "we" or "us" or "${BRAND_NAME}" means ${LEGAL_ENTITY}, the developer and licensor of the Platform.`,
            `"Platform" means the ${BRAND_NAME} web application and any associated mobile application, including all features, functionality, and services provided through it.`,
            '"Licence" means the limited, non-exclusive, non-transferable right to access and use the Platform granted under these Terms.',
            '"Instructor" means a self-employed driving instructor who has been granted a Licence to use the Platform to manage their driving instruction practice.',
            '"Student" means a learner driver who has been added to the Platform by an Instructor and registered a student account.',
            '"User" means any Instructor or Student accessing the Platform.',
            '"Instructor Data" means all data entered into the Platform by or on behalf of the Instructor, including student records, lesson details, notes, and messages.',
            '"UK GDPR" means the UK General Data Protection Regulation as retained in UK law by the European Union (Withdrawal) Act 2018.',
            '"DPA 2018" means the Data Protection Act 2018.',
            `"ICO" means the Information Commissioner's Office.`,
            '"OSA 2023" means the Online Safety Act 2023.',
          ]} />
        </>
      )
    },
    {
      title: `2. About ${BRAND_NAME} and the Platform`,
      content: (
        <>
          <p>{BRAND_NAME} is a software development business operated by {LEGAL_ENTITY}. The Platform is a hosted software service built by {BRAND_NAME} that provides driving instructors with tools to manage students, lessons, communications, and teaching materials.</p>
          <p><strong>The Platform is a technology tool only.</strong> {BRAND_NAME} is not a driving school and does not employ, recommend, or supervise any driving instructor. Nothing on the Platform constitutes advice on driving instruction, road safety, or DVSA compliance. Each Instructor is an independent professional solely responsible for their own conduct, qualifications, and compliance with DVSA rules.</p>
          <p>The Platform is licensed, not sold. By using the Platform, you do not acquire ownership of any part of the software, codebase, or infrastructure.</p>
          <p><strong>Legal identity:</strong> These Terms are between you and {LEGAL_ENTITY}, who can be contacted at {SUPPORT_EMAIL}. This disclosure is required under the Electronic Commerce (EC Directive) Regulations 2002 and the Companies Act 2006 Part 41 (Business Names).</p>
        </>
      )
    },
    {
      title: "3. Licence Grant - Instructors",
      content: (
        <>
          <p>Subject to these Terms, {BRAND_NAME} grants the Instructor a limited, non-exclusive, non-sublicensable, non-transferable Licence to access and use the Platform solely for the purpose of managing the Instructor's own driving instruction practice.</p>
          <p>The Instructor may not:</p>
          <Ul items={[
            "Transfer, assign, sublicense, or resell the Licence to any third party.",
            "Use the Platform to provide services to or on behalf of any other instructor or business.",
            "Reverse-engineer, decompile, or attempt to extract the source code of the Platform, except to the limited extent permitted by section 50B of the Copyright, Designs and Patents Act 1988 for interoperability purposes only.",
            "Copy, modify, or create derivative works of the Platform.",
            "Remove or obscure any proprietary notices or branding on the Platform.",
          ]} />
          <p>The Licence continues until terminated in accordance with section 12 of these Terms.</p>
        </>
      )
    },
    {
      title: `4. ${BRAND_NAME}'s Right to Update and Modify the Platform`,
      content: (
        <>
          <p>{BRAND_NAME} reserves the absolute right to update, modify, enhance, redesign, or discontinue any feature or part of the Platform at any time, including to improve the service, fix security issues, comply with legal requirements, or implement changes requested by the Instructor.</p>
          <p>{BRAND_NAME} will use reasonable endeavours to notify Instructors of material changes in advance where reasonably practicable. Continued use of the Platform following an update constitutes acceptance of the updated version.</p>
          <p>{BRAND_NAME} is under no obligation to maintain any particular version of the Platform or to preserve any specific feature. The Platform is a living, hosted service and its current state at any given time is determined solely by {BRAND_NAME}.</p>
          <p>{BRAND_NAME} welcomes feature requests and improvement suggestions from Instructors. {BRAND_NAME} will consider such requests in good faith but is under no contractual obligation to implement any requested feature.</p>
          <p>All intellectual property rights in any updates, modifications, or enhancements to the Platform, including those inspired by or responding to Instructor feedback, vest in and remain with {BRAND_NAME} absolutely.</p>
        </>
      )
    },
    {
      title: "5. Student Account Terms",
      content: (
        <>
          <p>Students access the Platform as end users invited by their Instructor. Students do not have a direct commercial relationship with {BRAND_NAME} unless they independently purchase a service from {BRAND_NAME}.</p>
          <p>By registering a student account, Students agree to these Terms. Students must:</p>
          <Ul items={[
            "Use the Platform only to view their own lesson information and communicate with their Instructor.",
            "Provide accurate registration information, using the same email address their Instructor has on record.",
            "Not access or attempt to access another student's data.",
            "Comply with the Acceptable Use Policy in section 8.",
          ]} />
          <p><strong>Students are consumers under the Consumer Rights Act 2015.</strong> {BRAND_NAME} acknowledges the rights afforded to student consumers under applicable UK consumer protection law, including the right to receive digital content of satisfactory quality, fit for its described purpose. These rights are not excluded by any term of these Terms.</p>
          <p><strong>Students under 18:</strong> Learner drivers aged 17 may use the Platform. In compliance with the ICO's Age Appropriate Design Code (Children's Code, 2021) and UK GDPR Article 8, students under 13 may not register. Students aged 13-17 should have a parent or guardian review and agree to these Terms on their behalf. {BRAND_NAME} applies high default privacy settings for all users and does not profile or market to under-18s.</p>
        </>
      )
    },
    {
      title: "6. Instructor Obligations",
      content: (
        <>
          <p>The Instructor agrees to:</p>
          <Ul items={[
            "Use the Platform only for lawful purposes in connection with their driving instruction practice.",
            "Maintain the confidentiality of their account credentials and not share their login with any third party.",
            "Ensure they hold all required DVSA qualifications and regulatory approvals for the driving instruction services they provide.",
            "Not enter false, misleading, or defamatory content about students or any third party.",
            `Promptly notify ${BRAND_NAME} at ${SUPPORT_EMAIL} if they become aware of any unauthorised access to their account.`,
            "Maintain their own ICO data protection registration (Tier 1, currently GBP 52/year) as required by the Data Protection (Charges and Information) Regulations 2018, as the Instructor is an independent data controller in respect of their student data.",
            "Ensure students have been informed that the Platform is used to manage their lesson data before adding them to the Platform.",
          ]} />
          <p><strong>Data Controller obligation:</strong> The Instructor is responsible as an independent data controller for all student personal data they enter into the Platform. {BRAND_NAME} processes this data as a data processor on the Instructor's behalf in accordance with section 9 of these Terms.</p>
        </>
      )
    },
    {
      title: "7. Intellectual Property",
      content: (
        <>
          <p>All intellectual property rights in the Platform - including the software code, databases, visual design, user interface, branding, documentation, and any updates or modifications - vest in and remain with {LEGAL_ENTITY} absolutely. No intellectual property rights are transferred to any User by these Terms.</p>
          <p>The Instructor retains ownership of the Instructor Data they enter into the Platform. {BRAND_NAME} is granted a limited licence to store, process, and display Instructor Data solely for the purpose of providing the Platform services.</p>
          <p>Nothing in these Terms grants any User the right to use the {BRAND_NAME} name, logo, trade marks, or any associated branding for any purpose outside of using the Platform as intended.</p>
          <p>All rights in the Platform remain with {BRAND_NAME}.</p>
        </>
      )
    },
    {
      title: "8. Acceptable Use Policy",
      content: (
        <>
          <p>Users must not use the Platform to:</p>
          <Ul items={[
            "Upload, send, or share any content that is illegal, abusive, defamatory, threatening, harassing, discriminatory, or offensive.",
            "Share, distribute, or request any indecent images or sexual content of any kind, including content involving minors.",
            "Engage in harassment, bullying, or intimidation of any person.",
            "Send unsolicited commercial communications or spam.",
            "Impersonate another person or create a false identity.",
            "Upload or transmit malware, viruses, or other malicious code.",
            "Attempt to gain unauthorised access to any part of the Platform or another user's data.",
            "Use the Platform in any way that could damage, disable, or impair its infrastructure.",
            "Circumvent or attempt to circumvent any access controls, rate limits, or security measures.",
          ]} />
          <p><strong>Online Safety Act 2023:</strong> The Platform includes a user-to-user messaging feature (instructor-student messages). {BRAND_NAME} operates this feature as a closed, private communication channel and complies with its obligations under the Online Safety Act 2023 as a regulated user-to-user service. {BRAND_NAME} conducts periodic risk assessments of the Platform for illegal content and maintains proportionate systems to prevent and address illegal content. Users who encounter content that may constitute a criminal offence should report it immediately to {SUPPORT_EMAIL}. {BRAND_NAME} will investigate all reports and take appropriate action, which may include content removal and account suspension.</p>
          <p>If your account is suspended and you believe this is in error, you may appeal within 14 days by emailing {SUPPORT_EMAIL}. {BRAND_NAME} will respond within 14 days.</p>
        </>
      )
    },
    {
      title: "9. Data Protection and Processing Agreement",
      content: (
        <>
          <p><strong>9.1 Data Controller and Processor roles</strong></p>
          <p>For the purposes of UK GDPR and DPA 2018:</p>
          <Ul items={[
            `${BRAND_NAME} is the data controller in respect of: Instructor account data (email, profile details, login credentials); Student account data (email address and authentication records); Platform usage data and security logs.`,
            "The Instructor is an independent data controller in respect of all student personal data they enter into the Platform (student names, phone numbers, lesson records, notes, progress data, and messages).",
            `${BRAND_NAME} acts as a data processor on behalf of the Instructor in respect of Instructor Data stored and processed through the Platform.`,
          ]} />

          <p><strong>9.2 Data Processing Agreement (UK GDPR Article 28)</strong></p>
          <p>By accepting these Terms, the Instructor appoints {BRAND_NAME} as a data processor. {BRAND_NAME} agrees to:</p>
          <Ul items={[
            "Process Instructor Data only on the documented instructions of the Instructor, as expressed through use of the Platform, and not for any other purpose.",
            `Ensure that all persons with access to Instructor Data at ${BRAND_NAME} are subject to a binding obligation of confidentiality.`,
            "Implement appropriate technical and organisational security measures under UK GDPR Article 32, including HTTPS encryption in transit, Firebase Authentication access controls, and Firestore security rules limiting data access to authorised users.",
            `${BRAND_NAME} currently uses Google LLC (trading as Firebase) as a sub-processor for data storage, authentication, and hosting. The Instructor gives general written consent to this sub-processor by accepting these Terms. ${BRAND_NAME} will notify the Instructor of any change in sub-processor, giving the Instructor a reasonable opportunity to object. Google LLC's data processing terms govern ${BRAND_NAME}'s relationship with Google: firebase.google.com/terms/data-processing-terms.`,
            "Assist the Instructor, where reasonably possible and at the Instructor's reasonable cost, in responding to requests from Students exercising their data subject rights under UK GDPR.",
            "Notify the Instructor without undue delay, and in any event within 72 hours of becoming aware, of any personal data breach affecting Instructor Data.",
            "On termination of the Licence, delete or return all Instructor Data within 30 days, unless UK law requires longer retention. The Instructor will be given a 30-day data export window before deletion.",
            `Make available to the Instructor, on reasonable written request, information necessary to demonstrate compliance with this section. ${BRAND_NAME}'s compliance with Google's processing standards may be evidenced by reference to Google's published compliance documentation.`,
          ]} />

          <p><strong>9.3 {BRAND_NAME} as Data Controller</strong></p>
          <p>{BRAND_NAME} processes Instructor and Student account data as a data controller for the following purposes: providing and operating the Platform; account security and fraud prevention; legal compliance. {BRAND_NAME}'s Privacy Policy sets out full details of this processing.</p>

          <p><strong>9.4 Data Retention</strong></p>
          <p>Instructor Data is retained for as long as the Licence is active. On termination, a 30-day export window is provided, after which Instructor Data is permanently deleted unless {BRAND_NAME} is required by law to retain it for longer.</p>
        </>
      )
    },
    {
      title: "10. Service Availability",
      content: (
        <>
          <p>{BRAND_NAME} will use reasonable endeavours to make the Platform available. However, {BRAND_NAME} does not guarantee uninterrupted or error-free access and the Platform is provided on an "as available" basis.</p>
          <p>The Platform may be temporarily unavailable due to: scheduled or emergency maintenance; infrastructure issues with Google Firebase; internet or network disruptions beyond {BRAND_NAME}'s control; force majeure events.</p>
          <p>{BRAND_NAME} will endeavour to provide advance notice of planned maintenance where reasonably practicable. {BRAND_NAME} will use reasonable care and skill in providing the Platform, as implied by the Supply of Goods and Services Act 1982 section 13.</p>
        </>
      )
    },
    {
      title: "11. Limitation of Liability",
      content: (
        <>
          <p><strong>11.1 What {BRAND_NAME} is not liable for (Instructor - B2B)</strong></p>
          <p>To the maximum extent permitted by the Unfair Contract Terms Act 1977 (reasonableness test, Schedule 2), {BRAND_NAME} shall not be liable to the Instructor for:</p>
          <Ul items={[
            "Indirect, incidental, consequential, or special loss of any kind.",
            "Loss of profits, revenue, business, contracts, or anticipated savings.",
            `Loss of or damage to data beyond what is recoverable from ${BRAND_NAME}'s backups.`,
            "Any loss arising from the Instructor's reliance on the Platform for DVSA compliance or regulatory purposes.",
            "Any loss arising from third-party services including Google Firebase outages.",
          ]} />
          <p>{BRAND_NAME}'s total aggregate liability to the Instructor for direct loss under or in connection with these Terms shall not exceed the total fees paid by the Instructor to {BRAND_NAME} in the 12 months preceding the claim, or GBP 100, whichever is greater.</p>

          <p><strong>11.2 Student liability (B2C)</strong></p>
          <p>{BRAND_NAME} does not exclude or limit liability to Students in any way that would be unlawful under the Consumer Rights Act 2015, including liability for digital content of unsatisfactory quality, fitness for purpose, or misdescription; defective digital content causing damage to a device or digital content; and any other rights that cannot be excluded by law.</p>

          <p><strong>11.3 Never excluded</strong></p>
          <p>Nothing in these Terms excludes or limits {BRAND_NAME}'s liability for death or personal injury caused by {BRAND_NAME}'s negligence; fraud or fraudulent misrepresentation; or any other liability that cannot lawfully be excluded under English law.</p>

          <p><strong>11.4 Platform intermediary</strong></p>
          <p>{BRAND_NAME} is not liable for the conduct of any Instructor towards their students; any driving instruction provided or not provided by an Instructor; any dispute between an Instructor and a Student; or any personal injury or property damage arising from driving lessons arranged through the Platform.</p>
        </>
      )
    },
    {
      title: "12. Termination",
      content: (
        <>
          <p><strong>12.1 Termination by {BRAND_NAME} - for cause</strong></p>
          <p>{BRAND_NAME} may terminate or suspend the Licence immediately and without prior notice if:</p>
          <Ul items={[
            "The Instructor or Student commits a material breach of the Acceptable Use Policy in section 8, including any uploading or distribution of illegal content.",
            "The Instructor uses the Platform for purposes outside their own driving instruction practice.",
            `${BRAND_NAME} is required to do so by law or by a competent regulatory authority.`,
          ]} />
          <p>For other material breaches, {BRAND_NAME} will give 14 days' written notice to remedy the breach, after which the Licence may be terminated if the breach is not remedied.</p>

          <p><strong>12.2 Termination by {BRAND_NAME} - for convenience</strong></p>
          <p>{BRAND_NAME} may terminate the Licence for any reason by giving the Instructor at least 30 days' written notice by email. If {BRAND_NAME} discontinues the Platform entirely, {BRAND_NAME} will give at least 90 days' written notice.</p>

          <p><strong>12.3 Termination by the Instructor</strong></p>
          <p>The Instructor may terminate their Licence at any time by contacting {SUPPORT_EMAIL}. No minimum notice period is required from the Instructor.</p>

          <p><strong>12.4 Effect of termination</strong></p>
          <p>On termination: the Instructor's access to the Platform ceases immediately; {BRAND_NAME} will provide a 30-day window for the Instructor to export Instructor Data; after the export window, all Instructor Data will be permanently deleted; any payment obligations for a paid period already commenced remain due.</p>
        </>
      )
    },
    {
      title: "13. Variation of These Terms",
      content: (
        <>
          <p>{BRAND_NAME} may update these Terms from time to time to reflect changes in law, the Platform's functionality, or {BRAND_NAME}'s business practices.</p>
          <p>{BRAND_NAME} will give Instructors at least 14 days' written notice of material changes by email. Continued use of the Platform after the notice period constitutes acceptance of the revised Terms.</p>
          <p>If an Instructor does not accept the revised Terms, they may terminate their Licence by contacting {SUPPORT_EMAIL} before the revised Terms take effect, and their Instructor Data will be returned or deleted in accordance with section 12.4.</p>
          <p>For Students, material changes to these Terms will be communicated by a notice within the Platform. Students who do not accept the revised Terms should discontinue use and contact their Instructor.</p>
        </>
      )
    },
    {
      title: "14. General",
      content: (
        <>
          <p><strong>Entire agreement:</strong> These Terms constitute the entire agreement between the parties in relation to the Platform and supersede all prior representations, discussions, or agreements.</p>
          <p><strong>Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable by a court, the remaining provisions will continue in full force and effect.</p>
          <p><strong>No waiver:</strong> Failure by {BRAND_NAME} to enforce any provision of these Terms at any time does not constitute a waiver of that provision.</p>
          <p><strong>Assignment:</strong> {BRAND_NAME} may assign or transfer its rights and obligations under these Terms to any successor business. The Instructor may not assign, transfer, or sublicense their rights under these Terms without {BRAND_NAME}'s prior written consent.</p>
          <p><strong>Force majeure:</strong> {BRAND_NAME} shall not be liable for any failure or delay in performance caused by circumstances beyond its reasonable control, including internet outages, Google Firebase infrastructure issues, natural disasters, or actions of government or regulatory bodies.</p>
          <p><strong>Governing law:</strong> These Terms are governed by and construed in accordance with the laws of England and Wales. Each party irrevocably agrees that the courts of England and Wales shall have exclusive jurisdiction to settle any dispute arising out of or in connection with these Terms.</p>
        </>
      )
    },
    {
      title: "15. Contact and Complaints",
      content: (
        <>
          <p>For questions, support, or complaints regarding these Terms or the Platform:</p>
          <Ul items={[
            `Email: ${SUPPORT_EMAIL}`,
            `${BRAND_NAME} will acknowledge all complaints within 5 business days.`,
            `Developer: ${LEGAL_ENTITY} - required disclosure under Companies Act 2006 Part 41 and Electronic Commerce (EC Directive) Regulations 2002.`,
          ]} />
          <p>If you are a Student and are dissatisfied with {BRAND_NAME}'s response to a complaint, you may escalate to the Information Commissioner's Office (ICO) for data protection matters at ico.org.uk, or to Trading Standards for consumer rights matters.</p>
        </>
      )
    },
  ];

  return (
    <div className="legal-page">
      <div style={{ marginBottom: "32px" }}>
        <h1>Terms and Conditions</h1>
        <p className="legal-meta">{BRAND_NAME} | Last updated: March 2026 | Governing law: England and Wales</p>
        <p className="legal-meta" style={{ marginTop: "4px" }}>
          By using this Platform you agree to these Terms. If you do not agree, do not use the Platform.
        </p>
      </div>

      <div className="legal-summary-box">
        <p>Plain English Summary</p>
        <ul>
          <li>{BRAND_NAME} licenses this app to the Instructor - the app is never sold, and all software rights remain with {BRAND_NAME}.</li>
          <li>{BRAND_NAME} can update and improve the app at any time and will consider Instructor feature requests in good faith.</li>
          <li>The Instructor is an independent driving professional, fully responsible for their own DVSA compliance and conduct.</li>
          <li>Students are consumers and their UK legal rights are fully protected - {BRAND_NAME} does not exclude consumer rights.</li>
          <li>Your data is stored securely in Google Firebase and never sold to third parties.</li>
          <li>The Instructor is the data controller for their students' data; {BRAND_NAME} processes it as a data processor under a compliant Article 28 agreement (section 9).</li>
          <li>No inappropriate, illegal, or harmful content - the messaging feature is a closed, private channel only.</li>
          <li>{BRAND_NAME} gives 30 days' notice before ending the service for convenience and 90 days if discontinuing entirely.</li>
          <li>Governed by English law. Contact: {SUPPORT_EMAIL}</li>
        </ul>
      </div>

      {sections.map((s, i) => (
        <div key={i} className="legal-accordion-row">
          <button className="legal-accordion-btn" onClick={() => toggle(i)}>
            {s.title}
            <span className="legal-accordion-icon">{expanded === i ? "-" : "+"}</span>
          </button>
          {expanded === i && (
            <div className="legal-accordion-body">
              {s.content}
            </div>
          )}
        </div>
      ))}

      <div className="legal-footer-box">
        <p>
          These Terms are governed by English and Welsh law. Developer: {LEGAL_ENTITY} |{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> |{" "}
          <Link to="/privacy">Privacy Policy</Link>
        </p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <Link to="/login" style={{ fontSize: "14px" }}>Back to Login</Link>
      </div>
    </div>
  );
}
