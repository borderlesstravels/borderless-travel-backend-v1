const nodemailer = require("nodemailer");

const sendEmail = async (subject, message, send_to, notitle = false) => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure =
    String(process.env.EMAIL_SECURE || "").toLowerCase() === "true" ||
    port === 465;

  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    !process.env.APP_EMAIL
  ) {
    const missing = new Error(
      "Email is not configured. Missing EMAIL_HOST, EMAIL_USER, EMAIL_PASS, or APP_EMAIL."
    );
    console.error("Email Error! - ", missing.message);
    throw missing;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  const options = {
    from: `${process.env.APP_NAME || "Borderless Travels"} <${
      process.env.APP_EMAIL
    }>`,
    to: send_to,
    replyTo: process.env.APP_EMAIL,
    subject: notitle
      ? subject
      : `${subject} - ${process.env.APP_NAME || "Borderless Travels"}`,
    html: message,
  };

  try {
    const result = await transporter.sendMail(options);
    console.log(`Successfully sent email. Email ID - ${result.messageId}`);
    return result;
  } catch (err) {
    console.error("Email Error! - ", err);
    throw err;
  } finally {
    transporter.close();
  }
};

module.exports = sendEmail;
