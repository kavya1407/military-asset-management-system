import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');
const outputPath = path.join(rootDir, 'Military_Asset_Management_System_Documentation.pdf');

console.log(`[PDF] Generating documentation PDF at: ${outputPath}`);

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Styling helpers
const primaryColor = '#0f172a'; // Slate 900
const accentColor = '#b45309';  // Amber 700
const textDark = '#1e293b';      // Slate 800
const textMuted = '#475569';     // Slate 600

function addHeader(title) {
  doc.rect(45, doc.y, 505, 24).fill('#1e293b');
  doc.fillColor('#f8fafc').fontSize(11).font('Helvetica-Bold')
     .text(title, 55, doc.y - 18, { width: 485 });
  doc.moveDown(0.8);
}

function addSubHeader(subtitle) {
  doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold')
     .text(subtitle);
  doc.moveDown(0.3);
}

function addParagraph(text) {
  doc.fillColor(textDark).fontSize(8.5).font('Helvetica')
     .text(text, { align: 'justify', lineGap: 2 });
  doc.moveDown(0.5);
}

function addBullet(label, text) {
  doc.fillColor(textDark).fontSize(8.5)
     .font('Helvetica-Bold').text(`• ${label}: `, { continued: true })
     .font('Helvetica').text(text, { lineGap: 1.5 });
  doc.moveDown(0.2);
}

// ================= COVER / TITLE BLOCK =================
doc.rect(45, 40, 505, 75).fill('#090d16');
doc.fillColor('#f59e0b').fontSize(18).font('Helvetica-Bold')
   .text('VANGUARD MILITARY ASSET MANAGEMENT SYSTEM', 60, 52, { align: 'left' });
doc.fillColor('#94a3b8').fontSize(9.5).font('Helvetica')
   .text('System Architecture, Technical Specifications & Multi-Base Logistics Guide', 60, 76);
doc.fillColor('#38bdf8').fontSize(8).font('Helvetica-Bold')
   .text('UNCLASSIFIED // DEFENSE REQUISITION PROTOTYPE // v2.4.0', 60, 94);

doc.y = 130;

// Section 1: Project Overview
addHeader('1. PROJECT OVERVIEW');
addParagraph(
  'The Vanguard Military Asset Management System (MAMS) is an enterprise logistics and armory tracking framework engineered to provide defense commanders and supply officers with comprehensive situational awareness, accountability, and non-repudiation across multi-installation theaters of operation. The system coordinates the tracking of Opening Balances, Net Movements (Purchases + Transfers In - Transfers Out), Personnel Assignments, and Operational Expenditures across distributed military bases.'
);
addBullet('Core Accounting Rule', 'Closing Balance = Opening Balance + Net Movement (Purchases + In - Out) - Expended.');
addBullet('Assumptions', 'Multi-base decentralized topology (Fort Liberty, Camp Pendleton, Ramstein Air Base, Naval Station Norfolk). Ledger transactions strictly reconcile balances across customizable date filters.');
addBullet('Limitations', 'Designed for secure connected intranet networks; edge-to-satellite synchronization protocols for disconnected tactical mobile units represent planned Phase II developments.');

doc.moveDown(0.5);

// Section 2: Tech Stack & Architecture
addHeader('2. TECH STACK & SYSTEM ARCHITECTURE');
addBullet('Backend (Node.js & Express)', 'High-throughput asynchronous event-driven I/O engine. Native ES Modules architecture with Helmet HTTP security headers, CORS protection, JWT stateless token issuance, Bcrypt password hashing, and Morgan request telemetry.');
addBullet('Frontend (React 18 & Vite)', 'High-performance Single Page Application built with Vite and styled via Tailwind CSS with a tactical defense theme. Responsive across mobile, tablet, and widescreen command displays. Employs Lucide vector iconography.');
addBullet('Database (Relational SQL / better-sqlite3 & PostgreSQL ANSI)', 'ACID-compliant relational database. Guarantees deterministic ledger calculations, prevents orphaned records via Foreign Key cascades, and provides sub-millisecond query execution with zero external runtime dependencies.');

doc.moveDown(0.5);

// Section 3: Data Models & Schema
addHeader('3. DATA MODELS / SCHEMA');
addParagraph('The database structure organizes military assets, base installations, personnel profiles, and ledger transactions into nine interconnected relational tables:');
addBullet('bases', 'Installations with unique military codes (e.g., BASE-LIBERTY), locations, and commanding officers.');
addBullet('equipment_types', 'Categorized catalog (Weapons, Vehicles, Ammunition, Communications, Medical Gear).');
addBullet('users', 'Officer credentials with military rank, assigned base, role clearance, and Bcrypt-hashed credentials.');
addBullet('base_inventory', 'Initial baseline inventory quantities established prior to transactional date windows.');
addBullet('purchases', 'Procurement records containing PO number, supplier, unit cost, quantity, total cost, and date.');
addBullet('transfers', 'Inter-base hardware movements with origin, destination, quantity, tracking code, priority, and status.');
addBullet('assignments', 'Personnel checkouts recording military service ID, rank, unit, equipment, and check-in return status.');
addBullet('expenditures', 'Ammunition, combat losses, and decommissioned assets tied to specific operational mission codes.');
addBullet('audit_logs', 'Immutable append-only security audit log recording every mutation with IP, timestamp, user, and payload.');

doc.addPage();

