import chalk from "chalk";
import { ICommand } from "../interfaces/ICommand";
import { Command } from "commander";
import Table from "cli-table3";
import figlet from "figlet";

export default class ListCommand implements ICommand {
  command: string = "generate <language> <output>";
  description: string =
    "Generates a class for icon mapping\n\nExample: gameicons generate dart downloads/code";
  constructor(
    private readonly program: Command,
    private readonly services: Map<string, any>
  ) {
    //
  }

  execute(language: string, output: string): void {
    console.log(chalk.green.bold("Generate command\n"));

    if (!language) {
      console.log(
        chalk.red.bold(
          "Generate command requires the language argument!\n\nExample: gameicons generate dart downloads/code"
        )
      );
    }

    if (!output) {
      console.log(
        chalk.red.bold(
          "Generate command requires the output argument!\n\nExample: gameicons generate dart downloads/code"
        )
      );
    }
  }
}
