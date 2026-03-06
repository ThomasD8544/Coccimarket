import nodemailer from 'nodemailer';

function isSecurePort(port: number) {
  return port === 465;
}

function getTransport() {
  const mode = process.env.EMAIL_MODE ?? 'console';

  if (mode === 'console') {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? '587');

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : isSecurePort(port),
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
  });
}

export async function sendMail(to: string, subject: string, text: string) {
  const transport = getTransport();
  if (!transport) {
    console.log(`[EMAIL:console] to=${to} subject=${subject}\n${text}`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'dlc-alerts@local.test',
    to,
    subject,
    text
  });
}
