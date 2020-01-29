const {app} = require('electron');
const path = require('path')

const DIR = path.join((process.platform == 'win32' ? process.env.USERPROFILE : process.env['HOME']) + '/yt-download');
const FILE = path.join(DIR+ '/conf.json');

exports.Constances = {
  DIRECTORY: DIR,
  CONFIG_FILE: FILE,
  DEFAULT_SETTINGS: {
    folder: path.join(app.getPath('videos') + '/' + 'yt-download'),
    convert: '',
    quality: 'high',
    api: {
      active: false,
      key: ''
    },
    windowSize: {
      width:1050,
      height:920
    }
  }
}
