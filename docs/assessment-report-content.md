# IFN636 Assessment 1 — EventBook Ticket Booking System

> **Submission preparation note.** Replace every bracketed placeholder on the cover page, paste the labelled screenshots in the evidence appendix, and update the Git commit hash for the final local enhancement before exporting this report to PDF. Captions must explain what the evidence proves; do not include passwords, private keys, unrelated browser tabs, or personal data.

## Cover page

| Item | Submission value |
|---|---|
| Assessment | IFN636 Assessment 1 — Software Requirements Analysis and Design |
| System | **EventBook — Event Ticket Booking System** |
| Student name, ID and tutor | **[replace]** |
| GitHub repository | https://github.com/likhitrajdundigal/event-ticket-booking-system |
| Jira project | https://likhitraj333.atlassian.net/jira/software/projects/EVENT/summary |
| Jira board | https://likhitraj333.atlassian.net/jira/software/projects/EVENT/boards/34 |
| EC2 instance | `i-065c5e4c95dbba221` |
| EC2 public IPv4 used for deployment test | `3.106.245.243` |
| Figma view-only URL | **[replace]** |
| Draw.io diagram folder | https://github.com/likhitrajdundigal/event-ticket-booking-system/tree/main/docs/drawio |
| Submission date | **[replace]** |

---

## Executive summary *(front matter — not a marked section)*

EventBook is a responsive web prototype for discovering local events, booking general-admission tickets, and administering published events. It was designed for small organisers who currently rely on social-media messages and spreadsheets. Those manual processes can delay confirmations, hide remaining capacity, and cause overbooking.

The prototype provides two role-specific experiences:

- **Customer:** browse, search, sort, save events locally, inspect event details, complete a clearly labelled simulated checkout, receive a booking reference, view bookings, and cancel eligible bookings.
- **Administrator:** log in with an administrator role, view event/booking/revenue indicators, create a new event, edit an existing event, and view or cancel all bookings.

The implementation uses an HTML/CSS/JavaScript web client, a Node.js HTTP API, in-memory demo sessions, and a JSON persistence file. Server-side validation is deliberately used for ticket quantity, capacity, role access, and event values so that a user cannot bypass the browser UI to overbook an event.

---

## 1. Problem, requirements and project management (12 marks)

### 1.1 Problem statement

Local event organisers need a lightweight way to publish events and accept reservations. A spreadsheet-based approach does not automatically calculate capacity, create a confirmation, or restrict administrative changes. EventBook addresses this by keeping event and booking information in one application and validating each booking before it is saved.

### 1.2 Stakeholders and user roles

| Stakeholder | Need from EventBook |
|---|---|
| Customer / attendee | Find relevant events, understand price and availability, book safely, and manage their own reservations. |
| Event administrator | Create or correct event details, monitor bookings and remaining capacity, and resolve cancellations. |
| Event organiser | Reduce manual tracking effort and prevent accidental overbooking. |
| Unit marker | Inspect requirements, diagrams, agile evidence, code quality, testing, and deployment evidence. |

### 1.3 Scope, constraints and assumptions

**In scope:** demo role-based sign-in, responsive event discovery, keyword search, sorting, local saved events, event details, simulated payment fields, booking confirmation/cancellation, server-side capacity validation, administrator event creation/editing, booking metrics, automated tests, GitHub Actions CI, and EC2/PM2 deployment evidence.

**Out of scope:** a real payment gateway, card-data storage, public registration, password reset, email/SMS notifications, venue seating maps, attendee check-in, a production database, multi-organiser tenancy, and concurrent transactional booking protection.

**Assumptions:** each event is general admission; the supplied customer and administrator accounts are assessment-only demo accounts; payment inputs are validated only in the browser and never sent to or stored by the API; event organisers maintain the accuracy of event details.

### 1.4 Measurable success criteria

