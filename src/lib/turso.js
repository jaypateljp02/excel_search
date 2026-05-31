import { createClient } from '@libsql/client';

// Initialise Turso client using environment variables
const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

let migrated = false;

/** Run migrations once — creates the data table and FTS5 index. */
export async function ensureMigrated() {
  if (migrated) return;

  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS excel_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        sheet_name TEXT NOT NULL,
        row_no INTEGER NOT NULL,
        column_name TEXT,
        cell_value TEXT
      )`,
      `CREATE VIRTUAL TABLE IF NOT EXISTS excel_data_fts
       USING fts5(
         file_name, sheet_name, column_name, cell_value,
         content='excel_data', content_rowid='id'
       )`,
      `CREATE TRIGGER IF NOT EXISTS excel_data_ai AFTER INSERT ON excel_data
       BEGIN
         INSERT INTO excel_data_fts(rowid, file_name, sheet_name, column_name, cell_value)
         VALUES (new.id, new.file_name, new.sheet_name, new.column_name, new.cell_value);
       END`,
      `CREATE TRIGGER IF NOT EXISTS excel_data_ad AFTER DELETE ON excel_data
       BEGIN
         INSERT INTO excel_data_fts(excel_data_fts, rowid, file_name, sheet_name, column_name, cell_value)
         VALUES('delete', old.id, old.file_name, old.sheet_name, old.column_name, old.cell_value);
       END`,
      `CREATE TRIGGER IF NOT EXISTS excel_data_au AFTER UPDATE ON excel_data
       BEGIN
         INSERT INTO excel_data_fts(excel_data_fts, rowid, file_name, sheet_name, column_name, cell_value)
         VALUES('delete', old.id, old.file_name, old.sheet_name, old.column_name, old.cell_value);
         INSERT INTO excel_data_fts(rowid, file_name, sheet_name, column_name, cell_value)
         VALUES (new.id, new.file_name, new.sheet_name, new.column_name, new.cell_value);
       END`,
    ],
    'write'
  );

  migrated = true;
  console.log('Turso migrations complete');
}

/** Insert many rows using batch for maximum speed. */
export async function insertRows(rows) {
  await ensureMigrated();

  // Build batch of insert statements
  const statements = rows.map((r) => ({
    sql: 'INSERT INTO excel_data (file_name, sheet_name, row_no, column_name, cell_value) VALUES (?, ?, ?, ?, ?)',
    args: [r.file_name, r.sheet_name, r.row_no, r.column_name, r.cell_value],
  }));

  // Turso batch limit is ~1000 per call, so chunk if needed
  const CHUNK = 500;
  for (let i = 0; i < statements.length; i += CHUNK) {
    await client.batch(statements.slice(i, i + CHUNK), 'write');
  }
}

/** Generate search query variations for numbers with leading zeros (e.g. poem_82 -> poem_082, poem_0082) */
function generateQueryVariations(query) {
  const digitRegex = /\d+/g;
  let match;
  const matches = [];
  while ((match = digitRegex.exec(query)) !== null) {
    matches.push({
      value: match[0],
      index: match.index,
      length: match[0].length
    });
    if (matches.length >= 2) break; // Limit to first 2 digit sequences to prevent blowup
  }

  if (matches.length === 0) {
    return [query];
  }

  function getDigitVariations(numStr) {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return [numStr];
    const s = new Set();
    s.add(numStr);
    s.add(num.toString());
    s.add(num.toString().padStart(2, '0'));
    s.add(num.toString().padStart(3, '0'));
    s.add(num.toString().padStart(4, '0'));
    return Array.from(s);
  }

  let currentQueries = [query];
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const digitVars = getDigitVariations(m.value);
    const nextQueries = [];
    for (const q of currentQueries) {
      for (const v of digitVars) {
        const newQ = q.slice(0, m.index) + v + q.slice(m.index + m.length);
        nextQueries.push(newQ);
      }
    }
    currentQueries = nextQueries;
  }

  return Array.from(new Set(currentQueries));
}

/** Search using LIKE with relevance ranking: exact original → exact variation → starts with original → starts with variation → contains */
export async function search(query) {
  await ensureMigrated();

  const original = query;
  const variations = generateQueryVariations(query);

  // Build the WHERE clause with OR for each variation's contains search
  // cell_value LIKE ? OR cell_value LIKE ? ...
  const whereClauses = variations.map(() => "cell_value LIKE ?").join(" OR ");
  const args = variations.map(v => `%${v}%`);

  // Build ORDER BY CASE logic dynamically
  const orderCases = [];
  const orderArgs = [];

  // 1. Exact match of original
  orderCases.push("WHEN cell_value = ? THEN 0");
  orderArgs.push(original);

  // 2. Exact match of any variation (including original)
  const exactPlaceholders = variations.map(() => "?").join(", ");
  orderCases.push(`WHEN cell_value IN (${exactPlaceholders}) THEN 1`);
  orderArgs.push(...variations);

  // 3. Starts with original
  orderCases.push("WHEN cell_value LIKE ? THEN 2");
  orderArgs.push(`${original}%`);

  // 4. Starts with any variation
  const startsWithClauses = variations.map(() => "cell_value LIKE ?").join(" OR ");
  orderCases.push(`WHEN ${startsWithClauses} THEN 3`);
  for (const v of variations) {
    orderArgs.push(`${v}%`);
  }

  // Exclude common Serial/Index columns to avoid matching raw row indexes
  const excludeCondition = `
    LOWER(column_name) NOT IN (
      'sr no', 'sr. no.', 'sr.no.', 'srno', 's.no.', 's. no.', 'sno', 
      'serial no', 'serial number', 'sl. no.', 'sl no', 'slno', 
      'sr. no', 'sr.no', 'sr', 'sl', 'sn', 's.n.', 's. n.', 'index', 'idx'
    )
  `;

  // Combine query
  const sql = `
    SELECT id, file_name, sheet_name, row_no, column_name, cell_value
    FROM excel_data
    WHERE (${whereClauses}) AND ${excludeCondition}
    ORDER BY
      CASE
        ${orderCases.join("\n        ")}
        ELSE 4
      END,
      length(cell_value) ASC
    LIMIT 50
  `;

  const allArgs = [...args, ...orderArgs];

  const result = await client.execute({ sql, args: allArgs });
  return result.rows;
}

