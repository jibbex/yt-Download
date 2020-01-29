const { app } = require('electron');
const fs = require('fs');
const FFMPEG = require('fluent-ffmpeg');
const ffbinaries = require('ffbinaries');
const path = require('path');
const ytdl = require('ytdl-core');
const {removeSpecials, unlink} = require('./../utils');

/**
 * Searchs for FFmpeg binaries
 *
 */
const checkForFFMPEG = () => {
  return new Promise((resolve, reject) => {
    try {
      const bin = results = ffbinaries.locateBinariesSync(['ffmpeg'], { paths: [path.join(__dirname,'./../../ffmpeg')], ensureExecutable: true });

      if(!bin.ffmpeg.found) {
        resolve(false);
      }
      else {
        resolve(true);
      }
    }
    catch(error) {
      reject(error);
    }
  });
}

/**
 * Searchs for FFmpeg binaries and
 * downloads them if they are not found
 *
 */
const getFFMPEG = () => {
  return new Promise((resolve, reject) => {
    try {
      const bin = results = ffbinaries.locateBinariesSync(['ffmpeg'], { paths: [path.join(__dirname,'./../../ffmpeg')], ensureExecutable: true });

      if(!bin.ffmpeg.found) {
        const ffmpegPath = path.join(__dirname, './../../ffmpeg');
        const platform = ffbinaries.detectPlatform();

        return ffbinaries.downloadFiles(['ffmpeg'], {destination: ffmpegPath, tickerFn: (progress) => console.log(progress)}, function (err, data) {
          if(err) {
            reject(err);
            return;
          }
          console.log(data);
          const ffmpeg = data[data.findIndex(i => i.filename == 'ffmpeg')];

          const dirs = {
            ffmpeg: path.join(ffmpeg.path, ffmpeg.filename + '.exe')
          };

          resolve(dirs);
        });
      }
      else {
        const dirs = {
          ffmpeg: path.join(bin.ffmpeg.path)
        };
        resolve(dirs)
      }
    }
    catch(e) {
      reject(e);
    }
  })
}

class FFmpeg {
  constructor() {
    checkForFFMPEG().then((installed) => {
      if(installed) {
          getFFMPEG().then((binaries) => {
            FFMPEG.setFfmpegPath(binaries.ffmpeg);
          })
          .catch((err) => {
            console.error(err);
            throw new Error(err);
          });
      }
    }).catch((err) => {
      throw new Error(err)
    })
  }

  set ffmpegPath(path) {
    FFMPEG.setFfmpegPath(path);
  }

  set ffprobePath(path) {
    FFMPEG.setFfprobePath(path);
  }

  set flvtoolPath(path) {
    FFMPEG.setFlvtoolPath(path);
  }

  get mainWindow() {
    return this._mainWindow;
  }
  set mainWindow(window) {
    this._mainWindow = window;
  }

  /**
   * Converts a video
   *
   * @param {string} file
   * @param {string} out
   * @param {string} format
   */
  async convert(file, output, format) {
    return new Promise((resolve, reject) => {
      let vCodec = 'copy';
      let aCodec = 'copy';

      switch(format) {
        case 'mkv':
          vCodec = 'libx265';
          aCodec = 'aac';
          break;
        case 'webm':
          vCodec = 'libvpx';
          aCodec = 'libvorbis';
          break;
        case 'mov':
          vCodec = 'libx264';
          aCodec = 'aac';
          break;
        case 'mpeg':
          vCodec = 'mpeg2video';
          aCodec = 'libmp3lame';
          break;
      }

      try {
        this._mainWindow.webContents.send('message', {command: 'startConvert', onlyConv: true});
      }
      catch(err) {
        console.error(err);
        reject(err);
      }

      const of = `${output}.${format}`;
      const ffmpeg = FFMPEG();

      ffmpeg.input(file);
      ffmpeg.videoCodec(vCodec);
      ffmpeg.audioCodec(aCodec);
      ffmpeg.save(of);

      ffmpeg.on('error', (err) => {
        console.error(err);
        this._mainWindow.webContents.send('message', {command: 'error', error: err.message});
        reject(err);
      });

      ffmpeg.on('progress', progress => {
        this._mainWindow.webContents.send('message', {command: 'converting', progress: progress});
      });

      ffmpeg.on('end', async () => {
        try {
          await unlink(file);
          this._mainWindow.webContents.send('message', {command: 'downloaded'});
          resolve(of);
        }
        catch(err) {
          this._mainWindow.webContents.send('message', {command: 'error', error: err});
          reject(err);
        }
      });
    });
  }

