const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'karuwa.db');
const db = new sqlite3.Database(dbPath);

const INITIAL_DATA = {
    categories: [
        { id: 'c1', name: 'Starters', description: '', order: 1 },
        { id: 'c2', name: 'Nepalese Specialties', description: '', order: 2 },
        { id: 'c3', name: 'Tandoori Dishes', description: '', order: 3 },
        { id: 'c4', name: 'Curry Classics', description: '', order: 4 },
        { id: 'c5', name: 'Sides & Rice', description: '', order: 5 },
    ],
    menuItems: [
        {
            id: 'm1',
            categoryId: 'c1',
            name: 'Vegetable Momo',
            description: 'Steamed dumplings filled with seasoned vegetables, served with tomato chutney.',
            price: 6.95,
            isVegetarian: true,
            isPopular: true
        },
        {
            id: 'm2',
            categoryId: 'c1',
            name: 'Chicken Choila',
            description: 'Grilled chicken marinated with ginger, garlic, and traditional Nepalese spices.',
            price: 7.50,
            isSpicy: true
        },
        {
            id: 'm3',
            categoryId: 'c2',
            name: 'Gurkha Curry',
            description: 'A famous Nepalese dish cooked with yoghurt, fresh coriander and green chillies.',
            price: 12.95,
            isSpicy: true,
            isPopular: true
        },
        {
            id: 'm4',
            categoryId: 'c2',
            name: 'Himalayan Goat Curry',
            description: 'Slow cooked goat meat on the bone with rich Nepalese herbs.',
            price: 14.50,
            isSpicy: true
        },
        {
            id: 'm5',
            categoryId: 'c3',
            name: 'Chicken Tikka',
            description: 'Boneless chicken breast marinated in yoghurt and spices, cooked in clay oven.',
            price: 10.95
        },
        {
            id: 'm6',
            categoryId: 'c4',
            name: 'Butter Chicken',
            description: 'Mild and creamy curry cooked with butter, almonds and coconut.',
            price: 11.95
        },
        {
            id: 'm7',
            categoryId: 'c4',
            name: 'Lamb Rogan Josh',
            description: 'Tender lamb cooked with kashmiri spices in a rich tomato sauce.',
            price: 12.50,
            isSpicy: true
        },
        {
            id: 'm8',
            categoryId: 'c5',
            name: 'Garlic Naan',
            description: 'Freshly baked bread topped with garlic and coriander.',
            price: 3.50,
            isVegetarian: true
        },
        {
            id: 'm9',
            categoryId: 'c5',
            name: 'Pilau Rice',
            description: 'Basmati rice cooked with saffron and whole spices.',
            price: 3.25,
            isVegetarian: true
        }
    ]
};

// Schema Setup & Migration (Matches server.js)
function initializeAndMigrate(callback) {
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

        // Migration (Add missing columns if table existed but was old)
        const columnsToAdd = [
            'ALTER TABLE menu_items ADD COLUMN isVegetarian INTEGER DEFAULT 0',
            'ALTER TABLE menu_items ADD COLUMN isVegan INTEGER DEFAULT 0',
            'ALTER TABLE menu_items ADD COLUMN isSpicy INTEGER DEFAULT 0',
            'ALTER TABLE menu_items ADD COLUMN spiceLevel INTEGER DEFAULT 0',
            'ALTER TABLE menu_items ADD COLUMN allergens TEXT',
            'ALTER TABLE menu_items ADD COLUMN isPopular INTEGER DEFAULT 0'
        ];

        if (columnsToAdd.length === 0) {
            callback();
        } else {
            let completed = 0;
            columnsToAdd.forEach(query => {
                db.run(query, (err) => {
                    // Ignore duplicate column errors
                    completed++;
                    if (completed === columnsToAdd.length) {
                        callback();
                    }
                });
            });
        }
    });
}

db.serialize(() => {
    initializeAndMigrate(() => {
        console.log('Schema initialized/migrated.');
        console.log('Seeding database...');

        // Clear existing data
        db.run('DELETE FROM categories');
        db.run('DELETE FROM menu_items');

        // Insert Categories
        const catStmt = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
        INITIAL_DATA.categories.forEach(c => {
            catStmt.run(c.id, c.name, c.description || '');
        });
        catStmt.finalize();

        // Insert Items
        const itemStmt = db.prepare('INSERT INTO menu_items (id, categoryId, name, description, price, image, isVegetarian, isVegan, isSpicy, spiceLevel, allergens, isPopular) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        INITIAL_DATA.menuItems.forEach(i => {
            itemStmt.run(
                i.id,
                i.categoryId,
                i.name,
                i.description,
                i.price,
                i.image || '',
                i.isVegetarian ? 1 : 0,
                i.isVegan ? 1 : 0,
                i.isSpicy ? 1 : 0,
                i.spiceLevel || 0,
                JSON.stringify(i.allergens || []),
                i.isPopular ? 1 : 0
            );
        });
        itemStmt.finalize();

        console.log('Seeding complete.');
        db.close();
    });
});


