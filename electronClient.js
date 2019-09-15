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

	// Comment this line if you need to access Developer Tools with ctr+shift+i
	// mainWindow.setMenu(null)

	mainWindow.on("closed", function () {
		app.quit();
	});
});

/* ---------------------------------------------------------- */
/* ------------------------- EVENTS ------------------------- */
/* ---------------------------------------------------------- */

let _baseFolder = app.getPath("userData"), _isWindows = /^win/.test(process.platform);

function _runKatharaCommand(command){
	let prefix = _isWindows ? "start cmd /c \"%NETKIT_HOME%\\" : "$NETKIT_HOME/";
	exec(prefix + command + (_isWindows ? "\"" : ""));
}

/* ------------------------- SCRIPT ------------------------- */

ipcMain.on("script:copy", function (_, script, filename) {
	let pathTemp = path.join(_baseFolder, filename);
	console.log("Saving script to " + pathTemp);

	fs.writeFile(pathTemp, script, function (err) {
		if (err) console.log(err);
		else {
			console.log("Running " + pathTemp + "\n");
			exec((_isWindows ? "\"" : "bash \"") + pathTemp + "\"");
		}
	});
});

ipcMain.on("script:execute", function () {
	let pathTemp = path.join(_baseFolder, "lab");
	
	console.log("Running LStart on " + pathTemp + "\n");
	_runKatharaCommand("lstart -d \"" + pathTemp + "\"");
});

ipcMain.on("script:clean", function () {
	let pathTemp = path.join(_baseFolder, "lab");
	
	console.log("Running LClean on " + pathTemp + "\n");
	_runKatharaCommand("lclean -d \"" + pathTemp + "\"");
});

/* --------------------------- SDN --------------------------- */
// TODO: Controllare che funzioni anche su windows

ipcMain.on("sdn:connect", function (_, ip) {
	let prefix = "netkit_$(id -u)_";
	let machineName = prefix + "sdn-interfacenode";
	
	console.log("Starting interface container");
	// TODO: E se l'avessi già lanciato ma non l'avessi rimosso? Credo che non si possono avere due macchine con lo stesso nome => Nessun problema
	exec("docker run -d --privileged=true -p 8080:3000 --name " + machineName + " kathara/netkit_extended",
		function(){
			console.log("Connecting interface container\n");
			exec("docker network connect " + prefix + "SDNRESERVED " + machineName, function(_, _, stderr){
				if(stderr) console.log(stderr);
				exec("docker exec " + machineName + " ifconfig eth1 " + ip + " up");
			});
		}
	);
});

ipcMain.on("sdn:disconnect", function () {
	let machineName = "netkit_$(id -u)_sdn-interfacenode";
	
	console.log("Stopping interface container and removing it\n");
	exec("docker container rm -f " + machineName);
});