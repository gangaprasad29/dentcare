import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
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

    // Simple HTML email template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Confirmation - DentWise</title>
        </head>
        <body style="font-family: Arial, Helvetica, sans-serif; background-color: #ffffff; margin: 0; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto;">
            <h1 style="color: #111827; font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 16px;">
              DentWise Appointment Confirmation
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
              DentWise Support<br />
              For appointment-related queries, contact:<br />
              <strong>gangaprasadurekar0@gmail.com</strong><br />
              (you may reply directly to this email)
            </p>
          </div>
        </body>
      </html>
    `;

    // Debug:Check environment variables
    console.log("Environment check:", {
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyLength: process.env.RESEND_API_KEY?.length
    });

    // send the email using Resend
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [userEmail],
      subject: "Appointment Confirmation - DentWise",
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Email sent successfully", emailId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
