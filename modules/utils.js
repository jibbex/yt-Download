const fs = require('fs')

const CONST = require('./const').Constances

/**
 * Removes HTML special chars
 *
 * @param {string} html
 */
exports.removeSpecials = (str) => {
    const lower = str.toLowerCase();
    const upper = str.toUpperCase();

    let result = "";
    for(let i=0; i < lower.length; ++i) {
        if(lower[i] != upper[i] || lower[i].trim() === '')
            result += str[i];
    }

    return result;
}

/**
 * Initialize directorys and files.
 * Also trys to load config.
 *
 */
exports.initialisation = () => {
  fs.mkdir(
    CONST.DEFAULT_SETTINGS.folder,
    { recursive: false },
    () => {}
  );

  return new Promise((resolve, reject) => {
    fs.mkdir(CONST.DIRECTORY, { recursive: false }, (err) => {
      fs.readFile(CONST.CONFIG_FILE, (err, data) => {
        if(err) {
          fs.writeFile(
            CONST.CONFIG_FILE,
            JSON.stringify(CONST.DEFAULT_SETTINGS),
            {flag: 'ax'}, () => {resolve(CONST.DEFAULT_SETTINGS)});
        }
        else {
          resolve(JSON.parse(data));
        }
      })
    });
  })
}

/**
 * Saves Config
 *
 * @param {object} settings
 */
exports.saveConfig = (conf) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(CONST.CONFIG_FILE , JSON.stringify(conf), (err) => {
      if(err) {
        reject(err);
      }
      else {
        resolve(conf);
      }
    });
  })
}
