import open from 'open';
import path from 'path';
import { isBabelsheetInitialized } from '../lib/user-project';
import { Command } from './index';

export const editCommand: Command = {
  name: 'edit',
  description: 'Opens translations Spreadsheet',
  handler,
};

async function handler() {
  if (!await isBabelsheetInitialized()) {
    throw new Error("Babelsheet2 hasn't been initialized for this project.");
  }

  // eslint-disable-next-line global-require,import/no-dynamic-require
  const { spreadsheetId } = require(path.join(process.cwd(), 'babelsheet.json'));

  await open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
}
