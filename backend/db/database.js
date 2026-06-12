const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'voicedraw.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
db.exec(initSQL);

module.exports = db;
