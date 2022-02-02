<img src="https://raw.githubusercontent.com/jibbex/yt-Download/master/assets/images/icon-512.png" align="right" width="164" height="164">

# YT Download
<img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/jibbex/yt-Download/build?12" align="right">
<img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/jibbex/yt-Download" align="right">
<img alt="GitHub package.json dependency version (dev dep on branch)" src="https://img.shields.io/github/package-json/dependency-version/jibbex/yt-Download/dev/electron" align="right">

*Downloads videos from Youtube.*

### Table of contents
- [YT Download](#yt-download)
    + [Table of contents](#table-of-contents)
    + [Node.js and Electron](#nodejs-and-electron)
    + [FFmpeg](#ffmpeg)
  * [Quickstart](#quickstart)
    + [Initialize](#initialize)
    + [Starting YT Download](#starting-yt-download)
    + [Create package](#create-package)
    + [Create installer](#create-installer)
  * [Changelog](#changelog)
    + [v1.5.32](#v1532)
    + [v1.5.31](#v1531)
    + [v1.5.3](#v153)
    + [v1.5.1](#v151)
    + [v1.4.0](#v140)
    + [v1.0.0](#v100)

### Node.js and Electron
This Software uses [Node.js](https://nodejs.org/en/) and [Electron](https://electronjs.org/) to utilize JavaScript, HTML, and CSS for cross platform desktop apps.


### FFmpeg
*[FFmpeg](https://www.ffmpeg.org/) is required to download HD quality videos and convert files. YT Download also works with limited functionality without FFmpeg.*

**if FFmpeg was not found, YT Download will ask you if you want to download it. In this case you don't need to worry about setting the environment variables.**

## Quickstart

### Initialize
```
npm install
```
*or with yarn*
```
yarn install
```

### Starting YT Download
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

### Create package
```
npm run package
```
*or with yarn*
```
yarn package
```

### Create installer
```
npm run make
```
*or with yarn*
```
yarn make
```

## Changelog

### v1.5.32

 * Fixed slow downloads again

### v1.5.31

 * Fix for slow downloads

### v1.5.3

 * Update due to YouTube API changes.

### v1.5.1

* Render process runs now in context isolation
* Support for Electron > 11
* Removed unused code
* Updated dependencies (e.g. Electron 12.0.5)

### v1.4.0

* The mess that was *./main/ffmpeg.js* was fixed.
* Audio and video downloads are now shown in one progress bar.
* Added proper progress for media conversion.
* The download speed is now displayed.
* Added support for hardware accelerated encoding. *(Tries to find the optimal mode automatically)*
* Some UI improvements.

### v1.0.0

* New UI build on [Materialize](https://materializecss.com/) framework
* Downloading from Youtube in HD quality if possible
* Converting to ~~MP3~~, MKV, WEBM, MOV and MPEG
* Select quality of the download
* Easy package and installer building with [Electron Forge](https://github.com/electron-userland/electron-forge)
