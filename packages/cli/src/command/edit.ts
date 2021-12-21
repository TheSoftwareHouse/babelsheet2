import {Command} from "./index";
import {isBabelsheetInitialized} from "../lib/user-project";
import open from "open";
import path from "path";

export const editCommand: Command = {
  name: "edit",
  description: "Opens translations Spreadsheet",
  handler,
};

async function handler() {
  if (!await isBabelsheetInitialized()) {
    console.error("Babelsheet2 hasn't been initialized for this project.");

    return;
  }

  const { spreadsheetId } = require(path.join(process.cwd(), "babelsheet.json"));

  await open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
}