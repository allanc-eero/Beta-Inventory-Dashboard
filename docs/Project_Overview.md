Beta Inventory Dashboard — Project Overview

What Is This?

The Beta Inventory Dashboard is a web-based tool built to manage the full lifecycle of eero hardware devices that get shipped to testers across beta, dogfood, and other testing programs. It replaces the manual spreadsheet tracking process with a centralized platform where you can see every device, who has it, what program it belongs to, and whether it's online or not.

It runs locally in a browser — no server or cloud setup required. All data persists in the browser's local storage.


The Problem It Solves

Before this tool, device tracking lived in spreadsheets. When someone emailed asking "where's my device?" or a program ended and 77 devices needed to be returned, the team had to dig through multiple tabs, cross-reference tracking numbers, and manually send emails. There was no single view of who had what, which devices were online, or which testers had participated in previous programs.

This dashboard gives the team one place to:
- See all devices and their current status at a glance
- Look up any tester and see exactly what devices they have
- Import new program allocations from a CSV and have everything auto-populate
- Close out programs with one workflow (archive, brick, or return devices)
- Track shipments across both legs (warehouse to FC, FC to tester)
- Link directly to eero's admin and Insight dashboards from any device


What You'll See in the Demo

Dashboard Stats — The top row shows live counts: total devices, online, not online, countries, programs, people, and overdue devices.

Devices Tab — A searchable, filterable table of all devices. Click any serial number to open the full device detail panel showing hardware info, assignment, logistics, contact emails, and a device timeline. You can edit fields inline, export device info as a CSV, and click the Admin ID or Network ID to jump directly to eero's admin or Insight dashboards.

Programs Tab — Shows active programs with device counts (total/online/offline). The "Close Program" workflow lets you decide what happens to each device: archive it, brick it via the Partner API, or mark it for return. After processing, the system generates return emails and saves the full history. Archived programs remain viewable with clickable serial numbers that trace back to the tester's profile.

People Tab — A directory of all testers derived from device assignments. Search by name or email. Click a person to see all their devices, statuses, and history. You can record opt-outs with reasons. This is where you go when someone emails asking about their device.

Import — Drag and drop a CSV to import devices. The system matches columns flexibly (supports multiple naming conventions), upserts by serial number (updates existing devices, adds new ones), and auto-creates tester profiles. If a tester is already known from a previous program, their country, location, contact email, network ID, and other stable info auto-fills onto the new device.

Shipments Tab — Track device shipments across two legs with carrier and tracking info.

Network Sync — A button that (in production) polls the eero Partner API to detect which devices have come online, automatically updating their status.


Key Feature: Tester Profiles

This is the biggest workflow improvement. The system maintains a persistent profile for each tester, keyed by their email address. The profile stores their name, country, location, contact email, alternate email, network ID, and admin ID.

When a new program launches and you import a spreadsheet with new serial numbers, you only need to provide the serial number and the tester's email. The system recognizes the email, pulls their profile, and auto-fills everything else. No more re-entering the same tester info across programs.

Profiles are created and updated automatically every time data is imported.


Key Feature: Clickable Links to eero Systems

Throughout the app, Admin IDs and Network IDs are clickable links:
- Admin ID opens https://admin.e2ro.com/users/{id}
- Network ID opens https://insight.eero.com/networks/{id}

This means you can go from the dashboard directly into eero's internal tools without copying and pasting IDs.


How Data Gets In

There are three ways to get device data into the system:

1. CSV Import — The primary method. Use the template in docs/Device_Intake_Template.csv. Core columns needed: Serial Number, Tester Email, Program, SKU/Config. Everything else either auto-fills from tester profiles or can be added later.

2. Add Device Modal — Manual entry for one-off additions. Type a known email and the system auto-fills from their profile.

3. Seed Data — The demo ships with pre-loaded Australian beta tester data so you can explore the interface immediately.


How a Program Closes

1. Go to Programs tab
2. Click "Close Program" on the active program
3. For each device, choose: Archive, Brick & Return, or Return to eero
4. Click "Close Program & Process"
5. The system deactivates devices, generates return emails, and saves the full record
6. The program moves to "Archived Programs" with all serial numbers still clickable


Tech Summary (for context)

- Built with Next.js (React) and TypeScript
- Styled with Tailwind CSS
- State managed with Zustand (persists to localStorage)
- CSV parsing via PapaParse
- No backend server or database — runs entirely in the browser
- To run: npm install, then npm run dev, open http://localhost:3000


Current Status

This is a working prototype/demo. The core workflows are functional:
- Device CRUD and detail views
- CSV import with upsert and profile auto-fill
- Program close workflow with email generation
- People lookup and opt-out tracking
- Clickable links to eero admin/Insight

What's stubbed (would need real integration for production):
- Partner API calls (network sync, device bricking) — the UI flow works but doesn't hit real endpoints without an API token
- Multi-user access — currently single-user, browser-local
- Server-side persistence — would need a database for team-wide use
