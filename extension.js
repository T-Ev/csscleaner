const vscode = require("vscode");
const URI = require("vscode-uri").URI;

/**
 * @param {vscode.ExtensionContext} context
 */
let diagGroup = null;
let mediaDiagGroup = null;
let jsDiagGroup = null;
function activate(context) {
  console.log('Congratulations, your extension "csscleaner" is now active!');

  context.subscriptions.push(vscode.commands.registerCommand("csscleaner.clean", grabfiles));
  let onsave = vscode.commands.registerCommand("csscleaner.onSave", function () {
    vscode.window.showInformationMessage("File Saved");
  });

  let onCleanMedia = vscode.commands.registerCommand("csscleaner.onCleanMedia", findMediaFiles);
  vscode.window.showInformationMessage("Hello World from cssCleaner!");
  context.subscriptions.push(onCleanMedia);
  context.subscriptions.push(onsave);
  let onCleanJS = vscode.commands.registerCommand("csscleaner.onCleanJS", grabFilesForJS);
  context.subscriptions.push(onCleanJS);
  diagGroup = vscode.languages.createDiagnosticCollection("CSS Cleaner");
  context.subscriptions.push(diagGroup);
  mediaDiagGroup = vscode.languages.createDiagnosticCollection("Media Cleaner");
  context.subscriptions.push(mediaDiagGroup);
  jsDiagGroup = vscode.languages.createDiagnosticCollection("JS Cleaner");
  context.subscriptions.push(jsDiagGroup);
  subscribeToDocumentChanges(context, diagGroup);
}

async function findMediaFiles() {
  mediaDiagGroup.clear();
  let m = await vscode.workspace.findFiles("**/**.{png,jpg,svg,gif,mp3,mp4,wav}", "**/{node_modules,components,mobileui,locales,res,docs,.monaca}/");
  let h = await vscode.workspace.findFiles("**/**.{html,hbs,js,css}", "**/{node_modules,components,mobileui,img,locales,res,docs,.monaca}/");
  let txt = [];
  for (var hind = 0; hind < h.length; hind++) {
    await vscode.workspace.openTextDocument(h[hind].fsPath).then((doc) => {
      let b = h[hind].path.split("/");
      txt.push({ filename: b[b.length - 1], path: h[hind].fsPath, content: doc });
    });
  }
  for (var mind = 0; mind < m.length; mind++) {
    let b = m[mind].path.split("/");
    let mediaName = b[b.length - 1];
    console.log("Searching " + mediaName);
    let res = [];
    let mediadiags = [];
    txt.forEach((ele) => {
      let cont = ele.content.getText();
      if (cont.includes(mediaName)) {
        // console.log("found " + mediaName + " in " + ele.content.uri);
        for (let lineIndex = 0; lineIndex < ele.content.lineCount; lineIndex++) {
          const lineOfText = ele.content.lineAt(lineIndex);
          if (lineOfText.text.includes(mediaName)) res.push({ line: lineIndex, lineText: lineOfText, class: mediaName, fileName: ele.path });
        }
        // let splithtml = cont.split("\r\n");
        // for (var l = 0; l < splithtml.length; l++) {
        //   res.push({ line: l, lineText: splithtml[l], content: splithtml, class: mediaName, fileName: ele.filename });
        // }
      }
    });

    if (res.length == 0) {
      //found one
      console.log(mediaName + " is Unused in HTML/JS---------------------");
      mediadiags.push(createMediaDiagnostic(m[mind].fsPath, { text: "This" }, 0, "This", true));
      // console.log(mediadiags);
      // vscode.window.showInformationMessage(st + " is Unused in HTML/JS---------------------");
    } else {
      console.log(mediaName + " is used " + res.length + " times");
      console.log(res);
      res.forEach((fin) => {
        // console.log(fin);
        mediadiags.push(createMediaDiagnostic(fin.fileName, fin.lineText, fin.line, mediaName, false));
      });
      // console.log(mediadiags);
    }
    if (mediadiags.length > 0) mediaDiagGroup.set(URI.file(m[mind].path), mediadiags);
  }
}

