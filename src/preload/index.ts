import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 自动更新相关的 API
const updateAPI = {
  // 更新可用
  onUpdateAvailable: (
    listener: ((event: Electron.IpcRendererEvent, info: unknown) => void) | null
  ) => {
    if (listener) {
      ipcRenderer.on('update-available', listener)
    } else {
      ipcRenderer.removeAllListeners('update-available')
    }
  },
  // 更新不可用
  onUpdateNotAvailable: (
    listener: ((event: Electron.IpcRendererEvent, info: unknown) => void) | null
  ) => {
    if (listener) {
      ipcRenderer.on('update-not-available', listener)
    } else {
      ipcRenderer.removeAllListeners('update-not-available')
    }
  },
  // 下载进度
  onDownloadProgress: (
    listener: (event: Electron.IpcRendererEvent, progress: unknown) => void | null
  ) => {
    if (listener) {
      ipcRenderer.on('download-progress', listener)
    } else {
      ipcRenderer.removeAllListeners('download-progress')
    }
  },
  // 更新下载完成
  onUpdateDownloaded: (
    listener: (event: Electron.IpcRendererEvent, info: unknown) => void | null
  ) => {
    if (listener) {
      ipcRenderer.on('update-downloaded', listener)
    } else {
      ipcRenderer.removeAllListeners('update-downloaded')
    }
  },
  // 更新错误
  onUpdateError: (listener: (event: Electron.IpcRendererEvent, error: string) => void | null) => {
    if (listener) {
      ipcRenderer.on('update-error', listener)
    } else {
      ipcRenderer.removeAllListeners('update-error')
    }
  },
  // 开始下载更新
  startDownloadUpdate: () => ipcRenderer.invoke('start-download-update'),
  // 安装更新
  installUpdate: () => ipcRenderer.invoke('install-update'),
  // 手动检查更新
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

// Custom APIs for renderer
const api = {
  ...updateAPI
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
