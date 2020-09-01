const { app }             = require('electron');
const { promisify }       = require('util');
const { EventEmitter }    = require('events');
const { 
        promises: fs,
        createWriteStream
      }                   = require('fs');
const os                  = require('os');
const ffbinaries          = require('ffbinaries');
const { queue, asyncify } = require('async');
const { spawn, exec }     = require('child_process');
const path                = require('path');
const ytdl                = require('ytdl-core');
const { removeSpecials }  = require('./../utils');

const downloadFFmpeg    	= promisify(ffbinaries.downloadFiles);
const execAsync           = promisify(exec);
const TEMP_DIR            = path.join(app.getPath('temp'));
const CODECS              = {
                              h264: 'libx264', mpeg2: 'mpeg2video',
                              vp9: 'libvpx-vp9', aac: 'aac', 
                              mp3: 'libmp3lame', vorbis: 'libvorbis'
                            };                     
const kill                = require('tree-kill');
let   proc

/**
 * Checks if FFmpeg is installed
 *
 * @param {object} options
 *  { bins, paths : [], ensureExecutable : bool }
 *
 * 
 */

function isInstalled(options = {}) {  
  const opt     = { 
                  bins: ['ffmpeg', 'ffprobe'], 
                  paths: [path.join(process.cwd(), '/ffmpeg')],
                  ensureExecutable: true,              
                };  
  
  if(opt.bins.length > 4) {
    throw new Error('Length of options.bins[] is to large.')
  }
  
  Object.assign(opt, options);  
  
  const bins = ffbinaries.locateBinariesSync(
                opt.bins, 
                { paths: opt.paths, 
                  ensureExecutable: opt.ensureExecutable });

  for(bin of opt.bins) {    
    if(bins[bin].found == false) {
      return false;
    }    
  }
  
  return true;
}

/**
 * Downlaods FFmpeg binaries
 *
 * @param {object} options
 *  { bins : [], dest : string, tickerFn : function }
 *
 * 
 */

async function getFFmpeg(options = {}) {
  const opt = { 
                bins: ['ffmpeg', 'ffprobe'], 
                dest: path.join(process.cwd(), '/ffmpeg'),                
                tickerFn: (progress) => { console.log(progress) }
              };
  
  if(opt.bins.length > 4) {
    throw new Error('Length of options.bins[] is to large.')
  }
  
  Object.assign(opt, options);

  const paths = {}
  const os    = ffbinaries.detectPlatform();
  const bins  = await downloadFFmpeg(
                  opt.bins, 
                  { destination: opt.dest, tickerFn: opt.tickerFn });           
  
  for(bin of bins) {          
    paths[bin.filename] = path.join
                          (
                            bin.path, 
                            ffbinaries.getBinaryFilename(bin.filename, os)
                          );
  }
    
  return paths;
}

/**
 * Returns the path to the FFmpeg binaries
 *
 * @param {string} bin
 * @param {array} paths
 *
 * 
 */

function getBin(bin, paths = [path.join(process.cwd(), '/ffmpeg')]) {
  const dir  = ffbinaries.locateBinariesSync(
                [bin], 
                { paths: paths, 
                  ensureExecutable: true });        
  return path.join(dir[bin].path);
}

/**
 * Returns file download stream
 *
 * @param {object} options 
 *  { url, file : string, quality : object }
 *
 * 
 */

function getFile(options) {  
  const stream = ytdl(options.url, options.quality);
  stream.pipe(createWriteStream(options.file));  
  return stream;
}

/**
 * Spawns FFmpeg in a child process
 *
 * @param {object} _this Reference to calling object  
 * @param {array} files
 * @param {string} format 
 * @param {string} out
 * 
 */

