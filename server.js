const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const DATABASE_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIRECTORY = path.join(__dirname, 'public');
const MAX_REQUEST_BODY_BYTES = 1_000_000;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// Demo-only accounts. A production system would use hashed passwords and a database.
const DEMO_USERS = [
  {
    email: 'customer@example.com',
    password: 'Customer123!',
    role: 'customer',
    name: 'Alex Customer',
  },
  {
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
    name: 'Jordan Admin',
  },
];

const sessions = new Map();

function readDatabase() {
  return JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf8'));
}

function writeDatabase(database) {
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(database, null, 2));
}

function sendJson(request, response, statusCode, payload) {
  const body = JSON.stringify(payload);

  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });

  response.end(request.method === 'HEAD' ? undefined : body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = '';

    request.on('data', (chunk) => {
      rawBody += chunk;
      if (rawBody.length > MAX_REQUEST_BODY_BYTES) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });

    request.on('end', () => {
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(new Error('Request body must contain valid JSON.'));
      }
    });

    request.on('error', reject);
  });
}

function getAuthenticatedUser(request) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  return sessions.get(token);
}

function requireRole(request, response, requiredRole) {
  const user = getAuthenticatedUser(request);
  const hasRequiredRole = !requiredRole || user?.role === requiredRole;

  if (!user || !hasRequiredRole) {
    sendJson(request, response, 401, {
      error: 'You are not authorised for this action.',
    });
    return null;
  }

  return user;
}

function getRemainingTickets(event) {
  return Math.max(0, Number(event.capacity) - Number(event.booked));
}

function validEvent(event) {
  return Boolean(
    event.title?.trim() &&
      /^\d{4}-\d{2}-\d{2}$/.test(event.date) &&
      /^\d{2}:\d{2}$/.test(event.time) &&
      event.venue?.trim() &&
      Number.isFinite(Number(event.price)) &&
      Number(event.price) >= 0 &&
      Number.isInteger(Number(event.capacity)) &&
      Number(event.capacity) > 0,
  );
}

function eventFromRequest(body, id, booked = 0) {
  return {
    id,
    title: body.title.trim(),
    date: body.date,
    time: body.time,
    venue: body.venue.trim(),
    price: Number(body.price),
    capacity: Number(body.capacity),
    booked,
    description: (body.description || '').trim(),
  };
}

function filterAndSortEvents(events, searchParams) {
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const venue = (searchParams.get('venue') || '').trim().toLowerCase();
  const sort = searchParams.get('sort') || 'date';

  const filteredEvents = events.filter((event) => {
    const searchableText = [event.title, event.description, event.venue]
      .join(' ')
      .toLowerCase();

    return (!query || searchableText.includes(query)) &&
      (!venue || event.venue.toLowerCase().includes(venue));
  });

  return filteredEvents.sort((first, second) => {
    if (sort === 'price-asc') return first.price - second.price;
    if (sort === 'price-desc') return second.price - first.price;
    if (sort === 'availability') {
      return getRemainingTickets(second) - getRemainingTickets(first);
    }

    return `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`);
  });
}

function createBooking(database, user, eventId, quantity) {
  const event = database.events.find((item) => item.id === eventId);

  if (!event) return { error: 'Event was not found.', statusCode: 404 };
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: 'Choose at least one whole ticket.', statusCode: 400 };
  }

  const remainingTickets = getRemainingTickets(event);
  if (quantity > remainingTickets) {
    return {
      error: `Only ${remainingTickets} ticket(s) remain.`,
      statusCode: 400,
    };
  }

  event.booked += quantity;
  const booking = {
    id: `bk-${crypto.randomUUID().slice(0, 8)}`,
    eventId,
    eventTitle: event.title,
    email: user.email,
    customer: user.name,
    quantity,
    total: Number((event.price * quantity).toFixed(2)),
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  };

  database.bookings.push(booking);
  return { booking, statusCode: 201 };
}

