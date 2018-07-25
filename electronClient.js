const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const exec = require('child_process').exec
const url = require('url')
const fs = require('fs')

/* ----------------------------------------------------------- */
/* -------------------------- SETUP -------------------------- */
/* ----------------------------------------------------------- */

process.env.NODE_ENV = 'production'

app.on('ready', function () {
	let mainWindow = new BrowserWindow({ width: 1060, height: 750, minWidth: 800, minHeight: 730 })

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
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

// TODO: Rimuovere

/* ipcMain.on('sdn:connect', function (_, networkName, controllerName) {
	if(_isWindows) throw new Error('TODO')

	networkName = 'netkit_$(id -u)_' + networkName
	controllerName = 'netkit_$(id -u)_' + controllerName
	let createNetworkCommand = 'docker network create ' + networkName	// TODO: Servono altri parametri (es. IP range)
	let connectCommand = 'docker network connect ' + networkName + ' ' + controllerName

	console.log('Creating network (' + createNetworkCommand + ')')
	exec(createNetworkCommand)
	
	console.log('Connecting new network to controller within 2 seconds (' + connectCommand + ')\n')
	setTimeout(() => {
		exec(connectCommand)
	}, 2000)
})

ipcMain.on('sdn:disconnect', function (_, networkName, controllerName) {
	if(_isWindows) throw new Error('TODO')

	networkName = 'netkit_$(id -u)_' + networkName
	controllerName = 'netkit_$(id -u)_' + controllerName
	let disconnectCommand = 'docker network disconnect ' + networkName + ' ' + controllerName
	let deleteNetworkCommand = 'docker network rm ' + networkName

	console.log('Disconnecting ' + controllerName + '(' + disconnectCommand + ')')
	exec(disconnectCommand)

	console.log('Deleting network within 2 seconds (' + deleteNetworkCommand + ')\n')
	setTimeout(() => {
		exec(deleteNetworkCommand)
	}, 2000)
}) 
*/