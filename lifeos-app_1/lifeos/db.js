/**
 * db.js — Simple JSON-file database
 * Demonstrates: file I/O, objects, classes, CRUD operations
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });

class Database {
  constructor(collection) {
    this.file = path.join(DB_PATH, `${collection}.json`);
    this._ensure();
  }

  _ensure() {
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, JSON.stringify({ records: [] }, null, 2));
    }
  }

  _read() {
    return JSON.parse(fs.readFileSync(this.file, 'utf8'));
  }

  _write(data) {
    fs.writeFileSync(this.file, JSON.stringify(data, null, 2));
  }

  findAll() {
    return this._read().records;
  }

  findById(id) {
    return this._read().records.find(r => r.id === id) || null;
  }

  findOne(predicate) {
    return this._read().records.find(predicate) || null;
  }

  insert(obj) {
    const data = this._read();
    const record = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...obj
    };
    data.records.push(record);
    this._write(data);
    return record;
  }

  update(id, updates) {
    const data = this._read();
    const idx = data.records.findIndex(r => r.id === id);
    if (idx === -1) return null;
    data.records[idx] = { ...data.records[idx], ...updates, updatedAt: new Date().toISOString() };
    this._write(data);
    return data.records[idx];
  }

  delete(id) {
    const data = this._read();
    const before = data.records.length;
    data.records = data.records.filter(r => r.id !== id);
    this._write(data);
    return data.records.length < before;
  }

  deleteWhere(predicate) {
    const data = this._read();
    data.records = data.records.filter(r => !predicate(r));
    this._write(data);
  }
}

// Export collection instances
module.exports = {
  users: new Database('users'),
  tasks: new Database('tasks'),
  habits: new Database('habits'),
  notes: new Database('notes'),
  calendar: new Database('calendar'),
  settings: new Database('settings'),
};
