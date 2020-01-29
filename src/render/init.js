const {ipcRenderer, clipboard, remote, shell} = require('electron');
const {dialog} = require('electron').remote;
const {getElem, getElems, animateCSS, createEl, selectOption} = require('./utils');
const ytdl = require('ytdl-core');
const version = require('../../package.json');

function validUrlTFunc() {
  const url = clipboard.readText('text');
  if(ytdl.validateURL(url)) {
    getElem('#add-btn').classList.add('pulse');
    if(config.api !== undefined && config.api.active)
      getElem('#paste-url-btn').classList.add('pulse');
  }
  else {
    getElem('#add-btn').classList.remove('pulse');
    if(config.api !== undefined && config.api.active)
      getElem('#paste-url-btn').classList.remove('pulse');
  }
}

getElem('#year').innerHTML = new Date().getFullYear();
getElem('#version').innerHTML = version.version;

exports.ipcRenderer = ipcRenderer;
exports.clipboard = clipboard;
exports.remote = remote;
exports.shell = shell;
exports.dialog = dialog;
exports.getElem = getElem;
exports.getElems = getElems;
exports.animateCSS = animateCSS;
exports.createEl = createEl;
exports.selectOption = selectOption;
exports.ytdl = ytdl;
exports.version = version;
exports.config = {};
exports.validUrlTFunc = validUrlTFunc;
exports.timer = setInterval(validUrlTFunc, 1000);
