// Test script to verify email sending with database templates
const emailService = require('./emailService');

const testOrder = {
    id: 'TEST' + Date.now(),
    customerName: 'Test Customer',
    customerPhone: '07700 900000',
    customerAddress: '123 Test Street, London, SW1A 1AA',
    items: [
        { name: 'Chicken Tikka Masala', price: 12.99, quantity: 2 },
        { name: 'Garlic Naan', price: 2.50, quantity: 3 }
    ],
    total: 33.48,
    status: 'pending',
    createdAt: new Date().toISOString()
};

const testCustomerEmail = 'test@example.com'; // Change this to your email

console.log('Testing email system with database templates...\n');
console.log('Test Order:', testOrder);
console.log('Customer Email:', testCustomerEmail);
console.log('\nSending order confirmation email...\n');

emailService.sendOrderConfirmation(testOrder, testCustomerEmail)
    .then(result => {
        if (result.success) {
            console.log('✅ SUCCESS! Email sent using database template');
            console.log('Message ID:', result.messageId);
            console.log('\nCheck your inbox at:', testCustomerEmail);
            console.log('\nThe email was sent using the "order_confirmation" template from the database.');
            console.log('You can edit this template in: Admin Panel → Email Management → Email Templates');
        } else {
            console.log('❌ FAILED:', result.error);
            console.log('\nPossible issues:');
            console.log('1. SMTP credentials not configured');
            console.log('2. Sender email not verified in Brevo');
            console.log('3. Network connection issue');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ ERROR:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    });
