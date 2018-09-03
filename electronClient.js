const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const { exec } = require('child_process')
const url = require('url')
const fs = require('fs')

/* ----------------------------------------------------------- */
/* -------------------------- SETUP -------------------------- */
/* ----------------------------------------------------------- */

process.env.NODE_ENV = 'production'

app.on('ready', function () {
	let mainWindow = new BrowserWindow({ minWidth: 770, minHeight: 500 })

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, '/src/index.html'),
		protocol: 'file:',
		slashes: true
	}))

	mainWindow.on('closed', function () {
		app.quit()
	})

	if (process.env.NODE_ENV !== 'production') {
		const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
		Menu.setApplicationMenu(mainMenu)
	}
})

const mainMenuTemplate = [
	// Each object is a dropdown
	/*{
	  label: 'File',
	  submenu:[
		{
		  label: 'Quit',
		  accelerator:process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
		  click(){
			app.quit()
		  }
		}
	  ]
	}*/
]

// If OSX, add empty object to menu
if (process.platform == 'darwin') {
	mainMenuTemplate.unshift({})
}

// Add developer tools option if in dev
if (process.env.NODE_ENV !== 'production') {
	mainMenuTemplate.push({
		label: 'Developer Tools',
		submenu: [
			{
				role: 'reload'
			},
			{
				label: 'Toggle DevTools',
				accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
				click(item, focusedWindow) {
					focusedWindow.toggleDevTools()
				}
			}
		]
	})
}

/* ---------------------------------------------------------- */
/* ------------------------- EVENTS ------------------------- */
/* ---------------------------------------------------------- */

let _baseFolder = app.getPath('userData'), _isWindows = /^win/.test(process.platform)

function _runKatharaCommand(command){	// Oss. Non l'ho chiamato runNetkit... perché Netkit non include in $NETKIT_HOME la cartella bin. Qui è sottintesa
	let prefix = _isWindows ? 'start cmd /c \"%NETKIT_HOME%\\' : '$NETKIT_HOME/'
	exec(prefix + command + (_isWindows ? '"' : ''))
}

/* ------------------------- SCRIPT ------------------------- */

ipcMain.on('script:copy', function (_, script, filename) {
	let pathTemp = path.join(_baseFolder, filename)
	console.log("Saving script to " + pathTemp)

	fs.writeFile(pathTemp, script, function (err) {
		if (err) console.log(err)
		else {
			console.log("Running " + pathTemp + '\n')
			exec((_isWindows ? '"' : 'bash "') + pathTemp + '"')
		}
	})
})

ipcMain.on('script:execute', function () {
	let pathTemp = path.join(_baseFolder, "lab")
	
	console.log("Running LStart on " + pathTemp + '\n')
	_runKatharaCommand('lstart -d \"' + pathTemp + '\"')
})

ipcMain.on('script:clean', function () {
	let pathTemp = path.join(_baseFolder, "lab")
	
	console.log("Running LClean on " + pathTemp + '\n')
	_runKatharaCommand('lclean -d \"' + pathTemp + '\"')
})

/* --------------------------- SDN --------------------------- */
// TODO: Anziché usare i comandi docker si potrebbe usare il comando vstart
// TODO: Controllare che funzioni anche su windows


ipcMain.on('sdn:connect', function () {
	let prefix = 'netkit_$(id -u)_'
	let machineName = prefix + 'sdn-interfacenode'
	
	console.log("Starting interface container")
	// TODO: E se l'avessi già lanciato ma non l'avessi rimosso?
	exec('docker run -d --privileged=true -p 8080:3000 --name ' + machineName + ' kathara/netkit_extended',
		function(){
			console.log("Connecting interface container\n")
			exec('docker network connect ' + prefix + 'SDNRESERVED ' + machineName, function(_, _, stderr){
				if(stderr) console.log(stderr)
				exec('docker exec ' + machineName + ' ifconfig eth1 192.168.100.254 up')
			})
		}
	)
})

ipcMain.on('sdn:disconnect', function () {
	let machineName = 'netkit_$(id -u)_sdn-interfacenode'
	
	console.log("Stopping interface container and removing it\n")
	exec('docker container rm -f ' + machineName)
})