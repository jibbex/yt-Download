document.addEventListener('DOMContentLoaded', function() {
  M.AutoInit();
  M.Modal.init(getElem('#modal-loading'), {dismissible:false });

  window.onresize = (ev) => {
    const addDropdownInst = M.Dropdown.getInstance(getElem('#add-btn'));

    if(addDropdownInst !== undefined)
      addDropdownInst.recalculateDimensions();
  }
});

function pulseDeactivate(ev) {
  clearInterval(timer);
  this.classList.remove('pulse');
}

function pulseActivate(ev) {
  timer = setInterval(validUrlTFunc, 1000);
}

async function fileInputClickHandler(ev) {
  ev.preventDefault();
  try {
    const dir = await dialog.showOpenDialog(remote.getCurrentWindow(), {defaultPath : config.folder, properties:["openDirectory"]});

    if(!dir.canceled) {
      this.querySelector('.file-path').value = dir.filePaths[0];
      config.folder = dir.filePaths[0];
      ipcRenderer.send('message', {command: 'saveConfig', config: config});
    }
  }
  catch(err) {
    console.error(err);
    dialog.showMessageBox(remote.getCurrentWindow(), {type: 'error', title: 'Error', message: 'Directory could not selected'});
  }
}

async function addUrlFromClipboard() {
  const dlBtn = getElem('#download-btn');
  const url = clipboard.readText('text');

  if(ytdl.validateURL(url)) {
    try {
      const id = ytdl.getURLVideoID(url);
      const info = await ytdl.getBasicInfo(url);

      card = new Card({id: id, url: url, title: info.title, image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`});
      card.appendTo(getElem('#download-container'));

      animateCSS(card.element, 'zoomIn');
      clipboard.writeText('');

      if(dlBtn.classList.contains('scale-out') && !dlBtn.classList.contains('deactive')) {
        dlBtn.classList.remove('scale-out');
      }
    }
    catch(err) {
      dialog.showErrorBox('Error', err.message);
      console.error(err);
    }
  }
  else {
    dialog.showMessageBox(remote.getCurrentWindow(), {type: 'error', title: 'Error', message: 'URL is not valid'});
  }
}

async function addBtnClickHandler(ev) {
  const addDropdownInst = M.Dropdown.getInstance(getElem('#add-btn'));

  if(addDropdownInst === undefined) {
    await addUrlFromClipboard();
  }
}

function changeSelectQualityHandler(ev) {
  config.quality = this.options[this.selectedIndex].value;
  Card.prototype.quality = config.quality;
  ipcRenderer.send('message', {command: 'saveConfig', config: config});
}

function changeSelectConvertHandler(ev) {
  config.convert = this.options[this.selectedIndex].value;
  Card.prototype.convert = config.convert;
  ipcRenderer.send('message', {command: 'saveConfig', config: config});
}

function toggleApiActiveBtnHandler(ev) {
  const inst = M.Dropdown.getInstance(getElem('#add-btn'));

  getElem('#api-key-input').disabled = !this.checked;
  getElem('#save-apiKey-btn').disabled = !this.checked;

  config.api.active = this.checked;

  if(this.checked) {
    M.Dropdown.init(getElems('#add-btn'), {closeOnClick: false});
  }
  else {
    M.Dropdown.getInstance(getElem('#add-btn')).destroy();
  }

  ipcRenderer.send('message', {command: 'saveConfig', config: config});
}

function download() {
  const dlContainer = getElem('#download-container');

  if(dlContainer.children.length > 0) {
    const elem = dlContainer.children[0];
    const dlBtn = getElem('#download-btn');

    elem.querySelector('.remove').disabled = true;
    elem.querySelector('.info').style.display = 'block';

    const item = {
      id: elem.dataset.id,
      url: elem.dataset.url,
      elemId: elem.id,
      convert: elem.dataset.convert,
      quality: elem.dataset.quality,
      title: elem.dataset.title
    }

    ipcRenderer.send('message', {command: 'download', item: item});
    getElem('#add-btn').disabled = true;
    if(!dlBtn.classList.contains('scale-out')) {
      dlBtn.disabled = true;
      dlBtn.classList.add('scale-out');
    }
  }
  else {
    const notify = new Notification('Download complete', {
		  body: 'All files downloaded'
		});

    notify.onclick = (ev) => {
      console.log('click');
      shell.openExternal(config.folder);
    };
  }
}

function downloadBtnClickHandler(ev) {
  download();
}

function linkClickHandler(ev) {
  ev.preventDefault();
  shell.openExternal(this.href);
}

function downloadFFmpegBtnClickHandler(ev) {
  const modalFfmpeg = M.Modal.getInstance(getElem('#modal-ffmpeg'));
  const modalLoading = M.Modal.getInstance(getElem('#modal-loading'));

  modalFfmpeg.close();

  getElem('#modal-loading-title').innerHTML = 'Downloading FFmpeg';
  getElem('#modal-loading-content').innerHTML = 'Please be patient while the FFmpeg binaries are downloading.';
  modalLoading.open();

  ipcRenderer.send('message', {command: 'downloadFFmpeg'});
}

function downloadUpdateBtnClickHandler(ev) {
  shell.openExternal('https://ytdl.michm.de');
}