The prototype is successful when a customer can find an event and make a booking in under three minutes, an over-capacity request is rejected by the server, an administrator can publish and amend valid event data, and booking/event records remain in `data.json` after a server restart. EC2 process and reverse-proxy health are demonstrated with PM2, Nginx and local HTTP checks; a working public URL must also be verified before the marking demonstration.

---

### 1.5 Prioritised requirements and acceptance criteria

#### Functional requirements

| ID | Requirement | Priority | Acceptance measure |
|---|---|---|---|
| R-01 | The system shall authenticate a customer or administrator and show role-appropriate functions. | Must | Valid credentials show customer or administrator navigation; invalid credentials display a helpful error. |
| R-02 | The system shall display event title, date/time, venue, price and remaining capacity. | Must | Event cards and details contain all fields and availability indicators. |
| R-03 | The system shall accept only a positive whole ticket quantity and calculate the booking total. | Must | Invalid values are rejected; checkout total updates as ticket quantity changes. |
| R-04 | The server shall reject booking requests exceeding remaining capacity. | Must | A request with `booked + quantity > capacity` returns an understandable error and does not create a booking. |
| R-05 | The system shall allow an administrator to create and edit validated event details. | Must | Required fields, whole positive capacity and non-negative price are enforced. |
| R-06 | The system shall persist event and booking records. | Must | The JSON repository is read and written by create, update, booking and cancellation operations. |
| R-07 | The system shall show booking confirmation and allow authorised cancellation. | Should | A booking reference/total is shown; eligible cancellation restores capacity. |

#### Should-have usability enhancements

The following refinements strengthen usability without changing the core assessment scope: keyword search; availability and price sorting; availability progress bars; saved events stored in browser local storage; demo-account shortcuts; customer/admin booking metrics; safer cancellation confirmation; toast feedback; responsive layout; and a copy-link control. These features provide richer high-fidelity screenshot evidence and make common actions easier to find.

### 1.6 Product backlog, Jira structure and estimates

The final assessment project is the fresh Jira project **EventBook Ticket Booking System (`EVENT`)**, rather than the earlier experimental `SCRUM` project. This avoids the old board/list-view configuration issue and provides a clean evidence trail.

| Jira item | Key | Estimate | Status/evidence |
|---|---|---:|---|
| Epic — Authentication and Role Access | EVENT-1 | — | Child delivery item complete |
| Epic — Event Discovery and Booking | EVENT-2 | — | Child delivery items complete |
| Epic — Quality, CI and EC2 Delivery | EVENT-3 | — | Child delivery items complete |
| Epic — Administrator Event Management | EVENT-19 | — | Child delivery items complete |
| Customer/admin login | EVENT-4 | 3 | Done |
| Browse event details and availability | EVENT-5 | 3 | Done |
| Simulated checkout and capacity validation | EVENT-6 | 5 | Done |
| Admin create/edit event | EVENT-7 | 5 | Done |
| Admin view all event bookings | EVENT-8 | 3 | Done |
| Customer view/cancel bookings | EVENT-11 | 3 | Done |
| Implementation, validation, testing, CI, EC2 and diagram-evidence tasks | EVENT-9, EVENT-10, EVENT-12 to EVENT-18; EVENT-20 | 1–3 each | Done |

At the time of evidence capture, the Jira summary showed **16 completed delivery work items from 20 total items**. The remaining four items are the structural epics; their progress is shown as 100% because their child work is complete.

| User story | Acceptance criteria | Representative task / subtask evidence |
|---|---|---|
| EVENT-4 — Customer/admin login | Correct role navigation appears after valid login; invalid login shows an error. | Login endpoint, session helper and role-specific navigation. |
| EVENT-5 — Browse events | Event metadata and remaining capacity are visible; search/sort changes the list. | Event API, cards, details view and availability indicator. |
| EVENT-6 — Checkout | Positive whole quantity updates total; booking cannot exceed capacity. | Booking helper, capacity validation, confirmation view and test. |
| EVENT-7 — Admin manage events | Valid event data can be created/edited; invalid values are rejected. | Admin form, `validEvent` helper and update endpoint. |
| EVENT-8 — Admin booking oversight | Administrator can view booking information for published events. | Dashboard metrics and booking-management view. |
| EVENT-11 — Customer bookings | Customer can view own booking and cancel an eligible booking. | My Bookings view, cancellation endpoint and capacity restoration. |

