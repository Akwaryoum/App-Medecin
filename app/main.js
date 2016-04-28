'use strict';

var DEBUG = false;

const spawn = require('child_process').spawn;
const path = require('path');

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 980, height: 700});
    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // Open the DevTools.
    if (DEBUG)
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
	});

	mainWindow.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		require('shell').openExternal(url);
	});
}

function handleStartupEvent () {
	if (process.platform !== 'win32') {
		return false;
	}
	
	var squirrelCommand = process.argv[1];
	const target = path.basename(process.execPath)
	
	if (squirrelCommand == "--squirrel-install" || squirrelCommand == "--squirrel-updated") {
		run(['--createShortcut=' + target + ''], app.quit);
		return true;
	} else if (squirrelCommand == "--squirrel-uninstall") {
		run(['--removeShortcut=' + target + ''], app.quit)
		return true;
	} else if (squirrelCommand == "--squirrel-obsolete") {
		app.quit();
		return true;
	} else if (squirrelCommand == "--debug") {
		DEBUG = true;
	} else {
		return false;
	}
};

function run(args, done) {
	const updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe")
	spawn(updateExe, args, {
		detached: true
	})
    .on("close", done)
}


if (handleStartupEvent()) {
	return;
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
