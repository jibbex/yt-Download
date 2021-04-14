const { 
  ipcRenderer, clipboard, remote, shell, contextBridge
} = require('electron');

const ytdl = require('ytdl-core');
const { version } = require('../../package.json');

exports = contextBridge.exposeInMainWorld(
  'electron',
  {
    send: (args) => ipcRenderer.send('message', args),
    validUrlTFunc: () => { return ytdl.validateURL(clipboard.readText('text')); },
    clipText: () => { return clipboard.readText('text') },
    version: version,
    ytdl: () => { return ytdl },
    getVideoId: (url) => { return ytdl.getURLVideoID(url) },
    getInfo: () => {
      ipcRenderer.send('message', {command: 'getInfo'});
      
    },
    shellOpen: (ref) => shell.openExternal(ref),
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
    }
  }
)