### 1.7 Time-boxed iterations, dependencies and review outcomes

`EVENT Sprint 1` is configured for **30 August to 13 September 2026**. It contains the six user stories, all moved to the **Done** column. Keep this sprint active while taking screenshots so that the completed cards remain visible on the board. Do not click **Complete sprint** until after collecting Board evidence.

| Iteration | Time box | Owner | Dependencies / risk | Review outcome |
|---|---|---|---|---|
| 1 — Design and foundation | 30 Aug–3 Sep 2026 | Student developer | Requirements must be agreed before wireframes, API model and Jira stories. Risk: unclear role permissions. | Customer/admin roles, core requirements and initial design artefacts completed. |
| 2 — Booking and administration | 4–8 Sep 2026 | Student developer | Booking depends on event records and role checks. Risk: overbooking or capacity falling below existing bookings. | Server-side booking/capacity validation and administrator create/edit workflow completed. |
| 3 — Quality, evidence and deployment | 9–13 Sep 2026 | Student developer | Tests depend on stable validation helpers; deployment depends on EC2 network access. Blocker: managed VPC public-access timeout. | Automated test suite, documentation, diagrams and local EC2 health evidence completed; public access remains a recorded risk requiring resolution. |

### 1.8 Iteration and change log

| Iteration | Planned work | Outcome |
|---|---|---|
| 1 — Design and foundation | Requirements, wireframes, data model, authentication and event list | Core customer/admin roles and event listing were established. |
| 2 — Booking and administration | Server-side capacity validation, checkout, bookings, cancellation, create/edit event | End-to-end customer booking and administrator management workflows were implemented. |
| 3 — Quality and usability refinement | Search/sort, saved events, responsive styling, metrics, test expansion and evidence documentation | The site became more readable and usable; four automated tests pass. |

| Change | Reason | Affected artefacts |
|---|---|---|
| Server-side capacity validation | Browser-only validation can be bypassed. | R-03/R-04, booking endpoint, test suite, sequence diagram |
| Simulated checkout | Demonstrates a realistic booking journey without storing payment information. | R-03/R-07, checkout and confirmation screens |
| Admin edit workflow | Administrators need to correct event details after publication. | R-05, dashboard, create/edit form |
| Search, sort and saved events | Supports event discovery and makes the customer UI more useful. | Home screen, browser local storage, high-fidelity prototype |
| Metrics and progress indicators | Improves visibility of ticket availability and administrator oversight. | Customer cards, booking view, admin dashboard |

---

## 2. System design (8 marks)

### 2.1 SysML requirements view

![EventBook requirements diagram](diagrams/requirements.svg)

**Figure 1.** SysML-style requirements diagram showing the seven core functional requirements and their relationship to customer and administrator workflows.

### 2.2 Use-case view

![EventBook use-case diagram](diagrams/use-case.svg)

**Figure 2.** Use-case diagram identifying Customer and Administrator actors, core customer booking use cases, administration use cases, validation and persistence inclusions.

### 2.3 SysML block definition / logical architecture view

![EventBook logical architecture diagram](diagrams/block-definition-detailed.svg)

**Figure 3.** Detailed SysML block definition diagram. The Web Client calls the HTTP API using JSON/Bearer-token requests. The API composes session management, validation and JSON persistence. Event and Booking are persistent data blocks, while demo users/sessions remain in memory.

### 2.4 Component and deployment architecture view

![EventBook component and deployment architecture diagram](diagrams/architecture.svg)

