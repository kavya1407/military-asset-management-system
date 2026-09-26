# Vanguard Military Asset Management System (MAMS)
### Multi-Base Tactical Logistics, RBAC, Ledger Accounting & Non-Repudiation Audit Trail

---

## 🎯 Project Overview
**Vanguard MAMS** is an initial framework for a Military Asset Management System that enables commanders and logistics personnel to manage the movement, assignment, and expenditure of critical defense assets (weapons, armored combat vehicles, guided missiles, munitions, communications gear, and trauma kits) across multiple distributed bases.

The system ensures transparency, operational accountability, and mathematical reconciliation through a periodic double-entry inventory ledger model:
$$\text{Closing Balance} = \text{Opening Balance} + \text{Net Movement} (\text{Purchases} + \text{Transfers In} - \text{Transfers Out}) - \text{Expended}$$

---

## 🚀 Key Features

- **Tactical Command Dashboard**:
  - Displays key metrics: **Opening Balance**, **Net Movement**, **Closing Balance**, **Assigned Assets**, **Expended Assets**, and **Available Stock**.
  - **Bonus Feature Pop-up Display**: Clicking on the **Net Movement** card opens a detailed modal with itemized breakdown tabs for **Purchases**, **Transfers In**, and **Transfers Out**, plus mathematical equation validation.
  - Interactive telemetry filters for **Date Range** (presets: All Time, Last 7 Days, Last 30 Days, This Month, Custom), **Military Base**, and **Equipment Type**.
  - Category distribution visual bars and installation overview table.

- **Procurement & Purchases Page**:
  - Record defense purchases for assets for a specific base with supplier info, PO number, unit costs, and automated total calculation.
  - Historical purchases table with filters, search, and procurement spending totals.

- **Inter-Base Transfer Page**:
  - Facilitate and track asset transfers between installations.
  - **Live Inventory Check**: Validates that the origin base has sufficient unassigned stock before dispatching.
  - Prevents transfers where origin equals destination.
  - Status updates: Mark in-transit transfers as completed/received.

- **Personnel Assignments & Expenditures Page**:
  - **Assignments**: Issue military hardware to soldiers with rank, military service ID, and tactical unit.
  - **Armory Return**: Check items back in to restore base available inventory.
  - **Expenditures**: Log ammunition spent in live-fire exercises, combat losses, or decommissioned matériel tied to mission reference codes.

- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full global access across all installations and operations.
  - **Base Commander**: Autonomous command scoped to their assigned base.
  - **Logistics Officer**: Focused supply chain role (purchases and transfers); strictly restricted from personnel checkouts and operational expenditures (HTTP 403 Forbidden).
  - **Fast Demo Role Switcher**: 1-click identity switching in the top navigation bar to test all roles seamlessly!

- **API Logging & Non-Repudiation Audit Trail**:
  - Every mutation (purchases, transfers, assignments, returns, expenditures, and logins) is captured in `audit_logs` with UTC timestamps, officer name, role, IP address, and JSON payload.
  - Dedicated Audit Trail page for Admins and Base Commanders.

---

## 🔐 Working Platform Credentials

| Role | Username / Callsign | Password | Military Rank & Name | Assigned Base | Access Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ADMIN`** | `admin` | `Admin@1234` | Gen. Arthur Kane | Global Command HQ | Unrestricted command over all 4 bases |
| **`BASE_COMMANDER`** | `commander_liberty` | `Commander@1234` | Col. Marcus Vance | Fort Liberty, NC | Full authority scoped to Fort Liberty |
| **`BASE_COMMANDER`** | `commander_pendleton` | `Commander@1234` | Col. Sarah Jenkins | Camp Pendleton, CA | Full authority scoped to Camp Pendleton |
| **`LOGISTICS_OFFICER`** | `logistics_liberty` | `Logistics@1234` | Capt. Ray Miller | Fort Liberty Logistics | Purchases & transfers; assignments restricted |
| **`LOGISTICS_OFFICER`** | `logistics_ramstein` | `Logistics@1234` | Maj. Elena Rostova | Ramstein Air Base (EU) | European supply chain and transfers |

*Note: You can also click any credential on the Login Page or use the "Demo RBAC Switcher" dropdown in the top header once logged in!*

---

## 🛠️ Quick Start Instructions

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Backend Setup & Database Seeding
```bash
cd backend
npm install
npm run seed     # Initializes SQLite schema and seeds rich demo data
npm start        # Starts server on http://localhost:5001
```

### 2. Frontend Setup & Launch
```bash
cd frontend
npm install
npm run dev      # Launches Vite dev server on http://localhost:3000
```
Open **`http://localhost:3000`** in your browser.

---

## 📦 Deliverables Included in this Submission

1. **Complete Source Code**:
   - `backend/`: Express.js API, JWT authentication, RBAC middleware, and Better-SQLite3 database.
   - `frontend/`: React 18, Vite, Tailwind CSS, Lucide icons, responsive tactical UI.
2. **Database Dump File**:
   - `database_dump.sql`: Complete DDL schema and ANSI-SQL compatible insert statements for all tables and records.
3. **Comprehensive PDF Documentation**:
   - `Military_Asset_Management_System_Documentation.pdf`: Formatted PDF covering all 8 prompt points.
4. **Detailed Markdown Documentation**:
   - `PROJECT_DOCUMENTATION.md`: Exhaustive architecture documentation, ERD diagrams, math proofs, and API endpoint contracts.
5. **Video Walkthrough Script**:
   - `VIDEO_WALKTHROUGH_SCRIPT.md`: Timestamped 3-5 minute script for video presentation.
6. **Deployment Guide**:
   - `DEPLOYMENT_GUIDE.md`: Step-by-step instructions for deploying frontend on Vercel/Netlify and backend on Render (`render.yaml`).
7. **Submission Zip Package**:
   - `military-asset-management-system.zip`: Self-contained archive ready for evaluation upload.
