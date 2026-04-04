# Sri Maadan Yatra — Quotation & Booking System Design Doc

**Status:** Draft
**Author:** Bhishma
**Date:** 2026-04-04
**Context:** 5-10 bookings/month, informal operations, family business

---

## 1. Problem Statement

Sri Maadan Yatra currently operates informally with manual processes. Before building any system, we need to:
1. Document current workflows
2. Identify high-leverage pain points
3. Solve problems incrementally without over-engineering

**Non-goal:** Building a complete end-to-end system right now.

---

## 2. Current State

### What exists
- HTML-based quotation generator (works offline, generates PDFs)
- Manual tracking (WhatsApp, phone calls, memory)

### Current workflow (assumed, needs validation)
```
Lead comes in (WhatsApp/call/referral)
    ↓
Discuss requirements (destination, dates, budget, pax)
    ↓
Create quotation (using HTML tool)
    ↓
Send PDF via WhatsApp/email
    ↓
Follow up manually
    ↓
If confirmed → Collect deposit
    ↓
Book flights, hotels, transfers (manual)
    ↓
Send itinerary/vouchers
    ↓
Trip happens
    ↓
Collect balance, feedback
```

### Pain points to validate
- [ ] Losing track of follow-ups?
- [ ] Quotation versioning issues?
- [ ] Difficulty finding past quotations?
- [ ] Payment tracking problems?
- [ ] Supplier booking coordination?
- [ ] Customer communication scattered?

---

## 3. Requirements (Draft)

### Must have (P0)
- Generate professional quotations (✓ already exists)
- Save/retrieve past quotations
- Track quotation status (sent, followed-up, confirmed, lost)
- Basic customer information storage

### Should have (P1)
- Follow-up reminders
- Payment tracking (deposit received, balance due)
- Search quotations by customer/destination/date

### Nice to have (P2)
- Booking management (flights, hotels, transfers)
- Supplier payment tracking
- Automated WhatsApp/email follow-ups
- Analytics/reporting

