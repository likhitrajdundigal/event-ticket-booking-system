# EventBook test plan

| ID | Requirement | Test data/action | Expected result | Evidence |
|---|---|---|---|---|
| TC-01 | R-01 | Log in with customer demo account | Customer navigation and booking button display | Screenshot |
| TC-02 | R-01 | Log in with wrong password | "Invalid email or password" feedback displays | Screenshot |
| TC-03 | R-02 | Open home page | Event title, date/time, venue, price, and remaining tickets display | Screenshot |
| TC-04 | R-03 | Customer books quantity 2 for an available event | 201 confirmation, total is calculated and booking is persisted | API/browser screenshot |
| TC-05 | R-03 | Submit quantity 0 or a decimal | Booking is rejected with validation feedback | Screenshot |
| TC-06 | R-04 | Submit a quantity greater than remaining tickets | Booking is rejected and event booked total is unchanged | Screenshot |
| TC-07 | R-05 | Admin creates an event with valid fields | Event is saved and success feedback displays | Screenshot |
| TC-08 | R-05 | Admin submits capacity 0 | Event is rejected with validation feedback | Screenshot |
| TC-09 | R-06 | Create booking, restart app, view booking | Existing booking remains in `data.json` | Terminal/browser screenshot |
| TC-10 | US-05 | Cancel confirmed booking | Status becomes Cancelled and capacity is restored | Screenshot |

Automated tests are run with `npm test`. The included Node test suite verifies valid and invalid event validation. Manual tests cover role access, booking behaviour, persistence and UI feedback. Add a screenshot or pass/fail result beside each case when preparing the final PDF.