  /**
   * Merges audio and video to one file
   *
   * @param {string} audio
   * @param {string} video
   * @param {string} file
   * @param {string} format
   */
  async merge(audio, video, file, format) {
    return new Promise((resolve, reject) => {
      const ffmpeg = new FFMPEG();
      console.log(video);
      console.log(audio);
      console.log(format);
      console.log(file);
      this._mainWindow.webContents.send('message', {command: 'startMerge', onlyConv: false});

      ffmpeg.input(video).videoCodec('libx264');
      ffmpeg.input(audio).audioCodec('libmp3lame');
      ffmpeg.save(file);

      ffmpeg.on('error', async (err) => {
        console.error(err);
        await unlink(audio);
        await unlink(video);
        this._mainWindow.webContents.send('message', {command: 'error', error: err.message});
        reject(err);
      });

      ffmpeg.on('progress', progress => {
        this._mainWindow.webContents.send('message', {command: 'converting', progress: progress});
      });

      ffmpeg.on('end', async () => {
        await unlink(audio);
        await unlink(video);

        try {
          this._mainWindow.webContents.send('message', {command: 'downloaded'});
          resolve(file);
        }
        catch(err) {
          console.log(err);
          this._mainWindow.webContents.send('message', {command: 'error', error: err});
          reject(err);
        }
      });
    });
  }

  /**
   * Downloads a file from Youtube
   *
   * @param {Object} options
   */
  getFile(options) {
    return new Promise((resolve, reject) => {
      const stream = ytdl(options.url, options.quality);

      let starttime;

      stream.pipe(fs.createWriteStream(options.file));

      stream.once('response', () => {
        starttime = Date.now();
      });

      stream.on('progress', (chunkLength, downloaded, total) => {
        const percent = (downloaded / total * 100).toFixed(2);
        this._mainWindow.setProgressBar(2);
        const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
        this._mainWindow.webContents.send('message', {command: 'progress', stream: options.stream, job: 'Downloading', percent: percent});
      });

      stream.on('end', () => {
        this._mainWindow.setProgressBar(0);
        resolve(options.file);
      });

      stream.on('error', (err) => {
        console.log(err);
        reject(err);
      });
    });
  }

