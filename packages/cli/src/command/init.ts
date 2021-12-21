import inquirer from "inquirer";
import {authorize, parseCredentialsFile} from "../lib/auth";
import {scriptTemplates} from "../script-template";
import {
  installDependencies,
  isBabelsheetInitialized,
  registerScript,
  resolveAppTitle,
  saveBabelsheetConfig
} from "../lib/user-project";
import {createBabelsheet} from "../lib/babelsheet-generator";
import {shareFileWithEmail} from "../lib/drive";
import {generateScript} from "../lib/script-generator";
import {fileExists} from "../lib/file-helpers";
import {Command} from "./index";

const GOOGLE_ACCOUNT_SETUP_TUTORIAL_URL = "https://github.com/TheSoftwareHouse/babelsheet2#-prerequisites";

export const initCommand: Command = {
  name: "init",
  description: "Initializes Babelsheet2 in current working directory",
  handler,
};

async function handler() {
  if (await isBabelsheetInitialized()) {
    console.error("Babelsheet has been already set up in this project.");

    return;
  }

  const appTitle = await resolveAppTitle();
  const defaultSpreadsheetTitle = appTitle ? `${appTitle} Translations` : "Translations";

  const { difficultyChoice }: { difficultyChoice: string } = await inquirer.prompt([
    {
      name: "difficultyChoice",
      type: "rawlist",
      message: "Choose set of questions:",
      choices: [
        "🐣 Simple - only essential questions, less customization in favor of reasonable defaults",
        "💪 Advanced - customize everything as you like",
      ],
    },
  ]);
  const simpleMode = difficultyChoice.includes("Simple");

  const answers: {
    credentials: string;
    title: string;
    includeManual: boolean;
    maxLevels: number;
    languages: string;
    outDir: string;
    email: string;
    scriptTemplate: string;
    scriptPath: string;
    scriptName: string;
    example: boolean;
  } = await inquirer.prompt([
    {
      name: "credentials",
      type: "input",
      message: "🔑 Which file stores your Google Service Account credentials?",
      validate(input: string) {
        return parseCredentialsFile(input).then(() => true).catch(error =>
          error.code === 'ENOENT' ?
            `Provided file does not exist. Perhaps Google Service account set up tutorial may help you to create one?: ${GOOGLE_ACCOUNT_SETUP_TUTORIAL_URL}` :
            error.message
        );
      },
      default: ".credentials.json",
    },
    {
      name: "title",
      type: "input",
      message: "🏷 Choose a title for your translations spreadsheet file:",
      default: defaultSpreadsheetTitle,
    },
    {
      name: "includeManual",
      type: "confirm",
      message: "📖 Do you want to create tall header with user manual for non-technical people?",
      default: true,
    },
    {
      name: "maxLevels",
      type: "number",
      message: "🪜 How deep (maximally) in terms of levels your translations will be?",
      validate(input: number) {
        if (input < 1) {
          return "Translation keys should be at least one level deep";
        }

        return true;
      },
      default: 5,
    },
    {
      name: "languages",
      type: "input",
      message: "🌎 Pick codes of languages to be supported:",
      validate(input: string) {
        return input.split(/[ ,]/g)
          .filter(entry => entry.trim().length > 0)
          .every(languageCode => /^[a-z]{2}$/.test(languageCode.trim()));
      },
      default: "en, pl",
    },
    {
      name: "example",
      type: "confirm",
      message: "📝 Do you want to include some exemplary translation key entries in the spreadsheet?",
      default: true,
    },
    {
      name: "email",
      type: "input",
      message: "📧 Enter your GMail address so I can share the spreadsheet with you",
      validate(input: string) {
        return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input);
      },
    },
    {
      name: "scriptTemplate",
      type: "rawlist",
      message: "📜 Select desired format of translations output",
      choices: scriptTemplates.map(({ title }) => title),
    },
    {
      name: "outDir",
      type: "input",
      message: "🎯 Where translation files should be stored?",
      default: "./i18n/",
    },
    {
      name: "scriptPath",
      type: "input",
      message: "📄 Where should I put translation script?",
      default: "./scripts/fetch-translations.ts",
    },
    {
      name: "scriptName",
      type: "input",
      message: '⌨️ Which "npm run" command you would like to type to run translation fetching',
      default: "translations",
    }
  ], simpleMode ? {
    ...(await fileExists(".credentials.json") ? { credentials: ".credentials.json" } : {}),
    title: defaultSpreadsheetTitle,
    includeManual: true,
    maxLevels: 5,
    outDir: "./i18n/",
    scriptPath: "./scripts/fetch-translations.ts",
    scriptName: "translations",
    example: true,
  } : {});

  console.log("Authorizing with Google API using provided credentials...");
  const credentials = await parseCredentialsFile(answers.credentials);
  const auth = await authorize(credentials, [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ]);

  const languages = answers.languages
    .split(/[ ,]/g)
    .filter(entry => entry.trim().length > 0)
    .map(languageCode => languageCode.trim());

  console.log("Creating Google Spreadsheet...");
  const googleSpreadsheetResponse = await createBabelsheet({
    auth,
    languages,
    maxTranslationKeyLevel: answers.maxLevels,
    includeManual: answers.includeManual,
    includeExample: answers.example,
    title: answers.title,
  })

  const { spreadsheetId, spreadsheetUrl } = googleSpreadsheetResponse.data;

  if (!spreadsheetId) {
    throw new Error("Error while creating spreadsheet");
  }

  console.log(`Sharing Spreadsheet with ${answers.email}...`);
  await shareFileWithEmail({
    auth,
    role: "writer",
    email: answers.email,
    fileId: spreadsheetId,
    sendNotificationEmail: true,
  });

  await saveBabelsheetConfig({
    cliVersion: require("../../package.json").version,
    credentialsFile: answers.credentials,
    spreadsheetId,
    userInput: answers,
  });

  console.log("Installing dev dependencies...");
  await installDependencies([
    { dev: true, packageName: "babelsheet2-reader" },
    { dev: true, packageName: "babelsheet2-json-writer" },
    { dev: true, packageName: "ts-node" },
    { dev: true, packageName: "rxjs" },
  ]);

  const scriptTemplateFileName = scriptTemplates.find(({ title }) => title === answers.scriptTemplate)!.fileName;

  console.log("Generating and registering translation script...");
  await generateScript(scriptTemplateFileName, answers.scriptPath, {
    "{{OUT_DIR_PATH}}": answers.outDir.endsWith("/") ? answers.outDir : `${answers.outDir}/`,
  });

  await registerScript(answers.scriptName, `ts-node ${answers.scriptPath}`);

  console.log("\n🎉 Babelsheet has been successfully initialized! 🎉\n");
  console.log(`📝 Translation spreadsheet is available here: ${spreadsheetUrl}`);
  console.log(`💻 To fetch the translations type: "npm run ${answers.scriptName}"`);
}

