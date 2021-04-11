const progresses = new Map();
let config = {};

const events = {
  init: () => {
    document.addEventListener('DOMContentLoaded', function() {
      M.AutoInit();
      M.Modal.init(getElem('#modal-loading'), {dismissible:false });
      window.onresize = (ev) => {
        const addDropdownInst = M.Dropdown.getInstance(getElem('#add-btn'));

        if(addDropdownInst !== undefined)
          addDropdownInst.recalculateDimensions();
      }
    })
  },
  progresses: progresses,
  config: config,
  pulseDeactivate: function(ev) {
    clearInterval(timer);
    this.classList.remove('pulse');
  },
  pulseActivate: function(ev) {
    timer = setInterval(() => {
      if(electron.validateURL) {
        getElem('#add-btn').classList.add('pulse');
      }
      else {
        getElem('#add-btn').classList.remove('pulse');
      }
    }, 1000);
  },
  fileInputClickHandler: (ev) => {
    ev.preventDefault();
    electron.send({command: 'selectPath'})
  },
  addUrlFromClipboard: function() {
    if(validUrlTFunc()) {    
      electron.getInfo();        
    }
    else {
     electron.error('URL is not valid.');
    }
  },
  addBtnClickHandler: async function (ev) {
    const addDropdownInst = M.Dropdown.getInstance(getElem('#add-btn'));

    if(addDropdownInst === undefined) {
      await addUrlFromClipboard();
    }
  },
  changeSelectQualityHandler: function (ev) {
    config.quality = this.options[this.selectedIndex].value;
    Card.prototype.quality = config.quality;
    electron.send({command: 'saveConfig', config: config});
  },
  changeSelectConvertHandler: function (ev) {
    config.convert = this.options[this.selectedIndex].value;
    Card.prototype.convert = config.convert;
    electron.send({command: 'saveConfig', config: config});
  },
  changeAccelerationHandler: function (ev) {
    config.acceleration = this.checked;
    electron.send({command: 'saveConfig', config: config});
  },
  inputWorkerHandler: function (ev) {
    let worker = this.value;

    if(worker > 10 || worker < 1) {
      this.value = worker = worker > 10 ? 10 : worker < 1 && 1;
    }

    config.dlWorker = worker;

    electron.send({command: 'saveConfig', config: config});
  },
  clickWorkerHandler: function (ev) {
    this.select();
  },
  download: function () {
    const dlContainer = getElem('#download-container');

    if(dlContainer.children.length > 0) {
      const dlBtn = getElem('#download-btn');

      const elem = dlContainer.children[0];
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

      const pbEl = document.getElementById(elem.id).querySelector('.info .progress');

      progresses.set(elem.id, new ProgressBar.Circle(pbEl, {
        color: '#00796b',
        strokeWidth: 6,
        trailColor: 'rgba(38, 166, 154,.5)',
        trailWidth: 3,
        duration: 1000,
        easing: 'easeOut',
        text: {
            value: '0.00 %',
            style: {
              fontFamily: 'Roboto',
              position: 'absolute',
              top: 'calc(50% - 6px)',
              width: '100%',
              textAlign: 'center',
              fontSize: '.9em',
              color: 'rgba(0,0,0,.7)'
            }
        }
      }))

      animateCSS(pbEl, 'bounceIn');
      electron.send({command: 'download', item: item});

      getElem('#add-btn').disabled = true;
      if(!dlBtn.classList.contains('scale-out')) {
        dlBtn.disabled = true;
        dlBtn.classList.add('scale-out');
      }
    }
    else {
      electron.notify('All files downloaded.');
    }
  },
  downloadBtnClickHandler:
  function (ev) {
    module.exports.download();
  },
  linkClickHandler: function (ev) {
    ev.preventDefault();
    electron.shellOpen(this.href);
  },
  downloadFFmpegBtnClickHandler: function (ev) {
    const modalFfmpeg = M.Modal.getInstance(getElem('#modal-ffmpeg'));
    const modalLoading = M.Modal.getInstance(getElem('#modal-loading'));

    modalFfmpeg.close();

    getElem('#modal-loading-title').innerHTML = 'Downloading FFmpeg';
    getElem('#modal-loading-content').innerHTML = 'Please be patient while the FFmpeg binaries are downloading.';
    modalLoading.open();

    electron.send({command: 'downloadFFmpeg'});
  },
  downloadUpdateBtnClickHandler: function (ev) {
    electron.shellOpen('https://ytdl.michm.de');
  }
}
