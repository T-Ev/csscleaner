# CSS Cleaner VSCode Extension

CSS Cleaner is the light-weight way to clean up your front end refactors. Webpack is nice, but it is a pain to use it to identify class and id definitions that are no longer used or are dead.

## Features

CSS Cleaner VSCode Extension automatically searches your workspace .css files for css class and id definitions and checks your html and js files for usages. If it finds dead css, it will link to it in the console as a nice diagnostic alert.

This only works for definitions in .css files currently (inline css not supported)

## Installation

Clone the repo:

`git clone https://github.com/T-Ev/csscleaner.git`

(Optional) Install VSCE:
`npm install --global @vscode/vsce`

Build package with:
`vsce package`

Then install the extension in vscode:

`code --install-extension csscleaner-0.0.19.vsix`

## Commands

You can trigger a CSS FILE cleaning in the vscode command palette via the "Clean CSS" command or by saving a code file, which highlights all unused CSS classes in the project

You can trigger a MEDIA FILE cleaning in the vscode command palette via the "Clean Media" command, which highlights all unused media files in the project.

You can trigger a JS FILE cleaning in the vscode command palette via the "Clean JS" command, which highlights all implemented class and id usages in the JS files in the project.

## Known Issues

Extension might not find the HTML reference for an ID or class if the HTML is dynamically generated in a JS file. Be sure to double check all unused code before removing it!

## Release Notes

Coming Soon

### 1.0.0

Initial release of csscleaner
