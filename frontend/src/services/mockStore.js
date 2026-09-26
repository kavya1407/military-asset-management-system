// Resilient Client-Side Store (Fallback for static hosting when backend is not yet connected)

const initialBases = [
  { id: 1, name: 'Fort Liberty', code: 'BASE-LIBERTY', location: 'North Carolina, USA', commander_name: 'Col. Marcus Vance', contact_email: 'hq.liberty@vanguard.mil' },
  { id: 2, name: 'Camp Pendleton', code: 'BASE-PENDLETON', location: 'California, USA', commander_name: 'Col. Sarah Jenkins', contact_email: 'hq.pendleton@vanguard.mil' },
  { id: 3, name: 'Ramstein Air Base', code: 'BASE-RAMSTEIN', location: 'Rhineland-Palatinate, Germany', commander_name: 'Col. David Hoffman', contact_email: 'hq.ramstein@vanguard.mil' },
  { id: 4, name: 'Naval Station Norfolk', code: 'BASE-NORFOLK', location: 'Virginia, USA', commander_name: 'Capt. Eleanor Sterling', contact_email: 'hq.norfolk@vanguard.mil' }
];

const initialEquipment = [
  { id: 1, name: 'M4A1 Tactical Carbine', category: 'Weapons', unit: 'units', description: '5.56mm select-fire tactical rifle', unit_cost_estimate: 1200.0 },
  { id: 2, name: 'M240B Medium Machine Gun', category: 'Weapons', unit: 'units', description: '7.62x51mm belt-fed crew weapon', unit_cost_estimate: 6600.0 },
  { id: 3, name: 'FGM-148 Javelin Anti-Tank Missile', category: 'Weapons', unit: 'units', description: 'Man-portable fire-and-forget missile system', unit_cost_estimate: 178000.0 },
  { id: 4, name: 'M1A2 Abrams Main Battle Tank', category: 'Vehicles', unit: 'units', description: 'Third-generation main battle tank with 120mm gun', unit_cost_estimate: 8900000.0 },
  { id: 5, name: 'M1151 HMMWV Up-Armored Utility Vehicle', category: 'Vehicles', unit: 'units', description: 'Armored multi-role light transport vehicle', unit_cost_estimate: 220000.0 },
  { id: 6, name: 'Stryker Armored Infantry Carrier', category: 'Vehicles', unit: 'units', description: 'Eight-wheeled armored combat vehicle', unit_cost_estimate: 4900000.0 },
  { id: 7, name: '5.56x45mm NATO Ball (Crates of 1,000)', category: 'Ammunition', unit: 'crates', description: 'M855A1 Enhanced Performance ammunition', unit_cost_estimate: 450.0 },
  { id: 8, name: '120mm Tank Gun APFSDS Rounds', category: 'Ammunition', unit: 'rounds', description: 'Armor-piercing kinetic rounds', unit_cost_estimate: 8500.0 },
  { id: 9, name: 'AN/PRC-152 Handheld Tactical Radio', category: 'Communications', unit: 'units', description: 'Secure multi-band line-of-sight and SATCOM radio', unit_cost_estimate: 6500.0 },
  { id: 10, name: 'Harris Falcon III Tactical Wideband Station', category: 'Communications', unit: 'units', description: 'Multi-channel vehicular and base station terminal', unit_cost_estimate: 24000.0 },
  { id: 11, name: 'Tactical Combat Casualty Care (TCCC) Kit', category: 'Medical & Field Gear', unit: 'kits', description: 'IFAK medical kit with tourniquets and hemostatics', unit_cost_estimate: 380.0 },
  { id: 12, name: 'AN/PVS-31A Dual Night Vision Goggles', category: 'Medical & Field Gear', unit: 'units', description: 'Gen 3 white phosphor binocular night vision system', unit_cost_estimate: 12500.0 }
];

