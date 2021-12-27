import { promises as fs } from 'fs';
import path from 'path';

export async function generateScript(
  templateFileName: string,
  targetFile: string,
  variables: Record<string, string> = {},
) {
  let code = await fs.readFile(path.join(__dirname, '../script-template/', templateFileName)).then((buffer) => buffer.toString());

  Object.entries(variables).forEach(
    ([key, value]) => {
      code = code.replace(key, value);
    },
  );

  const targetFileAbsolute = path.join(process.cwd(), targetFile);

  await fs.mkdir(path.dirname(targetFileAbsolute), { recursive: true });
  await fs.writeFile(targetFileAbsolute, code);
}
