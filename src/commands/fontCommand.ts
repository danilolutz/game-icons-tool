import { ICommand } from "../interfaces/ICommand";
import { Command } from "commander";
import path from "path";
import { SVGIcons2SVGFontStream } from "svgicons2svgfont";
import { createReadStream, createWriteStream, ReadStream } from "fs";
import fs, { ensureDirSync } from "fs-extra";
import { SingleBar, Presets } from "cli-progress";
import chalk from "chalk";
import svg2ttf from "svg2ttf";

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

export default class FontCommand implements ICommand {
  private readonly files: SvgFile[] = [];
  private readonly buffer: string[] = [];
  private readonly progressBar: SingleBar;

  command = "font <source> <output>";
  description = `Generates icons ttf font.\n\nExample: gameicons font downloads downloads/font`;

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

  private async generateTtf(output: string) {
    let fileCount = 0;
    let unicodeCounter = 0xE0001;
  
    const options = {
      fontName: "game-icons-font",
      log: console.log,
    };
  
    const svgFontPath = path.join(output, "game-icons-font.svg");
    const fontStream = new SVGIcons2SVGFontStream(options);
    const svgWriteStream = createWriteStream(svgFontPath);
  
    fontStream.pipe(svgWriteStream);
  
    this.progressBar.start(this.files.length, 0, {
      type: "Generating SVG font",
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
  
    await new Promise<void>((resolve, reject) => {
      svgWriteStream.on("finish", resolve);
      svgWriteStream.on("error", reject);
    });
  
    this.progressBar.stop();
  
    console.log(chalk.green.bold("SVG font generated successfully!"));
  
    console.log(chalk.blue.bold("Converting SVG to TTF..."));
  
    const svgFontContent = await fs.promises.readFile(svgFontPath, "utf8");

    if (!svgFontContent || svgFontContent.trim().length === 0) {
      console.log(chalk.red.bold('SVG file is empty or corrupted.'));
    }

    const ttf = svg2ttf(svgFontContent, {});
  
    const ttfPath = path.join(output, "game-icons-font.ttf");
    await fs.promises.writeFile(ttfPath, Buffer.from(ttf.buffer));
  
    console.log(chalk.green.bold(`TTF font generated successfully at ${ttfPath}`));
  }

  async execute(source: string, output: string): Promise<void> {
    console.log(chalk.green.bold("Web command\n"));

    if (!source) {
      console.log(
        chalk.red.bold(
          "Font command requires the source argument!\n\nExample: gameicons generate downloads downloads/font"
        )
      );
    }

    if (!output) {
      console.log(
        chalk.red.bold(
          "Font command requires the output argument!\n\nExample: gameicons generate downloads downloads/font"
        )
      );
    }

    ensureDirSync(output);
    console.log(`Output folder "${output}" was ready!\n`);

    await this.getSvgFiles(`${source}/icons`);

    await this.generateTtf(output);
  }
}