async function convert({ bin, acceleration, accels }, files, format, out) {      
  const infos = [];
  const times = [];
  const args  = [];
  let   cv    = 'copy';
  let   ca    = 'copy';
  
  const { 
    aac, h264, cuda, cuvid, vp9, mpeg2, mp3, vorbis 
  } = CODECS;
  
  files = typeof files === 'string' ? [files] : files;
  
  for(file of files) {
    const { stdout }          = await execAsync
                                (
                                  `${bin.ffprobe} \
                                  -print_format json \
                                  -show_format \
                                  -show_streams \
                                  "${file}"`
                                );
    const { format, streams } = JSON.parse(stdout);
    times.push(format.duration);
    infos.push(...streams);    
    args.push(`-i "${file}"`);    
  }
  
  if(format != 'mp3') {
    const audioCodec = infos.find(el => el.codec_type == 'audio').codec_name;
    const videoCodec = infos.find(el => el.codec_type == 'video').codec_name;    
    
    if(format == 'mp4' || format == 'mov') {
      ca = audioCodec == 'aac' ? 'copy' : aac;
      cv = videoCodec == 'h264' ? 'copy' : accels.has('cuda') 
                            ? 'h264_nvenc' : accels.has('cuvid') ? 'h264_cuvid' 
                            : accels.has('qsv') ? 'h264_qsv' : h264;   
    }
    else if(format == 'webm') {
      cv = videoCodec == 'vp9' ? 'copy' : vp9;
      ca = audioCodec == 'vorbis' ? 'copy' : vorbis;
    }
    else if(format == 'mpeg') {
      cv = accels.has('qsv') ? 'mpeg2_qsv' : mpeg2;
      ca = mp3;
    }      
    
    args.push(`-c:v ${cv} -c:a ${ca}`);
  }
  else {
    args.push(`-c:a ${mp3}`)
  }
  
  if(acceleration) {
    const hw = cv.indexOf('nvenc') !== -1 
                ? 'cuda' : cv.indexOf('cuvid') !== -1 
                ? 'cuvid' : cv.indexOf('qsv') !== -1 
                ? 'qsv' : 'auto';
    
    args.unshift(`-hwaccel ${hw}`);
  }
  
  args.push(out ? `-y "${out}"` : `-y "${files}.${format}"`);
  
  const duration = Math.max(...times);
  
  proc = spawn(bin.ffmpeg, args, {shell: true});  
  
  return Object.assign(proc, { duration: duration, args: args.join(' ') });  
}

/**
 * Queues for downloading and converting
 *
 * 
 */

const queues = {
  downloads: queue(({ item, _this }, cb) => {
    const HIGH_VIDEO    = { quality: 'highestvideo', filter: 'videoonly' };
    const MEDIUM_VIDEO  = { quality: 'highest', filter: 'audioandvideo' };
    const LOW_VIDEO     = { quality: 'lowest', filter: 'audioandvideo' };
    const HIGH_AUDIO    = { quality: 'highestaudio', filter: 'audioonly' };
    const MEDIUM_AUDIO  = { quality: 'highest', filter: 'audioonly' };
    const LOW_AUDIO     = { quality: 'lowest', filter: 'audioonly' };
    
    const title       = removeSpecials(item.title);    
    const format      = item.convert || 'mp4';
    const audioFormat = 'm4a';
    const file        = path.join(`${item.path}/${title}.${format}`);    
    const audioTmp    = path.join(`${TEMP_DIR}/${item.id+Date.now()}.${audioFormat}`);    
    const videoTmp    = path.join(`${TEMP_DIR}/${item.id+Date.now()}.${format}`);      
    const out         = item.quality == 'high' ? videoTmp : file;      
    const files       = [];
    const start       = Date.now();
    const progress    = {
                          speed: 0,
                          video: {
                            downloaded: 0,
                            tota: 0
                          },
                          audio: {
                            downloaded: 0,
                            total: 0
                          },
                          downloaded: 0,
                          total: 0
                        };
    let   downloaded  = false;
    
    const onStart = () => {
      _this.emit('download-start', Date.now());
    };
    
    const onError = (error) => {
      cb(error);
    };
    
    const onEnd = () => {
      if(item.quality == 'high' && item.convert != 'mp3' && !downloaded) {          
        downloaded = true;
        return;
      }
      else {
        cb(undefined, Object.assign(item, { files: files, format: format, out: file }, item._this ))
      }          
    }
    
    if(item.convert != 'mp3') {
      const quality = item.quality == 'high' 
                    ? HIGH_VIDEO
                    : item.quality == 'medium' 
                      ? MEDIUM_VIDEO
                      : LOW_VIDEO;                          
            
      const vs = getFile({ url: item.url, file: out, quality: quality});
      files.push(out);
      
      vs.once('response', onStart);
      vs.on('error', onError);
      vs.on('end', onEnd);
      
      vs.on('progress', (chunkLength, downloaded, total) => {        
        progress.video = {
          downloaded: parseInt(downloaded),
          total: parseInt(total)
        }
        
        progress.total = progress.video.total + progress.audio.total;
        progress.downloaded = parseInt(downloaded) + progress.audio.downloaded;
        
        const percent = (progress.downloaded / progress.total * 100).toFixed(2);
        const speed   = parseInt(progress.downloaded / ((Date.now() - start) / 1000));
        
        _this.emit('progress', 
                    { 
                      job: 'Downloading', 
                      progress: percent, 
                      p: progress,
                      elemId: item.elemId,
                      speed: speed
                    }
                  );    
      });  
    }
      
    if(item.quality == 'high' || item.convert == 'mp3') {  
      const quality = item.quality == 'high' 
                    ? HIGH_AUDIO
                    : item.quality == 'medium' 
                      ? MEDIUM_AUDIO
                      : LOW_AUDIO;                                                    
      
      const as = getFile({ url: item.url, file: audioTmp, quality: quality });
      files.push(audioTmp);
      
      as.once('response', onStart);    
      as.on('error', onError);    
      as.on('end', onEnd);
      
      as.on('progress', (chunkLength, downloaded, total) => {        
        progress.audio = {
          downloaded: parseInt(downloaded),
          total: parseInt(total)
        }
        
        progress.total = progress.video.total + progress.audio.total;
        progress.downloaded = parseInt(downloaded) + progress.video.downloaded;
                
        const percent = (progress.downloaded / progress.total * 100).toFixed(2);
        const speed   = parseInt(progress.downloaded / ((Date.now() - start) / 1000));
        
        _this.emit('progress', 
                    { 
                      job: 'Downloading', 
                      progress: percent, 
                      elemId: item.elemId,
                      speed: speed
                    }
                  );    
      });
    }
    
  }, 4),
  convert: queue(({ task, _this}, cb) => {      
    convert(_this, task.files, task.format, task.out).then(proc => {
      proc.stderr.on('data', (data) => {
        const str = data.toString();
        const i = str.indexOf('time=') + 5;
    
        if(i > 4) {
          let timecode = 0;
          let time = str.substr(i, 11);
    
          time = time.split(':');
    
          let h   = parseInt(time[0]);
          let m   = parseInt(time[1]);
          let s   = parseInt(time[2].split('.')[0]);
          let ms  = parseInt(time[2].split('.')[1]);

          if(h > 0) { timecode = h * 60 * 60 }
          if(m > 0) { timecode += m * 60 }
          if(s > 0) { timecode += s }
          if(ms > 0) { timecode = parseFloat(`${timecode}.${ms}`).toFixed(2) };
    
          const percent = parseFloat(timecode / proc.duration * 100).toFixed(2);
          
          _this.emit('progress', 
                      { 
                        job: 'Converting', 
                        progress: percent, 
                        duration: proc.duration,
                        elemId: task.elemId
                      }
                    );  
        }
      });
      
      proc.on('error', (error) => {
        cb(error);
      });
      
      proc.on('close', (code) => {
        task.files.forEach(async (file) => {
          await fs.unlink(file);              
        });
        
        cb(undefined, task);                    
      });
    }).catch(error => {
      cb(error);
    });
  }, 1)
}

