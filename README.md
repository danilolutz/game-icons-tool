# Game Icons Tool

A CLI tool to create icons svg, css and others like dart icons class from https://game-icons.net.

## Available commands

Check all commands added until now on the table bellow:

| Command  | Parameters                                                                                                                               | Description                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| download | **output**: path to put files in.                                                                                                        | To download the icons from https://game-icons.net. |
| font     | **source**: path to get files from.<br /><br />**output**: path to put files in.                                                         | To generate ttf font getting data from source.     |
| generate | **language**: language to generate code for.<br /><br />**source**: path to get files from.<br /><br />**output**: path to put files in. | To generate code files.                            |
| list     | no parameters.                                                                                                                           | List all commands.                                 |
| web      | **source**: path to get files from.<br /><br />**output**: path to put files in.                                                         | To generate web css and svg.                       |

### Usage flow

This section shows to you an usage flow, typically you always need to download files first:

```bash
gameicons download workspace/downloads
```

And now we can use and of the other commands to generate whatever we want:

```bash
gameicons generate dart workspace/downloads workspace/code
```

So, simple hein!?

## Installation

```bash
yarn global add gameicons # or npm install --global gameicons
```

Thanks for use!



---
Made with :heart: by [Danilo Lutz](https://github.com/danilolutz).