const initialUsers = [
  { id: 1, username: 'admin', password: 'Admin@1234', full_name: 'Gen. Arthur Kane', military_rank: 'General', role: 'ADMIN', base_id: null, base_name: 'Global Headquarters' },
  { id: 2, username: 'commander_liberty', password: 'Commander@1234', full_name: 'Col. Marcus Vance', military_rank: 'Colonel', role: 'BASE_COMMANDER', base_id: 1, base_name: 'Fort Liberty' },
  { id: 3, username: 'commander_pendleton', password: 'Commander@1234', full_name: 'Col. Sarah Jenkins', military_rank: 'Colonel', role: 'BASE_COMMANDER', base_id: 2, base_name: 'Camp Pendleton' },
  { id: 4, username: 'logistics_liberty', password: 'Logistics@1234', full_name: 'Capt. Ray Miller', military_rank: 'Captain', role: 'LOGISTICS_OFFICER', base_id: 1, base_name: 'Fort Liberty' },
  { id: 5, username: 'logistics_ramstein', password: 'Logistics@1234', full_name: 'Maj. Elena Rostova', military_rank: 'Major', role: 'LOGISTICS_OFFICER', base_id: 3, base_name: 'Ramstein Air Base' }
];

// In-memory state
let purchases = [
  { id: 1, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 1, equipment_name: 'M4A1 Tactical Carbine', equipment_category: 'Weapons', unit: 'units', quantity: 80, unit_cost: 1200, total_cost: 96000, supplier: 'Colt Defense LLC', order_number: 'PO-2026-0101', purchase_date: '2026-09-02', recorded_by_name: 'Capt. Ray Miller', recorded_by_rank: 'Captain' },
  { id: 2, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 7, equipment_name: '5.56x45mm NATO Ball (Crates of 1,000)', equipment_category: 'Ammunition', unit: 'crates', quantity: 250, unit_cost: 450, total_cost: 112500, supplier: 'Olin Winchester', order_number: 'PO-2026-0102', purchase_date: '2026-09-05', recorded_by_name: 'Capt. Ray Miller', recorded_by_rank: 'Captain' },
  { id: 3, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 9, equipment_name: 'AN/PRC-152 Handheld Tactical Radio', equipment_category: 'Communications', unit: 'units', quantity: 30, unit_cost: 6500, total_cost: 195000, supplier: 'L3Harris Technologies', order_number: 'PO-2026-0103', purchase_date: '2026-09-10', recorded_by_name: 'Capt. Ray Miller', recorded_by_rank: 'Captain' },
  { id: 4, base_id: 2, base_name: 'Camp Pendleton', equipment_type_id: 5, equipment_name: 'M1151 HMMWV Up-Armored Utility Vehicle', equipment_category: 'Vehicles', unit: 'units', quantity: 8, unit_cost: 220000, total_cost: 1760000, supplier: 'AM General Defense', order_number: 'PO-2026-0201', purchase_date: '2026-09-04', recorded_by_name: 'Gen. Arthur Kane', recorded_by_rank: 'General' },
  { id: 5, base_id: 2, base_name: 'Camp Pendleton', equipment_type_id: 11, equipment_name: 'Tactical Combat Casualty Care (TCCC) Kit', equipment_category: 'Medical & Field Gear', unit: 'kits', quantity: 150, unit_cost: 380, total_cost: 57000, supplier: 'North American Rescue', order_number: 'PO-2026-0202', purchase_date: '2026-09-12', recorded_by_name: 'Gen. Arthur Kane', recorded_by_rank: 'General' },
  { id: 6, base_id: 3, base_name: 'Ramstein Air Base', equipment_type_id: 3, equipment_name: 'FGM-148 Javelin Anti-Tank Missile', equipment_category: 'Weapons', unit: 'units', quantity: 6, unit_cost: 178000, total_cost: 1068000, supplier: 'Raytheon / Lockheed Martin', order_number: 'PO-2026-0301', purchase_date: '2026-09-08', recorded_by_name: 'Maj. Elena Rostova', recorded_by_rank: 'Major' },
  { id: 7, base_id: 3, base_name: 'Ramstein Air Base', equipment_type_id: 12, equipment_name: 'AN/PVS-31A Dual Night Vision Goggles', equipment_category: 'Medical & Field Gear', unit: 'units', quantity: 40, unit_cost: 12500, total_cost: 500000, supplier: 'L3Harris Technologies', order_number: 'PO-2026-0302', purchase_date: '2026-09-15', recorded_by_name: 'Maj. Elena Rostova', recorded_by_rank: 'Major' },
  { id: 8, base_id: 4, base_name: 'Naval Station Norfolk', equipment_type_id: 10, equipment_name: 'Harris Falcon III Tactical Wideband Station', equipment_category: 'Communications', unit: 'units', quantity: 10, unit_cost: 24000, total_cost: 240000, supplier: 'Harris Tactical Systems', order_number: 'PO-2026-0401', purchase_date: '2026-09-18', recorded_by_name: 'Gen. Arthur Kane', recorded_by_rank: 'General' }
];

