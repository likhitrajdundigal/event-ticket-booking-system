# EventBook low-fidelity wireframes

These wireframes define layout and navigation only. Recreate them as grey-scale frames in Figma or Draw.io before adding final colour, typography and imagery. Keep the screen names consistent with the report.

## Customer discovery and booking path

```text
+----------------------------- EventBook -----------------------------+
| Logo                                      [Log in]                   |
+-----------------------------------------------------------------------+
| FIND YOUR NEXT EXPERIENCE                                             |
| [ Search event or venue                                      ]        |
| [All events v] [Sort: upcoming v]                         [Reset]     |
+-----------------------------------------------------------------------+
| [18 SEP]  Music                    [03 OCT]  Networking              |
| Brisbane Jazz Under the Stars       Tech Futures Meetup               |
| 18:30 · Riverside Park              17:45 · QUT Gardens Point        |
| 58 tickets left [---------]         29 tickets left [------]         |
| $35.00                     [View]  $15.00                    [View]   |
+-----------------------------------------------------------------------+
```

```text
+--------------------------- Event details ----------------------------+
| [< All events]                                                       |
| MUSIC · Fri 18 Sep, 6:30 pm                                           |
| Brisbane Jazz Under the Stars                                         |
| Short event description and key information.                          |
| [Location]     [Availability]        [Ticket type]                    |
| Riverside Park  58/80 remaining      General admission                |
| [---------------- availability bar ----------------]                 |
|                         $35.00 per ticket                             |
|                         [Buy tickets]                                 |
|                         [Save event] [Copy link]                      |
+-----------------------------------------------------------------------+
```

```text
+-------------------------- Demo checkout -----------------------------+
| [< Event details]                                                    |
| Complete your booking                                                 |
| Tickets [ 2 v ]   Up to 58 tickets available                          |
|                                                                       |
| Demo payment details                                                  |
| Name on card    [                                      ]              |
| Card number     [                                      ]              |
| Expiry [      ]  CVV [     ]                                          |
| [Pay $70.00 (demo)]                                                   |
|                                                                       |
| ORDER SUMMARY                                                         |
| Brisbane Jazz Under the Stars                                         |
| Tickets                    2 × $35.00                                |
| Total                           $70.00                                |
+-----------------------------------------------------------------------+
                 ↓
+---------------------- Booking confirmation -------------------------+
| ✓  BOOKING CONFIRMED                                                  |
| You’re going to Brisbane Jazz Under the Stars!                        |
| Booking reference          BK-123                                     |
| 2 tickets                  $70.00                                     |
| [View my bookings]   [Browse more events]                             |
+-----------------------------------------------------------------------+
```

## Customer booking management

```text
+--------------------------- My bookings ------------------------------+
| [< Events]                                     [Find another event]  |
| Upcoming bookings [ 1 ]  Tickets held [ 2 ]  Current spend [ $70 ]    |
|                                                                       |
| Event                 Tickets  Total   Status       Action            |
| Brisbane Jazz...      2        $70     Confirmed    [Cancel]          |
|                                                                       |
| Confirmation prompt: “Cancel this booking? Tickets will return...”    |
+-----------------------------------------------------------------------+
```

## Administrator event-management path

```text
+--------------------------- Manage events ----------------------------+
| ADMINISTRATION                               [View bookings] [+ Create]|
| Published events [2]  Confirmed bookings [1]  Revenue [$70]          |
|                                                                       |
| Brisbane Jazz Under the Stars                                        |
| Riverside Park · Fri 18 Sep, 6:30 pm                                  |
| 22 booked ---------------------------------------- 58 remaining       |
| $35 per ticket                                      [Manage event]    |
+-----------------------------------------------------------------------+
                 ↓
+-------------------------- Edit event --------------------------------+
| [< Manage events]                                                     |
| Event title [ Brisbane Jazz Under the Stars                         ] |
| Date [ 18/09/2026 ]       Time [ 18:30 ]                              |
| Venue [ Riverside Park                                           ]    |
| Price [ 35.00 ]           Capacity [ 80 ]                             |
| Description [                                                    ]    |
| 41/500 characters                                                     |
| [Save changes]                                                        |
+-----------------------------------------------------------------------+
```

## Figma frame checklist

Create at least these frames: Home/Event discovery, Event detail, Login, Checkout, Booking confirmation, My Bookings, Saved events, Admin Manage Events, and Create/Edit Event. Connect the customer and admin flows described in `assessment-report-content.md`.
