<img src="https://github.com/jibbex/yt-Download/blob/master/assets/images/icon-512.png" align="right" width="164" height="164">

# YT Download

*Downloads videos from Youtube.*

Pre-compiled builds and more information can be found at [ytdl.michm.de](https://ytdl.michm.de).

### Node.js and Electron
This Software uses [Node.js](https://nodejs.org/en/) and [Electron](https://electronjs.org/) to utilize JavaScript, HTML, and CSS for cross platform desktop apps.


### FFmpeg
*[FFmpeg](https://www.ffmpeg.org/) is required to download HD quality videos and convert files. YT Download also works with limited functionality without FFmpeg.*

**if FFmpeg was not found, YT Download will ask you if you want to download it. In this case you don't need to worry about setting the environment variables.**


### New Features in 1.0.0

* New UI build on [Materialize](https://materializecss.com/) framework
* Downloading from Youtube in HD quality if possible
* Converting to MP3, MKV, WEBM, MOV and MPEG
* Select quality of the download
* Easy package and installer building with [Electron Forge](https://github.com/electron-userland/electron-forge)

---
#### Initialize
```
npm install
```
*or with yarn*
```
yarn install
```

#### Starting YT Download
To start the release version enter
```
npm start
```
*or with yarn*
```
yarn start
```

To start the debug version with active Chrome Developer Mode enter
```
npm test
```
*or with yarn*
```
yarn test
```

---
#### Create Package
```
npm run package
```
*or with yarn*
```
yarn package
```

#### Create Installer
```
npm run make
```
*or with yarn*
```
yarn make
```
