// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
var glob = require("glob");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
let diagGroup = null;
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "csscleaner" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("csscleaner.clean", grabfiles);
  let onsave = vscode.commands.registerCommand("csscleaner.onSave", function () {
    vscode.window.showInformationMessage("File Saved");
  });
  vscode.window.showInformationMessage("Hello World from cssCleaner!");
  context.subscriptions.push(disposable);
  context.subscriptions.push(onsave);
  diagGroup = vscode.languages.createDiagnosticCollection("CSS Cleaner");
  context.subscriptions.push(diagGroup);
  subscribeToDocumentChanges(context, diagGroup);
}

async function grabfiles() {
  if (!vscode.workspace || typeof vscode.workspace.workspaceFolders === "undefined") {
    return vscode.window.showErrorMessage("Please open a project folder first");
  }
  console.log(decodeURIComponent(vscode.workspace.workspaceFolders[0].uri));
  const folderPath = decodeURIComponent(vscode.workspace.workspaceFolders[0].uri).split(":")[2] + "bot/";

  let c = await vscode.workspace.findFiles("**/**.css", "**/{node_modules,components,mobileui,img,res,docs,.monaca}/");
  let h = await vscode.workspace.findFiles("**/**.{html,hbs,js}", "**/{node_modules,components,mobileui,img,res,docs,.monaca}/");
  let cssf = [],
    htmlf = [];
  for (var cind = 0; cind < c.length; cind++) {
    await vscode.workspace.openTextDocument(c[cind].fsPath).then((doc) => {
      let b = c[cind].path.split("/");
      cssf.push({ filename: b[b.length - 1], path: c[cind].fsPath, content: doc });
    });
  }
  for (var hind = 0; hind < h.length; hind++) {
    await vscode.workspace.openTextDocument(h[hind].fsPath).then((doc) => {
      let b = h[hind].path.split("/");
      htmlf.push({ filename: b[b.length - 1], path: h[hind].fsPath, content: doc });
    });
  }
  console.log("cssf");
  console.log(cssf);
  console.log("htmlf");
  console.log(htmlf);
  await parse(cssf, htmlf, diagGroup);
  // fs.writeFile(path.join(folderPath, 'index.html'), htmlContent, (err) => {
  // 	if (err) {
  // 	  return vscode.window.showErrorMessage('Failed to create boilerplate file! '+err);
  // 	}
  // 	vscode.window.showInformationMessage('Created boilerplate files');
  //   });
}

async function parse(css, html, _diagGroup) {
  //create diagnostic group for each file
  //loop through all defined css classes
  let classesbyfile = css.map((o) => {
    return o.content.getText().split(/\n\.|\n#/g);
  });

  classesbyfile.forEach((file, ind) => {
    let doc = css[ind].content;
    let classes = cleanCSS(file);
    const diagnostics = [];
    classes[0].forEach((st) => {
      let res = [];
      html.forEach((ele) => {
        // console.log(ele.content);
        let splithtml = ele.content.getText().split("\r\n");
        for (var l = 0; l < splithtml.length; l++) {
          if (constructReg(st).test(splithtml[l])) {
            //search html and js files for class name
            res.push({ line: l, content: splithtml, class: st });
          }
        }
      });
      if (res.length == 0) {
        //found one
        console.log(st + " is Unused in HTML/JS---------------------");
        getDiagnostic(diagnostics, doc, st);
        // vscode.window.showInformationMessage(st + " is Unused in HTML/JS---------------------");
      } else {
        console.log(st + " is used " + res.length + " times");
      }
    });
    if (diagnostics.length > 0) _diagGroup.set(doc.uri, diagnostics);
  });
}
function getDiagnostic(diagnosticsArray, doc, Class) {
  for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
    const lineOfText = doc.lineAt(lineIndex);
    if (new RegExp(`(?:^\.${Class}|^#${Class})`).test(lineOfText.text)) {
      // if (lineOfText.text.includes(Class)) {
      diagnosticsArray.push(createDiagnostic(doc, lineOfText, lineIndex, Class));
    }
  }
}

function constructReg(Class) {
  // console.log(RegExp(`(?:${Class})+`));
  return new RegExp(`(?:"${Class}"|'${Class}'| ${Class}"| ${Class}'|"${Class} |'${Class} | ${Class} |\.${Class}"|#${Class}"|\.${Class}'|#${Class}')+`);
}

function cleanCSS(css) {
  let res = [];
  let search = [];
  for (var i = 0; i < css.length; i++) {
    if (css[i].indexOf("/*") > 2 || css[i].indexOf("/*") < 0) {
      //is this line not commented out
      if (css[i].endsWith(",\r") || css[i].endsWith(",\r\n")) {
        //if comma line
        // console.log("Found comma line: " + css[i]);
        let ind = i;
        while (typeof css[ind].split("{")[1] === "undefined") ind++;
        css[i] = css[i].replace(",\r", "") + " {" + css[ind].split("{")[1];
      }
      if (css[i].startsWith(".") || css[i].startsWith("#")) css[i] = css[i].substring(1); //remove leading # and .
      if (css[i] !== "" && !css[i].startsWith(":") && !css[i].includes(",\r")) {
        let searchterm = css[i].split(/(?:\s|::|\.)+/)[0];
        if (!search.includes(searchterm)) {
          res.push(css[i].replace(/\n|\r/g, ""));
          search.push(searchterm);
        }
      } else {
        // console.log("still has commas or is empty: " + css[i]);
      }
    } else {
      // console.log("Found comment: " + css[i].substring(0, 20));
    }
  }
  return [search, res];
}

function createDiagnostic(doc, lineOfText, lineIndex, Class) {
  // find where in the line of that the 'emoji' is mentioned
  const index = lineOfText.text.indexOf(Class);

  // create range that represents, where in the document the word is
  const range = new vscode.Range(lineIndex, index, lineIndex, index + Class.length);

  const diagnostic = new vscode.Diagnostic(range, `Class ${Class} is unused in HTML/JS:: ${lineOfText.text}`, vscode.DiagnosticSeverity.Information);
  diagnostic.code = "css_cleaner";
  return diagnostic;
}
function subscribeToDocumentChanges(context, diagGroup) {
  // if (vscode.window.activeTextEditor) {
  //   refreshDiagnostics(vscode.window.activeTextEditor.document, diagGroup);
  // }
  // context.subscriptions.push(
  //   vscode.window.onDidChangeActiveTextEditor((editor) => {
  //     if (editor) {
  //       refreshDiagnostics(editor.document, diagGroup);
  //     }
  //   })
  // );
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(grabfiles));
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(grabfiles));

  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((doc) => diagGroup.delete(doc.uri)));
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
