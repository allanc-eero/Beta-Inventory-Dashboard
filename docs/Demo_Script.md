# Demo Script — eero Fetch
**Duration:** 30 minutes  
**Audience:** Beta team / stakeholders

---

## Opening (2 minutes)

So the problem we've been dealing with is managing hundreds of beta and dogfood devices across multiple regions using spreadsheets. Every time someone asks me "where is device X?" or "how many devices are actually online right now?", I have to dig through tabs, cross-reference tracking numbers, and ping testers on Slack. I built this platform to replace that entire workflow with a single source of truth that stays current by syncing directly with the eero Partner API.

---

## 1. The Dashboard — Instant Visibility (3 minutes)

When I open the platform, the first thing I see is this stats bar at the top — total devices, how many are online, how many are offline, and the overdue count. This is what I check every morning. No digging required.

Below that, you'll see the Network Status Sync panel. This connects to the eero Partner API once a day and automatically detects which devices have come online. So if a tester plugs in their device at 2 AM, by the time I check the dashboard in the morning, it's already reflected here. Let me click "Sync Now" to show you — watch how the online count updates in real time.

---

## 2. Uploading an Allocation List (5 minutes)

Let me go to the Shipments tab. This is where the real workflow lives. When I get an allocation list from the fulfillment center — you know, the Excel file with names, tracking numbers, and serial numbers — I upload it directly here.

I'll click the upload area and select a file. Watch how it auto-detects the columns — ShipTo, TrackingNumber, Alias, DSN 1, DSN 2 — without me having to reformat anything. The preview table shows me each tester, their tracking number, and which serials they're getting. I can verify everything looks right before importing.

I'll set the carrier to DHL, pick the ship date, select the program as Beta, and hit Import. There — you can see the success message showing how many devices were created or updated. If I switch to the Shipment History tab, the upload is logged permanently. I can always go back and see what was imported, when, and how many devices were in each batch.

---

## 3. The Device List — Finding Anything Fast (4 minutes)

Back on the Devices tab — this is the full device table with all the columns: serial, model, internal name, program, assigned to, status. If I type a tester's name in the search bar, it instantly filters. I can also use the Program dropdown to show only Beta devices, or filter by status.

Let me click on a specific device to show you the detail page. On the left I have all the device info — model, manufacturer, revision, MAC, firmware. In the middle is the assignment and logistics — who has it, where it is, tracking numbers. On the right are notes, testbed info, and contact details. This is the single page of truth for any device. Everything about it lives here.

---

## 4. Device Intelligence — Firmware, Health, JIRA (5 minutes)

If I scroll down on the device detail page, you'll see four panels at the bottom. This is what I call the intelligence layer.

The Firmware panel compares the device's current firmware to the latest available version and flags outdated devices. If a device is behind, I can push an update right from here.

The Network Health panel — let me click "Run Speed Test." See the results? Here's the cool part: if a device's speed drops more than 30% after a firmware update, the system automatically flags it as a regression and creates a JIRA ticket. I catch problems before testers even report them.

The JIRA Tickets panel shows all tickets linked to this device. Tickets get auto-created for regressions, overdue returns, and deactivations. I can also manually create one from here. Everything links back to the device.

And the Attachments panel — I can attach RMA forms, shipping receipts, or photos directly to the device record. No more hunting through email for that one PDF someone sent three weeks ago.

---

## 5. The Device Timeline — Full Audit Trail (3 minutes)

Let me scroll down a bit more to the Device Timeline. This is the complete history of everything that's ever happened to this device — when it was shipped, when it came online, firmware updates, JIRA tickets created, speed tests run. Every action is timestamped and shows who did it.

Here's why this matters: when a tester reports a problem and says "it broke last Tuesday," I can look at the timeline and see exactly what changed on that date. Was there a firmware update? Did the device go offline? Did someone push a config change? This eliminates guesswork completely.

---

## 6. Returning a Device (5 minutes)

This is probably the most impressive workflow I built. Let me click the red "Return to eero" button. See how it opens a full-page form — not a tiny popup — with the device summary at the top so I can confirm I'm returning the right unit.

I'll walk through the reason dropdown. If I select "Defective / Hardware issue," look at the "What will happen" section — it clearly lists every action that's about to take place: device gets deactivated, JIRA ticket created in the correct epic based on the program, return email drafted to the tester, and a shipping label generated for printing.

Let me hit Submit. See — my email client opens with a pre-filled draft addressed to the tester, with return instructions and all the device details. And here's the shipping label popping up ready to print. I just attach it to the email and send.

Now let me go back and show you what happens if I select "Lost / Unrecoverable" instead. See how the UI changes? The red confirmation box appears, the button turns red and says "Brick & Deactivate Device." This is the only scenario where we remotely brick the device via the Partner API — it'll never connect to a network again. For all other return reasons, the device stays functional. We only brick when it's truly gone.

---

## 7. Programs — End of Life Management (3 minutes)

Let me navigate to the Programs tab. These cards show each program with device counts and online/offline breakdowns. When a program ends — say Beta for Merci is complete — I click "Close Program" and decide what happens to every device.

Here's the closure view. I see every device in the program with a dropdown: Return to eero or Archive. I can use the "Set all to" buttons to bulk-apply a decision, or handle devices individually. The summary at the bottom shows me how many will be returned versus archived. This prevents devices from sitting in limbo after a program ends — every device gets a clear disposition.

---

## Closing (2 minutes)

So what I've shown you is a platform that handles the full device lifecycle — from the moment a shipment list arrives to the moment a program closes. It syncs with the Partner API daily so I'm not manually checking which devices are online. It creates JIRA tickets automatically. It generates return emails and shipping labels. And it maintains a complete audit trail of every device so I can answer any question about any unit in seconds.

What's coming next: user authentication so everyone can log in with their own account, a tester self-service portal so they can check their own device status without pinging me, and export/reporting for leadership visibility.

Bottom line — this replaces the spreadsheet. Everything is in one place, it stays current automatically, and I can answer any question about any device in seconds instead of minutes.
