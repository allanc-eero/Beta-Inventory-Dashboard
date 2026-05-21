# Partner API Documentation

**Version:** latest (2.6.8)  
**Classification:** Amazon Confidential

## Overview

This document describes the eero Partner API, a REST API exposed at `https://api-user.e2ro.com/2.2`.

## API Sections

- **Authentication** — Two-step login/verify flow using email-based verification codes
- **Networks API** — Create, read, update, delete, and manage eero networks
- **Data Plan API** — Set plan metadata (speeds, data caps) for managed networks
- **IPv4 Port Forwarding API** — Manage port forwards on networks
- **IPv4 Reservations API** — Manage IP reservations on networks
- **IPv6 Pinhole Management API** — Manage IPv6 firewall pinholes
- **Customer Account API** — Tie partner customer identifiers to eero records
- **Subscription API** — Manage eero Secure/Secure+ subscriptions
- **eero Secure+ API** — Subscribe/cancel eero Secure+ for networks
- **Devices & Profiles APIs** — View connected devices, manage profiles
- **eeros API** — Add, update, search, reboot eero devices
- **eero Deactivation API** — Activate/deactivate eero devices
- **Organization Users API** — Manage organization members
- **Network Outages API** — Query network outage data
- **Bandwidth API** — Query bandwidth usage and thresholds
- **Firmware API** — Update network firmware versions
- **eero for Business** — Business network configuration (subnets, captive portals)
- **eero for Communities** — Managed communities, IoT SSIDs, self-serve activation
- **eero Provision API** — Provision eero devices
- **Organization Settings API** — RIPv2 PSK management
- **Performance Tests** — Latency, DNS RTT, and speed performance tests
- **Insight Exchange API** — Data aggregation jobs and artifact downloads

## Authentication

Authentication is a 2-step process:

1. **POST /2.2/pro/login** — Submit email to receive an unverified session token
2. **POST /2.2/login/verify** — Submit the emailed verification code to verify the token

Verified tokens do not expire and should be kept secret.

## API Tokens

There are two types of tokens:

- **Agent token** — Used to make requests on behalf of a network administrator (view/modify networks)
- **Admin token** — All Agent permissions plus organization staff management and sensitive operations

## Request Headers

All requests require:
- `Accept: application/json`
- `X-Lang: en-US`
- `User-Agent: <partner-name>/<version>`
- `X-User-Token: <verified-token>` (except login requests)

## Response Format

```json
{
  "meta": {
    "code": 200,
    "server_time": "2016-01-27T00:35:00.638Z"
  },
  "data": {},
  "pagination": {
    "next": "/url/to/next/page"
  }
}
```

## Source Document

The full API specification is available in `PartnerAPI_vlatest` at the project root.
