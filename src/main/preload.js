const { 
  ipcRenderer, clipboard, remote, shell, contextBridge
} = require('electron');

const ytdl = require('ytdl-core');
const {version} = require('../../package.json');

exports = contextBridge.exposeInMainWorld(
  'electron',
  {
    version: version,
    send: (args) => ipcRenderer.send('message', args),
    validUrlTFunc: () => ytdl.validateURL(clipboard.readText('text')),
    getInfo: async function() { 
      try {
        const url = clipboard.readText('text');
        const video = {
          url: url,
          id: ytdl.getURLVideoID(url),
          info: (await ytdl.getBasicInfo(url)).videoDetails
        };
                
        return video;
      }      
      catch(error) {
        ipcRenderer.send('message', {command: 'error', error: error});
      }
    },
    notify: (msg) => {
      const notify = new Notification('Download complete', {
  		  body: msg
  		});
      notify.onclick = (ev) => {
        console.log('click');
        shell.openExternal(config.folder);
      };
    },
    ipc: (channel, func) => {
      let validChannels = ['message'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args))
      }
    },
    clearClipboard : () => clipboard.writeText(''),
    getVideoId: (url) => ytdl.getURLVideoID(url),
    shellOpen: (ref) => shell.openExternal(ref)
  }
)