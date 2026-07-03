/**
 * routes/auth.js — Register & Login endpoints
 * Demonstrates: REST API, password hashing, JWT signing, input validation
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || 'lifeos_secret_2024';
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Check uniqueness
    const existingUser = db.users.findOne(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(409).json({ error: 'El email o usuario ya está registrado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = db.users.insert({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
      avatar: null,
      theme: 'dark',
      accentColor: '#c8f135',
    });

    // Create default settings for user
    db.settings.insert({
      userId: user.id,
      theme: 'dark',
      accentColor: '#c8f135',
      dashboardLayout: ['timer', 'tasks', 'habits', 'calendar', 'notes'],
      pomodoroFocus: 25,
      pomodoroShort: 5,
      pomodoroLong: 15,
    });

    // Seed some default habits
    const defaultHabits = ['Ejercicio', 'Leer 30 min', 'Agua 2L'];
    defaultHabits.forEach(name => {
      db.habits.insert({ userId: user.id, name, icon: '⭐', checks: [false,false,false,false,false,false,false], active: true });
    });

    // Sign token
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });

    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = db.users.findOne(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
