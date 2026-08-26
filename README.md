# EventBook — Event Ticket Booking System

A small web application for IFN636 Assessment 1. It demonstrates an end-to-end customer ticket booking workflow and an administrator event-management workflow.

## Run locally

Requires Node.js 20 or later.

```bash
npm start
```

Open `http://localhost:3000`.

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Customer | customer@example.com | Customer123! |
| Administrator | admin@example.com | Admin123! |

## Architecture

The Node.js HTTP server exposes a small REST-style API and serves a responsive HTML/CSS/JavaScript client. `data.json` stores events and bookings so the data persists across server restarts. Authentication is deliberately demo-only: credentials and in-memory sessions must be replaced with hashed passwords and a database before production use.

## Key functions

- Customer: authenticate, view events, validate and submit a booking, view/cancel own bookings.
- Administrator: authenticate, create validated events, view/cancel all bookings.
- Capacity checks occur on the server, preventing an event from being overbooked.

## Known limitations

- No payment gateway, registration, email notification, password reset, or production database.
- Sessions end when the server restarts.
- This is a prototype; HTTPS, secure cookies, password hashing, rate limiting, and a managed database are required for a production deployment.

## EC2 manual deployment

1. Launch an Ubuntu EC2 instance in a public subnet. Create a security group permitting TCP 22 only from your IP and TCP 3000 temporarily for marking (or use Nginx on 80/443).
2. Install Node.js, clone the repository, then run `npm start` with `PORT=3000`.
3. For a persistent process use `pm2 start server.js --name eventbook` and `pm2 save`.
4. Confirm no secrets are committed; this prototype uses no environment secrets. Record the public URL and instance ID in the report.