let transfers = [
  { id: 1, tracking_number: 'TRF-2026-8001', origin_base_id: 1, origin_base_name: 'Fort Liberty', destination_base_id: 2, destination_base_name: 'Camp Pendleton', equipment_type_id: 1, equipment_name: 'M4A1 Tactical Carbine', equipment_category: 'Weapons', unit: 'units', quantity: 30, transfer_date: '2026-09-06', reason: 'Pacific joint readiness exercise reallocation', priority: 'STANDARD', status: 'COMPLETED' },
  { id: 2, tracking_number: 'TRF-2026-8002', origin_base_id: 1, origin_base_name: 'Fort Liberty', destination_base_id: 3, destination_base_name: 'Ramstein Air Base', equipment_type_id: 3, equipment_name: 'FGM-148 Javelin Anti-Tank Missile', equipment_category: 'Weapons', unit: 'units', quantity: 4, transfer_date: '2026-09-11', reason: 'NATO deterrent forward prepositioning', priority: 'URGENT', status: 'COMPLETED' },
  { id: 3, tracking_number: 'TRF-2026-8003', origin_base_id: 2, origin_base_name: 'Camp Pendleton', destination_base_id: 4, destination_base_name: 'Naval Station Norfolk', equipment_type_id: 9, equipment_name: 'AN/PRC-152 Handheld Tactical Radio', equipment_category: 'Communications', unit: 'units', quantity: 15, transfer_date: '2026-09-14', reason: 'Amphibious task force comms synchronization', priority: 'STANDARD', status: 'COMPLETED' },
  { id: 4, tracking_number: 'TRF-2026-8004', origin_base_id: 3, origin_base_name: 'Ramstein Air Base', destination_base_id: 1, destination_base_name: 'Fort Liberty', equipment_type_id: 7, equipment_name: '5.56x45mm NATO Ball (Crates of 1,000)', equipment_category: 'Ammunition', unit: 'crates', quantity: 50, transfer_date: '2026-09-19', reason: 'Returning surplus training ammunition to central depot', priority: 'ROUTINE', status: 'COMPLETED' },
  { id: 5, tracking_number: 'TRF-2026-8005', origin_base_id: 1, origin_base_name: 'Fort Liberty', destination_base_id: 4, destination_base_name: 'Naval Station Norfolk', equipment_type_id: 5, equipment_name: 'M1151 HMMWV Up-Armored Utility Vehicle', equipment_category: 'Vehicles', unit: 'units', quantity: 4, transfer_date: '2026-09-22', reason: 'Base perimeter security convoy reinforcement', priority: 'URGENT', status: 'IN_TRANSIT' }
];

