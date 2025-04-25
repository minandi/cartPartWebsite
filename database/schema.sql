-- Database Schema for Car Parts Inventory System

-- Vehicles Table: Stores all vehicles in inventory
CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    vin TEXT UNIQUE NOT NULL,
    purchase_date TEXT NOT NULL,  -- SQLite doesn't have a specific DATE type, uses TEXT
    purchase_price REAL NOT NULL,
    damage_location TEXT NOT NULL, -- e.g., 'Front Left', 'Rear Right'
    status TEXT NOT NULL DEFAULT 'dismantling',  -- 'dismantling', 'active', 'sold_out'
    date_added TEXT DEFAULT CURRENT_TIMESTAMP,
    total_revenue REAL DEFAULT 0,
    notes TEXT
);

-- Categories Table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Parts Table (modified)
CREATE TABLE parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,  -- Direct link to category instead of subcategory
    name TEXT NOT NULL,
    location TEXT NOT NULL,        -- 'Front Left', 'Rear', etc.
    condition TEXT DEFAULT 'Good',
    price REAL NOT NULL,
    status TEXT DEFAULT 'available',
    date_listed TEXT DEFAULT CURRENT_TIMESTAMP,
    date_sold TEXT,
    sale_price REAL,
    notes TEXT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- Sales Table: Records of part sales
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_id INTEGER NOT NULL UNIQUE,  -- Each part can only be sold once
    sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
    sale_price REAL NOT NULL,
    customer_info TEXT,
    payment_method TEXT,
    notes TEXT,
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