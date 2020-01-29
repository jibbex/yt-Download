getElem('#path-file-input').addEventListener('click', fileInputClickHandler);
getElem('#add-btn').addEventListener('click', addBtnClickHandler);
getElem('#download-btn').addEventListener('click', downloadBtnClickHandler);
getElem('#quality-select').addEventListener('change', changeSelectQualityHandler);
getElem('#convert-select').addEventListener('change', changeSelectConvertHandler);
getElem('#add-btn').addEventListener('mouseover', pulseDeactivate);
getElem('#add-btn').addEventListener('mouseleave', pulseActivate);
getElem('#modal-ffmpeg a').addEventListener('click', linkClickHandler);
getElem('#btn-download-ffmpeg').addEventListener('click', downloadFFmpegBtnClickHandler);
getElem('#download-update-btn').addEventListener('click', downloadUpdateBtnClickHandler);

function enableExtendedMode(enable = true) {
  if(!enable) {
    Card.prototype.quality = 'medium';
    selectOption(getElem('#quality-select'), 'medium');
    getElem('#quality-select').children[0].disabled = true;
    getElem('#convert-select').disabled = true;

    M.FormSelect.getInstance(getElem('#quality-select')).destroy();
    M.FormSelect.getInstance(getElem('#convert-select')).destroy();
    M.FormSelect.init(getElem('#quality-select'));
    M.FormSelect.init(getElem('#convert-select'));

    Card.prototype.disableExtendedMode(true);
  }
  else {
    Card.prototype.quality = config.quality;
    selectOption(getElem('#quality-select'), config.quality);
    getElem('#quality-select').children[0].disabled = false;
    getElem('#convert-select').disabled = false;

    M.FormSelect.getInstance(getElem('#quality-select')).destroy();
    M.FormSelect.getInstance(getElem('#convert-select')).destroy();
    M.FormSelect.init(getElem('#quality-select'));
    M.FormSelect.init(getElem('#convert-select'));

    Card.prototype.disableExtendedMode(false);
  }
}

ipcRenderer.on('message', (event, args) => {
  if(args.command == 'config') {
    config = args.config;
    Card.prototype.quality = config.quality;
    Card.prototype.convert = config.convert;

    getElem('.file-path').value = config.folder;

    selectOption(getElem('#quality-select'), config.quality);
    selectOption(getElem('#convert-select'), config.convert);

    if(config.api.active) {
      M.Dropdown.init(getElems('#add-btn'), {closeOnClick: false});

      getElem('#api-key-input').value = config.api.key;
      getElem('#save-apiKey-btn').disabled = false;
      getElem('#api-key-input').disabled = false;
    }

    if(!args.ffmpegInstalled) {
      enableExtendedMode(false);
      const modalFfmpeg = M.Modal.init(getElem('#modal-ffmpeg'), {dismissible:false });
      modalFfmpeg.open();
    }
  }
  if(args.command == 'saved') {
    config = args.config;
    Card.prototype.quality = config.quality;
    Card.prototype.convert = config.convert;
  }
  if(args.command == 'remove') {
    const dlBtn = getElem('#download-btn');
    const elem = document.getElementById(args.elId);
    animateCSS(elem, 'zoomOut', () => {
      const parent = getElem('#download-container');
      parent.removeChild(elem);
      dlBtn.disabled = false;
      getElem('#add-btn').disabled = false;
      getElem('#add-btn').classList.remove('hidden');
      dlBtn.classList.remove('deactive');
      if(dlBtn.classList.contains('scale-out') && getElem('#download-container').children.length > 0) {
        dlBtn.classList.remove('scale-out');
      }
      download();
    })
  }
  if(args.command == 'progress') {
    const dlBtn = getElem('#download-btn');
    const elem = getElem('#download-container').children[0];
    const progEl = elem.querySelector('.progress > div');
    const progElSec = elem.querySelector('.sec > div');

    if(args.stream == 'audio') {
      progElSec.parentElement.style.display = 'block';
      progElSec.classList.remove('indeterminate');
      progElSec.classList.add('determinate');
      progElSec.style.width = `${parseInt(args.percent)}%`;
    }

    if(args.stream == 'video') {
      progEl.classList.remove('indeterminate');
      progEl.classList.add('determinate');
      progEl.style.width = `${parseInt(args.percent)}%`;
    }

    if(!dlBtn.classList.contains('deactive'))
      dlBtn.classList.add('deactive');
    elem.querySelector('.info-txt').innerHTML = `${args.job}`;
  }
  if(args.command == 'startMerge') {
    const elem = getElem('#download-container').children[0];
    const progEl = elem.querySelector('.progress > div');
    const progElSec = elem.querySelector('.sec > div');
    progEl.classList.remove('determinate');
    progEl.classList.add('indeterminate');
    progEl.style.width = 'auto';
    progElSec.classList.remove('determinate');
    progElSec.classList.add('indeterminate');
    progElSec.style.width = 'auto';
    elem.querySelector('.sec').style.display = '';
    elem.querySelector('.info').style.display = 'block';
    elem.querySelector('.info-txt').innerHTML = `Merging`;
  }
  if(args.command == 'converting') {
    const elem = getElem('#download-container').children[0];
    const progEl = elem.querySelector('.progress > div');
    progEl.classList.remove('determinate');
    progEl.classList.add('indeterminate');
    progEl.style.width = 'auto';
    elem.querySelector('.info').style.display = 'block';
    if(args.progress.percent !== undefined) {
      elem.querySelector('.info-txt').innerHTML = `Converting ${args.progress.percent} %`;
    }
    else {
      elem.querySelector('.info-txt').innerHTML = `Converting <span class="right">${args.progress.timemark}</span>`;
    }
  }
  if(args.command == 'startConvert') {
    const elem = getElem('#download-container').children[0];
    const progEl = elem.querySelector('.progress > div');
    progEl.classList.remove('determinate');
    progEl.classList.add('indeterminate');
    progEl.style.width = 'auto';
    elem.querySelector('.info').style.display = 'block';
    elem.querySelector('.info-txt').innerHTML = 'Converting';
  }
  if(args.command == 'downloaded') {
    const elem = getElem('#download-container').children[0];
    const progEl = elem.querySelector('.progress > div');
    const progElSec = elem.querySelector('.sec > div');
    progEl.classList.remove('determinate');
    progEl.classList.add('indeterminate');
    progEl.style.width = 'auto';
    progElSec.classList.remove('determinate');
    progElSec.classList.add('indeterminate');
    progElSec.style.width = 'auto';
    elem.querySelector('.info').style.display = '';
    progElSec.parentElement.style.display = '';
  }
  if(args.command == 'downloadedFFmpeg') {
    const modalLoading = M.Modal.getInstance(getElem('#modal-loading'));
    modalLoading.close();
    enableExtendedMode(true);
  }
  if(args.command == 'error') {
    dialog.showMessageBox(remote.getCurrentWindow(), {type: 'error', title: 'Error', message: args.error.message});
  }
})

ipcRenderer.on('converting', (event, args) => {
  const elem = getElem('#download-container').children[0];
  const progEl = elem.querySelector('.progress > div');
  progEl.classList.remove('determinate');
  progEl.classList.add('indeterminate');
  progEl.style.width = 'auto';
  elem.querySelector('.info').style.display = 'block';
  console.log(args);
  elem.querySelector('.info-txt').innerHTML = `Converting ${args.timemark}`;
});
