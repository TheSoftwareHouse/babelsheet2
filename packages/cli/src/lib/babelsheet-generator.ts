import { GoogleAuth } from "./auth";
import {google, sheets_v4} from "googleapis";
import Schema$CellData = sheets_v4.Schema$CellData;
import Schema$Color = sheets_v4.Schema$Color;
import Schema$RowData = sheets_v4.Schema$RowData;

export type BabelsheetConfig = {
  auth: GoogleAuth;
  title: string;
  maxTranslationKeyLevel: number;
  languages: string[];
  includeManual: boolean;
  includeExample: boolean;
};

export async function createBabelsheet({
  auth,
  title,
  maxTranslationKeyLevel,
  languages,
  includeManual,
  includeExample,
}: BabelsheetConfig) {
  return google.sheets({
    auth,
    version: "v4",
  }).spreadsheets.create({
    requestBody: {
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: "Translations",
            gridProperties: {
              frozenRowCount: includeManual ? 5 : 1
            },
          },
          data: [
            {
              rowData: [
                ...(includeManual ? generateUserManualHeaderRows(maxTranslationKeyLevel) : []),
                generateMainHeaderRow(maxTranslationKeyLevel, languages),
                ...(includeExample ? generateExampleRows(maxTranslationKeyLevel, languages) : [])
              ],
            },
          ],
        }
      ]
    },
  });
}

const generateExampleRows = (maxTranslationKeyLevel: number, languages: string[]): Schema$RowData[] => {
  const examples: [string, string][] = [
    ["common.ok", "Ok"],
    ["common.cancel", "Cancel"],
    ["common.error.unknown", "Unknown error. Please try again later"],
    ["login.email", "E-mail"],
    ["login.password", "Password"],
    ["login.signin", "Sign in"],
    ["login.signup", "Sign up"],
  ];
  const otherLanguageTranslationPlaceholder = "PROVIDE TRANSLATION";
  let lastPath: string[] = [];

  return examples.flatMap(
    example => {
      const keyPath = example[0].split(".", maxTranslationKeyLevel);
      const translation = example[1];

      const languageTranslationCells = languages.map(
        languageCode => textCell(
          ["en", "us"].includes(languageCode)
            ? translation
            : otherLanguageTranslationPlaceholder
        )
      );

      const rows = keyPath
        .flatMap((pathNode, index) => (lastPath[index] !== pathNode ? [{
          values: [
            // tag
            textCell(""),
            // translation key path current level padding
            ...fillCells(index, textCell("")),
            // translation key
            textCell(pathNode),
            // padding between translation key and language translations
            ...fillCells(maxTranslationKeyLevel - index - 1, textCell("")),
            // language translations
            ...(index === keyPath.length - 1 ? languageTranslationCells : []),
          ]
        }] : []));

      lastPath = keyPath;

      return rows;
    }
  );
}

const generateMainHeaderRow = (maxTranslationKeyLevel: number, languages: string[]): Schema$RowData => ({
  values: [
    boldCell("###"),
    ...fillCells(maxTranslationKeyLevel, boldCell(">>>")),
    ...languages.map(language => boldCell(language)),
  ],
});

const generateUserManualHeaderRows = (maxTranslationKeyLevel: number): Schema$RowData[] => ([
  { values: fillCells(maxTranslationKeyLevel + 1, highlightedCell()) },
  {
    values: [
      highlightedCell(),
      highlightedCell("These columns are the list of translation keys and"),
      ...fillCells(maxTranslationKeyLevel - 1, highlightedCell()),
      textCell("Please edit translation here."),
    ]
  },
  {
    values: [
      highlightedCell(),
      highlightedCell("can only be edited by the dev team."),
      ...fillCells(maxTranslationKeyLevel - 1, highlightedCell()),
    ],
  },
  {
    values: fillCells(maxTranslationKeyLevel + 1, highlightedCell()),
  },
]);

const highlightColor: Schema$Color = {
  alpha: 1,
  red: 0xFF / 255,
  green: 0xF2 / 255,
  blue: 0xCC / 255,
};

const textCell = (content: string): Schema$CellData => ({
  userEnteredValue: {
    stringValue: content,
  },
});

const highlightedCell = (content?: string): Schema$CellData => ({
  ...content !== undefined ? {
    userEnteredValue: {
      stringValue: content
    }
  } : {},
  userEnteredFormat: {
    backgroundColor: highlightColor,
  },
});

const boldCell = (content: string): Schema$CellData => ({
  userEnteredValue: {
    stringValue: content
  },
  textFormatRuns: [{ format: { bold: true }}],
});

const fillCells = (count: number, cell: Schema$CellData) => Array(count).fill(cell);