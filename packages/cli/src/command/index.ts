import {initCommand} from "./init";
import {editCommand} from "./edit";

export interface Command {
  name: string;
  description: string;
  handler: () => void;
}

export const commands: Command[] = [
  initCommand,
  editCommand,
];