# eero Fetch — Project Overview

## Overview

eero Fetch (formerly "Beta Inventory Dashboard" / "Simplified Inventory Dashboard") is a web-based tool that manages the full lifecycle of eero hardware shipped to beta and dogfood testers. It replaces fragmented spreadsheet tracking with a centralized platform that surfaces, in one view, every device, its owner, the program it belongs to, and its online status.

The current build runs locally in the browser, with all data persisted to local storage — no server or cloud infrastructure required. A database migration (Supabase or DynamoDB) is planned for production launch.

## The Problem It Solves

Device tracking previously lived across spreadsheet tabs, Slack forms, and email threads. Routine questions — "Where's my device?" or "We need to recall 77 units from a closing program" — required cross-referencing tracking numbers, hunting through tabs, and manually drafting emails. Dogfood sign-ups went through a Slack workflow into an Excel sheet with no unified view of onboarding status. There was no unified view of who held what, which devices were online, or which testers had participated in prior programs.

eero Fetch consolidates this into a single source of truth, enabling the team to:

- View every device and its current status at a glance
- Look up any tester and instantly see their assigned hardware
- Import program allocations from a CSV with auto-populated metadata
- Close out programs through a guided workflow (archive, brick, or return)
- Track shipments across both legs (warehouse → FC, FC → tester)
- Jump directly into eero's admin and Insight dashboards from any device record
- Onboard new dogfooders through a self-service registration flow
- Track dogfooder onboarding pipeline from signup through shapeshift completion

## What's New (Latest Updates)

### Rebranded to "eero Fetch"
The platform has been renamed from "Beta Inventory Dashboard" / "Simplified Inventory Dashboard" to **eero Fetch** — a name that ties into eero's mesh product and the dogfood culture ("fetch" as both a dog command and data retrieval).

### Role-Based Access Control (RBAC) — Fully Implemented
Four active roles with distinct access levels:

| Role | Access |
|------|--------|
| **Super Admin** | Full platform control — code, UI, user management, all destructive actions |
| **Admin** | Can brick, archive, close programs, upload shipments, edit devices, send return emails |
| **Beta Viewer** | Read-only admin dashboard. Can see devices, programs, people, history. Cannot edit, brick, archive, sync, create JIRA tickets, or upload documents. Restricted from Packages, Shapeshift, and Ingestion & Returns tabs |
| **Dogfooder** | Self-service portal only. Sees own devices, own programs, can report issues and upload videos. Cannot see other testers' data or admin tools |

Access is roster-based — only explicitly listed @eero.com emails can log in. No automatic access for any email.

### Dogfooder Self-Registration (Multi-Step Form)
Any @eero.com employee can register as a dogfooder through a 4-step form that collects:

1. **Step 1:** First name, last name, eero email
2. **Step 2:** Phone OS (iOS/Android), eero network status, network email, test group preference (latest firmware vs. more mature)
3. **Step 3:** Shipping address (street, apt, city, state, zip) + optional work address
4. **Step 4:** Phone number with country code, production eero account email, home square footage

This replaces the previous Slack form → Excel sheet workflow. Registration data is stored with the account and immediately visible to admins in the Dogfooders onboarding tab.

### Dogfooder Portal
Registered dogfooders are routed to a dedicated portal with 5 tabs:

1. **My Dashboard** — Welcome screen, program badges, stat cards (device count, programs, issues reported)
2. **My Devices** — Table of devices assigned to them (model, serial, status, program, network) + "Other Devices on My Network" section showing shared devices
3. **My Programs** — Cards per program showing enrolled devices with statuses
4. **Report Issue** — Form to submit feedback (bug, positive experience, feature request, hardware issue) tied to a specific device
5. **Videos** — Drag-and-drop upload zone for videos + team shared videos section

Device linkage is automatic: when an admin uploads a CSV with `assignedEmail: lalitha@eero.com`, those devices immediately appear in Lalitha's portal.

### Dogfooders Onboarding Tab (Admin)
A new "Dogfooders" tab on the far right of the admin navbar provides a full onboarding pipeline view:

**Pipeline statuses:** New Registration → Contacted by Beta → Hardware Ordered → Waiting on Scheduling → Scheduled Shapeshift → Complete → Unresponsive → Reclaim Units

**Features:**
- Clickable stat cards at the top for quick filtering by status
- Search by name or email
- Status dropdown on each row to move people through the pipeline
- Expandable detail row per person showing:
  - Contact & address info (auto-populated from registration)
  - Hardware order #, tracking #, delivery status
  - App invite sent date, provisioned checkbox
  - Network admin link
  - Follow-up date, shapeshift scheduled date
  - Outreach count
  - Notes field

This replaces the multiple Excel tabs (Slack Responses, Shipment Tracking, iOS/Android App Access, Reporting) with a single live view.

### Service Board & Service Orders
A Kanban-style board for tracking lab work from request to close. Service orders are created from JIRA tickets or manually, with statuses: Open → In Progress → Complete → On Hold → Closed 30d → Cancelled. The Overview Dashboard shows a segmented bar chart of service order distribution.

### Overview Dashboard Enhancements
- Segmented bar chart for Service Orders with separated colored sections per status
- "By Job Type" breakdown (Returned to eero, Defective, End of program, Lost, Outbound Shipment, Other)
- "By Priority" breakdown from JIRA tickets
- Top assignees for open work

## What You'll See in the Demo

