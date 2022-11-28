class Card {
  constructor(item) {
    this.element = createEl('div');
    this.title = item.title;
    this.element.dataset.convert = this.convert;
    this.element.dataset.quality = this.quality;
    this.element.dataset.id = item.id;
    this.element.dataset.url = item.url;
    this.element.dataset.title = item.title;
    this.element.id = new Date().getTime() + item.id;
    this.image = createEl('img');
  
    const thumbEl = createEl('div');
    const contentEl = createEl('div');
    const titleEl = createEl('span');
    const titleElOpt = createEl('span');
    const optionsEl = createEl('div');
    const bottomEl = createEl('div');
    const infoEl = createEl('div');
    const infoTxt = createEl('div');
  
    const moreIco = createEl('i');
    const closeIco = createEl('i');
    const rmIco = createEl('i');
    const pOpt = createEl('p');
    const rmBtn = createEl('button');
  
    const qEl = createEl('div');
    const qElLabel = createEl('label');
  
    this.qSelEl = createEl('select');
    this.optHigh = createEl('option');
    this.optMedium = createEl('option');
    this.optLow = createEl('option');
  
    const cEl = createEl('div');
    const cElLabel = createEl('label');
  
    this.cSelEl = createEl('select');
    this.optDis = createEl('option');
    this.optMp3 = createEl('option');
    this.optMp4 = createEl('option');
    this.optWebm = createEl('option');
    this.optMov = createEl('option');
    this.optMpeg = createEl('option');
  
    if(!this.extendedMode) {
      this.cSelEl.disabled = true;
      this.optHigh.disabled = true;
    }
  
    const cProgress = createEl('div');
  
    let shortTitle = this.title
  
    if(this.title.length > 88)
      shortTitle = `${this.title.substr(0,89)} ...`;
  
    qElLabel.appendChild(createEl('Quality', true));
    this.optHigh.value = 'high';
    this.optHigh.appendChild(createEl('High', true));
    this.optMedium.value = 'medium';
    this.optMedium.appendChild(createEl('Medium', true));
    this.optLow.value = 'low';
    this.optLow.appendChild(createEl('Low', true));
  
    switch(this.quality) {
      case 'high':
        this.optHigh.selected = 'selected';
        break;
      case 'medium':
        this.optMedium.selected = 'selected';
        break;
      case 'low':
        this.optLow.selected = 'selected';
        break;
    }
  
    this.qSelEl.appendChild(this.optHigh);
    this.qSelEl.appendChild(this.optMedium);
    this.qSelEl.appendChild(this.optLow);
    qEl.appendChild(this.qSelEl);
    qEl.appendChild(qElLabel);
  
    cElLabel.appendChild(createEl('Convert to', true));
    this.optDis.value = '';
    this.optDis.appendChild(createEl('Disabled', true));
    this.optMp3.value = 'mp3';
    this.optMp3.appendChild(createEl('MP3', true));
    this.optMp4.value = 'mkv';
    this.optMp4.appendChild(createEl('MKV', true));
    this.optWebm.value = 'webm';
    this.optWebm.appendChild(createEl('WEBM', true));
    this.optMov.value = 'mov';
    this.optMov.appendChild(createEl('MOV', true));
    this.optMpeg.value = 'mpeg';
    this.optMpeg.appendChild(createEl('MPEG', true));
  
    switch(this.convert) {
      case 'mp3':
        this.optMp3.selected = 'selected';
        break;
      case 'mkv':
        this.optMp4.selected = 'selected';
        break;
      case 'webm':
        this.optWebm.selected = 'selected';
        break;
      case 'mov':
        this.optMov.selected = 'selected';
        break;
      case 'mpeg':
        this.optMpeg.selected = 'selected';
        break;
      default:
        this.optDis.selected = 'selected';
        break;
    }
  
    this.cSelEl.appendChild(this.optDis);
    //this.cSelEl.appendChild(this.optMp3);
    this.cSelEl.appendChild(this.optMp4);
    this.cSelEl.appendChild(this.optWebm);
    this.cSelEl.appendChild(this.optMov);
    this.cSelEl.appendChild(this.optMpeg);
    cEl.appendChild(this.cSelEl);
    cEl.appendChild(cElLabel);    
  
    this.image.src = item.image;
    moreIco.innerHTML = 'more_vert';
    closeIco.innerHTML = 'close';
    rmIco.innerHTML = 'remove';
    this.image.classList.add('activator');
    moreIco.classList.add('material-icons');
    closeIco.classList.add('material-icons', 'right');
    rmIco.classList.add('material-icons', 'left');
    contentEl.classList.add('card-content');
    optionsEl.classList.add('card-reveal');
    this.qSelEl.classList.add('q-select-item');
    this.cSelEl.classList.add('c-select-item');
    qEl.classList.add('input-field');
    cEl.classList.add('input-field');
    bottomEl.classList.add('btn-container');
    rmBtn.classList.add('btn-floating', 'waves-effect', 'waves-light', 'right', 'dark-red', 'z-depth-2', 'remove');
    titleEl.classList.add('card-title', 'activator', 'grey-text', 'text-darken-4', 'truncate');
    titleElOpt.classList.add('card-title', 'activator', 'grey-text', 'text-darken-4');
    thumbEl.classList.add('card-image', 'waves-effect', 'waves-block', 'waves-light');
    titleEl.title = this.title;
    thumbEl.appendChild(this.image);
    titleEl.appendChild(createEl(shortTitle, true));
    titleEl.appendChild(moreIco);
    titleElOpt.appendChild(createEl('Options', true));
    titleElOpt.appendChild(closeIco);
    infoEl.classList.add('info');
    infoTxt.classList.add('info-txt');
    cProgress.classList.add('progress');
    infoEl.appendChild(infoTxt);
    infoEl.appendChild(cProgress);
    rmBtn.appendChild(rmIco);
  
    rmBtn.onclick = (ev) => {
      animateCSS(this.element, 'zoomOut').then(() => {
        const parent = this.element.parentElement;
        parent.removeChild(this.element);
        if(parent.children.length < 1)
          getElem('#download-btn').classList.add('scale-out');
      });
    }
  
    this.qSelEl.onchange = (ev) => {
      this.quality = this.qSelEl.options[this.qSelEl.selectedIndex].value;
      this.element.dataset.quality = this.quality;
    }
  
    this.cSelEl.onchange = (ev) => {
      this.convert = this.cSelEl.options[this.cSelEl.selectedIndex].value;
      this.element.dataset.convert = this.convert;
    }
    
    const speedEl = createEl('span');
    speedEl.classList.add('dl-speed');
  
    bottomEl.appendChild(rmBtn);
    contentEl.appendChild(titleEl);
    infoEl.appendChild(speedEl);
    contentEl.appendChild(infoEl);
    optionsEl.appendChild(titleElOpt);
    optionsEl.appendChild(cEl);
    optionsEl.appendChild(qEl);
    contentEl.appendChild(bottomEl);
  
    this.element.classList.add('card', 'grey', 'lighten-4', 'hoverable', 'faster');
  
    this.element.appendChild(thumbEl);
    this.element.appendChild(contentEl);
    this.element.appendChild(optionsEl);      
  }
  
  toggleExtendedMode() {
    if(this.cSel ==! undefined) {
      if(!this.extendedMode) {
        delete this.cSel.disabled;
        delete this.optHigh.disabled;
      }
      else {
        this.cSel.disabled = true;
        this.optHigh.disabled = true;
      }
    }
  
    this.extendedMode = !this.extendedMode;
  }
  
  init() {
    M.FormSelect.init(this.cSelEl, {});
    M.FormSelect.init(this.qSelEl, {});
  }
  
  reInit() {
    M.FormSelect.getInstance(this.cSelEl).destroy();
    M.FormSelect.getInstance(this.qSelEl).destroy();
    this.init();
  }
  
  appendTo(elem) {
    elem.appendChild(this.element);
    this.init();
  }
}

Card.prototype.quality = 'high';
Card.prototype.convert = false;
Card.prototype.extendedMode = true;
