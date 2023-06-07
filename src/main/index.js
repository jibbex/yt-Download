const {
  app, 
  BrowserWindow, 
  ipcMain, 
} = require('electron');

const { ffmpeg }    = require('./ffmpeg');
const { config }    = require('./../utils');
const path          = require('path');
const globalTunnel  = require('global-tunnel-ng');

let mainWindow;

if(require('electron-squirrel-startup')) {
  app.quit();
}

const DEV       = process.argv.includes('dev');
const NO_FFMPEG = process.argv.includes('no-ffmpeg');

function initProxy() {
    if (config.proxy.enabled) {
        const authSeperator = config.proxy.user?.length > 0 && config.proxy.pass?.length > 0 ? ':' : '';
        globalTunnel.initialize({
            host: config.proxy.host,
            port: config.proxy.port,
            proxyAuth: `${config.proxy.user}${authSeperator}${config.proxy.pass}`,
        });
    }
}

if(process.platform === 'win32') {
  app.setAppUserModelId('YT Download');
}

/**
 * App eventhandler
 *
 */

const createWindow = async () => {    
    const ffmpegFound = (NO_FFMPEG) ? false : require('./ffmpeg').isFFmpegInstalled();  

    try {    
        await config.init();    
        ffmpeg.acceleration = config.acceleration || false;
        initProxy();
    }
    catch(error) { 
        console.error(error);
    }

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
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
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

    mainWindow.on('resized', async () => {
        try {
            const [width, height] = mainWindow.getSize();   
            await config.save({windowSize: { width, height }});
            
            await ffmpeg.kill();
        }
        catch(error) {
            console.error(error);
        }
    })

    mainWindow.on('close', async () => {
        mainWindow.hide();
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
 * Async communication with render proc
 *
 * @param {string} channel
 * @param {Function(event, args)} callback
 */

ipcMain.on('message', async (event, args) => {
    const { dialog } = require('electron');
    
    switch(args.command) {
        case 'getConfig': 
            event.sender.send('message', {command: 'config', config});
            break;

        case 'saveConfig':
            try {
                console.log(args.config);
                await config.save(args.config);
                ffmpeg.acceleration = args.config.acceleration;
                
                if (config.proxy.enabled) {
                    globalTunnel.end();
                    initProxy();
                } else {
                    globalTunnel.end();
                }

                event.sender.send('message', {command: 'saved', config})
            }
            catch(err) {
                console.error(err);
                dialog.showMessageBox(mainWindow, {
                    type: 'error', 
                    title: 'Error', 
                    message: err.message
                });
            }
            break;

        case 'download':
            let item = args.item;
            item.path = config.folder;        
            ffmpeg.download(item);
            break;

        case 'downloadFFmpeg':
            try {   
                const { downloadFFmpeg } = require('./ffmpeg.js');
                const bins          = await downloadFFmpeg();
                ffmpeg.bin.ffmpeg   = bins.ffmpeg;
                ffmpeg.bin.ffprobe  = bins.ffprobe;
                event.sender.send('message', {command: 'downloaded-FFmpeg'})
            }
            catch(err) {
                console.error(err);
                dialog.showMessageBox(
                    mainWindow, {
                        type: 'error', 
                        title: 'Error', 
                        message: err.message
                    }
                );
            }
            break;

        case 'select-path':
            const path = await dialog.showOpenDialog(mainWindow, {
                defaultPath : config.folder, 
                properties:["openDirectory"]
            });

            try {
                if(path.filePaths[0] !== undefined) {
                    await config.save({folder: path.filePaths[0]});
                    event.sender.send('message', {command: 'saved-path', path: path.filePaths[0]})
                }
            }
            catch(err) {
                console.error(err);
                dialog.showMessageBox(
                    mainWindow, {
                        type: 'error', 
                        title: 'Error', 
                        message: err.message
                    }
                );
            }   
            break;

        case 'error':
            console.error(args.error);
            dialog.showMessageBox(mainWindow, {
                type: 'error', 
                title: 'Error', 
                message: args.error.message
            });
            break;
    }
});

/**
 * FFmpeg eventhandler
 *
 * @param {string} event
 * @param {Function(...args)} callback
 */

ffmpeg.on('download-end', (info) => {
  if(DEV) {
    console.log(info);  
  }

  mainWindow.webContents.send('message', {command: 'downloaded', elId: info.elemId});
});

ffmpeg.on('progress', (prog) => {
    if(DEV) {
        console.log(prog);  
    }

    if(mainWindow) {
        mainWindow.setProgressBar(prog.progress / 100);
        mainWindow.webContents.send('message', {
            command: 'progress', 
            job: prog.job, 
            percent: prog.progress,
            elId: prog.elemId,
            speed: prog.speed
        });
    }     
});

ffmpeg.on('finished', (id) => {
    if(DEV) {
        console.log(id);  
    }

    mainWindow.setProgressBar(0);
    mainWindow.webContents.send('message', {command: 'remove', elId: id}); 
});

ffmpeg.on('error', (error) => {
     if(DEV) {
        console.error(error);  
     }

    mainWindow.setProgressBar(0);
    mainWindow.webContents.send('message', {command: 'error', error: error.message});
});
