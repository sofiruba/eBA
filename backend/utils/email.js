const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarEmail = async ({ para, asunto, texto }) => {
  await transporter.sendMail({
    from: `"eBA" <${process.env.EMAIL_USER}>`,
    to: para,
    subject: asunto,
    text: texto,
  });
};

module.exports = enviarEmail;