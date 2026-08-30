const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, 'data.json');
const users = [
  { email: 'customer@example.com', password: 'Customer123!', role: 'customer', name: 'Alex Customer' },
  { email: 'admin@example.com', password: 'Admin123!', role: 'admin', name: 'Jordan Admin' }
];
const sessions = new Map();
function readDb() { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }
function json(res, code, data) { res.writeHead(code, {'Content-Type':'application/json'}); res.end(JSON.stringify(data)); }
function body(req) { return new Promise((resolve, reject) => { let d=''; req.on('data', c => d += c); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { reject(new Error('Invalid JSON')); } }); }); }
function auth(req) { const token = (req.headers.authorization || '').replace('Bearer ', ''); return sessions.get(token); }
function requireRole(req, res, role) { const user = auth(req); if (!user || (role && user.role !== role)) { json(res, 401, {error:'You are not authorised for this action.'}); return null; } return user; }
function validEvent(e) { return Boolean(e.title?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.time && e.venue?.trim() && Number(e.price) >= 0 && Number(e.capacity) > 0); }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/api/events') return json(res, 200, readDb().events);
  if (req.method === 'POST' && url.pathname === '/api/login') {
    const {email, password} = await body(req); const user = users.find(u => u.email === email && u.password === password);
    if (!user) return json(res, 401, {error:'Invalid email or password.'});
    const token = crypto.randomUUID(); sessions.set(token, {...user}); return json(res, 200, {token, user:{email:user.email, name:user.name, role:user.role}});
  }
  if (req.method === 'GET' && url.pathname === '/api/bookings') {
    const user = requireRole(req, res); if (!user) return; const db = readDb();
    const bookings = user.role === 'admin' ? db.bookings : db.bookings.filter(b => b.email === user.email); return json(res, 200, bookings);
  }
  if (req.method === 'POST' && url.pathname === '/api/bookings') {
    const user = requireRole(req, res, 'customer'); if (!user) return; const {eventId, quantity} = await body(req); const qty = Number(quantity); const db = readDb(); const event = db.events.find(e => e.id === eventId);
    if (!event) return json(res, 404, {error:'Event was not found.'});
    if (!Number.isInteger(qty) || qty < 1) return json(res, 400, {error:'Choose at least one whole ticket.'});
    if (event.booked + qty > event.capacity) return json(res, 400, {error:`Only ${event.capacity-event.booked} ticket(s) remain.`});
    event.booked += qty; const booking = {id:`bk-${crypto.randomUUID().slice(0,8)}`, eventId, eventTitle:event.title, email:user.email, customer:user.name, quantity:qty, total:Number((event.price*qty).toFixed(2)), status:'Confirmed', createdAt:new Date().toISOString()}; db.bookings.push(booking); writeDb(db); return json(res, 201, booking);
  }
  if (req.method === 'POST' && /^\/api\/bookings\/[^/]+\/cancel$/.test(url.pathname)) {
    const user = requireRole(req, res); if (!user) return; const id = url.pathname.split('/')[3]; const db = readDb(); const booking = db.bookings.find(b => b.id === id);
    if (!booking || (user.role !== 'admin' && booking.email !== user.email)) return json(res, 404, {error:'Booking was not found.'});
    if (booking.status === 'Cancelled') return json(res, 400, {error:'Booking is already cancelled.'});
    booking.status = 'Cancelled'; const event = db.events.find(e => e.id === booking.eventId); if (event) event.booked -= booking.quantity; writeDb(db); return json(res, 200, booking);
  }
  if (req.method === 'POST' && url.pathname === '/api/events') {
    if (!requireRole(req,res,'admin')) return; const e = await body(req); if (!validEvent(e)) return json(res,400,{error:'Complete all event fields. Price must be zero or more and capacity must be positive.'});
    const db = readDb(); const event={id:`evt-${crypto.randomUUID().slice(0,8)}`,title:e.title.trim(),date:e.date,time:e.time,venue:e.venue.trim(),price:Number(e.price),capacity:Number(e.capacity),booked:0,description:(e.description||'').trim()}; db.events.push(event); writeDb(db); return json(res,201,event);
  }
  if (req.method === 'PUT' && /^\/api\/events\/[^/]+$/.test(url.pathname)) {
    if (!requireRole(req,res,'admin')) return; const e = await body(req); const db = readDb(); const event = db.events.find(item => item.id === url.pathname.split('/')[3]);
    if (!event) return json(res,404,{error:'Event was not found.'});
    if (!validEvent(e)) return json(res,400,{error:'Complete all event fields. Price must be zero or more and capacity must be positive.'});
    if (Number(e.capacity) < event.booked) return json(res,400,{error:`Capacity cannot be below the ${event.booked} ticket(s) already booked.`});
    Object.assign(event,{title:e.title.trim(),date:e.date,time:e.time,venue:e.venue.trim(),price:Number(e.price),capacity:Number(e.capacity),description:(e.description||'').trim()}); writeDb(db); return json(res,200,event);
  }
  const file = url.pathname === '/' ? 'public/index.html' : `public${url.pathname}`; const safe = path.normalize(file).replace(/^\.\.([/\\]|$)/, ''); const target=path.join(__dirname,safe);
  if (req.method === 'GET' && fs.existsSync(target) && fs.statSync(target).isFile()) { const ext=path.extname(target); res.writeHead(200,{'Content-Type': ext==='.css'?'text/css':ext==='.js'?'application/javascript':'text/html'}); return fs.createReadStream(target).pipe(res); }
  json(res,404,{error:'Not found'});
});
if (require.main === module) server.listen(PORT, () => console.log(`EventBook running at http://localhost:${PORT}`));
module.exports = {server, validEvent};
