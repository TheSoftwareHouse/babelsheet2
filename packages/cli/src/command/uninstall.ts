import path from 'path';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import {
  isBabelsheetInitialized, listDependencies, removeDependencies, unregisterScript,
} from '../lib/user-project';
import { Command } from './index';
import { deleteDriveFile } from '../lib/drive';
import { authorize, parseCredentialsFile } from '../lib/auth';
import { fileExists } from '../lib/file-helpers';

export const uninstallCommand: Command = {
  name: 'uninstall',
  description: 'Uninstall Babelsheet2 from your project',
  handler,
};

async function handler() {
  if (!await isBabelsheetInitialized()) {
    throw new Error("Babelsheet2 hasn't been initialized for this project.");
  }

  const prodDependencies = await listDependencies();

  // eslint-disable-next-line global-require,import/no-dynamic-require
  const babelsheetConfig = require(path.join(process.cwd(), 'babelsheet.json'));

  const credentials = await parseCredentialsFile(babelsheetConfig.credentials);
  const auth = await authorize(credentials, [
    'https://www.googleapis.com/auth/drive',
  ]);
  const { spreadsheetId } = babelsheetConfig;
  const { outDir, scriptPath, scriptName } = babelsheetConfig.userInput;
  const outDirExists = await fileExists(outDir);

  const {
    removeSpreadsheet, removeOutDir, removeCredentials, removeRxJs = false, removeTsNode = false,
  }: Record<string, boolean> = await inquirer.prompt([
    {
      name: 'removeSpreadsheet',
      type: 'confirm',
      message: 'Remove Spreadsheet?',
    },
    {
      name: 'removeCredentials',
      type: 'confirm',
      message: `Remove "${babelsheetConfig.credentials}" file?`,
    },
    ...(outDirExists ? [{
      name: 'removeOutDir',
      type: 'confirm',
      message: `Remove translations output directory ("${outDir}")?`,
    }] : []),
    ...(!prodDependencies.includes('rxjs') ? [{
      name: 'removeRxJs',
      type: 'confirm',
      message: 'Remove "rxjs" dependency?',
    }] : []),
    ...(!prodDependencies.includes('ts-node') ? [{
      name: 'removeTsNode',
      type: 'confirm',
      message: 'Remove "ts-node" dependency?',
    }] : []),
  ]);

  if (removeSpreadsheet) {
    process.stdout.write(`Removing Spreadsheet ${spreadsheetId}... `);
    await deleteDriveFile({
      auth,
      fileId: spreadsheetId,
    });
    process.stdout.write('✅ Done \n');
  }

  if (removeOutDir) {
    process.stdout.write(`Removing translations output directory "${outDir}"... `);
    await fs.rm(outDir, { recursive: true });
    process.stdout.write('✅ Done \n');
  }

  if (removeCredentials) {
    process.stdout.write(`Removing "${babelsheetConfig.credentials}" file... `);
    await fs.rm(babelsheetConfig.credentials);
    process.stdout.write('✅ Done \n');
  }

  process.stdout.write('Removing translation fetch script... ');
  await fs.rm(scriptPath);
  await unregisterScript(scriptName);
  process.stdout.write('✅ Done \n');

  process.stdout.write('Removing Babelsheet2 dependencies... ');
  const babelsheetDeps = await listDependencies({ devDependencies: true }).then(
    (deps) => deps.filter((dep) => dep.startsWith('babelsheet2')),
  );
  if (removeTsNode) {
    babelsheetDeps.push('ts-node');
  }
  if (removeRxJs) {
    babelsheetDeps.push('rxjs');
  }
  await removeDependencies(babelsheetDeps);
  process.stdout.write('✅ Done \n');

  process.stdout.write('Removing "babelsheet.json" file... ');
  await fs.rm('babelsheet.json');
  process.stdout.write('✅ Done \n');
}
