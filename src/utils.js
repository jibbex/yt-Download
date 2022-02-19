const { 
    stat,
    mkdir, 
    writeFile, 
    readFile
 } = require('fs').promises;
 
const path    = require('path');

function removeSpecials(str) {
    const lower = str.toLowerCase();
    const upper = str.toUpperCase();

    let result = "";
    for(let i=0; i < lower.length; ++i) {
        if(lower[i] != upper[i] || lower[i].trim() === '')
            result += str[i];
    }

    return result;
}

class Config {
  constructor() {
    const DIR       = path.join(
                        (process.platform === 'win32' 
                            ? process.env.USERPROFILE 
                            : process.env['HOME'])
                        ,'/.yt-download'
                      );
    const FILE        = path.join(DIR, '/conf.json');
    
    this.DIRECTORY    = DIR;
    this.CONFIG_FILE  = FILE;
    
    Object.assign(this, {
      folder: path.join(require('electron').app.getPath('videos'), '/', 'yt-download'),
      convert: '',
      quality: 'high',
      acceleration: false,
      windowSize: {
        width:816,
        height:864
      }    
    });
  }
  
  get Obj() {
    const config = {};

    Object.assign(config, this)

    delete config.DIRECTORY;
    delete config.CONFIG_FILE;
    
    return config;
  }
  
  async init() {
    try {
      await mkdir(this.DIRECTORY);        
    }
    catch(error) {
      if(error.code !== 'EEXIST') {
        throw error;
      }
    }
    finally {
      try {
        const config = JSON.parse((await readFile(this.CONFIG_FILE)));        
        Object.assign(this, config);        
      }
      catch(error) {
        await writeFile(this.CONFIG_FILE, JSON.stringify(this.Obj, {flag: 'ax'}));        
      }

      try {
        await stat(this.folder);
      } 
      catch(error) {
        if(error.code === 'EEXIST') {
            await mkdir(this.folder, { recursive: true });
        }   
      }
    }

    return this;
  }
  
  async save(config) {
    Object.assign(this, config);
    await writeFile(this.CONFIG_FILE, JSON.stringify(this.Obj));
  }
}

exports.config = new Config();
exports.removeSpecials = removeSpecials;
