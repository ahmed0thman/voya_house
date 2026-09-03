import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type PasswordResetCodeEmailProps = {
  name: string;
  code: string;
  expiresInMinutes: number;
};

/** Rendered server-side to raw HTML (see send-password-reset-code.ts). */
export function PasswordResetCodeEmail({ name, code, expiresInMinutes }: PasswordResetCodeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Voya Control Board password reset code is {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Voya Control Board</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Use this code to set a new password. It expires in {expiresInMinutes} minutes.
          </Text>
          <Section style={codeBox}>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={text}>
            If you didn&apos;t ask to reset your password, you can ignore this email — your
            password stays exactly as it is unless this code is used.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Voya House &middot; Control Board</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetCodeEmail;

const main = {
  backgroundColor: "#f6f6f6",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "480px",
  borderRadius: "12px",
};

const heading = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#1a1a1a",
  margin: "0 0 20px",
};

const text = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#3c3c3c",
};

const codeBox = {
  backgroundColor: "#f2f2f2",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  margin: "20px 0",
};

const codeText = {
  fontSize: "32px",
  fontWeight: 700,
  letterSpacing: "8px",
  color: "#1a1a1a",
  margin: 0,
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0 16px",
};

const footer = {
  fontSize: "12px",
  color: "#8a8a8a",
};
