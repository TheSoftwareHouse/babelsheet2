import test = require('tape');
import iteratorModule = require("../src/spreadsheet-rows-iterator");
import {fromBabelsheet, TranslationEntry} from '../src';
import {firstValueFrom, toArray} from "rxjs";
import {TestCase} from "tape";
import {Row} from "../dist/spreadsheet-rows-iterator";

test("fromBabelsheet", async () => {
  test("throws error on missing header row", async (t) => {
    iteratorModule.spreadsheetRowsIterator = async function*() {
      yield ["Foo"];
      yield ["Bar"];
    }

    await firstValueFrom(fromBabelsheet({} as any).pipe(toArray()))
      .then(() => t.fail())
      .catch(error => {
        t.equals(error.message, "No header row found");
      });
  });

  test("parses nested translations correctly", dataCaseTest(
      [
        ["###", ">>>",    ">>>",      ">>>",      "en",       "pl"              ],
        [null,  "login",  null,       null,       null,       null              ],
        [null,  null,     "buttons",  null,       null,       null              ],
        [null,  null,     null,       "signup",   "Sign up",  "Zarejestruj się" ],
        [null,  null,     null,       "signin",   "Sign in",  "Zaloguj się"     ],
        [null,  null,     null,       null,       null,       null              ],
        [null,  null,     "form",     null,       null,       null              ],
        [null,  null,     null,       "email",    "E-mail",   "E-mail"          ],
        [null,  null,     null,       "password", "Password", "Hasło"           ],
        [null,  null,     null,       null,       null,       null              ],

      ],
    [
      {
        language: "en",
        path: ["login", "buttons", "signup"],
        value: "Sign up",
        tag: "",
      },
      {
        language: "pl",
        path: ["login", "buttons", "signup"],
        value: "Zarejestruj się",
        tag: "",
      },
      {
        language: "en",
        path: ["login", "buttons", "signin"],
        value: "Sign in",
        tag: "",
      },
      {
        language: "pl",
        path: ["login", "buttons", "signin"],
        value: "Zaloguj się",
        tag: "",
      },
      {
        language: "en",
        path: ["login", "form", "email"],
        value: "E-mail",
        tag: "",
      },
      {
        language: "pl",
        path: ["login", "form", "email"],
        value: "E-mail",
        tag: "",
      },
      {
        language: "en",
        path: ["login", "form", "password"],
        value: "Password",
        tag: "",
      },
      {
        language: "pl",
        path: ["login", "form", "password"],
        value: "Hasło",
        tag: "",
      },
    ]
  ));

  test("supports tags", dataCaseTest(
    [
      ["###", ">>>", "en", "pl"],
      ["tag1",  "key1", "value1", "wartość1"],
      [null,    "key2", "value2", "wartość2"],
      ["tag2",  "key3", "value3", "wartość3"],
    ],
    [
      {
        language: "en",
        path: ["key1"],
        value: "value1",
        tag: "tag1",
      },
      {
        language: "pl",
        path: ["key1"],
        value: "wartość1",
        tag: "tag1",
      },
      {
        language: "en",
        path: ["key2"],
        value: "value2",
        tag: "",
      },
      {
        language: "pl",
        path: ["key2"],
        value: "wartość2",
        tag: "",
      },
      {
        language: "en",
        path: ["key3"],
        value: "value3",
        tag: "tag2",
      },
      {
        language: "pl",
        path: ["key3"],
        value: "wartość3",
        tag: "tag2",
      },
    ]
  ));

  test("fills missing language translations with empty string", dataCaseTest(
    [
      ["###", ">>>", "en", "pl"],
      [null, "key1", "value1", null],
      [null, "key2", null, "wartość2"],
    ],
    [
      {
        language: "en",
        path: ["key1"],
        value: "value1",
        tag: "",
      },
      {
        language: "pl",
        path: ["key1"],
        value: "",
        tag: "",
      },
      {
        language: "en",
        path: ["key2"],
        value: "",
        tag: "",
      },
      {
        language: "pl",
        path: ["key2"],
        value: "wartość2",
        tag: "",
      },
    ],
  ));

  test("omits translations that are defined after 10 empty rows", dataCaseTest(
    [
      ["###", ">>>", "en", "pl"],
      [null, "key1", "value1", "wartość1"],
      [null, "key2", "value2", "wartość2"],
      ...Array(10).fill([null, null, null, null]),
      [null, "key3", "value3", "wartość3"],
    ],
    [
      {
        language: "en",
        path: ["key1"],
        value: "value1",
        tag: "",
      },
      {
        language: "pl",
        path: ["key1"],
        value: "wartość1",
        tag: "",
      },
      {
        language: "en",
        path: ["key2"],
        value: "value2",
        tag: "",
      },
      {
        language: "pl",
        path: ["key2"],
        value: "wartość2",
        tag: "",
      },
    ]
  ));
});

function dataCaseTest(spreadsheetRows: Row[], expectedOutput: TranslationEntry[]): TestCase {
  return async (t) => {
    iteratorModule.spreadsheetRowsIterator = async function* () {
      for (const row of spreadsheetRows) {
        yield row;
      }
    };

    const output = await firstValueFrom(fromBabelsheet({} as any).pipe(toArray()));

    t.equal(output.length, expectedOutput.length, "Output length match");

    output.forEach(
      (outputEntry, index) => {
        t.deepEqual(outputEntry, expectedOutput[index], `Translation entry #${index} match`);
      }
    );
  }
}