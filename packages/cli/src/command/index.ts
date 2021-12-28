import { initCommand } from './init';
import { editCommand } from './edit';
import { uninstallCommand } from './uninstall';

export interface Command {
  name: string;
  description: string;
  handler: () => Promise<void>;
}

export const commands: Command[] = [
  initCommand,
  editCommand,
  uninstallCommand,
];