// Section 4: Role-Based Access Control (RBAC)
addHeader('4. ROLE-BASED ACCESS CONTROL (RBAC)');
addParagraph('The framework enforces multi-tiered security clearances via backend middleware and dynamic frontend view guards:');
addBullet('Admin (ADMIN)', 'Unrestricted command over all four installations, cross-base redeployments, procurement authorization, personnel assignments, operational expenditures, and global security audit trails.');
addBullet('Base Commander (BASE_COMMANDER)', 'Autonomous authority strictly scoped to their assigned base. Can record local purchases, initiate/receive base transfers, check out gear to base personnel, report combat expenditures, and inspect base audit logs.');
addBullet('Logistics Officer (LOGISTICS_OFFICER)', 'Limited logistics role focused on supply chain execution. Authorized to record purchases and initiate inter-base transfers. Strictly restricted from personnel assignments and expenditure approvals (HTTP 403 Forbidden).');
addBullet('Enforcement Method', 'JWT claims verified via authenticateToken; clearance levels enforced via requireRoles(); installation data isolation enforced via checkBaseScope().');

doc.moveDown(0.5);

// Section 5: API Logging & Audit Handling
addHeader('5. API LOGGING & AUDIT HANDLING');
addParagraph(
  'Every state-altering API interaction is captured by an automated audit logger (logAuditAction). The system logs purchases, dispatches, arrivals, personnel checkouts, armory check-ins, and expenditures into the audit_logs table with millisecond-precision timestamps, commanding officer ID, role, client IP address, JSON mutation payload, and execution status, establishing complete non-repudiation.'
);

doc.moveDown(0.5);

// Section 6: Setup Instructions
addHeader('6. SETUP INSTRUCTIONS');
addBullet('Step 1 (Extract Code)', 'Unzip military-asset-management-system.zip into your workspace.');
addBullet('Step 2 (Backend Init)', 'Navigate to /backend, run "npm install", then execute "npm run seed" to initialize and populate the SQLite database.');
addBullet('Step 3 (Start Backend)', 'Run "npm start" inside /backend. The API service will listen on http://localhost:5001.');
addBullet('Step 4 (Frontend Setup)', 'Open a second terminal, navigate to /frontend, run "npm install", then "npm run dev". The UI is accessible at http://localhost:3000.');
addBullet('Step 5 (Production Build)', 'Execute "npm run build" in /frontend to verify production asset bundling.');

doc.moveDown(0.5);

// Section 7: Key API Endpoints
addHeader('7. KEY API ENDPOINTS (CONTRACT REFERENCE)');
addBullet('POST /api/auth/login', 'Authenticates callsign and passphrase; returns signed 24h JWT token and officer profile.');
addBullet('GET /api/dashboard/metrics', 'Computes Opening Balance, Closing Balance, Net Movement, Assigned, and Expended assets based on date, base, and equipment filters.');
addBullet('GET /api/dashboard/net-movement-details', '[Bonus Pop-up] Returns itemized Purchases, Transfers In, and Transfers Out lists with exact mathematical verification.');
addBullet('GET / POST /api/purchases', 'Lists historical procurements; records new asset acquisition with automated audit logging.');
addBullet('GET / POST /api/transfers', 'Initiates and tracks inter-base dispatches with live origin base available stock validation.');
addBullet('PATCH /api/transfers/:id/status', 'Updates status of in-transit transfers to COMPLETED or CANCELLED.');
addBullet('GET / POST /api/assignments', 'Lists and issues equipment to named soldiers with rank and military service number.');
addBullet('PATCH /api/assignments/:id/return', 'Marks assigned equipment as returned to the base armory, restoring available stock.');
addBullet('GET / POST /api/expenditures', 'Tracks ammunition expended in live-fire exercises or decommissioned gear.');
addBullet('GET /api/audit-logs', 'Retrieves queryable audit records filtered by date range, action, domain, and installation.');

doc.moveDown(0.5);

// Section 8: Working Login Credentials
addHeader('8. WORKING PLATFORM CREDENTIALS');
addParagraph('The following accounts are pre-configured in the database seed and ready for evaluation:');

const creds = [
  ['Callsign: admin', 'Pass: Admin@1234', 'Role: ADMIN', 'Gen. Arthur Kane (Global Command HQ - All Bases)'],
  ['Callsign: commander_liberty', 'Pass: Commander@1234', 'Role: BASE_COMMANDER', 'Col. Marcus Vance (Fort Liberty, NC)'],
  ['Callsign: commander_pendleton', 'Pass: Commander@1234', 'Role: BASE_COMMANDER', 'Col. Sarah Jenkins (Camp Pendleton, CA)'],
  ['Callsign: logistics_liberty', 'Pass: Logistics@1234', 'Role: LOGISTICS_OFFICER', 'Capt. Ray Miller (Fort Liberty Supply Corps)'],
  ['Callsign: logistics_ramstein', 'Pass: Logistics@1234', 'Role: LOGISTICS_OFFICER', 'Maj. Elena Rostova (Ramstein Air Base, Germany)']
];

for (const c of creds) {
  doc.rect(45, doc.y, 505, 18).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
     .text(`${c[0]}   |   ${c[1]}   |   ${c[2]}`, 52, doc.y - 14, { continued: true })
     .font('Helvetica').fillColor('#334155').text(`   - ${c[3]}`);
  doc.moveDown(0.3);
}

// Add page numbers
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica')
     .text(`Vanguard MAMS Documentation // Page ${i + 1} of ${range.count} // Restricted Distribution`,
           45, 800, { align: 'center', width: 505 });
}

doc.end();

writeStream.on('finish', () => {
  const stats = fs.statSync(outputPath);
  console.log(`[PDF] Generated successfully! File size: ${(stats.size / 1024).toFixed(2)} KB at ${outputPath}`);
});
