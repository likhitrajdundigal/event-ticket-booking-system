const test = require('node:test');
const assert = require('node:assert/strict');
const { validEvent } = require('../server');

test('accepts a complete valid event', () => {
  assert.equal(validEvent({title:'Test event', date:'2026-09-01', time:'18:00', venue:'QUT', price:0, capacity:1}), true);
});

test('rejects a non-positive capacity and incomplete data', () => {
  assert.equal(validEvent({title:'Test', date:'2026-09-01', time:'18:00', venue:'QUT', price:5, capacity:0}), false);
  assert.equal(validEvent({title:'', date:'2026-09-01', time:'18:00', venue:'QUT', price:5, capacity:5}), false);
});
