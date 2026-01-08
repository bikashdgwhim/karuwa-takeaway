const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Save with timestamp to avoid duplicates
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
// Database Setup
const dbPath = path.resolve(__dirname, 'karuwa.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Categories Table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    )`);

    // Menu Items Table
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      categoryId TEXT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL,
      image TEXT,
      isVegetarian INTEGER,
      isVegan INTEGER,
      isSpicy INTEGER,
      spiceLevel INTEGER,
      allergens TEXT,
      isPopular INTEGER,
      FOREIGN KEY(categoryId) REFERENCES categories(id)
    )`);

    // Orders Table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT,
      customerPhone TEXT,
      customerAddress TEXT,
      total REAL,
      status TEXT,
      createdAt TEXT,
      items JSON
    )`);

    // Site Settings Table
    db.run(`CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      content JSON
    )`);

    // Seed default settings if not exists
    db.get('SELECT * FROM site_settings WHERE id = ?', ['default'], (err, row) => {
      if (!row) {
        const defaultSettings = {
          headerTitle: 'Karuwa',
          headerLogo: '',
          heroImage: '', // Use default if empty
          heroHeadline: 'Authentic Nepalese Cuisine',
          heroSubheadline: 'Experience the taste of the Himalayas',
          chefPhoto: '',
          chefName: 'Chef Rajesh Kumar',
          chefPosition: 'Head Chef',
          openingHours: 'Mon-Sun: 17:00 - 23:00',
          footerAddress: '123 High Street, London',
          footerPhone: '020 7999 9999',
          footerEmail: 'info@karuwa.com',
          copyrightText: 'Karuwa Takeaway. All Rights Reserved.'
        };
        db.run('INSERT INTO site_settings (id, content) VALUES (?, ?)', ['default', JSON.stringify(defaultSettings)]);
      }
    });

    // Create email_settings table
    db.run(`CREATE TABLE IF NOT EXISTS email_settings (
      id TEXT PRIMARY KEY,
      smtp_host TEXT,
      smtp_port INTEGER,
      smtp_user TEXT,
      smtp_password TEXT,
      restaurant_email TEXT,
      staff_emails TEXT,
      send_customer_emails INTEGER DEFAULT 1,
      send_staff_emails INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed default email settings
    db.get('SELECT * FROM email_settings WHERE id = ?', ['default'], (err, row) => {
      if (!err && !row) {
        const defaultEmailSettings = {
          id: 'default',
          smtp_host: 'smtp-relay.brevo.com',
          smtp_port: 587,
          smtp_user: '',
          smtp_password: '',
          restaurant_email: 'restaurant@karuwa.com',
          staff_emails: JSON.stringify([]),
          send_customer_emails: 1,
          send_staff_emails: 1
        };
        db.run(
          'INSERT INTO email_settings (id, smtp_host, smtp_port, smtp_user, smtp_password, restaurant_email, staff_emails, send_customer_emails, send_staff_emails) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [defaultEmailSettings.id, defaultEmailSettings.smtp_host, defaultEmailSettings.smtp_port, defaultEmailSettings.smtp_user, defaultEmailSettings.smtp_password, defaultEmailSettings.restaurant_email, defaultEmailSettings.staff_emails, defaultEmailSettings.send_customer_emails, defaultEmailSettings.send_staff_emails]
        );
      }
    });

    // Create email_templates table
    db.run(`CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_content TEXT NOT NULL,
      variables TEXT,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed default email templates
    db.get('SELECT COUNT(*) as count FROM email_templates', (err, row) => {
      if (!err && row.count === 0) {
        const defaultTemplates = [
          {
            id: 'order_confirmation',
            name: 'Order Confirmation',
            subject: 'Order Confirmation #{{orderNumber}} - {{restaurantName}}',
            html_content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #064E3B; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .order-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-size: 18px; font-weight: bold; color: #064E3B; padding-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{restaurantName}}</h1>
      <p>Thank you for your order!</p>
    </div>
    <div class="content">
      <h2>Order Confirmation</h2>
      <p>Hi {{customerName}},</p>
      <p>We've received your order and we're getting it ready for you!</p>
      
      <div class="order-details">
        <p><strong>Order Number:</strong> #{{orderNumber}}</p>
        <p><strong>Order Time:</strong> {{orderTime}}</p>
        
        <h3>Order Items:</h3>
        {{orderItems}}
        
        <div class="total">
          <div style="display: flex; justify-content: space-between;">
            <span>Total:</span>
            <span>£{{orderTotal}}</span>
          </div>
        </div>
        
        <h3>Delivery Address:</h3>
        <p>{{deliveryAddress}}</p>
        <p><strong>Phone:</strong> {{customerPhone}}</p>
      </div>
      
      <p>We'll send you another email when your order status changes.</p>
    </div>
    <div class="footer">
      <p>&copy; {{currentYear}} {{restaurantName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
            variables: JSON.stringify(['restaurantName', 'customerName', 'orderNumber', 'orderTime', 'orderItems', 'orderTotal', 'deliveryAddress', 'customerPhone', 'currentYear']),
            description: 'Sent to customers when they place an order'
          },
          {
            id: 'order_status_update',
            name: 'Order Status Update',
            subject: 'Order #{{orderNumber}} - Status: {{orderStatus}}',
            html_content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #064E3B; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .status-update { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
    .status-badge { padding: 10px 20px; border-radius: 5px; display: inline-block; font-size: 18px; font-weight: bold; background: #D1FAE5; color: #065F46; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{restaurantName}}</h1>
    </div>
    <div class="content">
      <h2>Order Status Update</h2>
      <p>Hi {{customerName}},</p>
      
      <div class="status-update">
        <p>Your order #{{orderNumber}} status has been updated:</p>
        <div class="status-badge">{{orderStatus}}</div>
        <p style="margin-top: 20px;">{{statusMessage}}</p>
      </div>
      
      <p>Thank you for choosing {{restaurantName}}!</p>
    </div>
    <div class="footer">
      <p>&copy; {{currentYear}} {{restaurantName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
            variables: JSON.stringify(['restaurantName', 'customerName', 'orderNumber', 'orderStatus', 'statusMessage', 'currentYear']),
            description: 'Sent to customers when order status changes'
          },
          {
            id: 'staff_new_order',
            name: 'Staff New Order Alert',
            subject: '🔔 NEW ORDER #{{orderNumber}} - {{customerName}}',
            html_content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .order-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-size: 18px; font-weight: bold; color: #DC2626; padding-top: 15px; }
    .urgent { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 NEW ORDER RECEIVED</h1>
      <h2>Order #{{orderNumber}}</h2>
    </div>
    <div class="content">
      <div class="urgent">
        <strong>⏰ Order Time:</strong> {{orderTime}}<br>
        <strong>📞 Customer:</strong> {{customerName}} - {{customerPhone}}
      </div>
      
      <div class="order-details">
        <h3>Order Items:</h3>
        {{orderItems}}
        
        <div class="total">
          <div style="display: flex; justify-content: space-between;">
            <span>TOTAL:</span>
            <span>£{{orderTotal}}</span>
          </div>
        </div>
      </div>
      
      <div class="order-details">
        <h3>📍 Delivery Details:</h3>
        <p><strong>Address:</strong><br>{{deliveryAddress}}</p>
        <p><strong>Phone:</strong> {{customerPhone}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
            variables: JSON.stringify(['orderNumber', 'orderTime', 'customerName', 'customerPhone', 'orderItems', 'orderTotal', 'deliveryAddress']),
            description: 'Sent to staff when a new order is received'
          }
        ];

        defaultTemplates.forEach(template => {
          db.run(
            'INSERT INTO email_templates (id, name, subject, html_content, variables, description) VALUES (?, ?, ?, ?, ?, ?)',
            [template.id, template.name, template.subject, template.html_content, template.variables, template.description]
          );
        });
      }
    });

    // Users Table for authentication and role management
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      permissions TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastLogin TEXT
    )`);

    // Seed default admin user if not exists
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (!row) {
        // Default password: 'admin123' - CHANGE THIS IN PRODUCTION!
        const bcrypt = require('bcrypt');
        const defaultPassword = bcrypt.hashSync('admin123', 10);

        db.run(
          'INSERT INTO users (username, password, email, fullName, role, permissions) VALUES (?, ?, ?, ?, ?, ?)',
          ['admin', defaultPassword, 'admin@karuwa.com', 'Administrator', 'admin', JSON.stringify(['all'])],
          (err) => {
            if (err) console.error('Error creating default admin:', err);
            else console.log('✅ Default admin user created (username: admin, password: admin123)');
          }
        );
      }
    });

    migrate();
  });
}

function migrate() {
  const columnsToAdd = [
    'ALTER TABLE menu_items ADD COLUMN isVegetarian INTEGER DEFAULT 0',
    'ALTER TABLE menu_items ADD COLUMN isVegan INTEGER DEFAULT 0',
    'ALTER TABLE menu_items ADD COLUMN isSpicy INTEGER DEFAULT 0',
    'ALTER TABLE menu_items ADD COLUMN spiceLevel INTEGER DEFAULT 0',
    'ALTER TABLE menu_items ADD COLUMN allergens TEXT',
    'ALTER TABLE menu_items ADD COLUMN isPopular INTEGER DEFAULT 0'
  ];

  columnsToAdd.forEach(query => {
    db.run(query, (err) => {
      // Ignore error if column already exists
      if (err && !err.message.includes('duplicate column name')) {
        console.warn('Migration warning:', err.message);
      }
    });
  });
}

// Routes

// Get Menu
app.get('/api/menu', (req, res) => {
  const response = { categories: [], menuItems: [] };

  db.all('SELECT * FROM categories', [], (err, categories) => {
    if (err) return res.status(500).json({ error: err.message });
    response.categories = categories;

    db.all('SELECT * FROM menu_items', [], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      // Convert boolean integers back to boolean
      response.menuItems = items.map(item => ({
        ...item,
        isVegetarian: !!item.isVegetarian,
        isVegan: !!item.isVegan,
        isSpicy: !!item.isSpicy,
        isPopular: !!item.isPopular,
        allergens: item.allergens ? JSON.parse(item.allergens) : [],
      }));
      res.json(response);
    });
  });
});

// Update Menu
app.put('/api/menu', (req, res) => {
  const { categories, menuItems } = req.body;

  // This is a full replace for simplicity, or we could do upsert. 
  // For this simple app, we'll clear and re-insert or just update relevant fields.
  // To avoid complexity, let's assume valid data and just update/insert.
  // A true sync is harder, let's just wipe and recreate for this prototype or do simple inserts.
  // BUT "updating menu" from admin panel usually sends the WHOLE state.

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Nuke existing menu to ensure clean state (simplest for "save all" like behavior)
    db.run('DELETE FROM menu_items');
    db.run('DELETE FROM categories');

    const catStmt = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
    categories.forEach(c => catStmt.run(c.id, c.name, c.description));
    catStmt.finalize();

    const itemStmt = db.prepare('INSERT INTO menu_items (id, categoryId, name, description, price, image, isVegetarian, isVegan, isSpicy, spiceLevel, allergens, isPopular) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    menuItems.forEach(i => {
      itemStmt.run(
        i.id,
        i.categoryId,
        i.name,
        i.description,
        i.price,
        i.image,
        i.isVegetarian ? 1 : 0,
        i.isVegan ? 1 : 0,
        i.isSpicy ? 1 : 0,
        i.spiceLevel || 0,
        JSON.stringify(i.allergens || []),
        i.isPopular ? 1 : 0
      );
    });
    itemStmt.finalize();

    db.run('COMMIT', (err) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ success: true });
    });
  });
});

// Upload Image Route
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the path that can be stored in the DB (relative or absolute URL)
  // Since we serve '/uploads' statically, the URL will be /uploads/filename
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// Create Order
app.post('/api/orders', async (req, res) => {
  const { id, customerName, customerPhone, customerAddress, customerEmail, total, status, createdAt, items } = req.body;

  const stmt = db.prepare('INSERT INTO orders (id, customerName, customerPhone, customerAddress, total, status, createdAt, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, customerName, customerPhone, customerAddress, total, status, createdAt, JSON.stringify(items), async function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // Send email notifications
    try {
      const emailSettings = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM email_settings WHERE id = ?', ['default'], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (emailSettings && (emailSettings.send_customer_emails || emailSettings.send_staff_emails)) {
        // Update environment variables
        process.env.BREVO_SMTP_HOST = emailSettings.smtp_host;
        process.env.BREVO_SMTP_PORT = emailSettings.smtp_port;
        process.env.BREVO_SMTP_USER = emailSettings.smtp_user;
        process.env.BREVO_SMTP_PASSWORD = emailSettings.smtp_password;
        process.env.RESTAURANT_EMAIL = emailSettings.restaurant_email;
        process.env.RESTAURANT_NAME = 'Karuwa Takeaway';

        const emailService = require('./emailService');
        const order = { id, customerName, customerPhone, customerAddress, total, status, createdAt, items };

        // Send customer confirmation email
        if (emailSettings.send_customer_emails && customerEmail) {
          await emailService.sendOrderConfirmation(order, customerEmail);
        }

        // Send staff alert email
        if (emailSettings.send_staff_emails) {
          const staffEmails = JSON.parse(emailSettings.staff_emails || '[]');
          if (staffEmails.length > 0) {
            await emailService.sendNewOrderAlert(order, staffEmails);
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the order if email fails
    }

    res.json({ success: true, id: id });
  });
});

// Get Site Settings
app.get('/api/settings', (req, res) => {
  db.get('SELECT content FROM site_settings WHERE id = ?', ['default'], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row ? JSON.parse(row.content) : {});
  });
});

// Update Site Settings
app.put('/api/settings', (req, res) => {
  const settings = req.body;
  db.run('INSERT OR REPLACE INTO site_settings (id, content) VALUES (?, ?)', ['default', JSON.stringify(settings)], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Get Orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const orders = rows.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    res.json(orders);
  });
});

// Update Order Status
app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status, customerEmail } = req.body;

  // If the body contains the full order, extract status, otherwise use status field
  const newStatus = status || req.body.status;

  // Get previous order status
  db.get('SELECT * FROM orders WHERE id = ?', [id], async (err, previousOrder) => {
    if (err) return res.status(500).json({ error: err.message });

    const previousStatus = previousOrder ? previousOrder.status : null;

    db.run('UPDATE orders SET status = ? WHERE id = ?', [newStatus, id], async function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Send status update email if status changed
      if (previousStatus && previousStatus !== newStatus) {
        try {
          const emailSettings = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM email_settings WHERE id = ?', ['default'], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });

          if (emailSettings && emailSettings.send_customer_emails && customerEmail) {
            // Update environment variables
            process.env.BREVO_SMTP_HOST = emailSettings.smtp_host;
            process.env.BREVO_SMTP_PORT = emailSettings.smtp_port;
            process.env.BREVO_SMTP_USER = emailSettings.smtp_user;
            process.env.BREVO_SMTP_PASSWORD = emailSettings.smtp_password;
            process.env.RESTAURANT_EMAIL = emailSettings.restaurant_email;
            process.env.RESTAURANT_NAME = 'Karuwa Takeaway';

            const emailService = require('./emailService');

            // Get full order details
            db.get('SELECT * FROM orders WHERE id = ?', [id], async (err, order) => {
              if (!err && order) {
                const orderData = {
                  ...order,
                  items: JSON.parse(order.items)
                };
                await emailService.sendOrderStatusUpdate(orderData, customerEmail, previousStatus);
              }
            });
          }
        } catch (emailError) {
          console.error('Error sending status update email:', emailError);
        }
      }

      res.json({ success: true });
    });
  });
});

// Delete single order
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM orders WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Order deleted successfully' });
  });
});

// Delete all orders
app.delete('/api/orders', (req, res) => {
  db.run('DELETE FROM orders', function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'All orders deleted successfully', deletedCount: this.changes });
  });
});

// Create promo_codes table
db.run(`CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value REAL NOT NULL,
  min_order REAL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  uses INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Seed some promo codes
db.get('SELECT COUNT(*) as count FROM promo_codes', (err, row) => {
  if (!err && row.count === 0) {
    const promoCodes = [
      { code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, min_order: 15 },
      { code: 'SAVE5', discount_type: 'fixed', discount_value: 5, min_order: 20 },
      { code: 'FREESHIP', discount_type: 'fixed', discount_value: 3, min_order: 10 },
      { code: 'VIP20', discount_type: 'percentage', discount_value: 20, min_order: 30, max_uses: 100 }
    ];

    promoCodes.forEach(promo => {
      db.run(
        'INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_uses) VALUES (?, ?, ?, ?, ?)',
        [promo.code, promo.discount_type, promo.discount_value, promo.min_order, promo.max_uses || null]
      );
    });
  }
});

// Validate promo code endpoint
app.post('/api/validate-promo', (req, res) => {
  const { code, orderTotal } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, message: 'Promo code is required' });
  }

  db.get(
    'SELECT * FROM promo_codes WHERE code = ? AND active = 1',
    [code.toUpperCase()],
    (err, promo) => {
      if (err) {
        return res.status(500).json({ valid: false, message: 'Error validating promo code' });
      }

      if (!promo) {
        return res.status(200).json({ valid: false, message: 'Invalid promo code' });
      }

      // Check if promo has reached max uses
      if (promo.max_uses && promo.uses >= promo.max_uses) {
        return res.status(200).json({ valid: false, message: 'Promo code has expired' });
      }

      // Check minimum order value
      if (orderTotal < promo.min_order) {
        return res.status(200).json({
          valid: false,
          message: `Minimum order of £${promo.min_order.toFixed(2)} required`
        });
      }

      // Calculate discount
      let discount = 0;
      if (promo.discount_type === 'percentage') {
        discount = (orderTotal * promo.discount_value) / 100;
      } else {
        discount = promo.discount_value;
      }

      // Ensure discount doesn't exceed order total
      discount = Math.min(discount, orderTotal);

      res.json({
        valid: true,
        discount: parseFloat(discount.toFixed(2)),
        promoId: promo.id,
        message: 'Promo code applied successfully'
      });
    }
  );
});

// Increment promo code usage (called when order is placed)
app.post('/api/use-promo', (req, res) => {
  const { promoId } = req.body;

  if (!promoId) {
    return res.status(400).json({ error: 'Promo ID is required' });
  }

  db.run(
    'UPDATE promo_codes SET uses = uses + 1 WHERE id = ?',
    [promoId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update promo usage' });
      }
      res.json({ success: true });
    }
  );
});

// Get all promo codes (for admin)
app.get('/api/promo-codes', (req, res) => {
  db.all('SELECT * FROM promo_codes ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new promo code
app.post('/api/promo-codes', (req, res) => {
  const { code, discount_type, discount_value, min_order, max_uses, active } = req.body;

  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_uses, active) VALUES (?, ?, ?, ?, ?, ?)',
    [code.toUpperCase(), discount_type, discount_value, min_order || 0, max_uses || null, active !== false ? 1 : 0],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Promo code already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Promo code created successfully' });
    }
  );
});

// Update promo code
app.put('/api/promo-codes/:id', (req, res) => {
  const { id } = req.params;
  const { code, discount_type, discount_value, min_order, max_uses, active } = req.body;

  db.run(
    'UPDATE promo_codes SET code = ?, discount_type = ?, discount_value = ?, min_order = ?, max_uses = ?, active = ? WHERE id = ?',
    [code.toUpperCase(), discount_type, discount_value, min_order || 0, max_uses || null, active ? 1 : 0, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Promo code updated successfully' });
    }
  );
});

// Delete promo code
app.delete('/api/promo-codes/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM promo_codes WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Promo code deleted successfully' });
  });
});

