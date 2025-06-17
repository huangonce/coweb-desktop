import { BrowserWindow, ipcMain, dialog, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import log from 'electron-log'

// 配置日志
log.transports.file.level = 'info'
autoUpdater.logger = log

// 全局变量跟踪主窗口
let mainWindowRef: BrowserWindow | null = null

// 确保安全发送消息到渲染进程
function safeSend(channel: string, ...args: unknown[]): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send(channel, ...args)
  } else {
    log.warn(`无法发送 ${channel} 消息: 主窗口不可用`)
  }
}

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow

  // 配置自动更新
  autoUpdater.autoDownload = false

  // 主窗口就绪后检查更新
  mainWindow.webContents.on('did-finish-load', () => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('检查更新失败:', err)
      safeSend('update-error', err.message)
    })
  })

  // 添加手动检查的 IPC 调用
  ipcMain.handle('check-for-updates', () => {
    autoUpdater.checkForUpdates()
  })

  // 监听更新可用事件
  autoUpdater.on('update-available', (info) => {
    safeSend('update-available', info)
  })

  // 监听更新不可用事件
  autoUpdater.on('update-not-available', (info) => {
    safeSend('update-not-available', info)
  })

  // 监听下载进度事件
  autoUpdater.on('download-progress', (progress) => {
    safeSend('download-progress', {
      percent: Math.floor(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  // 监听更新下载完成事件
  autoUpdater.on('update-downloaded', (info) => {
    safeSend('update-downloaded', info)
  })

  // 监听错误事件
  autoUpdater.on('error', (err) => {
    safeSend('update-error', err.message)

    // 开发环境下显示错误弹窗
    if (!app.isPackaged) {
      dialog.showErrorBox('更新错误', err.message)
    }
  })

  // 处理渲染进程的下载请求
  ipcMain.handle('start-download-update', () => {
    autoUpdater.downloadUpdate()
  })

  // 处理渲染进程的安装请求
  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall()
  })
}

// 开发环境模拟更新
export function setupDevAutoUpdate(): void {
  if (!app.isPackaged) {
    autoUpdater.updateConfigPath = path.join(__dirname, '../../dev-app-update.yml')
    autoUpdater.forceDevUpdateConfig = true

    // // 模拟更新检查
    // setTimeout(() => {
    //   safeSend('update-available', {
    //     version: '1.0.3',
    //     releaseDate: new Date().toISOString()
    //   })
    // }, 5000)
  }
}
