import "server-only";
import { render } from "@react-email/render";
import { ActionError } from "@/lib/action-error";
import { TwoFactorCodeEmail } from "@/emails/two-factor-code";
import { getResendClient, getEmailFrom } from "@/lib/email/resend";
import { TWO_FACTOR_CODE_DURATION_MS } from "@/lib/two-factor";

export async function sendTwoFactorCodeEmail(params: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const html = await render(
    TwoFactorCodeEmail({
      name: params.name,
      code: params.code,
      expiresInMinutes: Math.round(TWO_FACTOR_CODE_DURATION_MS / 1000 / 60),
    }),
  );

  const { error } = await getResendClient().emails.send({
    from: getEmailFrom(),
    to: params.to,
    subject: `${params.code} is your Voya Control Board sign-in code`,
    html,
  });

  if (error) {
    console.error("[email] failed to send 2FA code:", error);
    throw new ActionError("Couldn't send the verification code email. Please try again.", "UNEXPECTED");
  }
}
