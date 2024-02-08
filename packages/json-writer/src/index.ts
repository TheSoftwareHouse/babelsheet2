import { promises as fs } from 'fs';
import { setWith } from 'lodash';
import * as fsPath from 'path';
import { Observable } from 'rxjs';
import { mergeMap, reduce } from 'rxjs/operators';

export type TranslationJsonEntry = {
  path: string | string[];
  value: string;
};

export type JSONFileSummary = {
  entryCount: number;
  filePath: string;
}

export const writeJSONFile = (filePath: string) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  (entries$: Observable<TranslationJsonEntry>): Observable<JSONFileSummary> => entries$.pipe(
    reduce((accumulator, entry) => {
      if (Array.isArray(entry.path)) {
        setWith(accumulator.data, entry.path, entry.value, Object);
      } else {
        accumulator.data[entry.path] = entry.value;
      }
      accumulator.entryCount++;

      return accumulator;
    }, { data: {} as Record<string, string>, entryCount: 0 }),
    mergeMap(
      async ({ data, entryCount }) => {
        await fs.mkdir(fsPath.dirname(filePath), { recursive: true });
        const fileHandle = await fs.open(filePath, 'w');
        try {
          await fileHandle.writeFile(JSON.stringify(data, null, 2));
        } finally {
          await fileHandle.close();
        }

        return {
          filePath,
          entryCount,
        };
      },
    ),
  );