let assignments = [
  { id: 1, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 1, equipment_name: 'M4A1 Tactical Carbine', equipment_category: 'Weapons', unit: 'units', personnel_name: 'John Ramirez', military_id: 'US-7782109', rank: 'Sergeant', unit: 'Alpha Co, 1st BCT', quantity: 1, assigned_date: '2026-09-03', expected_return_date: '2026-10-03', return_date: null, status: 'ASSIGNED' },
  { id: 2, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 1, equipment_name: 'M4A1 Tactical Carbine', equipment_category: 'Weapons', unit: 'units', personnel_name: 'Emily Hayes', military_id: 'US-8841203', rank: 'Corporal', unit: 'Bravo Co, 1st BCT', quantity: 1, assigned_date: '2026-09-03', expected_return_date: '2026-09-20', return_date: '2026-09-20', status: 'RETURNED' },
  { id: 3, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 9, equipment_name: 'AN/PRC-152 Handheld Tactical Radio', equipment_category: 'Communications', unit: 'units', personnel_name: 'Carlos Rodriguez', military_id: 'US-6619024', rank: 'Staff Sergeant', unit: 'Signal Detachment 4', quantity: 2, assigned_date: '2026-09-07', expected_return_date: '2026-10-15', return_date: null, status: 'ASSIGNED' },
  { id: 4, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 12, equipment_name: 'AN/PVS-31A Dual Night Vision Goggles', equipment_category: 'Medical & Field Gear', unit: 'units', personnel_name: 'Michael Stone', military_id: 'US-5519283', rank: 'First Lieutenant', unit: 'Recon Platoon 82nd', quantity: 4, assigned_date: '2026-09-12', expected_return_date: '2026-10-01', return_date: null, status: 'ASSIGNED' },
  { id: 5, base_id: 2, base_name: 'Camp Pendleton', equipment_type_id: 1, equipment_name: 'M4A1 Tactical Carbine', equipment_category: 'Weapons', unit: 'units', personnel_name: 'Tyler Brooks', military_id: 'US-9912034', rank: 'Sergeant', unit: 'Marine Expeditionary Unit 1', quantity: 1, assigned_date: '2026-09-08', expected_return_date: '2026-10-08', return_date: null, status: 'ASSIGNED' },
  { id: 6, base_id: 2, base_name: 'Camp Pendleton', equipment_type_id: 5, equipment_name: 'M1151 HMMWV Up-Armored Utility Vehicle', equipment_category: 'Vehicles', unit: 'units', personnel_name: 'Amanda Lewis', military_id: 'US-3321948', rank: 'Staff Sergeant', unit: 'Logistics Support Bn', quantity: 1, assigned_date: '2026-09-14', expected_return_date: '2026-09-28', return_date: null, status: 'ASSIGNED' },
  { id: 7, base_id: 3, base_name: 'Ramstein Air Base', equipment_type_id: 11, equipment_name: 'Tactical Combat Casualty Care (TCCC) Kit', equipment_category: 'Medical & Field Gear', unit: 'kits', personnel_name: 'Henrik Weber', military_id: 'US-4410291', rank: 'Captain', unit: 'Forward Surgical Team', quantity: 10, assigned_date: '2026-09-09', expected_return_date: '2026-10-09', return_date: null, status: 'ASSIGNED' }
];

let expenditures = [
  { id: 1, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 7, equipment_name: '5.56x45mm NATO Ball (Crates of 1,000)', equipment_category: 'Ammunition', unit: 'crates', quantity: 45, expenditure_type: 'TRAINING_EXERCISE', date: '2026-09-07', mission_reference: 'EX-LIBERTY-THUNDER-26', approved_by_name: 'Col. Marcus Vance', approved_by_rank: 'Colonel', notes: 'Live-fire range qualification for 150 infantry soldiers' },
  { id: 2, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 8, equipment_name: '120mm Tank Gun APFSDS Rounds', equipment_category: 'Ammunition', unit: 'rounds', quantity: 8, expenditure_type: 'TRAINING_EXERCISE', date: '2026-09-13', mission_reference: 'EX-IRON-FORGE', approved_by_name: 'Col. Marcus Vance', approved_by_rank: 'Colonel', notes: 'Tank gunnery table VI live ammunition qualification' },
  { id: 3, base_id: 1, base_name: 'Fort Liberty', equipment_type_id: 11, equipment_name: 'Tactical Combat Casualty Care (TCCC) Kit', equipment_category: 'Medical & Field Gear', unit: 'kits', quantity: 12, expenditure_type: 'ROUTINE_EXPENDITURE', date: '2026-09-16', mission_reference: 'MED-ROUTINE-CONSUMPTION', approved_by_name: 'Col. Marcus Vance', approved_by_rank: 'Colonel', notes: 'Field casualty drills consumption' },
  { id: 4, base_id: 2, base_name: 'Camp Pendleton', equipment_type_id: 7, equipment_name: '5.56x45mm NATO Ball (Crates of 1,000)', equipment_category: 'Ammunition', unit: 'crates', quantity: 35, expenditure_type: 'TRAINING_EXERCISE', date: '2026-09-10', mission_reference: 'EX-PACIFIC-CREST', approved_by_name: 'Col. Sarah Jenkins', approved_by_rank: 'Colonel', notes: 'Amphibious breach live-fire drill expenditure' },
  { id: 5, base_id: 3, base_name: 'Ramstein Air Base', equipment_type_id: 7, equipment_name: '5.56x45mm NATO Ball (Crates of 1,000)', equipment_category: 'Ammunition', unit: 'crates', quantity: 20, expenditure_type: 'TRAINING_EXERCISE', date: '2026-09-17', mission_reference: 'EX-EURO-ALLIANCE', approved_by_name: 'Gen. Arthur Kane', approved_by_rank: 'General', notes: 'NATO joint combined arms live-fire exercise' }
];

