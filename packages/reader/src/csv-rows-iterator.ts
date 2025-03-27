import { google } from 'googleapis';
import { parse } from '@fast-csv/parse';
import { EOL } from 'node:os';
import { Credentials } from './types';

export type DriveCsvSourceConfig = {
  spreadsheetId: string;
  credentials: Credentials;
};

// eslint-disable-next-line max-len
async function exportSpreadsheetToCSV(spreadsheetId: string, credentials: Credentials): Promise<string> {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({
    version: 'v3',
    auth,
  });
  const { data } = await drive.files.export({
    fileId: spreadsheetId,
    mimeType: 'text/csv',
  });
  if (typeof data !== 'string') {
    throw new Error('Type of exported sheet is different than string');
  }
  return data;
}

export async function parseCsv(csvString: string): Promise<(string|null)[][]> {
  const csvStringRows = csvString.split('\r\n');
  const headersRowIndex = csvStringRows.findIndex((csvRow) => csvRow.startsWith('###'));
  const rowsWithHeaders = csvStringRows.slice(headersRowIndex);

  return new Promise((resolve, reject) => {
    const rows: (string|null)[][] = [];

    const stream = parse()
      .on('error', (err) => {
        console.error(err);
        reject(err);
      })
      .on('data', (row: string[]) => rows.push(row.map((cell) => (cell.trim() === '' ? null : cell))))
      .on('end', () => resolve(rows));
    stream.write(rowsWithHeaders.join(EOL));
    stream.end();
  });
}

export async function* csvRowsIterator({ spreadsheetId, credentials }: DriveCsvSourceConfig) {
  const csv = await exportSpreadsheetToCSV(spreadsheetId, credentials);

  let rows: (string|null)[][] = [];
  try {
    rows = await parseCsv(csv);
  } catch (e) {
    throw new Error('Encountered an error when parsing csv');
  }

  if (!rows.length) {
    throw new Error('No rows found after parsing csv');
  }

  for (let i = 0; i < rows.length; i++) {
    yield rows[i];
  }
}
