const { app, BrowserWindow, ipcMain }           = require('electron');
const path                                      = require('path');
const { config }                                = require('./../utils');
const { 
        downloadFFmpeg, isFFmpegInstalled, 
        ffmpeg, getBin 
      }                                         = require('./ffmpeg');

let args = {};
let mainWindow;

if(require('electron-squirrel-startup')) {
  app.quit();
}

const DEV       = process.argv.includes('dev');
const NO_FFMPEG = process.argv.includes('no-ffmpeg');

if(process.platform === 'win32') {
  app.setAppUserModelId('de.michm.yt-download');
}


/**
 * App on ready eventhandler callback
 *
 */
const createWindow = async () => {
  const ffmpegFound = (NO_FFMPEG) ? false : isFFmpegInstalled();  
  
  try {    
    await config.init();    
    ffmpeg.acceleration = config.acceleration || false;
  }
  catch(error) { console.log(error) }
  
  mainWindow = new BrowserWindow({
    width: config.windowSize.width,
    height: config.windowSize.height,
    minWidth: DEV ? 0 : 640,
    minHeight: DEV ? 0 : 864,
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

  if(DEV) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', async () => {
		try {
      const sizes = mainWindow.getSize();      
                        
			await config.save({
        windowSize: {
          width: sizes[0], 
          height: sizes[1]
        }
      });
      
      await ffmpeg.kill();
		}
		catch(error) {
      throw error;		
		}
	});

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.webContents.send('message', {
      command: 'config',
      config: config,
      ffmpegInstalled: ffmpegFound
    });
	});
}

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
      await config.save(args.config);
      ffmpeg.acceleration = args.config.acceleration;
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
      const bins          = await downloadFFmpeg();
      ffmpeg.bin.ffmpeg   = bins.ffmpeg;
      ffmpeg.bin.ffprobe  = bins.ffprobe;
      event.sender.send('message', {command: 'downloaded-FFmpeg'})
    }
    catch(err) {
      console.log(err);
      event.sender.send('message', {command: 'error', error: err.message});
    }
  }
})

ffmpeg.on('download-end', (info) => {
  setImmediate(() => {
    if(DEV) {
      console.log(info);  
    }
    mainWindow.webContents.send('message', {command: 'downloaded', elId: info.elemId});
  });
})

ffmpeg.on('progress', (prog) => {
  setImmediate(() => {
    if(DEV) {
      console.log(prog);  
    }
    if(mainWindow) {
      mainWindow.setProgressBar(prog.progress / 100);
      mainWindow.webContents.send(
            'message', 
            {
              command: 'progress', 
              job: prog.job, 
              percent: prog.progress,
              elId: prog.elemId,
              speed: prog.speed
            }
          );
      } 
    });       
})

ffmpeg.on('finished', (id) => {
  setImmediate(() => {
    if(DEV) {
      console.log(id);  
    }
    mainWindow.setProgressBar(0);
    mainWindow.webContents.send('message', {command: 'remove', elId: id});
  });  
})

ffmpeg.on('error', (error) => {
  setImmediate(() => {
    if(DEV) {
      console.log(error);  
    }
    mainWindow.setProgressBar(0);
    mainWindow.webContents.send('message', {command: 'error', error: error.message});
  });
})