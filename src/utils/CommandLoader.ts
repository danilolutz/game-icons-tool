import fs from "fs";
import { Command } from "commander";
import { ICommand } from "../interfaces/ICommand";

export class CommandLoader {
  constructor(private readonly program: Command) {
    //
  }

  async loadCommands(commandsPath: string, commandServices: Map<string, any>) {
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      let filePath = `../commands/${file}`.replace(/\\/g, "/");

      try {
        const { default: commandClass } = await import(filePath);

        if (commandClass && typeof commandClass === "function") {
          const commandInstance: ICommand = new commandClass(this.program, commandServices);

          this.program
            .command(commandInstance.command)
            .description(commandInstance.description)
            .action(commandInstance.execute.bind(commandInstance));
        }
      } catch (error) {
        console.error(`Error importing command from ${filePath}:`, error);
      }
    }
  }
}
