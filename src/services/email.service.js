const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendConfirmationEmail(details) {
  await transporter.sendMail({
    from: `"My App" <${process.env.SMTP_USER}>`,
    to: details.guestEmail,
    subject: `Reservation Confirmed – ${details.date}`,
    html: `
      <h2>Your reservation is confirmed! 🎉</h2>
      <p>Hi ${details.guestName}, we'll see you on ${details.date} at ${details.time}.</p>
      <p><a href="${process.env.APP_URL}/cancel/${details.reservationId}">Cancel reservation</a></p>
    `,
  });
}

async function sendCancellationEmail(details) {
  await transporter.sendMail({
    from: `"My App" <${process.env.SMTP_USER}>`,
    to: details.guestEmail,
    subject: `Reservation Cancelled – ${details.date}`,
    html: `
      <h2>Your reservation has been cancelled</h2>
      <p>Hi ${details.guestName}, your reservation on ${details.date} has been cancelled.</p>
    `,
  });
}

module.exports = { sendConfirmationEmail, sendCancellationEmail };