import { NextResponse } from "next/server";
import resend from "@/lib/resend";

export async function POST(request: Request) {
  // quick guard to help debugging in staging/dev
  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY");
    return NextResponse.json({ error: "Email provider not configured (RESEND_API_KEY missing)" }, { status: 500 });
  }

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
    console.log("Attempting to send appointment email", { to: userEmail, from: fromEmail });

    try {
      const sendResponse = await resend.emails.send({
        from: fromEmail,
        to: userEmail,
        subject: "Appointment Confirmation - DentCare",
        html,
      });

      console.log("Resend send response:", sendResponse);

      return NextResponse.json(
        { message: "Email sent successfully", emailId: sendResponse?.data?.id || undefined, recipient: userEmail },
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

      // Helpful hint for common misconfiguration (test API keys / verified recipients)
      const hint = "If you're using a test API key or haven't verified your sending domain/sender in Resend, recipient delivery may be restricted. Check your Resend dashboard and ensure you have a production API key and verified sender.";

      return NextResponse.json({ error: "Failed to send email", details: err?.message || err, recipient: userEmail, hint }, { status: 500 });
    }
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
