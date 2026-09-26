import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const dumpPath = path.join(rootDir, 'database_dump.sql');

export function exportDump() {
  console.log(`[Dump] Generating database dump at: ${dumpPath}`);
  let sql = `-- Military Asset Management System (MAMS) Database Dump
-- Generated on: ${new Date().toISOString()}
-- Engine: Relational SQL (SQLite / PostgreSQL ANSI Compatible)

PRAGMA foreign_keys = OFF;

`;

  const tables = [
    'bases',
    'equipment_types',
    'users',
    'base_inventory',
    'purchases',
    'transfers',
    'assignments',
    'expenditures',
    'audit_logs'
  ];

  // 1. DDL for each table
  for (const table of tables) {
    const tableDef = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    if (tableDef && tableDef.sql) {
      sql += `DROP TABLE IF EXISTS ${table};\n`;
      sql += `${tableDef.sql};\n\n`;
    }
  }

  // 2. Data inserts
  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length > 0) {
      sql += `-- Table Data: ${table} (${rows.length} records)\n`;
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          // Escape single quotes for SQL safety
          const escaped = String(val).replace(/'/g, "''");
          return `'${escaped}'`;
        });
        sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      sql += `\n`;
    }
  }

  // 3. Indexes
  const indexes = db.prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL`).all();
  if (indexes.length > 0) {
    sql += `-- Indexes\n`;
    for (const idx of indexes) {
      sql += `${idx.sql};\n`;
    }
    sql += `\n`;
  }

  sql += `PRAGMA foreign_keys = ON;\n`;

  fs.writeFileSync(dumpPath, sql, 'utf-8');
  console.log(`[Dump] Database dump exported successfully to ${dumpPath} (${(fs.statSync(dumpPath).size / 1024).toFixed(2)} KB)`);
}

if (process.argv[1] && process.argv[1].endsWith('exportDump.js')) {
  exportDump();
}
