# Documentation

Drop any reference documents here (PDFs, spreadsheets, markdown, etc.) and reference them in chat using #File or #Folder.

## Reference Documents

### eero Partner API (latest)

**File:** `PartnerAPI_vlatest` (PDF, located in workspace root)

A comprehensive API reference covering the eero Partner API v2.2/v2.3 endpoints. Key sections include:

- **Support Info API** – Get support contact info by serial (`GET /2.2/eeros/:serial/support`)
- **Deactivation API** – Activate/deactivate eero devices (`POST /2.2/eeros/:id/activation_state`)
- **Organization Users API** – Manage org staff (`GET/POST/DELETE /2.3/organization_users`)
- **Network Creation** – Steps to create and associate networks with eeros
- **Network Outages API** – Point-in-time outages, counts, locations, per-network outages
- **Bandwidth API** – Aggregated bandwidth usage, per-network daily usage
- **Firmware API** – Trigger network firmware updates (`POST /2.2/networks/:id/updates`)
- **eero for Business** – Subnets, captive portals, ethernet port associations
- **eero for Communities (MDU)** – Subsets, unit association, IoT SSIDs, network modes, self-serve activation
- **eero Provision API** – Provision/deprovision eeros for Business networks
- **Organization Settings** – RIPV2 PSK management
- **Regulatory Tests** – Profiles, cohorts, network associations
- **Performance Tests** – Latency, DNS RTT, speed tests, summaries
- **Insight Exchange API** – Data aggregation jobs and artifact downloads

**Rate Limits:** Some endpoints (e.g., support info) are rate-limited at 3 requests/minute.

**Auth Token Types:** Admin, Agent, PropertyManager, ISP-* roles (varies by endpoint).

