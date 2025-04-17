const { Resend } = require('resend');

const resend = new Resend('your_api_key_here'); // ← replace with your actual API key

async function testEmail() {
  const { data, error } = await resend.emails.send({
    from: 'Task Drip <login@resend.dev>',
    to: 'your_email@example.com',
    subject: 'Task Drip test email',
    html: '<p>This is a test email from Task Drip</p>',
  });

  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}

testEmail();
