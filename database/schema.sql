-- Database Schema for Car Parts Inventory System

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    vin TEXT UNIQUE NOT NULL,
    purchase_date TEXT NOT NULL,
    purchase_price REAL NOT NULL,
    damage_location TEXT NOT NULL,
    status TEXT DEFAULT 'dismantling',
    date_added TEXT DEFAULT CURRENT_TIMESTAMP,
    total_revenue REAL DEFAULT 0,
    notes TEXT
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Parts Table
CREATE TABLE IF NOT EXISTS parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    condition TEXT DEFAULT 'Good',
    price REAL NOT NULL,
    status TEXT DEFAULT 'available',
    date_listed TEXT DEFAULT CURRENT_TIMESTAMP,
    date_sold TEXT,
    sale_price REAL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_id INTEGER NOT NULL UNIQUE,
    sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
    sale_price REAL NOT NULL,
    customer_info TEXT,
    payment_method TEXT,
    FOREIGN KEY (part_id) REFERENCES parts (id)
);

-- Insert initial categories
INSERT INTO categories (name) VALUES
('Body Parts'),
('Lighting & Electrical'),
('Engine'),
('Transmission & Drivetrain'),
('Interior'),
('Suspension & Steering'),
('Brakes'),
('Exhaust & Emission');
