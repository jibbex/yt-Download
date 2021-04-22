const config = {};
const progresses = new Map();

const events = {
  config: config,
  progresses: progresses,
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
  pulseDeactivate: function() {
    clearInterval(timer);
    this.classList.remove('pulse');
  },
  pulseActivate: () => {
    timer = setInterval(() => {
      if(validUrlTFunc()) {
        getElem('#add-btn').classList.add('pulse');
      }
      else {
        getElem('#add-btn').classList.remove('pulse');
      }
    }, 1000);
  },
  fileInputClickHandler: (ev) => {
    ev.preventDefault();
    send({command: 'select-path'})
  },
  addUrlFromClipboard: async () => {
    if(validUrlTFunc()) {    
      const dlBtn = getElem('#download-btn');
      const {url, id, info} = await getInfo();
      
      const card = new Card({id: id, url: url, title: info.title, image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`});
      card.appendTo(getElem('#download-container'));

      animateCSS(card.element, 'zoomIn');      

      if(dlBtn.classList.contains('scale-out') && !dlBtn.classList.contains('deactive')) {
        dlBtn.classList.remove('scale-out');
      }    
      
      clearClipboard();
    }
    else {
      error('URL is not valid.');
    }
  },
  addBtnClickHandler: async () => {
    const addDropdownInst = M.Dropdown.getInstance(getElem('#add-btn'));

    if(addDropdownInst === undefined) {
      await addUrlFromClipboard();
    }
  },
  changeSelectQualityHandler: function() {
    config.quality = this.options[this.selectedIndex].value;
    Card.prototype.quality = config.quality;
    send({command: 'saveConfig', config: config});
  },
  changeSelectConvertHandler: function() {
    config.convert = this.options[this.selectedIndex].value;
    Card.prototype.convert = config.convert;
    send({command: 'saveConfig', config: config});
  },
  changeAccelerationHandler: function() {
    config.acceleration = this.checked;
    send({command: 'saveConfig', config: config});
  },
  inputWorkerHandler: function() {
    let worker = this.value;

    if(worker > 10 || worker < 1) {
      this.value = worker = worker > 10 ? 10 : worker < 1 && 1;
    }

    config.dlWorker = worker;

    send({command: 'saveConfig', config: config});
  },  
  download: () => {
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
      send({command: 'download', item: item});

      getElem('#add-btn').disabled = true;

      if(!dlBtn.classList.contains('scale-out')) {
        dlBtn.disabled = true;
        dlBtn.classList.add('scale-out');
      }
    }
    else {
      notify('All files downloaded.');
    }
  },  
  linkClickHandler: function(ev) {
    ev.preventDefault();
    shellOpen(this.href);
  },
  downloadFFmpegBtnClickHandler: (ev) => {
    const modalFfmpeg = M.Modal.getInstance(getElem('#modal-ffmpeg'));
    const modalLoading = M.Modal.getInstance(getElem('#modal-loading'));

    modalFfmpeg.close();

    getElem('#modal-loading-title').innerHTML = 'Downloading FFmpeg';
    getElem('#modal-loading-content').innerHTML = 'Please be patient while the FFmpeg binaries are downloading.';
    modalLoading.open();

    send({command: 'downloadFFmpeg'});
  },
  clickWorkerHandler: function() {return this.select()},
  downloadBtnClickHandler: () => download(),  
  downloadUpdateBtnClickHandler: () => shellOpen('https://ytdl.michm.de')  
}
