import { promises as fs } from 'fs';

export const fileExists = (filePath: string) => fs
  .access(filePath)
  .then(() => true)
  .catch(() => false);
