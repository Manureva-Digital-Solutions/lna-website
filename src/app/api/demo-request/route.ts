import { NextResponse } from "next/server";
import { mailConfigured, escapeHtml, sendMail } from "@/lib/mailer";
import {
  isDemoRequestRole,
  sanitizeEmailSubjectPart,
} from "@/lib/demo-request-roles";

interface DemoRequestBody {
  name: string;
  email: string;
  company: string;
  role: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const body: DemoRequestBody = await request.json();
    const { name, email, company, role, message } = body;

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

    // Role is required above and always forwarded — never dropped from the
    // CRM/email payload (launch-readiness: ICP role must reach the inbox).
    if (!mailConfigured()) {
      console.warn(
        "Demo request received but SMTP_HOST is not set — email NOT sent:",
        { name: safeName, email, company: safeCompany, role: safeRole, message }
      );
      return NextResponse.json({ success: true, delivered: false });
    }

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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
