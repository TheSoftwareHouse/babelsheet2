import { GoogleSpreadsheet, ServiceAccountCredentials } from 'google-spreadsheet';

export type SpreadsheetSourceConfig = {
  spreadsheetId: string;
  sheetIndex?: number;
  credentials: ServiceAccountCredentials;
};

export type CellValue = string | number | boolean | null;

export type Row = CellValue[];

const ROWS_BATCH_SIZE = 50;

export async function* spreadsheetRowsIterator({
  spreadsheetId,
  sheetIndex = 0,
  credentials,
}: SpreadsheetSourceConfig) {
  const document = new GoogleSpreadsheet(spreadsheetId);

  await document.useServiceAccountAuth(credentials);
  await document.loadInfo();

  const sheet = document.sheetsByIndex[sheetIndex];
  const totalPages = Math.ceil(sheet.rowCount / ROWS_BATCH_SIZE);

  for (let page = 0; page < totalPages; ++page) {
    const startRowIndex = page * ROWS_BATCH_SIZE;
    const endRowIndex = Math.min((page + 1) * ROWS_BATCH_SIZE, sheet.rowCount);
    const endColumnIndex = sheet.columnCount - 1;

    // eslint-disable-next-line no-await-in-loop
    await sheet.loadCells({
      startColumnIndex: 0,
      startRowIndex,
      endColumnIndex,
      endRowIndex,
    });

    for (let y = 0; y < endRowIndex; ++y) {
      const row: Row = [];

      for (let x = 0; x < endColumnIndex; ++x) {
        row.push(sheet.getCell(y, x).value);
      }

      yield row;
    }
  }
}