// Email Settings Endpoints
// Get email settings
app.get('/api/email-settings', (req, res) => {
  db.get('SELECT * FROM email_settings WHERE id = ?', ['default'], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({});

    // Parse staff_emails JSON
    const settings = {
      ...row,
      staff_emails: JSON.parse(row.staff_emails || '[]')
    };
    res.json(settings);
  });
});

// Update email settings
app.put('/api/email-settings', (req, res) => {
  const { smtp_host, smtp_port, smtp_user, smtp_password, restaurant_email, staff_emails, send_customer_emails, send_staff_emails } = req.body;

  db.run(
    `UPDATE email_settings SET 
      smtp_host = ?, 
      smtp_port = ?, 
      smtp_user = ?, 
      smtp_password = ?, 
      restaurant_email = ?, 
      staff_emails = ?,
      send_customer_emails = ?,
      send_staff_emails = ?
    WHERE id = ?`,
    [smtp_host, smtp_port, smtp_user, smtp_password, restaurant_email, JSON.stringify(staff_emails), send_customer_emails ? 1 : 0, send_staff_emails ? 1 : 0, 'default'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Email settings updated successfully' });
    }
  );
});

// Test email configuration
app.post('/api/test-email', async (req, res) => {
  const { testEmail } = req.body;

  try {
    // Get email settings
    db.get('SELECT * FROM email_settings WHERE id = ?', ['default'], async (err, settings) => {
      if (err) return res.status(500).json({ error: err.message });

      // Update environment variables temporarily for test
      process.env.BREVO_SMTP_HOST = settings.smtp_host;
      process.env.BREVO_SMTP_PORT = settings.smtp_port;
      process.env.BREVO_SMTP_USER = settings.smtp_user;
      process.env.BREVO_SMTP_PASSWORD = settings.smtp_password;
      process.env.RESTAURANT_EMAIL = settings.restaurant_email;

      const emailService = require('./emailService');
      const result = await emailService.testEmailConfig(testEmail);
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Email Template Management Endpoints

// Get all email templates
app.get('/api/email-templates', (req, res) => {
  db.all('SELECT * FROM email_templates ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Parse variables JSON for each template
    const templates = rows.map(row => ({
      ...row,
      variables: JSON.parse(row.variables || '[]'),
      active: Boolean(row.active)
    }));

    res.json(templates);
  });
});

// Get single email template
app.get('/api/email-templates/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM email_templates WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Template not found' });

    const template = {
      ...row,
      variables: JSON.parse(row.variables || '[]'),
      active: Boolean(row.active)
    };

    res.json(template);
  });
});

