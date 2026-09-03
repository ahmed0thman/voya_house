import "server-only";
import { render } from "@react-email/render";
import { ActionError } from "@/lib/action-error";
import { PasswordResetCodeEmail } from "@/emails/password-reset-code";
import { getResendClient, getEmailFrom } from "@/lib/email/resend";
import { PASSWORD_RESET_DURATION_MS } from "@/lib/password-reset";

export async function sendPasswordResetCodeEmail(params: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const html = await render(
    PasswordResetCodeEmail({
      name: params.name,
      code: params.code,
      expiresInMinutes: Math.round(PASSWORD_RESET_DURATION_MS / 1000 / 60),
    }),
  );

  const { error } = await getResendClient().emails.send({
    from: getEmailFrom(),
    to: params.to,
    subject: `${params.code} is your Voya Control Board password reset code`,
    html,
  });

  if (error) {
    console.error("[email] failed to send password reset code:", error);
    throw new ActionError("Couldn't send the password reset email. Please try again.", "UNEXPECTED");
  }
}
