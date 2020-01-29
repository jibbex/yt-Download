/*-----------------------------------------------------------------------------------------------

Copyright © 2019, Manfred Michaelis

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted, provided that the
above copyright notice and this permission notice appear in all copies.


THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT,
OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR
PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

/*-----------------------------------------------------------------------------------------------*/
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { init, saveConfig} = require('./../utils');
const { getFFMPEG, checkForFFMPEG, ffmpeg } = require('./ffmpeg');
const CONST = require('./../const').Constances;

let args = {};
let config;
let mainWindow;

if(require('electron-squirrel-startup')) {
  app.quit();
}

process.argv.forEach((val, index, array) => {
  if(val == 'dev')
    args.isDev = true;

  if(val == 'no-ffmpeg')
    args.noFFMPEG = true;
});

if(process.platform === 'win32') {
  app.setAppUserModelId('de.michm.yt-download');
}

/**
 * App on ready eventhandler callback
 *
 */
const createWindow = async () => {
  const isFfmpegInstalled = (args.noFFMPEG !== undefined) ? false : await checkForFFMPEG();

  config = await init();

  mainWindow = new BrowserWindow({
    width: config.windowSize.width,
    height: config.windowSize.height,
    minWidth: 1050,
    minHeight: 920,
    show: false,
    center: true,
    nativeWindowOpen: true,
    thickFrame: true,
    icon: path.join(__dirname + '/../../assets/images/ico.png'),
    webPreferences: {
      nodeIntegration: true,
			nodeIntegrationInWorker: true
    }
  });

  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`file://${__dirname}/../../assets/index.html`);

  ffmpeg.mainWindow = mainWindow;

  if(args.isDev !== undefined) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', async () => {
		try {
      const size = mainWindow.getSize();
      config.windowSize.width = size[0];
  		config.windowSize.height = size[1];
			await saveConfig(config);
		}
		catch(err) {
			throw err;
		}
	});

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.webContents.send('message', {
      command: 'config',
      config: config,
      ffmpegInstalled: isFfmpegInstalled
    });
	});
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Async communication with the render thread
 *
 * @param {string} event
 * @param {Function(event, args)} callback
 */
ipcMain.on('message', async (event, args) => {
  if(args.command == 'getConfig') {
    event.sender.send('message', {command: 'config', config: config});
  }
  if(args.command == 'saveConfig') {
    try {
      config = await saveConfig(args.config);
      event.sender.send('message', {command: 'saved', config: config})
    }
    catch(err) {
      throw err;
    }
  }
  if(args.command == 'download') {
    let item = args.item;
    item.path = config.folder;
    ffmpeg.download(item);
  }
  if(args.command == 'downloadFFmpeg') {
    try {
      const binaries = await getFFMPEG();

      ffmpeg.ffmpegPath = binaries.ffmpeg;
      event.sender.send('message', {command: 'downloadedFFmpeg'})
    }
    catch(err) {
      console.log(err);
      event.sender.send('message', {command: 'error', error: err.message});
    }
  }
})
