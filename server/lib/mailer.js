/**
 * Mail providers. Pick one with MAIL_PROVIDER:
 *  - resend : Resend HTTPS API (no SDK).
 *  - smtp   : any SMTP server (e.g. Gmail with an App Password) via nodemailer.
 *  - console: development only — prints the email to the server log. Refused in production.
 *  - memory : automated tests only.
 * Each send() resolves on success and throws on failure, so callers can report
 * failures to the visitor instead of silently dropping a message.
 */

export function createMailer(cfg) {
  const { provider } = cfg.mail;
  if (provider === 'resend') return resendMailer(cfg);
  if (provider === 'smtp') return smtpMailer(cfg);
  if (provider === 'memory') return memoryMailer();
  return consoleMailer();
}

function resendMailer(cfg) {
  return {
    name: 'resend',
    async send({ to, subject, text, html, replyTo, attachments = [] }) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.mail.resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: cfg.mailFrom,
          to: [to],
          subject,
          text,
          html,
          reply_to: replyTo,
          attachments: attachments.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })),
        }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
    },
  };
}

function smtpMailer(cfg) {
  let transport;
  return {
    name: 'smtp',
    async send({ to, subject, text, html, replyTo, attachments = [] }) {
      if (!transport) {
        const nodemailer = (await import('nodemailer')).default;
        const s = cfg.mail.smtp;
        transport = nodemailer.createTransport({ host: s.host, port: s.port, secure: s.secure, auth: { user: s.user, pass: s.pass } });
      }
      await transport.sendMail({ from: cfg.mailFrom, to, subject, text, html, replyTo, attachments });
    },
  };
}

function consoleMailer() {
  return {
    name: 'console',
    async send(msg) {
      const files = (msg.attachments || []).map((a) => `${a.filename} (${a.content.length} bytes)`).join(', ');
      console.log(
        `\n[mail:console — NOT SENT, development only]\nTo: ${msg.to}\nReply-To: ${msg.replyTo || '-'}\nSubject: ${msg.subject}\n${files ? `Attachments: ${files}\n` : ''}\n${msg.text}\n`
      );
    },
  };
}

export function memoryMailer() {
  const outbox = [];
  return { name: 'memory', outbox, async send(msg) { outbox.push(msg); } };
}
