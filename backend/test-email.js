// Quick test script to diagnose Brevo SMTP connection
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./karuwa.db');

db.get('SELECT * FROM email_settings WHERE id = ?', ['default'], async (err, settings) => {
    if (err) {
        console.error('Database error:', err);
        process.exit(1);
    }

    console.log('\n=== Email Configuration ===');
    console.log('SMTP Host:', settings.smtp_host);
    console.log('SMTP Port:', settings.smtp_port);
    console.log('SMTP User:', settings.smtp_user);
    console.log('SMTP Password:', settings.smtp_password ? '***SET***' : '***NOT SET***');
    console.log('Restaurant Email:', settings.restaurant_email);
    console.log('===========================\n');

    if (!settings.smtp_user || !settings.smtp_password) {
        console.error('❌ ERROR: SMTP credentials are not configured!');
        console.log('\nPlease configure your Brevo SMTP credentials in the admin panel:');
        console.log('1. Go to Admin Panel → Email Management → SMTP Settings');
        console.log('2. Enter your Brevo SMTP credentials');
        console.log('3. Save settings');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: false,
        auth: {
            user: settings.smtp_user,
            pass: settings.smtp_password
        }
    });

    console.log('Testing SMTP connection...\n');

    try {
        await transporter.verify();
        console.log('✅ SMTP connection successful!');

        console.log('\nSending test email...');
        const info = await transporter.sendMail({
            from: `"Karuwa Takeaway" <${settings.restaurant_email}>`,
            to: 'test@example.com', // Change this to your email
            subject: 'Test Email from Karuwa',
            html: '<h1>Success!</h1><p>Your Brevo SMTP is working correctly.</p>'
        });

        console.log('✅ Test email sent!');
        console.log('Message ID:', info.messageId);
        console.log('\nCheck your inbox at test@example.com');

    } catch (error) {
        console.error('❌ SMTP Error:', error.message);
        console.log('\nCommon issues:');
        console.log('1. Invalid SMTP password - regenerate in Brevo dashboard');
        console.log('2. Sender email not verified in Brevo');
        console.log('3. Brevo account not activated');
        console.log('4. Incorrect SMTP credentials');
    }

    db.close();
    process.exit(0);
});
