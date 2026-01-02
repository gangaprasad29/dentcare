import { NextResponse } from "next/server";
import resend from "@/lib/resend";
import { smtpConfigured, sendViaSmtp } from "@/lib/smtp";

export async function POST(request: Request) {
  // Which providers are available — allow SMTP fallback when Resend is not configured or blocks delivery
  let useResend = !!process.env.RESEND_API_KEY;
  let useSmtp = smtpConfigured();
  const emailProvider = (process.env.EMAIL_PROVIDER || "auto").toLowerCase();

  // Allow forcing the provider ("auto" | "smtp" | "resend") via env var on Render
  if (emailProvider === "smtp") {
    useResend = false;
  } else if (emailProvider === "resend") {
    useSmtp = false;
  }

  // default from: prefer RESEND_FROM, otherwise SMTP_FROM, otherwise a safe default
  const fromEmail = process.env.RESEND_FROM || process.env.SMTP_FROM || "onboarding@resend.dev";

  console.log("Email providers status", { useResend, useSmtp, emailProvider, from: fromEmail });

  try {
    const body = await request.json();

    const {
      userEmail,
      doctorName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      duration,
      price,
    } = body;

    // validate required fields
    if (!userEmail || !doctorName || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fromEmail = process.env.RESEND_FROM || "onboarding@resend.dev";

    // Simple HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Confirmation - DentCare</title>
        </head>
        <body style="font-family: Arial, Helvetica, sans-serif; background-color: #ffffff; margin: 0; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto;">
            <h1 style="color: #111827; font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 16px;">
              DentCare Appointment Confirmation
            </h1>
            <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 10px 0;">
              Your appointment has been successfully scheduled. Here are the details:
            </p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 12px 0;">
              <p><strong>Doctor:</strong> ${doctorName}</p>
              <p><strong>Appointment Type:</strong> ${appointmentType || 'General Checkup'}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Duration:</strong> ${duration || '30 minutes'}</p>
              <p><strong>Consultation Fee:</strong> ${price || '$50'}</p>
            </div>
            <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 10px 0;">
              Please arrive 10–15 minutes before your appointment time.
              If you need to reschedule, you may reply directly to this email.
            </p>
            <p style="color: #6b7280; font-size: 13px; margin-top: 28px; text-align: center;">
              DentCare Support<br />
              For appointment-related queries, contact:<br />
              <strong>gangaprasadurekar0@gmail.com</strong><br />
              (you may reply directly to this email)
            </p>
          </div>
        </body>
      </html>
    `;

    // Log useful debug info when investigating delivery issues
    console.log("Attempting to send appointment email", { to: userEmail, from: fromEmail, providers: { resend: useResend, smtp: useSmtp } });

    // If Resend is available, try it first; otherwise fall back to SMTP if configured
    if (useResend) {
      try {
        const sendResponse = await resend.emails.send({
          from: fromEmail,
          to: userEmail,
          subject: "Appointment Confirmation - DentCare",
          html,
        });

        console.log("Resend send response:", sendResponse);

        return NextResponse.json(
          { message: "Email sent successfully", emailId: sendResponse?.data?.id || undefined, recipient: userEmail, method: "resend" },
          { status: 200 }
        );
      } catch (err: any) {
        // Resend SDK throws on HTTP errors — capture full details for debugging
        console.error("Resend send failed:", {
          message: err?.message,
          code: err?.code,
          response: err?.response?.data || err?.response || err,
          recipient: userEmail,
        });

        const responseData = err?.response?.data;

        // If it's the validation error (blocked for non-verified recipients), try SMTP if available
        if (responseData?.name === "validation_error") {
          const validationMessage = responseData?.message || "Validation error from Resend";
          console.error("Resend validation error", { validationMessage, responseData, recipient: userEmail });

          if (useSmtp) {
            try {
              const smtpInfo = await sendViaSmtp({ from: fromEmail, to: userEmail, subject: "Appointment Confirmation - DentCare", html });
              console.log("SMTP fallback success:", smtpInfo);
              return NextResponse.json({ message: "Email sent via SMTP fallback", method: "smtp", recipient: userEmail, smtpInfo }, { status: 200 });
            } catch (smtpErr: any) {
              console.error("SMTP fallback failed:", smtpErr);
              const hint = "Resend blocked the send and SMTP fallback also failed. Verify Resend domain or check your SMTP credentials.";
              return NextResponse.json({ error: "Failed to send via Resend and SMTP", resend: validationMessage, smtpError: smtpErr?.message || smtpErr, recipient: userEmail, hint }, { status: 500 });
            }
          }

          // No SMTP configured — return the validation error with docs link
          const hint = "Resend is preventing sending to non-verified recipients. Verify a domain at https://resend.com/domains, then set RESEND_FROM to an email on that domain and use a production API key.";
          return NextResponse.json({ error: "Resend validation_error", details: validationMessage, recipient: userEmail, hint, docs: "https://resend.com/domains" }, { status: 422 });
        }

        // For other resend errors, attempt SMTP fallback if configured
        if (useSmtp) {
          try {
            const smtpInfo = await sendViaSmtp({ from: fromEmail, to: userEmail, subject: "Appointment Confirmation - DentCare", html });
            console.log("SMTP fallback success after resend error:", smtpInfo);
            return NextResponse.json({ message: "Email sent via SMTP fallback", method: "smtp", recipient: userEmail, smtpInfo }, { status: 200 });
          } catch (smtpErr: any) {
            console.error("SMTP fallback failed:", smtpErr);
            const hint = "Resend failed and SMTP fallback also failed. Check Resend dashboard and SMTP credentials.";
            return NextResponse.json({ error: "Failed to send via Resend and SMTP", resendError: err?.message || err, smtpError: smtpErr?.message || smtpErr, recipient: userEmail, hint }, { status: 500 });
          }
        }

        const hint = "If you're using a test API key or haven't verified your sending domain/sender in Resend, recipient delivery may be restricted. Check your Resend dashboard and ensure you have a production API key and verified sender.";
        return NextResponse.json({ error: "Failed to send email", details: err?.message || err, recipient: userEmail, hint }, { status: 500 });
      }
    } else if (useSmtp) {
      // Resend not configured — use SMTP directly
      try {
        const smtpInfo = await sendViaSmtp({ from: fromEmail, to: userEmail, subject: "Appointment Confirmation - DentCare", html });
        console.log("Sent via SMTP (Resend not configured):", smtpInfo);
        return NextResponse.json({ message: "Email sent via SMTP", method: "smtp", recipient: userEmail, smtpInfo }, { status: 200 });
      } catch (smtpErr: any) {
        console.error("SMTP send failed:", smtpErr);
        return NextResponse.json({ error: "SMTP send failed", details: smtpErr?.message || smtpErr, recipient: userEmail }, { status: 500 });
      }
    } else {
      // No provider available
      return NextResponse.json({ error: "No email provider configured. Set RESEND_API_KEY or SMTP_* env vars." }, { status: 500 });
    }
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
