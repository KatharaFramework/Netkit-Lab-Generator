const electron = require('electron');
const path = require('path');
const url = require('url');
const exec = require('child_process').exec;
const fs = require('fs');

var isWin = /^win/.test(process.platform);

// SET ENV
process.env.NODE_ENV = 'development';

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;

var tmp_folder = app.getPath('userData');
//console.log(tmp_folder);

// Listen for app to be ready
app.on('ready', function(){
  // Create new window
  mainWindow = new BrowserWindow({width: 1366, height: 768});
  // Load html in window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes:true
  }));
  mainWindow.isWin = isWin;
  // Quit app when closed
  mainWindow.on('closed', function(){
    app.quit();
  });

  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);
});


ipcMain.on('script:copy', function(e, script){
  //console.log(script);
  console.log("Saving to " + path.join(tmp_folder, "script.sh"));
  fs.writeFile(path.join(tmp_folder, "script.sh"), script, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The script file was saved to " + path.join(tmp_folder, "script.sh"));
    console.log("Running " + path.join(tmp_folder, "script.sh"));
    exec((isWin ? '':'bash ') + path.join(tmp_folder, "script.sh"), function (err, stdout, stderr) {
        //console.log(err, stdout, stderr);
        return;
    });
  }); 
  
});
ipcMain.on('script:execute', function(e){
  console.log("Running LStart on " + path.join(tmp_folder, "lab"));
  if(isWin) {
    exec('start cmd /c "%NETKIT_HOME%\\lstart -d ' + path.join(tmp_folder, "lab") + '"', function (err, stdout, stderr) {
        //console.log(err, stdout, stderr);
        return;
    });
  }
  else {
    exec('bash -c "$NETKIT_HOME/lstart -d ' + path.join(tmp_folder, "lab") + '"', function (err, stdout, stderr) {
        //console.log(err, stdout, stderr);
        return;
    });
  }
});

ipcMain.on('script:clean', function(e){ 
  console.log("Running LClean on " + path.join(tmp_folder, "lab"));
  if(isWin) {
    exec('start cmd /c "%NETKIT_HOME%\\lclean -d ' + path.join(tmp_folder, "lab") + '"', function (err, stdout, stderr) {
        //console.log(err, stdout, stderr);
        return;
    });
  }
  else {
    exec('bash -c "$NETKIT_HOME/lclean -d ' + path.join(tmp_folder, "lab") + '"', function (err, stdout, stderr) {
        //console.log(err, stdout, stderr);
        return;
    });
  }
});

// Create menu template
const mainMenuTemplate =  [
  // Each object is a dropdown
  {
    label: 'File',
    submenu:[
      {
        label: 'Quit',
        accelerator:process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click(){
          app.quit();
        }
      }
    ]
  }
];

// If OSX, add empty object to menu
if(process.platform == 'darwin'){
  mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if(process.env.NODE_ENV !== 'production'){
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu:[
      {
        role: 'reload'
      },
      {
        label: 'Toggle DevTools',
        accelerator:process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow){
          focusedWindow.toggleDevTools();
        }
      }
    ]
  });
}