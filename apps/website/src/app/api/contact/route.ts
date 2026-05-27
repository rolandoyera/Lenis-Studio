// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(), // honeypot
  message: z.string().optional(),
  source: z.string().optional(), // "project" or "contact"
  ts: z.number().optional(), // time trap; client sends a number
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 422 });
    }

    const { name, email, phone, company, message, source, ts } = parsed.data;

    // Honeypot: if filled, silently succeed
    if (company && company.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    if (!ts || Date.now() - ts < 1200) {
      return NextResponse.json({ ok: true });
    }

    const isContact = source === "contact";
    const senderName = isContact ? "Website Contact Form" : "Website Project Form";
    const subjectLine = isContact ? "New Website Inquiry — Sarvian Design" : "New Project Inquiry — Sarvian Design";
    const leadLabel = isContact ? "contact lead" : "project lead";

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { email: "hello@sarviandg.com", name: senderName },
        to: [{ email: "rolysemail@gmail.com" }, { email: "osh@sarviandg.com" }],
        replyTo: { email: "osh@sarviandg.com", name: "Oshrat Rothschild" },
        subject: subjectLine,
        textContent: `You've received a ${leadLabel} from SDG website\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone ?? ""}${message ? `\n\nMessage:\n${message}` : ""}`,
        htmlContent: `
          <p style="font-family:Arial,sans-serif;font-size:16px;margin-bottom:20px;">
            <strong>You've received a ${leadLabel} from SDG website</strong>
          </p>
          <table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
            <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
            <tr><td><strong>Phone:</strong></td><td>${phone ?? ""}</td></tr>
            ${message ? `<tr><td valign="top"><strong>Message:</strong></td><td>${message.replace(/\n/g, "<br>")}</td></tr>` : ""}
          </table>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Brevo API error:", errorData);
      return NextResponse.json({ ok: false, error: errorData }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Contact email error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
