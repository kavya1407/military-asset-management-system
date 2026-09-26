-- Military Asset Management System (MAMS) Database Dump
-- Generated on: 2026-09-25T14:38:57.912Z
-- Engine: Relational SQL (SQLite / PostgreSQL ANSI Compatible)

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS bases;
CREATE TABLE bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    commander_name TEXT,
    contact_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS equipment_types;
CREATE TABLE equipment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Weapons', 'Vehicles', 'Ammunition', 'Communications', 'Medical & Field Gear')),
    unit TEXT NOT NULL DEFAULT 'units',
    description TEXT,
    unit_cost_estimate REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
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

DROP TABLE IF EXISTS base_inventory;
CREATE TABLE base_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    initial_quantity INTEGER NOT NULL DEFAULT 0 CHECK(initial_quantity >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE CASCADE,
    UNIQUE(base_id, equipment_type_id)
);

DROP TABLE IF EXISTS purchases;
CREATE TABLE purchases (
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

DROP TABLE IF EXISTS transfers;
CREATE TABLE transfers (
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

DROP TABLE IF EXISTS assignments;
CREATE TABLE assignments (
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

DROP TABLE IF EXISTS expenditures;
CREATE TABLE expenditures (
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

DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
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

-- Table Data: bases (4 records)
INSERT INTO bases (id, name, code, location, commander_name, contact_email, created_at) VALUES (1, 'Fort Liberty', 'BASE-LIBERTY', 'North Carolina, USA', 'Col. Marcus Vance', 'hq.liberty@vanguard.mil', '2026-09-25 14:38:30');
INSERT INTO bases (id, name, code, location, commander_name, contact_email, created_at) VALUES (2, 'Camp Pendleton', 'BASE-PENDLETON', 'California, USA', 'Col. Sarah Jenkins', 'hq.pendleton@vanguard.mil', '2026-09-25 14:38:30');
INSERT INTO bases (id, name, code, location, commander_name, contact_email, created_at) VALUES (3, 'Ramstein Air Base', 'BASE-RAMSTEIN', 'Rhineland-Palatinate, Germany', 'Col. David Hoffman', 'hq.ramstein@vanguard.mil', '2026-09-25 14:38:30');
INSERT INTO bases (id, name, code, location, commander_name, contact_email, created_at) VALUES (4, 'Naval Station Norfolk', 'BASE-NORFOLK', 'Virginia, USA', 'Capt. Eleanor Sterling', 'hq.norfolk@vanguard.mil', '2026-09-25 14:38:30');

-- Table Data: equipment_types (12 records)
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (1, 'M4A1 Tactical Carbine', 'Weapons', 'units', '5.56mm select-fire tactical rifle with Picatinny optics mount', 1200, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (2, 'M240B Medium Machine Gun', 'Weapons', 'units', '7.62x51mm belt-fed sustained fire crew-served weapon', 6600, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (3, 'FGM-148 Javelin Anti-Tank Missile', 'Weapons', 'units', 'Man-portable fire-and-forget guided antitank missile system', 178000, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (4, 'M1A2 Abrams Main Battle Tank', 'Vehicles', 'units', 'Third-generation main battle tank with 120mm smoothbore gun', 8900000, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (5, 'M1151 HMMWV Up-Armored Utility Vehicle', 'Vehicles', 'units', 'Armored tactical multi-role light transport vehicle', 220000, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (6, 'Stryker Armored Infantry Carrier', 'Vehicles', 'units', 'Eight-wheeled armored combat vehicle with C4ISR suite', 4900000, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (7, '5.56x45mm NATO Ball (Crates of 1,000)', 'Ammunition', 'crates', 'High-reliability M855A1 Enhanced Performance ammunition', 450, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (8, '120mm Tank Gun APFSDS Rounds', 'Ammunition', 'rounds', 'Armor-piercing fin-stabilized discarding sabot kinetic rounds', 8500, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (9, 'AN/PRC-152 Handheld Tactical Radio', 'Communications', 'units', 'Type 1 secure multi-band line-of-sight and SATCOM radio', 6500, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (10, 'Harris Falcon III Tactical Wideband Station', 'Communications', 'units', 'Multi-channel vehicular and base station communication terminal', 24000, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (11, 'Tactical Combat Casualty Care (TCCC) Kit', 'Medical & Field Gear', 'kits', 'Individual soldier IFAK medical kit with tourniquets and hemostatics', 380, '2026-09-25 14:38:30');
INSERT INTO equipment_types (id, name, category, unit, description, unit_cost_estimate, created_at) VALUES (12, 'AN/PVS-31A Dual Night Vision Goggles', 'Medical & Field Gear', 'units', 'High-resolution binocular night vision system with white phosphor', 12500, '2026-09-25 14:38:30');

-- Table Data: users (5 records)
INSERT INTO users (id, base_id, username, email, password_hash, full_name, role, military_rank, created_at) VALUES (1, NULL, 'admin', 'admin@vanguard.mil', '$2b$10$T0TTZ.pwdK955W72.1f1heSwxfsk72XOUMaviNb6b1eKtSUKD6SOK', 'Gen. Arthur Kane', 'ADMIN', 'General', '2026-09-25 14:38:31');
INSERT INTO users (id, base_id, username, email, password_hash, full_name, role, military_rank, created_at) VALUES (2, 1, 'commander_liberty', 'commander.liberty@vanguard.mil', '$2b$10$T0TTZ.pwdK955W72.1f1hetl3Kjy9goXXW8bUw3PZgvOsknKSeBNq', 'Col. Marcus Vance', 'BASE_COMMANDER', 'Colonel', '2026-09-25 14:38:31');
INSERT INTO users (id, base_id, username, email, password_hash, full_name, role, military_rank, created_at) VALUES (3, 2, 'commander_pendleton', 'commander.pendleton@vanguard.mil', '$2b$10$T0TTZ.pwdK955W72.1f1hetl3Kjy9goXXW8bUw3PZgvOsknKSeBNq', 'Col. Sarah Jenkins', 'BASE_COMMANDER', 'Colonel', '2026-09-25 14:38:31');
INSERT INTO users (id, base_id, username, email, password_hash, full_name, role, military_rank, created_at) VALUES (4, 1, 'logistics_liberty', 'logistics.liberty@vanguard.mil', '$2b$10$T0TTZ.pwdK955W72.1f1heh2v5RYPBOc8q/F4OfMGMQLosVv0elbS', 'Capt. Ray Miller', 'LOGISTICS_OFFICER', 'Captain', '2026-09-25 14:38:31');
INSERT INTO users (id, base_id, username, email, password_hash, full_name, role, military_rank, created_at) VALUES (5, 3, 'logistics_ramstein', 'logistics.ramstein@vanguard.mil', '$2b$10$T0TTZ.pwdK955W72.1f1heh2v5RYPBOc8q/F4OfMGMQLosVv0elbS', 'Maj. Elena Rostova', 'LOGISTICS_OFFICER', 'Major', '2026-09-25 14:38:31');

-- Table Data: base_inventory (48 records)
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (1, 1, 1, 450, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (2, 1, 2, 45, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (3, 1, 3, 20, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (4, 1, 4, 14, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (5, 1, 5, 60, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (6, 1, 6, 25, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (7, 1, 7, 800, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (8, 1, 8, 120, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (9, 1, 9, 150, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (10, 1, 10, 30, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (11, 1, 11, 500, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (12, 1, 12, 180, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (13, 2, 1, 380, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (14, 2, 2, 40, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (15, 2, 3, 16, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (16, 2, 4, 10, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (17, 2, 5, 50, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (18, 2, 6, 20, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (19, 2, 7, 650, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (20, 2, 8, 90, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (21, 2, 9, 130, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (22, 2, 10, 25, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (23, 2, 11, 420, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (24, 2, 12, 140, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (25, 3, 1, 280, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (26, 3, 2, 25, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (27, 3, 3, 12, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (28, 3, 4, 6, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (29, 3, 5, 40, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (30, 3, 6, 15, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (31, 3, 7, 500, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (32, 3, 8, 50, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (33, 3, 9, 110, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (34, 3, 10, 35, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (35, 3, 11, 300, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (36, 3, 12, 100, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (37, 4, 1, 220, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (38, 4, 2, 20, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (39, 4, 3, 10, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (40, 4, 4, 4, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (41, 4, 5, 30, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (42, 4, 6, 10, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (43, 4, 7, 400, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (44, 4, 8, 40, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (45, 4, 9, 90, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (46, 4, 10, 20, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (47, 4, 11, 250, '2026-09-25 14:38:31');
INSERT INTO base_inventory (id, base_id, equipment_type_id, initial_quantity, created_at) VALUES (48, 4, 12, 85, '2026-09-25 14:38:31');

-- Table Data: purchases (8 records)
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes, created_at) VALUES (1, 1, 1, 80, 1200, 96000, 'Colt Defense LLC', 'PO-2026-0101', '2026-09-02', 4, 'Annual replenishment batch for 82nd Airborne Division', '2026-09-25 14:38:31');
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes, created_at) VALUES (2, 1, 7, 250, 450, 112500, 'Olin Winchester Ammunition', 'PO-2026-0102', '2026-09-05', 4, 'Target ammunition crate allocation for live-fire training', '2026-09-25 14:38:31');
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes, created_at) VALUES (3, 1, 9, 30, 6500, 195000, 'L3Harris Technologies', 'PO-2026-0103', '2026-09-10', 4, 'Tactical radios for newly deployed reconnaissance squadron', '2026-09-25 14:38:31');
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes, created_at) VALUES (4, 2, 5, 8, 220000, 1760000, 'AM General Defense', 'PO-2026-0201', '2026-09-04', 1, 'Up-armored tactical transport upgrade package', '2026-09-25 14:38:31');
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes, created_at) VALUES (5, 2, 11, 150, 380, 57000, 'North American Rescue', 'PO-2026-0202', '2026-09-12', 1, 'Field medical triage replenishment', '2026-09-25 14:38:31');
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes, created_at) VALUES (6, 3, 3, 6, 178000, 1068000, 'Raytheon / Lockheed Martin Javelin JV', 'PO-2026-0301', '2026-09-08', 5, 'Rapid deployment anti-armor munitions for European command', '2026-09-25 14:38:31');
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes, created_at) VALUES (7, 3, 12, 40, 12500, 500000, 'L3Harris Technologies', 'PO-2026-0302', '2026-09-15', 5, 'Gen 3 white phosphor binocular night vision system deliveries', '2026-09-25 14:38:31');
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes, created_at) VALUES (8, 4, 10, 10, 24000, 240000, 'Harris Tactical Systems', 'PO-2026-0401', '2026-09-18', 1, 'Naval expeditionary wideband communication upgrade', '2026-09-25 14:38:31');

-- Table Data: transfers (5 records)
INSERT INTO transfers (id, tracking_number, origin_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, reason, priority, status, initiated_by_user_id, approved_by_user_id, created_at) VALUES (1, 'TRF-2026-8001', 1, 2, 1, 30, '2026-09-06', 'Pacific joint readiness exercise reallocation', 'STANDARD', 'COMPLETED', 4, 2, '2026-09-25 14:38:31');
INSERT INTO transfers (id, tracking_number, origin_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, reason, priority, status, initiated_by_user_id, approved_by_user_id, created_at) VALUES (2, 'TRF-2026-8002', 1, 3, 3, 4, '2026-09-11', 'NATO deterrent forward prepositioning', 'URGENT', 'COMPLETED', 4, 1, '2026-09-25 14:38:31');
INSERT INTO transfers (id, tracking_number, origin_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, reason, priority, status, initiated_by_user_id, approved_by_user_id, created_at) VALUES (3, 'TRF-2026-8003', 2, 4, 9, 15, '2026-09-14', 'Amphibious task force comms synchronization', 'STANDARD', 'COMPLETED', 1, 1, '2026-09-25 14:38:31');
INSERT INTO transfers (id, tracking_number, origin_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, reason, priority, status, initiated_by_user_id, approved_by_user_id, created_at) VALUES (4, 'TRF-2026-8004', 3, 1, 7, 50, '2026-09-19', 'Returning surplus training ammunition to central depot', 'ROUTINE', 'COMPLETED', 5, 2, '2026-09-25 14:38:31');
INSERT INTO transfers (id, tracking_number, origin_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, reason, priority, status, initiated_by_user_id, approved_by_user_id, created_at) VALUES (5, 'TRF-2026-8005', 1, 4, 5, 4, '2026-09-22', 'Base perimeter security convoy reinforcement', 'URGENT', 'IN_TRANSIT', 4, 1, '2026-09-25 14:38:31');

-- Table Data: assignments (7 records)
INSERT INTO assignments (id, base_id, equipment_type_id, personnel_name, military_id, rank, unit, quantity, assigned_date, expected_return_date, return_date, status, assigned_by_user_id, notes, created_at) VALUES (1, 1, 1, 'Sgt. John Ramirez', 'US-7782109', 'Sergeant', 'Alpha Co, 1st BCT', 1, '2026-09-03', '2026-10-03', NULL, 'ASSIGNED', 2, 'Assigned for operational deployment patrol', '2026-09-25 14:38:31');
INSERT INTO assignments (id, base_id, equipment_type_id, personnel_name, military_id, rank, unit, quantity, assigned_date, expected_return_date, return_date, status, assigned_by_user_id, notes, created_at) VALUES (2, 1, 1, 'Cpl. Emily Hayes', 'US-8841203', 'Corporal', 'Bravo Co, 1st BCT', 1, '2026-09-03', '2026-09-20', '2026-09-20', 'RETURNED', 2, 'Returned in excellent condition after field mission', '2026-09-25 14:38:31');
INSERT INTO assignments (id, base_id, equipment_type_id, personnel_name, military_id, rank, unit, quantity, assigned_date, expected_return_date, return_date, status, assigned_by_user_id, notes, created_at) VALUES (3, 1, 9, 'SSgt. Carlos Rodriguez', 'US-6619024', 'Staff Sergeant', 'Signal Detachment 4', 2, '2026-09-07', '2026-10-15', NULL, 'ASSIGNED', 2, 'Comms section relay establishment', '2026-09-25 14:38:31');
INSERT INTO assignments (id, base_id, equipment_type_id, personnel_name, military_id, rank, unit, quantity, assigned_date, expected_return_date, return_date, status, assigned_by_user_id, notes, created_at) VALUES (4, 1, 12, '1st Lt. Michael Stone', 'US-5519283', 'First Lieutenant', 'Recon Platoon 82nd', 4, '2026-09-12', '2026-10-01', NULL, 'ASSIGNED', 2, 'Night recon qualification patrol gear', '2026-09-25 14:38:31');
INSERT INTO assignments (id, base_id, equipment_type_id, personnel_name, military_id, rank, unit, quantity, assigned_date, expected_return_date, return_date, status, assigned_by_user_id, notes, created_at) VALUES (5, 2, 1, 'Sgt. Tyler Brooks', 'US-9912034', 'Sergeant', 'Marine Expeditionary Unit 1', 1, '2026-09-08', '2026-10-08', NULL, 'ASSIGNED', 3, 'Assigned standard service weapon', '2026-09-25 14:38:31');
INSERT INTO assignments (id, base_id, equipment_type_id, personnel_name, military_id, rank, unit, quantity, assigned_date, expected_return_date, return_date, status, assigned_by_user_id, notes, created_at) VALUES (6, 2, 5, 'SSgt. Amanda Lewis', 'US-3321948', 'Staff Sergeant', 'Logistics Support Bn', 1, '2026-09-14', '2026-09-28', NULL, 'ASSIGNED', 3, 'Logistics transport convoy team leader vehicle', '2026-09-25 14:38:31');
INSERT INTO assignments (id, base_id, equipment_type_id, personnel_name, military_id, rank, unit, quantity, assigned_date, expected_return_date, return_date, status, assigned_by_user_id, notes, created_at) VALUES (7, 3, 11, 'Capt. Henrik Weber', 'US-4410291', 'Captain', 'Forward Surgical Team', 10, '2026-09-09', '2026-10-09', NULL, 'ASSIGNED', 1, 'Rapid medical response station equipment', '2026-09-25 14:38:31');

-- Table Data: expenditures (5 records)
INSERT INTO expenditures (id, base_id, equipment_type_id, quantity, expenditure_type, date, mission_reference, approved_by_user_id, notes, created_at) VALUES (1, 1, 7, 45, 'TRAINING_EXERCISE', '2026-09-07', 'EX-LIBERTY-THUNDER-26', 2, 'Live-fire range qualification for 150 infantry soldiers', '2026-09-25 14:38:31');
INSERT INTO expenditures (id, base_id, equipment_type_id, quantity, expenditure_type, date, mission_reference, approved_by_user_id, notes, created_at) VALUES (2, 1, 8, 8, 'TRAINING_EXERCISE', '2026-09-13', 'EX-IRON-FORGE', 2, 'Tank gunnery table VI live ammunition qualification', '2026-09-25 14:38:31');
INSERT INTO expenditures (id, base_id, equipment_type_id, quantity, expenditure_type, date, mission_reference, approved_by_user_id, notes, created_at) VALUES (3, 1, 11, 12, 'ROUTINE_EXPENDITURE', '2026-09-16', 'MED-ROUTINE-CONSUMPTION', 2, 'Bandages and burn dressing kits consumed during field casualty drills', '2026-09-25 14:38:31');
INSERT INTO expenditures (id, base_id, equipment_type_id, quantity, expenditure_type, date, mission_reference, approved_by_user_id, notes, created_at) VALUES (4, 2, 7, 35, 'TRAINING_EXERCISE', '2026-09-10', 'EX-PACIFIC-CREST', 3, 'Amphibious breach live-fire drill expenditure', '2026-09-25 14:38:31');
INSERT INTO expenditures (id, base_id, equipment_type_id, quantity, expenditure_type, date, mission_reference, approved_by_user_id, notes, created_at) VALUES (5, 3, 7, 20, 'TRAINING_EXERCISE', '2026-09-17', 'EX-EURO-ALLIANCE', 1, 'NATO joint combined arms live-fire exercise', '2026-09-25 14:38:31');

-- Table Data: audit_logs (5 records)
INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity_type, entity_id, base_id, details, ip_address, status) VALUES (1, '2026-09-01 08:00:00', 1, 'Gen. Arthur Kane', 'ADMIN', 'SYSTEM_INIT', 'SYSTEM', 1, NULL, '{"action":"Initial baseline system configuration deployed"}', '10.0.0.1', 'SUCCESS');
INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity_type, entity_id, base_id, details, ip_address, status) VALUES (2, '2026-09-02 09:15:22', 4, 'Capt. Ray Miller', 'LOGISTICS_OFFICER', 'PURCHASE_CREATED', 'PURCHASE', 1, 1, '{"order_number":"PO-2026-0101","quantity":80,"item":"M4A1 Tactical Carbine","total_cost":96000}', '192.168.1.42', 'SUCCESS');
INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity_type, entity_id, base_id, details, ip_address, status) VALUES (3, '2026-09-06 14:20:10', 4, 'Capt. Ray Miller', 'LOGISTICS_OFFICER', 'TRANSFER_INITIATED', 'TRANSFER', 1, 1, '{"tracking_number":"TRF-2026-8001","qty":30,"from_base":"Fort Liberty","to_base":"Camp Pendleton"}', '192.168.1.42', 'SUCCESS');
INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity_type, entity_id, base_id, details, ip_address, status) VALUES (4, '2026-09-07 16:45:00', 2, 'Col. Marcus Vance', 'BASE_COMMANDER', 'EXPENDITURE_LOGGED', 'EXPENDITURE', 1, 1, '{"qty":45,"item":"5.56x45mm NATO Ball (Crates of 1,000)","mission":"EX-LIBERTY-THUNDER-26"}', '192.168.1.10', 'SUCCESS');
INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity_type, entity_id, base_id, details, ip_address, status) VALUES (5, '2026-09-12 11:30:15', 2, 'Col. Marcus Vance', 'BASE_COMMANDER', 'ASSET_ASSIGNED', 'ASSIGNMENT', 4, 1, '{"personnel":"1st Lt. Michael Stone","qty":4,"item":"AN/PVS-31A Dual Night Vision Goggles"}', '192.168.1.10', 'SUCCESS');

-- Indexes
CREATE INDEX idx_purchases_base_date ON purchases(base_id, purchase_date);
CREATE INDEX idx_purchases_equipment ON purchases(equipment_type_id);
CREATE INDEX idx_transfers_origin_date ON transfers(origin_base_id, transfer_date);
CREATE INDEX idx_transfers_dest_date ON transfers(destination_base_id, transfer_date);
CREATE INDEX idx_transfers_equipment ON transfers(equipment_type_id);
CREATE INDEX idx_assignments_base ON assignments(base_id, status);
CREATE INDEX idx_expenditures_base_date ON expenditures(base_id, date);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

PRAGMA foreign_keys = ON;