Partner API Documentation
Version latest
Contents
Change Log 9
Version 2.6.8 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Version 2.6.7 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Version 2.6.6 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Version 2.6.5 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Version 2.6.4 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Version 2.6.3 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
Version 2.6.2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
Version 2.6.1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
Version 2.6.0 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
Version 2.5.2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
Version 2.5.1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
Version 2.5.0 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
Version 2.4.0 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
Version 2.3.0 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Version 2.2.0 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Version 2.1.17 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Version: 2.1.16 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Version: 2.1.15 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Version: 2.1.14 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Version: 2.1.13 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Version: 2.1.12 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
Version: 2.1.11 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
Version: 2.1.10 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
Version: 2.1.9 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
Version: 2.1.8 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
Version: 2.1.7 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
Version: 2.1.6 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
Version: 2.1.5 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
Version: 2.1.4 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
Version: 2.1.3 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
Version: 2.1.2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
Version: 2.1.1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
Version: 2.1.0 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
Version: 2.0.0 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
Version: 1.9.1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
Version: 1.9 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
Version: 1.8.1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
Version: 1.8 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
Version: 1.7.1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
1 AMAZON CONFIDENTIAL
Version: 1.7 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . Version: 1.6 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . Version: 1.5 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15
15
15
API Technical Overview 16
API Design Philosophy . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . API Tokens . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . API Structure . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . Request Headers . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . Response Format . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 16
16
16
16
17
Getting Started with eero’s Public APIs 20
Initial Steps . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 20
cURL Steps . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 20
Generate Unverified Access Token . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 20
Verify Access Token . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 21
Create API Request . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 21
Python Steps . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 22
Generate Unverified Access Token . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 22
Verify Access Token . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 22
Create API Request . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 23
Postman Steps . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 23
Generate Unverified Access Token . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 23
Verify Access Token . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 25
Create API Request . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 25
Authentication 27
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 27
Step 1: Create an Unverified Session . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 27
Step 2: Verify the Session . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 27
Revoke an API Token . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 28
Networks API 30
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 30
Summary Network Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 30
Full Network Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 30
Ethernet Status Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 33
Eero Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 33
IPv6 Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 34
Name Servers Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 34
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 34
Create a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 34
Legacy Mode Toggle . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 35
Deactivate 5GHz Radio . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 36
Reactivate 5GHz Radio . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 36
Get All Administered Networks . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 36
Get All Untransferred Networks . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 37
Get All Pending Networks . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 38
Get Slow Network Counts By Day . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 38
Get A Single Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 39
Update the SSID of a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 40
Update the Password of a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 40
Delete a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 41
Reboot a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 41
Update a Network’s Configuration Settings . . . . . . . . . . . . . . . . . . . . . . . . . . . . 42
2 AMAZON CONFIDENTIAL
Get eeros on the Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 43
Run a Speed Test on the Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 43
Get a List of a Network’s Speed Tests . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 44
Transfer a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 44
Resend linking email (if network is unverified) . . . . . . . . . . . . . . . . . . . . . . . . . . . 45
Get Guest Network for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 45
Create Guest Network for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 46
Update Password of Guest Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 46
Set a network’s custom label (aka the “Home Identifier”) . . . . . . . . . . . . . . . . . . . . . 47
Get a network’s custom label (aka the “Home Identifier”) . . . . . . . . . . . . . . . . . . . . . 48
Set a network’s “nickname” . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 48
Get a network’s “nickname” . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 49
Disassociate a Network from an Organization . . . . . . . . . . . . . . . . . . . . . . . . . . . 49
Create a Temporary Admin for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 50
Get Public Static IP for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 50
Update Public Static IP for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 51
Set a network public static IP for a network . . . . . . . . . . . . . . . . . . . . . . . . . . . . 51
MultistaticIP Settings Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 52
MultistaticIP Settings Nat PortFwd Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 52
Organization network and user subscription creation . . . . . . . . . . . . . . . . . . . . . . . . . . 53
Create Network requirements . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 53
Network creation and user subscription . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 54
Data Plan API 56
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 56
Data Plan Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 56
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 56
Update or create a new network data plan . . . . . . . . . . . . . . . . . . . . . . . . . . . . 56
Get the data plan for a network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 57
Delete a network’s data plan . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 57
IPv4 Port Forwarding API 59
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 59
Port Forwarding Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 59
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 59
Get Port Forwards for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 59
Create a Port Forward for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 59
Edit a Port Forward for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 60
Delete a Port Forward for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 61
IPv4 Reservations API 62
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 62
Network Reservation Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 62
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 62
Get Current Set of IP Reservations on a Network . . . . . . . . . . . . . . . . . . . . . . . . . 62
Create a New IP Reservation on a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . 62
Edit an IP Reservation on a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 63
Delete an IP Reservation on a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 64
IPv6 Pinhole Management API 65
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 65
Summary Pinhole Response Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 65
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 65
Create a new pinhole . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 65
Retrieve all pinholes for a specified network . . . . . . . . . . . . . . . . . . . . . . . . . . . . 66
3 AMAZON CONFIDENTIAL
Retrieve a single pinhole that exists for a network . . . . . . . . . . . . . . . . . . . . . . . . . 67
Modify an existing pinhole . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 67
Remove an existing pinhole . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 68
Customer Account API 69
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 69
Customer Account Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 69
Subscription Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 69
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 70
Create a new customer account . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 70
Get a customer account . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . Update an existing customer account . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 71
71
Delete a customer account . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 72
Subscription API 74
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 74
Subscription Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 74
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 74
Create a new subscription . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 74
Get a subscription by ID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 75
Get a subscription by partner account ID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 75
Delete a subscription by ID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 76
Delete a subscription by partner account ID . . . . . . . . . . . . . . . . . . . . . . . . . . . . 76
Query for subscriptions managed by an organization . . . . . . . . . . . . . . . . . . . . . . . 77
eero Secure+ API 79
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 79
eero Secure+ Subscription Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 79
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 79
Get eero Secure/Secure+ information for a Network . . . . . . . . . . . . . . . . . . . . . . . 79
Subscribe a Network to eero Secure+ . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 80
Cancel a subscription to eero Secure+ . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 81
Devices & Profiles APIs 82
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 82
Device . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 82
Profile . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 83
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 84
Get all profiles in a network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 84
Create a Profile for a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 84
Get a specific profile for a network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 85
Update the state of a profile . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 85
Pause or Unpause all Profiles . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 86
Delete a Profile . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 86
Get Devices Connected to the Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 86
Get a List of Blacklisted Devices . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 87
Block Client Device . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 87
Unblock Client Device . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 88
eeros API 89
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 89
Searched eero Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 89
Vlan Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 89
Pppoe Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 89
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 90
4 AMAZON CONFIDENTIAL
Add eeros to The Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 90
Update eeros on the Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 90
Get an eero by ID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 91
Get by eero Serial Number . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 91
Remove an eero from a network by eero Serial Number . . . . . . . . . . . . . . . . . . . . . 92
Reboot an eero . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 92
Set Eero PPPoE Settings . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 93
Delete Eero PPPoE Settings . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 94
Get Pre Setup Config by Serial . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 94
Get Support info by Serial . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 95
eero Deactivation API 96
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 96
Deactivation Response Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 96
Deactivated eero Response Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 96
Deactivated eero Response Collection . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 96
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 96
Deactivate/Activate an eero device by serial . . . . . . . . . . . . . . . . . . . . . . . . . . . 96
Get activation state for an eero device . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 98
Get All Deactivated Devices . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 98
Organization Users API 100
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 100
User . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 100
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 100
Get All Users In The Organization . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 100
Get A Single User In The Organization . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 101
Commission Users To Join The Organization . . . . . . . . . . . . . . . . . . . . . . . . . . . 102
Decommission A User From The Organization . . . . . . . . . . . . . . . . . . . . . . . . . . 102
Resend User Invite To Join Organization . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 103
Organization network and user subscription creation . . . . . . . . . . . . . . . . . . . . . . . . . . 103
Create Network 105
Requirements . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 105
Steps to Create a Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 105
Network Outages API 106
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 106
Point In Time Network Outages Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 106
Network Outage Counts Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 106
Network Outage Locations Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 106
Networks With Outages Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 106
Single Network Outages Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 106
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 107
Get Point In Time Outages . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 107
Get Network Outage Counts . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 107
Get Outage Locations . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 108
Get Network Outages . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 109
Get Outages For Single Network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 109
Bandwidth API 111
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ThresholdReport Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . PlansBandwidthUsageView Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . NetworkBandwidthUsageSummary Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . 111
111
111
111
5 AMAZON CONFIDENTIAL
NetworkBandwidthUsage Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 111
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 112
Get Aggregated Bandwidth Usage . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 112
Get Networks By Bandwidth Usage . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 113
Get Bandwidth Utilization for an Individual Network by Day . . . . . . . . . . . . . . . . . . . 114
Firmware API 116
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 116
Network Updates View Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 116
API . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 116
Update Network Firmware Version . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 116
eero for Business 117
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
Network Subnet Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
Ethernet Port Association Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
Captive Portal Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 118
Set the Network Identifier Type . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 118
Set Business Name . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
Get a business network’s business name . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
Set or Update Subnet . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
Get Subnet . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 121
Delete Subnet . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 121
Get Ethernet Port Association . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
Enable Captive Portal for Subnet . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
Get Captive Portal Configurations on Network . . . . . . . . . . . . . . . . . . . . . . . . . . 123
Configure Captive Portal . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 123
eero for Communities 125
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
Subset Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
Subnet Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
Network Mode Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
Network Default Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
Organization User . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
Communities . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
Get all Communities . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
Create a Managed Community . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 127
Get Managed Community by ID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
Get Managed Community Summary (Networks count) . . . . . . . . . . . . . . . . . . . . . . 128
Update a Managed Community . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 129
Delete a Managed Community . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 130
eero Association and Disassociation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 130
Associate a Serial with a Managed Community . . . . . . . . . . . . . . . . . . . . . . . . . . 130
Disassociate a Serial from a Managed Community . . . . . . . . . . . . . . . . . . . . . . . . 131
Get Serials/Networks Associated with Community . . . . . . . . . . . . . . . . . . . . . . . . 132
Get Units Associated with Community . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 133
Community-wide IoT SSID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 134
Get Managed Community SSIDs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 134
Create Managed Community IoT SSID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 134
Enable / disable the Community IOT SSID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 135
Change SSID name and Password on Community IoT SSID . . . . . . . . . . . . . . . . . . . . 136
Delete Managed Community IoT SSID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 136
6 AMAZON CONFIDENTIAL
Managing a community network . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 137
Get Network Mode by Network ID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 137
Create or Update Network Mode by Network ID . . . . . . . . . . . . . . . . . . . . . . . . . 137
Create or Update Network Default by Network ID . . . . . . . . . . . . . . . . . . . . . . . . . 138
Reset the Network Back to Vacant . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 139
Convert a Residential Network to MDU Type . . . . . . . . . . . . . . . . . . . . . . . . . . . 139
List Users That Have Access to a Community . . . . . . . . . . . . . . . . . . . . . . . . . . . 140
Revoke user’s access to a community . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 141
Invite User to a Community. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 141
Re-invite user to a community. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 142
Display unit summary (resident information, network details) . . . . . . . . . . . . . . . . . . . 142
List of connected devices . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 144
Managing a community self serve activation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 146
Updating self serve activation settings . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 146
Deleting self serve activation settings . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 148
Get self serve activation settings . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 148
eero Provision 150
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 150
Eero Provisioned Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 150
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 150
Create Provision . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 150
Delete Provision . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 151
Get Provision by Serial . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 152
Get Provisions by Organization . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 152
Organization Settings API 154
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 154
Update RIPV2 PSK . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 154
RIPV2 Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 154
GET RIP PSK . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 154
DELETE RIP PSK . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 155
Profiles . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 156
Cohort . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 156
Create cohort . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 156
Update cohort . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 157
Get cohorts . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 158
Delete cohort . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 158
Cohort network status . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 159
Cohort summary . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 160
Cohort network summary . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 162
Associate a network to a cohort . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 163
Disassociate a network to a cohort . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 164
Latency Performance Tests . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 165
Get Latency Test . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 165
Create Latency Test . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 166
DNS RTT Performance Tests . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 166
Get DNS RTT Performance Tests . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 166
Speed Performance Tests . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 168
Get Speed Performance Tests . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 168
Performance Tests Summary . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 170
Get Performance Tests Summary . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 170
Custom Latency Server Configuration . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 174
Get Performance Tests Latency Server List URL . . . . . . . . . . . . . . . . . . . . . . . . . . 174
7 AMAZON CONFIDENTIAL
Update Performance Tests Latency Server List URL . . . . . . . . . . . . . . . . . . . . . . . . 175
Insight Exchange API 176
Objects . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 176
Data Aggregation Job Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 176
Data Artifact Object . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 177
APIs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 177
Get Data Aggregation Jobs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 177
Get a Data Artifact and Its Download Link . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 179
8 AMAZON CONFIDENTIAL
Change Log
Version 2.6.8
Release Date: 2025-07-16
• Add the page Performance Tests containing all the endpoints offered so far for realizing Networks
performance tests.
Version 2.6.7
Release Date: 2025-06-12
• Add the Insight Exchange API.
Version 2.6.6
Release Date: 2025-04-24
• Edit PUT /2.2/networks/:networkId/password response body in Network API.
Version 2.6.5
Release Date: 2025-04-24
• Edit GET /2.3/networks/:id/multistaticip in Network API.
• Edit PUT /2.3/networks/:id/multistaticip in Network API.
• Edit POST /2.2/networks/:networksId/reservations in IPv4 Reservations API.
• Edit PUT /2.2/networks/:networksId/reservations in IPv4 Reservations API.
Version 2.6.4
Release Date: 2025-04-24
• Editing some endpoints with the PropertyManager TokenType at eero for Communities API and Net-
works API
• Editing GET /2.2/organizations/:idOrSelf/subsets/:subset_id/units/:unit_id/summary
at eero for Communities API with new fields ownership_status, resident.move_in_date
resident.move_out_date
• Add POST /2.2/networks/:id/transfer/resend to the Networks API
• Add GET /2.2/organizations/:id/subsets/:subsetId/summary to the eero for Communities API
• Add PUT /2.2/organizations/:id/subsets/:subsetId/subnets/iot/enable to the eero for Com-
munities API
Version 2.6.3
Release Date: 2025-01-24
• Add documentation for GET /2.2/eeros/:id/activation_state in the eero Deactivation API
• Edit a typo in the paths documented in the Regulatory testing API
• Correct the eero for Business API - Set Business Name endpoint to PUT /2.2/networks/:id/label?labelType=Specia
• Add GET /2.2/networks/:id/label?labelType=SpecialMarket (Business Name) to the eero for
Business API
• Add GET /2.2/networks/:id/label?labelType=SpecialMarket (Nickname) to the Networks API
• Add PUT /2.2/networks/:id/network_customer_type to the eero for Communities API
9 AMAZON CONFIDENTIAL
Version 2.6.2
Release Date: 2024-11-01
• Initial documentation about Regulatory testing which includes the following APIs:
– GET /2.2/organizations/:id/regulatory_tests/profiles
– POST /2.2/organizations/:id/regulatory_tests/cohort
– POST /2.2/organizations/:id/regulatory_tests/cohort/:cohortId
– GET /2.2/organizations/:id/regulatory_tests/cohorts
– DELETE /2.2/organizations/:id/regulatory_tests/cohort/:cohortId
– GET /2.2/organizations/:id/regulatory_tests/cohort/:cohortId/network_status
– GET /2.2/organizations/:id/regulatory_tests/cohort/:cohortId/summary
– GET /2.2/organizations/:id/regulatory_tests/cohort/:cohortId/networks
Version 2.6.1
Release Date: 2024-08-01
• Add documentation in the eero for Communities API for the APIs:
– GET /2.2/organizations/:id/self_serve/settings?entityId=value_1
– DELETE /2.2/organizations/:id/self_serve/settings?entityId=value_1
– PUT /2.2/organizations/:id/self_serve/settings
Version 2.6.0
Release Date: 2024-07-09
• Add documentation for GET /2.2/networks/:id/daily_bandwidth_usage in the Bandwidth API
• Add documentation for GET /2.2/eeros/:id in the eeros API
• Add documentation for POST /2.2/eeros/:eeroId/reboot in the eeros API
Version 2.5.2
Release Date: 2024-06-28
• Add DELETE /2.3/organizations/:idOrSelf/rip_v2 in Organization Settings API.
Version 2.5.1
Release Date: 2024-06-27
• Update description for PUT /2.2/networks/:id/network_customer_type in eero for Business API
Version 2.5.0
Release Date: 2024-06-24
• Add GET /2.3/networks/:id/multistaticip in Network API.
• Add PUT /2.3/networks/:id/multistaticip in Network API.
• Add documentation for Organization Settings API
• Add GET /2.3/organizations/:idOrSelf/rip_v2 in Organization Settings API.
• Add PUT /2.3/organizations/:idOrSelf/rip_v2 in Organization Settings API.
Version 2.4.0
Release Date: 2024-01-09
• Add documentation for eero Provision API
10 AMAZON CONFIDENTIAL
Version 2.3.0
Release Date: 2023-09-08
• Add documentation for eero for Communities API
Version 2.2.0
Release Date: 2023-03-28
• Created documentation for eero for Business API
• Added eero Business setup and configurations API
Version 2.1.17
Release Date: 2022-11-30
• Added overwrite_serial_associations and overwrite_user_associations fields to POST
/2.2/customer_accounts
Version: 2.1.16
Release Date: 2022-03-22
• Added GET /2.2/eeros/:serial/pre_setup_config in the Eeros API
• Added GET /2.2/eeros/:serial/support in the Eeros API
Version: 2.1.15
Release Date: 2022-01-10
• Added PUT /2.2/eeros/:id/pppoe in the Eeros API
• Added DELETE /2.2/eeros/:id/pppoe in the Eeros API
Version: 2.1.14
Release Date: 2021-12-25
• Added GET /2.2/networks/:networkId/guestnetwork in the Networks API
• Added PUT /2.3/networks/:networkId/guestnetwork in the Networks API
• Added PUT /2.2/networks/:networkId/guestnetwork/password in the Networks API
Version: 2.1.13
Release Date: 2021-12-27
• Described sqm, band_steering, thread and ethernet_status fields in full network object in the Net-
works API
Version: 2.1.12
Release Date: 2021-12-21
• Described multiple fields in device object in the Devices and Profiles API
• Described multiple fields in searched eero object in the Eeros API
• Described multiple fields in summary network object and full network object in the Networks API
11 AMAZON CONFIDENTIAL
Version: 2.1.11
Release Date: 2021-12-20
• Described multiple fields in full network object in the Networks API
• Updated request body in the Create Network API
Version: 2.1.10
Release Date: 2021-12-16
• Added POST /2.2/networks/:id/updates in the new Firmware API
Version: 2.1.9
Release Date: 2021-12-14
• Added WPA3 field to PUT /2.2/networks/:networkId/settings in the Networks API
Version: 2.1.8
Release Date: 2021-12-06
• Added POST /2.2/networks/:networkId/blacklist to the Devices and Profiles API
• Added DELETE /2.2/networks/:networkId/blacklist/:macId to the Devices and Profiles API
• Added PUT /2.2/networks/:networkId/temporary_flags/hide_5g to the Networks API
• Added DELETE /2.2/networks/:networkId/temporary_flags/hide_5g to the Networks API
• Added PUT /2.2/networks/:networkId/ac_compat to the Networks API
• Added request example and fixed response body from GET /2.2/subscriptions of Subscriptions API
Version: 2.1.7
Release Date: 2021-10-21
• Created documentation for Network Outages API
• Added GET /2.2/organizations/:idOrSelf/network_outages/point_in_time to the Network Outages API
• Added GET /2.2/organizations/:idOrSelf/network_outages/counts to the Network Outages API
• Added GET /2.2/organizations/:idOrSelf/network_outages/locations to the Network Outages API
• Added GET /2.2/organizations/:idOrSelf/network_outages/networks to the Network Outages API
• Added GET /2.2/organizations/:idOrSelf/network_outages/networks/:networkId to the Network Out-
ages API
• Added GET slow_network api /2.2/organizations/self/slow_network_counts_by_day to the Networks
API
• Created documentation for Bandwidth API
• Added GET /2.2/organizations/:idOrSelf/aggregated_bandwidth_usage to the Bandwidth API
• Added GET /2.2/organizations/:idOrSelf/networks_by_bandwidth_usage to the Bandwidth API
Version: 2.1.6
Release Date: 2021-10-01
• Added GET pending transfer pages /2.2/organizations/self/networks/pending to the Networks API
Version: 2.1.5
Release Date: 2021-07-21
• Added overwrite_serial_associations field to PUT /2.2/customer_accounts/:partner_account_id
12 AMAZON CONFIDENTIAL
Version: 2.1.4
Release Date: 2021-01-14
• Added DELETE /2.2/networks/:id/organization_association to the Networks API
• Added POST /2.2/networks/:id/users to the Networks API
• Added POST /2.2/logout to Authentication chapter
Version: 2.1.3
Release Date: 2021-01-04
• Removed password field from Full Network Object
Version: 2.1.2
Release Date: 2020-11-20
• Added new chapter for the Data Plan API, which allows partners to set data plan information for their
managed networks
• Added partner_account_id to the Searched eero Object in the eeros API
Version: 2.1.1
Release Date: 2020-10-25
• Added Getting Started chapter
• Added GET /2.2/networks/:networkId/speedtest to the Networks API
• Added networks field to Customer Account Object
• Added customer_account field to Full Network Object
Version: 2.1.0
Release Date: 2020-06-15
Translations released: 2020-07-20
• Added documentation around backfilling partner_account_id
• Added optional parameter partner_account_id to POST /2.2/networks/:id/premium
• Added plan field to GET /2.2/subscriptions response
Version: 2.0.0
Release Date: 2020-04-06
• Added documentation around customer account and subscriptions API, which will supercede the eero
Plus APIs
• Deprecated customer_account_api.md to start using customer_account.md
• Updated fields for POST /2.3/networks
• Updated fields for PUT /2.3/networks/:networkId
• Updated fields for PUT /2.2/networks/:networkId/settings
• Updated fields for POST /2.2/networks/:networkId/transfer
• Updated fields for PUT /2.2/networks/:networkId/label
• Updated fields for POST /2.2/networks/:networksId/reservations
• Updated fields for PUT /2.2/networks/:networkId/reservations/:reservationsId and rename reservation-
sId to macId
• Updated fields for POST /2.2/networks/:id/premium
13 AMAZON CONFIDENTIAL
• Updated Update Customer Serials to use PUT instead of POST
• Removed query string for DELETE /2.2/networks/:networkId/reservations/:reservationsId
• Added server_url field to POST /2.2/networks/:networkId/speedtest
Version: 1.9.1
Release Date: 2019-12-06
• Added documentation for ISP/Partner network creation and customer subscription
Version: 1.9
Release Date: 2019-08-07
• Added documentation for POST /2.3/networks, POST /2.2/eeros, PUT /2.2/eeros/:id endpoints.
• Added sections for Create Network
Version: 1.8.1
Release Date: 2019-03-26
• Added documentation for GET /2.2/networks/:id/blacklist endpoint.
• Added sections for IPv4 Port Forwarding API, IPv4 Reservations API, and IPv6 Pinhole Management
API.
• Added an Update a Network’s Configuration Settings subsection to the Networks API.
Version: 1.8
Release Date: 2018-12-07
• Deprecated POST /2.2/organizations/self/eeros/serial/:serial/deactivate. Replaced with POST
/2.2/eeros/:id/activation_state.
• Deprecated GET /2.2/organizations/self/eeros/serial/:serial. Replaced with GET /2.3/eeros/serial/:serial
that can search by full 16 character serial or first 8 character serial. Added id and serial fields to the
response data.
• Deprecated GET /2.3/organizations/self/users. Replaced with GET /2.3/organization_users and added
ability to query by user attributes.
• Deprecated GET /2.3/organizations/self/users/:email. Replaced with GET /2.3/organization_users/:id.
• Deprecated POST /2.3/organizations/self/users. Replaced with POST /2.3/organization_users.
• Deprecated DELETE /2.3/organizations/self/users/:email. Replaced with DELETE /2.3/organiza-
tion_users/:id.
• Deprecated POST /2.3/organizations/self/users/:email/resend. Replaced with POST /2.3/organiza-
tion_users/:id/invites.
• Added id field to the response data of organization user APIs.
• Added documentation for DELETE /2.2/eeros/serial/:serial endpoint.
• Added documentation for GET /2.2/networks/:id/label and PUT /2.2/networks/:id/label endpoints.
Version: 1.7.1
Release Date: 2018-10-03
• Fixes email typo in form field for POST /2.3/organizations/self/users
• Moves eero Plus Subscription object from Networks API section to eero Plus API section
14 AMAZON CONFIDENTIAL
Version: 1.7
Release Date: 2018-08-15
• POST /2.2/networks/:id/premium returns premium.owner_cant_subscribe instead of network.transfer.not_complete
• Moved networks premium APIs from Network API section and into eero Plus API section
Version: 1.6
Release Date: 2018-06-04
• Updated Organization User object with role and invite fields. Deprecated verified_email and
created fields from the Organization User object.
• Deprecated GET /2.2/organizations/self/users with GET /2.3/organizations/self/users. The new end-
point returns the updated Organization User object.
• Deprecated GET /2.2/organizations/self/users/:email with GET /2.3/organizations/self/users/:email. The
new endpoint returns the updated Organization User object.
• Deprecated POST /2.2/organizations/self/users with POST /2.3/organizations/self/users. The new end-
point can invite one or multiple users to the organization.
• Deprecated DELETE /2.2/organizations/self/users/:email with DELETE /2.3/organizations/self/users/:email.
The new endpoint returns the updated Organization User object.
• Added error codes explanation to GET /2.2/networks/:id and GET /2.2/organizations/self/eeros/serial/:serial
• Clarification requirement text added to enabling eero Plus subscription service
Version: 1.5
Release Date: 2018-04-04
• Added Eero Plus APIs
15 AMAZON CONFIDENTIAL
API Technical Overview
This section describes the basic structure of the public APIs for use by eero partners. For more information
on how to use various tools to interact with eero’s public APIs, see the Getting Started section following this
one.
eero’s public API is exposed at the base url https://api-user.e2ro.com/2.2.
API Design Philosophy
The eero API is a REST API. This means the following:
• We use HTTP Verbs to indicate the type of operation
• We use the URL path to indicate the resource being accessed or manipulated
• We use HTTP response codes to indicate API success or error
The eero API is also versioned. Currently, we are on version 2.2 of the API. Our versioning scheme is as
follows:
• If the change is backwards-compatible, we include the change in 2.2
• If the change is not backwards-compatible, we increase the minor version (for instance, 2.3 or 2.4)
Note: eero may add fields to the api responses documented here at any time. However, unless documented,
these fields should not be used in production. eero reserves the permission to remove undocumented fields
at any time.
API Tokens
The eero API requires a token on most API calls. A token is obtained through authentication, described later
in this document.
There are two types of tokens:
1. An Agent token is used to make requests on behalf of a eero network administrator. It allows for viewing
and modifying networks.
2. An Admin token has all the permissions of the Agent token with additional capability to manage the
staff of members of your organization. It also is used for sensitive operations, like deleting a network.
Please keep API tokens a secret. Partner API Tokens carry special privileges to administer networks. A leak
of a token is a significant security concern and should be reported to eero as soon as possible.
Your contact at eero will be able to help you determine your Agent and Admin accounts.
API Structure
Request Headers
The eero API requires 4 sets of headers on each API call:
(1) All requests should include the following standard headers:
Accept: application/json
X-Lang: en-US
(2) All requests should include a custom User-Agent header. For instance, if you are developing an eero
API client on behalf of initech, and the version of your client is 1.0, then you should structure your
User-Agent header as the following:
User-Agent: initech/1.0
16 AMAZON CONFIDENTIAL
(3) All requests (except login requests) should contain a X-User-Token header. This token identifies the
session of the requesting user, and is generated by the eero API after authentication.
X-User-Token: opaque-access-token-string
(4) If a token is shared among many users, a unique session ID for the user should be passed on each
request via the X-External-Session-Id header.
X-External-Session-Id: external-client-session-id
Response Format
All json responses follow this pattern:
{
"meta": {
"code": 200,
"error": "machine.readable.code",
"server_time": "2016-01-27T00:35:00.638Z"
},
"data": { result payload },
"pagination": {
"next": "/url/to/next/page/of/results"
}
}
• meta.code always equals the HTTP response code.
• meta.server_time is the UTC time on the server at the moment the response was generated
• meta.error [optional] is a specific error code
• data [optional] is result data, and can be any valid JSON type
• pagination [optional] is information on how to retrieve the next page of data
– If the content is a continuous list, the current page of results is stored in data, while the next page
of results is linked to in pagination.next.
Common Error Responses These errors can happen on any API call.
400 Form Errors failed and why is returned in the data element.
Form errors follow the response format listed above. The data about which form elements
{
"meta": {
"code": 400,
"error": "error.form.errors",
"server_time": "2016-01-27T00:35:00.638Z"
},
"data": {
"name": "error.form.field.required",
"email": "error.form.email.unavailable"
}
400 Too Many Requests to the overall number of API calls.
The user has made too many requests. This can apply to a specific endpoint or
}
{
"meta": {
"code": 400
17 AMAZON CONFIDENTIAL
"error": "error.rate.limit",
"server_time": "2016-01-27T00:35:00.638Z"
}
}
401 Unauthorized (Due to Invalid Session) {
"meta": {
"code": 401,
"error": "error.session.invalid",
"server_time": "2016-01-27T00:35:00.638Z"
The session does not exist.
}
}
401 Unauthorized (Due to session revocation) to have the user login again.
{
"meta": {
"code": 401,
"error": "error.session.revoked",
"server_time": "2016-01-27T00:35:00.638Z"
The user’s session has been revoked. The only recourse is
}
}
401 Unauthorized (due to lack of verification) {
"meta": {
"code": 401,
"error": "error.verification.required",
"server_time": "2016-01-27T00:35:00.638Z"
The user has not yet verified their login.
}
}
403 Forbidden (due to access denied) they tried to access a network that they do not own.
{
"meta": {
"code": 403,
"error": "error.access.denied",
"server_time": "2016-01-27T00:35:00.638Z"
The user does not have permission to access this resource. E.g.
}
}
404 Not Found {
"meta": {
"code": 404
}
The resource never existed.
}
18 AMAZON CONFIDENTIAL
5xx Server Error This means something went wrong in the eero API. Clients should never rely on the struc-
ture of the body for a 5xx server error. It may provide useful information, but there are no guarantees as to
its content.
19 AMAZON CONFIDENTIAL
Getting Started with eero’s Public APIs
This section demonstrates how to make requests to eero’s public API using cURL, python, and Postman.
Although these specific tools are covered in this document, you may interact with eero’s APIs using any tool
or library that can make HTTP requests. See the API Technical Overview chapter of this document if you need
clarification on API errors or message structure. If you are familiar with the following tools and procedures and
only need information on setting up the initial authentication request, please see the Authentication chapter
of this document.
For each of the tools described in this section we will demonstrate how to perform
1. Initial user authentication to generate API access token
2. Basic API calls using newly generated credentials
Before making any other requests to the eero API, you must generate and verify an API access token using
the API development email (see Initial Steps below) tied to your eero organization. After completing these
initial steps, all subsequent API requests will require the verified API access token as a header value.
Once an API access token has been generated it should be kept secret. Verified tokens do not expire and
can be used to access eero resources on behalf of your organization.
Initial Steps
Before you interact with eero’s APIs, eero must first associate an email address that is managed by your orga-
nization with eero’s internal record of your organization. This email address should be dedicated to testing
and development and should not be tied to a single user or their existing company email address (i.e. an
example like eero-api-development@your-isp.com is preferred over emails such as jane@your-isp.com
or derek+eero@your-isp.com).
If you’re unsure if a development email has been tied to your company’s eero account, please reach out to
eero for assistance. If your organization has a Remote Network Management (RNM) administrator, please
contact them to add the development email address to your organization’s RNM instance. The eero public
APIs have been designed to provide functionality that mirrors most RNM features (and many other features
only available through the APIs). To properly use the APIs, make sure your RNM administrator invites the new
development email address to your company’s RNM instance with the Admin role applied. Doing this ensures
that the new user has the highest access privileges.
Once a company email address has been connected in the eero cloud, an invite email will be sent to that
email which must be acknowledged within ten minutes in order to complete account verification. If you miss
the initial verification email, please contact your RNM administrator or eero to resend it.
After verifying your development email address, you can authenticate with the eero API and make requests.
cURL Steps
cURL is a simple and powerful command line data transfer tool that can be used to send HTTP requests.
Generate Unverified Access Token
1. Open a terminal and set up the following cURL command, replacing [API Development Email
Address] with the email address discussed at the beginning of this chapter
curl -X POST https://api-user.e2ro.com/2.2/pro/login \
-H 'Content-Type: application/json' \
-d '{"login": "[API Development Email Address]"}'
2. Run the command
3. If the request is successful you will receive a response with an Unverified API Access Token in the
body under the JSON key user_token
20 AMAZON CONFIDENTIAL
{
"data": {
"user_token": "[Unverified API Access Token]"
},
"meta": {
"code": 200,
"server_time": "2020-09-28T23:21:40.111Z"
}
}
4. Check the inbox of your API Development Email Address for an email from eero containing a verifica-
tion code
5. Keep note of the unverified token and the email verification code for the next steps
Verify Access Token
1. Open a terminal and set up the following cURL command, replacing fields in square brackets with infor-
mation generated from the previous section
curl -X POST https://api-user.e2ro.com/2.2/login/verify \
-H 'X-User-Token: [Unverified API Access Token]' \
-H 'Content-Type: application/json' \
-d '{"code": [Verification code received via email]}'
2. Run the command
3. If the request is successful you will receive a response containing basic information about the account
that you’ve just verified and your API access token may now be used for other API requests
{
"data": {
"name": "Organization Name",
"phone": {
"value":"+12223334444",
"verified":false
},
"email": {
"value": "development@your-isp.com",
"verified":true
}
},
"meta": {
"code": 200,
"server_time": "2020-09-28T23:02:42.423Z"
}
}
Create API Request
This section describes how to make a request to eero’s public API using a verified API access token. Requests
to other endpoints described in this document will follow the same template as this request.
1. Open a terminal and set up the following cURL command, replacing [Verified API Access Token]
with the token verified in the last section
curl https://api-user.e2ro.com/2.3/organization_users \
-H 'X-User-Token: [Verified API Access Token]'
2. Run the command
21 AMAZON CONFIDENTIAL
3. If the request is successful you will receive a response containing basic information about users that
belong to your organization (or an empty array if there are no users)
{
"pagination": {
"next":"/2.3/organization_users?offset=10"
},
"data": {
"url": "/2.3/organization_users",
"users": [
{"id"...}
],
"meta": {
"code": 200,
"server_time":"2020-09-28T23:03:56.318Z"
}
You are now ready to use your API access token to make requests to any other endpoints described in this
}
document
Python Steps
Python is a popular, general purpose programming language. The steps in this section should be informative
if you interact with the eero public APIs with Python or programmatically using other langauges. The code
snippets in this section work with both Python 2 and Python 3.
Generate Unverified Access Token
1. Create a new file called generate_unverified_eero_api_token.py
2. In the new file enter the following text, replacing [API Development Email Address] with the email
address discussed at the beginning of this chapter
import requests
login_payload = {"login":"[API Development Email Address]"}
response = requests.post ("https://api-user.e2ro.com/2.2/pro/login", login_payload)
print(response.status_code)
print(response.json())
token = response.json()["data"]["user_token"]
print("Unverified Access Token: " + token)
3. Save the file
4. In a terminal run python generate_unverified_eero_api_token.py
5. If the request is successful the last line printed by the program will be similar to Unverified Access
Token: [Unverified API Access Token]
6. Check the inbox of your API Development Email Address for an email from eero containing a verifica-
tion code
7. Keep note of the unverified token and the email verification code for the next steps
Verify Access Token
1. Create a new file called verify_eero_api_token.py
2. In the new file enter the following text, replacing fields in square brackets with information generated
from the previous section
22 AMAZON CONFIDENTIAL
import requests, json
url = "https://api-user.e2ro.com/2.2/login/verify"
verify_payload = {'code': '[Verification code received via email]'}
verify_header = {"X-User-Token":'[Unverified API Access Token]'}
response = requests.post(url, headers=verify_header, data=verify_payload)
print("Account Verified? " + str(response.json()['data']['email']['verified']))
3. Save the file
4. In a terminal run python verify_eero_api_token.py
5. If the request is successful the last line printed by the program will be Account Verified? True
Create API Request
This section describes how to make a request to eero’s public API using a verified API access token. Requests
to other endpoints described in this document will follow the same template as this request.
1. Create a new file called get_organization_users.py
2. In the new file enter the following text, replacing [Verified in the last section.
API Access Token] with the token verified
import requests, json
url = "https://api-user.e2ro.com/2.3/organization_users"
verify_header = {"X-User-Token":'[Verified API Access Token]'}
response = requests.get(url, headers=verify_header)
print("Response Status Code: " + str(response.status_code))
3. Run the command
4. If the request is successful the program will print the line Response Status Code: 200
You are now ready to use your API access token to make requests to any other endpoints described in this
document
Postman Steps
Postman is graphical tool for calling REST APIs. Setup is straightforward and users can easily create API
requests. The following instructions were developed using Postman 7.33.1.
Generate Unverified Access Token
1. Open Postman and create a new request (Figure 1)
2. Update the new request with the following settings (Figure 2)
• Request Type: POST
• Authentication Endpoint: https://api-user.e2ro.com/2.2/pro/login
• Request Body: { "login": "[API Development Email Address]" }
• Content Type: Raw, JSON
3. Click Send
4. If the request is successful you will receive a response an Unverified Token in the body under the JSON
key user_token (Figure 3)
5. Check the inbox of the API Development Email Address for an email from eero containing a verification
code
6. Keep note of the unverified token and the email verification code for the next steps
23 AMAZON CONFIDENTIAL
Figure 1: Create new request
Figure 2: Settings for unverified access token request
Figure 3: Response with the unverified API access token
24 AMAZON CONFIDENTIAL
Verify Access Token
1. Create a new request in Postman
2. Update the new request with the following settings (Figure 4)
• Request Type: POST
• Verification Endpoint: https://api-user.e2ro.com/2.2/login/verify
3. Add a custom header to the request with the following values (Figure 4)
• Header Key: X-User-Token
• Value: Unverified Token from the previous step
Figure 4: Verification request settings and headers
4. Add a request body with the following information (Figure 5)
• Request Body: { "code": [Verification code received via email]}
Figure 5: Verification request body
5. Click Send
6. If the request is successful you will receive a response containing basic information about the account
that you’ve just verified and your API access token may now be used for other API requests (Figure 6)
Create API Request
This section describes how to make a request to eero’s public API using a verified API access token. Requests
to other endpoints described in this document will follow the same template as this request.
1. Create a new request in Postman
2. Update the new request with the following settings (Figure 7)
25 AMAZON CONFIDENTIAL
Figure 6: Successful verification response
• Request Type: GET
• API Endpoint: https://api-user.e2ro.com/2.3/organization_users
3. Add a custom header to the request with the following values (Figure 7)
• Header Key: X-User-Token
• Value: Verified Token from the previous step
Figure 7: Basic API request setup
4. Click Send
5. If the request is successful you will receive a response containing basic information about users that
belong to your organization (or an empty array if there are no users) (Figure 8)
Figure 8: Successful API response
You are now ready to use your API access token to make requests to any other endpoints described in this
document
26 AMAZON CONFIDENTIAL
Authentication
eero API calls require the X-User-Token header to authenticate the requesting user.
This document describes how to obtain that user token.
APIs
Authentication is a 2-step process:
Step 1: Create an Unverified Session
Request Path: POST /2.2/pro/login
Token Type: Any
Fields
Field Optional? JSON Type Description
login no string email address for the user
Response
Fields data is a JSON object with the following fields:
Field Optional? JSON Type Description
user_token no string An Unverified Session Token
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T19:21:41.568Z"
},
"data": {
"user_token": "123456|a21305b1cde0fgh9ij9kl6mno9"
}
}
Step 2: Verify the Session
After Step 1, a code will be sent to the email provided at login. This code is used to verify the session.
Request Path: POST /2.2/login/verify
Token Type: Any
Headers
27 AMAZON CONFIDENTIAL
Header Optional? Description
X-User-Token no The user_token value from step 1
Fields
Field Optional? JSON Type Description
code no number The code that was emailed
Response
Fields data is a JSON object containing user account information:
Field Optional? JSON Type Description
user_token no string A verified Session Token
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T19:21:41.568Z"
},
"data": {
"name": "Paul Atreides",
"phone": {
"value": "+14155555555",
"verified": true
},
"email": {
"value": "paul@houseatreides.com",
"verified": true
},
}
}
Revoke an API Token
Use this endpoint to revoke a verified token to prevent it from being used for future API requests.
Request Path: POST /2.2/logout
Token Type: Any
Headers
Header Optional? Description
X-User-Token no Verified X-User-Token to be revoked
Response The data field is omitted.
28 AMAZON CONFIDENTIAL
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T19:21:41.568Z"
}
}
29 AMAZON CONFIDENTIAL
Networks API
Objects
Summary Network Object
Field Optional?
JSON
Type Description
url no string URL to load more information about
the network
name no string the network’s SSID
owner yes string name of the owner of the network
health no object health information about the network
health.internet.status yes string status of the gateway eero and its
connection to the WAN. One of
connected, in_progress, error, or
rebooting
health.eero_network.status yes string status of the leaf eero(s). One of
connected, in_progress, or error.
Will be null if
health.internet.status is error
eeros no array array of objects containing information
of each eero on the network
eeros[].mac_address no string base mac address of the eero
eeros[].serial no string serial number of the eero
Full Network Object
Field Optional?
JSON
Type Description
url no string URL to this network resource
name no string the network’s SSID
wan_ip yes string IP address of the WAN
gateway_ip yes string LAN IP address of the gateway
eero
connection.mode no string either nat or bridged
hairpin_nat yes boolean true if hairpin NAT is enabled
lease no object information about the network’s
lease
lease.mode no string either dhcp or static
lease.dhcp yes object information about the DHCP Lease
(if lease.mode is dhcp)
lease.static yes object information about the static lease
(if lease.mode is static)
dhcp no object information about DHCP settings
dhcp.mode no string either automatic or custom
dhcp.custom yes object information about the custom dhcp
settings (if dhcp.mode is custom)
dhcp.custom.subnet_ip no string IP address of the subnet block of
the network
dhcp.custom.subnet_mask no string mask of the subnet block of the
network
30 AMAZON CONFIDENTIAL
Field Optional?
JSON
Type Description
dhcp.custom.start_ip no string start value of the IP range of the
subnet block of the network
dhcp.custom.end_ip no string end value of the IP range of the
subnet block of the network
dns no object information about the DNS settings
dns.mode no string either automatic or custom
dns.parent yes object information about parent DNS
servers
dns.parent.ips yes array string list of parent DNS servers
dns.custom yes object information about custom DNS
servers
dns.custom.ips yes array string list of custom DNS servers
upnp no boolean true if upnp is enabled
premium_status yes string premium status of the user for trial:
“trial_eligible”, “trial_ineligible”,
“trialing”, “active”, “past_due” or
“canceled”
gateway_serial yes string eero’s serial number associated
with the gateway
geo_ip yes object information about the geographic
location of the IP address
geo_ip.city yes string name of the city of the geographic
location of the IP address
geo_ip.timezone yes string time zone of the geographic
location of the IP address
e.g. “America/Sao_Paulo”
geo_ip.latitude no double latitude of the geographic location
of the IP address
geo_ip.longitude no double longitude of the geographic
location of the IP address
geo_ip.postal_code yes string postal code of the geographic
location of the IP address
geo_ip.region_name yes string name of the region (county) of the
geographic location of the IP
address
geo_ip.org yes string name of the organization
geo_ip.isp yes string name of the internet service
provider
geo_ip.area_code yes integer area code of the geographic
location of the IP address
geo_ip.country_code yes string country code of the geographic
location of the IP address e.g. “BR”
geo_ip.metro_code yes integer metro code of the geographic
location of the IP address
geo_ip.country_name yes string name of the country of the
geographic location of the IP
address
geo_ip.region yes string number of the region of the
geographic location of the IP
address
31 AMAZON CONFIDENTIAL
Field Optional?
JSON
Type Description
speed no object information about the last speed
test run on the network
speed.status no string one of none, pending, or running
speed.date yes string ISO 8601 time of last run speed test
speed.up yes object information about upload speed
speed.up.value yes double upload speed numerical value
speed.up.units yes string upload speed unit of measurement
speed.down yes object information about download speed
speed.down.value yes double download speed numerical value
speed.down.units yes string download speed unit of
measurement
timezone no object information about the network’s
timezone
timezone.value yes string timezone of network
timezone.geo_ip yes string timezone calculated from
network’s IP address
health no object information about the health of the
network
health.internet.status yes string status of the gateway eero and its
connection to the WAN. One of
connected, in_progress, or error
health.eero_network.status yes string status of the leaf eero(s). One of
connected, in_progress, or error.
Will be null if
health.internet.status is error
upstream no array array of objects with information
about devices connected upstream
to the gateway eero
upstream[].known_bad no boolean boolean specifying if the device is
known to be bad
upstream[].model no string firmware of the device
upstream[].type no string type of the device e.g. modem
upstream[].firmware yes string firmware of the device
ip_settings no object IP Settings of the network
ip_settings.double_nat no string true if the network is behind
another NAT
ip_settings.public_ip yes string external IP address of the network
owner yes string name of the owner of the network
rebooting yes object information about reboot status of
the network, if its currently
rebooting
rebooting.reason yes string reason for reboot: manual, ota,
settings, bridge_mode_on,
bridge_mode_off, subnet_change
rebooting.nodes yes array array of network node objects
involved in the rebooting
rebooting.scope yes string the scope of the reboot: node or
network
rebooting.source yes string source of the reboot: system,
admin, user, rnm or partner
last_reboot yes string last reboot date of the network
32 AMAZON CONFIDENTIAL
Field Optional?
JSON
Type Description
installer yes object information about the user who
installed the network
installer.email yes string email address of the user who
installed the network
transferer yes object information about the user who
transferred ownership of the
network
transferer.email yes string email address of the user who
transferred
customer_account yes object customer account object
associated with the network (see
Customer Account API -
Customer Account Object )
sqm yes boolean whether or not SQM is enabled
band_steering yes boolean whether or not band steering is
enabled
thread yes boolean whether or not Thread is enabled
ethernet_status yes object object containing information
about ethernet connection
ethernet_status.statuses no array array of Ethernet Status Objects
ethernet_status.wiredInternet no boolean true if the ethernet is wired else
false
ethernet_status.segmentId no string MAC address of the segment
ipv6Lease yes string IPv6 lease information
ipv6 yes object ipv6 server information
wpa3 yes boolean whether or not wpa3 is enabled
ffs yes boolean whether or not AmazonSettings ffs
is enabled
alexa_skill yes boolean whether or not AmazonSettings
alexaSkill is enabled
vlan yes string vlan value
pppoe_username yes string pppoe username
pppoe_enabled yes boolean whether or not pppoe is enabled
amazon_account_linked no boolean whether or not account is amazon
enabled, default false
Ethernet Status Object
Field Optional? JSON Type Description
interfaceNumber no integer positive integer for interface identification
starting at zero
hasCarrier no boolean true if the ethernet port is currently in use
speed no string physical rate of ethernet speed in Mb/s,
possible values: P10, P100, P1000 and P2500
isWanPort no boolean true if the interface has WAN else false
Eero Object
33 AMAZON CONFIDENTIAL
Field Optional? JSON Type Description
url no string URL to this eero resource
serial no string the serial number of the eero
location yes string the location (name) of this eero
joined yes string ISO 8601 time of when the eero joined the
network
gateway no boolean true if this eero is the network’s gateway
ip_address yes string local ip address of the eero
status no string one of red, yellow, or green. red means
the eero is an error state error, yellow
means its currently connecting, green
means the eero is connected.
model no string either eero or eero Beacon
model_number no string model number of the eero
ethernet_addresses yes array mac addresses of the ethernet port(s) on
the eero
wifi_bssids yes array mac addresses of the wifi BSSIDs
os yes string operating system version running on the
eero
mesh_quality_bars yes number 1-5 score of eero connection quality (5 is
best)
wired yes boolean true if the eero is wired to another eero
last_reboot yes string last reboot time of the eero
IPv6 Object
Field Optional? JSON Type Description
name_servers no object ipv6 server information
Name Servers Object
Field Optional? JSON Type Description
mode yes string dns mode: automatic or custom
custom yes array list of IP6 values
APIs
Create a Network
Please see Create Network section for the full details.
Request Path: POST /2.3/networks
Token Type: Admin, Agent
Network Form Fields
Field Optional? JSON Type Description
name no String Name of the network
34 AMAZON CONFIDENTIAL
Field Optional? JSON Type Description
password no String Password for the network
timezone.value yes String Network timezone field
settings yes Settings Object IP settings for the network
consents.ota_updates yes Boolean Consent to OTA updates
enabled_simple_setup_vendors yes Array[Int] A list of vendor IDs
Settings Object
Field Optional? JSON Type Description
lease.mode yes String “dhcp or static”
lease.static.ip yes String e.g. “192.168.7.66”
lease.static.mask yes String e.g. “255.255.255.0”
lease.static.router yes String e.g. “192.168.7.1”
Response data is a JSON object containing a full view of network information.
Example
{
"meta": {
"code": 200,
"server_time": "2019-08-01T21:23:02.998Z"
},
"data": { /* created "network object" */ }
}
Legacy Mode Toggle
Request Path: PUT /2.2/networks/:id/ac_compat
Token Type: Admin, Agent
Legacy Mode Toggle Fields
Field Optional? Type Description
enabled no boolean true enables legacy mode and disables 802.11ax, false
does the opposite
Response data is a JSON with the field “enabled”, identical to the original body of the request.
Example
{
"meta": {
"code": 200,
"server_time": "2021-11-12T13:54:11.999Z"
},
"data": {
"enabled": false
35 AMAZON CONFIDENTIAL
}
}
Deactivate 5GHz Radio
Request Path: PUT /2.2/networks/:id/temporary_flags/hide_5g
Token Type: Admin, Agent
Deactivate 5GHz Radio Fields
Field Optional? Type Description
value no boolean value of the temporary flag which is recorded in the
database
Response Status code 200 without body.
Example
{
"meta": {
"code": 200,
"server_time": "2021-11-17T19:14:15.203Z"
}
}
Reactivate 5GHz Radio
Request Path: DELETE /2.2/networks/:id/temporary_flags/hide_5g
Token Type: Admin, Agent
Reactivate 5GHz Radio Fields This request does not have a body.
Response Status code 200 without body.
Example
{
"meta": {
"code": 200,
"server_time": "2021-11-17T21:07:30.970Z"
}
}
Get All Administered Networks
Request Path: GET /2.2/organizations/self/networks/administered
Token Type: Admin, Agent
Query Parameters
36 AMAZON CONFIDENTIAL
Field Optional? Type Description
limit yes integer how many networks to return in each response
offset yes integer used for pagination of response data. this field is
managed by the pagination section of the API response
(more info below), and should not be set explicitly.
Response data is a JSON array of objects; each object contains a short view of network information.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": {
"url": "/2.2/organizations/self/networks/administered",
"networks": [ /* array of "summary network objects" */ ]
},
"pagination": {
"next": "/2.2/organizations/self/networks/administered?offset=157"
}
}
This API can be used to sync networks:
1. Sync job should run regularly (example: every 15 minutes)
2. The first time the sync job runs, it should hit GET /2.2/organizations/self/networks/administered
a. From then on, the sync job should continue to hit the pagination.next url
b. The sync job should stop loading when the pagination.next url returns empty data (aka “data”:
[])
3. The next time the sync job runs, it should resume from the URL that returned empty data (2b). This will
resume the sync at the point it left off, instead of syncing every network every time
Get All Untransferred Networks
Request Path: GET /2.2/organizations/self/networks/untransferred
Token Type: Admin, Agent
Query Parameters
Field Optional? Type Description
limit yes integer how many networks to return in each response
offset yes integer used for pagination of response data. this field is
managed by the pagination section of the API response
(more info below), and should not be set explicitly.
Response data is a JSON array of objects; each object contains a short view of network information.
37 AMAZON CONFIDENTIAL
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": {
"url": "/2.2/organizations/self/networks/untransferred",
"networks": [ /* array of "summary network objects" */ ]
},
"pagination": {
"next": "/2.2/organizations/self/networks/untransferred?offset=157"
}
}
Get All Pending Networks
Request Path: GET /2.2/organizations/self/networks/pending
Token Type: Admin, Agent
Query Parameters
Field Optional? Type Description
limit yes integer how many networks to return in each response
offset yes integer used for pagination of response data. this field is
managed by the pagination section of the API response
(more info below), and should not be set explicitly.
Response data is a JSON array of objects; each object contains a short view of network information.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": {
"url": "/2.2/organizations/self/networks/pending",
"networks": [ /* array of "summary network objects" */ ]
},
"pagination": {
"next": "/2.2/organizations/self/networks/pending?offset=157"
}
}
Get Slow Network Counts By Day
Request Path: GET /2.2/organizations/self/slow_network_counts_by_day
Token Type: Admin
38 AMAZON CONFIDENTIAL
Query Parameters
Field Optional? Type Description
start no string start date in YYYY-MM-DD format
end yes string end date in YYYY-MM-DD format
thresholds no array Thresholds separated by comma. Allowed
values are: [0.50, 0.55, 0.60, 0.65, 0.70, 0.75,
0.80, 0.85, 0.90, 0.95]
upload yes boolean Flag indicating if should use upload speed
instead of download, which is default
Response data.summary is a JSON array of objects; each object contains the day and the count of networks
the speed was in each possible interval of thresholds. For example, if we pass 2 thresholds, then counts array
will have 3 entries. One for the count below the smallest threshold, one for between both thresolds, and one
for above the greater one.
Example
{
"meta": {
"code": 200,
"server_time": "2021-10-07T14:41:49.749Z"
},
"data": {
{
"summaries": [
"day": "2021-10-01",
"counts": [
8,
16,
251
]
},
...
]
}
}
Get A Single Network
Request Path: GET /2.2/networks/:networkId
Token Type: Admin, Agent
Response data is a JSON object containing a full view of network information
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
39 AMAZON CONFIDENTIAL
"data": { /* "full network object" */ }
}
Error Responses
Status Description
403 Network ID not accessible
404 Network ID is invalid and does not exist
Update the SSID of a Network
Request Path: PUT /2.3/networks/:networkId
Token Type: Admin, Agent
Fields
Field Optional?
JSON
Type Description
name yes string New ssid (name) for the network. Max Length is 32
characters.
timezone.value yes string Time zone abbreviations e.g. (PST, EST)
Response data is a JSON object containing a full view of network information
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": { /* updated "full network object" */ }
}
Update the Password of a Network
Request Path: PUT /2.2/networks/:networkId/password
Token Type: Admin, Agent, PropertyManager
Fields
Field Optional? JSON Type Description
password no string new password for the network. Must have at least 8
characters, at most 63 characters.
Response Status code of the request. Success cases will result in 200.
40 AMAZON CONFIDENTIAL
Example {
Regular response for most of the roles:
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": { /* updated "full network object" */ }
}
{
For PropertyManager users the data will be empty:
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
}
}
Delete a Network
Request Path: DELETE /2.2/networks/:networkId
Token Type: Admin
Response The data field is omitted.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-23T20:32:12.937Z"
}
}
Reboot a Network
Request Path: POST /2.2/networks/:networkId/reboot
Token Type: Admin, Agent, PropertyManager
Response The data field is omitted.
Example
{
"meta": {
"code": 201,
"server_time": "2017-10-23T20:32:12.937Z"
}
}
41 AMAZON CONFIDENTIAL
Update a Network’s Configuration Settings
Request Path: PUT /2.2/networks/:networkId/settings
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
gateway yes String One of “dhcp”, “static”, or “bridged”
connection.mode yes String One of “nat” or “bridged”
lease.mode yes String “dhcp” or “static”
lease.static.ip yes String e.g. “192.168.7.66”
lease.static.mask yes String e.g. “255.255.255.0”
lease.static.router yes String. e.g. “192.168.7.1”
dns.mode yes String “automatic” or “custom”
dns.custom.ips yes Array[String] e.g. [“8.8.8.8”, “1.1.1.1”]
dns.caching yes Boolean Whether or not DNS Caching is
enabled
dhcp.mode yes String “automatic” or “custom”
dhcp.custom.subnet_ip yes String Custom subnet IPv4 of the network
dhcp.custom.subnet_mask yes String Custom subnet IPv4 mask of the
network
dhcp.custom.start_ip yes String Starting DHCP IPv4 lease address
dhcp.custom.end_ip yes String Ending DHCP IPv4 lease address
upnp yes Boolean Whether or not UPnP is enabled
hairpin_nat yes Boolean Whether or not Hairpin NAT is
enabled
sqm yes Boolean Whether or not SQM is enabled
band_steering yes Boolean Whether or not band_steering is
enabled
thread yes Boolean Whether or not Thread is enabled
ipv6_upstream yes Boolean Whether or not IPv6 is enabled
ipv6.name_servers.mode yes String “automatic” or “custom”
ipv6.name_servers.custom[] yes String IPv6 address
e.g. “2001:4860:4860::8888”
auto_channel_selection yes Boolean Whether or not auto channel
selection is enabled
wpa3 yes Boolean Whether or not Wi-Fi Protected
Access version 3 (WPA3) transition
mode is turned on for the network. If
the toggle is set to true the eero
network will support WPA3 for
compliant devices.
Network Configuration Mappings This table represents the combinations of fields that should be set in the
form body to place the network into a particular configuration mode.
Configuration connection.mode Value dhcp.mode Value
Automatic nat automatic
Manual nat custom
Bridged bridged N/A
42 AMAZON CONFIDENTIAL
Response data is a Full Network Object
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": [ /* Full Network Object */ ]
}
Get eeros on the Network
Request Path: GET /2.2/networks/:networkId/eeros
Token Type: Admin, Agent
Response data is a JSON array of objects; each object contains information about an eero on the network.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": [ /* array of "eero objects" */ ]
}
Run a Speed Test on the Network
Request Path: POST /2.2/networks/:networkId/speedtest
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
server_url yes String URL of speed test server to use
Response The data field is omitted.
Example
{
"meta": {
"code": 201,
"server_time": "2017-10-23T20:32:12.937Z"
}
}
43 AMAZON CONFIDENTIAL
Get a List of a Network’s Speed Tests
Request Path: GET /2.2/networks/:networkId/speedtest
Token Type: Admin
Query Parameters
Field Optional? Type Description
limit yes integer The number of historical speed tests to retrieve;
default is last 15 speed tests; maxmium is 100
startTime yes string ISO 8601 timestamp (UTC) of beginning of search
range
endTime yes string ISO 8601 timestamp (UTC) of end of search range
Response results of an individual speed test
data is a JSON array of objects; each object conatins the following information describing the
Field JSON Type Description
up_mbps number Measured upload speed in MBPS
down_mbps number Measured download speed in MBPS
date string ISO 8601 timestamp (UTC) of speed test
Example
{
"data": [
{
"up_mbps": 6.020584,
"down_mbps": 89.466496,
"date": "2019-10-24T13:30:00+0000"
},
{
"up_mbps": 5.974856,
"down_mbps": 89.047864,
"date": "2019-10-22T13:30:00+0000"
}
],
"meta": {
"code": 200,
"server_time": "2019-10-24T19:23:58.025Z"
}
}
Transfer a Network
Request Path: POST /2.2/networks/:networkId/transfer
Token Type: Admin, Agent
Fields
44 AMAZON CONFIDENTIAL
Field Optional? Type Description
name yes string Name of the recipient of the transfer
phone_number yes string Phone number of the recipient of the transfer
e.g. (+14085555555)
email_address yes string Email address of the recipient of the transfer.
recipient_user_id yes int User ID of the recipient of the transfer.
Response The data field is omitted.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-23T20:32:12.937Z"
}
}
Resend linking email (if network is unverified)
Request Path: POST /2.2/networks/:id/transfer/resend
Token Type: Admin, PropertyManager
Success Example
{
"meta": {
"code": 200,
"server_time": "2025-03-12T22:26:45.636Z"
}
}
Error Responses
Status Description
403 500 Access denied for this operation
Internal error resending new linking email
Get Guest Network for a Network
Request Path: GET /2.2/networks/:networkId/guestnetwork
Token Type: Admin, Agent
Response The data field contains information about the guest network.
Example
{
"meta": {
"code": 200,
45 AMAZON CONFIDENTIAL
"server_time": "2021-12-23T19:41:48.696Z"
},
"data": {
"url": "/2.2/networks/:networkId/guestnetwork",
"resources": {
"password": "/2.2/networks/:networkId/guestnetwork/password"
},
"name": "My Guest Network",
"password": null,
"enabled": false
}
}
Create Guest Network for a Network
Request Path: PUT /2.3/networks/:networkId/guestnetwork
Token Type: Admin, Agent
Fields
Field Optional? Type Description
name yes string Name of the guest network to be created
enabled yes boolean true if the guest network to be created is enabled
Response The data field contains information about the guest network.
Example
{
"meta": {
"code": 200,
"server_time": "2021-12-23T19:41:48.696Z"
},
"data": {
"url": "/2.2/networks/:networkId/guestnetwork",
"resources": {
"password": "/2.2/networks/:networkId/guestnetwork/password"
},
"name": "My Guest Network",
"password": null,
"enabled": false
}
}
Update Password of Guest Network
Request Path: PUT /2.2/networks/:networkId/guestnetwork/password
Token Type: Admin, Agent
Fields
46 AMAZON CONFIDENTIAL
Field Optional? Type Description
password no string New password for the guest network
Response The data field contains information about the guest network.
Example
{
"meta": {
"code": 200,
"server_time": "2021-12-23T20:01:32.305Z"
},
"data": {
"url": "/2.2/networks/:networkId/guestnetwork",
"resources": {
"password": "/2.2/networks/:networkId/guestnetwork/password"
},
"name": "My Guest Network",
"password": "MyNewPassword",
"enabled": false
}
}
Set a network’s custom label (aka the “Home Identifier”)
Request Path: PUT /2.2/networks/:networkId/label
Token Type: Admin, Agent
Fields
Field Optional? Type Description
label yes string Label for network. Max Length is 32 characters.
Response data is a JSON object containing a full view of network information after updating the label
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": { /* updated "full network object" */ }
}
Error Responses
Status Description
403 Network ID not accessible
47 AMAZON CONFIDENTIAL
Status Description
404 Network ID is invalid
Get a network’s custom label (aka the “Home Identifier”)
Request Path: GET /2.2/networks/:networkId/label
Token Type: Admin, Agent
Response data is a JSON object information about the network’s new label
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": {
"label": "New Label"
}
}
Set a network’s “nickname”
This request uses the same path as Set a network's custom label (aka the "Home Identifier") by
using a URL query parameter to differentiate it from the Home Identifier resource. For residential and eero
for Communities networks this endpoint sets the network’s nickname. For eero for Business networks, this
endpoint sets the network’s business name. See eero for Business API - Set Business Name for details.
Request Path: PUT /2.2/networks/:networkId/label?labelType=SpecialMarket
Token Type: Admin, Agent
Fields
Field Optional? Type Description
label yes string Label for network. Max Length is 32 characters.
Response data is a JSON object containing a full view of network information after updating the nickname
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": { /* updated "full network object" */ }
}
48 AMAZON CONFIDENTIAL
Error Responses
Status Description
403 Network ID not accessible
404 Network ID is invalid
Get a network’s “nickname”
Request Path: GET /2.2/networks/:networkId/label?labelType=SpecialMarket
Token Type: Admin, Agent
Response data is a JSON object information about the network’s nickname
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": {
"label": "New Label"
}
}
Error Responses
Status Description
403 Network ID not accessible
404 Network ID is invalid or does not have a label
Disassociate a Network from an Organization
For workflows that require the ability to convert partner-managed eeros to retail units this endpoint can be
used to disassociate all the eero units in a network. The network and its units will no longer be managed
by or visible to the organization. The network will be fully controlled by the end customer. The end user’s
network remains unchanged when this endpoint is called and calling it is transparent to the customer.
Request Path: DELETE /2.2/networks/:id/organization_association
Token Type: Admin
Response The data field is omitted.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-23T20:32:12.937Z"
}
}
49 AMAZON CONFIDENTIAL
Error Responses
Status Description
403 Network ID not accessible
404 Network ID is invalid or does not have a label
Create a Temporary Admin for a Network
If there is a need to temporarily transfer ownership of a network to a member of an organization’s tech support
team, this endpoint can be used to allow an admin team member to have owner-level control over the network
for 48 hours.
Request Path: POST /2.2/networks/:id/users
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
user_id no String User ID of the ISP admin who will receive
temporary owner access
network_role no String Role of the user in the context of of
network-level permissions and access. The
endpoint will only work if the value
“temporary-admin” is passed
Response The data field is omitted.
Example
{
"meta": {
"code": 201,
"server_time": "2017-10-23T20:32:12.937Z"
}
}
Get Public Static IP for a Network
Request Path: GET /2.3/networks/:id/multistaticip
Token Type: ISP Admin, ISP Agent, ISP Super user, ISP Technician
Response object.
object.
data is a JSON object containing a full view of network public static IP information
• If public static IP is under PublicLAN type, information will be returned under multistaticip_settings
• If public static IP is under NATWithPortFwd type, information will be returned under multistaticip_settings_nat_portf
50 AMAZON CONFIDENTIAL
Example When public static IP setting under PublicLAN type:
{
"meta": {
"code": 200,
"server_time": "2024-06-11T16:13:00.161Z"
},
"data": {
"enabled": true,
"type": "PublicLAN",
"multistaticip_settings": {
"subnet_ip": "10.0.109.0",
"subnet_mask": "255.255.255.0",
"router_ip": "10.0.111.1"
},
"multistaticip_settings_nat_portfwd": {
"subnet_ip_start": null,
"subnet_ip_end": null
}
}
When public static IP setting under NATWithPortFwd type
}
{
"meta": {
"code": 200,
"server_time": "2024-06-11T16:13:00.161Z"
},
"data": {
"enabled": true,
"type": "PublicLAN",
"multistaticip_settings": {
"subnet_ip": null,
"subnet_mask": null,
"router_ip": null
},
"multistaticip_settings_nat_portfwd": {
"subnet_ip_start": "46.46.46.46",
"subnet_ip_end": "46.46.46.64"
}
}
}
Error Responses
Status Description
401 Access Denied
404 Network ID is invalid or public static IP does not exist
Update Public Static IP for a Network
Set a network public static IP for a network
Request Path: PUT /2.3/networks/:id/multistaticip
51 AMAZON CONFIDENTIAL
Token Type: Admin, Agent, ISP Tech
Fields
Field Optional? Type Description
enabled no boolean Status for network public static IP
type yes enum
Type of network public static IP, PublicLAN or
string
NATWithPortFwd, default to PublicLAN type if
null
multistaticip_settings yes object Status for network public static IP, dedicated
for PublicLAN type
multistaticip_settings_nat_portfwd yes object Status for network public static IP, dedicated
for NATWithPortFwd type
MultistaticIP Settings Object
Field Optional? JSON Type Description
subnet_ip no string ipv4 serverIP block information
subnet_mask no string ipv4 subnet mask information
MultistaticIP Settings Nat PortFwd Object
Field Optional? JSON Type Description
subnet_ip_start no string ipv4 range starting IP
subnet_ip_end no string ipv4 range ending IP
Response object.
object.
data is a JSON object containing a full view of network public static IP information.
• If public static IP is under PublicLAN type, information will be returned under multistaticip_settings
• If public static IP is under NATWithPortFwd type, information will be returned under multistaticip_settings_nat_portf
Example {
When public static IP setting under PublicLAN type
"meta": {
"code": 200,
"server_time": "2024-06-11T16:13:00.161Z"
},
"data": {
"enabled": true,
"type": "PublicLAN",
"multistaticip_settings": {
"subnet_ip": "10.0.109.0",
"subnet_mask": "255.255.255.0",
"router_ip": "10.0.111.1"
},
"multistaticip_settings_nat_portfwd": {
52 AMAZON CONFIDENTIAL
"subnet_ip_start": null,
"subnet_ip_end": null
}
}
When public static IP setting under NATWithPortFwd type
}
{
"meta": {
"code": 200,
"server_time": "2024-06-11T16:13:00.161Z"
},
"data": {
"enabled": true,
"type": "PublicLAN",
"multistaticip_settings": {
"subnet_ip": null,
"subnet_mask": null,
"router_ip": null
},
"multistaticip_settings_nat_portfwd": {
"subnet_ip_start": "46.46.46.46",
"subnet_ip_end": "46.46.46.64"
}
}
}
Error Responses
Status Description
401 Access Denied
400 Bad Request - Network Subnet Mask is less than /30 or greater than /23, Network
Firmware is not latest, Hardware does not support public static IP. NatWithPortFwd subnet
range greater than 64.
404 Network ID does not exist
Organization network and user subscription creation
For a better understanding about the flow there is a simple example to API call sequence that create a cus-
tomer on eero Service Cloud platform and transfer network ownership once it’s created.
Create Network requirements
Client should perform Authentication process in order to have a valid token to sign network creation requests,
also it needs to have eero serial numbers assigned (WIP). (See Figure.1)
53 AMAZON CONFIDENTIAL
Network creation and user subscription
(See Figure.2)
54 AMAZON CONFIDENTIAL
55 AMAZON CONFIDENTIAL
Data Plan API
These APIs are designed for partners to set plan metadata about their managed networks. Your workflows
should call these APIs after a network is setup or the network’s plan is changed. After you configure a net-
work’s data plan, eero Insight will use the plan as a benchmark to generate reports, metrics, and dashboards
for the network’s historical usage and performance.
Objects
Data Plan Object
Field Optional?
JSON
Type Description
up_speed_bits_per_second no integer The maximum upload speed of the
network’s data plan in bits per second
down_speed_bits_per_second no integer The maximum download speed of the
network’s data plan in bits per second
data_cap_bytes_per_month no integer The maximum allowed data usage of the
network in bytes per month
billing_day_of_month no integer Day of the month on which a user’s plan
is billed and a new monthly data cycle
begins
APIs
Update or create a new network data plan
Request Path: PUT /2.2/networks/:id/data_plan
Token Type: Admin, Agent
Fields
Field Optional?
JSON
Type Description
up_speed_bits_per_second no integer The maximum upload speed of the
network’s data plan in bits per second
down_speed_bits_per_second no integer The maximum download speed of the
network’s data plan in bits per second
data_cap_bytes_per_month no integer The maximum allowed data usage of the
network in bytes per month
billing_day_of_month no integer Day of the month on which a user’s plan
is billed and a new monthly data cycle
begins
Request:
{
"up_speed_bits_per_second": 200000000,
"down_speed_bits_per_second": 200000000,
"data_cap_bytes_per_month": 1500000000,
"billing_day_of_month": 10
}
56 AMAZON CONFIDENTIAL
Responses
Success: 200 Ok
{
"meta": {
"code": 200
}
}
{
Failure: 404 Not Found Network is invalid or cannot be found
"meta": {
"code": 404
}
}
Get the data plan for a network
Request Path: GET /2.2/networks/:id/data_plan
Token Type: Admin, Agent
Responses
Success: 200 Ok
{
"data": {
"up_speed_bits_per_second": 200000000,
"down_speed_bits_per_second": 200000000,
"data_cap_bytes_per_month": 1500000000,
"billing_day_of_month": 10
},
"meta": {
"code": 200
}
}
Failure: 404 Not Found Network is invalid or does not have a data plan
{
"meta": {
"code": 404
}
}
Delete a network’s data plan
Request Path: DELETE /2.2/networks/:id/data_plan
Token Type: Admin, Agent
Responses
57 AMAZON CONFIDENTIAL
Success: 200 Ok
{
"meta": {
"code": 200
}
}
Failure: 404 Not Found Network is invalid or does not have a data plan
{
"meta": {
"code": 404
}
}
58 AMAZON CONFIDENTIAL
IPv4 Port Forwarding API
Objects
Port Forwarding Object
Field JSON Type Description
url string URL of forward (i.e. /2.2/networks/:networkId/forwards/:forwardId)
ip string The IP for the device
description string Nickname of the port forward
gateway_port number The port that will be forwarded
client_port number The destination port
protocol string One of tcp, udp, or both
enabled boolean Default to true. Determines whether the forward is enabled
APIs
Get Port Forwards for a Network
Request Path: GET /2.2/networks/:networkId/forwards
Token Type: Admin, Agent
Response data is a JSON array of objects; each object contains information about a port forward.
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:01:08.413Z"
},
"data": [ /* array of "Port Forward objects" */ ]
}
Create a Port Forward for a Network
Request Path: POST /2.2/networks/:networkId/forwards
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
ip no string The IP of the device
description no string Nickname of the port forward
gateway_port no number The port that will be forwarded
client_port no number The destination port
protocol no string One of tcp, udp, or both
enabled yes boolean Defaults to true. Determines whether the forward is
enabled.
Response data is a JSON object of the newly created port forward.
59 AMAZON CONFIDENTIAL
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:14:20.481Z"
},
"data": { /* new "Port forward object" */ }
}
Error Responses
Status Description
409 Likely due to port/protocol already being forwarded to
Edit a Port Forward for a Network
Request Path: PUT /2.2/networks/:networkId/forwards/:id
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
ip no string The IP of the device
description no string Nickname of the port forward
gateway_port no number The port that will be forwarded
client_port no number The destination port
protocol no string One of tcp, udp, or both
enabled yes boolean Defaults to true. Determines whether the forward is
enabled
Response data is a JSON object of the edited port forward.
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:17:58.368Z"
},
"data": { /* updated "Port forward object" */ }
}
Error Responses
Status Description
409 Likely due to port/protocol already being forwarded to
60 AMAZON CONFIDENTIAL
Delete a Port Forward for a Network
Request Path: DELETE /2.2/networks/:networkId/forwards/:forwardId
Token Type: Admin, Agent
Response The data field is omitted.
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:21:01.245Z"
}
}
61 AMAZON CONFIDENTIAL
IPv4 Reservations API
Objects
Network Reservation Object
Field
JSON
Type Description
url string URL of reservation
(i.e. /2.2/networks/:networkId/reservations/:reservationsId)
mac string MAC address of the reserved device
description string user-specified reservation identifier
ip string IP address given to the device
public_static_ip string Public Static IPv4 address given to the device
APIs
Get Current Set of IP Reservations on a Network
Request Path: GET /2.2/networks/:networkId/reservations
Token Type: Admin, Agent
Response data is a JSON array of objects; each object contains information about a network IP reservation.
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:01:08.413Z"
},
"data": [ /* array of "Network Reservation objects" */ ]
}
Create a New IP Reservation on a Network
Request Path: POST /2.2/networks/:networksId/reservations
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
mac no string MAC address of the reserved device
description yes string Description of the reservation
ip no string IP address given to the device
public_static_ip yes string Public Static IPv4 address given to the device
Response data is a JSON object of the newly created network IP reservation.
62 AMAZON CONFIDENTIAL
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:14:20.481Z"
},
"data": { /* new "Network Reservation object" */ }
}
Error Responses
Status Description
400 409 IP address is outside of the current subnet block of the network. If public static IP is
defined and address is outside of the current public static IP range of the network
Likely due to either the MAC address or the ip address are already reserved
Edit an IP Reservation on a Network
Request Path: PUT /2.2/networks/:networkId/reservations/:macId
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
description yes string Description of the reservation
ip no string IP address given to the device
public_static_ip yes string Public static IP address given to the device
Response data is a JSON object of the edited network IP reservation.
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:17:58.368Z"
},
"data": { /* updated "Network Reservation object" */ }
}
Error Responses
Status Description
400 409 IP address is outside of the current subnet block of the network. If public static IP is
defined and address is outside of the current public static IP range of the network
Likely due to either the MAC address or the ip address are already reserved
63 AMAZON CONFIDENTIAL
Delete an IP Reservation on a Network
Request Path: DELETE /2.2/networks/:networkId/reservations/:macId
Token Type: Admin, Agent
Response The data field is omitted.
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:21:01.245Z"
}
}
64 AMAZON CONFIDENTIAL
IPv6 Pinhole Management API
These APIs target IPv6 Pinholes for devices on user networks. Pinholes are IPv6 firewall rules targeted at
specific devices. By default all incoming IPv6 traffic is disallowed on an eero network. Each pinhole can allow
IPv6 addressed TCP and/or UDP packets on a specific port or over a port range of up to 100 ports to a device
identified by MAC address. A device does not have to be associated with a network before creating pinholes
for the device’s MAC address.
Objects
Summary Pinhole Response Object
Field Optional?
JSON
Type Description
url no string URL of pinhole
(i.e. /2.2/networks/:networkId/ipv6/pinholes/:pinholeId)
device no string URL of device associated with the pinhole
protocol no string “tcp”, “udp”, or “both”
port no, range
string “3033”, “3000-3099”
optional
APIs
Create a new pinhole
Request Path: POST /2.2/networks/:id/ipv6/pinholes
Token Type: Admin, Agent
Fields
Parameter Optional?
JSON
Type Description
device no string Device MAC in URL form
(i.e. /2.2/networks/:networkId/devices/:mac)
protocol no string IP Protocol set, one of “tcp”, “udp”, or “both”
port no string Port, range optional, e.g. “3033”, “3000-3099”
Request:
{
"device": "/2.2/networks/3/devices/0123456789ab",
"protocol": "tcp",
"port": "22"
}
Responses
Success: 200 Ok
65 AMAZON CONFIDENTIAL
{
"meta": {
"code": 200
},
"data": [
{
"url": "/2.2/networks/3/ipv6/pinholes/4",
"device": "/2.2/networks/3/devices/0123456789ab",
"protocol": "tcp",
"port": "22"
}
]
}
{
Failure: 409 Conflict return the following error body
A new pinhole overlapping an existing pinhole’s port range cannot be added, and will
"meta": {
"code": 409,
"error": "error.ipv6.pinhole.conflict"
}
}
Retrieve all pinholes for a specified network
Request Path: GET /2.2/networks/:id/ipv6/pinholes
Token Type: Admin, Agent
Responses
Success: 200 Ok
{
"meta": {
"code": 200
},
"data": [
{
"url": "/2.2/networks/3/ipv6/pinholes/4",
"device": "/2.2/networks/3/devices/0123456789ab",
"protocol": "tcp",
"port": "22"
},
{
"url": "/2.2/networks/3/ipv6/pinholes/5",
"device": "/2.2/networks/3/devices/0123456789ab",
"protocol": "both",
"port": "3000-3099"
}
]
}
66 AMAZON CONFIDENTIAL
Retrieve a single pinhole that exists for a network
Request Path: GET /2.2/networks/:networkId/ipv6/pinholes/:pinholeId
Token Type: Admin, Agent
Responses
Success: 200 Ok
{
"meta": {
"code": 200
},
"data": {
"url": "/2.2/networks/3/ipv6/pinholes/4",
"device": "/2.2/networks/3/devices/0123456789ab",
"protocol": "tcp",
"port": "22"
}
}
Failure: 404 Not Found If the requested pinhole does not exist. NOTE: If a pinhole range existed, e.g. 3000-
3099, and the client requested a pinhole within the range, e.g. 3056, this would still return a 404 Not Found
response
{
"meta": {
"code": 404
}
}
Modify an existing pinhole
Request Path: PUT /2.2/networks/:networkId/ipv6/pinholes/:pinholeId
Token Type: Admin, Agent
Parameters
Parameter Optional?
JSON
Type Description
device no string Device MAC in URL form
(i.e. /2.2/networks/:networkId/devices/:mac)
protocol no string IP Protocol set, one of “tcp”, “udp”, or “both”
port no string Port, range optional, e.g. “3033”, “3000-3099”
Request:
{
"device": "/2.2/networks/3/devices/0123456789ab",
"protocol": "tcp",
"port": "22"
}
67 AMAZON CONFIDENTIAL
Responses
Success: 200 Ok
{
"meta": {
"code": 200
},
"data": [
{
"url": "/2.2/networks/3/ipv6/pinholes/5",
"device": "/2.2/networks/3/devices/0123456789ab",
"protocol": "both",
"port": "3000-3099"
}
]
}
Failure: 404 Not Found If the pinhole does not already exist.
{
"meta": {
"code": 404
}
}
Failure: 409 Conflict the API will return the following error body
The pinhole’s new port range cannot overlap another of the devices pinhole ports, or
{
"meta": {
"code": 409,
"error": "error.ipv6.pinhole.conflict"
}
}
Remove an existing pinhole
Request Path: DELETE /2.2/networks/:networkId/ipv6/pinholes/:pinholeId
Token Type: Admin, Agent
Responses
Success: 200 Ok Always returns success, even if no matching pinhole could be found
68 AMAZON CONFIDENTIAL
Customer Account API
These APIs should be used by service provider partners to tie their internal customer management systems
to eero’s internal models. These APIs are integral to the workflow of the Subscription API. Once a partner
account has been created using the APIs in this section, the APIs described in the Subscriptions API can be
used to enroll customers into eero Secure or eero Secure+ even if a network does not yet exist.
The APIs in this section create unique, long-lived customer records that are separate from the eero User (end
user customer) or Network records Additionally, these APIs can be used to tie partner customer identifiers to
eero Serial numbers and eero (Secure or Secure+) subscriptions.
Objects
Customer Account Object
Field Optional? JSON Type Description
partner_account_id no string Unique customer identifier set by the
service provider when creating a new
customer account. The field can contain
any unique identifier a partner uses for
its internal customer management (or
some identifier the partner can map to
its internal system). Partners will be
required to provide a unique field to
successfully generate a new customer
account record.
created no string ISO 8601 time of account creation
serials yes array [string] An array of eero serials that are tied to a
user account
networks yes array [string] An array of network URLs associated
with the customer account
Subscription Object
Field Optional?
JSON
Type Description
id no string Unique ID of subscription (can be used with
Subscription API)
partner_account_id no string Unique customer identifier set by the
service provider when creating a new
customer account. The field can contain
any unique identifier a partner uses for its
internal customer management (or some
identifier the partner can map to its internal
system). Partners will be required to
provide a unique field to successfully
generate a new customer account record.
status no string One of pending, active, canceled
created no string ISO 8601 time of subscription creation
activated yes string ISO 8601 time of subscription activation
deleted yes string ISO 8601 time of subscription deletion
69 AMAZON CONFIDENTIAL
APIs
Create a new customer account
Request Path: POST /2.2/customer_accounts
Token Type: Admin, Agent
Fields
Field Optional?
JSON
Type Description
partner_account_id no string Unique customer identifier set by the service
provider when creating a new customer account.
The field can contain any unique identifier a
partner uses for its internal customer
management (or some identifier the partner can
map to its internal system). Partners will be
required to provide a unique field to successfully
generate a new customer account record.
serials yes array
An array of eero serials that are tied to a user
overwrite_serial_associations yes [string]
boolean account
If true, any submitted serials owned by the
organization with previously assigned customer
account records will be overwritten with the
incoming customer account. If a different eero
user account is already assigned, or if this field is
false, a 409 error will occur on clash. Defaults to
false.
overwrite_user_associations yes boolean Only used if overwrite_serial_associations is
also true. Checks for clashing eero user account
association - on true, overwrite the serial’s eero
user account association with the user associated
with the new incoming customer account record.
Defaults to false.
Response data is a JSON object containing a Customer Account Object
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data": {
"partner_account_id": "ABCD123456",
"created": "2018-04-02T15:50:00.352Z",
"serials": ["3NSNWYRZ3DF7QTN9", "3NSNWYRZ3DF7QTN8", "3NSNWYRZ3DF7QTN0"],
"networks": ["/2.2/networks/4"]
}
}
70 AMAZON CONFIDENTIAL
Error Responses
Status Error Field Description
404 empty Any of the serial numbers provided are not
associated with the organization or are invalid
409 error.customer.account.id.exists Organization already has a record with the provided
partner_account_id
409 error.user.serials.already.owned Serial number is already associated to another
customer account.
Get a customer account
Request Path: GET /2.2/customer_accounts/:partner_account_id
Token Type: Admin, Agent
Response data is a JSON object containing a Customer Account Object
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data": {
"partner_account_id": "ABCD123456",
"created": "2018-04-02T15:50:00.352Z",
"serials": ["3NSNWYRZ3DF7QTN9", "3NSNWYRZ3DF7QTN8", "3NSNWYRZ3DF7QTN0"],
"networks": ["/2.2/networks/4"],
"subscription": {
"id": 5,
"status": "pending",
"created": "2018-04-02T15:50:00.352Z"
}
}
}
Error Responses
Status Error Field Description
404 empty A customer account record with the passed partner_account_id
does not exist for the requesting organization
Update an existing customer account
Request Path: PUT /2.2/customer_accounts/:partner_account_id
Token Type: Admin, Agent
Fields
71 AMAZON CONFIDENTIAL
Field Optional? JSON Type Description
serials yes array [string] An array of eero serials that are tied to a
user account
Notes The PUT operation has 2 use cases. 1. Associate serials with existing partner_account_id.
This use case is dependent on partner_account_id already existing in our database via POST
/2.2/customer_accounts/:id. In this instance, PUT operation is a destructive replace. This is in line
with standard PUT behavior and places full control of customer account to serial management with our
partners.
* Any serials provided in the call will overwrite existing serials associated with the customer account. *
Providing an empty list of serials will remove all existing serials associated with the customer account. *
Sending an array of serials consisting of a customer account’s existing set of serials will not cause any
changes.
2. Associate a new partner_account_id using serials. This use case is dependent on partner_account_id
not existing in our database. In this instance, a serial list is required in order to properly backfill. If
serials were not provided, we will skip backfill.
• Any serials provided in this call will be used to search for their owner. If a single common user is
found, the partner_account_id will be assigned to them. If there are multiple owners, a serial
ownership conflict will be thrown.
Response data is a JSON object containing a Customer Account Object
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data": {
"partner_account_id": "ABCD123456",
"created": "2018-04-02T15:50:00.352Z",
"serials": ["3NSNWYRZ3DF7QTN9", "3NSNWYRZ3DF7QTN8", "3NSNWYRZ3DF7QTN0"],
"networks": ["/2.2/networks/4"]
}
}
Error Responses
Status Error Field Description
400 error.network.no_owner A network has not been created with this serial
number
404 empty Any of the serial numbers provided are not
associated with the organization or are invalid
409 error.user.serials.already.owned Serial number is already associated to another
customer account.
Delete a customer account
Request Path: DELETE /2.2/customer_accounts/:partner_account_id
Token Type: Admin, Agent
72 AMAZON CONFIDENTIAL
Response The data field is omitted.
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
}
}
Error Responses
Status Error Field Description
404 empty A customer account record with the passed
partner_account_id does not exist for the requesting
organization
73 AMAZON CONFIDENTIAL
Subscription API
These APIs should be used by service provider partners to subscribe their customers to eero Secure or eero
Secure+. Partners should create Customer Account instances using the Customer Account API and manage
subscriptions using the Subscription API. These APIs can be used to enroll customers in eero Secure or eero
Secure+ even if a network does not yet exist for a customer.
Objects
Subscription Object
Field Optional?
JSON
Type Description
id no string Unique ID of subscription (can be used with
Subscription API)
partner_account_id no string Unique customer identifier set by the
service provider when creating a new
customer account. The field can contain
any unique identifier a partner uses for its
internal customer management (or some
identifier the partner can map to its internal
system).
status no string One of pending, active, canceled
plan yes string One of Secure, SecurePlus or post-fixed
by country code such as SecureCA and
SecurePlusCA for Canada
created no string ISO 8601 time of subscription creation
activated yes string ISO 8601 time of subscription activation
deleted yes string ISO 8601 time of subscription deletion
APIs
Create a new subscription
Request Path: POST /2.2/subscriptions
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
partner_account_id no string Unique customer identifier set by the
service provider when creating a new
customer account. The field can contain
any unique identifier a partner uses for
its internal customer management (or
some identifier the partner can map to
its internal system).
plan_name yes string Subscription plan to enroll customer in.
One of secure, secureplus, or unknown.
Defaults to secureplus.
74 AMAZON CONFIDENTIAL
Response data is a JSON object containing a Subscription Object
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data" : {
"subscription" : { /* Newly created subscription object */}
}
}
Error Responses
Status Error Field Description
404 409 empty empty A customer account record with the passed partner_account_id
does not exist for the requesting organization
Organization already has a subscription associated with the provided
partner_account_id
Get a subscription by ID
Request Path: GET /2.2/subscriptions/:id
Token Type: Admin, Agent
Response data is a JSON object containing a Subscription Object
Example
{
}
}
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data": {
"subscription" : { /* Newly created subscription object */ }
Error Responses
Status Error Field Description
404 empty A subcription record with the passed id does not exist for the
requesting organization
Get a subscription by partner account ID
Request Path: GET /2.2/subscriptions/partner_account/:partnerAccountId
Token Type: Admin, Agent
75 AMAZON CONFIDENTIAL
Response data is a JSON object containing a Subscription Object
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data": {
"subscription" : { /* Newly created subscription object */ }
}
}
Error Responses
Status Error Field Description
404 empty A subcription record with the passed partnerAccountId does not
exist for the requesting organization
Delete a subscription by ID
Request Path: DELETE /2.2/subscriptions/:id
Token Type: Admin, Agent
Response The data field is omitted.
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
}
}
Error Responses
Status Error Field Description
404 empty A subcription record with the passed id does not exist for the
requesting organization
Delete a subscription by partner account ID
Request Path: DELETE /2.2/subscriptions/partner_account/:partnerAccountId
Token Type: Admin, Agent
Response The data field is omitted.
76 AMAZON CONFIDENTIAL
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
}
}
Error Responses
Status Error Field Description
404 empty A subcription associated with the passed partnerAccountId
does not exist for the requesting organization
Query for subscriptions managed by an organization
Request Path: GET /2.2/subscriptions
Token Type: Admin, Agent
Query Parameters
Field Optional? Type Description
start no string ISO 8601 timestamp (UTC) of beginning of
search range
end no string ISO 8601 timestamp (UTC) of end of search
range
status yes string One of “pending”, “active”, “canceled”
limit yes integer How many networks to return in each
response
offset yes integer Used for pagination of response data. this
field is managed by the pagination section
of the API response (more info below), and
should not be set explicitly.
Response data is a JSON object containing an array of Subscription Object
Example Usage: GET /2.2/subscriptions?start=2021-11-01T04:13:45.811Z&end=2021-11-30T04:13:45.811Z
Response body:
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data" : {
"url": /*String URL with current request*/,
"subscriptions" : [
{
"id": 8,
77 AMAZON CONFIDENTIAL
"partner_account_id": "TEST",
"status": "pending",
"plan": "SecurePlus",
"created": "2021-11-11T18:51:08.178Z",
"activated": "2021-11-12T16:37:05.763Z",
"deleted": null
},
{ /* Subscription Object 2 */ },
{ /* Subscription Object 2 */ },
{ /* Subscription Object 3 */ },
...
],
"page_size" : 100,
"next_offset" : 22
},
"pagination": {
"next" : { /*String URL of next page */}
}
}
78 AMAZON CONFIDENTIAL
eero Secure+ API
These APIs should be used by service provider partners to manage their customers’ subscriptions.
Additionally, by providing a partner_account_id in the POST call, these APIs can be used to tie partner
customer identifiers to eero Serial numbers and eero (Secure or Secure+) subscriptions.
Objects
eero Secure+ Subscription Object
Field Optional? JSON Type Description
status no string one of trialing, active, past_due,
canceled, unpaid
cancel_at_period_end no boolean true if the subscription will be cancelled at
the end of the current period
created no string ISO 8601 time of subscription creation
plan_name yes string One of Secure, SecurePlus or post-fixed
by country code such as SecureCA and
SecurePlusCA for Canada
Note: Although plan_name parameter is optional, if is not provided, SecurePlus plan is going to be used.
APIs
Get eero Secure/Secure+ information for a Network
Request Path: GET /2.2/networks/:id/premium
Token Type: Admin, Agent
Response data is a JSON object containing the premium subscription information
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data": {
"status": "active",
"cancel_at_period_end": false,
"created": "2018-04-02T15:50:00.352Z",
"plan_name": "SecurePlus"
}
}
Error Responses
Status Error Field Description
404 empty Network does not exist or does not have a subscription
79 AMAZON CONFIDENTIAL
Status Error Field Description
403 error.access.denied Network not managed by ISP
Subscribe a Network to eero Secure+
Requirements vated.
A network must be created and transferred to the eero customer. The eero customer must
have a verified phone or a verified email with eero before eero Secure or Secure+ can be successfully acti-
Request Path: POST /2.2/networks/:id/premium
Token Type: Admin, Agent
Fields
Field Optional?
JSON
Type Description
plan_name yes string Service plan name, one of “secure”,
“secureplus”, or “unknown”
partner_account_id yes string Unique customer identifier set by the service
provider when creating a new customer
account. The field can contain any unique
identifier a partner uses for its internal
customer management (or some identifier the
partner can map to its internal system).
Partners will be required to provide a unique
field to successfully generate a new customer
account record.
Response data is a JSON object containing the eero premium subscription information
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data": {
"status": "active",
"cancel_at_period_end": false,
"created": "2018-04-02T15:50:00.352Z",
"plan_name": "SecurePlus"
}
}
or
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
80 AMAZON CONFIDENTIAL
"data": {
"status": "active",
"cancel_at_period_end": false,
"created": "2018-04-02T15:50:00.352Z",
"plan_name": "Secure"
}
}
Error Responses
Status Error Field Description
404 empty Network does not exist
400 error.network.transfer.not_completed Network not transferred to user
400 error.user.not_verified Network was transferred but the user has
not verified their account
403 error.access.denied Network not managed by ISP
409 error.premium.network_already_subscribed Network has a subscription already
Cancel a subscription to eero Secure+
Request Path: DELETE /2.2/networks/:id/premium
Token Type: Admin, Agent
Response data is a JSON object containing the eero premium subscription information
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
}
}
Error Responses
Status Error Field Description
404 empty Network does not exist or does not have a subscription
403 error.access.denied Network not managed by ISP
81 AMAZON CONFIDENTIAL
Devices & Profiles APIs
This set of APIs allows for viewing devices connected to the network, and managing profiles of devices
Objects
Device
Field Optional? JSON Type Description
url no string URL for this device
mac no string MAC address of the device
eui64 no string EUI-64 address of the device
manufacturer no string Name of the manufacturer
ips no array IP addresses assigned to the device
nickname yes object User-assigned nickname for this device, if
any
hostname no string Device hostname
connected no boolean Whether the device is currently connected
wireless no boolean Whether the device is wireless
connection_type no string Sonos, Thread, Wireless, or Wired
source no object Contains the name of the node device is
using
last_active no timestamp Last time the device was seen on the
network
first_active no timestamp First time the device was seen on the
network
connectivity no object Information about the device’s connection
connectivity.rx_bitrate yes string The amount of receive (RX) data transmitted
per second on the device’s connection
connectivity.signal yes string Absolute value of the signal of the device in
the connection
connectivity.signal_avg yes string Average value of the signal of the device in
the connection
connectivity.score yes double Score value calculated based on Modulation
Coding Scheme (MCS) and Received Signal
Strength Indicator (RSSI) (see “Connectivity
Score Calculation” note below)
connectivity.score_bars yes integer Classification of the score value: below 0.10
is 1, between 0.10 and 0.20 is 2, between
0.20 and 0.30 is 3, between 0.30 and 0.65 is
4 and above 0.65 is 5
interface no object Information about the network interface the
device is connected with
usage yes object Current state and schedule for this profile
usage.down_mbps no double Device’s RX bytes in megabits per second
usage.up_mbps no double Device’s TX bytes in megabits per second
device_type no string Device type is derived by our system by
looking across multiple attributes. Valid
device types are audio, cable_box,
desktop_computer, game_console, generic,
laptop_computer, network_equipment,
phone, printer, security_camera, tablet,
unknown_computer, watch
82 AMAZON CONFIDENTIAL
Connectivity Score Calculation
If the signal is greater than or equal to -75 dbms, the following formula is used:
score = MCSnum/9
Otherwise, when the score is smaller than -75 dbms, the following formula is used:
score = (MCSnum/9)*(4+0.04*DBMS)
The following MCS 10-15 conversion is used:
MCSnum = MCSnum % 8
For MCS 8&9, we also take the mod 8 value if the transmission is not VHT, which is declared in the rx bitrate
string.
Profile
Field Optional? JSON Type Description
url no string URL for this profile
name no string This profile’s name
paused no boolean Whether this profile is paused
devices no array Information about devices associated with this profile
schedule yes array Scheduled pauses for this profile
state no object Current state and schedule for this profile
Example
{
"url": "/2.2/networks/2/profiles/2",
"name": "My Profile",
"paused": false,
"devices": [
{
"mac": "cc:20:e8:12:ba:e8",
"eui64": "ce20e8fffe113ae9",
"manufacturer": "Apple, Inc.",
"ips": [],
"nickname": null,
"hostname": "Pauls-iPhone",
"connected": false,
"wireless": true,
"connection_type": "wireless",
"source": {
"location": "Bedroom"
},
"last_active": "2017-10-23T15:32:32.438Z",
"first_active": "2017-10-23T13:50:23.802Z",
"connectivity": {
"rx_bitrate": "24.0 MBit/s",
"signal": "-80 dBm",
"signal_avg": "-80 dBm",
"score_bars": 1
},
"interface": {
83 AMAZON CONFIDENTIAL
"frequency": "2.4",
"frequency_unit": "GHz"
},
"usage": null,
"device_type": "phone"
}
],
"schedule": [],
"state": {
"value": "Active",
"schedule": null
}
}
APIs
Get all profiles in a network
Request Path: GET /2.2/networks/:id/profiles
Token Type: Admin, Agent
Response data contains an array of the network’s profiles.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": [/* list of "Profile objects" */]
}
Create a Profile for a Network
Request Path: POST /2.2/networks/:id/profiles
Token Type: Admin, Agent
Fields
Field Optional?
JSON
Type Description
name no string This profile’s name
devices no array Array of objects describing devices this profile will
apply to
devices[].url no string URL of the device that will belong to the profile
Example
{
"name": "My New Profile",
"devices: [
84 AMAZON CONFIDENTIAL
{"url": "/2.2/networks/2/devices/1422db00ac60"},
{"url": "/2.2/networks/2/devices/a45e60e6d36c"}
]
}
Response data is a JSON object of the newly created profile
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:14:20.481Z"
},
"data": { /* new "Profile object" */ }
}
Get a specific profile for a network
Request Path: GET /2.2/networks/:nid/profiles/:pid
Token Type: Admin, Agent
Response data contains the profile object
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": { /* the requested "Profile object" */ }
}
Update the state of a profile
Request Path: PUT /2.2/networks/:nid/profiles/:pid
Token Type: Admin, Agent
Fields
Field Optional?
JSON
Type Description
name yes string New profile name
paused yes boolean Whether this profile is paused or not
devices yes array New array of objects describing devices this profile
will apply to
devices[].url yes string URL of the device that will belong to the profile
Response data contains the updated profile object
85 AMAZON CONFIDENTIAL
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": { /* the updated "Profile object" */ }
}
Pause or Unpause all Profiles
Request Path: PUT /2.2/networks/:id/profiles/all
Token Type: Admin, Agent
Fields
Field Optional? JSON Type Description
paused no boolean Whether all profiles should be paused or not
Response The data field is omitted
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
}
}
Delete a Profile
Request Path: DELETE /2.2/networks/:nid/profiles/:pid
Token Type: Admin, Agent
Response The data field is omitted.
Example
{
"meta": {
"code": 200,
"server_time": "2017-12-05T21:21:01.245Z"
}
}
Get Devices Connected to the Network
Request Path: GET /2.2/networks/:id/devices
Token Type: Admin, Agent
86 AMAZON CONFIDENTIAL
Response data is a JSON array of objects; each object contains information about a connected device.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-23T20:32:12.937Z"
},
"data": [/* list of "Device objects" */]
}
Get a List of Blacklisted Devices
Request Path: GET /2.2/networks/:id/blacklist
Token Type: Admin, Agent
Response data is a JSON array of objects; each object contains information about a connected device.
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-23T20:32:12.937Z"
},
"data": [/* list of "Device objects" */]
}
Block Client Device
Request Path: POST /2.2/networks/:id/blacklist
Token Type: Admin, Agent
Block Client Device Fields
Field Optional? Type Description
mac no string a string representing the MAC address of the device to block
Response was blocked.
data is a JSON array with an object that contains information about the connected device which
Example
{
"meta": {
"code": 200,
"server_time": "2021-11-29T17:15:48.536Z"
},
"data": [/* list of "Device objects" */]
}
87 AMAZON CONFIDENTIAL
Unblock Client Device
Request Path: DELETE /2.2/networks/:id/blacklist/:macId
Token Type: Admin, Agent
Unblock Client Device Fields This request does not have a body.
Response was unblocked.
data is a JSON array with an object that contains information about the connected device which
Example
{
"meta": {
"code": 200,
"server_time": "2021-11-29T17:16:09.003Z"
},
"data": [/* list of "Device objects" */]
}
88 AMAZON CONFIDENTIAL
eeros API
Objects
Searched eero Object
Field Optional?
JSON
Type Description
id no integer unique ID of the eero
serial no string 16 character eero product serial
mac_address no string base mac address of the eero
led_on no boolean whether the LED of the eero is on (true)
or off (false)
using_wan no boolean whether the eero is using WAN (true) or
not (false)
connected_clients_count no integer number of clients connected to the eero
model no string either eero or eero Beacon
model_number no string model number of the eero
network yes object information about the searched eero’s
network (if the eero is in an administered
network)
network.url no string URL to load more information about the
network (i.e. /2.2/networks/:networkId)
network.name no string the network’s SSID
network.created no string date/time of network creation
deactivated no boolean flag indicating whether device has been
deactivated
partner_account_id yes string partner account ID of the
customer_account to which the eero
belongs (if it exists)
Vlan Object
Field Optional?
JSON
Type Description
source no string Contains the source of vlan configuration. The
options are eero and organization
vlan no string VLAN identifier (a number between 0 – 4095)
Pppoe Object
Field Optional? JSON Type Description
enabled no boolean whether the PPPoE for the gateway is on
(true) or off (false)
credentials.source yes string Contains the source of pppoe configuration.
The options are eero and organization
credentials.b64Creds yes string Credentials base64 encoded
89 AMAZON CONFIDENTIAL
APIs
Add eeros to The Network
Request Path: POST /2.2/eeros
Token Type: Admin, Agent
Post eero Form Fields
Field Optional? JSON Type Description
serial no String serial number of the device
network yes String url of the network, e.g. /2.2/network/:id
location yes String location name where eero is placed
Response data is a JSON object containing a full view of eero device information.
Example
{
"meta": {
"code": 200,
"server_time": "2019-08-01T21:23:02.998Z"
},
"data": [ /* eero details */ ]
}
Update eeros on the Network
Request Path: PUT /2.2/eeros/:eeroId
Token Type: Admin, Agent
Update eero Form Fields
Field Optional? JSON Type Description
network yes String url of the network, e.g. /2.2/network/:id
location yes String location name where eero is placed
Response data is a JSON object containing a full view of eero device information.
Example
{
"meta": {
"code": 200,
"server_time": "2019-08-01T21:23:02.998Z"
},
"data": [ /* eero details */ ]
}
90 AMAZON CONFIDENTIAL
Get an eero by ID
Request Path: GET /2.2/eeros/:eeroId
Token Type: Admin, Agent
Response data is a JSON object containing a searched eero object
Example
{
"meta":{
"code":200,
"server_time":"2017-12-21T18:09:43.200Z"
},
"data": /* searched eero object */
}
Error Example - eero not found
{
"meta":{
"code":404,
"server_time":"2017-12-21T18:10:46.163Z"
}
}
Error Responses
Status Description
403 eero ID not accessible
404 eero ID may be invalid or incorrect
Get by eero Serial Number
Request Path: GET /2.2/eeros/serial/:serial
Token Type: Admin, Agent
The :serial field can be either the full 16 character eero serial or the first 8 characters of the serial.
Response data is a JSON object containing a searched eero object
Example
{
"meta":{
"code":200,
"server_time":"2017-12-21T18:09:43.200Z"
},
"data": /* searched eero object */
}
91 AMAZON CONFIDENTIAL
Error Example - eero not found
{
"meta":{
"code":404,
"server_time":"2017-12-21T18:10:46.163Z"
}
}
Error Responses
Status Description
403 Serial number not accessible
404 Serial number may be invalid or incorrect
Remove an eero from a network by eero Serial Number
Request Path: DELETE /2.2/eeros/serial/:serial
Token Type: Admin, Agent
The :serial field is the full 16 character eero serial.
Response The data field is omitted.
Example
{
"meta":{
"code":200,
"server_time":"2017-12-21T18:09:43.200Z"
},
}
Error Example - eero not found
{
"meta":{
"code":404,
"server_time":"2017-12-21T18:10:46.163Z"
}
}
Error Responses
Status Description
404 Serial number may be invalid or incorrect
Reboot an eero
Request Path: POST /2.2/eeros/:eeroId/reboot
Token Type: Admin, Agent
92 AMAZON CONFIDENTIAL
Response The data field is omitted.
Example
{
"meta": {
"code": 201,
"server_time": "2017-10-23T20:32:12.937Z"
}
}
Set Eero PPPoE Settings
Request Path: PUT /2.2/eeros/:eeroId/pppoe
Token Type: Admin, Agent
Set Eero PPPoE Settings Form Fields
Field Optional?
JSON
Type Description
pppoe no Object object containing the
PPPoE settings
pppoe.pppoe_wan no Boolean whether the PPPoE for the
gateway is on (true) or off
(false)
pppoe.credentials no Object object containing the
PPPoE credentials
pppoe.credentials.pppoe_authentication no String manual to require user to
input credentials during
network setup or global
to set PPPoE credentials
on behalf of user
pppoe.credentials.global_credentials yes Object object containing the
PPPoE global credentials
for when
pppoe_authentication is
set to global
pppoe.credentials.global_credentials.username no String PPPoE username
pppoe.credentials.global_credentials.password no String PPPoE password
Request Body Example
{
"pppoe": {
"pppoe_wan": true,
"credentials": {
"pppoe_authentication": "global",
"global_credentials": {
"username": "my_username",
"password": "my_password"
}
}
93 AMAZON CONFIDENTIAL
}
}
Response The data field is omitted.
Example
{
"meta":{
"code":200,
"server_time":"2017-12-21T18:09:43.200Z"
}
}
Delete Eero PPPoE Settings
Request Path: DELETE /2.2/eeros/:eeroId/pppoe
Token Type: Admin, Agent
Delete Eero PPPoE Settings Form Fields This request does not have a body.
Response The data field is omitted.
Example
{
"meta":{
"code":200,
"server_time":"2017-12-21T18:09:43.200Z"
}
}
Get Pre Setup Config by Serial
Request Path: GET /2.2/eeros/:serial/pre_setup_config
This API route is subject to eero’s API rate limitation at 3 requests per minute. The rate limit could change
base on eero’s technical and policy limitation.
Token Type: Admin, Agent
The :serial field is the full 16 character eero serial.
Response data is a JSON object containing one array of Vlan Object and the Pppoe Object
Example
{
"meta":{
"code":200,
"server_time":"2017-12-21T18:09:43.200Z"
},
"data": {
"vlans": [
{
94 AMAZON CONFIDENTIAL
"source": "eero",
"vlan": "201"
}
],
"pppoe": {
"enabled": true,
"credentials": {
"source": "eero",
"b64Creds": /*base64 string with credentials*/
}
}
}
}
Get Support info by Serial
Request Path: GET /2.2/eeros/:serial/support
This API route is subject to eero’s API rate limitation at 3 requests per minute. The rate limit could change
base on eero’s technical and policy limitation.
Token Type: Admin, Agent
The :serial field is the full 16 character eero serial.
Response data is a JSON object containing contact information about node organization support contacts
Example
{
"meta":{
"code":200,
"server_time":"2017-12-21T18:09:43.200Z"
},
"data": {
"support_phone": "+1999999999",
"contact_url": "https://contact.organization.com",
"help_url": "https://help.organization.com",
"email_web_form_url": "support@test2.com",
"name": "Organization Name"
}
}
95 AMAZON CONFIDENTIAL
eero Deactivation API
Objects
Deactivation Response Object
Field Optional? JSON Type Description
serial no string Serial number of deactivated device
deactivated no boolean Whether record deactivates a device (true) or
activates a device (false)
reason no string Reason the eero device was deactivated
Deactivated eero Response Object
Field Optional? JSON Type Description
serial no string Serial number of deactivated device
url no string URL to load more information about the eero
reason no string Reason the eero device was deactivated
last_deactivation_time no string Timestamp of latest deactivation event
Deactivated eero Response Collection
Field Optional? JSON Type Description
url no string URL of request endpoint
eeros no string Array of Deactivated eero Response Objects
APIs
Deactivate/Activate an eero device by serial
Creates a deactivation record for a device managed by an organization. Deactivating a device via the API
will do the following
• Reset the eero device to factory defaults.
• Prevent the device from being added to a network until an activation event for a device is created.
Request Path: POST /2.2/eeros/:id/activation_state
Token Type: Admin
The :id field can be found by querying for an eero with GET /2.2/eeros/serial/:serial.
Form Body
Field Optional? JSON Type Description
deactivated no boolean True if a device should be flagged as
deactivated, false if the node should
be activated.
96 AMAZON CONFIDENTIAL
Field Optional? JSON Type Description
reason no if deactivated==
true
string If the event deactivates a device
(deactivated= true), this field must
be provided to indicate the reason for
deactivation. Must be one of the
following for the request to succeed:
unknown, initial_deactivation,
customer_past_due, device_lost,
device_stolen,
subscription_cancelled,
terms_of_service_violated. If the
event should activate a device
(deactivated= false), this field
should be set to unknown.
Response
Success Example
{
"meta":{
"code":200,
"server_time":"2025-12-21T18:09:43.200Z"
},
"data": {/* Deactivation Response Object */}
}
Error Example - 400 Bad Request is missing
This code will be returned from the server if the deactivated form field
{
"meta":{
"code": 400,
"error": "error.form.errors",
"server_time": "2016-01-27T00:35:00.638Z"
},
"data":{
"deactivated": "error.form.field.required"
}
}
A 400 Bad form field is set to true.
Request response will be returned if a request form’s reason field is missing and the deactivated
{
"meta":{
"code": 400,
"error": "error.form.errors",
"server_time": "2016-01-27T00:35:00.638Z"
},
"data":{
"reason": "error.form.field.required"
}
}
97 AMAZON CONFIDENTIAL
Get activation state for an eero device
Request Path: GET /2.2/eeros/:id/activation_state
Token Type: Admin
The :id field can be found by querying for an eero with GET /2.2/eeros/serial/:serial.
Response
Success Example
{
"meta":{
"code":200,
"server_time":"2017-12-21T18:09:43.200Z"
},
"data": {/* Deactivation Response Object */}
}
Error Responses
Status Description
404 eero ID may be invalid or incorrect
Get All Deactivated Devices
Returns all devices managed by an organization that are currently deactivated.
Request Path: GET /2.2/organizations/self/eeros/deactivated
Token Type: Admin
Query Parameters
Field Optional? Type Description
limit yes integer how many eeros to return in each response
offset yes integer used for pagination of response data. this field is
managed by the pagination section of the API response,
and should not be set explicitly.
Response
Success Example
{
"meta":{
"code":200,
"server_time":"2019-12-21T18:09:43.200Z"
},
"data":{
"url":"/2.2/organizations/self/eeros/deactivated",
"eeros":{/* Deactivated eero Response Collection */}
98 AMAZON CONFIDENTIAL
},
"pagination": {
"next": "/2.2/organizations/self/eeros/deactivated?offset=157"
}
}
99 AMAZON CONFIDENTIAL
Organization Users API
This set of APIs allows for managing the staff of members of your organization.
Objects
User
Field Optional? JSON Type Description
id no integer Unique ID of the user
email no string Email address of the user
commissioned no string ISO 8601 timestamp of when the user was
commissioned to join the organization
decommissioned yes string ISO 8601 timestamp of when the user was
decommissioned from the organization
role no string User’s role. Valid values are isp-technician,
isp-agent, isp-admin, isp-super-user,
isp-read-only, isp-business-analyst,
isp-community-manager,
isp-operations-admin and
isp-support-specialist.
invite no object Information about the user’s invite to the
organization
invite.status yes object User’s invite status. Valid values are completed
(user has accepted the invite and joined the
organization), active (outstanding invite),
expired (invite is no longer valid; need to
resend invite), or null (user is
decommissioned)
Example
{
"id": 100,
"email": "paul@atreides.net",
"commissioned": "2017-10-25T20:34:10.449119Z",
"decommissioned": null,
"role": "isp-agent",
"invite": {
"status": "completed"
}
}
APIs
Get All Users In The Organization
Request Path: GET /2.3/organization_users
Token Type: Admin
Query Parameters
100 AMAZON CONFIDENTIAL
Field Optional? Type Description
limit yes integer How many networks to return in each
response
offset yes integer Used for pagination of response data.
this field is managed by the pagination
section of the API response (more info
below), and should not be set explicitly.
email yes string Used for querying the organization user
list by email to locate the organization
user ID
identityProviderUserId yes string Used for querying the organization user
list for an SSO organization user. The
identityProviderUserId is the unique
ID of the user in the SSO identity
provider system.
If your organization does NOT use SSO: - Use the email query parameter to search for an organization user.
This should return just 1 result.
If your organization does use SSO: - Use the identityProviderUserId query parameter to search for an
SSO organization user. This should return just 1 result. - Use the email query parameter to search for an
organization user authenticated via eero auth (non-SSO). This should return just 1 result. - You may also use
the email query parameter to search for an SSO organization user, but more than 1 result may be returned. -
If you pass both email and identityProviderUserId as query parameters, the query will filter on both.
Response data contains the url of the current page, and a list of user objects.
Example GET /2.3/organization_users
{
"meta": {
"code": 200,
"server_time": "2017-10-20T21:14:05.487Z"
},
"data": {
"url": "/2.3/organization_users",
"users": [ /* array of "user objects" */ ]
},
"pagination": {
"next": "/2.3/organization_users?offset=157"
}
}
Example GET /2.3/organization_users?email=paul@atreides.net
Example GET /2.3/organization_users?identityProviderUserId=111
Get A Single User In The Organization
Request Path: GET /2.3/organization_users/:id
Token Type: Admin
The :id field can be found by querying for an organization user with GET /2.3/organization_users.
101 AMAZON CONFIDENTIAL
Response data contains the user object of the user with that id
Example GET /2.3/organization_users/100
{
"meta": {
"code": 200,
"server_time": "2017-10-25T20:42:54.908Z"
},
"data": { /* "user object" */ }
}
Commission Users To Join The Organization
Send email invites to users to join the organization. Invites expire in 7 days. There is a limit of 100 user emails
you can invite per API call.
Request Path: POST /2.3/organization_users
Token Type: Admin
Fields
Field Optional? JSON Type Description
emails no array A list of email addresses of users to add to your
organization
role yes string By default, the role will be set as technician. Valid
values are isp-technician, isp-agent, isp-admin,
isp-super-user, isp-read-only, isp-business-analyst,
isp-community-manager, isp-operations-admin and
isp-support-specialist.
Response data contains a list of user objects
Example
{
"meta": {
"code": 200,
"server_time": "2017-10-25T20:42:54.908Z"
},
"data": { /* "user objects" */ }
}
Decommission A User From The Organization
Request Path: DELETE /2.3/organization_users/:id
Token Type: Admin
The :id field can be found by querying for an organization user with GET /2.3/organization_users.
Response data contains the user object of the user with that id
102 AMAZON CONFIDENTIAL
Example DELETE /2.3/organization_users/100
{
"meta": {
"code": 200,
"server_time": "2017-10-25T20:42:54.908Z"
},
"data": { /* "user object" */ }
}
Resend User Invite To Join Organization
Resend invite email to user if the previous invite was lost or expired.
Request Path: POST /2.3/organization_users/:id/invites
Token Type: Admin
The :id field can be found by querying for an organization user with GET /2.3/organization_users.
Response data contains the user object of the user with that id
Example POST /2.3/organization_users/100/invites
{
"meta": {
"code": 200,
"server_time": "2017-10-25T20:42:54.908Z"
},
"data": { /* "user object" */ }
}
Organization network and user subscription creation
For a better understanding about the flow there is a simple example to API call sequence
103 AMAZON CONFIDENTIAL
104 AMAZON CONFIDENTIAL
Create Network
This section describes how to create a network with an organization-owned eero so that the network is
managed by your organization and appears in RNM.
Requirements
For ISP Organizations:
Note: The gateway eero must be owned by your organization.
1. Connect the modem to any ethernet port on the gateway eero using an ethernet cable.
2. Then connect power to both the modem and gateway eero.
3. Make sure the gateway eero’s status LED flashes blue before continuing to the next step.
Steps to Create a Network
1. Send a POST request to /2.2/eeros with the request body containing the mandatory field "serial
= SERIAL_NUMBER_OF_EERO" and the optional fields "network = NETWORK_ID" and "location =
LOCATION_NAME_OF_EERO" to validate that the eero has an active session is owned by your organiza-
tion.The request will return the response body with information about the eero. Within the body, it will
contain a key called url likeurl: "/2.2/eeros/231451". Use this URL for the PUT request in step 3
to add the eero to the newly created network. Please see eeros API section for the full request and
response body for POST /2.2/eeros.
2. Send a POST request to /2.2/networks with the form body of name and password to create an empty
network. The request will return the response body with information about the newly created network.
Within the body, it will contain a key called url like url: "/2.2/networks/231451". Use this URL as the
form body param network in the following PUT to /2.2/eeros/:id. Please see Networks API section
for the full request and response body for POST /2.2/networks.
3. After the network is created, make a PUT request to the URL from step 1 that has the eero id like
/2.2/eeros/231451. In the body, set network form parameter to the URL returned from the previous
set like network = "/2.2/networks/2314". This will add the gateway eero to the network and create
the association to allow your organization to manage the network from RNM. Please see eeros API
section for the full request and response body for PUT /2.2/eeros/:id.
105 AMAZON CONFIDENTIAL
Network Outages API
Objects
Point In Time Network Outages Object
Field Optional? JSON Type Description
total no integer Total of outages
summaries no array Outages information
summaries[].duration_threshold yes string Outage duration
summaries[].outages yes string Count of outages with duration_threshold
Network Outage Counts Object
Field Optional? JSON Type Description
unique no integer count of unique networks
unique_with_outages no integer count of unique networks with outages
samples no array outage information per point of time
samples[].time yes string ISO 8601 timestamp (UTC) indication
the period of time evaluated
samples[].total yes integer count of unique networks evaluated in
the period of time
samples[].offline yes integer count of unique networks offline in the
period of time
Network Outage Locations Object
Field Optional? JSON Type Description
locations no array location info
locations[].location no string specific location
locations[].outages no integer count of outage in the location
Networks With Outages Object
Field Optional? JSON Type Description
network_id no integer Unique network identifier
duration no integer outage duration
geo_ip yes string json containing geographic information about ip
start_time yes string ISO 8601 timestamp (UTC) of outage start
end_time yes string ISO 8601 timestamp (UTC) of outage end
Single Network Outages Object
Field Optional? JSON Type Description
outages no array Outages information
outages[].start no string ISO 8601 timestamp (UTC) of outage start
106 AMAZON CONFIDENTIAL
Field Optional? JSON Type Description
outages[].end no string ISO 8601 timestamp (UTC) of outage end
outages[].reason yes string Outage reason
APIs
Get Point In Time Outages
Request Path: GET 2.2/organizations/:idOrSelf/network_outages/point_in_time
Token Type: Admin
Query parameters
Field Optional? Type Description
timestamp yes string ISO 8601 timestamp (UTC) indicating the
outage start limit
durationThresholds yes array[integer] Duration thresholds separated by comma
Response data is a JSON object containing a Point In Time Network Outages Object
Example
{
"meta": {
"code": 200,
"server_time": "2021-10-06T14:37:43.258Z"
},
"data": {
"total": 9,
"summaries": [
{
"duration_threshold": 1,
"outages": 0
}
...
]
}
}
Get Network Outage Counts
Request Path: GET /2.2/organizations/:idOrSelf/network_outages/counts
Token Type: Admin
Query parameters
Field Optional? Type Description
start no string ISO 8601 timestamp (UTC) of outage start
end yes string ISO 8601 timestamp (UTC) of outage end
107 AMAZON CONFIDENTIAL
Response data is a JSON object containing a Network Outage Counts Object
Example
{
"meta": {
"code": 200,
"server_time": "2021-10-06T14:54:08.932Z"
},
"data": {
"unique": 169,
"unique_with_outages": 9,
"samples": [
{
"time": "2021-10-06T14:06:23.998Z",
"total": 169,
"offline": 8
}
...
]
}
}
Get Outage Locations
Request Path: GET /2.2/organizations/:idOrSelf/network_outages/locations
Token Type: Admin
Query parameters
Field Optional? Type Description
timestamp yes string ISO 8601 timestamp (UTC) indicating the outage start
limit
type yes string String indicating the type of location str we want as
result. Allowed values are: [CityState, ZipCode]
limit yes integer Number of locations to retrieve
Response data is a JSON object containing a Network Outage Locations Object
Example
{
"meta": {
"code": 200,
"server_time": "2021-10-06T14:59:16.169Z"
},
"data": {
{
"locations": [
"location": "San Francisco, CA",
"outages": 2
}
108 AMAZON CONFIDENTIAL
..
]
}
}
Get Network Outages
Request Path: GET 2.2/organizations/:idOrSelf/network_outages/networks
Token Type: Admin
Query parameters
Field Optional? Type Description
desc yes Boolean Flag indicating if should return in decreasing order
sortBy yes string String indicating which field to sort
offset yes integer used for pagination of response data. this field is
managed by the pagination section of the API response
(more info below), and should not be set explicitly.
limit yes integer how many networks to return in each response
Response data is a JSON object containing a Network Outage object
Example
{
"meta": {
"code": 200,
"server_time": "2018-04-02T15:50:00.352Z"
},
"data": {
"networks": [
{
},
"network_id": 163669,
"duration": 1143363,
"geo_ip": "{\"countryCode\":\"US\",\"countryName\":\"United States\",\"city\":\"San Fran
"start_time": "2021-09-22T15:11:34.128Z",
"end_time": null
{ /* "Networks With Outages Object" */ }
]
},
}
"pagination": {
"next": "/2.2/organizations/99999/network_outages/networks?offset=2&limit=2"
}
Get Outages For Single Network
Request Path: /2.2/organizations/:idOrSelf/network_outages/networks/:networkId
Token Type: Admin
109 AMAZON CONFIDENTIAL
Query parameters
Field Optional? Type Description
start no string ISO 8601 timestamp (UTC) of outage start
end yes string ISO 8601 timestamp (UTC) of outage end
Response data is a JSON object containing a Single Network Outages Object
Example
{
"meta": {
"code": 200,
"server_time": "2021-10-06T16:19:40.470Z"
},
"data": {
"outages": [
{
"start": "2021-09-25T11:04:31.674Z",
"end": "2021-09-25T11:06:20.382Z",
"reason": "CONN_DOWN_NO_LINK"
}
...
]
}
}
110 AMAZON CONFIDENTIAL
Bandwidth API
Objects
ThresholdReport Object
Field Optional? JSON Type Description
threshold no double Threshold to use
networks_above_threshold no integer Number of networks above threshold
PlansBandwidthUsageView Object
Field Optional? JSON Type Description
expected_speed_range_min no integer Network min speed in bits
total no integer Total number of networks
usage no array<ThresholdReport> Info about BandwidthUsage
NetworkBandwidthUsageSummary Object
Field Optional? JSON Type Description
network_id no string Network unique identifier
expected_down_speed no long Expected download speed in bits per
second based on a running average of
30 days of WAN speed tests or the
down_speed_bits_per_second
supplied for the network via the Data
Plan API.
expected_up_speed no long Expected upload speed in bits per
second based on a running average of
30 days of WAN speed tests or the
up_speed_bits_per_second supplied
for the network via the Data Plan API.
download_pct_99 no double Percentile 99 of download speed.
Represented as a percentage of the
expected_down_speed.
upload_pct_99 no double Percentile 99 of upload speed.
Represented as a percentage of the
expected_up_speed.
download_pct_95 no double Percentile 95 of download speed.
Represented as a percentage of the
expected_down_speed.
upload_pct_95 no double Percentile 95 of upload speed.
Represented as a percentage of the
expected_up_speed.
NetworkBandwidthUsage Object
111 AMAZON CONFIDENTIAL
Field Optional? JSON Type Description
expected_down_speed no long Expected download speed in bits per
second based on a running average of
30 days of WAN speed tests or the
down_speed_bits_per_second
supplied for the network via the Data
Plan API.
expected_up_speed no long Expected upload speed in bits per
second based on a running average of
30 days of WAN speed tests or the
up_speed_bits_per_second supplied
for the network via the Data Plan API.
download_pct_99 no long Percentile 99 of download speed.
Represented as the absolute P99 value
of download bandwidth usage for the
specified day in bits per second.
upload_pct_99 no long Percentile 99 of upload speed.
Represented as the absolute P99 value
of upload bandwidth usage for the
specified day in bits per second.
download_pct_95 no long Percentile 95 of download speed.
Represented as the absolute P95 value
of download bandwidth usage for the
specified day in bits per second.
upload_pct_95 no long Percentile 95 of upload speed.
Represented as the absolute P95 value
of upload bandwidth usage for the
specified day in bits per second.
APIs
Get Aggregated Bandwidth Usage
Request Path: GET /2.2/organizations/:idOrSelf/aggregated_bandwidth_usage
Token Type: Admin
Query Parameters
Field Optional? Type Description
lastNDays no integer How many days to look at. Allowed values: [7,
14, 30]
percentile yes integer Select which average bandwidth usage down
percentile to use. Allowed values: [95, 99]
expectedSpeedBuckets yes long Expected speed buckets separated by comma
usageThresholds yes double Bandwidth thresholds separated by comma
Response data is a JSON object containing an array of PlansBandwidthUsageView
Example
112 AMAZON CONFIDENTIAL
{
"meta": {
"code": 200,
"server_time": "2021-10-06T14:37:43.258Z"
},
"data": [
{
"expected_speed_range_min": 0,
"total": 3,
"usage": [
{
"threshold": 0.2,
"networks_above_threshold": 2
},
{
"threshold": 0.5,
"networks_above_threshold": 0
}
]
}
...
]
}
Get Networks By Bandwidth Usage
Request Path: GET /2.2/organizations/:idOrSelf/networks_by_bandwidth_usage
Token Type: Admin
Query Parameters
Field Optional? Type Description
lastNDays no integer How many days to look at. Allowed values: [7,
14, 30]
percentile no integer Select which average bandwidth usage down
percentile to use. Allowed values: [95, 99]
expectedDownSpeedMin yes long Filter expected download speed by min value
expectedDownSpeedMax yes long Filter expected download speed by max value
usageThresholdMin yes double Filter utilization by min percent
usageThresholdMax yes double Filter utilization by max percent
desc yes Boolean Flag indicating if should return in decreasing
order
sortBy yes string String indicating which field to sort
offset yes integer Used for pagination of response data. This field
is managed by the pagination section of the
API response(more info below), and should not
be set explicitly.
limit yes integer How many networks to return in each response
Response data is a JSON object containing an array of NetworkBandwidthUsageSummary
113 AMAZON CONFIDENTIAL
Example
{
"meta": {
"code": 200,
"server_time": "2021-10-07T12:52:54.713Z"
},
"data": [
{
"network_id": 999999,
"expected_down_speed": 10256584,
"expected_up_speed": 1912936,
"download_pct_99": 0.4117213879396883,
"upload_pct_99": 0.06203919001994839,
"download_pct_95": 0.3910856675087924,
"upload_pct_95": 0.05276496443163807
},
...
"pagination": {
],
}
"next": "/2.2/organizations/89999/networks_by_bandwidth_usage?lastNDays=7&offset=10"
}
Get Bandwidth Utilization for an Individual Network by Day
Request Path: GET /2.2/networks/:id/daily_bandwidth_usage
Token Type: Admin
Query Parameters
Field Optional? Type Description
start no string Start of date range to retrieve in YYYY-mm-dd format,
e.g. 2024-05-21.
end yes string End of date range to retrieve in YYYY-mm-dd format,
e.g. 2024-07-02. If end is not sent as a query parameter,
results from start until now are returned.
Response data is a JSON object containing an array of NetworkBandwidthUsage objects for the network.
Example
{
"meta": {
"code": 200,
"server_time": "2021-10-07T12:52:54.713Z"
},
"data": [
{
"date": "2024-06-25",
"expected_down_speed": 808018264,
"expected_up_speed": 28549880,
114 AMAZON CONFIDENTIAL
"download_pct_99": 32846561,
"upload_pct_99": 6578921,
"download_pct_95": 13312453,
"upload_pct_95": 5035655
},
{
"date": "2024-06-26",
"expected_down_speed": 808018264,
"expected_up_speed": 28549880,
"download_pct_99": 168992677,
"upload_pct_99": 25560328,
"download_pct_95": 41789716,
"upload_pct_95": 11302459
}
]
}
115 AMAZON CONFIDENTIAL
Firmware API
Objects
Network Updates View Object
Field Optional? JSON Type Description
min_required_firmware yes string Minimum firmware version required
target_firmware yes string Target firmware for this network group
update_to_firmware no string Firmware version we are updating to
update_required no boolean true if there is a required update
can_update_now no boolean true if req update and network is up
has_update no boolean true if lowest current firmware is less
than target and if update is an
authorized firmware version
update_status yes string if defined, firmware update status:
returns pending, downloading,
upgrading, or rebooting
last_update_started no string timestamp of last started firmware
update
last_user_update no object last time updated by user as well as
unresponsive and incomplete eeros
(see eero object in Networks)
manifest_resource yes string localized realease manifest url
API
Update Network Firmware Version
Request Path: POST /2.2/networks/:id/updates
Token Type: Admin, Agent
Response data is a JSON object containing a NetworkUpdatesView object
Example
{
"meta": {
"code": 200,
"server_time": "2021-12-15T21:41:10.057Z"
},
"data": { /* created "NetworkUpdatesView" object */}
}
116 AMAZON CONFIDENTIAL
eero for Business
Objects
Network Subnet Object
Field Optional?
JSON
Type Description
network_id no integer Unique network identifier
subnet_type no string One of MAIN, GUEST, A, B. A represents your 1st
non MAIN/GUEST subnet. B represents your
2nd non MAIN/GUEST subnet.
subnet_kind no string One of main, guest, iot, business
name no string Name of subnet
password no string Password for subnet
enabled no boolean true if subnet to be created is enabled
wan_access no boolean true if subnet should have WAN access
lan_access no boolean true if subnet should have LAN access
dedicated_subnet no JSON IP4 DHCP settings
dedicated_subnet.subnet_ip yes String Custom subnet IPv4 of the network
dedicated_subnet.subnet_mask yes String Custom subnet IPv4 mask of the network
dedicated_subnet.start_ip yes String Starting DHCP IPv4 lease address
dedicated_subnet.end_ip yes String Ending DHCP IPv4 lease address
open_network no boolean true if subnet should not be password
protected
rate_limit_pct yes integer Rate limit percentage between 0 to 60
Ethernet Port Association Object
Field Optional? Type Description
node_session_id no integer Unique node session
identifier
ethernet_ports no arrayfields Array of ethernet port
objects
ethernet_ports[].subnet_type no string One of MAIN, GUEST, A, B
ethernet_ports[].port_number no integer Port number of given
subnet
ethernet_ports[].eero_detected no boolean true if an eero is wired to
this port
Captive Portal Object
Field Optional? Type Description
id no long Unique captive portal identifier
network_id no integer Unique network identifier
capture_name no boolean true if this captive portal should require
name to grant network access
capture_phone no boolean true if this captive portal should require
phone number to grant network access
117 AMAZON CONFIDENTIAL
Field Optional? Type Description
capture_email no boolean true if this captive portal should require
email to grant network access
access_expiration_in_minutes no integer Session duration in minutes. Acceptable
values are 30, 60, 90 and 1440
color_theme no string One of Light, Dark
business_logo_url yes string S3 URL reference to the uploaded
business logo
header yes string Captive portal header limited to 40
characters
sub_header yes string Captive portal sub-header limited to 100
characters
landing_page_image_url yes string S3 URL reference to the uploaded landing
page image
business_terms_of_service_url yes string S3 URL reference to the uploaded
business terms of service
APIs
Set the Network Identifier Type
Request Path: PUT /2.2/networks/:id/network_customer_type
• API allows changing a network’s type from Residential to Business network and vice versa
• See Convert a Residential Network to MDU Type in the eero for Communities API section for details
on other use cases for this API endpoint.
Token Type: Admin, Agent
Fields
Field Optional? Type Description
network_customer_type no string one of Residential, Business
Success Example
{
"meta":{
"code":200,
"server_time":"2023-03-16T19:13:52.366Z"
}
}
Error Example - 400 Bad Request form field is missing
This code will be returned from the server if the network_customer_type
{
"meta": {
"code": 400,
"server_time": "2023-03-16T19:13:52.366Z",
"error": "error.form.errors"
},
"data": {
118 AMAZON CONFIDENTIAL
"network_customer_type": "error.form.field.required"
}
}
Error Responses
Status Description
400 Invalid network configuration because network is either in bridged mode or DHCP mode
is not automatic
403 409 Access denied for this operation
404 Network not found
Network can not be converted to Business because the network has unsupported eero
models
Set Business Name
This request uses the same path as Set a network's custom label (aka the "Home Identifier") by
using a URL query parameter to differentiate it from the Home Identifier resource.
Request Path: PUT /2.2/networks/:id/label?labelType=SpecialMarket
Token Type: Admin, Agent
Fields
Field Optional? Type Description
label no string Name of the business limited to 32 characters
Response data is a JSON object containing a Full Network Object
Success Example
{
"meta":{
"code":200,
"server_time":"2023-03-16T19:13:52.366Z"
},
"data":{ /* updated "full network object" */ }
}
Get a business network’s business name
This request uses the same path as Get a network's custom label (aka the "Home Identifier") by
using a URL query parameter to differentiate it from the Home Identifier resource.
Request Path: GET /2.2/networks/:networkId/label?labelType=SpecialMarket
Token Type: Admin, Agent
Response data is a JSON object information about the network’s new business name
119 AMAZON CONFIDENTIAL
Example
{
"meta": {
"code": 200,
"server_time": "2020-10-20T21:14:05.487Z"
},
"data": {
"label": "Business Name"
}
}
Set or Update Subnet
Request Path: PUT /2.2/networks/:id/subnets_config
Token Type: Admin, Agent
Fields
Field Optional? Type Description
subnet_type no string one of MAIN, GUEST, A, B. A represents your 1st non
MAIN/GUEST subnet. B represents your 2nd non
MAIN/GUEST subnet.
subnet_kind no string one of main, guest, iot, business
name no string Name of subnet
password yes string Password for subnet. If no password provided, we’ll keep
the existing one. To remove password, an empty string “”
must be provided to the API.
enabled no boolean true if subnet to be created is enabled
rate_limit_pct yes integer Rate limit percentage between 0 to 60
Response data is a JSON object containing a Network Subnet Object
Example
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": { /* created "network subnet object" */ }
}
Error Responses
Status Description
400 Invalid parameter combination. Examples include: disabling MAIN subnet, invalid
subnet_type and subnet_kind combination, configuring rate limit on non-GUEST subnet, or
rate limit percentage not within bound
400 Network is not a Business network
400 Malformed password
120 AMAZON CONFIDENTIAL
Status Description
403 Access denied for this operation
404 Network not found
500 Internal error creating configurations
Get Subnet
Request Path: GET /2.2/networks/:id/subnets_config
Token Type: Admin, Agent
Query parameters
Field Optional? Type Description
types yes array[string] Types of subnet to filter. String separated by
comma.
Response data is a JSON array containing Network Subnet Object(s)
Example
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": [ /* "network subnet object" */ ]
}
Error Responses
Status Description
400 403 Network is not a Business network
Access denied for this operation
404 Network not found
Delete Subnet
Request Path: DELETE not be deleted
Token Type: Admin, Agent
/2.2/networks/:id/subnets_config/:subnetType * MAIN and GUEST subnets can
Success Example
{
"meta":{
"code":200,
"server_time":"2023-03-16T19:13:52.366Z"
}
}
121 AMAZON CONFIDENTIAL
Error Responses
Status Description
400 400 403 Invalid subnet type or if subnet type is MAIN or GUEST
Network is not a Business network
Access denied for this operation
404 Network not found
Get Ethernet Port Association
Request Path: GET /2.2/networks/:id/subnets_config
Token Type: Admin, Agent
Response data is a JSON array containing Ethernet Port Associations Object(s).
Response
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": [/* "ethernet port association object" */]
}
Error Responses
Status Description
400 403 Network is not a Business network
Access denied for this operation
404 Network not found
Enable Captive Portal for Subnet
Request Path: PUT /2.2/networks/:id/captive_portal/subnet_id/:subnetType
Token Type: Admin, Agent
Fields
Field Optional? Type Description
captive_portal_configuration_id yes long Unique captive portal identifier
Success Example
{
"meta":{
"code":200,
"server_time":"2023-03-16T19:13:52.366Z"
}
}
122 AMAZON CONFIDENTIAL
Error Responses
Status Description
400 Invalid subnet type
400 403 404 500 Network is not a Business network
Access denied for this operation
Network or captive portal configuration not found
Internal error creating captive portal subnet config
Get Captive Portal Configurations on Network
Request Path: GET /2.2/networks/:id/captive_portal/configurations
Token Type: Admin, Agent
Response data is a JSON array containing Captive Portal Object configurations.
Success Example
{
"meta":{
"code":200,
"server_time":"2023-03-16T19:13:52.366Z"
},
"data": {
"configurations": [/* "captive portal object" */]
}
}
Error Responses
Status Description
403 404 500 Access denied for this operation
Network or captive portal configuration not found
Internal error getting captive portal subnet config
Configure Captive Portal
Request Path: PUT /2.2/networks/:id/captive_portal/configuration
Token Type: Admin, Agent
Fields
Field Optional? Type Description
id yes long Unique captive portal identifier
access_expiration_in_minutes yes integer Session duration in minutes. Acceptable
values are 30, 60, 90 and 1440
color_theme yes string One of Light, Dark
header yes string Captive portal header limited to 40 characters
123 AMAZON CONFIDENTIAL
Field Optional? Type Description
sub_header yes string Captive portal sub-header limited to 100
characters
Response
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": {/* updated "captive portal object" */}
}
Error Responses
Status Description
400 403 404 500 Network is not a Business network
Access denied for this operation
Network or captive portal configuration not found
Internal error updating captive portal subnet config
124 AMAZON CONFIDENTIAL
eero for Communities
Objects
Subset Object
Field Optional? JSON Type Description
id no string Unique subset identifier
(uuid)
name no string Name used to identify this
subset
code no string Unique code by organization
description yes string More details about the
subset
type no string MDU is the only type available
at the moment
subnets_enabled no arrayfields Array of subnets
subnets_enabled[].subnet_kind no string iot is the only kind available
at the moment
subnets_enabled[].enabled no boolean true if subnet enabled
email yes string Subset support email
phone yes string Subset support phone
Subnet Object
Field Optional? Type Description
name no string Subnet name (SSID)
password no string Password (min length 8 max 63)
enabled no boolean true if subnet enabled
subnet_kind no string Port number of given subnet
Network Mode Object
Field Optional? Type Description
network_id no integer Unique network identifier
activation_email yes string Email used to identify the resident
activation_phone yes string Phone number used to identify the resident
start no string ISO 8601 timestamp of the resident’s move in date
end yes string ISO 8601 timestamp of the resident’s move out date
mode no string Network mode (Pending Activation, Pending
Transfer, Owned or Deactivated)
retention_until yes string ISO 8601 timestamp of until when the network can
be restored before its final deletion
Network Default Object
125 AMAZON CONFIDENTIAL
Field Optional? Type Description
created_by_user_id no integer Unique identifier of the user who set up the
network
active_network_id no integer Unique network identifier
network_name no string Default network name used when the network
is reset to vacant
Organization User
Field Optional? JSON Type Description
id no string Unique ID of the user inside the org
user_id no integer User ID
name no string User’s name
role no string User’s role
email no string User’s email
created_at no timestamp User’s creation/invitation date
joined no boolean If user joined the organization
Communities
Get all Communities
Request Path: GET /2.2/organizations/:id/subsets?limit=100&token=
• Use pagination.next as token, pagination is present only when more pages are available.
Token Type: Admin, Agent
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": [
{
"id": "01ecc2cf-e434-43a2-b86c-11b0627534f4",
"name": "Subset Name",
"code": "UniqueCode",
"description": "Subset Description",
"type": "MDU",
"subnets_enabled": [
{
"subnet_kind": "iot",
"enabled": true
}
]
}
],
"pagination": {
"next": "<token>"
126 AMAZON CONFIDENTIAL
}
}
Error Responses
Status Description
403 Access denied for this operation
500 Internal error creating configurations
Create a Managed Community
Request Path: POST /2.2/organizations/:id/subsets
Token Type: Admin
Fields
Field Optional? Type Description
name no string Name used to identify this subset
code no string Unique code by organization
description yes string More details about the subset
type no string MDU is the only type available at the moment
email yes string Subset support email
phone yes string Subset support phone
Response
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": {
"id": "01ecc2cf-e434-43a2-b86c-11b0627534f4",
"name": "Subset Name",
"phone": "+14155555899",
"email": "support@test2.com",
"code": "UniqueCode",
"description": "Subset Description",
"type": "MDU"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
127 AMAZON CONFIDENTIAL
Status Description
409 Conflict with another subset with same code
500 Internal error creating configurations
Get Managed Community by ID
Request Path: GET /2.2/organizations/:id/subsets/:subsetId
Token Type: Admin, Agent, PropertyManager
Fields
Field Optional? Type Description
name no string Name used to identify this subset
code no string Unique code by organization
description yes string More details about the subset
type no string MDU is the only type available at the moment
email yes string Subset support email
phone yes string Subset support phone
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": {
"id": "01ecc2cf-e434-43a2-b86c-11b0627534f4",
"name": "Subset Name",
"phone": "+14155555899",
"email": "support@test2.com",
"code": "UniqueCode",
"description": "Subset Description",
"type": "MDU",
"subnets_enabled": [
{
"subnet_kind": "iot",
"enabled": true
}
]
}
}
Get Managed Community Summary (Networks count)
Request Path: GET /2.2/organizations/:id/subsets/:subsetId/summary
Token Type: Admin, Agent, PropertyManager
128 AMAZON CONFIDENTIAL
Success Example
{
"meta": {
"code": 200,
"server_time": "2025-03-12T19:18:47.167Z"
},
"data": {
"network_summary": {
"total": 1,
"vacant": 0,
"verified": 1,
"unverified": 0,
"no_owner": 0
}
}
}
Error Responses
Status Description
403 500 Access denied for this operation
404 Subset not found
Internal error obtaining subset details
Update a Managed Community
Request Path: PUT /2.2/organizations/:id/subsets/:subsetId
Token Type: Admin
Fields
Field Optional? Type Description
name no string Name used to identify this subset
code no string Unique code by organization
description yes string More details about the subset
type no string MDU is the only type available at the moment
email yes string Subset support email
phone yes string Subset support phone
Response
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": {
"id": "01ecc2cf-e434-43a2-b86c-11b0627534f4",
129 AMAZON CONFIDENTIAL
"name": "Subset Name",
"phone": "+14155555899",
"email": "support@test2.com",
"code": "UniqueCode",
"description": "Subset Description",
"type": "MDU",
"subnets_enabled": []
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 409 Access denied for this operation
Conflict with another subset with same code
500 Internal error creating configurations
Delete a Managed Community
Request Path: DELETE /2.2/organizations/:id/subsets/:subsetId
Token Type: Admin
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
}
}
Error Responses
Status Description
403 Access denied for this operation
500 Internal error creating configurations
eero Association and Disassociation
Associate a Serial with a Managed Community
Request Path: PUT /2.2/organizations/:id/subsets/:subsetId/associate
Token Type: Admin
Fields
130 AMAZON CONFIDENTIAL
Field Optional? Type Description
unit_identifier no string Identifier of the unit that the eero will be
associated with
eero_serial no string eero serial without dashes
unit_description no string More details about the unit
Response
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": {
"subset_id": "43096e16-1b6b-409b-8e30-294027426750",
"unit_id": "e328e336-2d91-400b-90b6-fe2676bd855c",
"eero_serial": "XXXXXXXXXXXXXXXX",
"eero_id": 12345,
"is_new_association": true,
"network_id": 123456
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 409 Access denied for this operation
Conflict with another subset, unit, eero or network
500 Internal error creating configurations
Disassociate a Serial from a Managed Community
Request Path: DELETE /2.2/organizations/:id/subsets/:eeroSerial/disassociate
Token Type: Admin
Response
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": {
"eero_serial": "XXXXXXXXXXXXXXXX",
"eero_id": 12345,
"org_id": 123,
131 AMAZON CONFIDENTIAL
"subset_id": "43096e16-1b6b-409b-8e30-294027426750"
}
}
Error Responses
Status Description
403 Access denied for this operation
404 Eero not found
500 Internal error creating configurations
Get Serials/Networks Associated with Community
Request Path: GET /2.2/organizations/:id/subsets/:subsetId/eeros?limit=100&token=
• Use pagination.next as token, pagination is present only when more pages are available.
Token Type: Admin, Agent, PropertyManager
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": [
{
"id": 12345,
"serial": "XXXXXXXXXXXXXXXX",
"status": "green",
"connection_type": "WIRED",
"mesh_quality_bars": 5,
"gateway": true,
"unit_description": "unit description",
"unit_identifier": "unit",
"network_name": "Network SSID",
"network_id": 1234,
"last_communication": "2023-09-06T21:12:11.677Z",
"updated_at": "2025-04-15T12:58:40.658Z",
"replaced_eero_sn": "GGC1UC011104001P"
}
],
}
"pagination": {
"next": "<token>"
}
Error Responses
Status Description
403 Access denied for this operation
132 AMAZON CONFIDENTIAL
Status Description
500 Internal error creating configurations
Get Units Associated with Community
Request Path: POST /2.2/organizations/:id/subsets/:subsetId/units?limit=100&offset=0
• Use pagination.next as offset, pagination is present only when more pages are available.
Token Type: Admin, Agent, PropertyManager
Fields
Field Optional? Type Description
search yes string Search for unit that contains this string in eero serial, unit
identifier or unit description
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": [
{
"id": "b18fb19a-57aa-43ca-ba47-93b443143543",
"network_id": 521643,
"network_name": "Network Name",
"network_customer_type": "Residential",
"unit_description": "unit description",
"unit_identifier": "A-1",
"eeros": [
{
"id": 12345,
"serial": "XXXXXXXXXXXXXXXX"
}
],
"slip_mode": null,
"is_network_owned_by_end_customer": true,
"is_online": true
}
],
}
"pagination": {
"next": "<offset>"
}
Error Responses
133 AMAZON CONFIDENTIAL
Status Description
403 Access denied for this operation
500 Internal error creating configurations
Community-wide IoT SSID
Get Managed Community SSIDs
Request Path: GET /2.2/organizations/:id/subsets/:subsetId/subnets
Token Type: Admin, Agent, PropertyManager
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": [
{
"name": "NetworkIOT",
"password": "PassWord!",
"enabled": true,
"subnet_kind": "iot"
}
]
}
Error Responses
Status Description
403 Access denied for this operation
500 Internal error creating configurations
Create Managed Community IoT SSID
Request Path: PUT /2.2/organizations/:id/subsets/:subsetId/subnets/iot
Token Type: Admin, PropertyManager
Fields
Field Optional? Type Description
name no string Network name
password no string Password
enabled no boolean Enable or disable community IoT SSID
134 AMAZON CONFIDENTIAL
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": [
{
"name": "Network IOT",
"password": "PassWord!",
"enabled": true,
"subnet_kind": "iot"
}
]
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error creating configurations
Enable / disable the Community IOT SSID
Request Path: PUT /2.2/organizations/:id/subsets/:subsetId/subnets/iot/enable
Token Type: Admin, PropertyManager
Fields
Field Optional? Type Description
enabled no boolean Enable or disable community IoT SSID
Success Example
{
"meta": {
"code": 200,
"server_time": "2025-03-12T23:42:23.487Z"
},
"data": {
"enabled": true,
"subnet_kind": "iot"
}
}
Error Responses
135 AMAZON CONFIDENTIAL
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error creating configurations
Change SSID name and Password on Community IoT SSID
Request Path: PUT /2.2/organizations/:id/subsets/:subsetId/subnets/iot
Token Type: Admin, PropertyManager
Fields
Field Optional? Type Description
name no string Network name
password no string Password
enabled no boolean use false to disable community IoT SSID
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": [
{
"name": "Network IOT",
"password": "PassWord!",
"enabled": false,
"subnet_kind": "iot"
}
]
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error updating subnet
Delete Managed Community IoT SSID
Request Path: DELETE /2.2/organizations/:id/subsets/:subsetId/subnets/iot
Token Type: Admin
136 AMAZON CONFIDENTIAL
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
}
}
Error Responses
Status Description
403 Access denied for this operation
500 Internal error creating configurations
Managing a community network
Get Network Mode by Network ID
Request Path: GET /2.2/networks/:id/network_mode
Token Type: Admin, Agent, PropertyManager
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": {
"network_id": 12345,
"start": "2023-09-06T12:40:22.234Z",
"mode": "Pending Transfer",
"activation_email": "resident@someemail.com",
"activation_phone": "+15555555555"
}
}
Error Responses
Status Description
403 500 Access denied for this operation
404 Network Mode not found
Internal error getting network mode
Create or Update Network Mode by Network ID
Request Path: PUT /2.2/networks/:id/network_mode
Token Type: Admin, PropertyManager
137 AMAZON CONFIDENTIAL
Fields
Field Optional? Type Description
activation_email yes string Email used to identify the resident
activation_phone yes string Phone number used to identify the resident
start no string ISO 8601 timestamp of the resident’s move in date
Response
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": {
"network_id": 12345,
"start": "2023-09-06T12:40:22.234Z",
"mode": "Pending Transfer",
"activation_email": "resident@someemail.com",
"activation_phone": "+15555555555"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 500 Access denied for this operation
Internal error creating or updating network mode
Create or Update Network Default by Network ID
Request Path: PUT /2.2/networks/:id/network_default
Token Type: Admin
Fields
Field Optional? Type Description
network_name no string Default network name used when the network is
reset to vacant
Response
138 AMAZON CONFIDENTIAL
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": {
"created_by_user_id": 6789,
"active_network_id": 12345,
"network_name": "Some Default Network Name"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 500 Access denied for this operation
Internal error creating or updating network default
Reset the Network Back to Vacant
Request Path: PUT /2.2/networks/:id/network_mode/deactivate
Token Type: Admin, PropertyManager
Success Example
{
"meta": {
"code": 200,
"server_time": "2023-08-15T13:16:10.073Z"
},
"data": {
"new_network_id": 12345
}
}
Error Responses
Status Description
403 500 Access denied for this operation
Internal error resetting network back to vacant
Convert a Residential Network to MDU Type
Request Path: PUT /2.2/networks/:id/network_customer_type
• API allows changing a network’s type from Residential to MDU and results in a network to inheriting
capabilites (e.g. IoT network) from the eero for Communities subset to which the network belongs.
• See Set the Network Identifier Type in the eero for Business API section for details on other use cases
for this API endpoint.
139 AMAZON CONFIDENTIAL
• Note this is a one way operation. Converting an MDU network back to Residential requires hard reset-
ting the network.
Token Type: Admin, Agent
Fields
Field Optional? Type Description
network_customer_type no string MDU only to convert Residential to MDU
Success Example
{
"meta":{
"code":200,
"server_time":"2023-03-16T19:13:52.366Z"
}
}
List Users That Have Access to a Community
Request Path: GET /2.2/organizations/:idOrSelf/subsets/:subset_id/users?token=str&limit=int
• Use pagination.next as token, pagination is present only when more pages are available.
Token Type: Admin, PropertyManager
Success Example
{
"meta": {
"code": 200,
"server_time": "2024-01-24T18:47:35.309Z"
},
"data": [
{
"id": "54vrwv4w-v453154-dxfkmlk-gklneoifdme",
"user_id": 123,
"name": "John Doe",
"role": "property-manager",
"email": "johnd@email.com",
"created_at": 1704309977208,
"joined": true
},
{
"id": "54004wv4w-jiol054-56fkmlk-gkl5432fm9",
"user_id": 456,
"name": "Jane Doe",
"role": "property-manager",
"email": "janed@email.com",
"created_at": 1706117161747,
"joined": false
}
],
"pagination": {
140 AMAZON CONFIDENTIAL
"next": "io3ucpo3urnp3v8urmpcru2p38uvm3opr+654654654321efad/aaaaaaabbbbcccc/309rh8ioun2okjx+58416482
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 500 Access denied for this operation
Internal error creating or updating network mode
Revoke user’s access to a community
Request Path: DELETE /2.2/organizations/:idOrSelf/subsets/:subset_id/users/:user_id
Token Type: Admin
Success Example
{
"meta": {
"code": 200,
"server_time": "2017-10-25T20:42:54.908Z"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 500 Access denied for this operation
Internal error creating or updating network mode
Invite User to a Community.
Request Path: POST /2.2/organizations/:idOrSelf/subsets/:subset_id/users
Token Type: Admin
Request
Field Optional? Type Description
email yes string Email used to identify the resident
name yes string User’s name
Success Example
{
"meta": {
"code": 200,
"server_time": "2017-10-25T20:42:54.908Z"
141 AMAZON CONFIDENTIAL
},
"data": {
"id": "pew2ouh-309u4-43p985u-0293428nm5",
"user_id": 123456,
"name": "John Doe",
"role": "user-role",
"email": "user@email.com",
"created_at": 1706122937930,
"joined": false
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 500 Access denied for this operation
Internal error creating or updating network mode
Re-invite user to a community.
This action can’t be done if last login happened after 72 hours of the invitation.
Request Path: PUT /2.2/organizations/:idOrSelf/subsets/:subset_id/users/:user_id/resend
Token Type: Admin, PropertyManager
Success Example
{
"meta": {
"code": 200,
"server_time": "2017-10-25T20:42:54.908Z"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 500 Access denied for this operation
Internal error creating or updating network mode
Display unit summary (resident information, network details)
Request Path: GET /2.2/organizations/:idOrSelf/subsets/:subset_id/units/:unit_id/summary
Token Type: Admin, PropertyManager
142 AMAZON CONFIDENTIAL
Success Example
{
"data": {
"ownership_status": "verified_owner",
"resident": {
"name": "John Doe",
"email": "username@email.com",
"phone": "+14155555899",
"app": {
"app_name": "eero-android",
"app_version_updated": false,
"latest_app_version_string": "6.35.0"
},
"move_in_date": "2025-03-12T22:44:00.183Z",
"move_out_date": "2025-03-15T00:00:00.000Z"
},
"ssids": [
{
"type": "main",
"enabled": true
},
{
"type": "guest",
"enabled": false
},
{
"type": "iot",
"enabled": false,
"total_connected_devices": 0
}
],
"outages": [],
"speed_tests": {
"expected_download": null,
"expected_upload": null,
"history": []
},
"alerts": [
{
"name": "Network offline",
"content": [
{
"content_type": "StatusOngoing",
"label": "Status",
"value": "Ongoing"
},
{
"content_type": "Duration",
"label": "Duration",
"value": "105 day(s) and 21 hour(s)"
}
],
"actions": []
143 AMAZON CONFIDENTIAL
}
]
},
"meta": {
"code": 200,
"server_time": "2017-10-25T20:42:54.908Z"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 500 Access denied for this operation
Internal error creating or updating network mode
List of connected devices
Request Path: GET /2.2/organizations/:idOrSelf/subsets/:subset_id/units/:unit_id/devices
Token Type: Admin, PropertyManager
Success Example
{
"meta": {
"code": 200,
"server_time": "2024-01-24T20:47:22.126Z"
},
"data": {
"iot": [
{
"url": "/2.2/networks/123456/devices/2020202020",
"mac": "22:22:22:22:22:33",
"manufacturer": "Amazon",
"manufacturer_device_type_id": null,
"ip": "192.168.0.1",
"ips": [
"192.168.0.1"
],
"nickname": null,
"hostname": null,
"connected": true,
"wireless": true,
"connection_type": "wireless",
"source": {
"location": "Living room",
"serial_number": "ERTW55555555555"
},
"last_active": "2024-01-24T20:39:57.521Z",
"first_active": "2024-01-23T23:02:53.456Z",
"connectivity": {
"rx_bitrate": "78.0 MBit/s",
144 AMAZON CONFIDENTIAL
"signal": "-49 dBm",
"signal_avg": null,
"score": 1,
"score_bars": 5,
"frequency": 2462,
"rx_rate_info": {
"rate_bps": 78000000,
"mcs": 8,
"nss": 1,
"guard_interval": "GI_800NS",
"channel_width": "WIDTH_20MHz",
"phy_type": "VHT"
},
"tx_rate_info": {
"rate_bps": null,
"mcs": null,
"nss": null,
"guard_interval": null,
"channel_width": null,
"phy_type": null
}
},
"interface": {
"frequency": null,
"frequency_unit": null
},
"usage": null,
"homekit": {
"registered": false,
"protection_mode": "UNKNOWN"
},
"device_type": "generic",
"auth": "wpa2",
"is_private": false
},
{
"url": "/2.2/networks/123456/devices/9876543210",
"mac": "12:12:12:12:12:34",
"manufacturer": "COMPANY LTD",
"manufacturer_device_type_id": null,
"ip": null,
"ips": [],
"nickname": null,
"hostname": null,
"connected": false,
"wireless": true,
"connection_type": "wireless",
"source": {
"location": "Kitchen",
"serial_number": "98FHFHFJJFJFJF"
},
"last_active": "2024-01-24T16:32:57.832Z",
"first_active": "2024-01-24T12:32:57.835Z",
"connectivity": {
145 AMAZON CONFIDENTIAL
"rx_bitrate": "1.0 MBit/s",
"signal": "-66 dBm",
"signal_avg": null,
"score": 1,
"score_bars": 5,
"frequency": 2462,
"rx_rate_info": {
"rate_bps": null,
"mcs": null,
"nss": null,
"guard_interval": null,
"channel_width": null,
"phy_type": null
},
"tx_rate_info": {
"rate_bps": null,
"mcs": null,
"nss": null,
"guard_interval": null,
"channel_width": null,
"phy_type": null
}
},
"interface": {
"frequency": null,
"frequency_unit": null
},
"usage": null,
"homekit": {
"registered": false,
"protection_mode": "UNKNOWN"
},
"device_type": "generic",
"auth": "wpa2",
"is_private": false
}
]
}
}
Error Responses
Status Description
403 500 Access denied for this operation
Internal error creating or updating network mode
Managing a community self serve activation
Updating self serve activation settings
Request Path: PUT /2.2/organizations/:id/self_serve/settings
Token Type: Admin
146 AMAZON CONFIDENTIAL
Request Fields
Field Optional? Type Description
id no string Organization ID
entity_id no string Organization ID prefixed with ORG, for example:
ORG123456789, Community ID prefix with OSS, for
example:
OSS01ecc2cf-e434-43a2-b86c-11b0627534f4
redirect_url yes string sign up url that customers will be redirected to
allow_list_urls yes array [string] domains to be allow listed
signup_wifi_name yes string SSID to be displayed on guest network
enabled yes boolean Enable or disable self serve settings
Request payload example
{
"entity_id": "ORG<organization_id> or OSS<community_id>",
"allow_list_urls": [
"domain"
],
"redirect_url": "some.redirect.url",
"signup_wifi_name": "wifi name to sign up",
"enabled": true
}
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-07-24T14:10:02.408Z"
},
"data": [
{
"entity_id": "ORG<organization_id> or OSS<community_id>",
"allow_list_urls": [
"domain"
],
"redirect_url": "some.redirect.url",
"signup_wifi_name": "wifi name to sign up",
"enabled": true
}
]
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error creating configurations
147 AMAZON CONFIDENTIAL
Deleting self serve activation settings
Request Path: DELETE /2.2/organizations/:id/self_serve/settings?entityId=value_1
Token Type: Admin
Request Fields
Field Optional? Type Description
id no string Organization ID
entity_id yes string Community ID prefixed with OSS, for example:
OSS01ecc2cf-e434-43a2-b86c-11b0627534f4
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-07-24T14:10:02.408Z"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error creating configurations
Get self serve activation settings
Request Path: GET /2.2/organizations/:id/self_serve/settings?entityId=value_1
Token Type: Admin
Request Fields
Field Optional? Type Description
id no string Organization ID
entity_id yes string Community ID prefixed with OSS, for example:
OSS01ecc2cf-e434-43a2-b86c-11b0627534f4
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-07-24T14:10:02.408Z"
},
"data": [
{
148 AMAZON CONFIDENTIAL
"entity_id": "ORG<organization_id> or OSS<community_id>",
"redirect_url": "some.redirect.url",
"allow_list_urls": [
"domain"
],
"signup_wifi_name": "wifi name to sign up",
"enabled": true
}
]
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error creating configurations
149 AMAZON CONFIDENTIAL
eero Provision
Objects
Eero Provisioned Object
Field Optional? Type Description
serial no string Serial number of the eero device
network_customer_type no string Business
APIs
Create Provision
This endpoint is used to provision eeros, receiving as parameters a list of eero serial numbers and the corre-
sponding network customer type.
Request Path: PUT /2.2/organizations/:idOrSelf/provision
Token Type: Admin
Fields
Field Optional? Type Description
provisions no arrayfields Array of provision objects
provisions[].serial no string Serial number of the eero device
provisions[].network_customer_type no string Business
Response
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": {
}
"provisioned": /* array of updated "eero provisioned object" */
}
Error Example - 400 Bad Request This code will be returned from the server if any of the vali-
dation fails. Possible errors are: - EERO_NOT_CAPABLE - eero model does not support network
type - INVALID_CONNECTION_MODE - eero belongs to network with invalid connection mode - IN-
VALID_DHCP_MODE - eero belongs to network with invalid DHCP mode - INVALID_NETWORK_TYPE -
network type provided is not allowed to be provisioned; eero belongs to network of a type that can not be
converted ORGANIZATION_NOT_FOUND - eero does not belongs to an organization
{
"meta": {
"code": 400,
"server_time": "2023-03-16T19:13:52.366Z",
"error": "error.form.errors"
},
150 AMAZON CONFIDENTIAL
"data": {
"errors": [
{
"serial": /* eero serial associated with the error */,
"error": "ORGANIZATION_NOT_FOUND"
},
{
"serial": /* eero serial associated with the error */,
"error": "ORGANIZATION_NOT_FOUND"
}
]
}
}
Error Responses
Status Description
400 403 500 If business rules validations for any eero fails
Access denied for this operation
Internal error creating eero provision
Delete Provision
This endpoint is used to deprovision eeros.
Request Path: DELETE /2.2/organizations/:idOrSelf/provision/:serial
Token Type: Admin
Response
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
}
Error Example - 400 Bad Request This code will be returned from the server if the network_customer_type
of the network the eero belongs is not Residential or the organization does not have the permission
}
{
"meta": {
"code": 400,
"server_time": "2023-03-16T19:13:52.366Z"
}
}
Error Responses
Status Description
400 403 If business rules validations fail
Access denied for this operation
151 AMAZON CONFIDENTIAL
Status Description
500 Internal error deleting eero provision
Get Provision by Serial
This endpoint is used to get the provision for an eero serial.
Request Path: GET /2.2/organizations/:idOrSelf/provision/:serial
Token Type: Admin
Response
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
},
"data": /* eero provisioned object */
}
Error Example - 403 Access Denied the permission
This code will be returned from the server if user role does not have
{
"meta": {
"code": 403,
"server_time": "2023-03-16T19:13:52.366Z"
}
}
Error Responses
Status Description
403 404 500 Access denied for this operation
Eero serial provision or organization not found
Internal error getting eero provision
Get Provisions by Organization
This endpoint is used to get provisions for an organization.
Request Path: GET /2.2/organizations/:idOrSelf/provisions?limit=100&token=
• Use pagination.next as token, pagination is present only when more pages are available.
Token Type: Admin
Response
{
"meta": {
"code": 200,
"server_time": "2023-03-16T19:13:52.366Z"
152 AMAZON CONFIDENTIAL
},
"data": /* list of eero provisioned objects */,
"pagination": {
"next": "<token>"
}
}
Error Example - 403 Access Denied the permission
This code will be returned from the server if user role does not have
{
"meta": {
"code": 403,
"server_time": "2023-03-16T19:13:52.366Z"
}
}
Error Responses
Status Description
403 500 Access denied for this operation
Internal error getting eero provision
153 AMAZON CONFIDENTIAL
Organization Settings API
This set of APIs allows for managing the settings of your organization.
APIs
Update RIPV2 PSK
Update RIPV2 PSK for an organization
Request Path: PUT /2.3/organizations/:idOrSelf/rip_v2
Token Type: ISP Admin, ISP Super user
Fields
Field Optional? Type Description
enabled no boolean Status for organization RIPV2
psk no array array of RIP object
RIPV2 Object
Field Optional? JSON Type Description
key no string RIP PSK
Response data contains the ripv2 object of the organization with that id
Example PUT /2.3/organizations/:idOrSelf/rip_v2
{
"meta": {
"code": 200,
"server_time": "2024-06-07T17:29:26.687Z"
},
"data": {
"enabled": true
}
}
Error Responses
Status Description
401 400 404 Access Denied - Organization has no RIP or user cannot update RIP
Bad Request - PSK is empty array or has more than 1 key
Organization ID does not exist
GET RIP PSK
Get RIP PSK for an organization
Request Path: GET /2.3/organizations/:idOrSelf/rip_v2
Token Type: ISP Admin, ISP Super user
154 AMAZON CONFIDENTIAL
Response data contains the ripv2 object of the organization with that id
Example GET /2.3/organizations/:idOrSelf/rip_v2
{
"meta": {
"code": 200,
"server_time": "2024-06-07T17:29:26.687Z"
},
"data": {
"enabled": true
}
}
Error Responses
Status Description
401 404 Access Denied - Organization has no RIP or user cannot get RIP
Organization ID does not exist
DELETE RIP PSK
Delete and forget all the RIP PSK an organization has ever used.
This is different from disable as all past keys will be permanently deleted and forgotten in the database.
Request Path: DELETE /2.3/organizations/:idOrSelf/rip_v2
Toekn Type: Admin, Super user
Responses The data field is omitted.
Success: 200 ok
Example
{
"meta": {
"code": 200,
"server_time": "2024-06-28T17:29:26.687Z"
}
}
Error Responses
Status Description
401 403 404 Unauthorized - User session invalid
Access Denied - Organization doesn’t have RIP feature or user don’t have permission to
delete RIP in this organizaion
Organization ID does not exist
155 AMAZON CONFIDENTIAL
Profiles
Request Path: GET /2.2/organizations/self/regulatory_tests/profiles
Token Type: Admin, BusinessAnalyst, Agent
Response Fields
Field Optional? Type Description
profile_identifier no string profile identifier
{
"meta": {
"code": 200,
"server_time": "2024-10-18T00:11:10.033Z"
},
"data": {
"profiles": [
{
"profile_identifier": "profile identifier"
}
]
}
}
Cohort
Create cohort
Request Path: POST /2.2/organizations/self/regulatory_tests/cohort
Token Type: Admin, BusinessAnalyst, Agent
Request Fields
Field Optional? Type Description
name no string Cohort name
profile_identifier no string Profile identifier that will be associated with
the cohort
Request payload example
{
"name": "some cohort name",
"profile_identifier": "profile identifier"
}
Response Fields
Field Optional? Type Description
id no string Cohort id
name no string Cohort name
156 AMAZON CONFIDENTIAL
Field Optional? Type Description
profile_identifier no string Profile identifier that will be associated with the
cohort
total_of_networks no number Number of networks associated with a profile
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-10-17T20:00:03.425Z"
},
"data": {
"id": "UUID",
"name": "some cohort name",
"profile_identifier": "profile identifier",
"total_of_networks": 0
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 409 Access denied for this operation
Cohort with same name already exist
500 Internal error
Update cohort
Request Path: POST /2.2/organizations/self/regulatory_tests/cohort/:cohortId
Token Type: Admin, BusinessAnalyst, Agent
Request Fields
Field Optional? Type Description
name no string Cohort name to be updated
Request payload example
{
}
"name": "some cohort name"
Error Responses
Status Description
400 Invalid or missing parameter
157 AMAZON CONFIDENTIAL
Status Description
403 409 Access denied for this operation
Cohort with same name already exist
500 Internal error
Get cohorts
Request Path: GET /2.2/organizations/self/regulatory_tests/cohorts
Token Type: Admin, BusinessAnalyst, Agent
Response Fields
Field Optional? Type Description
id no string Cohort id
name no string Cohort name
profile_identifier no string Profile identifier that will be associated with the
cohort
total_of_networks no number Number of networks associated with a profile
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-10-17T20:29:07.506Z"
},
"data": {
"cohorts": [
{
"id": "UUID",
"name": "cohort name",
"profile_identifier": "profile name",
"total_of_networks": 0
}
]
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error
Delete cohort
Request Path: DELETE /2.2/organizations/self/regulatory_tests/cohort/:cohortId
Token Type: Admin, BusinessAnalyst, Agent
158 AMAZON CONFIDENTIAL
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-10-17T20:26:19.942Z"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error
Cohort network status
Request Path: GET /2.2/organizations/self/regulatory_tests/cohort/:cohortId/network_status
Token Type: Admin, BusinessAnalyst, Agent
Response Fields
Field Optional? Type Description
total no number total of networks in a cohort
online.total no number total of networks online
online.percentage no number percentage of networks online
offline.total no number total of networks offline
offline.percentage no number percentage of networks offline
deleted.total no number total of networks deleted
deleted.percentage no number percentage of networks deleted
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-10-17T16:50:45.157Z"
},
"data": {
"network_status_summary": {
"total": 2,
"online": {
"count": 0,
"percentage": 0
},
"offline": {
"count": 0,
"percentage": 0
},
"deleted": {
159 AMAZON CONFIDENTIAL
"count": 2,
"percentage": 100
}
}
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error
Cohort summary
Request Path: GET /2.2/organizations/self/regulatory_tests/cohort/:cohortId/summary
Token Type: Admin, BusinessAnalyst, Agent
Response Fields
Field Optional? Type Description
average_results.average_latency no number average latency of networks in a
cohort in the last 7 days
average_results.average_upload no number average upload of networks in a
cohort in the last 7 days
average_results.average_download no number average download of networks in a
cohort in the last 7 days
number_of_tests.latency[].date no string date of latency tests
number_of_tests.latency[].total no number total of latency tests in the last 7 days
number_of_tests.speed[].date no string date of speed (upload and download)
tests
number_of_tests.speed[].total no number total of speed (upload and download)
tests in the last 7 days
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-10-17T23:40:11.133Z"
},
"data": {
"average_results": {
"average_latency": 61.38674904697577,
"average_upload": 1461.7155657072728,
"average_download": 1637.5021748696968
},
"number_of_tests": {
"latency": [
{
160 AMAZON CONFIDENTIAL
"date": "2024-10-11",
"total": 100
},
{
"date": "2024-10-12",
"total": 200
},
{
"date": "2024-10-13",
"total": 598
},
{
"date": "2024-10-14",
"total": 610
},
{
"date": "2024-10-15",
"total": 763
},
{
"date": "2024-10-16",
"total": 797
},
{
"date": "2024-10-17",
"total": 718
}
],
"speed": [
{
"date": "2024-10-11",
"total": 100
},
{
"date": "2024-10-12",
"total": 200
},
{
"date": "2024-10-13",
"total": 21
},
{
"date": "2024-10-14",
"total": 20
},
{
"date": "2024-10-15",
"total": 32
},
{
"date": "2024-10-16",
"total": 25
},
{
161 AMAZON CONFIDENTIAL
"date": "2024-10-17",
"total": 22
}
]
}
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error
Cohort network summary
Request Path: GET /2.2/organizations/self/regulatory_tests/cohort/:cohortId/networks
Token Type: Admin, BusinessAnalyst, Agent
Response Fields
Field Optional? Type Description
days no int number of days considered to
calculate averages
networks[].id no number network id
networks[].connection_status no string connection status. Possible
values: error, in_progress and
connected
networks[].speed_tests.download_speed_avg no number download average in the last
number of days (describe above)
networks[].speed_tests.upload_speed_avgno number upload average in the last
number of days (describe above)
networks[].speed_tests.download_total_tests no number total of download tests in the last
number of days (describe above)
networks[].speed_tests.upload_total_tests no number total of upload tests in the last
number of days (describe above)
networks[].latency_tests.total_tests no number total of latency tests in the last
number of days (describe above)
networks[].latency_tests.latency_avg no number latency average in the last
number of days (describe above)
networks[].hubbId no string For CAF cohorts, the HUBB
location ID to group networks
geographically, for other
regulatory programs used for
cohort subgrouping
networks[].latency_tests.subscriberId no string Unique subscriber identifier that
is used for CAF submission or
network customer identification
162 AMAZON CONFIDENTIAL
Response payload example
{
"meta": {
"code": 200,
"server_time": "2024-10-17T23:47:47.157Z"
},
"data": {
"days": 7,
"networks": [
{
"id": 1234,
"connection_status": "error",
"speed_tests": {
"download_speed_avg": 0,
"upload_speed_avg": 0,
"download_total_tests": 0,
"upload_total_tests": 0
},
"latency_tests": {
"total_tests": 0,
"latency_avg": 0
},
"hubbId": "1234567890",
"subscriberId": "24567"
}
]
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 Access denied for this operation
500 Internal error
Associate a network to a cohort
Request Path: PUT /2.2/organizations/self/regulatory_tests/cohort/:cohortId/network/:networkId/associate_network
Token Type: Admin, BusinessAnalyst, Agent
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-17T23:47:47.157Z"
}
}
163 AMAZON CONFIDENTIAL
Error Responses
Status Description
403 Access denied for this operation
500 Internal error
Disassociate a network to a cohort
Request Path: DELETE /2.2/organizations/self/regulatory_tests/cohort/:cohortId/network/:networkId/disassociate_network
Token Type: Admin, BusinessAnalyst, Agent
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-17T23:47:47.157Z"
}
}
Error Responses
Status Description
403 Access denied for this operation
500 Internal error
164 AMAZON CONFIDENTIAL
Latency Performance Tests
Set of endpoints used to interact with the Network Performance Tests.
Get Latency Test
Retrieves latency test results for a network within a specified time range, including summary statistics (min,
max, average) and individual test results.
Request Path: GET /2.2/networks/{networkId}/performance_tests/latency
Token Type: ISP Agent, ISP Agent(Read Only), ISP Admin, ISP Super user, ISP Super Admin, ISP Business
Analyst, ISP Operations admin, ISP Support Specialist, Business Owner, Pro Installer, Pro Installer Admin
Request Parameters
Parameter Required Type Description
networkId yes string Network identifier
startDate yes string Start time for the data range
endDate yes string End time for the data range
Response Fields
Field Type Description
summary.min double Minimum latency value
summary.max double Maximum latency value
summary.average double Average latency value
summary.latest.date string Date of the latest latency measurement
summary.latest.latency double Latest latency measurement
tests[].date string Date of the latency test
tests[].latency double Latency measurement
tests[].status string Status of the latency test (GOOD/MODERATE/POOR)
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-16T12:00:00Z"
},
"data": {
"summary": {
"min": 10.5,
"max": 100.2,
"average": 45.7,
"latest": {
"date": "2025-07-16T11:55:00Z",
"latency": 38.6
}
},
"tests": [
{
"date": "2025-07-16T11:55:00Z",
165 AMAZON CONFIDENTIAL
"latency": 38.6,
"status": "GOOD"
},
{
"date": "2025-07-16T11:50:00Z",
"latency": 42.1,
"status": "GOOD"
}
]
}
}
Create Latency Test
Initiates a new latency test on demand for a specified network, with the test results being sent back asyn-
chronously through the eero device.
Request Path: POST /2.2/networks/{networkId}/performance_tests/latency
Token Type: ISP Agent, ISP Agent(Read Only), ISP Admin, ISP Super user, ISP Super Admin, ISP Business
Analyst, ISP Operations admin, ISP Support Specialist, Business Owner, Pro Installer, Pro Installer Admin
Request Parameters
Parameter Required Type Description
networkId yes string Network identifier
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-16T12:05:00Z"
}
}
DNS RTT Performance Tests
Return details about DNS RTT tests of the network.
Get DNS RTT Performance Tests
Retrieves DNS Round Trip Time (RTT) statistics for networks including percentile breakdowns.
Request Path: GET /2.2/networks/{networkId}/performance_tests/dns_rtt
Token Type: ISP Agent, ISP Agent(Read Only), ISP Admin, ISP Super user, ISP Super Admin, ISP Business
Analyst, ISP Operations admin, ISP Support Specialist, Business Owner, Pro Installer, Pro Installer Admin
Request Parameters
Parameter Required Type Description
networkId yes string Network identifier
startTime yes string Start time for the data range
166 AMAZON CONFIDENTIAL
Parameter Required Type Description
endTime yes string End time for the data range
Response Fields
Field Type Description
summary.totalRequests integer Total number of DNS requests
summary.percentiles[].percentile integer Percentile value
summary.percentiles[].value double RTT value for the percentile
summary.percentiles[].unit string Unit of measurement
testResults[].date string Date of the test result
testResults[].total NonNegativeLong Total number of requests for this
result
testResults[].rttRanges[].range string RTT range
testResults[].rttRanges[].percentage double Percentage of requests in this
RTT range
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-16T12:10:00Z"
},
"data": {
"summary": {
"total_requests": 0,
"percentiles": [
{
"percentile": 90,
"value": 0,
"unit": "double",
"period": "30_DAYS"
}
},
]
{
"test_results": [
"date": "2025-07-16T12:00:00Z",
"total": 1000,
"rtt_ranges": [
{
"range": "[0,100[",
"percentage": 30.0
}
]
],
}
"warnings": [
{
"threshold": 100,
167 AMAZON CONFIDENTIAL
"status": "OK"
}
]
}
}
Speed Performance Tests
Handle the operations about speed tests.
Get Speed Performance Tests
Retrieves speed test results within a specified time range, including download/upload speeds, averages, and
expected speed percentages.
Request Path: GET /2.2/networks/{networkId}/performance_tests/speed
Token Type: ISP Agent, ISP Agent(Read Only), ISP Admin, ISP Super user, ISP Super Admin, ISP Business
Analyst, ISP Operations admin, ISP Support Specialist, Business Owner, Pro Installer, Pro Installer Admin
Request Parameters
Parameter Required Type Description
networkId yes string Network identifier
startTime yes string Start time for the data range
endTime yes string End time for the data range
Response Fields
Field Type Description
summary.average.upload double Average upload speed
summary.average.download double Average download speed
summary.latest.date string Date of the last speed test
summary.latest.upload double Download speed the last
speed test
summary.latest.download double Upload speed the last speed
test
test_results.upload[].date string Date of the upload test
test_results.upload[].speed double Upload speed
test_results.upload[].expected_speed_percentage double Expected upload speed
percentage
test_results.download[].date string Date of the download test
test_results.download[].speed double Download speed
test_results.download[].expected_speed_percentage double Expected download speed
percentage
warnings.download.threshold double Download speed warning
threshold
warnings.download.status string Download speed warning
status
warnings.download.unit string Unit of measurement
168 AMAZON CONFIDENTIAL
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-16T12:20:00Z"
},
"data": {
"summary": {
"average": {
"download": 95.7,
"upload": 48.9
},
"latest": {
"date": "2025-07-10T07:10:33.259Z",
"download": 95.7,
"upload": 48.9
},
},
"test_results": {
"upload": [
{
"date": "2025-07-16T12:15:00Z",
"speed": 50.2,
"expected_speed_percentage": 95
},
{
"date": "2025-07-16T12:10:00Z",
"speed": 49.8,
"expected_speed_percentage": 94
}
],
"download": [
{
"date": "2025-07-16T12:15:00Z",
"speed": 100.5,
"expected_speed_percentage": 98
},
{
"date": "2025-07-16T12:10:00Z",
"speed": 99.8,
"expected_speed_percentage": 97
}
]
},
"warnings": {
"download": {
"threshold": 50,
"status": "OK",
"unit": "Mbps"
}
}
}
}
169 AMAZON CONFIDENTIAL
Performance Tests Summary
Provides comprehensive overview of network performance metrics.
Get Performance Tests Summary
Provides a comprehensive performance overview of a network, including speed tests, latency, DNS RTT
metrics, outages, and reboot statistics for different time periods.
Request Path: GET /2.2/networks/{networkId}/performance_tests/summary
Token Type: ISP Agent, ISP Agent(Read Only), ISP Admin, ISP Super user, ISP Super Admin, ISP Business
Analyst, ISP Operations admin, ISP Support Specialist, Business Owner, Pro Installer, Pro Installer Admin
Request Parameters
Parameter Required Type Description
networkId yes string Network identifier
Response Fields
Field Type Description
speed.latest.date string Date of the latest speed test
speed.latest.download double Latest download speed
speed.latest.upload double Latest upload speed
speed.aggregated.period string Aggregation period for speed
tests
speed.aggregated.average_download double Average download speed for the
period
speed.aggregated.average_upload double Average upload speed for the
period
speed.warnings.download.threshold double Download speed warning
threshold
speed.warnings.download.status string Download speed warning status
speed.warnings.download.unit string Download speed unit of
measurement
outages.latest.period string Period for the latest outage data
outages.latest.count double Number of outages in the latest
period
outages.latest.total_in_minutes double Total outage duration in minutes
outages.latest.last_outage_date double Total outage duration in minutes
outages.aggregated.period string Aggregation period for outage
data
outages.aggregated.count double Total number of outages in the
period
outages.aggregated.total_in_minutes double Total outage duration for the
period
outages.warnings.unexpected_outage.threshold double Outage warning threshold
outages.warnings.unexpected_outage.unit string Unit for outage threshold
outages.warnings.unexpected_outage.status string Outage warning status
reboots.latest.count integer Number of reboots in the latest
period
reboots.latest.period string Period for the latest reboot data
170 AMAZON CONFIDENTIAL
Field Type Description
reboots.latest.last_reboot_date string Date of the latest reboot data
reboots.aggregated.count integer Total number of reboots in the
aggregated period
reboots.aggregated.period string Aggregation period for reboot
data
reboots.warnings[].status string Reboot warning status
reboots.warnings[].count integer Reboot count for this warning
reboots.warnings[].threshold integer Reboot warning threshold
reboots.warnings[].warning_type string Type of reboot warning
reboots.warnings[].unit string Unit for reboot threshold
latency.latest.date string Date of the latest latency test
latency.latest.latency double Latest latency measurement
latency.aggregated.period string Aggregation period for speed
tests
latency.aggregated.average double Average download speed for the
period
latency.aggregated.max double Average upload speed for the
period
latency.aggregated.min double Average upload speed for the
period
latency.warnings.status double Latency warning status
(“GOOD”/“MODERATE”/“POOR”)
latency.warnings.range string Acceptable latency range
dns_rtt.latest.period string Period for the latest DNS RTT
data
dns_rtt.latest.percentiles[].percentile integer Percentile value
dns_rtt.latest.percentiles[].value double DNS RTT value for the percentile
dns_rtt.latest.percentiles[].unit string Unit of measurement for DNS
RTT
dns_rtt.aggregated[].period string Aggregation period for DNS RTT
data
dns_rtt.aggregated[].percentiles[].percentile integer Percentile value for aggregated
data
dns_rtt.aggregated[].percentiles[].value double DNS RTT value for the percentile
in aggregated data
dns_rtt.aggregated[].percentiles[].unit string Unit of measurement for
aggregated DNS RTT
dns_rtt.warnings[].threshold double DNS RTT warning threshold
dns_rtt.warnings[].status string DNS RTT warning status
dns_rtt.warnings[].unit string Unit for DNS RTT warning
threshold
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-16T20:55:50.255Z"
},
"data": {
"speed": {
"latest": {
171 AMAZON CONFIDENTIAL
"date": "2025-07-16T06:46:38.628Z",
"download": 514.6,
"upload": 12.3
},
"aggregated": {
"average_download": 517.43,
"average_upload": 11.84,
"period": "30_DAYS"
},
"warnings": {
"download": {
"threshold": 50,
"status": "OK",
"unit": "Mbps"
}
}
},
"outages": {
"latest": {
"period": "TODAY",
"count": 2,
"total_in_minutes": 15,
"last_outage_date": "2025-07-16T19:30:00Z"
},
"aggregated": [
{
"period": "CURRENT_WEEK",
"count": 5,
"total_in_minutes": 45
}
],
"warnings": {
"unexpected_outage": {
"threshold": 5,
"status": "OK",
"unit": "minutes"
}
}
},
"latency": {
"latest": {
"date": "2025-07-16T13:41:04Z",
"latency": 21.84
},
"aggregated": [
{
"period": "30_DAYS",
"average": 35.796,
"min": 13.69,
"max": 90.271
}
],
"warning": {
"status": "GOOD",
172 AMAZON CONFIDENTIAL
"range": "[0,100]"
}
},
"dns_rtt": {
"latest": {
"period": "24_HOURS",
"percentiles": [
{
"percentile": 50,
"value": 15.5,
"unit": "ms"
},
{
"percentile": 90,
"value": 30.2,
"unit": "ms"
}
},
]
{
"aggregated": [
"period": "30_DAYS",
"percentiles": [
{
"percentile": 50,
"value": 16.2,
"unit": "ms"
},
{
"percentile": 90,
"value": 32.1,
"unit": "ms"
}
]
}
],
"warnings": [
{
"threshold": 50,
"status": "OK",
"unit": "ms"
}
]
},
"reboots": {
"latest": {
"count": 1,
"period": "24h",
"last_reboot_date": "2025-07-16T10:00:00Z"
},
"aggregated": {
"count": 3,
"period": "7d"
},
173 AMAZON CONFIDENTIAL
"warnings": [
{
"status": "OK",
"count": 3,
"threshold": 5,
"warning_type": "UnexpectedReboot",
"unit": "count"
}
]
}
}
}
Custom Latency Server Configuration
Endpoints related to the possibility of defining a custom server list url to be used as target for the Latency
Tests on all the networks within the organization.
Get Performance Tests Latency Server List URL
Retrieve the current custom server list url for the given organization.
Request Path: GET /2.2/organizations/{organizationId}/performance_tests/latency/server_list_url
Token Type: ISP Agent, ISP Admin, ISP Super user, ISP Super Admin, ISP Business Analyst, ISP Operations
admin, ISP Support Specialist
Request Parameters
Parameter Required Type Description
organizationId yes string Organization identifier
Response Fields
Field Type Description
server_list_url string URL for the latency server list
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-16T12:25:00Z"
},
"data": {
"server_list_url": "https://example.com/latency-servers"
}
}
174 AMAZON CONFIDENTIAL
Update Performance Tests Latency Server List URL
Update the current custom server list url for the given organization.
Request Path: PUT /2.2/organizations/{organizationId}/performance_tests/latency/server_list_url
Token Type: ISP Agent, ISP Admin, ISP Super user, ISP Super Admin, ISP Business Analyst, ISP Operations
admin, ISP Support Specialist
Request Parameters
Parameter Required Type Description
organizationId yes string Organization identifier
server_list_url yes string New server list URL
Response payload example
{
"meta": {
"code": 200,
"server_time": "2025-07-16T12:30:00Z"
}
}
Error Responses
Status Description
400 Invalid or missing parameter
403 500 Access denied for this operation
Internal error resending new linking email
175 AMAZON CONFIDENTIAL
Insight Exchange API
eero Insight’s Exchange system allows partners to access proprietary raw eero datasets in a secure manner
for upstream integration and data analysis purposes. These datasets enable eero’s partners to integrate into
existing tool chains and processes to better service their end customers.
Datasets are retained by eero for 90 days after they are created.
The Insight Exchange API endpoints provide a way to gather these daily data aggregations. These datasets
are automatically aggregated by eero every 24 hours and gather fleet-wide information about the behavior
and status of devices and customer networks managed by your organization. After data is aggregated the
information is exported to CSV files for use by your organization. The APIs in this chapter allow you to pro-
grammatically verify the historical status of jobs that have been run and to retrieve the URLs that can be used
to download the flat data files containing the aggregated data.
Each day, eero runs a background job for each of the dataset types that eero supports. A job collects data
on different types of information about your organization’s fleet of eeros. Your organization’s daily jobs are
run at a time that you can coordinate with eero.
You can query the status of jobs that have been run in the past using the Get Data Aggregation Jobs endpoint
described below. If you need to download the flat file associated with a job run, see the Get a Data Artifact
and Its Download Link endpoint described below.
These datasets are restricted to admin users of eero Insight only.
See the eero Insight Exchange data dictionary for more details on each dataset and the schema of each file.
Objects
Data Aggregation Job Object
This object contains information about a job run by eero’s data aggregation system. Each run attempts to
aggregate a single dataset and output the aggregated data into a flat file. This object contains information
about when the job was run, its status, and a reference to the data artifact that was generated during a
successful job run. By default, jobs have a timeout of twenty minutes. Jobs that fail or timeout during the
aggregation process are marked as failed and should be reported to eero for investigation.
Field Optional?
JSON
Type Description
run_id yes integer The unique ID of the aggregation job. Can be used for
troubleshooting with eero.
artifact_id yes integer Unique ID of the artifact record generated by the job. Only valid
if a job’s status is “completed”, null otherwise. This ID can be
used with the Get a Data Artifact and Its Download Link
endpoint described below.
dataset no string Enumerated value of the dataset aggregated by the job (see the
eero Insight Exchange data dictionary for full documentation).
output_format no string The file format of the data artifact exported by the job (currently
only csv is supported).
status no string Description of the current state of the job. One of pending
(created, not yet started), started, completed, or failed
created no string Creation time of the job.
started yes string Start time of the job.
completed yes string Completion time of the job.
timeout no string If a job is not completed by the “timeout” time its status will be
reported as failed.
176 AMAZON CONFIDENTIAL
Data Artifact Object
This object contains information about data artifacts (flat data files) generated during a successful aggregation
job run. All jobs that report a status of “completed” should be associated with a valid flat file that can be
downloaded programmatically.
Field Optional?
JSON
Type Description
id no string Unique ID of the artifact
run_id no integer The unique ID of the aggregation job associated with the data
artifact.
dataset no string Enumerated value of the dataset aggregated in the artifact
(see the eero Insight Exchange data dictionary for full
documentation).
output_format no string The file format of the data artifact (currently only csv is
supported).
created no string Creation time of the artifact record.
expires no string The time when a flat file expires in S3. After this time,
presigned links cannot be generated for the artifact.
download_link yes string The presigned URL of the flat file. This URL is valid for 10
minutes after a request is made. The presigned URL will only
appear in a response if the query parameter download_link is
sent as true in the request.
download_link_expires yes string The time when a download_link expires. Default is 10 minutes
after the time of the request. After this time requests to
download_link URL will return a 404 Not Found.
APIs
Get Data Aggregation Jobs
Retrieve all the jobs that were run by eero within a specified time range
Request Path: GET /2.2/organizations/self/data_aggregation_jobs
Token Type: Admin
Query Parameters
Field Optional? Type Description
start no string ISO 8601 timestamp (UTC); start of time range in
which jobs were run
end yes string ISO 8601 timestamp (UTC); end of time range in
which jobs were run
dataset yes string Filter returned jobs by the dataset aggregated
desc yes boolean true = return results in descending order by
creation time
limit yes integer Number of data_aggregation_jobs to return in
each response (for pagination, default = 20)
177 AMAZON CONFIDENTIAL
Field Optional? Type Description
offset yes integer Used for pagination of response data. This field is
managed by the pagination section of the API
response (more info in Response section), and
should not be set explicitly.
Response
• data is a JSON object containing a collection of Data Aggregation Job Object instances (described
above) in ascending order by creation time (this can be reversed using the desc parameter in the re-
quest). If a Data Aggregation Job Object has a non-null completed timestamp and contains a non-null
artifact_id value, the artifact_id can be used with the Get a Data Artifact and Its Download Link
API below to retrieve the flat data file generated by the job.
• pagination is a JSON object containing a next URL string. This URL contains the next page of results
for result sets that contain more elements than the limit specified in the API request.
Example Request
GET /2.2/organizations/self/data_aggregation_jobs?start=2020-03-11T00:00:00Z
&desc=true&limit=2
Example Response
{
"pagination": {
"next": "/2.2/organizations/self/data_aggregation_jobs?start=2020-03-11T00%3A00%3A00Z
&desc=true&offset=4&limit=2"
},
"data": {
{
"aggregation_jobs": [
"run_id": 12,
"artifact_id": null,
"dataset": "node_outages",
"output_format": "csv",
"status": "started",
"created": "2021-03-16T23:45:08.867Z",
"started": "2021-03-16T23:45:26.479Z",
"completed": null,
"timeout": "2022-03-17T05:34:20.867Z"
},
{
"run_id": 11,
"artifact_id": 8,
"dataset": "network_outages",
"output_format": "csv",
"status": "completed",
"created": "2021-03-16T23:33:18.188Z",
"started": "2021-03-16T23:33:29.114Z",
"completed": "2021-03-16T23:34:23.260Z",
"timeout": "2021-03-16T23:43:18.188Z"
}
]
178 AMAZON CONFIDENTIAL
}
}
Get a Data Artifact and Its Download Link
Use this endpoint to retrieve information about a data aggregation artifact that was generated by a daily job
run.
Set the download_link query parameter to generate a presigned S3 URL that can be used to download the
dataset flat file (e.g. cURL). A presigned URL is a short-lived link to an S3 object. The URLs returned by this
endpoint are valid for 10 minutes after generation, after which they are no longer accessible. If you need to
regenerate a presigned URL for an artifact, simply make a new request to this endpoint.
Request Path: GET /2.2/organizations/self/data_artifacts/:artifactId
Token Type: Admin, Agent
Query Parameters
Field Optional? Type Description
download_link yes boolean whether to return a response with a presigned
URL generated for the artifact
Response data is a JSON object containing a Data Artifact Object (described above)
Example Request GET /2.2/organizations/self/data_artifacts/8?download_link=true
Example Response
{
"data": {
"id": 8,
"run_id": 11,
"dataset": "network_outages",
"output_format": "csv",
"created": "2021-03-16T23:33:56.676Z",
"expires": "2021-05-17T00:44:15.900Z",
"download_link": "https://eero-data-aggregations.s3.us-west-2.amazonaws.com/
organization_aggregations/12345/8/network_outages-2021-02-01.csv?X-Amz-Security-Token=xYz",
"download_link_expires": "2021-03-17T19:44:21.744Z"