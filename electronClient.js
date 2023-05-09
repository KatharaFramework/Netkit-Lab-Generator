const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const url = require("url");
const fs = require("fs");

/* ----------------------------------------------------------- */
/* -------------------------- SETUP -------------------------- */
/* ----------------------------------------------------------- */

let mainWindow, sdnManagerWindow

function startMainWindow(){
	mainWindow = new BrowserWindow({ 
		width: 1280, 
		height: 760,
		minWidth: 800, 
		minHeight: 600,
		icon: '/src/static/images/icons/icon.png'
	});

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, "index.html"),
		protocol: "file:",
		slashes: true
	}));

	mainWindow.setTitle('Netkit-Lab-Generator');

	mainWindow.on("closed", function () {
		mainWindow = null;
		if(!sdnManagerWindow) app.quit();
	});
}

function startSDNManagerWindow(){
	sdnManagerWindow = new BrowserWindow({ minWidth: 770, minHeight: 500 });

	sdnManagerWindow.loadURL(url.format({
		pathname: path.join(__dirname, "src/sdn-manager", "index.html"),
		protocol: "file:",
		slashes: true
	}));

	sdnManagerWindow.setTitle('SDN-Manager');

	sdnManagerWindow.on("closed", function () {
		sdnManagerWindow = null;
		if(!mainWindow) app.quit();
	});
}

app.on("ready", startMainWindow);
// app.on("ready", startSDNManagerWindow);	// DEV

/* ---------------------------------------------------------- */
/* ------------------------- EVENTS ------------------------- */
/* ---------------------------------------------------------- */

let _baseFolder = app.getPath("userData");

function _runKatharaCommand(command){
	exec(command, (stderr) => { if(stderr) console.error(stderr) });
}

ipcMain.on("sdn:start", startSDNManagerWindow);

/* ------------------------- SCRIPT ------------------------- */

ipcMain.on("script:copy", function (_, script, filename) {
	let pathTemp = path.join(_baseFolder, filename);
	console.log("Saving script to " + pathTemp);

	fs.writeFileSync(pathTemp, script)

	console.log("Running " + pathTemp);
	exec("bash \"" + pathTemp + "\"");
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

	if(sdnManagerWindow) sdnManagerWindow.close();
});
