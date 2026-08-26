# IFN636 Assessment 1 — Event Ticket Booking System

Replace the cover-page placeholders with your name, student ID, tutor, links, EC2 URL and instance ID before converting this document to PDF.

## 1. Problem, requirements and project management

### Problem and stakeholders

Small local event organisers often accept reservations using social-media messages and spreadsheets. This creates delayed confirmations, limited visibility of capacity, and risk of overbooking. EventBook centralises event publication and ticket booking.

Stakeholders are customers/attendees, event administrators, event organisers, and the unit marker. The two system user roles are **Customer** and **Administrator**. A customer views events, books tickets, and manages their own bookings. An administrator creates events and views all bookings.

### Scope

In scope: role-based sign-in, event browsing, persistent events and bookings, server-side capacity validation, booking confirmation/cancellation, administrator event creation, and EC2 deployment. Out of scope: payment processing, venue seating maps, email/SMS notifications, attendee check-in, public user registration, and multi-organiser tenancy.

Assumptions: each ticket is general admission; a customer has a demo account; payment occurs outside the prototype; organisers maintain event details accurately. Success is measured when (1) a customer can book an available event in under three minutes, (2) capacity cannot be exceeded, (3) an administrator can create a valid event, (4) data persists through server restart, and (5) the public EC2 URL supports the booking workflow.

### Prioritised backlog

| Priority | Epic | ID | User story and acceptance criteria | Estimate |
|---|---|---|---|---:|
| Must | Authentication | US-01 | As a customer/admin, I log in so I access the appropriate features. Given valid credentials, role-specific options display; given invalid credentials, an error displays. | 3h |
| Must | Event discovery | US-02 | As a customer, I view events and remaining capacity. Events show date, venue, price and available tickets. | 2h |
| Must | Booking | US-03 | As a customer, I book one or more tickets. A positive whole quantity within remaining capacity creates a confirmation and updates capacity. | 5h |
| Must | Event management | US-04 | As an admin, I create an event. Required fields, non-negative price and positive capacity are validated. | 4h |
| Should | Booking management | US-05 | As a customer/admin, I view eligible bookings and cancel a confirmed booking. Cancellation restores capacity. | 3h |
| Could | Search | US-06 | As a customer, I filter events by keyword/date. | 3h |

Tasks: define requirements and wireframes; create data model/API; implement UI; implement server validation; execute tests; create diagrams/traceability; deploy to EC2; document evidence. Dependencies: US-03 depends on US-01 and US-02; US-05 depends on US-03; deployment depends on a tested workflow. Owner: student for all tasks. Risk: EC2 setup delays (mitigation: deploy after local test); capacity race condition (mitigation: validate/update in the same server operation); invalid input (mitigation: browser and server validation).

### Iteration plan and change log

| Iteration | Timebox | Planned work | Review outcome/blocker |
|---|---|---|---|
| 1 — design and foundation | Days 1–3 | Requirements, backlog, wireframes, data model, login and event list | Customer flow was navigable; booking needed server capacity validation. |
| 2 — workflow and release | Days 4–6 | Booking/cancellation, admin create event, tests, deployment/documentation | Complete booking flow verified locally; EC2 URL to be recorded after deployment. |

| Change | Reason/evidence | Affected artefacts |
|---|---|---|
| Added cancellation | Customers need to correct accidental bookings; capacity must be restored. | US-05, API, data model, booking screen, tests |
| Validated capacity on server | Client validation can be bypassed. | R-04, booking endpoint, test cases, sequence diagram |

## 2. System design

### Requirements

R-01: The system shall separate customer and administrator capabilities after authentication. R-02: The system shall display event title, date/time, venue, price, and remaining tickets. R-03: The system shall create a confirmed booking only for a positive whole ticket quantity. R-04: The system shall reject a booking exceeding event capacity. R-05: The system shall allow an administrator to create a validated event. R-06: The system shall persist events and bookings.

The SysML views are a requirement diagram (`requirements.puml`), a use-case view (`use-case.puml`), a block definition view (`system-design.puml`), and a booking sequence view (`booking-sequence.puml`). These cover requirements, system boundary, structural components/data, and behaviour. Open the files in PlantUML or reproduce the contents in Draw.io, then add the view-only link to the cover page.

### Traceability matrix

| Requirement | Story/issue | Design element | UI screen | Commit | Deployment evidence |
|---|---|---|---|---|---|
| R-01 | US-01 | Login API, session/role check | Login | Add after commit | Screenshot: role-specific navigation |
| R-02 | US-02 | GET /api/events, Event entity | Event list | Add after commit | Screenshot: public events page |
| R-03/R-04 | US-03 | POST /api/bookings, capacity check | Booking form/success/error | Add after commit | Screenshot: EC2 booking confirmation |
| R-05 | US-04 | POST /api/events, validEvent | Create event form | Add after commit | Screenshot: EC2 admin validation |
| R-06 | US-03/04 | data.json repository | N/A | Add after commit | Restart server and show retained booking |

## 3. UI/UX design

Low-fidelity wireframes are in `docs/wireframes.md`. The implemented prototype provides Home/Event list, Login, Booking, Booking success/error, My Bookings, Admin Create Event, and empty-state screens. Reusable controls include cards, buttons, form inputs, alerts, and navigation. Visual hierarchy places event title and booking action before secondary detail. Build matching frames in Figma and connect: Home → Login → Home → Booking → Confirmation; Home → Login as admin → Create Event. Add your Figma view-only URL on the cover page.

## 4. Git version control practice

Use this repository with a feature branch and pull request. Suggested sequence: branch `feature/US-01-auth-events`; commit login/event list; branch `feature/US-03-booking`; commit booking/capacity validation; branch `feature/US-04-admin`; commit event creation; document a self-review improvement (for example, “moved capacity check to server”); merge branches; tag release `v1.0.0`. Do not invent past dates or rewrite history. Capture the real commit hashes in the traceability matrix after committing.

## 5. Sample application and EC2 deployment

The sample implements the Customer booking workflow: authenticate → browse events → select quantity → server validates availability → booking confirmation and capacity update. It also implements the Admin create-event workflow. Use the README EC2 procedure and add a screenshot of inbound security-group rules, the public browser URL, and the terminal/PM2 status. Do not commit credentials or private keys. For the marking window, ensure the public URL remains accessible. The relevant unit tutorial specifies an Ubuntu instance in Asia Pacific (Sydney), PublicSubnet1 or PublicSubnet2, and the IFN636-EC2-Role; follow your tutorial's current AWS instructions.

### Testing and CI/CD

The test cases are documented in `test-plan.md`. `npm test` executes automated Node tests for event validation. `.github/workflows/ci.yml` runs the same test command automatically on pushes and pull requests to `main`, consistent with the tutorial's GitHub Actions workflow pattern. Continuous delivery is not required for this assessment; manual EC2 deployment with PM2 is documented in the README.

## 6. GenAI disclosure and reflection

GenAI was used as a drafting and development aid to create initial code structure, requirements wording, and test ideas. The student reviewed, edited, tested, and takes responsibility for the final submission. One challenge was protecting ticket capacity from invalid quantities and overbooking. The response was to validate the quantity and remaining capacity in the server booking endpoint rather than relying only on the browser. Evidence is the booking endpoint, the error state, and test results. In future, I would introduce a database transaction and concurrent-booking tests. Add APA references for any external sources used, following QUT guidance.
