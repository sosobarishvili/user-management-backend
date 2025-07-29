const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: false,
});

exports.sendResetEmail = async (to, token) => {
  const resetUrl = `${process.env.FRONTEND_URL.replace(/\/+$/, '')}/reset-password/${token}`;
  const message = `You are receiving this email because you requested a password reset:\n\n${resetUrl}`;

  await transporter.sendMail({
    from: '"Your App" <no-reply@yourapp.com>',
    to,
    subject: 'Password Reset',
    text: message,
  });
};
