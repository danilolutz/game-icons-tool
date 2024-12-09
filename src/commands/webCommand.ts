import { ICommand } from "../interfaces/ICommand.js";
import { Command } from "commander";
import path from "path";
import { SVGIcons2SVGFontStream } from "svgicons2svgfont";
import { createReadStream, createWriteStream, ReadStream } from "fs";
import fs, { ensureDirSync } from "fs-extra";
import { SingleBar, Presets } from "cli-progress";
import chalk from "chalk";

interface GlyphReadStream extends ReadStream {
  metadata?: {
    unicode: string[];
    name: string;
  };
}

type SvgFile = {
  name: string;
  path: string;
};

export default class WebCommand implements ICommand {
  private readonly files: SvgFile[] = [];
  private readonly buffer: string[] = [];
  private readonly progressBar: SingleBar;

  command = "web <source> <output>";
  description = `Generates svg and css for web icons.\n\nExample: gameicons web workspace/downloads workspace/web`;

  constructor(
    private readonly program: Command,
    private readonly services: Map<string, any>
  ) {
    this.progressBar = new SingleBar(
      {
        noTTYOutput: true,
        forceRedraw: true,
        format: "{type} {bar} {percentage}% | {value}/{total}",
        hideCursor: true,
      },
      Presets.shades_classic
    );
  }

  private async getSvgFiles(dir: string): Promise<SvgFile[]> {
    const entries = await fs.promises.readdir(`${dir}`, {
      withFileTypes: true,
    });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await this.getSvgFiles(fullPath);
        } else if (entry.name.endsWith(".svg")) {
          this.files.push({ name: entry.name, path: fullPath });
        }
      })
    );

    this.files.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    return this.files;
  }

  private async generateSvg(output: string) {
    let fileCount = 0;
    let unicodeCounter = 0xE900;

    const options = {
      fontName: "GameIcons",
      log: console.log,
    };

    const fontStream = new SVGIcons2SVGFontStream(options);
    const fontFilePath = path.join(output, "GameIcons.svg");
    fontStream.pipe(createWriteStream(fontFilePath));

    this.progressBar.start(this.files.length, 0, {
      type: "Generating svg",
    });

    for (const svgFile of this.files) {
      const { path: filePath, name: fileName } = svgFile;
      let iconName = path.parse(fileName).name;

      const included = this.buffer.filter((i) => i == iconName);
      this.buffer.push(iconName);
      if (included.length > 0) {
        iconName = `${iconName}-${included.length}`;
      }

      const unicodeValue = String.fromCharCode(unicodeCounter++);
      const glyph: GlyphReadStream = createReadStream(filePath);
      glyph.metadata = { unicode: [unicodeValue], name: iconName };

      fontStream.write(glyph);
      this.progressBar.update(++fileCount);
    }

    fontStream.end();

    this.progressBar.stop();

    await new Promise<void>((resolve, reject) => {
      fontStream.on("finish", resolve);
      fontStream.on("error", reject);
    });
  }

  private async generateCss(output: string) {
    let unicodeCounter = 0xe0001;
    let fileCount = 0;
    const cssFilePath = path.join(output, "GameIcons.css");
    const cssStream = createWriteStream(cssFilePath);

    this.progressBar.start(this.files.length, 0, {
      type: "Generating css",
    });

    cssStream.write(
      `@font-face {
  font-family: 'GameIcons';
  src: url('GameIcons.svg') format('svg');
  font-weight: normal;
  font-style: normal;
}

.game-icon {
  font-family: 'GameIcons';
  display: inline-block;
  font-style: normal;
  font-weight: normal;
  line-height: 1;
}

.game-icon::before {
  content: attr(data-icon);
  font-family: 'GameIcons';
}
`
    );

    for (const svgFile of this.files) {
      const { name: fileName } = svgFile;
      let iconName = path.parse(fileName).name;

      const included = this.buffer.filter((i) => i == iconName);
      this.buffer.push(iconName);
      if (included.length > 0) {
        iconName = `${iconName}-${included.length}`;
      }

      const unicodeValue = String.fromCharCode(unicodeCounter++);

      const cssLine = `.game-icon-${iconName}::before { content: '\\${unicodeValue}'; }\n`;

      cssStream.write(cssLine);

      this.progressBar.update(++fileCount);
    }

    cssStream.end();

    this.progressBar.stop();

    await new Promise<void>((resolve, reject) => {
      cssStream.on("finish", resolve);
      cssStream.on("error", reject);
    });
  }

  async execute(source: string, output: string): Promise<void> {
    console.log(chalk.green.bold("Web command\n"));

    if (!source) {
      console.log(
        chalk.red.bold(
          "Web command requires the source argument!\n\nExample: gameicons web downloads downloads/web"
        )
      );
    }

    if (!output) {
      console.log(
        chalk.red.bold(
          "Wev command requires the output argument!\n\nExample: gameicons web downloads downloads/web"
        )
      );
    }

    ensureDirSync(output);
    console.log(`Output folder "${output}" was ready!\n`);

    await this.getSvgFiles(`${source}/icons`);

    await this.generateSvg(output);

    await this.generateCss(output);

    console.log(`\n\nFiles generated successfully at: "${output}"!\n`);
  }
}
