const DEMO_ACCOUNTS = {
  admin: { email: 'admin@example.com', password: 'Admin123!' },
  customer: { email: 'customer@example.com', password: 'Customer123!' },
};

const state = {
  user: readStoredJson('eventbookUser'),
  token: localStorage.getItem('eventbookToken'),
  events: [],
  favourites: new Set(readStoredJson('eventbookFavourites', [])),
  filters: {
    query: '',
    availability: 'all',
    sort: 'date',
  },
};

function readStoredJson(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveSession(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem('eventbookUser', JSON.stringify(user));
  localStorage.setItem('eventbookToken', token);
}

function saveFavourites() {
  localStorage.setItem('eventbookFavourites', JSON.stringify([...state.favourites]));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...options.headers,
    },
  });

  const responseText = await response.text();
  const data = responseText ? JSON.parse(responseText) : {};

  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

const el = (selector) => document.querySelector(selector);
const money = (amount) => `$${Number(amount).toFixed(2)}`;
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}[character]));

function getEvent(id) {
  return state.events.find((event) => event.id === id);
}

function getRemainingTickets(event) {
  return Math.max(0, Number(event.capacity) - Number(event.booked));
}

function getAvailabilityPercent(event) {
  if (!event.capacity) return 0;
  return Math.round((getRemainingTickets(event) / event.capacity) * 100);
}

