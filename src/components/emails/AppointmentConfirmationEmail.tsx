import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Img,
  Link,
} from "@react-email/components";

interface AppointmentConfirmationEmailProps {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  duration: string;
  price: string;
}

export default function AppointmentConfirmationEmail({
  doctorName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  duration,
  price,
}: AppointmentConfirmationEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <Html>
      <Head />

      {/* Safe preview text (1 emoji allowed) */}
      <Preview>Your DentCare appointment is confirmed 🦷</Preview>

      <Body style={main}>
        <Container style={container}>
          
          {/* Logo (served from your own domain, safe) */}
          <Section style={logoContainer}>
            <Img
              src={`${appUrl}/logo.png`}
              width="48"
              height="48"
              alt="DentCare"
              style={logo}
            />
          </Section>

          <Heading style={h1}>DentCare Appointment Confirmation</Heading>

          <Text style={text}>
            Your appointment has been successfully scheduled. Here are the details:
          </Text>

          <Section style={detailsBox}>
            <Text><b>Doctor:</b> {doctorName}</Text>
            <Text><b>Appointment Type:</b> {appointmentType}</Text>
            <Text><b>Date:</b> {appointmentDate}</Text>
            <Text><b>Time:</b> {appointmentTime}</Text>
            <Text><b>Duration:</b> {duration}</Text>
            <Text><b>Consultation Fee:</b> {price}</Text>
          </Section>

          <Text style={text}>
            Please arrive 10–15 minutes before your appointment time.
            If you need to reschedule, you may reply directly to this email.
          </Text>

          {/* ONE safe button — no tracking params */}
          <Section style={buttonContainer}>
            <Link
              href={`${appUrl}/appointments`}
              style={button}
            >
              View My Appointment
            </Link>
          </Section>

          <Text style={footer}>
            DentCare Support<br />
            For appointment-related queries, contact:<br />
            <b>gangaprasadurekar0@gmail.com</b><br />
            (you may reply directly to this email)
          </Text>

        </Container>
      </Body>
    </Html>
  );
}

/* ---------------- Styles (deliverability-safe) ---------------- */

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "24px 0 48px",
  maxWidth: "560px",
};

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "12px",
};

const logo = {
  borderRadius: "8px",
};

const h1 = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: 700,
  textAlign: "center" as const,
  marginTop: "4px",
  marginBottom: "16px",
};

const text = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "10px 0",
};

const detailsBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "12px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "20px",
};

const button = {
  backgroundColor: "#2563eb",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 600,
  display: "inline-block",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "28px",
  textAlign: "center" as const,
};
