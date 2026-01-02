import nodemailer from "nodemailer";

interface SendMailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendViaSmtp({ from, to, subject, html, text }: SendMailOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromAddr = process.env.SMTP_FROM || from;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for port 465
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: fromAddr,
    to,
    subject,
    html,
    text,
  });

  return info; // includes messageId and response
}
