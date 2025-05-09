const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMagicLinkEmail(toEmail, magicLink) {
  try {
    const { error } = await resend.emails.send({
      from: 'DewList <magiclink@dewlist.app>',
      to: toEmail,
      subject: 'Your Magic Login Link',
      html: `
  <div style="font-family: sans-serif; line-height: 1.6; color: #4F5962; padding: 20px; text-align: center;">
    <img src="https://dewlist.app/DewList_Icon.png"
         alt="DewList logo"
         width="48"
         height="48"
         style="display: block; margin: 0 auto 16px auto;" />

    <h2 style="color: #4C6CA8; margin-bottom: 8px;">Your Magic Link</h2>
    <p style="margin: 0 0 16px;">You're one click away from focused productivity — one task at a time.</p>
    
    <a href="${magicLink}"
       style="
         display: inline-block;
         background-color: #4C6CA8;
         color: white;
         text-decoration: none;
         padding: 12px 24px;
         border-radius: 8px;
         font-weight: 600;
         font-size: 16px;
       ">
      Log in to DewList
    </a>

    <p style="font-size: 12px; margin-top: 24px; color: #91989E;">
      This link will expire in 10 minutes.
    </p>
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
