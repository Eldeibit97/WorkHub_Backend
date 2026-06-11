const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Bound every phase so a misconfigured/unreachable SMTP host fails fast
  // instead of hanging the caller (nodemailer defaults are minutes long).
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

async function sendConfirmationEmail(details) {
  await transporter.sendMail({
    from: `"WorkHubMTY" <${process.env.SMTP_FROM}>`,
    to: details.guestEmail,
    subject: `Reserva confirmada – ${details.date}`,
    html: `
      <h2>¡Tu reserva ha sido confirmada!</h2>
      <p>Hola ${details.guestName}, te esperamos el ${details.date} de ${details.horaInicio} a ${details.horaFin}.</p>
      <p><strong>Espacio:</strong> ${details.nombreEspacio} (${details.codigoEspacio})</p>
      <p><strong>Zona:</strong> ${details.nombreZona}, ${details.edificio}</p>
    `,
  });
}

async function sendCancellationEmail(details) {
  await transporter.sendMail({
    from: `"WorkHubMTY" <${process.env.SMTP_FROM}>`,
    to: details.guestEmail,
    subject: `Reserva cancelada – ${details.date}`,
    html: `
      <h2>Tu reserva ha sido cancelada</h2>
      <p>Hola ${details.guestName}, tu reserva del ${details.date} de ${details.horaInicio} a ${details.horaFin} en <strong>${details.nombreEspacio}</strong> ha sido cancelada.</p>
    `,
  });
}

module.exports = { sendConfirmationEmail, sendCancellationEmail };