/**
 * Searches for the matching audio/video files, 
 * downloads them and runs FFmpeg in a child process 
 * to convert them to the matching format.
 *
 * 
 */

class FFmpeg extends EventEmitter {
  constructor() {
    super();
    
    this.bin    = {};
    this.files  = [];
    this.accels = new Set();
    
    if(isInstalled()) {            
      this.bin.ffprobe  = getBin('ffprobe');
      this.bin.ffmpeg   = getBin('ffmpeg');
    }      
  }
  
  async download(item) {
    queues.downloads.push({ item, _this: this }, (error, task) => {
      if(error) {
        return this.emit('error', error);
      }
      
      this.emit('download-end', task);   
      
      if(task.quality == 'high' && task.convert != 'mp3') {
        this.emit(
          'convert-start', 
          { files: task.files, out: task.out, format: task.format }
        );
        
        queues.convert.push({ task, _this: this }, (error, task) => {
          if(error) {
            return this.emit('error', error);
          }          
          console.log(task.args)
          this.emit('finished', task.elemId);  
        });
      }      
      else {
        this.emit('finished', task.elemId);  
      }          
    });
    
    queues.downloads.error((error, task) => {
      this.emit('error', error);
    }) 
  }
  
   kill() {    
      if(!proc) {
        return false;  
      }
      proc.stdin.pause();
      proc.stdout.pause();
      proc.stderr.pause();
      kill(proc.pid);
  }
  
  set acceleration(active) {
    if(!active) {
      this.accels.clear();
      return;
    }
    
    execAsync(`${this.bin.ffmpeg} -hwaccels`).then(({ stdout }) => {
      const lines = stdout.split(os.EOL);
      this.accels = new Set(lines.slice(1, lines.length - 2));
    }).catch(error => {
      throw error;
    });
  }
  
  get acceleration() {
    return this.accels.size > 0;
  }
  
  set worker(i) {
    queues.downloads.concurrency = i;
  }
  
  get worker() {
    return queues.downloads.concurrency;
  }
}

exports.ffmpeg = new FFmpeg();
exports.downloadFFmpeg = getFFmpeg;
exports.isFFmpegInstalled = isInstalled;