**Figure 4.** Component and deployment architecture. The browser client calls the Nginx reverse proxy, which forwards requests to the PM2-managed Node.js service. `server.js` contains the application services and persists Event/Booking records in `data.json`. The diagram distinguishes verified local EC2 health from the managed-network public-access limitation.

### 2.5 Behavioural view — booking sequence

![EventBook booking sequence diagram](diagrams/booking-sequence.svg)

**Figure 5.** Customer booking sequence. The client calculates a visible total, but the server authorises the user, validates the whole quantity and checks capacity before incrementing `booked` and writing the booking.

### 2.6 Supporting data-flow view

![EventBook data-flow diagram](diagrams/data-flow.svg)

**Figure 6.** Data-flow view showing customer/admin input, client/API exchange, validation, browser-local session/favourite storage and the JSON event/booking store.

### 2.7 Design rationale

The system follows a simple three-layer design appropriate for the assessment prototype:

1. **Presentation layer:** `public/index.html`, `public/style.css` and `public/app.js` render the responsive interface, maintain client state, calculate the visible checkout total, and call API endpoints.
2. **Application layer:** `server.js` routes HTTP requests, authenticates demo users, enforces role access, validates event/booking data, and sends clear JSON responses.
3. **Persistence layer:** `data.json` stores Event and Booking records. It is suitable for a small prototype but would be replaced by a transactional database in production.

Important integrity decisions include calculating remaining tickets from `capacity - booked`, checking capacity on the server immediately before saving a booking, preventing capacity from being edited below the number already booked, and restoring ticket availability when an authorised cancellation occurs.

### 2.8 End-to-end traceability matrix

This matrix links each requirement to the planned Jira work, the implemented design, the Figma evidence, and the actual commit/deployment proof. Replace the Figma frame labels with the final frame URLs before submission.

| Requirement | Jira story / task | Design / code element | Figma frame / screen | Commit / deployment evidence |
|---|---|---|---|---|
| R-01 Role-specific access | EVENT-4; EVENT-9 | Login API, demo session, role guard and role-specific navigation | F-H03 Customer login; F-H08 Admin login | `1de60f0`; customer/admin navigation screenshots |
| R-02 Event discovery | EVENT-5; EVENT-10 | Event API, cards, details and availability bar | F-H01 Home; F-H02 Event details | `1de60f0`; deployed home-page evidence |
| R-03 Ticket quantity and total | EVENT-6; EVENT-13 | Checkout quantity control and calculated order summary | F-H04 Checkout | `24b7b6b`; checkout screenshot and `npm test` |
| R-04 Capacity protection | EVENT-6; EVENT-12 | Server booking helper, capacity check and error response | F-H04 Checkout error state | `1de60f0`; test output and booking sequence diagram |
| R-05 Admin event management | EVENT-7; EVENT-15 | Create/edit form, `validEvent`, administrator dashboard | F-H09 Admin dashboard; F-H10 Edit event | `24b7b6b`; administrator workflow screenshot |
| R-06 Persistent event/booking records | EVENT-6/7; EVENT-14 | JSON repository and read/write helpers | F-H05 Confirmation / My Bookings | `1de60f0`; EC2 local API and restart evidence |
| R-07 Confirmation and cancellation | EVENT-11; EVENT-14 | Booking receipt, booking history and cancellation update | F-H05 Confirmation; F-H06 My Bookings | `24b7b6b`; cancellation evidence |
| Quality, delivery and diagrams | EVENT-17; EVENT-18; EVENT-20 | Tests, CI workflow, PM2/Nginx deployment and Draw.io diagrams | F-H01–F-H10 | `a778819`, `8910971`, `354ebda`; Actions and EC2 evidence |

---

## 3. UI/UX design (6 marks)

### 3.1 Low-fidelity wireframes

Low-fidelity wireframes communicate layout, information hierarchy and navigation before visual styling. The editable source is in `docs/wireframes.md`. Recreate these screens in Figma and insert the two final images below.

