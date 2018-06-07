const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const exec = require('child_process').exec
const fs = require('fs')

var isWin = /^win/.test(process.platform)

// SET ENV
process.env.NODE_ENV = 'production'

let mainWindow

let tmp_folder = app.getPath('userData')

app.on('ready', function () {

  mainWindow = new BrowserWindow({ width: 1060, height: 750, minWidth: 800, minHeight: 720 })

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

ipcMain.on('script:copy', function (_, script) {
  let pathTemp = path.join(tmp_folder, "script.sh")
  console.log("Saving to " + pathTemp)

  fs.writeFile(pathTemp, script, function (err) {
    if (err) console.log(err)
    else {
      console.log("Running " + pathTemp)
  
      if (isWin)
        exec('"' + pathTemp + '"')
      else
        exec('bash "' + pathTemp + '"')
    }
  })
})

ipcMain.on('script:execute', function () {
  let pathTemp = path.join(tmp_folder, "lab")
  console.log("Running LStart on " + pathTemp)

  if (isWin) 
    exec('start cmd /c \"%NETKIT_HOME%\\lstart -d "\\\"' + pathTemp + '\\\""\"')
  else 
    exec('bash -c \'$NETKIT_HOME/lstart -d "\\\"' + pathTemp + '\\\""\'')
})

ipcMain.on('script:clean', function () {
  let pathTemp = path.join(tmp_folder, "lab")
  console.log("Running LClean on " + pathTemp)

  if (isWin)
    exec('start cmd /c \"%NETKIT_HOME%\\lclean -d "\\\"' + pathTemp + '\\\""\"')
  else
    exec('bash -c \'$NETKIT_HOME/lclean -d "\\\"' + pathTemp + '\\\""\'')
})

// Create menu template
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