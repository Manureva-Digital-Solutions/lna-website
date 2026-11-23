import { NextResponse } from "next/server";
import { mailConfigured, escapeHtml, sendMail } from "@/lib/mailer";
import {
  isDemoRequestRole,
  sanitizeEmailSubjectPart,
} from "@/lib/demo-request-roles";
import {
  demoAcknowledgementEmail,
  resolveEmailLocale,
} from "@/lib/transactional-email";

interface DemoRequestBody {
  name: string;
  email: string;
  company: string;
  role: string;
  message?: string;
  locale?: string;
}

export async function POST(request: Request) {
  try {
    const body: DemoRequestBody = await request.json();
    const { name, email, company, role, message, locale } = body;

    if (!name || !email || !company || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isDemoRequestRole(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const safeName = sanitizeEmailSubjectPart(name);
    const safeCompany = sanitizeEmailSubjectPart(company);
    // Role is allowlisted above — still sanitize for subject hygiene.
    const safeRole = sanitizeEmailSubjectPart(role);
    const emailLocale = resolveEmailLocale(locale);

    // Role is required above and always forwarded — never dropped from the
    // CRM/email payload (launch-readiness: ICP role must reach the inbox).
    if (!mailConfigured()) {
      console.warn(
        "Demo request received but SMTP_HOST is not set — email NOT sent:",
        {
          name: safeName,
          email,
          company: safeCompany,
          role: safeRole,
          message,
          locale: emailLocale,
        }
      );
      return NextResponse.json({ success: true, delivered: false });
    }

    // 1. Internal notification — durable record of the request.
    const result = await sendMail({
      replyTo: { email, name: safeName },
      subject: `Demande de démo — ${safeName} (${safeCompany}) · ${safeRole}`,
      html: `
        <h2>Nouvelle demande de démo</h2>
        <p><strong>Nom:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Société:</strong> ${escapeHtml(company)}</p>
        <p><strong>Fonction / Role:</strong> ${escapeHtml(role)}</p>
        ${message ? `<p><strong>Message:</strong> ${escapeHtml(message)}</p>` : ""}
      `,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      );
    }

    // 2. Acknowledgement to the visitor. Failure must not report success —
    //    the contact-page UI would otherwise claim the request was confirmed
    //    when no confirmation email was delivered (QA production finding #27).
    const ack = demoAcknowledgementEmail(emailLocale, safeName);
    const acknowledged = await sendMail({
      to: email,
      replyTo: { email: "hello@lnaflow.com" },
      subject: ack.subject,
      html: ack.html,
    });

    if (!acknowledged.ok) {
      console.error("Demo-request acknowledgement failed", { acknowledged });
      return NextResponse.json(
        { error: "Failed to send acknowledgement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, acknowledged: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