1. **Login Page** — Single sign-in field for @eero.com accounts with "Dogfooder? Register here →" link for self-registration
2. **Overview Dashboard** — Live summary: total devices, online/offline, service orders bar chart, job type breakdown, priority view
3. **Devices Tab** — Searchable, filterable table. Detail panel with hardware specs, assignment, logistics, timeline, JIRA tickets, attachments, firmware, health metrics. Admin-only: edit, brick, create JIRA, upload attachments
4. **Programs Tab** — Active programs with device counts. Close Program workflow for admins; read-only view for Beta Viewers
5. **Locations Tab** — Geographic distribution of devices
6. **People Tab** — Tester directory with profiles, assigned devices, opt-out tracking
7. **Packages Tab** — Inbound/outbound package tracking (admin-only)
8. **Shapeshift Tab** — Shapeshift job tracking (admin-only)
9. **Ingestion & Returns Tab** — CSV import, shipment tracking, return management (admin-only)
10. **Dogfooders Tab** — Onboarding pipeline for tracking registrants through to fully onboarded (admin-only)

## Key Feature: Automatic Device-to-Account Linkage

When a dogfooder registers with `lalitha@eero.com` and an admin later uploads a CSV with that email in the assignment column, the devices automatically appear in Lalitha's portal. The system matches on:

- `assignedEmail` (primary — email match)
- `contactEmail` (secondary — email match)
- `assignedTo` (tertiary — name match)
- `checkedOutTo` (quaternary — name match)

No manual pairing needed. Registration can happen before or after device assignment — the query is live.

## Key Feature: Tester Profiles

Persistent tester profiles are keyed by email. Each profile stores name, country, location, contact and alternate emails, network ID, and admin ID.

When a new program launches, imports only need a serial number and tester email — the system recognizes returning testers and auto-fills the rest. No more re-entering the same details across programs.

## Key Feature: Direct Links to eero Systems

Admin and Network IDs are clickable throughout the app:

- Admin ID → https://admin.e2ro.com/users/{id}
- Network ID → https://insight.eero.com/networks/{id}

This eliminates copy-paste friction when moving between the dashboard and eero's internal tooling.

## How Data Gets In

Four ingestion paths:

1. **CSV Import (primary)** — Use the template in docs/Device_Intake_Template.csv. Required columns: Serial Number, Tester Email, Program. Everything else either auto-fills from existing profiles or can be added later.
2. **Add Device Modal** — Manual entry for one-offs. Typing a known email triggers profile auto-fill.
3. **Dogfooder Self-Registration** — Dogfooders register themselves; their profile data is immediately available for device assignment.
4. **Seed Data** — The demo ships pre-loaded with beta tester data so the interface is immediately explorable.

## Closing a Program

1. Open the Programs tab
2. Click Close Program on the active program (Admin/Super Admin only)
3. For each device, select: Archive, Brick & Return, or Return to eero
4. Set actions per-region or per-device
5. Preview changes with a dry run
6. Click Process — the system deactivates devices, generates return emails, and saves the full record
7. The program moves to Archived Programs with serial numbers still linked to tester profiles

Beta Viewers can view program details but cannot take any actions.

## User Roster

### Elevated Access (Admin Dashboard)

| Email | Role |
|-------|------|
| allanc@eero.com | Super Admin |
| haley.swanson@eero.com | Admin |
| josht@eero.com | Admin |
| melanie.thorum@eero.com | Admin |
| shelby@eero.com | Admin |
| vrabago@eero.com | Admin |

### Beta Viewers (Read-Only Admin Dashboard)

aaron@eero.com, deep@eero.com, diego.kim@eero.com, jeffrey.bell@eero.com, john.pelebo@eero.com, lalitha@eero.com, layton.hill@eero.com, philip.rivera@eero.com, johnlushenko@eero.com, matthew.mullin@eero.com, stacia@eero.com

### Dogfooders

Any @eero.com employee can self-register. Account is created instantly with the `dogfooder` role.

## Tech Summary

- Built with Next.js (React) and TypeScript
- Styled with Tailwind CSS
- State managed with Zustand (persists to localStorage)
- CSV parsing via SheetJS (XLSX)
- JIRA integration via REST API (auto-creates tickets for shipments and returns)
- No backend server or database — runs entirely in the browser
- To run: `npm install`, then `npm run dev`, open http://localhost:3000

## Current Status

This is a working prototype with live workflows. Core features functional:

- Device CRUD and detail views
- CSV import with upsert and profile auto-fill
- Program close workflow with email generation
- People lookup and opt-out tracking
- Clickable links to eero admin/Insight
- Role-based access control (4 roles)
- Dogfooder self-registration with multi-step form
- Dogfooder portal with device/program/issue views
- Admin onboarding pipeline (Dogfooders tab)
- Service Board with Kanban-style tracking
- JIRA ticket creation for shipments and returns
- Network status sync (simulated, ready for real API)

### What's Stubbed (Needs Integration for Production)

- **Partner API calls** — Network sync and device bricking work in the UI but don't hit real endpoints without an API token
- **Database** — Currently localStorage; planned migration to Supabase or DynamoDB for persistence across browsers/devices
- **Email service** — Uses mailto: links; needs real email integration (Amazon SES) for delivery tracking
- **Slack webhook** — Planned for new dogfooder registration notifications
- **Video storage** — Upload UI exists but needs cloud storage backend (S3)
- **Dogfooder account persistence** — Currently in localStorage; needs database for cross-device access
