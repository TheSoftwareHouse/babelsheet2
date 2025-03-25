import test = require('tape');
import { parseCsv } from '../src/csv-rows-iterator';

test('parseCsv', async () => {
  test('parses csv correctly for "CRLF" end of line', async (t) => {
    const result = await parseCsv(
      [
        '###,>>>,>>>,>>>,>>>',
        ',,,SOME,KEY',
      ].join('\r\n'),
    );

    t.deepEqual(result, [
      ['###', '>>>', '>>>', '>>>', '>>>'],
      [null, null, null, 'SOME', 'KEY'],
    ]);
  });

  test('parses csv correctly for "LF" end of line', async (t) => {
    const result = await parseCsv(
      [
        '###,>>>,>>>,>>>,>>>',
        ',,,SOME,KEY',
      ].join('\n'),
    );

    t.deepEqual(result, [
      ['###', '>>>', '>>>', '>>>', '>>>'],
      [null, null, null, 'SOME', 'KEY'],
    ]);
  });

  test('parses csv correctly for multi-line cells escaped with quotes', async (t) => {
    const result = await parseCsv(
      [
        '###,>>>,>>>,>>>,>>>',
        ',,,"SOME\nTHING",KEY',
      ].join('\r\n'),
    );

    t.deepEqual(result, [
      ['###', '>>>', '>>>', '>>>', '>>>'],
      [null, null, null, 'SOME\nTHING', 'KEY'],
    ]);
  });

  test('parses csv correctly for irregular amount of columns', async (t) => {
    const result = await parseCsv(
      [
        '###,>>>,>>>',
        ',  ,,SOME,KEY',
      ].join('\r\n'),
    );

    t.deepEqual(result, [
      ['###', '>>>', '>>>'],
      [null, null, null, 'SOME', 'KEY'],
    ]);
  });
});
