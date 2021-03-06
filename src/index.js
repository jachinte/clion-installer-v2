import { app, shell, ipcMain, BrowserWindow } from 'electron';
import { enableLiveReload } from 'electron-compile';
import { download } from 'electron-dl';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const isDevMode = process.execPath.match(/[\\/]electron/);
if (isDevMode) enableLiveReload({ strategy: 'react-hmr' });

const createWindow = async() => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        icon: `${__dirname}/assets/icons/icon48x48.png`,
        fullscreen: false,
        fullscreenable: false,
        height: 400,
        maximizable: false,
        resizable: false,
        title: 'CLion Installation Assistant - University of Victoria',
        width: 720,
    });
    mainWindow.setFullScreenable(false);
    mainWindow.setResizable(false);
    // mainWindow.webContents.openDevTools();

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    ipcMain.on('download-files', async(event, files) => {
        const paths = new Set();
        const promises = files.map(file =>
            download(mainWindow, file.url, {
                saveAs: false,
                onProgress: progress => {
                    event.sender.send('download-progress', { progress, file });
                    if (progress >= 1) {
                        // TODO await not working
                        event.sender.send('download-complete', [...paths]);
                    }
                },
                onStarted: downloadItem => {
                    paths.add(downloadItem.getSavePath());
                }
            })
        );
        try {
            await Promise.all(promises);
        } catch (error) {
            event.sender.send('download-error', error);
        }
    });

    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