**[Insert Figure 7: low-fidelity customer wireframe.]**

Caption: *Low-fidelity customer flow showing event discovery, event details, checkout and confirmation. It establishes the primary booking path before colour, spacing and final components are applied.*

**[Insert Figure 8: low-fidelity administrator wireframe.]**

Caption: *Low-fidelity administrator flow showing the dashboard, a published-event management action and the create/edit event form with input validation expectations.*

### 3.2 High-fidelity design principles

The implemented high-fidelity interface uses a consistent blue/white EventBook visual system, rounded cards, clear type hierarchy, responsive grids and visual feedback. Primary booking actions are prominent; secondary controls use a lighter button style. Colour is not the sole source of meaning: availability also uses text and progress indicators, while booking status uses labels.

Reusable components include navigation, event cards, date boxes, badges, availability bars, filter controls, metric cards, form fields, inline errors, toast messages, confirmation receipts and responsive tables.

### 3.3 High-fidelity screenshots and states

Build matching Figma screens, connect the prototype links below, and insert real browser screenshots from the updated application.

| Figure | Screen/evidence | Caption to use or adapt |
|---|---|---|
| 9 | Home / event discovery | *High-fidelity EventBook home screen showing event search, availability filtering, sorting, event metadata, availability bars and saved-event controls.* |
| 10 | Event detail and saved state | *High-fidelity event-detail screen showing venue, ticket type, remaining capacity, primary Buy Tickets action and customer save/copy-link controls.* |
| 11 | Simulated checkout | *High-fidelity checkout showing quantity-dependent total, available-ticket guidance and a clear statement that payment details are not retained.* |
| 12 | Booking confirmation / My Bookings | *High-fidelity confirmation and booking-management evidence showing the booking reference, calculated total, status and safe cancellation action.* |
| 13 | Admin dashboard / event form | *High-fidelity administrator evidence showing published-event, booking and revenue metrics plus an existing-event management action.* |

### 3.4 Interactive Figma prototype flow

Connect the following Figma path before submitting the view-only link:

```text
Home → Event details → Customer login → Checkout → Booking confirmation → My bookings
Home → Customer login → Save event → Saved events
Home → Administrator login → Manage events → Edit event → Save changes
```

The Figma prototype is a design artefact; the live local application is the functional prototype. Both should use the same labels, screen order, visual hierarchy and error-state intent.

The submitted prototype must demonstrate normal, empty, validation/error and success states. Capture at least: an empty saved-events state, invalid login or invalid ticket quantity, over-capacity feedback, and the booking-confirmation success state. Add the final **view-only Figma URL** to the cover page and verify it opens in an incognito browser window before submission.

---

## 4. Git version-control practice (8 marks)

### 4.1 Repository identity and meaningful history

The repository URL is `https://github.com/likhitrajdundigal/event-ticket-booking-system`. Before submission, ensure the GitHub profile visibly identifies the student by their real full name and the repository README states setup, architecture, known limitations and the current deployment URL.

| Evidence | What to show in the report / demonstration |
|---|---|
| Jira-linked commits | `SCRUM-9` / `SCRUM-20` and `EVENT-20` commits show the chronological link from backlog work to implementation, refinement and diagram evidence. |
| Feature branches and pull request | Insert a screenshot of the completed feature branch and PR. Include a self-review comment that identified one change, for example improving validation text or correcting a diagram connection. Do not claim this evidence unless the PR actually exists. |
| Test automation | GitHub Actions runs `npm test` on pushes and pull requests to `main`; insert the successful workflow result. |
| Submitted release | Tag the final submission commit as a new release tag (for example `v1.1.0`) only after all final files are committed. Do not rewrite history or manufacture chronology afterwards. |

### 4.2 Required repository evidence

Use Figure 17 to show the repository name, useful README, release tag and chronological commits. Use Figure 18 to show the successful GitHub Actions run. Record the exact final commit hash and release tag in the report only after the final push.

