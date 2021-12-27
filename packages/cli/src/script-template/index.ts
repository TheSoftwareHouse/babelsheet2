type ScriptTemplate = {
  title: string;
  fileName: string;
};

export const scriptTemplates: ScriptTemplate[] = [
  {
    title: 'Flat JSON per language (recommended for SPA apps)',
    fileName: 'flat-json-per-lang.ts.template',
  },
  {
    title: 'Nested JSON per language and 1st level category (recommended for Next.js apps)',
    fileName: 'nested-json-per-category.ts.template',
  },
  {
    title: 'Nested JSON per language',
    fileName: 'nested-json-per-lang.ts.template',
  },
];