function formatDate(date, time) {
  const eventDate = new Date(`${date}T${time || '00:00'}`);
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(time ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(eventDate);
}

function dateParts(date) {
  const eventDate = new Date(`${date}T00:00`);
  return {
    day: new Intl.DateTimeFormat('en-AU', { day: '2-digit' }).format(eventDate),
    month: new Intl.DateTimeFormat('en-AU', { month: 'short' }).format(eventDate),
  };
}

function eventCategory(event) {
  const description = `${event.title} ${event.description}`.toLowerCase();
  if (description.includes('jazz') || description.includes('music')) return 'Music';
  if (description.includes('tech') || description.includes('network')) return 'Networking';
  if (description.includes('food')) return 'Food & drink';
  return 'Local experience';
}

function showToast(message, variant = 'success') {
  const region = el('#toast-region');
  if (!region) return;

  const toast = document.createElement('div');
  toast.className = `toast ${variant}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  region.append(toast);

  window.setTimeout(() => toast.remove(), 3800);
}

function renderNavigation() {
  const navigation = el('#nav');
  if (!state.user) {
    navigation.innerHTML = '<button onclick="loginView()">Log in</button>';
    return;
  }

  const dashboardAction = state.user.role === 'admin' ? 'adminDashboard()' : 'bookingsView()';
  const dashboardLabel = state.user.role === 'admin' ? 'Manage events' : 'My bookings';
  const favouritesButton = state.user.role === 'customer'
    ? `<button class="secondary nav-favourite" onclick="favouritesView()">Saved <span>${state.favourites.size}</span></button>`
    : '';

  navigation.innerHTML = `
    <span class="user-chip">${escapeHtml(state.user.name)} <small>${escapeHtml(state.user.role)}</small></span>
    ${favouritesButton}
    <button class="secondary" onclick="${dashboardAction}">${dashboardLabel}</button>
    <button class="secondary" onclick="logout()">Log out</button>
  `;
}

function renderPage(markup) {
  renderNavigation();
  el('#app').innerHTML = markup;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadEvents() {
  state.events = await api('/api/events');
  return state.events;
}

function getFilteredEvents(events = state.events) {
  const query = state.filters.query.trim().toLowerCase();
  const filtered = events.filter((event) => {
    const matchesQuery = !query || [event.title, event.venue, event.description]
      .join(' ')
      .toLowerCase()
      .includes(query);
    const remaining = getRemainingTickets(event);
    const matchesAvailability = state.filters.availability === 'all' ||
      (state.filters.availability === 'available' && remaining > 0) ||
      (state.filters.availability === 'sold-out' && remaining === 0);

    return matchesQuery && matchesAvailability;
  });

  return [...filtered].sort((first, second) => {
    if (state.filters.sort === 'price-asc') return first.price - second.price;
    if (state.filters.sort === 'price-desc') return second.price - first.price;
    if (state.filters.sort === 'availability') {
      return getRemainingTickets(second) - getRemainingTickets(first);
    }
    return `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`);
  });
}

function eventCard(event) {
  const remaining = getRemainingTickets(event);
  const availabilityPercent = getAvailabilityPercent(event);
  const isFavourite = state.favourites.has(event.id);
  const date = dateParts(event.date);
  const favouriteControl = state.user?.role === 'customer'
    ? `<button class="icon-button ${isFavourite ? 'active' : ''}" aria-label="${isFavourite ? 'Remove' : 'Save'} ${escapeHtml(event.title)}" onclick="toggleFavourite('${event.id}')">${isFavourite ? '♥' : '♡'}</button>`
    : '';

  return `
    <article class="card event-card">
      <div class="card-top">
        <div class="date-box"><strong>${date.day}</strong><span>${date.month}</span></div>
        <div class="card-controls">
          <span class="badge">${escapeHtml(eventCategory(event))}</span>
          ${favouriteControl}
        </div>
      </div>
      <p class="event-time">${escapeHtml(event.time)} · ${escapeHtml(event.venue)}</p>
      <h2>${escapeHtml(event.title)}</h2>
      <p class="description">${escapeHtml(event.description || 'A memorable local experience hosted by EventBook.')}</p>
      <div class="availability-row">
        <span>${remaining ? `${remaining} ticket${remaining === 1 ? '' : 's'} left` : 'Sold out'}</span>
        <span>${availabilityPercent}% available</span>
      </div>
      <div class="progress-track" aria-label="${availabilityPercent}% ticket availability"><span style="width:${availabilityPercent}%"></span></div>
      <div class="card-footer">
        <div><strong>${money(event.price)}</strong><small>per ticket</small></div>
        <button onclick="eventView('${event.id}')">View details</button>
      </div>
    </article>
  `;
}

function renderEventGrid(events = getFilteredEvents()) {
  const grid = el('#event-grid');
  const resultCount = el('#result-count');
  if (!grid || !resultCount) return;

  resultCount.textContent = `${events.length} event${events.length === 1 ? '' : 's'} found`;
  grid.innerHTML = events.length
    ? events.map(eventCard).join('')
    : `<section class="empty-state"><h3>No matching events</h3><p>Try another search term or clear the availability filter.</p><button class="secondary" onclick="clearFilters()">Clear filters</button></section>`;
}

async function home(resetFilters = false) {
  if (resetFilters) {
    state.filters = { query: '', availability: 'all', sort: 'date' };
  }

  try {
    await loadEvents();
    renderPage(`
      <section class="hero">
        <div>
          <p class="eyebrow">EVENTBOOK · BRISBANE</p>
          <h1>Make plans worth remembering.</h1>
          <p>Discover local experiences, reserve your spot, and receive an instant booking confirmation.</p>
          <div class="hero-actions">
            <button class="light" onclick="document.querySelector('#event-explorer').scrollIntoView({ behavior: 'smooth' })">Explore events</button>
            ${state.user?.role === 'customer' ? '<button class="hero-secondary" onclick="favouritesView()">View saved events</button>' : ''}
          </div>
        </div>
        <div class="hero-stats" aria-label="EventBook platform statistics">
          <strong>${state.events.length}</strong><span>upcoming events</span>
          <strong>${state.events.reduce((total, event) => total + getRemainingTickets(event), 0)}</strong><span>tickets available</span>
        </div>
      </section>

      <section id="event-explorer" class="section-head">
        <div>
          <p class="eyebrow">UPCOMING EVENTS</p>
          <h2>Choose your next experience</h2>
        </div>
        <span id="result-count" class="muted"></span>
      </section>

      <section class="filter-bar" aria-label="Event filters">
        <label class="search-field">Search events
          <input value="${escapeHtml(state.filters.query)}" oninput="updateEventFilter('query', this.value)" placeholder="Search by event, venue or keyword">
        </label>
        <label>Availability
          <select onchange="updateEventFilter('availability', this.value)">
            <option value="all" ${state.filters.availability === 'all' ? 'selected' : ''}>All events</option>
            <option value="available" ${state.filters.availability === 'available' ? 'selected' : ''}>Tickets available</option>
            <option value="sold-out" ${state.filters.availability === 'sold-out' ? 'selected' : ''}>Sold out</option>
          </select>
        </label>
        <label>Sort by
          <select onchange="updateEventFilter('sort', this.value)">
            <option value="date" ${state.filters.sort === 'date' ? 'selected' : ''}>Upcoming date</option>
            <option value="price-asc" ${state.filters.sort === 'price-asc' ? 'selected' : ''}>Price: low to high</option>
            <option value="price-desc" ${state.filters.sort === 'price-desc' ? 'selected' : ''}>Price: high to low</option>
            <option value="availability" ${state.filters.sort === 'availability' ? 'selected' : ''}>Most availability</option>
          </select>
        </label>
        <button class="secondary filter-reset" onclick="clearFilters()">Reset</button>
      </section>
      <div id="event-grid" class="grid event-grid"></div>
    `);
    renderEventGrid();
  } catch (error) {
    renderPage(`<section class="panel"><p class="alert error">Could not load events: ${escapeHtml(error.message)}</p></section>`);
  }
}

function updateEventFilter(name, value) {
  state.filters[name] = value;
  renderEventGrid();
}

function clearFilters() {
  state.filters = { query: '', availability: 'all', sort: 'date' };
  home();
}

function toggleFavourite(eventId) {
  if (state.user?.role !== 'customer') {
    loginView();
    showToast('Log in as a customer to save events.', 'info');
    return;
  }

  if (state.favourites.has(eventId)) {
    state.favourites.delete(eventId);
    showToast('Event removed from your saved list.', 'info');
  } else {
    state.favourites.add(eventId);
    showToast('Event saved to your favourites.');
  }

  saveFavourites();
  renderNavigation();
  renderEventGrid();
}

async function favouritesView() {
  try {
    await loadEvents();
    const favourites = state.events.filter((event) => state.favourites.has(event.id));
    renderPage(`
      <section class="section-head favourites-head">
        <div>
          <button class="secondary back-button" onclick="home()">← All events</button>
          <p class="eyebrow">YOUR SHORTLIST</p>
          <h1>Saved events</h1>
          <p class="muted">Keep track of experiences you may want to book later.</p>
        </div>
        <span class="badge">${favourites.length} saved</span>
      </section>
      <div class="grid event-grid">
        ${favourites.length ? favourites.map(eventCard).join('') : '<section class="empty-state"><h3>Your shortlist is empty</h3><p>Use the heart button on an event card to save it here.</p><button onclick="home()">Explore events</button></section>'}
      </div>
    `);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function loginView() {
  renderPage(`
    <section class="panel form login-panel">
      <p class="eyebrow">WELCOME BACK</p>
      <h1>Log in to EventBook</h1>
      <p class="muted">Use a demo account to explore customer booking or administrator event management.</p>
      <div class="demo-account-grid">
        <button type="button" class="demo-account" onclick="fillDemoAccount('customer')"><strong>Customer demo</strong><small>Browse, save and book events</small></button>
        <button type="button" class="demo-account" onclick="fillDemoAccount('admin')"><strong>Admin demo</strong><small>Create and manage events</small></button>
      </div>
      <div id="message"></div>
      <form onsubmit="login(event)">
        <label>Email<input id="login-email" type="email" name="email" autocomplete="email" required></label>
        <label>Password<input id="login-password" type="password" name="password" autocomplete="current-password" required></label>
        <button>Log in</button>
      </form>
      <button class="text-button" onclick="home()">Continue as a guest</button>
    </section>
  `);
}

function fillDemoAccount(role) {
  const account = DEMO_ACCOUNTS[role];
  el('#login-email').value = account.email;
  el('#login-password').value = account.password;
  showToast(`${role === 'admin' ? 'Administrator' : 'Customer'} demo details filled in.`, 'info');
}

async function login(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    const result = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    saveSession(result.user, result.token);
    showToast(`Welcome, ${result.user.name}!`);
    home(true);
  } catch (error) {
    el('#message').innerHTML = `<p class="alert error">${escapeHtml(error.message)}</p>`;
  }
}

async function logout() {
  try {
    if (state.token) await api('/api/logout', { method: 'POST' });
  } catch {
    // Local session cleanup still makes the user safely logged out in this demo.
  }

  localStorage.removeItem('eventbookUser');
  localStorage.removeItem('eventbookToken');
  state.user = null;
  state.token = null;
  showToast('You have been logged out.', 'info');
  home(true);
}

function eventView(eventId) {
  const event = getEvent(eventId);
  if (!event) {
    home();
    return;
  }

  const remaining = getRemainingTickets(event);
  const isFavourite = state.favourites.has(event.id);
  const customerAction = state.user?.role === 'customer'
    ? `<button onclick="checkoutView('${event.id}')" ${remaining < 1 ? 'disabled' : ''}>${remaining ? 'Buy tickets' : 'Sold out'}</button>`
    : '<button onclick="loginView()">Log in to book</button>';
  const adminAction = state.user?.role === 'admin'
    ? `<button onclick="adminEditEvent('${event.id}')">Edit this event</button>`
    : customerAction;

  renderPage(`
    <section class="panel event-detail">
      <button class="secondary back-button" onclick="home()">← All events</button>
      <div class="detail-grid">
        <div>
          <p class="eyebrow">${escapeHtml(eventCategory(event))} · ${escapeHtml(formatDate(event.date, event.time))}</p>
          <h1>${escapeHtml(event.title)}</h1>
          <p class="lead">${escapeHtml(event.description || 'A local experience hosted by EventBook.')}</p>
          <div class="detail-facts">
            <span><b>Location</b>${escapeHtml(event.venue)}</span>
            <span><b>Availability</b>${remaining} of ${event.capacity} tickets remaining</span>
            <span><b>Ticket type</b>General admission</span>
          </div>
          <div class="detail-progress"><span style="width:${getAvailabilityPercent(event)}%"></span></div>
        </div>
        <aside class="checkout-summary">
          <span class="badge">General admission</span>
          <h3>${money(event.price)} <small>per ticket</small></h3>
          ${adminAction}
          <div class="detail-actions">
            ${state.user?.role === 'customer' ? `<button class="secondary" onclick="toggleFavourite('${event.id}')">${isFavourite ? '♥ Saved' : '♡ Save event'}</button>` : ''}
            <button class="secondary" onclick="shareEvent('${event.id}')">Copy link</button>
          </div>
          <p class="muted small">Instant confirmation · Secure demo checkout · No card data is stored</p>
        </aside>
      </div>
    </section>
  `);
}

async function shareEvent(eventId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?event=${encodeURIComponent(eventId)}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast('Event link copied to your clipboard.');
  } catch {
    showToast(`Copy this event link: ${shareUrl}`, 'info');
  }
}

function checkoutView(eventId) {
  const event = getEvent(eventId);
  const remaining = event && getRemainingTickets(event);
  if (!event || !remaining) {
    eventView(eventId);
    return;
  }

  renderPage(`
    <section class="checkout-layout">
      <section class="panel form checkout-form">
        <button class="secondary back-button" onclick="eventView('${eventId}')">← Event details</button>
        <p class="eyebrow">SECURE DEMO CHECKOUT</p>
        <h1>Complete your booking</h1>
        <p class="muted">This simulated payment screen is included for assessment demonstration. Payment details stay in your browser and are never stored.</p>
        <div id="message"></div>
        <form onsubmit="createBooking(event, '${eventId}')">
          <label>Tickets
            <input name="quantity" id="ticket-quantity" type="number" min="1" max="${remaining}" value="1" required oninput="updateCheckoutTotal(${event.price})">
          </label>
          <p class="helper-text">Up to ${remaining} ticket${remaining === 1 ? '' : 's'} are currently available.</p>
          <fieldset class="payment-box">
            <legend>Demo payment details</legend>
            <label>Name on card<input name="cardName" autocomplete="cc-name" required></label>
            <label>Card number<input name="cardNumber" inputmode="numeric" placeholder="4242 4242 4242 4242" pattern="[0-9 ]{12,23}" required></label>
            <div class="two-col">
              <label>Expiry<input name="expiry" placeholder="MM/YY" pattern="(0[1-9]|1[0-2])/[0-9]{2}" required></label>
              <label>CVV<input name="cvv" inputmode="numeric" placeholder="123" pattern="[0-9]{3,4}" required></label>
            </div>
          </fieldset>
          <button>Pay <span id="checkout-total">${money(event.price)}</span> (demo)</button>
        </form>
      </section>
      <aside class="panel order-summary">
        <p class="eyebrow">ORDER SUMMARY</p>
        <h2>${escapeHtml(event.title)}</h2>
        <p class="order-event-details">${escapeHtml(formatDate(event.date, event.time))}<br>${escapeHtml(event.venue)}</p>
        <hr>
        <p><span>Tickets</span><span id="summary-quantity">1 × ${money(event.price)}</span></p>
        <h3><span>Total</span><span id="summary-total">${money(event.price)}</span></h3>
      </aside>
    </section>
  `);
}

function updateCheckoutTotal(price) {
  const quantity = Math.max(1, Number(el('#ticket-quantity').value) || 1);
  el('#checkout-total').textContent = money(quantity * price);
  el('#summary-quantity').textContent = `${quantity} × ${money(price)}`;
  el('#summary-total').textContent = money(quantity * price);
}

async function createBooking(event, eventId) {
  event.preventDefault();
  const quantity = new FormData(event.target).get('quantity');

  try {
    const booking = await api('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ eventId, quantity }),
    });
    await loadEvents();
    renderPage(`
      <section class="panel confirmation">
        <p class="success-icon">✓</p>
        <p class="eyebrow">BOOKING CONFIRMED</p>
        <h1>You’re going to ${escapeHtml(booking.eventTitle)}!</h1>
        <p>Your demo payment was accepted. Keep your booking reference for your records.</p>
        <div class="receipt">
          <span>Booking reference</span><strong>${escapeHtml(booking.id)}</strong>
          <span>${booking.quantity} ticket${booking.quantity === 1 ? '' : 's'}</span><strong>${money(booking.total)}</strong>
        </div>
        <button onclick="bookingsView()">View my bookings</button>
        <button class="secondary" onclick="home()">Browse more events</button>
      </section>
    `);
    showToast('Your booking is confirmed.');
  } catch (error) {
    el('#message').innerHTML = `<p class="alert error">${escapeHtml(error.message)}</p>`;
  }
}

function bookingDate(booking) {
  const event = getEvent(booking.eventId);
  return event ? formatDate(event.date, event.time) : 'Event details unavailable';
}

function bookingRows(bookings) {
  return bookings.map((booking) => `
    <tr>
      <td><strong>${escapeHtml(booking.eventTitle)}</strong><br><small>${escapeHtml(bookingDate(booking))}</small></td>
      ${state.user.role === 'admin' ? `<td>${escapeHtml(booking.customer || booking.email)}</td>` : ''}
      <td>${booking.quantity}</td>
      <td>${money(booking.total)}</td>
      <td><span class="status ${booking.status.toLowerCase()}">${escapeHtml(booking.status)}</span></td>
      <td>${booking.status === 'Confirmed' ? `<button class="danger small-button" onclick="cancelBooking('${booking.id}')">Cancel</button>` : ''}</td>
    </tr>
  `).join('');
}

async function bookingsView() {
  try {
    const [bookings, events] = await Promise.all([api('/api/bookings'), api('/api/events')]);
    state.events = events;
    const sortedBookings = [...bookings].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
    const confirmedBookings = sortedBookings.filter((booking) => booking.status === 'Confirmed');
    const metrics = state.user.role === 'admin'
      ? [
        ['Confirmed bookings', confirmedBookings.length],
        ['Tickets issued', confirmedBookings.reduce((total, booking) => total + booking.quantity, 0)],
        ['Revenue', money(confirmedBookings.reduce((total, booking) => total + booking.total, 0))],
      ]
      : [
        ['Upcoming bookings', confirmedBookings.length],
        ['Tickets held', confirmedBookings.reduce((total, booking) => total + booking.quantity, 0)],
        ['Current spend', money(confirmedBookings.reduce((total, booking) => total + booking.total, 0))],
      ];
    const customerColumn = state.user.role === 'admin' ? '<th>Customer</th>' : '';
    const emptyColumnCount = state.user.role === 'admin' ? 6 : 5;

    renderPage(`
      <section class="section-head bookings-heading">
        <div>
          <button class="secondary back-button" onclick="home()">← Events</button>
          <p class="eyebrow">${state.user.role === 'admin' ? 'ADMINISTRATION' : 'YOUR ACCOUNT'}</p>
          <h1>${state.user.role === 'admin' ? 'All bookings' : 'My bookings'}</h1>
        </div>
        ${state.user.role === 'admin' ? '<button onclick="adminDashboard()">Manage events</button>' : '<button onclick="home()">Find another event</button>'}
      </section>
      <section class="metric-grid">${metrics.map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join('')}</section>
      <section class="panel table-panel">
        <div class="table-scroll">
          <table>
            <thead><tr><th>Event</th>${customerColumn}<th>Tickets</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>${sortedBookings.length ? bookingRows(sortedBookings) : `<tr><td colspan="${emptyColumnCount}">No bookings yet. Browse the events to make your first reservation.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    `);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function cancelBooking(bookingId) {
  if (!window.confirm('Cancel this booking? The tickets will be returned to the event inventory.')) return;

  try {
    await api(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
    showToast('Booking cancelled and tickets returned to availability.', 'info');
    bookingsView();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function adminDashboard() {
  try {
    const [events, bookings] = await Promise.all([api('/api/events'), api('/api/bookings')]);
    state.events = events;
    const confirmedBookings = bookings.filter((booking) => booking.status === 'Confirmed');
    const revenue = confirmedBookings.reduce((total, booking) => total + booking.total, 0);

    renderPage(`
      <section class="section-head admin-heading">
        <div>
          <p class="eyebrow">ADMINISTRATION</p>
          <h1>Manage events</h1>
          <p class="muted">Review availability, update event details, and monitor bookings.</p>
        </div>
        <div class="admin-actions"><button class="secondary" onclick="bookingsView()">View bookings</button><button onclick="adminCreateEvent()">+ Create event</button></div>
      </section>
      <section class="metric-grid admin-metrics">
        <article><strong>${events.length}</strong><span>published events</span></article>
        <article><strong>${confirmedBookings.length}</strong><span>confirmed bookings</span></article>
        <article><strong>${money(revenue)}</strong><span>booking revenue</span></article>
      </section>
      <div class="grid admin-grid">
        ${events.map((event) => {
          const bookedPercent = event.capacity ? Math.round((event.booked / event.capacity) * 100) : 0;
          return `
            <article class="card admin-event-card">
              <div class="card-top"><span class="badge">${escapeHtml(eventCategory(event))}</span><span class="muted">${escapeHtml(formatDate(event.date, event.time))}</span></div>
              <h2>${escapeHtml(event.title)}</h2>
              <p class="muted">${escapeHtml(event.venue)}</p>
              <div class="availability-row"><span>${event.booked} booked</span><span>${getRemainingTickets(event)} remaining</span></div>
              <div class="progress-track booked"><span style="width:${bookedPercent}%"></span></div>
              <div class="card-footer"><span>${money(event.price)} per ticket</span><button onclick="adminEditEvent('${event.id}')">Manage event</button></div>
            </article>
          `;
        }).join('')}
      </div>
    `);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function adminCreateEvent() {
  eventForm('Create event', {}, 'createEvent(event)', 'Publish event');
}

function adminEditEvent(eventId) {
  const event = getEvent(eventId);
  if (event) eventForm('Edit event', event, `updateEvent(event, '${eventId}')`, 'Save changes');
}

function eventForm(title, event, submitAction, submitLabel) {
  const description = event.description || '';
  renderPage(`
    <section class="panel form event-form">
      <button class="secondary back-button" onclick="adminDashboard()">← Manage events</button>
      <p class="eyebrow">ADMINISTRATION</p>
      <h1>${title}</h1>
      <p class="muted">Required fields are marked by your browser. Capacity cannot be reduced below tickets already booked.</p>
      <div id="message"></div>
      <form onsubmit="${submitAction}">
        <label>Event title<input name="title" value="${escapeHtml(event.title)}" maxlength="80" required></label>
        <div class="two-col">
          <label>Date<input name="date" type="date" value="${escapeHtml(event.date)}" required></label>
          <label>Time<input name="time" type="time" value="${escapeHtml(event.time)}" required></label>
        </div>
        <label>Venue<input name="venue" value="${escapeHtml(event.venue)}" maxlength="100" required></label>
        <div class="two-col">
          <label>Ticket price<input name="price" type="number" min="0" step="0.01" value="${event.price ?? ''}" required></label>
          <label>Capacity<input name="capacity" type="number" min="1" step="1" value="${event.capacity ?? ''}" required></label>
        </div>
        <label>Description<textarea name="description" maxlength="500" oninput="updateDescriptionCount(this)">${escapeHtml(description)}</textarea></label>
        <p id="description-count" class="character-count">${description.length}/500 characters</p>
        <button>${submitLabel}</button>
      </form>
    </section>
  `);
}

function updateDescriptionCount(textarea) {
  el('#description-count').textContent = `${textarea.value.length}/500 characters`;
}

async function createEvent(event) {
  event.preventDefault();
  const eventData = Object.fromEntries(new FormData(event.target));

  try {
    const createdEvent = await api('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    state.events.push(createdEvent);
    showToast(`${createdEvent.title} has been published.`);
    window.setTimeout(adminDashboard, 600);
  } catch (error) {
    el('#message').innerHTML = `<p class="alert error">${escapeHtml(error.message)}</p>`;
  }
}

async function updateEvent(event, eventId) {
  event.preventDefault();
  const eventData = Object.fromEntries(new FormData(event.target));

  try {
    const updatedEvent = await api(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    state.events = state.events.map((item) => item.id === eventId ? updatedEvent : item);
    showToast(`${updatedEvent.title} has been updated.`);
    window.setTimeout(adminDashboard, 600);
  } catch (error) {
    el('#message').innerHTML = `<p class="alert error">${escapeHtml(error.message)}</p>`;
  }
}

async function boot() {
  await home(true);
  const eventId = new URLSearchParams(window.location.search).get('event');
  if (eventId && getEvent(eventId)) eventView(eventId);
}

document.addEventListener('DOMContentLoaded', boot);
