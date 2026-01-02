import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import resend from "@/lib/resend";
import { NextResponse } from "next/server";

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

    if (!userEmail || !doctorName || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const fromEmail =
  process.env.EMAIL_FROM || "DentCare <onboarding@resend.dev>";

const { data, error } = await resend.emails.send({
  from: fromEmail,
  to: [userEmail],
  subject: "Appointment Confirmation - DentCare",
  react: AppointmentConfirmationEmail({
    doctorName,
    appointmentDate,
    appointmentTime,
    appointmentType,
    duration,
    price,
  }),
});


console.log("RESEND RESPONSE:", data);
console.log("RESEND ERROR:", error);


   if (error) {
  console.error("Resend error:", error);

  const message =
    typeof error === "object" && error !== null && "message" in error
      ? (error as any).message
      : "Resend failed";

  return NextResponse.json(
    { error: message, from: fromEmail },
    { status: 500 }
  );
}




    return NextResponse.json(
      { message: "Email sent successfully", emailId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