---

## 5. Sample application and EC2 deployment (8 marks)

### 5.1 Complete implemented workflow

The client code is organised into small named functions for API calls, state persistence, formatting, filtering, navigation, customer views, booking actions and administrator views. Server code is separated into helpers for JSON responses, request-body parsing, authentication, role checks, event validation, filtering/sorting, booking creation and static-file delivery. This makes the prototype easier to explain, test and maintain than a single long request handler or UI renderer.

Notable implementation details include:

- `GET /api/events` supports keyword/venue filtering and date, price or availability sorting; `GET /api/events/:id` and `GET /api/health` are available for direct checks.
- `POST /api/bookings` verifies customer role, positive whole quantity and remaining capacity on the server before persisting a confirmed booking.
- `POST /api/bookings/:id/cancel` checks that the customer owns the booking (or is an administrator), changes status to `Cancelled`, and returns tickets to capacity.
- `POST /api/events` and `PUT /api/events/:id` are protected administrator operations. The update operation prevents capacity from dropping below bookings already recorded.
- Payment inputs are only browser form fields. The client sends only event ID and quantity to the booking endpoint; it never sends or stores the card number, expiry or CVV.
- Local favourites are intentionally stored in browser `localStorage`, separate from shared server booking data.

### 5.2 Automated test results

Run the following before taking the terminal screenshot:

```bash
cd "/Users/likhitraj/Documents/ChatGPT/IFN636 2"
npm test
```

The current Node test suite contains four passing tests:

| Test | What it verifies |
|---|---|
| Valid event | Complete event input is accepted. |
| Invalid event | Zero capacity and missing title are rejected. |
| Search/filter helper | A keyword query returns the expected event and remaining-ticket calculation is correct. |
| Booking helper | A permitted booking increments capacity and calculates a total; an over-capacity request is rejected. |

### 5.3 Manual test matrix

The detailed manual test cases are in `docs/test-plan.md`. Record Pass/Fail and attach screenshots for these representative cases: customer login, invalid login, home metadata/availability, search/filter, checkout quantity total, successful booking, over-capacity error, cancellation restoring capacity, administrator create/edit validation, booking management, and server restart persistence.

### 5.4 EC2 deployment, configuration and security evidence

The application was cloned to Ubuntu EC2 instance `i-065c5e4c95dbba221`, started under PM2 as `eventbook`, and reverse-proxied through Nginx. Evidence obtained on the instance showed:

- `pm2 status` listed `eventbook` as **online**.
- `pm2 save` and `pm2 startup systemd -u ubuntu --hp /home/ubuntu` configured process restoration after reboot.
- `nginx -t` completed successfully and `systemctl status nginx` showed **active (running)**.
- `curl http://127.0.0.1:3000` and `curl http://localhost` returned the EventBook HTML with GET requests.
- `ss -ltnp | grep ':80'` showed Nginx listening on port 80.
- The EC2 security group was updated with TCP 80 and TCP 3000 inbound rules. Instance firewall checks showed UFW inactive and INPUT policy ACCEPT.

### 5.5 Working public URL — mandatory marking-window evidence

External requests to `http://3.106.245.243` and port 3000 timed out even after the security-group/NACL/host checks. During a timed `tcpdump` while an external curl request was made, no incoming TCP port-80 packets reached the instance. This is evidence that the barrier is upstream of Nginx and the Node application, most likely within the managed teaching VPC/account network path.

The assessment requires a working public URL during the marking window. The local PM2/Nginx/API checks are useful supporting evidence, but they do **not** replace a public URL. Resolve this managed-network issue before demonstration, then replace this paragraph with the final URL and a successful external browser/curl screenshot. Do not claim the URL worked until it is retested successfully.

---

## 6. GenAI disclosure and report (8 marks)

### 6.1 GenAI disclosure

