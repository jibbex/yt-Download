const {app, BrowserWindow, ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const ytdl = require('ytdl-core')

const {removeSpecials, initialisation, saveConfig} = require('./utils')
const CONST = require('./const').Constances

const DEV = process.env.DEV || false;

let urls = [];
let index = 0;

let settings;
let mainWindow;

if(process.platform === 'win32')
  app.setAppUserModelId('de.michm.yt-download');

/**
 * Downloads a video
 *
 * @param {string} url
 */
function download(url) {
  try {
    let starttime;
    const title = removeSpecials(url.title);

    ytdl.getInfo(url.url, (err, info) => {

      let video = ytdl(url.url, { quality: 'highest'});

      video.pipe(fs.createWriteStream(path.join(`${settings.folder}/${title}.mp4`)));

      video.once('response', () => {
        starttime = Date.now();
      });

      video.on('progress', (chunkLength, downloaded, total) => {
        const percent = downloaded / total;
        const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;

        mainWindow.setProgressBar(percent);
        mainWindow.webContents.send('progress', {percent: (percent * 100).toFixed(2)});
      });

      video.on('end', () => {

        mainWindow.webContents.send('finished', index);

        index = index + 1;

        if(index >= urls.length) {
          index = 0;
          urls = [];
          mainWindow.setProgressBar(0);
          return;
        }
        download(urls[index]);
      });

      video.on('error', (err) => {
        console.log(err);
        mainWindow.setProgressBar(0);
        mainWindow.webContents.send('error', err);
      });
    });
  }
  catch(err) {
    console.log(err);
    mainWindow.setProgressBar(0);
    mainWindow.webContents.send('error', err);
  }
}

/**
 * Creates the window
 *
 */
const createWindow = async () => {
  settings = await initialisation();

  mainWindow = new BrowserWindow({
    width: settings.wSize.width,
    height: settings.wSize.height,
    minWidth: 400,
    minHeight: 600,
    show: false,
    center: true,
    nativeWindowOpen: true,
    icon: path.join(__dirname + '/../assets/images/ico.png'),
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    }
  });

  if(DEV) mainWindow.openDevTools();

  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname + '/../assets/index.html'));

  /**
   * Handles window close
   *
   * @param {string} event
   * @param {function} callback
   */
  mainWindow.on('close', async () => {
    const size = mainWindow.getSize();
    try {
      settings.wSize.width = size[0];
      settings.wSize.height = size[1];
      await saveConfig(settings);
    }
    catch(err) {
      throw err;
    }
  });
  
  /**
   * Content loaded
   *
   * @param {string} event
   * @param {function} callback
   */
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.webContents.send('init', settings);
  });
  
  /**
	 * Window ready
	 *
	 * @param {string} event
	 * @param {function} callback
	 */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  /**
	 * On closed event
	 *
	 * @param {string} event
	 * @param {function} callback
	 */
  mainWindow.on('closed', function() {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

/**
 * Async communication with the render threat
 *
 */
ipcMain.on('download', (event, arg) => {
  index = 0;
  urls = arg;

  download(urls[index]);
});

ipcMain.on('save', async (event, arg) => {
  if(arg.cmd == 'dir') {
    settings.folder = arg.dir;
  }

  try {
    const saved = await saveConfig(settings);
    event.sender.send('init', saved);
  }
  catch(err) {
    throw err;
  }
});