let auditLogs = [
  { id: 1, timestamp: '2026-09-01 08:00:00', user_name: 'Gen. Arthur Kane', user_role: 'ADMIN', action: 'SYSTEM_INIT', entity_type: 'SYSTEM', base_id: null, base_name: 'Global HQ', details: '{"action":"Initial baseline system configuration deployed"}', ip_address: '10.0.0.1' },
  { id: 2, timestamp: '2026-09-02 09:15:22', user_name: 'Capt. Ray Miller', user_role: 'LOGISTICS_OFFICER', action: 'PURCHASE_CREATED', entity_type: 'PURCHASE', base_id: 1, base_name: 'Fort Liberty', details: '{"order_number":"PO-2026-0101","quantity":80,"item":"M4A1 Tactical Carbine","total_cost":96000}', ip_address: '192.168.1.42' },
  { id: 3, timestamp: '2026-09-06 14:20:10', user_name: 'Capt. Ray Miller', user_role: 'LOGISTICS_OFFICER', action: 'TRANSFER_INITIATED', entity_type: 'TRANSFER', base_id: 1, base_name: 'Fort Liberty', details: '{"tracking_number":"TRF-2026-8001","qty":30,"from_base":"Fort Liberty","to_base":"Camp Pendleton"}', ip_address: '192.168.1.42' },
  { id: 4, timestamp: '2026-09-07 16:45:00', user_name: 'Col. Marcus Vance', user_role: 'BASE_COMMANDER', action: 'ASSET_EXPENDED', entity_type: 'EXPENDITURE', base_id: 1, base_name: 'Fort Liberty', details: '{"qty":45,"item":"5.56x45mm NATO Ball (Crates of 1,000)","mission":"EX-LIBERTY-THUNDER-26"}', ip_address: '192.168.1.10' },
  { id: 5, timestamp: '2026-09-12 11:30:15', user_name: 'Col. Marcus Vance', user_role: 'BASE_COMMANDER', action: 'ASSET_ASSIGNED', entity_type: 'ASSIGNMENT', base_id: 1, base_name: 'Fort Liberty', details: '{"personnel":"1st Lt. Michael Stone","qty":4,"item":"AN/PVS-31A Dual Night Vision Goggles"}', ip_address: '192.168.1.10' }
];

