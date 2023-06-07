/**
 * Helper function to select a option
 * from a Materialize combo box
 *
 * @param {object} elem
 * @param {string} val
 */

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

/**
 * Shorthand for creating elements and text nodes.
 *
 * @param {string} type
 * @param {bool} isTextNode
 */

const createEl = (type, isTextNode = false) => {
  try {
    if(isTextNode)
      return document.createTextNode(type);

    return document.createElement(type);
  }
  catch(err) {
    return document.createTextNode(type);
  }
}

/**
 * Shorthand for querySelector
 *
 * @param {string} query
 */

const getElem = (query) => {
  return document.querySelector(query)
}

/**
 * Shorthand for querySelectorAll
 *
 * @param {string} query
 */

const getElems = (query) => {
  return document.querySelectorAll(query)
}

/**
 * Helper function for animate.css
 *
 * @param {object|string} element
 * @param {string} animation
 * @param {string} prefix
 */
 const animateCSS = (element, animation, prefix = 'animate__') => new Promise((resolve, reject) => {    
    const animationName = `${prefix}${animation}`;
    const node = typeof(element) === 'object' ? element : getElem(element);

    node.classList.add(`${prefix}animated`, animationName);

    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove('animated', animationName);
      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
 });

/**
 * clipboard polling
 *
 */

let timer = setInterval(() => {
  if(validUrlTFunc()) {
    getElem('#add-btn').classList.add('pulse');
  }
  else {
    getElem('#add-btn').classList.remove('pulse');
  }
}, 1000);

/**
 * UI eventhandler
 *
 */

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
getElem('#proxy-checkbox').addEventListener('click', proxyChkBoxClickHandler);
getElem('#proxy-checkbox').addEventListener('click', changeProxyHandler);
getElem('#proxy-user').addEventListener('change', changeProxyHandler);
getElem('#proxy-pass').addEventListener('change', changeProxyHandler);
getElem('#proxy-port').addEventListener('change', changeProxyHandler);
getElem('#proxy-host').addEventListener('change', changeProxyHandler);

/**
 * ---
 */

getElem('#year').innerHTML = '2023';
getElem('#version').innerHTML = version;

/**
 * De-/activates features that require FFmpeg 
 *
 * @param {bool} enable
 */

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

/**
 * Async communication with main proc
 *
 * @param {string} channel
 * @param {Function({args)} callback
 */

ipc('message', (args) => {
  const { command, config } = args;
  const dlBtn = getElem('#download-btn');
  const elem = document.getElementById(args.elId);

  let pb;
  let speedEl;
  
  switch(command) {
    case 'config':
      Card.prototype.quality = config.quality;
      Card.prototype.convert = config.convert;

      getElem('.file-path').value = config.folder;
      getElem('#accel-checkbox').checked = config.acceleration;
      getElem('#proxy-checkbox').checked = config.proxy?.enabled;
      getElem('#proxy-host').value = config.proxy?.host;
      getElem('#proxy-port').value = config.proxy?.port;
      getElem('#proxy-user').value = config.proxy?.user;

      selectOption(getElem('#quality-select'), config.quality);
      selectOption(getElem('#convert-select'), config.convert);

      M.updateTextFields();

      if(!args.ffmpegInstalled) {
        enableExtendedMode(false);
        const modalFfmpeg = M.Modal.init(getElem('#modal-ffmpeg'), {dismissible:false });
        modalFfmpeg.open();
      }
      break;

    case 'save':
      Card.prototype.quality = config.quality;
      Card.prototype.convert = config.convert;
      break;

    case 'remove':              
      animateCSS(elem, 'zoomOut').then(() => {
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
      });
        
      break;

    case 'progress':
      speedEl = elem.querySelector('.dl-speed');
      pb = progresses.get(args.elId);
      
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
      break;

    case 'downloaded':
      pb = progresses.get(args.elId);
      speedEl = elem.querySelector('.dl-speed');

      pb.set(0);
      pb.setText('');         

      speedEl.innerHTML = '';
      speedEl.style.display = '';

      elem.querySelector('.info-txt').innerHTML = '';  
      break;

    case 'downloaded-FFmpeg':
      const modalLoading = M.Modal.getInstance(getElem('#modal-loading'));

      modalLoading.close();
      enableExtendedMode(true);
      break;

    case 'saved-path':
      getElem('.file-path').value = args.path;
      events.config.folder = args.path;
      break;

    case 'error':
      send({command: 'error', error: err});
      break;
  }
})
