import { ElectronAPI } from '@electron-toolkit/preload'

// 定义自动更新 API 的类型
interface UpdateAPI {
  onUpdateAvailable: (
    listener: ((event: Electron.IpcRendererEvent, info: unknown) => void) | null
  ) => void
  onUpdateNotAvailable: (
    listener: ((event: Electron.IpcRendererEvent, info: unknown) => void) | null
  ) => void
  onDownloadProgress: (
    listener: ((event: Electron.IpcRendererEvent, progress: unknown) => void) | null
  ) => void
  onUpdateDownloaded: (
    listener: ((event: Electron.IpcRendererEvent, info: unknown) => void) | null
  ) => void
  onUpdateError: (
    listener: ((event: Electron.IpcRendererEvent, error: string) => void) | null
  ) => void
  startDownloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  checkForUpdates: () => Promise<void>
  removeAllListeners?: (channel: string) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: UpdateAPI
  }
}
