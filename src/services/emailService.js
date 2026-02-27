const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendResetPasswordEmail = async (to, resetLink) => {
  await transporter.sendMail({
    from: `"Device Inventory" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your password',
    html: `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
};