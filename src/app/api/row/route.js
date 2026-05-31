import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file');
  const sheetName = searchParams.get('sheet');
  const rowNo = searchParams.get('row');

  if (!fileName || !sheetName || !rowNo) {
    return NextResponse.json({ error: 'Missing file, sheet, or row param' }, { status: 400 });
  }

  try {
    const result = await client.execute({
      sql: `SELECT id, file_name, sheet_name, row_no, column_name, cell_value
            FROM excel_data
            WHERE file_name = ? AND sheet_name = ? AND row_no = ?
            ORDER BY id ASC`,
      args: [fileName, sheetName, parseInt(rowNo)],
    });

    return NextResponse.json({ cells: result.rows });
  } catch (err) {
    console.error('Row fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch row', details: err.message },
      { status: 500 }
    );
  }
}
