const nodemailer = require("nodemailer");
const crypto = require('crypto');
require('dotenv').config();


const transporter = nodemailer.createTransport({
  host: process.env.Mail_SMTP_HOST,
  port: Number(process.env.MAIL_SMTP_PORT),
  secure: (process.env.MAIL_SMTP_SECURE === 'true' ? true : false), // true for port 465, false for other ports
  auth: {
    user: process.env.MAIL_SMTP_USERNAME, 
    pass: process.env.MAIL_SMTP_PASSWORD,
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function main() {
    console.log(process.env.Mail_SMTP_HOST);
    console.log(process.env.MAIL_SMTP_PORT);
    console.log(process.env.MAIL_SMTP_SECURE);
    console.log(process.env.MAIL_SMTP_USERNAME);
    console.log(process.env.MAIL_SMTP_PASSWORD);

  const id = crypto.randomBytes(10);
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.Mail_SMTP_FROM_ADDRESS, // sender address
    to: process.env.Mail_SEND_EMAIL, // list of receivers
    subject: "Mail subject", // Subject line
    text: "Email body content", // plain text body
    html: "<b>Email body content</b>" // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

main().catch(console.error);