'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

const SETUP_STATE_KEYS = [
  ['icube.setup.state', 'COMPLETE'],
  ['icube.nativeIde.setupState', 'COMPLETE'],
  ['icube.main.setup.state', 'COMPLETE'],
  ['trae.setup.state', 'COMPLETE'],
  ['icube.setup.completed', true],
  ['trae.setup.completed', true],
  ['native_ide_installed', true],
  ['workbench.welcomePage.hidden', true],
];

function runSqlite(dbPath, sql) {
  execFileSync('sqlite3', [dbPath, sql], { stdio: 'pipe' });
}

function quoteSqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function seedStateVscdb(dbPath) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  runSqlite(dbPath, 'CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB);');

  for (const [key, value] of SETUP_STATE_KEYS) {
    const jsonValue = JSON.stringify(value);
    runSqlite(
      dbPath,
      `INSERT OR REPLACE INTO ItemTable (key, value) VALUES (${quoteSqlString(key)}, ${quoteSqlString(jsonValue)});`
    );
  }
}

async function seedAllStateDatabases(userDataDir, ciHome) {
  const databases = [
    path.join(userDataDir, 'User', 'globalStorage', 'state.vscdb'),
    path.join(ciHome, '.trae', 'User', 'globalStorage', 'state.vscdb'),
  ];

  for (const dbPath of databases) {
    try {
      await seedStateVscdb(dbPath);
      console.log(`Seeded state database: ${dbPath}`);
    } catch (err) {
      console.warn(`Could not seed ${dbPath}: ${err.message}`);
    }
  }
}

module.exports = {
  seedAllStateDatabases,
};