Generative AI was used as a drafting and development aid for initial requirements wording, diagram structure, test ideas, code refactoring and UI copy. The student reviewed the output, implemented and tested the final prototype, verified the Jira entries, and remains responsible for the submission. No GenAI output was accepted without checking it against the functional requirements and test results.

### 6.2 Individual reflection: challenge, response, evidence and improvement

**Challenge.** Preserving ticket capacity was the most important technical challenge. Client-only quantity checks are insufficient because a request can be manually changed.

**Response.** The final design validates customer role, whole positive quantity and remaining capacity in the server booking function before persistence.

**Evidence.** The booking sequence diagram, server source code, automated booking test and over-capacity validation screenshot together demonstrate the decision and its result.

**Future improvement.** The EC2 activity also highlighted the difference between application health and external network reachability. PM2, Nginx and local curl evidence showed the service was healthy on the instance, while packet capture indicated external port-80 traffic did not reach it. The next improvement is to resolve the network configuration, introduce HTTPS and secure cookies, replace demo credentials with hashed accounts, use a transactional database, and add concurrency tests around booking capacity.

### 6.3 References (APA 7th)

Add every external source actually used in the final report in APA 7th format. Do not cite sources that were not consulted. At minimum, verify the final references with the QUT referencing guidance and include the sources used for any external technical claims.

---

## Appendix A — Screenshot evidence checklist

Take screenshots at a readable scale and name the files sequentially, for example `Figure-14-Jira-Summary.png`. Insert them after the relevant section or in an appendix with the caption shown below.

| Figure | Screenshot | What it must prove |
|---|---|---|
| 14 | Jira Summary | The `EVENT` project contains 20 total items and 16 completed delivery work items; the four epics show their progress. |
| 15 | Jira Board | `EVENT Sprint 1` has six completed stories in the Done column with their epic parent labels. |
| 16 | Jira Backlog | Four epics and the ten detailed implementation/quality/deployment/documentation tasks are present and linked to the correct epic. |
| 17 | GitHub repository/history | Repository name, readable project files, release tag and real commit history are visible. |
| 18 | GitHub Actions | CI workflow runs `npm test` successfully on `main`. |
| 19 | Home / search / availability | Search, sort/filter controls, event metadata, ticket availability and responsive card design are visible. |
| 20 | Customer booking flow | Event detail → checkout → confirmation shows the customer-facing journey and non-persistent payment statement. |
| 21 | Booking validation/cancellation | Invalid quantity or over-capacity response, or cancellation returning capacity, is shown with a clear message. |
| 22 | Saved events / booking insights | Local favourite state or My Bookings metrics demonstrate an added usability feature. |
| 23 | Administrator management | Dashboard metrics plus create/edit form and a successful update demonstrate R-05. |
| 24 | Automated tests | Terminal output shows all four `npm test` tests passing. |
| 25 | EC2 instance/security group | Running instance and necessary inbound-rule evidence are visible without keys or sensitive information. |
| 26 | EC2 PM2/Nginx/local checks | `pm2 status`, Nginx active and local GET/API response show application health. |
| 27 | EC2 public result or limitation | A successful external response, or the concise managed-network timeout evidence and explanation. |

## Appendix B — Final submission checklist

- [ ] Replace cover-page placeholders and add Figma/Draw.io links.
- [ ] Insert Figma low-fidelity wireframes for Figures 7–8, real high-fidelity screenshots for Figures 9–13, and evidence screenshots for Figures 14–27; keep the already embedded engineering diagram Figures 1–6 with their captions.
- [ ] Commit and push the final website/report update; replace the pending final Git hash with the actual hash.
- [ ] Confirm GitHub Actions is green after the final push.
- [ ] Keep the `EVENT Sprint 1` board active until Jira screenshots are captured.
- [ ] Remove any screenshots containing demo passwords, PEM keys, private IPs, unrelated tabs or personal information.
- [ ] Retest the EC2 public URL only if the managed VPC/network settings change; otherwise retain the honest limitation evidence.