### Not needed now
- Multi-user/roles (it's just dad for now?)
- Inventory management
- Complex accounting
- API integrations

---

## 4. Options Evaluation

### Option A: Keep it simple — Google Sheets + Current HTML Tool

**How it works:**
- Use existing HTML tool for PDF generation
- Google Sheet as "database" for tracking
- Columns: Customer, Destination, Quotation#, Amount, Status, Follow-up Date, Notes

**Pros:**
- Zero development needed
- Dad probably already knows Sheets
- Works on phone
- Free
- Can start today

**Cons:**
- No automation
- Manual data entry (but you have 5-10/month)
- PDFs not linked to sheet entries

**Verdict:** Best starting point. Validates workflows before building anything.

---

### Option B: Notion / Airtable

**How it works:**
- Database with relations (Customers → Quotations → Bookings)
- Templates for quotations
- Kanban view for pipeline
- Reminders and automations

**Pros:**
- Visual pipeline management
- Relations between data
- Mobile apps
- Some automation (reminders, status changes)
- Low/no-code

**Cons:**
- Learning curve for dad
- Free tier limitations (Airtable: 1000 records, Notion: limited automations)
- Quotation PDF generation needs workaround

**Cost:** Free tier likely sufficient, paid ~$10-20/month

**Verdict:** Good middle ground if Sheets feels limiting after a few months.

---

### Option C: Refine + Supabase + Vercel

**How it works:**
- Custom React app with Refine framework
- Supabase for database + auth
- Deploy to Vercel

**Pros:**
- Fully customized to your workflow
- Professional, scalable
- You control everything
- Good learning project

**Cons:**
- Development time (weeks to build properly)
- Maintenance burden on you
- Overkill for 5-10 bookings/month
- Dad depends on you for changes

**Cost:** Free tier covers this scale

**Verdict:** Makes sense at 50+ bookings/month or when workflows are proven.

---

### Option D: ERPNext

**How it works:**
- Full ERP with CRM, Sales, Accounting modules
- Self-hosted or Frappe Cloud

**Pros:**
- Complete business system
- Indian company, good GST support
- Open source

**Cons:**
- Massive overkill for this scale
- Steep learning curve
- Self-hosting complexity or $50+/month cloud
- Rigid workflows may not fit travel business
- No travel-specific features

**Cost:** Self-host (your time) or $50+/month (Frappe Cloud)

**Verdict:** Not recommended. Built for manufacturing/trading, not services.

---

### Option E: Travel-specific software

Examples: TraveloPro, TripCreator, Moonstride, Tourwriter

**Pros:**
- Built for travel agencies
- Quotation, booking, supplier management included
- Industry workflows built-in

**Cons:**
- Expensive ($50-200+/month)
- Overkill for 5-10 bookings
- Lock-in to their way of doing things
- Often requires training

**Verdict:** Consider when hitting 30-50+ bookings/month with staff.

---

### Option F: WhatsApp Business + Simple Database

**How it works:**
- WhatsApp Business for customer communication (labels, quick replies)
- Simple web app or even just the enhanced HTML tool with localStorage
- Export/backup to JSON

**Pros:**
- Customers already on WhatsApp
- Labels help track status
- Quick replies for common responses
- No behavior change for dad

**Cons:**
- Limited automation
- Data lives in browser (localStorage) or needs simple backend

**Verdict:** Worth exploring as enhancement to current setup.

---

## 5. Recommendation

### Phase 0: Validate workflows (Now - 2 weeks)
1. **Don't build anything yet**
2. Use Google Sheets to track the next 5-10 quotations
3. Document what's painful, what's working
4. Identify the ONE thing that would save the most time

Suggested Sheet columns:
```
Date | Customer | Phone | Destination | Pax | Dates | Amount | Status | Follow-up | Notes
```

Status values: `New → Sent → Following Up → Confirmed → Lost`

### Phase 1: Enhance current tool (If persistence is the pain point)
- Add localStorage to HTML tool (save/load quotations)
- Add quotation list view
- Export to JSON for backup
- This is ~1 day of work

### Phase 2: Simple backend (If search/history becomes painful)
- Supabase for data storage
- Keep the HTML tool as frontend
- Add basic CRUD
- This is ~1 week of work

### Phase 3: Full app (When volume justifies)
- Refine or similar framework
- Proper customer management
- Follow-up automation
- Consider at 30-50+ bookings/month

---

## 6. Questions to answer before building

1. Who uses this? Just dad, or others too?
2. What device? Desktop, phone, both?
3. Where do leads come from? (WhatsApp, calls, website, referrals?)
4. What's the most time-consuming part of current workflow?
5. What information gets lost or is hard to find?
6. How are payments tracked currently?
7. Is GST invoicing needed?

---

## 7. Technical notes (for later phases)

### If we go with Supabase + simple frontend:

**Schema:**
```sql
-- Minimal schema for Phase 2
customers (
  id uuid primary key,
  name text not null,
  phone text,
  email text,
  created_at timestamp default now()
)

quotations (
  id uuid primary key,
  customer_id uuid references customers,
  number text unique,  -- QT-2026-001
  data jsonb,          -- Store full quotation as JSON (flexible)
  total numeric,
  status text,         -- draft, sent, confirmed, lost
  created_at timestamp default now(),
  updated_at timestamp default now()
)
```

Using JSONB for quotation data keeps flexibility while we figure out the schema.

### Deployment (when ready):
- **Vercel:** Free tier, automatic deploys from GitHub
- **Supabase:** Free tier (500MB DB, sufficient for years at this volume)
- **Domain:** Optional, Vercel provides free subdomain

---

## 8. Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-04 | Start with Google Sheets | Validate workflows before building |
| | | |

---

## Next steps

1. [ ] Review this doc with dad
2. [ ] Answer the questions in section 6
3. [ ] Set up tracking sheet
4. [ ] Use it for 2 weeks
5. [ ] Revisit and decide on Phase 1