  /**
   * Downloading, merging and converting
   *
   * @param {Object} item
   */
  async download(item) {
    const TEMP_DIR = path.join(app.getPath('temp'));
    const HIGH_VIDEO = {
      quality: 'highestvideo',
      filter: format => {
        return !format.audioEncoding;
      }
    };
    const MEDIUM_VIDEO = { quality: 'highest', filter: 'audioandvideo' };
    const LOW_VIDEO = { quality: 'lowest', filter: 'audioandvideo' };
    const HIGH_AUDIO = {quality: 'highestaudio', filter: format => !format.encoding}
    const MEDIUM_AUDIO = { quality: 'highest', filter: 'audioonly' };
    const LOW_AUDIO = { quality: 'lowest', filter: 'audioonly' };

    const title = removeSpecials(item.title);

    if(item.quality == 'high' && item.convert != 'mp3') {

      const videoFormat = 'mp4';
      const audioFormat = 'm4a';
      const audioTmp = path.join(`${TEMP_DIR}/${item.id}.${audioFormat}`);
      const videoTmp = path.join(`${TEMP_DIR}/${item.id}.${videoFormat}`);
      const file = path.join(`${item.path}/${title}.${videoFormat}`);

      let downloaded = false;

      this.getFile({url: item.url, file: audioTmp, quality: HIGH_AUDIO, stream: 'audio'})
        .then(async (f) => {
          if(!downloaded) {
            downloaded = true
          } else {
            this._mainWindow.webContents.send('message', {command: 'startMerge'});
            const merged = await this.merge(audioTmp, videoTmp, file, item.convert);
            if(item.convert != 'mp3' && item.convert != '')
              await this.convert(merged, `${item.path}/${title}`, item.convert);
            this._mainWindow.webContents.send('message', {command: 'remove', elId: item.elemId});
          }
      }).catch(async (err) => {
        if(err.message == 'Status code: 404') {
          item.quality = 'medium';
          await this.download(item);
          return
        }

        console.error(err.message);
        this._mainWindow.webContents.send('message', {command: 'error', error: err.message});
        this._mainWindow.webContents.send('message', {command: 'remove', elId: item.elemId});
      });

      this.getFile({url: item.url, file: videoTmp, quality: HIGH_VIDEO, stream: 'video'})
        .then(async (f) => {
          if(!downloaded) {
            downloaded = true
          } else {
            this._mainWindow.webContents.send('message', {command: 'startMerge'});
            const merged = await this.merge(audioTmp, videoTmp, file, item.convert);
            if(item.convert != 'mp3' && item.convert != '')
              await this.convert(merged, `${item.path}/${title}`, item.convert);
            this._mainWindow.webContents.send('message', {command: 'remove', elId: item.elemId});
          }
      }).catch(async (err) => {
        if(err.message == 'Status code: 404') {
          item.quality = 'medium';
          await this.download(item);
          return
        }

        console.error(err.message);
        this._mainWindow.webContents.send('message', {command: 'error', error: err.message});
        this._mainWindow.webContents.send('message', {command: 'remove', elId: item.elemId});
      });

    }
    else if((item.quality == 'medium' || item.quality == 'low') && item.convert != 'mp3') {
      const videoFormat = 'mp4';
      const file = path.join(`${item.path}/${title}.${videoFormat}`);

      let q = item.quality = 'medium' ? MEDIUM_VIDEO : LOW_VIDEO;

      await this.getFile({url: item.url, file: file, quality: q, stream: 'video'});

      this._mainWindow.webContents.send('message', {command: 'downloaded', stream: 'video'});

      if(item.convert != 'mp3' && item.convert != '')
        await this.convert(file, `${item.path}/${title}`, item.convert);

      this._mainWindow.webContents.send('message', {command: 'remove', elId: item.elemId});
    }
    else if(item.convert == 'mp3') {
      const audioFormat = 'm4a';
      const audioTmp = path.join(`${TEMP_DIR}/${item.id}.${audioFormat}`);
      const file = path.join(`${item.path}/${title}.mp3`)

      let q = HIGH_AUDIO;

      if(item.quality == 'medium') {
        q = MEDIUM_AUDIO;
      }
      else if(item.quality == 'low') {
        q = LOW_AUDIO;
      }

      const tmp = await this.getFile({url: item.url, file: audioTmp, quality: q, stream: 'video'});

      this._mainWindow.webContents.send('message', {command: 'downloaded', stream: 'video'});

      this._mainWindow.webContents.send('message', {command: 'startConvert', onlyConv: false});

      const ffmpeg = new FFMPEG();

      ffmpeg.input(tmp);
      ffmpeg.format('mp3');
      ffmpeg.audioCodec('libmp3lame');
      ffmpeg.save(file);

      ffmpeg.on('error', (err) => {
        console.error(err);
        this._mainWindow.webContents.send('message', {command: 'error', error: err.message});
      });

      ffmpeg.on('progress', progress => {
          this._mainWindow.webContents.send('message', {command: 'converting', progress: progress});
      });

      ffmpeg.on('end', async () => {
        this._mainWindow.webContents.send('message', {command: 'downloaded', item: item});
        try {
          await unlink(tmp);
          this._mainWindow.webContents.send('message', {command: 'remove', elId: item.elemId});
        }
        catch(err) {
          console.error(err);
          this._mainWindow.webContents.send('message', {command: 'error', error: err.message});
        }
      });
    }
  }
}

const ffmpeg = new FFmpeg();

exports.ffmpeg = ffmpeg;
exports.checkForFFMPEG = checkForFFMPEG;
exports.getFFMPEG = getFFMPEG;
