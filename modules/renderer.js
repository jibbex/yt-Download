const {ipcRenderer, clipboard} = require('electron');
const {dialog} = require('electron').remote;
const ytdl = require('ytdl-core');
const version = require('../package.json');

let vList = [];
let settings;

/**
 * List Element Object
 *
 * @param {object} list item
 */
const ListItem = function(item) {
  try {
    this.index = vList.length;
    this.element = document.createElement('li');
    this.item = item;
    this.rmButton = document.createElement('button');
    let title = document.createTextNode(item.title);
    let thumb = document.createElement('img');
    let rmIcon = document.createElement('li');

    this.element.id = item.id;

    thumb.src = item.thumbnail;

    rmIcon.classList.add('fas');
    rmIcon.classList.add('fa-minus');

    this.rmButton.classList.add('rm');
    this.rmButton.title = 'remove';
    this.rmButton.appendChild(rmIcon);

    this.rmButton.addEventListener('click', (el) => {
      try {
        this.parent.removeChild(vList[this.index].element);
        vList.splice(this.index, 1);
        for(let i = this.index; i < vList.length; i++) {
          vList[i].index = vList[i].index - 1;
        }
      } catch(err) {
        console.log(err);
        dialog.showErrorBox('Error', 'Could not remove item');
      }
    });

    this.element.appendChild(thumb);
    this.element.appendChild(title);
    this.element.appendChild(this.rmButton);

    this.parent.appendChild(this.element);

  }
  catch(err) {
    dialog.showErrorBox('Error', 'ListItem initialisation failed');
  }
}

ListItem.prototype.parent = document.querySelector('#main-container > ul');

/**
 * Event handler
 *
 */
const download = (e) => {
  if(vList.length < 1) return;

  let urls = [];
  let buttons = document.getElementsByClassName('rm');

  vList.forEach((el) => {
    urls.push({title: el.item.title, url: el.item.url});
  });

  for(i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }

  document.getElementById('add').disabled = true;
  document.getElementById('download').classList.add('loading');
  document.getElementById('download').removeEventListener('click', download);
  ipcRenderer.send('download', urls);
}

const closeContainer = () => {
  let containers = document.getElementsByClassName('active');
  for(i = 0; i < containers.length; i++) {
    containers[i].classList.remove('active');
  }
  document.getElementById('download-container').classList.add('active');
}

document.getElementById('copyY').innerHTML = new Date().getFullYear();
document.getElementById('version').innerHTML = 'v'+version.version;
document.getElementById('description').innerHTML = version.description;

document.getElementById('paste').addEventListener('click', () => {
  document.getElementById('url').value = clipboard.readText('text');
});

document.getElementById('add').addEventListener('click', () => {
  let url = document.getElementById('url').value;
  document.getElementById('url').value = '';
  if(ytdl.validateURL(url)) {
    let id = ytdl.getURLVideoID(url);
    document.getElementById('loading').classList.add('active');
    ytdl.getBasicInfo(url).then((info) => {
      let item = {
        url: url,
        id: id,
        title: info.title,
        thumbnail: `https://img.youtube.com/vi/${id}/default.jpg`
      }
      vList.push(new ListItem(item));
      document.getElementById('loading').classList.remove('active');
    }).catch((err) => {
      document.getElementById('loading').classList.remove('active');
      dialog.showErrorBox('Error', err);
    });
  } else if(url.length > 0) {
    dialog.showErrorBox('Error', 'URL is not valid');
  }
});

document.getElementById('settings').addEventListener('click', () => {
  document.getElementById('download-container').classList.remove('active');
  document.getElementById('settings-container').classList.add('active');
});

document.getElementById('info').addEventListener('click', () => {
  document.getElementById('download-container').classList.remove('active');
  document.getElementById('info-container').classList.add('active');
});

document.getElementById('close-settings').addEventListener('click', closeContainer);
document.getElementById('close-info').addEventListener('click', closeContainer);

document.getElementById('select-dir').addEventListener('click', () => {
  let dir = dialog.showOpenDialog({defaultPath : settings.folder, properties:["openDirectory"]});

  if(dir !== undefined) {
    arg = {cmd: 'dir', dir: dir[0]}
    ipcRenderer.send('save', arg);
  }
});

document.getElementById('download').addEventListener('click', download);

/**
 * Messages from main threat
 */
ipcRenderer.on('init', (event, arg) => {
  settings = arg;
  document.getElementById('label-dir').innerHTML = arg.folder;
});

ipcRenderer.on('finished', (event, arg) => {
  vList[0].rmButton.disabled = false;
  vList[0].rmButton.click();
  document.querySelector('#status-container > progress').value = 0;

  if(vList.length == 0) {
    let myNotification = new Notification('Download complete', {
      body: 'All files downloaded'
    })

    myNotification.onclick = () => {
      console.log('Notification clicked')
    }

    document.getElementById('add').disabled = false;
    document.getElementById('download').classList.remove('loading');
    document.getElementById('download').addEventListener('click', download);
  }
});

ipcRenderer.on('progress', (event, arg) => {
  document.querySelector('#status-container > progress').value = arg.percent;
});

ipcRenderer.on('error', (event, arg) => {
  let buttons = document.getElementsByClassName('rm');

  for(i = 0; i < buttons.length; i++) {
    buttons[i].disabled = false;
  }

  document.getElementById('add').disabled = false;
  document.getElementById('download').classList.remove('loading');
  document.getElementById('download').addEventListener('click', download);
  document.querySelector('#status-container > progress').value = 0;

  dialog.showErrorBox('Error', 'An error occurred while downloading. Please start the download again');
});
