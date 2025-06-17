import { shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'

export function createWindow(): BrowserWindow {
  // 创建浏览器窗口
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

  // // 根据环境加载内容
  // if (process.env.NODE_ENV === 'development') {
  //   mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string)
  //   mainWindow.webContents.openDevTools()
  // } else {
  //   mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  // }

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

  const appURL = 'http://localhost:5001'
  mainWindow.loadURL(appURL)

  // 确保返回窗口实例
  return mainWindow
}
