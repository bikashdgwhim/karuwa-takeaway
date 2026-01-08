const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'karuwa.db');
const db = new sqlite3.Database(dbPath);

// Get email settings from database
const getEmailSettings = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM email_settings WHERE id = ?', ['default'], (err, row) => {
      if (err) reject(err);
      else if (!row) reject(new Error('Email settings not found'));
      else resolve(row);
    });
  });
};

// Create transporter with current database settings
const createTransporter = async () => {
  const settings = await getEmailSettings();

  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: false,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_password
    }
  });
};

// Helper function to replace template variables
const replaceVariables = (template, data) => {
  let result = template;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  return result;
};

// Get template from database
const getTemplate = (templateId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM email_templates WHERE id = ? AND active = 1', [templateId], (err, row) => {
      if (err) reject(err);
      else if (!row) reject(new Error(`Template ${templateId} not found or inactive`));
      else resolve(row);
    });
  });
};

// Format order items HTML
const formatOrderItems = (items) => {
  return items.map(item => `
    <div class="item">
      <span><strong>${item.quantity}x</strong> ${item.name}</span>
      <span>£${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');
};

// Send email using template
const sendTemplateEmail = async (to, templateId, data) => {
  try {
    const settings = await getEmailSettings();
    const template = await getTemplate(templateId);

    const subject = replaceVariables(template.subject, data);
    const html = replaceVariables(template.html_content, data);

    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Karuwa Takeaway" <${settings.restaurant_email}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Public API
module.exports = {
  sendOrderConfirmation: async (order, customerEmail) => {
    const data = {
      restaurantName: 'Karuwa Takeaway',
      customerName: order.customerName,
      orderNumber: order.id.slice(-4),
      orderTime: new Date(order.createdAt).toLocaleString(),
      orderItems: formatOrderItems(order.items),
      orderTotal: order.total.toFixed(2),
      deliveryAddress: order.customerAddress,
      customerPhone: order.customerPhone,
      currentYear: new Date().getFullYear()
    };

    return await sendTemplateEmail(customerEmail, 'order_confirmation', data);
  },

  sendOrderStatusUpdate: async (order, customerEmail, previousStatus) => {
    const statusMessages = {
      preparing: 'Our chefs are preparing your delicious meal!',
      ready: order.customerAddress.includes('Collection')
        ? 'Your order is ready! You can pick it up now.'
        : 'Your order is ready! Our driver is on the way!',
      delivered: 'Your order has been delivered. Enjoy your meal!'
    };

    const data = {
      restaurantName: 'Karuwa Takeaway',
      customerName: order.customerName,
      orderNumber: order.id.slice(-4),
      orderStatus: order.status.toUpperCase(),
      statusMessage: statusMessages[order.status] || 'Your order status has been updated.',
      currentYear: new Date().getFullYear()
    };

    return await sendTemplateEmail(customerEmail, 'order_status_update', data);
  },

  sendNewOrderAlert: async (order, staffEmails) => {
    const data = {
      orderNumber: order.id.slice(-4),
      orderTime: new Date(order.createdAt).toLocaleString(),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      orderItems: formatOrderItems(order.items),
      orderTotal: order.total.toFixed(2),
      deliveryAddress: order.customerAddress
    };

    const promises = staffEmails.map(email =>
      sendTemplateEmail(email, 'staff_new_order', data)
    );
    return await Promise.all(promises);
  },

  // Test email configuration
  testEmailConfig: async (testEmail) => {
    try {
      const settings = await getEmailSettings();
      const transporter = await createTransporter();
      await transporter.verify();

      // Send test email
      const mailOptions = {
        from: `"Karuwa Takeaway" <${settings.restaurant_email}>`,
        to: testEmail,
        subject: 'Test Email - Karuwa Email System',
        html: '<h1>Email Configuration Successful!</h1><p>Your Brevo SMTP is working correctly.</p>'
      };

      await transporter.sendMail(mailOptions);

      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
