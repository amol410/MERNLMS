const nodemailer = require('nodemailer');

/**
 * Creates and configures the Nodemailer transporter for Hostinger SMTP
 */
const getTransporter = () => {
    const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const port = parseInt(process.env.SMTP_PORT, 10) || 465;
    const user = process.env.SMTP_USER || process.env.BUSINESS_EMAIL || 'support@dolphincoder.com';
    const pass = process.env.SMTP_PASS || process.env.BUSINESS_EMAIL_PASSWORD || '';

    // If running in test mode and no live SMTP_PASS is configured, return mock transporter to avoid network hangs
    if (process.env.NODE_ENV === 'test' && !process.env.SMTP_PASS) {
        return {
            sendMail: async (mailOptions) => ({
                messageId: `mock-otp-${Date.now()}@dolphincoder.com`,
                response: '250 Mock email accepted',
                envelope: { from: mailOptions.from, to: mailOptions.to },
            }),
        };
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465 (SSL), false for other ports (e.g. 587 STARTTLS)
        auth: {
            user,
            pass,
        },
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
    });
};

/**
 * Generates branded HTML template for Password Reset OTP
 */
const generateResetEmailTemplate = (otp, userName) => {
    const greetingName = userName ? userName : 'Learner';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP - DolphinCoder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
          
          <!-- Ocean Gradient Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #075985 100%); padding: 32px 24px; text-align: center;">
              <div style="font-size: 38px; line-height: 1; margin-bottom: 8px;">🐬</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">DolphinCoder LMS</h1>
              <p style="margin: 4px 0 0; color: #BAE6FD; font-size: 14px; font-weight: 500;">Interactive Language & Skills Learning</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px; color: #0F172A; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                Hi <strong>${greetingName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                We received a request to reset your password. Use the single-use 6-digit verification code below to complete the reset process:
              </p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #F0F9FF; border: 2px dashed #0284C7; border-radius: 14px; padding: 22px 16px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0284C7; display: inline-block; padding-left: 10px;">
                      ${otp}
                    </span>
                    <div style="margin-top: 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #0369A1;">
                      Verification Code
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400E;">
                  ⏳ <strong>Valid for 15 minutes.</strong> For your security, never share this code with anyone. DolphinCoder staff will never ask for your code.
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                If you did not request this password reset, please ignore this email or reach out to us at <a href="mailto:support@dolphincoder.com" style="color: #0284C7; text-decoration: none; font-weight: 600;">support@dolphincoder.com</a> if you have concerns.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #94A3B8;">
                © ${new Date().getFullYear()} DolphinCoder LMS. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                Need help? Contact <a href="mailto:support@dolphincoder.com" style="color: #0284C7; text-decoration: none;">support@dolphincoder.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generates branded HTML template for Registration Email Verification OTP
 */
const generateVerificationEmailTemplate = (otp, userName) => {
    const greetingName = userName ? userName : 'Learner';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - DolphinCoder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
          
          <!-- Ocean Gradient Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #075985 100%); padding: 32px 24px; text-align: center;">
              <div style="font-size: 38px; line-height: 1; margin-bottom: 8px;">🐬</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Welcome to DolphinCoder!</h1>
              <p style="margin: 4px 0 0; color: #BAE6FD; font-size: 14px; font-weight: 500;">Interactive Language & Skills Learning</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px; color: #0F172A; font-size: 20px; font-weight: 700;">Confirm Your Email Address</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                Hi <strong>${greetingName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                Thank you for creating an account with DolphinCoder LMS! To activate your account and begin your learning journey, please verify your email address using the 6-digit code below:
              </p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #F0F9FF; border: 2px dashed #0284C7; border-radius: 14px; padding: 22px 16px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0284C7; display: inline-block; padding-left: 10px;">
                      ${otp}
                    </span>
                    <div style="margin-top: 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #0369A1;">
                      Verification Code
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400E;">
                  ⏳ <strong>Valid for 15 minutes.</strong> For your security, do not share this code with anyone.
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                If you did not sign up for DolphinCoder, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #94A3B8;">
                © ${new Date().getFullYear()} DolphinCoder LMS. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                Need help? Contact <a href="mailto:support@dolphincoder.com" style="color: #0284C7; text-decoration: none;">support@dolphincoder.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Sends a 6-digit OTP email to the requested recipient.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP string
 * @param {string} [userName] - Recipient display name
 * @returns {Promise<object>} Nodemailer send response info
 */
const sendPasswordResetOtpEmail = async (toEmail, otp, userName = '') => {
    const transporter = getTransporter();
    const sender = process.env.EMAIL_FROM || '"DolphinCoder Support" <support@dolphincoder.com>';

    const subject = `Your DolphinCoder Password Reset Code: ${otp}`;
    const text = `Hi ${userName || 'Learner'},\n\nYour DolphinCoder password reset code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\n- The DolphinCoder Team`;
    const html = generateResetEmailTemplate(otp, userName);

    const info = await transporter.sendMail({
        from: sender,
        to: toEmail,
        subject,
        text,
        html,
    });

    return info;
};

/**
 * Sends a 6-digit Registration Verification OTP email to the new user.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP string
 * @param {string} [userName] - Recipient display name
 * @returns {Promise<object>} Nodemailer send response info
 */
const sendVerificationOtpEmail = async (toEmail, otp, userName = '') => {
    const transporter = getTransporter();
    const sender = process.env.EMAIL_FROM || '"DolphinCoder Support" <support@dolphincoder.com>';

    const subject = `Verify Your DolphinCoder Account: ${otp}`;
    const text = `Hi ${userName || 'Learner'},\n\nWelcome to DolphinCoder LMS! Your 6-digit email verification code is: ${otp}\n\nThis code will expire in 15 minutes.\n\n- The DolphinCoder Team`;
    const html = generateVerificationEmailTemplate(otp, userName);

    const info = await transporter.sendMail({
        from: sender,
        to: toEmail,
        subject,
        text,
        html,
    });

    return info;
};

module.exports = {
    getTransporter,
    sendPasswordResetOtpEmail,
    sendVerificationOtpEmail,
};