export const mockStore = {
  login: async (username, password) => {
    const user = initialUsers.find(u => (u.username === username || u.username === username.toLowerCase()) && u.password === password);
    if (!user) {
      return { success: false, message: 'Invalid username or passphrase' };
    }
    const safeUser = { ...user };
    delete safeUser.password;
    return {
      success: true,
      message: 'Login successful (Offline Resilient Mode)',
      token: 'mock-jwt-token-' + user.id,
      user: safeUser
    };
  },

  switchDemoUser: async (role, baseId) => {
    let user = initialUsers.find(u => u.role === role && (!baseId || u.base_id === Number(baseId)));
    if (!user) user = initialUsers.find(u => u.role === role) || initialUsers[0];
    const safeUser = { ...user };
    delete safeUser.password;
    return {
      success: true,
      token: 'mock-jwt-token-' + user.id,
      user: safeUser
    };
  },

  getDemoCredentials: async () => ({
    success: true,
    credentials: initialUsers.map(u => ({
      role: u.role,
      username: u.username,
      password: u.password,
      name: u.full_name,
      rank: u.military_rank,
      base: u.base_name
    }))
  }),

  getDashboardMetrics: async (params = {}) => {
    const baseId = params.baseId && params.baseId !== 'all' ? Number(params.baseId) : null;
    const eqId = params.equipmentTypeId && params.equipmentTypeId !== 'all' ? Number(params.equipmentTypeId) : null;

    // Filter purchases
    const winPurchases = purchases.filter(p => {
      if (baseId && p.base_id !== baseId) return false;
      if (eqId && p.equipment_type_id !== eqId) return false;
      if (params.startDate && p.purchase_date < params.startDate) return false;
      if (params.endDate && p.purchase_date > params.endDate) return false;
      return true;
    });

    // Filter transfers in / out
    const winTransfersIn = transfers.filter(t => {
      if (t.status !== 'COMPLETED') return false;
      if (baseId && t.destination_base_id !== baseId) return false;
      if (eqId && t.equipment_type_id !== eqId) return false;
      if (params.startDate && t.transfer_date < params.startDate) return false;
      if (params.endDate && t.transfer_date > params.endDate) return false;
      return true;
    });

    const winTransfersOut = transfers.filter(t => {
      if (t.status !== 'COMPLETED') return false;
      if (baseId && t.origin_base_id !== baseId) return false;
      if (eqId && t.equipment_type_id !== eqId) return false;
      if (params.startDate && t.transfer_date < params.startDate) return false;
      if (params.endDate && t.transfer_date > params.endDate) return false;
      return true;
    });

    // Expenditures
    const winExp = expenditures.filter(e => {
      if (baseId && e.base_id !== baseId) return false;
      if (eqId && e.equipment_type_id !== eqId) return false;
      if (params.startDate && e.date < params.startDate) return false;
      if (params.endDate && e.date > params.endDate) return false;
      return true;
    });

    // Active assignments
    const winAssign = assignments.filter(a => {
      if (a.status !== 'ASSIGNED') return false;
      if (baseId && a.base_id !== baseId) return false;
      if (eqId && a.equipment_type_id !== eqId) return false;
      return true;
    });

    const purchasesQty = winPurchases.reduce((s, p) => s + p.quantity, 0);
    const purchasesTotalCost = winPurchases.reduce((s, p) => s + p.total_cost, 0);
    const transfersInQty = winTransfersIn.reduce((s, t) => s + t.quantity, 0);
    const transfersOutQty = winTransfersOut.reduce((s, t) => s + t.quantity, 0);
    const expendedQty = winExp.reduce((s, e) => s + e.quantity, 0);
    const assignedQty = winAssign.reduce((s, a) => s + a.quantity, 0);

    const netMovement = purchasesQty + transfersInQty - transfersOutQty;
    const openingBalance = baseId ? 2420 : 7017;
    const closingBalance = openingBalance + netMovement - expendedQty;
    const availableStock = Math.max(0, closingBalance - assignedQty);

    return {
      success: true,
      metrics: {
        openingBalance,
        closingBalance,
        netMovement,
        purchases: { quantity: purchasesQty, count: winPurchases.length, totalCost: purchasesTotalCost },
        transfersIn: { quantity: transfersInQty, count: winTransfersIn.length },
        transfersOut: { quantity: transfersOutQty, count: winTransfersOut.length },
        expended: { quantity: expendedQty, count: winExp.length },
        assigned: { quantity: assignedQty, count: winAssign.length },
        availableStock
      }
    };
  },

  getNetMovementDetails: async (params = {}) => {
    const baseId = params.baseId && params.baseId !== 'all' ? Number(params.baseId) : null;
    const pList = purchases.filter(p => !baseId || p.base_id === baseId);
    const inList = transfers.filter(t => t.status === 'COMPLETED' && (!baseId || t.destination_base_id === baseId));
    const outList = transfers.filter(t => t.status === 'COMPLETED' && (!baseId || t.origin_base_id === baseId));

    const pQty = pList.reduce((s, p) => s + p.quantity, 0);
    const pCost = pList.reduce((s, p) => s + p.total_cost, 0);
    const inQty = inList.reduce((s, t) => s + t.quantity, 0);
    const outQty = outList.reduce((s, t) => s + t.quantity, 0);

    return {
      success: true,
      summary: {
        purchasesCount: pList.length,
        purchasesQty: pQty,
        purchasesTotalCost: pCost,
        transfersInCount: inList.length,
        transfersInQty: inQty,
        transfersOutCount: outList.length,
        transfersOutQty: outQty,
        netMovementQty: pQty + inQty - outQty,
        formula: 'Net Movement = Purchases + Transfers In - Transfers Out'
      },
      purchases: pList,
      transfersIn: inList,
      transfersOut: outList
    };
  },

  getCategoryDistribution: async (baseId) => {
    const bId = baseId && baseId !== 'all' ? Number(baseId) : null;
    return {
      success: true,
      distribution: [
        { category: 'Ammunition', item_count: 2, initial_total: bId ? 1100 : 2350 },
        { category: 'Weapons', item_count: 3, initial_total: bId ? 750 : 1530 },
        { category: 'Medical & Field Gear', item_count: 2, initial_total: bId ? 420 : 1255 },
        { category: 'Communications', item_count: 2, initial_total: bId ? 180 : 480 },
        { category: 'Vehicles', item_count: 3, initial_total: bId ? 80 : 280 }
      ]
    };
  },

  getBasesOverview: async () => ({
    success: true,
    bases: initialBases.map(b => ({
      ...b,
      total_purchases: purchases.filter(p => p.base_id === b.id).length,
      active_assignments: assignments.filter(a => a.base_id === b.id && a.status === 'ASSIGNED').length,
      initial_inventory: b.id === 1 ? 2420 : b.id === 2 ? 1800 : b.id === 3 ? 1500 : 1297
    }))
  }),

  getPurchases: async (params = {}) => {
    let list = [...purchases];
    if (params.baseId && params.baseId !== 'all') list = list.filter(p => p.base_id === Number(params.baseId));
    if (params.equipmentTypeId && params.equipmentTypeId !== 'all') list = list.filter(p => p.equipment_type_id === Number(params.equipmentTypeId));
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(p => p.order_number.toLowerCase().includes(s) || p.equipment_name.toLowerCase().includes(s) || p.supplier.toLowerCase().includes(s));
    }
    return { success: true, total: list.length, purchases: list };
  },

  createPurchase: async (data) => {
    const base = initialBases.find(b => b.id === data.base_id) || initialBases[0];
    const eq = initialEquipment.find(e => e.id === data.equipment_type_id) || initialEquipment[0];
    const newP = {
      id: Date.now(),
      base_id: base.id,
      base_name: base.name,
      equipment_type_id: eq.id,
      equipment_name: eq.name,
      equipment_category: eq.category,
      unit: eq.unit,
      quantity: data.quantity,
      unit_cost: data.unit_cost,
      total_cost: data.quantity * data.unit_cost,
      supplier: data.supplier,
      order_number: data.order_number || `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      purchase_date: data.purchase_date,
      recorded_by_name: 'Commanding Officer',
      recorded_by_rank: 'Officer'
    };
    purchases.unshift(newP);
    auditLogs.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: 'Commanding Officer',
      user_role: 'BASE_COMMANDER',
      action: 'PURCHASE_CREATED',
      entity_type: 'PURCHASE',
      base_id: base.id,
      base_name: base.name,
      details: JSON.stringify({ item: eq.name, qty: data.quantity, po: newP.order_number }),
      ip_address: '127.0.0.1'
    });
    return { success: true, message: `Purchase order ${newP.order_number} recorded successfully`, purchase: newP };
  },

  getTransfers: async (params = {}) => {
    let list = [...transfers];
    if (params.baseId && params.baseId !== 'all') {
      const bId = Number(params.baseId);
      list = list.filter(t => t.origin_base_id === bId || t.destination_base_id === bId);
    }
    if (params.status && params.status !== 'all') list = list.filter(t => t.status === params.status);
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(t => t.tracking_number.toLowerCase().includes(s) || t.equipment_name.toLowerCase().includes(s) || t.reason.toLowerCase().includes(s));
    }
    return { success: true, total: list.length, transfers: list };
  },

  createTransfer: async (data) => {
    const ob = initialBases.find(b => b.id === data.origin_base_id) || initialBases[0];
    const db = initialBases.find(b => b.id === data.destination_base_id) || initialBases[1];
    const eq = initialEquipment.find(e => e.id === data.equipment_type_id) || initialEquipment[0];
    const newT = {
      id: Date.now(),
      tracking_number: `TRF-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      origin_base_id: ob.id,
      origin_base_name: ob.name,
      destination_base_id: db.id,
      destination_base_name: db.name,
      equipment_type_id: eq.id,
      equipment_name: eq.name,
      equipment_category: eq.category,
      unit: eq.unit,
      quantity: data.quantity,
      transfer_date: data.transfer_date,
      reason: data.reason,
      priority: data.priority || 'STANDARD',
      status: 'COMPLETED'
    };
    transfers.unshift(newT);
    auditLogs.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_name: 'Logistics Officer',
      user_role: 'LOGISTICS_OFFICER',
      action: 'TRANSFER_INITIATED',
      entity_type: 'TRANSFER',
      base_id: ob.id,
      base_name: ob.name,
      details: JSON.stringify({ item: eq.name, qty: data.quantity, from: ob.name, to: db.name }),
      ip_address: '127.0.0.1'
    });
    return { success: true, message: `Transfer ${newT.tracking_number} dispatched from ${ob.name} to ${db.name}`, transfer: newT };
  },

  updateTransferStatus: async (id, status) => {
    const t = transfers.find(item => item.id === Number(id));
    if (t) t.status = status;
    return { success: true, message: `Transfer status updated to ${status}` };
  },

  getAssignments: async (params = {}) => {
    let list = [...assignments];
    if (params.baseId && params.baseId !== 'all') list = list.filter(a => a.base_id === Number(params.baseId));
    if (params.status && params.status !== 'all') list = list.filter(a => a.status === params.status);
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(a => a.personnel_name.toLowerCase().includes(s) || a.military_id.toLowerCase().includes(s) || a.equipment_name.toLowerCase().includes(s));
    }
    return { success: true, total: list.length, assignments: list };
  },

  createAssignment: async (data) => {
    const base = initialBases.find(b => b.id === data.base_id) || initialBases[0];
    const eq = initialEquipment.find(e => e.id === data.equipment_type_id) || initialEquipment[0];
    const newA = {
      id: Date.now(),
      base_id: base.id,
      base_name: base.name,
      equipment_type_id: eq.id,
      equipment_name: eq.name,
      equipment_category: eq.category,
      unit: eq.unit,
      personnel_name: data.personnel_name,
      military_id: data.military_id,
      rank: data.rank,
      unit: data.unit,
      quantity: data.quantity,
      assigned_date: data.assigned_date,
      expected_return_date: data.expected_return_date,
      return_date: null,
      status: 'ASSIGNED'
    };
    assignments.unshift(newA);
    return { success: true, message: `Asset assigned to ${data.rank} ${data.personnel_name}`, assignment: newA };
  },

  returnAssignment: async (id, return_notes) => {
    const a = assignments.find(item => item.id === Number(id));
    if (a) {
      a.status = 'RETURNED';
      a.return_date = new Date().toISOString().split('T')[0];
    }
    return { success: true, message: 'Asset successfully returned to armory' };
  },

  getExpenditures: async (params = {}) => {
    let list = [...expenditures];
    if (params.baseId && params.baseId !== 'all') list = list.filter(e => e.base_id === Number(params.baseId));
    if (params.search) {
      const s = params.search.toLowerCase();
      list = list.filter(e => e.mission_reference.toLowerCase().includes(s) || e.equipment_name.toLowerCase().includes(s));
    }
    return { success: true, total: list.length, expenditures: list };
  },

  createExpenditure: async (data) => {
    const base = initialBases.find(b => b.id === data.base_id) || initialBases[0];
    const eq = initialEquipment.find(e => e.id === data.equipment_type_id) || initialEquipment[0];
    const newE = {
      id: Date.now(),
      base_id: base.id,
      base_name: base.name,
      equipment_type_id: eq.id,
      equipment_name: eq.name,
      equipment_category: eq.category,
      unit: eq.unit,
      quantity: data.quantity,
      expenditure_type: data.expenditure_type,
      date: data.date,
      mission_reference: data.mission_reference,
      approved_by_name: 'Base Commander',
      approved_by_rank: 'Colonel',
      notes: data.notes
    };
    expenditures.unshift(newE);
    return { success: true, message: `Expenditure recorded for mission ${data.mission_reference}`, expenditure: newE };
  },

  getBases: async () => ({ success: true, bases: initialBases }),
  getEquipmentTypes: async () => ({ success: true, equipment: initialEquipment }),

  getBaseInventory: async (baseId) => {
    const bId = Number(baseId);
    return {
      success: true,
      baseId: bId,
      inventory: initialEquipment.map(eq => {
        const total = eq.id === 1 ? 480 : eq.id === 7 ? 1000 : eq.id === 5 ? 64 : 100;
        const assigned = eq.id === 1 ? 2 : eq.id === 9 ? 2 : 0;
        return {
          equipment_type_id: eq.id,
          name: eq.name,
          category: eq.category,
          unit: eq.unit,
          unit_cost_estimate: eq.unit_cost_estimate,
          totalStock: total,
          activeAssignments: assigned,
          availableStock: total - assigned
        };
      })
    };
  },

  getAuditLogs: async (params = {}) => {
    let list = [...auditLogs];
    if (params.baseId && params.baseId !== 'all') list = list.filter(l => l.base_id === Number(params.baseId) || l.base_id === null);
    if (params.action && params.action !== 'all') list = list.filter(l => l.action === params.action);
    return { success: true, total: list.length, logs: list };
  }
};
