-- Military Asset Management System (MAMS) Database Schema
-- Standard SQL Compatible (SQLite & PostgreSQL)

PRAGMA foreign_keys = ON;

-- Bases / Installations
CREATE TABLE IF NOT EXISTS bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    commander_name TEXT,
    contact_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Equipment / Asset Types Categorization
CREATE TABLE IF NOT EXISTS equipment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Weapons', 'Vehicles', 'Ammunition', 'Communications', 'Medical & Field Gear')),
    unit TEXT NOT NULL DEFAULT 'units',
    description TEXT,
    unit_cost_estimate REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users with Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')),
    military_rank TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL
);

-- Baseline / Opening Inventory per Base and Equipment Type
CREATE TABLE IF NOT EXISTS base_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    initial_quantity INTEGER NOT NULL DEFAULT 0 CHECK(initial_quantity >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE CASCADE,
    UNIQUE(base_id, equipment_type_id)
);

-- Purchases / Procurement Transactions
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_cost REAL NOT NULL CHECK(unit_cost >= 0),
    total_cost REAL NOT NULL CHECK(total_cost >= 0),
    supplier TEXT NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    purchase_date TEXT NOT NULL, -- YYYY-MM-DD
    recorded_by_user_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE RESTRICT,
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Asset Transfers Between Bases
CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT UNIQUE NOT NULL,
    origin_base_id INTEGER NOT NULL,
    destination_base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    transfer_date TEXT NOT NULL, -- YYYY-MM-DD
    reason TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'STANDARD' CHECK(priority IN ('ROUTINE', 'STANDARD', 'URGENT', 'EMERGENCY')),
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'IN_TRANSIT', 'CANCELLED')),
    initiated_by_user_id INTEGER,
    approved_by_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (origin_base_id) REFERENCES bases(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_base_id) REFERENCES bases(id) ON DELETE RESTRICT,
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (initiated_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CHECK(origin_base_id <> destination_base_id)
);

-- Personnel Asset Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    personnel_name TEXT NOT NULL,
    military_id TEXT NOT NULL,
    rank TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    assigned_date TEXT NOT NULL, -- YYYY-MM-DD
    expected_return_date TEXT,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED', 'RETURNED')),
    assigned_by_user_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE RESTRICT,
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Asset Expenditures (Used in Combat, Training, or Decommissioned)
CREATE TABLE IF NOT EXISTS expenditures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    expenditure_type TEXT NOT NULL CHECK(expenditure_type IN ('TRAINING_EXERCISE', 'COMBAT_OPERATION', 'DECOMMISSIONED_DAMAGED', 'EXPIRED_CONSUMABLE', 'ROUTINE_EXPENDITURE')),
    date TEXT NOT NULL, -- YYYY-MM-DD
    mission_reference TEXT NOT NULL,
    approved_by_user_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE RESTRICT,
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Audit Logs for Complete Accountability and Non-repudiation
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    base_id INTEGER,
    details TEXT,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL
);

-- Indexes for high-speed queries on date ranges, bases, and equipment types
CREATE INDEX IF NOT EXISTS idx_purchases_base_date ON purchases(base_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_equipment ON purchases(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_transfers_origin_date ON transfers(origin_base_id, transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfers_dest_date ON transfers(destination_base_id, transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfers_equipment ON transfers(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_assignments_base ON assignments(base_id, status);
CREATE INDEX IF NOT EXISTS idx_expenditures_base_date ON expenditures(base_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
