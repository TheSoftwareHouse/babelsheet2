#!/usr/bin/env node

'use strict';

import {commands} from "./command";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Type: babelsheet2 <command>\n");
  console.log("Available commands:");
  commands.forEach(
    command => console.log(`${command.name} - ${command.description}`)
  );

  process.exit(0);
}

const inputCommand = args[0];
const command = commands.find(({ name }) => name === inputCommand);

if (!command) {
  console.error(`Unknown command: ${inputCommand}`);
  process.exit(1);
}

command.handler();
