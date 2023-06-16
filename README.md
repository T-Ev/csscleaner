# CSS Cleaner VSCode Extension

CSS Cleaner is the light-weight way to clean up your front end refactors. Webpack is nice, but it is a pain to use it to identify class and id definitions that are no longer used or are dead.

## Features

CSS Cleaner VSCode Extension automatically searches your workspace .css files for css class and id definitions and checks your html and js files for usages. If it finds dead css, it will link to it in the console as a nice diagnostic alert.

This only works for definitions in .css classes currently (inline css not supported)

## Installation

Clone the repo:

`git clone https://github.com/T-Ev/csscleaner.git`

Then install the extension in vscode:

`code --install-extension csscleaner.vsix`

## Commands

You can trigger a cleaning in the vscode command palette via the "Clean CSS" command

## Known Issues

Only .css files searched for style definitions

## Release Notes

Coming Soon

### 1.0.0

Initial release of csscleaner
