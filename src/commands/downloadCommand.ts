import axios from "axios";
import path from "path";
import { createWriteStream } from "fs";
import { ICommand } from "../interfaces/ICommand.js";
import { Command } from "commander";
import { ensureDirSync } from "fs-extra";
import AdmZip from "adm-zip";
import chalk from "chalk";

export default class DownloadCommand implements ICommand {
  command = "download <output>";
  description = `Download the icons zip from https://game-icons.net to the output\ndirectory.\n\nExample: gameicons download downloads`;

  constructor(
    private readonly program: Command,
    private readonly services: Map<string, any>
  ) {
    //
  }

  async execute(output: string): Promise<void> {
    console.log(chalk.green.bold("Download command\n"));

    if (!output) {
      console.log(
        chalk.red.bold(
          "Download command requires the output argument!\n\nExample: gameicons download workspace/downloads"
        )
      );
    }

    const url =
      "https://game-icons.net/archives/svg/zip/000000/transparent/game-icons.net.svg.zip";
    try {
      ensureDirSync(output);
      console.log(`Output folder "${output}" was ready!`);

      const fileName = path.basename(url);
      const filePath = path.join(output, fileName);

      const response = await axios.get(url, { responseType: "stream" });

      const writer = createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        console.log(`File downloaded successfully at: ${filePath}`);

        try {
          console.log("Starting unzipping...");
          const zip = new AdmZip(filePath);
          zip.extractAllTo(output, true);
          console.log("Unzipping successfully completed at: ", `${output}/icons`);
        } catch (error) {
          console.error("Unzipping error:", error);
        }
      });

      writer.on("error", (err) => {
        console.error(`Error saving file: ${err}`);
      });
    } catch (error: any) {
      console.error(`Error downloading file: ${error.message}`);
    }
  }
}
