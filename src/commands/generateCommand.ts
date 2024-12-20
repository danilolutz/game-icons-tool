import chalk from "chalk";
import { ICommand } from "../interfaces/ICommand.js";
import { Command } from "commander";
import path from "path";
import { createWriteStream } from "fs";
import fs, { ensureDirSync } from "fs-extra";
import { SingleBar, Presets } from "cli-progress";

type SvgFile = {
  name: string;
  path: string;
};

type StubData = {
  fileName: string;
  headerStub: string;
  bodyStub: string;
  footerStub: string;
};

export default class ListCommand implements ICommand {
  private readonly files: SvgFile[] = [];
  private readonly buffer: string[] = [];
  private readonly progressBar: SingleBar;
  private reservedWords = new Set([
    "abstract",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "default",
    "deferred",
    "do",
    "dynamic",
    "else",
    "enum",
    "export",
    "extends",
    "extension",
    "external",
    "factory",
    "false",
    "final",
    "finally",
    "for",
    "function",
    "get",
    "hide",
    "if",
    "implements",
    "import",
    "in",
    "interface",
    "is",
    "library",
    "mixin",
    "new",
    "null",
    "on",
    "operator",
    "part",
    "required",
    "rethrow",
    "return",
    "set",
    "show",
    "static",
    "super",
    "switch",
    "sync",
    "this",
    "throw",
    "true",
    "try",
    "typedef",
    "var",
    "void",
    "while",
    "with",
    "yield",
  ]);

  private numberMap: Record<string, string> = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
  };

  command: string = "generate <language> <source> <output>";
  description: string =
    "Generates a class for icon mapping\n\nExample: gameicons generate dart workspace/downloads workspace/code";
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

  private getLanguageStub(language: string): StubData {
    switch (language) {
      case "dart":
        return {
          fileName: "game_icons.dart",
          headerStub: `import 'package:flutter/widgets.dart';

class GameIcons {
  GameIcons._();

  static const _kFontFam = 'GameIcons';
  static const String? _kFontPkg = null;\n\n`,
          bodyStub: `  static const IconData #iconName# = IconData(#unicodeValue#, fontFamily: _kFontFam, fontPackage: _kFontPkg);\n`,
          footerStub: `}`,
        };
      default:
        console.log(chalk.red.bold("Language not supported!"));
        throw new Error("Language not supported!");
    }
  }

  private kebabToCamelCase(input: string): string {
    if (/^\d/.test(input)) {
      input = input.replace(/^(\d)/, (digit) => this.numberMap[digit]);
    }

    let camelCase = input.replace(/-([a-z0-9])/g, (_, char) =>
      char.toUpperCase()
    );

    if (this.reservedWords.has(camelCase)) {
      camelCase += "_";
    }

    return camelCase;
  }

  private async generateCode(language: string, output: string) {
    let fileCount = 0;
    let unicodeCounter = 0xe900;

    const stub = this.getLanguageStub(language);

    const fontFilePath = path.join(
      output,
      `${stub.fileName}`
    );
    const codeStream = createWriteStream(fontFilePath);

    this.progressBar.start(this.files.length, 0, {
      type: `Generating ${language.toLowerCase()} code`,
    });

    codeStream.write(stub.headerStub);

    for (const svgFile of this.files) {
      const { name: fileName } = svgFile;
      let iconName = path.parse(fileName).name;

      const included = this.buffer.filter((i) => i == iconName);
      this.buffer.push(iconName);
      if (included.length > 0) {
        iconName = `${iconName}-${included.length}`;
      }

      const unicodeValue = unicodeCounter++;
      const iconNameCamelCase = this.kebabToCamelCase(iconName);

      const codeLine = stub.bodyStub
        .replace("#iconName#", iconNameCamelCase)
        .replace("#unicodeValue#", `0x${unicodeValue.toString(16)}`);

      codeStream.write(codeLine);
      this.progressBar.update(++fileCount);
    }
    codeStream.write(stub.footerStub);
    codeStream.end();

    this.progressBar.stop();

    await new Promise<void>((resolve, reject) => {
      codeStream.on("finish", resolve);
      codeStream.on("error", reject);
    });
  }

  async execute(
    language: string,
    source: string,
    output: string
  ): Promise<void> {
    console.log(chalk.green.bold("Generate command\n"));

    if (!language) {
      console.log(
        chalk.red.bold(
          "Generate command requires the language argument!\n\nExample: gameicons generate dart downloads downloads/code"
        )
      );
    }

    if (!source) {
      console.log(
        chalk.red.bold(
          "Web command requires the source argument!\n\nExample: gameicons generate dart downloads downloads/web"
        )
      );
    }

    if (!output) {
      console.log(
        chalk.red.bold(
          "Generate command requires the output argument!\n\nExample: gameicons generate dart downloads downloads/code"
        )
      );
    }

    ensureDirSync(output);
    console.log(`Output folder "${output}" was ready!\n`);

    await this.getSvgFiles(`${source}/icons`);

    await this.generateCode(language, output);
  }
}
