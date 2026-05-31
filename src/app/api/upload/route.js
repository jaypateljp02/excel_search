import { NextResponse } from 'next/server';
import { insertRows } from '@/lib/turso';
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    // Check upload password
    const password = request.headers.get('x-upload-password');
    if (password !== process.env.UPLOAD_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    const fileName = file.name;
    const batch = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Get header row for column names
      const headers = json[0] || [];

      for (let rowIndex = 0; rowIndex < json.length; rowIndex++) {
        const row = json[rowIndex];
        if (!row || row.length === 0) continue;

        // Check if entire row is empty
        const hasValue = row.some(
          (cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''
        );
        if (!hasValue) continue;

        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const cellValue = row[colIndex];
          if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') {
            continue;
          }

          // Clean the value
          let cleanValue = String(cellValue).trim();
          cleanValue = cleanValue.replace(/\s+/g, ' ');

          const columnName =
            rowIndex === 0
              ? `Column ${colIndex + 1}`
              : headers[colIndex]
                ? String(headers[colIndex]).trim()
                : `Column ${colIndex + 1}`;

          batch.push({
            file_name: fileName,
            sheet_name: sheetName,
            row_no: rowIndex + 1,
            column_name: columnName,
            cell_value: cleanValue,
          });
        }
      }
    }

    // Insert all rows via Turso batch (blazing fast)
    await insertRows(batch);

    return NextResponse.json({
      success: true,
      fileName,
      sheetsProcessed: workbook.SheetNames.length,
      cellsInserted: batch.length,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Upload failed', details: err.message },
      { status: 500 }
    );
  }
}
