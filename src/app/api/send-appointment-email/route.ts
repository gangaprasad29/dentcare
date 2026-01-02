import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";

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

    if (!userEmail) {
      return NextResponse.json(
        { error: "Recipient email missing" },
        { status: 400 }
      );
    }

    // Render React email → HTML
    const html = await render(
      <AppointmentConfirmationEmail
        doctorName={doctorName}
        appointmentDate={appointmentDate}
        appointmentTime={appointmentTime}
        appointmentType={appointmentType}
        duration={duration}
        price={price}
      />
    );

    // Gmail SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject: "Appointment Confirmation - DentCare",
      html,
    });

    console.log("SMTP SEND OK:", info.messageId);

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("SMTP ERROR:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
