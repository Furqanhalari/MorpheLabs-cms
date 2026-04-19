const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const send = async (to, subject, html) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

const sendPasswordResetEmail = (email, token) => {
  const url = `${process.env.ADMIN_URL}/reset-password?token=${token}`;
  return send(email, 'Reset your MorpheLabs CMS password', `
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
    <a href="${url}">Reset Password</a>
    <p>If you didn't request this, ignore this email.</p>
  `);
};

const sendWelcomeEmail = (email, firstName, tempPassword) => {
  return send(email, 'Welcome to MorpheLabs CMS', `
    <h2>Welcome, ${firstName}!</h2>
    <p>Your account has been created. Use the credentials below to log in:</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>Please change your password on first login.</p>
    <a href="${process.env.ADMIN_URL}">Go to Admin Panel</a>
  `);
};

const sendNewApplicationEmail = (hrEmail, { job, applicant }) => {
  return send(hrEmail, `New Application: ${job.title}`, `
    <h2>New Job Application Received</h2>
    <p><strong>Position:</strong> ${job.title}</p>
    <p><strong>Applicant:</strong> ${applicant.firstName} ${applicant.lastName}</p>
    <p><strong>Email:</strong> ${applicant.email}</p>
    <p><strong>Phone:</strong> ${applicant.phone || 'Not provided'}</p>
    <a href="${process.env.ADMIN_URL}/careers/applications">View Application</a>
  `);
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, sendNewApplicationEmail };