function serveStaticFile(request, response, pathname) {
  const requestedPath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.resolve(PUBLIC_DIRECTORY, requestedPath);

  if (!filePath.startsWith(`${PUBLIC_DIRECTORY}${path.sep}`) || !fs.existsSync(filePath)) {
    sendJson(request, response, 404, { error: 'Not found.' });
    return;
  }

  const fileDetails = fs.statSync(filePath);
  if (!fileDetails.isFile()) {
    sendJson(request, response, 404, { error: 'Not found.' });
    return;
  }

  response.writeHead(200, {
    'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
    'Content-Length': fileDetails.size,
    'Cache-Control': 'no-cache',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const { pathname } = url;

  try {
    if ((request.method === 'GET' || request.method === 'HEAD') && pathname === '/api/health') {
      sendJson(request, response, 200, {
        status: 'ok',
        service: 'EventBook API',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && pathname === '/api/events') {
      const database = readDatabase();
      sendJson(request, response, 200, filterAndSortEvents(database.events, url.searchParams));
      return;
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && /^\/api\/events\/[^/]+$/.test(pathname)) {
      const eventId = pathname.split('/')[3];
      const event = readDatabase().events.find((item) => item.id === eventId);

      if (!event) {
        sendJson(request, response, 404, { error: 'Event was not found.' });
        return;
      }

      sendJson(request, response, 200, event);
      return;
    }

    if (request.method === 'POST' && pathname === '/api/login') {
      const { email, password } = await readJsonBody(request);
      const user = DEMO_USERS.find((item) => item.email === email && item.password === password);

      if (!user) {
        sendJson(request, response, 401, { error: 'Invalid email or password.' });
        return;
      }

      const token = crypto.randomUUID();
      sessions.set(token, { ...user });
      sendJson(request, response, 200, {
        token,
        user: { email: user.email, name: user.name, role: user.role },
      });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/logout') {
      const authorization = request.headers.authorization || '';
      sessions.delete(authorization.replace('Bearer ', ''));
      sendJson(request, response, 200, { message: 'Logged out.' });
      return;
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && pathname === '/api/bookings') {
      const user = requireRole(request, response);
      if (!user) return;

      const bookings = readDatabase().bookings;
      const visibleBookings = user.role === 'admin'
        ? bookings
        : bookings.filter((booking) => booking.email === user.email);

      sendJson(request, response, 200, visibleBookings);
      return;
    }

    if (request.method === 'POST' && pathname === '/api/bookings') {
      const user = requireRole(request, response, 'customer');
      if (!user) return;

      const { eventId, quantity } = await readJsonBody(request);
      const database = readDatabase();
      const result = createBooking(database, user, eventId, Number(quantity));

      if (result.error) {
        sendJson(request, response, result.statusCode, { error: result.error });
        return;
      }

      writeDatabase(database);
      sendJson(request, response, result.statusCode, result.booking);
      return;
    }

    if (request.method === 'POST' && /^\/api\/bookings\/[^/]+\/cancel$/.test(pathname)) {
      const user = requireRole(request, response);
      if (!user) return;

      const bookingId = pathname.split('/')[3];
      const database = readDatabase();
      const booking = database.bookings.find((item) => item.id === bookingId);
      const canCancelBooking = booking && (user.role === 'admin' || booking.email === user.email);

      if (!canCancelBooking) {
        sendJson(request, response, 404, { error: 'Booking was not found.' });
        return;
      }

      if (booking.status === 'Cancelled') {
        sendJson(request, response, 400, { error: 'Booking is already cancelled.' });
        return;
      }

      booking.status = 'Cancelled';
      const event = database.events.find((item) => item.id === booking.eventId);
      if (event) event.booked = Math.max(0, event.booked - booking.quantity);

      writeDatabase(database);
      sendJson(request, response, 200, booking);
      return;
    }

    if (request.method === 'POST' && pathname === '/api/events') {
      if (!requireRole(request, response, 'admin')) return;

      const body = await readJsonBody(request);
      if (!validEvent(body)) {
        sendJson(request, response, 400, {
          error: 'Complete all event fields. Price must be zero or more and capacity must be a whole positive number.',
        });
        return;
      }

      const database = readDatabase();
      const event = eventFromRequest(body, `evt-${crypto.randomUUID().slice(0, 8)}`);
      database.events.push(event);
      writeDatabase(database);
      sendJson(request, response, 201, event);
      return;
    }

    if (request.method === 'PUT' && /^\/api\/events\/[^/]+$/.test(pathname)) {
      if (!requireRole(request, response, 'admin')) return;

      const body = await readJsonBody(request);
      if (!validEvent(body)) {
        sendJson(request, response, 400, {
          error: 'Complete all event fields. Price must be zero or more and capacity must be a whole positive number.',
        });
        return;
      }

      const database = readDatabase();
      const eventId = pathname.split('/')[3];
      const eventIndex = database.events.findIndex((item) => item.id === eventId);

      if (eventIndex === -1) {
        sendJson(request, response, 404, { error: 'Event was not found.' });
        return;
      }

      const existingEvent = database.events[eventIndex];
      if (Number(body.capacity) < existingEvent.booked) {
        sendJson(request, response, 400, {
          error: `Capacity cannot be below the ${existingEvent.booked} ticket(s) already booked.`,
        });
        return;
      }

      const updatedEvent = eventFromRequest(body, existingEvent.id, existingEvent.booked);
      database.events[eventIndex] = updatedEvent;
      writeDatabase(database);
      sendJson(request, response, 200, updatedEvent);
      return;
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      serveStaticFile(request, response, pathname);
      return;
    }

    sendJson(request, response, 404, { error: 'Not found.' });
  } catch (error) {
    const statusCode = error.message.includes('valid JSON') || error.message.includes('too large') ? 400 : 500;
    sendJson(request, response, statusCode, { error: error.message || 'Unexpected server error.' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`EventBook running at http://localhost:${PORT}`));
}

module.exports = {
  createBooking,
  filterAndSortEvents,
  getRemainingTickets,
  server,
  validEvent,
};
