const Database = require("better-sqlite3");

const db = new Database("avroom.db");

db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS equipment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    total_units INTEGER NOT NULL,
    daily_late_fee REAL DEFAULT 0,
    deposit_amount REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_type_id INTEGER NOT NULL,
    unit_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'available',
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id)
);

CREATE TABLE IF NOT EXISTS borrowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    email TEXT
);

CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    borrower_id INTEGER NOT NULL,
    checkout_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,
    deposit_collected REAL DEFAULT 0,
    late_fee_charged REAL DEFAULT 0,
    deposit_refunded REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id)
);

CREATE TABLE IF NOT EXISTS loan_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    from_borrower_id INTEGER NOT NULL,
    to_borrower_id INTEGER NOT NULL,
    transferred_at TEXT NOT NULL,
    FOREIGN KEY (loan_id) REFERENCES loans(id),
    FOREIGN KEY (from_borrower_id) REFERENCES borrowers(id),
    FOREIGN KEY (to_borrower_id) REFERENCES borrowers(id)
);
`);

module.exports = db;