const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMagicLinkEmail(toEmail, magicLink) {
  try {
    const { error } = await resend.emails.send({
      from: 'DewList <login@resend.dev>',
      to: toEmail,
      subject: 'Your Magic Login Link',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2 style="color: #4E81AF;">Welcome back to DewList 👋</h2>
          <p>Click the link below to log in:</p>
          <p><a href="${magicLink}" style="color: #874B9E; font-weight: bold;">${magicLink}</a></p>
          <p>This link will expire in 10 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Resend send failed:", err);
    return false;
  }
}

module.exports = { sendMagicLinkEmail };
