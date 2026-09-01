# EventBook — Event Ticket Booking System

EventBook is a lightweight Node.js web application for browsing events, reserving tickets and managing events through an administrator view.

## Run locally

Requires Node.js 20 or later.

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | customer@example.com | Customer123! |
| Administrator | admin@example.com | Admin123! |

## Features

- Browse, search and filter events.
- View availability and add tickets to a booking.
- Complete a simulated checkout and view or cancel bookings.
- Create, edit and manage events as an administrator.
- Enforce capacity checks on the server to prevent overbooking.

## Technical overview

The application uses a Node.js HTTP server to serve a responsive HTML/CSS/JavaScript client and a small REST-style API. Event and booking data is stored in `data.json`, so it persists across server restarts.

## Tests

```bash
npm test
```

## Limitations

This is a demonstration application. It does not include a real payment gateway, registration, email notifications, password resets or a production database. Authentication and session handling should be replaced with secure production alternatives before deployment.
