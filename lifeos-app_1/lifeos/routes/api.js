/**
 * routes/api.js — Main application API
 * Demonstrates: CRUD, RESTful design, data filtering, object manipulation
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// All routes require authentication
router.use(auth);

/* ─── USER / PROFILE ──────────────────────────────────── */

router.get('/me', (req, res) => {
  const user = db.users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { password, ...safe } = user;
  res.json(safe);
});

router.put('/me', async (req, res) => {
  const { displayName, accentColor, theme, avatar } = req.body;
  const updates = {};
  if (displayName) updates.displayName = displayName;
  if (accentColor) updates.accentColor = accentColor;
  if (theme) updates.theme = theme;
  if (avatar !== undefined) updates.avatar = avatar;
  const updated = db.users.update(req.user.id, updates);
  const { password, ...safe } = updated;
  res.json(safe);
});

router.put('/me/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.users.findById(req.user.id);
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
  const hashed = await bcrypt.hash(newPassword, 10);
  db.users.update(req.user.id, { password: hashed });
  res.json({ ok: true });
});

/* ─── SETTINGS ────────────────────────────────────────── */

router.get('/settings', (req, res) => {
  const s = db.settings.findOne(s => s.userId === req.user.id);
  res.json(s || {});
});

router.put('/settings', (req, res) => {
  const s = db.settings.findOne(s => s.userId === req.user.id);
  if (!s) {
    const created = db.settings.insert({ userId: req.user.id, ...req.body });
    return res.json(created);
  }
  const updated = db.settings.update(s.id, req.body);
  res.json(updated);
});

/* ─── TASKS ───────────────────────────────────────────── */

router.get('/tasks', (req, res) => {
  const tasks = db.tasks.findAll().filter(t => t.userId === req.user.id);
  // Sort: incomplete first, then by createdAt desc
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  res.json(tasks);
});

router.post('/tasks', (req, res) => {
  const { text, tag, priority } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Texto requerido' });
  const task = db.tasks.insert({
    userId: req.user.id,
    text: text.trim(),
    tag: tag || 'general',
    priority: priority || 'normal',
    done: false,
  });
  res.status(201).json(task);
});

router.put('/tasks/:id', (req, res) => {
  const task = db.tasks.findById(req.params.id);
  if (!task || task.userId !== req.user.id) return res.status(404).json({ error: 'No encontrada' });
  const updated = db.tasks.update(req.params.id, req.body);
  res.json(updated);
});

router.delete('/tasks/:id', (req, res) => {
  const task = db.tasks.findById(req.params.id);
  if (!task || task.userId !== req.user.id) return res.status(404).json({ error: 'No encontrada' });
  db.tasks.delete(req.params.id);
  res.json({ ok: true });
});

router.delete('/tasks', (req, res) => {
  db.tasks.deleteWhere(t => t.userId === req.user.id && t.done);
  res.json({ ok: true });
});

/* ─── HABITS ──────────────────────────────────────────── */

router.get('/habits', (req, res) => {
  const habits = db.habits.findAll().filter(h => h.userId === req.user.id && h.active);
  res.json(habits);
});

router.post('/habits', (req, res) => {
  const { name, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const habit = db.habits.insert({
    userId: req.user.id,
    name: name.trim(),
    icon: icon || '⭐',
    checks: [false, false, false, false, false, false, false],
    active: true,
  });
  res.status(201).json(habit);
});

router.put('/habits/:id', (req, res) => {
  const habit = db.habits.findById(req.params.id);
  if (!habit || habit.userId !== req.user.id) return res.status(404).json({ error: 'No encontrado' });
  const updated = db.habits.update(req.params.id, req.body);
  res.json(updated);
});

router.delete('/habits/:id', (req, res) => {
  const habit = db.habits.findById(req.params.id);
  if (!habit || habit.userId !== req.user.id) return res.status(404).json({ error: 'No encontrado' });
  db.habits.update(req.params.id, { active: false });
  res.json({ ok: true });
});

/* ─── NOTES ───────────────────────────────────────────── */

router.get('/notes', (req, res) => {
  const notes = db.notes.findAll().filter(n => n.userId === req.user.id);
  notes.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  res.json(notes);
});

router.post('/notes', (req, res) => {
  const { title, content, color } = req.body;
  const note = db.notes.insert({
    userId: req.user.id,
    title: title || 'Sin título',
    content: content || '',
    color: color || '#1e1e24',
  });
  res.status(201).json(note);
});

router.put('/notes/:id', (req, res) => {
  const note = db.notes.findById(req.params.id);
  if (!note || note.userId !== req.user.id) return res.status(404).json({ error: 'No encontrada' });
  const updated = db.notes.update(req.params.id, req.body);
  res.json(updated);
});

router.delete('/notes/:id', (req, res) => {
  const note = db.notes.findById(req.params.id);
  if (!note || note.userId !== req.user.id) return res.status(404).json({ error: 'No encontrada' });
  db.notes.delete(req.params.id);
  res.json({ ok: true });
});

/* ─── CALENDAR ────────────────────────────────────────── */

router.get('/calendar', (req, res) => {
  const events = db.calendar.findAll().filter(e => e.userId === req.user.id);
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(events);
});

router.post('/calendar', (req, res) => {
  const { title, date, time, color, description } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Título y fecha requeridos' });
  const event = db.calendar.insert({
    userId: req.user.id,
    title,
    date,
    time: time || '',
    description: description || '',
    color: color || '#7c6af7',
  });
  res.status(201).json(event);
});

router.put('/calendar/:id', (req, res) => {
  const ev = db.calendar.findById(req.params.id);
  if (!ev || ev.userId !== req.user.id) return res.status(404).json({ error: 'No encontrado' });
  const updated = db.calendar.update(req.params.id, req.body);
  res.json(updated);
});

router.delete('/calendar/:id', (req, res) => {
  const ev = db.calendar.findById(req.params.id);
  if (!ev || ev.userId !== req.user.id) return res.status(404).json({ error: 'No encontrado' });
  db.calendar.delete(req.params.id);
  res.json({ ok: true });
});

/* ─── STATS ───────────────────────────────────────────── */

router.get('/stats', (req, res) => {
  const uid = req.user.id;
  const tasks = db.tasks.findAll().filter(t => t.userId === uid);
  const habits = db.habits.findAll().filter(h => h.userId === uid && h.active);
  const notes = db.notes.findAll().filter(n => n.userId === uid);
  const events = db.calendar.findAll().filter(e => e.userId === uid);

  const todayHabits = habits.filter(h => h.checks && h.checks[6]).length;
  const habitRate = habits.length ? Math.round((todayHabits / habits.length) * 100) : 0;

  res.json({
    tasks: { total: tasks.length, done: tasks.filter(t => t.done).length },
    habits: { total: habits.length, todayDone: todayHabits, rate: habitRate },
    notes: notes.length,
    events: events.length,
  });
});

module.exports = router;
