# Military Asset Management System (MAMS)
## 3 to 5-Minute Video Walkthrough Script & Presentation Guide

---

### Video Overview
- **Target Duration**: 3 minutes 45 seconds (within the 3-5 minute requirement)
- **Presenter**: Lead Systems Architect & Full-Stack Engineer
- **Recording Tools Recommended**: Loom, OBS Studio, or QuickTime
- **Resolution**: 1080p (1920x1080) @ 60fps

---

### Segment 1: Introduction & Architecture (0:00 – 0:50)

**[Screen: Showing Tactical Command Dashboard with Military Branding, or Architecture Diagram in PROJECT_DOCUMENTATION.md]**

**Presenter (Voiceover):**
> "Hello and welcome to the demonstration of the **Vanguard Military Asset Management System (MAMS)**.
> 
> MAMS is designed for multi-base defense logistics, enabling commanders, supply officers, and defense administrators to manage the complete lifecycle of mission-critical assets—from small arms and munitions to armored combat vehicles and tactical radios—across geographically distributed military installations.
> 
> Let's look briefly at the architecture:
> - On the **backend**, we have an event-driven **Node.js Express** service with native ES modules, hardened with Helmet, CORS, and stateless JWT authentication.
> - On the **database** layer, we chose an ACID-compliant **Relational SQL** architecture using `better-sqlite3` and ANSI-standard SQL. This provides deterministic double-entry accounting and sub-millisecond queries with zero external dependencies.
> - On the **frontend**, we built a responsive, high-performance **React 18** application using Vite and Tailwind CSS with a tactical defense theme and Lucide vector iconography."

---

### Segment 2: Core Flows Demo — Dashboard & Filter Telemetry (0:50 – 1:40)

**[Screen: Navigate to Dashboard at `http://localhost:3000` as General Arthur Kane (Admin)]**

**Presenter (Voiceover):**
> "Starting on the **Command Dashboard**, we immediately see the primary operational telemetry:
> - **Opening Balance**: Initial stock plus all historical movements strictly prior to the selected date window.
> - **Net Movement**: Reconciled as: $\text{Purchases} + \text{Transfers In} - \text{Transfers Out}$.
> - **Expended Assets**: Munitions fired in training or combat losses.
> - **Closing Balance**: $\text{Opening Balance} + \text{Net Movement} - \text{Expended}$.
> - **Assigned Assets**: Equipment currently checked out to soldiers in the field.
> - **Available Stock**: Unassigned armory stock ready for deployment.
> 
> Now let's test the filters. We can filter dynamically by **Date Range**—using presets like 'This Month', 'Last 30 Days', or a custom date range. We can also filter by **Military Base**—switching between Fort Liberty, Camp Pendleton, Ramstein, or Naval Station Norfolk—and by **Equipment Type**. Notice how all metrics and distribution charts instantly recompute."

---

### Segment 3: The Bonus Pop-Up Feature — Net Movement Breakdown (1:40 – 2:20)

**[Screen: Hover over the 'Net Movement' Metric Card with the 'Click to inspect' badge, and click it]**

**Presenter (Voiceover):**
> "Now, one of the key bonus requirements is the **Net Movement Pop-up Display**.
> 
> When I click directly on the **Net Movement** card, an interactive modal pops up showing the complete audit breakdown.
> 
> At the top, you see the mathematical equation banner:
> $\text{Purchases} (+574) + \text{Transfers In} (+99) - \text{Transfers Out} (-99) = \text{Net Movement} (+574\text{ units})$.
> 
> We have three detailed tabs:
> 1. **Purchases Tab**: Lists each purchase order with date, PO number, equipment item, quantity, unit cost, total cost, and defense contractor.
> 2. **Transfers In Tab**: Lists inbound movements arriving at the base with origin, quantity, priority, and status.
> 3. **Transfers Out Tab**: Lists departing dispatches transferred to other installations.
> 
> This eliminates supply ambiguity and provides full non-repudiation."

---

### Segment 4: Procurement, Transfers & Tricky Parts Handled (2:20 – 3:15)

**[Screen: Navigate to Purchases Page, then Transfers Page, then Assignments Page]**

**Presenter (Voiceover):**
> "Next, let's explore **Procurement and Transfers**:
> - On the **Purchases Page**, officers can record new asset acquisitions. Selecting an asset automatically loads standard unit costs, calculates totals, generates a unique PO number, and updates armory stock.
> - On the **Transfers Page**, we facilitate inter-base asset reallocations. 
> 
> **Here is a critical tricky part we handled manually**:
> - Before an asset can be transferred, our backend dynamically calculates the origin base's *available unassigned stock*. If a commander tries to transfer 50 M4A1 rifles when only 30 are unassigned, the transaction is rejected with a validation error.
> - We also enforce validation that the origin and destination bases cannot be identical, and generate tracked dispatch codes like `TRF-2026-8001`.
> - Furthermore, on the **Assignments & Expenditures Page**, Base Commanders can check out equipment to specific soldiers with military IDs, and check them back in with a single click, which instantly restores available inventory."

---

### Segment 5: RBAC Enforcement & Fast Switcher (3:15 – 3:45)

**[Screen: Use the top navigation 'Demo RBAC Switcher' dropdown to switch to Capt. Ray Miller (Logistics Officer)]**

**Presenter (Voiceover):**
> "Finally, let's demonstrate **Role-Based Access Control (RBAC)**:
> 
> In the top navigation bar, we implemented a **Fast Demo Role Switcher**. 
> - Right now, we're logged in as **Admin**.
> - Let's switch to **Captain Ray Miller**, the **Logistics Officer** for Fort Liberty.
> - Notice what happened instantly:
>   1. The base filter is automatically locked to Fort Liberty.
>   2. In the sidebar, **Personnel & Expenditures** now shows a 'Limited' badge.
>   3. If the Logistics Officer navigates to Assignments, the system displays an RBAC policy banner explaining that equipment checkouts and combat expenditures require Commander clearance.
>   4. If someone attempts to forge a direct POST request to `/api/assignments`, our backend middleware intercepts it and returns **HTTP 403 Forbidden**.
> - All mutations across all roles are permanently recorded in the **Audit Trail** for complete transparency.
> 
> Everything is packaged with clean documentation, database dump, and automated test scripts. Thank you for watching!"

---

### Technical Highlights Checklist to Mention
- [x] Exact Opening & Closing balance ledger arithmetic
- [x] Bonus Net Movement pop-up modal with detailed breakdown tabs
- [x] Real-time origin base available stock validation
- [x] Multi-tier RBAC middleware (`requireRoles`, `checkBaseScope`)
- [x] Immutable audit logging for every mutation
- [x] 1-click Demo Role Switcher for instant evaluator testing
