import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

autoUpdater.logger = {
  info: (message: string) => console.log(message),
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message),
  debug: (message) => console.debug('Update:', message)
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // 安全设置建议
      contextIsolation: true, // 保持开启
      nodeIntegration: false, // 必须关闭
      webSecurity: true // 开启安全策略
    }
  })

  setupAutoUpdater(mainWindow)

  // 设置 CSP 安全策略
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https://cometa-console.test.leicloud.net; " +
            "script-src 'self' 'unsafe-inline'; " + // 注意：unsafe-inline 有安全风险
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "img-src 'self' data: https://cometa-console.test.leicloud.net; " +
            "connect-src 'self' https://cometa-console.test.leicloud.net; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "frame-src 'none'; " + // 禁止内嵌框架
            "object-src 'none'" // 禁止插件
        ]
      }
    })
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
  // if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
  //   mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  // } else {
  //   mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  // }

  const appURL = 'http://localhost:4000'
  mainWindow.loadURL(appURL)
}

// 配置自动更新功能
function setupAutoUpdater(window: BrowserWindow): void {
  // 禁用自动下载，用用户手触发更新
  autoUpdater.autoDownload = false

  // 开发模式配置
  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true
    autoUpdater.updateConfigPath = join(__dirname, '../dev-app-update.yml')
  }

  // 检查更新
  autoUpdater.checkForUpdates()

  // 监听更新事件
  autoUpdater.on('checking-for-update', () => {
    window.webContents.send('update-status', 'checking')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    window.webContents.send('update-available', info)
  })

  autoUpdater.on('update-not-available', () => {
    window.webContents.send('update-status', 'no-update')
  })

  autoUpdater.on('download-progress', (progress) => {
    window.webContents.send('download-progress', progress)
  })

  autoUpdater.on('update-downloaded', (info) => {
    window.webContents.send('update-downloaded', info)
  })

  autoUpdater.on('error', (error) => {
    window.webContents.send('update-error', error.message)
  })

  // 处理来自渲染进程的更新命令
  ipcMain.on('check-for-update', () => {
    autoUpdater.checkForUpdates()
  })

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall()
  })
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
