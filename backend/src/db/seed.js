import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runSeed() {
  console.log('[Seed] Initializing database schema...');
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schemaSql);

  console.log('[Seed] Checking existing data...');
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log(`[Seed] Database already seeded (${userCount} users found). Resetting tables for clean state...`);
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM expenditures;
      DELETE FROM assignments;
      DELETE FROM transfers;
      DELETE FROM purchases;
      DELETE FROM base_inventory;
      DELETE FROM users;
      DELETE FROM equipment_types;
      DELETE FROM bases;
    `);
  }

  console.log('[Seed] Seeding military bases...');
  const insertBase = db.prepare(`
    INSERT INTO bases (name, code, location, commander_name, contact_email)
    VALUES (?, ?, ?, ?, ?)
  `);

  const bases = [
    ['Fort Liberty', 'BASE-LIBERTY', 'North Carolina, USA', 'Col. Marcus Vance', 'hq.liberty@vanguard.mil'],
    ['Camp Pendleton', 'BASE-PENDLETON', 'California, USA', 'Col. Sarah Jenkins', 'hq.pendleton@vanguard.mil'],
    ['Ramstein Air Base', 'BASE-RAMSTEIN', 'Rhineland-Palatinate, Germany', 'Col. David Hoffman', 'hq.ramstein@vanguard.mil'],
    ['Naval Station Norfolk', 'BASE-NORFOLK', 'Virginia, USA', 'Capt. Eleanor Sterling', 'hq.norfolk@vanguard.mil']
  ];

  for (const b of bases) {
    insertBase.run(...b);
  }

  console.log('[Seed] Seeding equipment catalog...');
  const insertEquipment = db.prepare(`
    INSERT INTO equipment_types (name, category, unit, description, unit_cost_estimate)
    VALUES (?, ?, ?, ?, ?)
  `);

  const equipment = [
    ['M4A1 Tactical Carbine', 'Weapons', 'units', '5.56mm select-fire tactical rifle with Picatinny optics mount', 1200.0],
    ['M240B Medium Machine Gun', 'Weapons', 'units', '7.62x51mm belt-fed sustained fire crew-served weapon', 6600.0],
    ['FGM-148 Javelin Anti-Tank Missile', 'Weapons', 'units', 'Man-portable fire-and-forget guided antitank missile system', 178000.0],
    ['M1A2 Abrams Main Battle Tank', 'Vehicles', 'units', 'Third-generation main battle tank with 120mm smoothbore gun', 8900000.0],
    ['M1151 HMMWV Up-Armored Utility Vehicle', 'Vehicles', 'units', 'Armored tactical multi-role light transport vehicle', 220000.0],
    ['Stryker Armored Infantry Carrier', 'Vehicles', 'units', 'Eight-wheeled armored combat vehicle with C4ISR suite', 4900000.0],
    ['5.56x45mm NATO Ball (Crates of 1,000)', 'Ammunition', 'crates', 'High-reliability M855A1 Enhanced Performance ammunition', 450.0],
    ['120mm Tank Gun APFSDS Rounds', 'Ammunition', 'rounds', 'Armor-piercing fin-stabilized discarding sabot kinetic rounds', 8500.0],
    ['AN/PRC-152 Handheld Tactical Radio', 'Communications', 'units', 'Type 1 secure multi-band line-of-sight and SATCOM radio', 6500.0],
    ['Harris Falcon III Tactical Wideband Station', 'Communications', 'units', 'Multi-channel vehicular and base station communication terminal', 24000.0],
    ['Tactical Combat Casualty Care (TCCC) Kit', 'Medical & Field Gear', 'kits', 'Individual soldier IFAK medical kit with tourniquets and hemostatics', 380.0],
    ['AN/PVS-31A Dual Night Vision Goggles', 'Medical & Field Gear', 'units', 'High-resolution binocular night vision system with white phosphor', 12500.0]
  ];

  for (const eq of equipment) {
    insertEquipment.run(...eq);
  }

  console.log('[Seed] Seeding users with hashed passwords and RBAC roles...');
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@1234', salt);
  const commanderHash = bcrypt.hashSync('Commander@1234', salt);
  const logisticsHash = bcrypt.hashSync('Logistics@1234', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (base_id, username, email, password_hash, full_name, role, military_rank)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    [null, 'admin', 'admin@vanguard.mil', adminHash, 'Gen. Arthur Kane', 'ADMIN', 'General'],
    [1, 'commander_liberty', 'commander.liberty@vanguard.mil', commanderHash, 'Col. Marcus Vance', 'BASE_COMMANDER', 'Colonel'],
    [2, 'commander_pendleton', 'commander.pendleton@vanguard.mil', commanderHash, 'Col. Sarah Jenkins', 'BASE_COMMANDER', 'Colonel'],
    [1, 'logistics_liberty', 'logistics.liberty@vanguard.mil', logisticsHash, 'Capt. Ray Miller', 'LOGISTICS_OFFICER', 'Captain'],
    [3, 'logistics_ramstein', 'logistics.ramstein@vanguard.mil', logisticsHash, 'Maj. Elena Rostova', 'LOGISTICS_OFFICER', 'Major']
  ];

  for (const u of users) {
    insertUser.run(...u);
  }

  console.log('[Seed] Seeding baseline / opening inventory...');
  const insertInventory = db.prepare(`
    INSERT INTO base_inventory (base_id, equipment_type_id, initial_quantity)
    VALUES (?, ?, ?)
  `);

  // Baseline stocks across 4 bases for 12 equipment types
  const inventorySetup = [
    // Fort Liberty (Base 1)
    [1, 1, 450],  // M4A1
    [1, 2, 45],   // M240B
    [1, 3, 20],   // Javelin
    [1, 4, 14],   // Abrams
    [1, 5, 60],   // HMMWV
    [1, 6, 25],   // Stryker
    [1, 7, 800],  // 5.56mm Crates
    [1, 8, 120],  // 120mm Rounds
    [1, 9, 150],  // PRC-152
    [1, 10, 30],  // Falcon III
    [1, 11, 500], // TCCC Kits
    [1, 12, 180], // NVGs

    // Camp Pendleton (Base 2)
    [2, 1, 380],
    [2, 2, 40],
    [2, 3, 16],
    [2, 4, 10],
    [2, 5, 50],
    [2, 6, 20],
    [2, 7, 650],
    [2, 8, 90],
    [2, 9, 130],
    [2, 10, 25],
    [2, 11, 420],
    [2, 12, 140],

    // Ramstein Air Base (Base 3)
    [3, 1, 280],
    [3, 2, 25],
    [3, 3, 12],
    [3, 4, 6],
    [3, 5, 40],
    [3, 6, 15],
    [3, 7, 500],
    [3, 8, 50],
    [3, 9, 110],
    [3, 10, 35],
    [3, 11, 300],
    [3, 12, 100],

    // Naval Station Norfolk (Base 4)
    [4, 1, 220],
    [4, 2, 20],
    [4, 3, 10],
    [4, 4, 4],
    [4, 5, 30],
    [4, 6, 10],
    [4, 7, 400],
    [4, 8, 40],
    [4, 9, 90],
    [4, 10, 20],
    [4, 11, 250],
    [4, 12, 85]
  ];

  for (const inv of inventorySetup) {
    insertInventory.run(...inv);
  }

  console.log('[Seed] Seeding sample purchases...');
  const insertPurchase = db.prepare(`
    INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, total_cost, supplier, order_number, purchase_date, recorded_by_user_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const purchases = [
    [1, 1, 80, 1200.0, 96000.0, 'Colt Defense LLC', 'PO-2026-0101', '2026-09-02', 4, 'Annual replenishment batch for 82nd Airborne Division'],
    [1, 7, 250, 450.0, 112500.0, 'Olin Winchester Ammunition', 'PO-2026-0102', '2026-09-05', 4, 'Target ammunition crate allocation for live-fire training'],
    [1, 9, 30, 6500.0, 195000.0, 'L3Harris Technologies', 'PO-2026-0103', '2026-09-10', 4, 'Tactical radios for newly deployed reconnaissance squadron'],
    [2, 5, 8, 220000.0, 1760000.0, 'AM General Defense', 'PO-2026-0201', '2026-09-04', 1, 'Up-armored tactical transport upgrade package'],
    [2, 11, 150, 380.0, 57000.0, 'North American Rescue', 'PO-2026-0202', '2026-09-12', 1, 'Field medical triage replenishment'],
    [3, 3, 6, 178000.0, 1068000.0, 'Raytheon / Lockheed Martin Javelin JV', 'PO-2026-0301', '2026-09-08', 5, 'Rapid deployment anti-armor munitions for European command'],
    [3, 12, 40, 12500.0, 500000.0, 'L3Harris Technologies', 'PO-2026-0302', '2026-09-15', 5, 'Gen 3 white phosphor binocular night vision system deliveries'],
    [4, 10, 10, 24000.0, 240000.0, 'Harris Tactical Systems', 'PO-2026-0401', '2026-09-18', 1, 'Naval expeditionary wideband communication upgrade']
  ];

  for (const p of purchases) {
    insertPurchase.run(...p);
  }

  console.log('[Seed] Seeding sample inter-base transfers...');
  const insertTransfer = db.prepare(`
    INSERT INTO transfers (tracking_number, origin_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, reason, priority, status, initiated_by_user_id, approved_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transfers = [
    ['TRF-2026-8001', 1, 2, 1, 30, '2026-09-06', 'Pacific joint readiness exercise reallocation', 'STANDARD', 'COMPLETED', 4, 2],
    ['TRF-2026-8002', 1, 3, 3, 4, '2026-09-11', 'NATO deterrent forward prepositioning', 'URGENT', 'COMPLETED', 4, 1],
    ['TRF-2026-8003', 2, 4, 9, 15, '2026-09-14', 'Amphibious task force comms synchronization', 'STANDARD', 'COMPLETED', 1, 1],
    ['TRF-2026-8004', 3, 1, 7, 50, '2026-09-19', 'Returning surplus training ammunition to central depot', 'ROUTINE', 'COMPLETED', 5, 2],
    ['TRF-2026-8005', 1, 4, 5, 4, '2026-09-22', 'Base perimeter security convoy reinforcement', 'URGENT', 'IN_TRANSIT', 4, 1]
  ];

  for (const t of transfers) {
    insertTransfer.run(...t);
  }

  console.log('[Seed] Seeding personnel assignments...');
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (base_id, equipment_type_id, personnel_name, military_id, rank, unit, quantity, assigned_date, expected_return_date, return_date, status, assigned_by_user_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const assignments = [
    [1, 1, 'Sgt. John Ramirez', 'US-7782109', 'Sergeant', 'Alpha Co, 1st BCT', 1, '2026-09-03', '2026-10-03', null, 'ASSIGNED', 2, 'Assigned for operational deployment patrol'],
    [1, 1, 'Cpl. Emily Hayes', 'US-8841203', 'Corporal', 'Bravo Co, 1st BCT', 1, '2026-09-03', '2026-09-20', '2026-09-20', 'RETURNED', 2, 'Returned in excellent condition after field mission'],
    [1, 9, 'SSgt. Carlos Rodriguez', 'US-6619024', 'Staff Sergeant', 'Signal Detachment 4', 2, '2026-09-07', '2026-10-15', null, 'ASSIGNED', 2, 'Comms section relay establishment'],
    [1, 12, '1st Lt. Michael Stone', 'US-5519283', 'First Lieutenant', 'Recon Platoon 82nd', 4, '2026-09-12', '2026-10-01', null, 'ASSIGNED', 2, 'Night recon qualification patrol gear'],
    [2, 1, 'Sgt. Tyler Brooks', 'US-9912034', 'Sergeant', 'Marine Expeditionary Unit 1', 1, '2026-09-08', '2026-10-08', null, 'ASSIGNED', 3, 'Assigned standard service weapon'],
    [2, 5, 'SSgt. Amanda Lewis', 'US-3321948', 'Staff Sergeant', 'Logistics Support Bn', 1, '2026-09-14', '2026-09-28', null, 'ASSIGNED', 3, 'Logistics transport convoy team leader vehicle'],
    [3, 11, 'Capt. Henrik Weber', 'US-4410291', 'Captain', 'Forward Surgical Team', 10, '2026-09-09', '2026-10-09', null, 'ASSIGNED', 1, 'Rapid medical response station equipment']
  ];

  for (const a of assignments) {
    insertAssignment.run(...a);
  }

  console.log('[Seed] Seeding asset expenditures...');
  const insertExpenditure = db.prepare(`
    INSERT INTO expenditures (base_id, equipment_type_id, quantity, expenditure_type, date, mission_reference, approved_by_user_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const expenditures = [
    [1, 7, 45, 'TRAINING_EXERCISE', '2026-09-07', 'EX-LIBERTY-THUNDER-26', 2, 'Live-fire range qualification for 150 infantry soldiers'],
    [1, 8, 8, 'TRAINING_EXERCISE', '2026-09-13', 'EX-IRON-FORGE', 2, 'Tank gunnery table VI live ammunition qualification'],
    [1, 11, 12, 'ROUTINE_EXPENDITURE', '2026-09-16', 'MED-ROUTINE-CONSUMPTION', 2, 'Bandages and burn dressing kits consumed during field casualty drills'],
    [2, 7, 35, 'TRAINING_EXERCISE', '2026-09-10', 'EX-PACIFIC-CREST', 3, 'Amphibious breach live-fire drill expenditure'],
    [3, 7, 20, 'TRAINING_EXERCISE', '2026-09-17', 'EX-EURO-ALLIANCE', 1, 'NATO joint combined arms live-fire exercise']
  ];

  for (const e of expenditures) {
    insertExpenditure.run(...e);
  }

  console.log('[Seed] Seeding audit log transactions...');
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (timestamp, user_id, user_name, user_role, action, entity_type, entity_id, base_id, details, ip_address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const audits = [
    ['2026-09-01 08:00:00', 1, 'Gen. Arthur Kane', 'ADMIN', 'SYSTEM_INIT', 'SYSTEM', 1, null, JSON.stringify({ action: 'Initial baseline system configuration deployed' }), '10.0.0.1', 'SUCCESS'],
    ['2026-09-02 09:15:22', 4, 'Capt. Ray Miller', 'LOGISTICS_OFFICER', 'PURCHASE_CREATED', 'PURCHASE', 1, 1, JSON.stringify({ order_number: 'PO-2026-0101', quantity: 80, item: 'M4A1 Tactical Carbine', total_cost: 96000.0 }), '192.168.1.42', 'SUCCESS'],
    ['2026-09-06 14:20:10', 4, 'Capt. Ray Miller', 'LOGISTICS_OFFICER', 'TRANSFER_INITIATED', 'TRANSFER', 1, 1, JSON.stringify({ tracking_number: 'TRF-2026-8001', qty: 30, from_base: 'Fort Liberty', to_base: 'Camp Pendleton' }), '192.168.1.42', 'SUCCESS'],
    ['2026-09-07 16:45:00', 2, 'Col. Marcus Vance', 'BASE_COMMANDER', 'EXPENDITURE_LOGGED', 'EXPENDITURE', 1, 1, JSON.stringify({ qty: 45, item: '5.56x45mm NATO Ball (Crates of 1,000)', mission: 'EX-LIBERTY-THUNDER-26' }), '192.168.1.10', 'SUCCESS'],
    ['2026-09-12 11:30:15', 2, 'Col. Marcus Vance', 'BASE_COMMANDER', 'ASSET_ASSIGNED', 'ASSIGNMENT', 4, 1, JSON.stringify({ personnel: '1st Lt. Michael Stone', qty: 4, item: 'AN/PVS-31A Dual Night Vision Goggles' }), '192.168.1.10', 'SUCCESS']
  ];

  for (const aud of audits) {
    insertAudit.run(...aud);
  }

  console.log('[Seed] Database initialization and seeding completed successfully!');
}

// If executed directly from command line: node src/db/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed();
}
