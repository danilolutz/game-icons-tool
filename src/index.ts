#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import { CommandLoader } from "./utils/CommandLoader";
import { fileURLToPath } from "url";

(async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const program = new Command();

  console.clear();

  program
    .name("gameicons")
    .description(
      "A CLI tool to create icons svg, css and others like dart icons class from game-icons.net"
    )
    .version("1.0.0");

  const services = new Map<string, any>();

  const commandLoader = new CommandLoader(program);
  const commandsPath = path.join(__dirname, "commands");
  await commandLoader.loadCommands(commandsPath, services);

  program.parse();
})();
