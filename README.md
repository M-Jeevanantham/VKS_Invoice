# V.K.S. WEAVING CENTRE — COMMERCIAL INVOICE BILLING APPLICATION

Production-grade, full-stack invoice billing web application crafted exclusively for **V.K.S. Weaving Centre** (Salem, Tamil Nadu).

---

## 1. System Overview & Technologies

- **Frontend Framework:** React 19, TypeScript, Vite
- **Styling Architecture:** Tailwind CSS implementing **Heritage Industrial Minimal** (`design.md`)
  - Primary Brand Anchor: Deep Burgundy (`#702C3B` / `#541626`)
  - Secondary Accent: Warm Gold (`#D4AE77`)
  - Typography: Inter with strict tabular numeric alignment (`font-feature-settings: "tnum" 1, "cv05" 1`)
- **Backend & Database:** Supabase (PostgreSQL 15+)
  - Live Database Endpoint: `https://uvxisrokqvpgmefxujlj.supabase.co`
  - Applied Migration: `supabase/migrations/20261017000000_init_vks_schema.sql`
  - Atomic Invoice Sequence Generation: PostgreSQL stored function `allocate_invoice_number`
  - Storage Bucket: `vks-media` (for brand logos, Lord Murugan devotional image, authorized signature)
- **Calculation Engine:** Decimal-safe arithmetic, intra-state (CGST + SGST) vs inter-state (IGST), HSN grouping, round-off, Indian currency words conversion.
- **Grayscale A4 Invoice Printing:** Dedicated `InvoicePrint` component strictly conforming to standard A4 portrait specifications with `@media print`.
- **Testing:** Vitest with jsdom and React Testing Library.

---

## 2. Key Features Implemented

1. **Dashboard:**
   - Real-time KPI tiles: Total Invoices, Invoices This Month, Total Billed, Outstanding Amount.
   - Recent invoices and payments activity tables with quick action navigation.
2. **Commercial Invoice Form:**
   - Customer dropdown selection or on-the-fly customer entry.
   - Separate Billed To and Shipped To addresses with "Same as billing" toggle.
   - Transport details: Vehicle number, transport agency, L.R. / consignment number and date.
   - Full-width line items table with live recalculations of weight (KG), meters (MTR), boxes, or pieces multiplied by unit rate.
   - Automatic intra-state (CGST 2.5% + SGST 2.5%) vs inter-state (IGST 5%) tax detection based on state codes.
   - Draft saving without consuming sequential bill numbers.
   - Finalization with atomic sequence numbering (`VKSW/YYYY/NNN`) and snapshot immutability.
3. **Invoice Register & Archive (History):**
   - Real-time search by invoice number, customer name, GSTIN, or DC number.
   - Multi-parameter filtering by date range, customer, payment status, and draft/finalized status.
   - Column sorting and pagination.
   - Actions: View, Print A4, Download PDF, Edit Draft, Duplicate into new draft, Delete draft.
4. **Grayscale A4 Printed Invoice:**
   - Strict grayscale styling: Light-gray headers (`#f3f3f3`), thin black/gray borders, charcoal text.
   - Zero website theme colors (no burgundy or gold) on printed invoices.
   - Lord Murugan devotional asset (`|| ஸ்ரீ முருகன்துணை ||`) header.
   - Exact four Terms & Conditions from master specification (Section 18).
   - Authorized Signatory: Optional uploaded signature image, or 100% blank space for physical manual signing by pen.
5. **Customer Management:**
   - Full CRUD directory with billing address, shipping address, GSTIN, state code, and contact person.
   - Live ledger of total billed, outstanding balance, and customer invoice history.
6. **Product Catalogue:**
   - Viscose, rayon, and cotton yarn counts, grey fabrics, and packaging items.
   - Default rates, standard units (KG, MTR, PCS, BOX, ROLL), and HSN/SAC codes.
7. **Payment Tracking & Audit:**
   - Record remittances (Bank Transfer, Cash, UPI, Cheque) linked to specific commercial bills.
   - Automatic reduction of invoice outstanding balance and payment status transitions (`UNPAID` -> `PARTIALLY_PAID` -> `PAID`).
8. **Financial Reports:**
   - Sales Register, Customer Summary, GST Tax Report (grouped by HSN), and Outstanding Receivables.
   - CSV export with spreadsheet formula injection prevention (`=`, `+`, `-`, `@` escaped).
9. **Business Settings:**
   - Persistent company profile, bank account details for NEFT/RTGS, invoice prefix/format, and print toggles.

---

## 3. Exact Master Terms & Conditions (Section 18)

The application enforces and prints **verbatim** the exact four terms and conditions:

```text
1. Interest will be charged @ 24% on bill, if payment not received within 30 days.
2.We are not responsible for any loss or damage in transit
3. Goods once sold cannot be taken back under any circumstances.
4. All disputes subject to SALEM Jurisdiction
```

---

## 4. Local Setup & Execution Commands

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone or navigate to the workspace
cd "d:\Invoice Billing\VKS_billing"

# Install dependencies
npm install
```

### Environment Configuration
The `.env` file is already pre-configured with the live Supabase credentials:
```env
VITE_SUPABASE_URL=https://uvxisrokqvpgmefxujlj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_aurHF8ZlFLCgb3Q41YL3Dw_OtUOKqMR
VITE_SUPABASE_ANON_KEY=sb_publishable_aurHF8ZlFLCgb3Q41YL3Dw_OtUOKqMR
```

### Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Test Suite
```bash
npm test
```
All 10 unit and integration tests run via Vitest.

### Build Production Bundle
```bash
npm run build
```

---

## 5. Database Schema & Migration

The complete PostgreSQL migration is located at:
`supabase/migrations/20261017000000_init_vks_schema.sql`

To re-apply or inspect the schema directly against Supabase:
```bash
node scripts/migrate.js
node scripts/setupStorage.js
```

---

## 6. Backup & Restore Guidance

### PostgreSQL Database Backup
Using standard PostgreSQL `pg_dump`:
```bash
pg_dump "postgresql://postgres:Jeeva08@12s@db.uvxisrokqvpgmefxujlj.supabase.co:5432/postgres" -F c -b -v -f vks_billing_backup.dump
```

### PostgreSQL Database Restore
```bash
pg_restore -d "postgresql://postgres:Jeeva08@12s@db.uvxisrokqvpgmefxujlj.supabase.co:5432/postgres" -v vks_billing_backup.dump
```
