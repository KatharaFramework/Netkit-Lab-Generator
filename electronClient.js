const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const url = require("url");
const fs = require("fs");

/* ----------------------------------------------------------- */
/* -------------------------- SETUP -------------------------- */
/* ----------------------------------------------------------- */

app.on("ready", function () {
	let mainWindow = new BrowserWindow({ minWidth: 770, minHeight: 500 });

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, "/index.html"),
		protocol: "file:",
		slashes: true
	}));

	mainWindow.on("closed", function () {
		app.quit();
	});

	console.log()
});

/* ---------------------------------------------------------- */
/* ------------------------- EVENTS ------------------------- */
/* ---------------------------------------------------------- */

let _baseFolder = app.getPath("userData");

let _isWindows = false; // TODO: Sviluppare e testare anche su Windows

function _runKatharaCommand(command){
	let prefix = _isWindows ? "start cmd /c \"%NETKIT_HOME%\\" : "";
	exec(prefix + command + (_isWindows ? "\"" : ""), (stderr) => { console.error(stderr) });
}

/* ------------------------- SCRIPT ------------------------- */

ipcMain.on("script:copy", function (_, script, filename) {
	let pathTemp = path.join(_baseFolder, filename);
	console.log("Saving script to " + pathTemp);

	fs.writeFileSync(pathTemp, script)
	
	console.log("Running " + pathTemp);
	exec((_isWindows ? "\"" : "bash \"") + pathTemp + "\"");
});

ipcMain.on("script:execute", function () {
	let pathTemp = path.join(_baseFolder, "lab");
	
	console.log("Running LStart on " + pathTemp);
	_runKatharaCommand("kathara lstart -d \"" + pathTemp + "\"");
});

ipcMain.on("script:clean", function () {
	let pathTemp = path.join(_baseFolder, "lab");
	
	console.log("Running LClean on " + pathTemp);
	_runKatharaCommand("kathara lclean -d \"" + pathTemp + "\"");
});
