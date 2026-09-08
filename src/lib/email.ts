import { env } from "@/lib/env";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const isDev = process.env.NODE_ENV !== "production";

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!env.SMTP_HOST || isDev) {
    console.log(
      `[email:dev] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`,
    );
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM || env.SMTP_USER,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export async function sendVerificationCodeEmail(
  to: string,
  code: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "Your verification code",
    text: `Your AuraShield verification code is: ${code}\n\nIt expires in 10 minutes.`,
    html: `<p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>It expires in 10 minutes.</p>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "Reset your password",
    text: `Click this link to reset your password: ${resetUrl}\n\nThis link is single-use and expires in 15 minutes.`,
    html: `<p>Click to reset your password (single-use, expires in 15 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}