// Update email template
app.put('/api/email-templates/:id', (req, res) => {
  const { id } = req.params;
  const { name, subject, html_content, description, active } = req.body;

  db.run(
    `UPDATE email_templates SET 
      name = ?,
      subject = ?,
      html_content = ?,
      description = ?,
      active = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [name, subject, html_content, description, active ? 1 : 0, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Template not found' });
      res.json({ success: true, message: 'Template updated successfully' });
    }
  );
});

// Preview email template with sample data
app.post('/api/email-templates/:id/preview', (req, res) => {
  const { id } = req.params;
  const sampleData = req.body;

  db.get('SELECT * FROM email_templates WHERE id = ?', [id], (err, template) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // Replace variables in template
    let previewHtml = template.html_content;
    let previewSubject = template.subject;

    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewHtml = previewHtml.replace(regex, sampleData[key]);
      previewSubject = previewSubject.replace(regex, sampleData[key]);
    });

    res.json({
      subject: previewSubject,
      html: previewHtml
    });
  });
});

// Reset template to default
app.post('/api/email-templates/:id/reset', (req, res) => {
  const { id } = req.params;

  // This would restore the default template
  // For now, just return success
  res.json({ success: true, message: 'Template reset to default (feature pending)' });
});

// ============================================
// USER MANAGEMENT API ENDPOINTS
// ============================================

const bcrypt = require('bcrypt');

// Get all users
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, email, fullName, role, permissions, isActive, createdAt, lastLogin FROM users ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single user
app.get('/api/users/:id', (req, res) => {
  db.get('SELECT id, username, email, fullName, role, permissions, isActive, createdAt, lastLogin FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

// Create new user
app.post('/api/users', async (req, res) => {
  const { username, password, email, fullName, role, permissions } = req.body;

  if (!username || !password || !email || !fullName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const permissionsJson = JSON.stringify(permissions || []);

    db.run(
      'INSERT INTO users (username, password, email, fullName, role, permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, fullName, role || 'staff', permissionsJson],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  const { username, email, fullName, role, permissions, isActive, password } = req.body;
  const userId = req.params.id;

  try {
    let updateQuery = 'UPDATE users SET username = ?, email = ?, fullName = ?, role = ?, permissions = ?, isActive = ?';
    let params = [username, email, fullName, role, JSON.stringify(permissions || []), isActive ? 1 : 0];

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    params.push(userId);

    db.run(updateQuery, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;

  db.get('SELECT username FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });

    if (row.username === 'admin') {
      return res.status(403).json({ error: 'Cannot delete default admin user' });
    }

    db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ? AND isActive = 1', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      db.run('UPDATE users SET lastLogin = ? WHERE id = ?', [new Date().toISOString(), user.id]);

      const { password: _, ...userData } = user;
      res.json({
        success: true,
        user: {
          ...userData,
          permissions: JSON.parse(user.permissions || '[]')
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Change password endpoint
app.post('/api/users/:id/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.params.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });

    try {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Password changed successfully' });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
