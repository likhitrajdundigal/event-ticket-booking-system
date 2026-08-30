const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createBooking,
  filterAndSortEvents,
  getRemainingTickets,
  validEvent,
} = require('../server');

test('accepts a complete valid event', () => {
  assert.equal(validEvent({title:'Test event', date:'2026-09-01', time:'18:00', venue:'QUT', price:0, capacity:1}), true);
});

test('rejects a non-positive capacity and incomplete data', () => {
  assert.equal(validEvent({title:'Test', date:'2026-09-01', time:'18:00', venue:'QUT', price:5, capacity:0}), false);
  assert.equal(validEvent({title:'', date:'2026-09-01', time:'18:00', venue:'QUT', price:5, capacity:5}), false);
});

test('filters events by a search query and sorts by price', () => {
  const events = [
    { id: 'evt-1', title: 'Brisbane Jazz', description: 'Live local music', venue: 'Riverside Park', date: '2026-09-18', time: '18:30', price: 35, capacity: 80, booked: 22 },
    { id: 'evt-2', title: 'Tech Futures', description: 'Student networking', venue: 'QUT Gardens Point', date: '2026-10-03', time: '17:45', price: 15, capacity: 50, booked: 21 },
  ];

  const matchingEvents = filterAndSortEvents(events, new URLSearchParams('q=tech&sort=price-asc'));
  assert.deepEqual(matchingEvents.map((event) => event.id), ['evt-2']);
  assert.equal(getRemainingTickets(events[0]), 58);
});

test('creates a booking only when enough tickets remain', () => {
  const database = {
    events: [{ id: 'evt-1', title: 'Test event', price: 20, capacity: 3, booked: 1 }],
    bookings: [],
  };
  const user = { email: 'customer@example.com', name: 'Alex Customer' };

  const success = createBooking(database, user, 'evt-1', 2);
  assert.equal(success.statusCode, 201);
  assert.equal(database.events[0].booked, 3);
  assert.equal(database.bookings[0].total, 40);

  const failure = createBooking(database, user, 'evt-1', 1);
  assert.equal(failure.statusCode, 400);
  assert.match(failure.error, /Only 0 ticket/);
});
