import chalk from "chalk";
import { ICommand } from "../interfaces/ICommand";
import { Command } from "commander";
import Table from "cli-table3";
import figlet from "figlet";

export default class ListCommand implements ICommand {
  command: string = "list";
  description: string = "List available commands";

  constructor(
    private readonly program: Command,
    private readonly services: Map<string, any>
  ) {
    //
  }

  execute(): void {
    const table = new Table({
      head: [chalk.green.bold("Command"), chalk.green.bold("Description")],
      colWidths: [12, 68],
    });

    this.program.commands.forEach((cmd) => {
      table.push([cmd.name(), cmd.description()]);
    });

    console.log(
      chalk.green(
        figlet.textSync("GameIcons", {
          font: "Basic",
          horizontalLayout: "default",
          verticalLayout: "default",
          width: 80,
          whitespaceBreak: true,
        })
      )
    );
    console.log(
      "Version: " +
        this.program.version() +
        "\n\n" +
        this.program.description() +
        "\n"
    );

    console.log(table.toString());
  }
}
