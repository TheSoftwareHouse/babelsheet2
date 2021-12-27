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

const resolvePackageJsonPath = () => path.join(process.cwd(), 'package.json');

export async function hasPackageJson() {
  return fileExists(resolvePackageJsonPath());
}

export async function resolveAppTitle() {
  if (!await hasPackageJson()) {
    return undefined;
  }

  const packageJsonBuffer = await fs.readFile(resolvePackageJsonPath());

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

export async function initPackageJson() {
  if (await hasPackageJson()) {
    return;
  }

  const proposedPackageName = path.basename(process.cwd());

  await fs.writeFile(resolvePackageJsonPath(), JSON.stringify({
    name: proposedPackageName,
    description: '',
    version: '1.0.0',
    dependencies: {},
    devDependencies: {},
  }, null, 2));
}

export async function listDependencies() {
  if (!await hasPackageJson()) {
    return [];
  }

  const packageJsonBuffer = await fs.readFile(resolvePackageJsonPath());

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
  if (!await hasPackageJson()) {
    throw new Error('package.json does not exist');
  }

  const packageJsonPath = resolvePackageJsonPath();
  const packageJsonContent = await fs.readFile(packageJsonPath)
    .then((content) => JSON.parse(content.toString()));

  if (!packageJsonContent.scripts) {
    packageJsonContent.scripts = {};
  }

  packageJsonContent.scripts[name] = command;

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
}
