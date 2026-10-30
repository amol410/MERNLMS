const { getTransporter, sendPasswordResetOtpEmail, sendVerificationOtpEmail } = require('../services/emailService');

describe('Hostinger SMTP Email Service Test Suite', () => {
    it('getTransporter - returns transporter configured with Hostinger parameters', () => {
        const transporter = getTransporter();
        expect(transporter).toBeDefined();
        expect(typeof transporter.sendMail).toBe('function');
    });

    it('sendPasswordResetOtpEmail - successfully constructs and sends branded OTP email', async () => {
        const result = await sendPasswordResetOtpEmail('student@example.com', '654321', 'Alex');
        expect(result).toBeDefined();
        expect(result.messageId).toBeDefined();
        expect(result.messageId).toContain('dolphincoder.com');
    });

    it('sendVerificationOtpEmail - successfully constructs and sends branded verification OTP email', async () => {
        const result = await sendVerificationOtpEmail('newlearner@example.com', '123456', 'Sam');
        expect(result).toBeDefined();
        expect(result.messageId).toBeDefined();
        expect(result.messageId).toContain('dolphincoder.com');
    });
});
