export const sendEmail = async ({ email, subject, message }) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Real Estate Platform", email: process.env.EMAIL_USER },
        to: [{ email }],
        subject,
        htmlContent: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${response.status} ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    throw error;
  }
};
