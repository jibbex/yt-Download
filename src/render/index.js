const selectOption = (elem, val) => {
  for(i = 0; i < elem.options.length; i++) {
    if(elem.options[i].value == val) {
      const selectEl = M.FormSelect.getInstance(elem);
      elem.selectedIndex = i;
      elem.options[i].selected = true;
      selectEl.input.value = elem.options[i].innerHTML;
      break;
    }
  }
}
const createEl = (el, isTextNode = false) => {
  try {
    if(isTextNode)
      return document.createTextNode(el);

    return document.createElement(el);
  }
  catch(err) {
    return document.createTextNode(el);
  }
}
const animateCSS  = (element, animationName, callback)  => {
    const node = typeof(element) === 'object' ? element : document.querySelector(element)
    node.classList.add('animated', animationName)

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName)
        node.removeEventListener('animationend', handleAnimationEnd)

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}
const getElem = (query) => {
  return document.querySelector(query);
}
const getElems = (query) => {
  return document.querySelectorAll(query);
}

let timer = setInterval(() => {
  if(electron.validateURL) {
    getElem('#add-btn').classList.add('pulse');
  }
  else {
    getElem('#add-btn').classList.remove('pulse');
  }
},1000);

getElem('#path-file-input').addEventListener('click', fileInputClickHandler);
getElem('#add-btn').addEventListener('click', addBtnClickHandler);
getElem('#download-btn').addEventListener('click', downloadBtnClickHandler);
getElem('#quality-select').addEventListener('change', changeSelectQualityHandler);
getElem('#convert-select').addEventListener('change', changeSelectConvertHandler);
getElem('#accel-checkbox').addEventListener('click', changeAccelerationHandler);
getElem('#add-btn').addEventListener('mouseover', pulseDeactivate);
getElem('#add-btn').addEventListener('mouseleave', pulseActivate);
getElem('#modal-ffmpeg a').addEventListener('click', linkClickHandler);
getElem('#btn-download-ffmpeg').addEventListener('click', downloadFFmpegBtnClickHandler);
getElem('#download-update-btn').addEventListener('click', downloadUpdateBtnClickHandler);

getElem('#year').innerHTML = new Date().getFullYear();
getElem('#version').innerHTML = version;

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
  }
  
  Card.prototype.toggleExtendedMode();
}

ipc('message', (args) => {
  const { command, config } = args;
  if(command == 'config') {
    Card.prototype.quality = config.quality;
    Card.prototype.convert = config.convert;

    getElem('.file-path').value = config.folder;
    getElem('#accel-checkbox').checked = config.acceleration    

    selectOption(getElem('#quality-select'), config.quality);
    selectOption(getElem('#convert-select'), config.convert);

    M.updateTextFields();

    if(!args.ffmpegInstalled) {
      enableExtendedMode(false);
      const modalFfmpeg = M.Modal.init(getElem('#modal-ffmpeg'), {dismissible:false });
      modalFfmpeg.open();
    }
  }
  if(command == 'saved') {  
    Card.prototype.quality = config.quality;
    Card.prototype.convert = config.convert;
  }
  if(command == 'remove') {
    const dlBtn = getElem('#download-btn');
    const elem = document.getElementById(args.elId);
    progresses.delete(args.elId);
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
  if(command == 'progress') {
    const dlBtn = getElem('#download-btn');
    const elem = document.getElementById(args.elId);
    const speedEl = elem.querySelector('.dl-speed');
    const pb = progresses.get(args.elId);
    
    args.percent = args.percent <= 100 ? args.percent : 0;
    
    pb.set(args.percent / 100);
    pb.setText(`${(!isNaN(args.percent) ? args.percent : 0.00)} %`);
    
    if(args.speed) {
      if(!speedEl.style.display)
        speedEl.style.display = 'inline';
        
      const speed = (args.speed / 1000).toFixed(2);
      
      speedEl.innerHTML = speed > 999 
                      ? (speed / 1000).toFixed(2) + ' MB/s' 
                      : speed + 'KB/s';
      
    }
    else {
      speedEl.style.display = '';
    }
    
    if(!dlBtn.classList.contains('deactive'))
      dlBtn.classList.add('deactive');
    elem.querySelector('.info-txt').innerHTML = `${args.job}`;
  }
  if(command == 'startConvert') {
  }
  if(command == 'downloaded') {
    const elem = document.getElementById(args.elId);
    const pb = progresses.get(args.elId);
    const speedEl = elem.querySelector('.dl-speed');
    pb.set(0);
    pb.setText('');    
    elem.querySelector('.info-txt').innerHTML = '';    
    speedEl.innerHTML = '';
    speedEl.style.display = '';
  }
  if(command == 'downloaded-FFmpeg') {
    const modalLoading = M.Modal.getInstance(getElem('#modal-loading'));
    modalLoading.close();
    enableExtendedMode(true);
  }
  if(command == 'error') {
    electron.send({command: 'error', error: err});
  }
  if(command == 'info') {
    try {
      const dlBtn = getElem('#download-btn');
      
      const {url, id, info} = args; 

      console.log(url);
      console.log(id);
      console.log(info);
      
      card = new Card({id: id, url: url, title: info.title, image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`});
      card.appendTo(getElem('#download-container'));

      animateCSS(card.element, 'zoomIn');      

      if(dlBtn.classList.contains('scale-out') && !dlBtn.classList.contains('deactive')) {
        dlBtn.classList.remove('scale-out');
      }
    }
    catch(err) {        
      electron.send({command: 'error', error: err});
      console.error(err);
    }
  }
  if(command == 'savedPath') {
    document.querySelector('.file-path').value = args.path;
    config.folder = args.path;
  }
})