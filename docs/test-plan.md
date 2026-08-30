# EventBook test plan and evidence record

Run the automated suite before manual tests:

```bash
npm test
```

| ID | Requirement / feature | Test data or action | Expected result | Status | Evidence to attach |
|---|---|---|---|---|---|
| TC-01 | R-01 customer login | Use `customer@example.com` and `Customer123!` | Customer navigation, Saved and My Bookings controls display. | Pass | Customer home screenshot |
| TC-02 | R-01 administrator login | Use `admin@example.com` and `Admin123!` | Manage events control and administrator dashboard display. | Pass | Admin dashboard screenshot |
| TC-03 | R-01 invalid login | Use a valid email with incorrect password | Inline `Invalid email or password` message displays. | [record] | Error-state screenshot |
| TC-04 | R-02 event information | Open the home page and Event Details | Title, formatted date/time, venue, price, remaining tickets and availability indicator display. | Pass | Home/detail screenshot |
| TC-05 | Usability search/sort | Search for `tech`; change sort to price low-to-high | Tech Futures is returned; sorting and result count update without a page reload. | Pass | Filter screenshot |
| TC-06 | Usability favourites | Log in as customer and select a heart/save control | Saved count updates; Saved Events view retains the local favourite. | Pass | Saved-event screenshot |
| TC-07 | R-03 booking quantity/total | Choose quantity 2 at checkout | Order summary and Pay button show two tickets and twice the ticket price. | [record] | Checkout screenshot |
| TC-08 | R-03 successful booking | Submit a valid available quantity using the demo checkout | API returns 201; confirmation shows booking reference, quantity and total; capacity decreases. | [record] | Confirmation screenshot |
| TC-09 | R-03 input validation | Submit quantity 0, a decimal, or non-number request value | Booking is rejected with clear validation feedback. | Pass (automated helper) | Test output / browser error |
| TC-10 | R-04 capacity validation | Submit a quantity greater than remaining tickets | Booking is rejected; no booking is added and `booked` is unchanged. | Pass (automated helper) | Test output / browser error |
| TC-11 | R-05 create event | Administrator submits a complete valid event form | Event is persisted and appears in Manage Events and the event list. | [record] | Create-event screenshot |
| TC-12 | R-05 edit event | Administrator opens Manage Event, changes valid detail and saves | Existing event form opens; new values persist and dashboard refreshes. | [record] | Edit-event screenshot |
| TC-13 | R-05 invalid event | Administrator submits capacity 0 or a negative price | Server rejects the request with an understandable error. | Pass (validation helper) | Browser error / test output |
| TC-14 | R-07 cancellation | Customer cancels an eligible confirmed booking and accepts the browser confirmation | Booking becomes Cancelled and its ticket quantity returns to event capacity. | [record] | Before/after booking screenshot |
| TC-15 | Authorisation | Customer tries an administrator API route, or administrator access is tested in the UI | Server returns unauthorised response or the UI does not expose the action. | [record] | API/UI evidence |
| TC-16 | R-06 persistence | Create a booking or event, restart Node process, reload | Matching data remains in `data.json` and UI/API. | [record] | Terminal/API screenshot |
| TC-17 | Health endpoint | Run `curl http://localhost:3000/api/health` | 200 JSON response contains `status: ok` and service name. | Pass | Terminal screenshot |

## Automated coverage summary

The Node test suite currently verifies four focused behaviours:

1. a complete event passes validation;
2. incomplete/non-positive-capacity events fail validation;
3. event filtering returns the expected event and calculates remaining tickets correctly; and
4. a permitted booking increments capacity/calculates total while an over-capacity booking is rejected.

Manual test cases are retained because visual hierarchy, navigation, browser local storage, responsive layout and realistic workflow feedback require browser evidence in addition to unit-level tests.
