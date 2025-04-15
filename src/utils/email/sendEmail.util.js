const nodemailer = require("nodemailer");

const sendEmail = (subject, message, send_to, notitle = false) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      // user: "no-reply@borderless.travel",
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const options = {
    from: `${process.env.APP_NAME} <${process.env.APP_EMAIL}>`,
    to: send_to,
    replyTo: process.env.APP_EMAIL,
    subject: notitle ? subject : `${subject} - ${process.env.APP_NAME}`,
    html: message,
  };

  transporter.sendMail(options, function (err, result) {
    if (err) {
      console.log("Email Error! - ", err);
      // throw new Error(err);
    }
    if (result) {
      console.log(`Successfully sent email. Email ID - ${result.messageId}`);
      return true;
    }
  });
};

module.exports = sendEmail;
