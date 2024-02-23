import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { MacosAdapter } from './macos'
import { compare, compareAsArUnpacked, compareAsar, compare_pkgs_asar, compare_pkgs_asar_unpacked, extractPkgs } from './compare'
import { WinAdapter } from './win'
import log from 'electron-log/main';

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: '协作安装包大小分析工具',
    width: 900,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get_apps', () => {
    // console.log('process.platform ', process.platform)
    if (process.platform === 'darwin') {
      const tool = new MacosAdapter()
      return tool.readApps()
    }
    if (process.platform === 'win32') {
      const tool = new WinAdapter()
      return tool.readApps()
    }
    return []
  })

  ipcMain.handle('compare', (_, args) => {
    return compareAsArUnpacked(args[0], args[1])
  })

  ipcMain.handle('compare_asar', (_, args) => {
    return compareAsar(args[0], args[1])
  })


  ipcMain.handle('compare_dll', (_, args) => {
    console.error(args[0], args[1])
    return compare(args[0], args[1], true)
  })


  ipcMain.handle('extract_pkgs', (_, args) => {
    try {
      return extractPkgs(args[0], args[1])
    } catch(e) {
      log.error('extract_pkgs ', e)
      return '解压失败'
    }
  })

  ipcMain.handle('compare_pkgs_asar', (_, args) => {
    return compare_pkgs_asar(args)
  })

  ipcMain.handle('compare_pkgs_asar_unpacked', (_, args) => {
    return compare_pkgs_asar_unpacked(args)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
