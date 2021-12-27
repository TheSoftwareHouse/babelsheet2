import { promises as fs } from 'fs';
import path from 'path';
import util from 'util';
import { fileExists } from './file-helpers';

const exec = util.promisify(require('child_process').exec);

const BABELSHEET_CONFIG_FILE_NAME = 'babelsheet.json';

type BabelsheetConfig = {
  cliVersion: string;
  spreadsheetId: string;
  credentialsFile: string;
  userInput: Record<string, unknown>;
};

type DependencyToInstall = {
  dev: boolean;
  packageName: string;
};

export async function resolveAppTitle() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJsonExists = await fileExists(packageJsonPath);

  if (!packageJsonExists) {
    return undefined;
  }

  const packageJsonBuffer = await fs.readFile(packageJsonPath);

  try {
    const parsedPackageJson = JSON.parse(packageJsonBuffer.toString());

    if (typeof parsedPackageJson.name !== 'string') {
      return undefined;
    }

    return (parsedPackageJson as any).name as string;
  } catch {
    return undefined;
  }
}

export async function isBabelsheetInitialized() {
  const babelsheetConfigFilePath = path.join(process.cwd(), BABELSHEET_CONFIG_FILE_NAME);
  return fileExists(babelsheetConfigFilePath);
}

export async function saveBabelsheetConfig({
  spreadsheetId, credentialsFile, userInput, cliVersion,
}: BabelsheetConfig) {
  await fs.writeFile(BABELSHEET_CONFIG_FILE_NAME, JSON.stringify({
    cliVersion,
    spreadsheetId,
    credentials: credentialsFile,
    userInput,
  }, null, 2));
}

export async function listDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJsonExists = await fileExists(packageJsonPath);

  if (!packageJsonExists) {
    return [];
  }

  const packageJsonBuffer = await fs.readFile(packageJsonPath);

  try {
    const parsedPackageJson = JSON.parse(packageJsonBuffer.toString());

    return Object.keys(parsedPackageJson.dependencies);
  } catch {
    return [];
  }
}

export async function installDependencies(dependencies: DependencyToInstall[]) {
  const existingDeps = await listDependencies();
  const missingDependencies = dependencies.filter(
    ({ packageName }) => !existingDeps.includes(packageName),
  );

  const deps = missingDependencies
    .filter(({ dev }) => !dev)
    .map(({ packageName }) => packageName);
  const devDeps = missingDependencies
    .filter(({ dev }) => dev)
    .map(({ packageName }) => packageName);

  if (deps) {
    await exec(`npm i ${deps.join(' ')}`);
  }

  if (devDeps) {
    await exec(`npm i -D ${devDeps.join(' ')}`);
  }
}

export async function registerScript(name: string, command: string) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJsonExists = await fileExists(packageJsonPath);

  if (!packageJsonExists) {
    throw new Error('package.json does not exist');
  }

  const packageJsonContent = await fs.readFile(packageJsonPath)
    .then((content) => JSON.parse(content.toString()));

  if (!packageJsonContent.scripts) {
    packageJsonContent.scripts = {};
  }

  packageJsonContent.scripts[name] = command;

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
}
