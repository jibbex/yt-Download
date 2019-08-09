<img src="https://github.com/jibbex/yt-Download/blob/master/assets/images/ico114.png" align="left" height="48" width="48">

# yt-Download 

*Downloads videos from Youtube.* 

Pre-compiled builds and more information can be found at [ytdl.michm.de](https://ytdl.michm.de).

### Node.js and Electron
This Software uses [Node.js](https://nodejs.org/en/) and [Electron](https://electronjs.org/) to utilize JavaScript, HTML, and CSS for cross platform desktop apps.

---
### Initialize
```
npm config set yt-download:directory /path/to/project/
npm install
```

### Starting ytDownload
To start the release version enter ``npm start`` and ``npm test`` for the debug version with active Chrome Developer Mode.


### Binaries
In order to build binary packages you have to install [electron-packager](https://github.com/electron-userland/electron-packager).

```
npm install electron-packager -g
npm install electron-packager --save-dev
```
---
## Build for Windows
To simplify the build process, you can use the *npm* scripts. If you doesn't have changed the **yt-download:directory** variable yet, then you should probably do that now.

You need [electron-builder](https://github.com/electron-userland/electron-builder) to create a NSIS installer for Windows.

```
npm install electron-builder -g
npm install electron-builder --save-dev
```

#### Create Package
To build binaries for Windows just enter ``npm run package-win``.

#### Building ytDownload and create NSIS Installer
To compile binaries and create an installer, you must enter ``npm run installer-win`` in the console.

#### Please notice, the code is not signed
In the ***./dist/*** folder you will find the binarys and the installer. The code is not signed so Windows will warn you at the first start or the installation process.

## Build for Linux
In order to simplify the build process, you can use the *npm* scripts. If you doesn't have changed the **yt-download:directory** variable yet, then you should probably do that now.

With [electron-installer-debian](https://github.com/electron-userland/electron-installer-debian) you can create a Debian installer

```
npm install electron-installer-debian -g
npm install electron-installer-debian --save-dev
```

#### Create Package
To build binaries for a Debian based OS just enter ``npm run package-deb``.

Now you are able to start the program with following command.

```
./dist/yt-download-linux-x64/yt-download
```

#### Create Installer
After you have built the package, you can create an installer.

```
npm run installer-deb
```