async function grabfiles(doc) {
  if (doc && diagGroup) diagGroup.delete(doc.uri);
  if (!vscode.workspace || typeof vscode.workspace.workspaceFolders === "undefined") {
    return vscode.window.showErrorMessage("Please open a project folder first");
  }
  console.log(decodeURIComponent(vscode.workspace.workspaceFolders[0].uri));
  const folderPath = decodeURIComponent(vscode.workspace.workspaceFolders[0].uri).split(":")[2] + "bot/";

  let c = await vscode.workspace.findFiles("**/**.css", "**/{node_modules,components,mobileui,img,locales,res,docs,.monaca}/");
  let h = await vscode.workspace.findFiles("**/**.{html,hbs,js}", "**/{node_modules,components,mobileui,img,locales,res,docs,.monaca}/");
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

async function grabFilesForJS(doc) {
  if (doc && jsDiagGroup) jsDiagGroup.delete(doc.uri);
  let j = await vscode.workspace.findFiles("**/**.js", "**/{node_modules,components,mobileui,img,locales,res,docs,.monaca}/");
  let h = await vscode.workspace.findFiles("**/**.{html,hbs}", "**/{node_modules,components,mobileui,img,locales,res,docs,.monaca}/");
  let jsf = [],
    htmlf = [];
  for (var jind = 0; jind < j.length; jind++) {
    await vscode.workspace.openTextDocument(j[jind].fsPath).then((doc) => {
      let b = j[jind].path.split("/");
      jsf.push({ filename: b[b.length - 1], path: j[jind].fsPath, content: doc });
    });
  }
  for (var hind = 0; hind < h.length; hind++) {
    await vscode.workspace.openTextDocument(h[hind].fsPath).then((doc) => {
      let b = h[hind].path.split("/");
      htmlf.push({ filename: b[b.length - 1], path: h[hind].fsPath, content: doc });
    });
  }
  //parse each js file
  let tested = [];
  let missing = [];

  //loop through each file
  jsf.forEach((ele2) => {
    let d = [];

    let lines = ele2.content.getText().split("\r\n");
    lines.forEach((cont, ind) => {
      let classIdReg = /(?:\$\("\.|\$\("#|, \.|, #)+/g;
      let tokens = cont.split(classIdReg); // split by id
      // console.log(tokens);
      // if(classIdReg.test(cont)){
      if (tokens.length > 1) {
        for (let tokind = 1; tokind < tokens.length; tokind++) {
          let res = [];
          let cleanTokArray = tokens[tokind].split(/(?:"\)| )+/g);
          // console.log("array:");
          // console.log(cleanTokArray);
          let cleanTok = cleanTokArray[0];
          if (cleanTok === "") cleanTok = cleanTokArray[1];
          if (!/[\. ]/.test(cleanTok)) {
            // if (tested.includes(cleanTok)) {
            //   console.log(`${cleanTok} aready found`);
            //   if (missing.includes(cleanTok)) console.log(`${cleanTok} Aready found to be MISSING, but found again`);
            //   res.push({ line: lineIndex, lineText: lineOfText, class: cleanTok, fileName: ele.path });
            // } else {
            htmlf.forEach((ele) => {
              for (let lineIndex = 0; lineIndex < ele.content.lineCount; lineIndex++) {
                const lineOfText = ele.content.lineAt(lineIndex);
                if (lineOfText.text.includes(cleanTok)) {
                  // console.log("Foundit: " + cleanTok + " in " + ele.content.uri);
                  res.push({ line: lineIndex, lineText: lineOfText, class: cleanTok, fileName: ele.path });
                }
              }
            });
            // }
            if (res.length == 0) {
              console.log("Found unused: " + cleanTok);
              if (!missing.includes(cleanTok)) missing.push(cleanTok);
              d.push(createDiagnostic(ele2.content, ele2.content.lineAt(ind), ind, cleanTok));
            }
            if (!tested.includes(cleanTok)) tested.push(cleanTok);
          }
        }
      }
    });
    if (d.length > 0) jsDiagGroup.set(ele2.content.uri, d);
  });
  console.log(missing);
  console.log(tested);
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
            if (!splithtml[l].includes(`${st}").on(`)) {
              //make sure it isn't just adding event listener
              //search html and js files for class name
              res.push({ line: l, content: splithtml, class: st });
            }
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
  return new RegExp(`(?:"${Class}"|'${Class}'| ${Class}"| ${Class}'|"${Class} |'${Class} | ${Class} |\.${Class}"|#${Class}"|\.${Class}'|#${Class}'|\.${Class},|#${Class},)+`);
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
  let index = lineOfText.text.indexOf(Class);
  if (index < 0) index = 0;
  // create range that represents, where in the document the word is
  const range = new vscode.Range(lineIndex, index, lineIndex, index + Class.length);

  const diagnostic = new vscode.Diagnostic(range, `${Class} is unused in HTML/JS`, vscode.DiagnosticSeverity.Information);
  diagnostic.code = "css_cleaner";
  return diagnostic;
}
function createMediaDiagnostic(filename, lineOfText, lineIndex, Class, error) {
  // find where in the line of that the 'emoji' is mentioned
  // console.log(lineOfText.text + " :: " + Class);
  const index = lineOfText.text.indexOf(Class);

  // create range that represents, where in the document the word is
  const range = new vscode.Range(lineIndex, index, lineIndex, index + Class.length);
  let diagnostic = null;
  // console.log(filename);
  if (error) diagnostic = new vscode.Diagnostic(range, `${Class} Media is unused in HTML/JS/CSS`, vscode.DiagnosticSeverity.Error);
  else diagnostic = new vscode.Diagnostic(range, `${Class} Media was referenced  at line ${lineIndex} \nin ${filename}`, vscode.DiagnosticSeverity.Information);
  diagnostic.code = "media_cleaner";
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
  // context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(grabfiles));
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => grabfiles(doc)));

  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((doc) => diagGroup.delete(doc.uri)));
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
