// preload.ts

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'translate'
  | 'settings'
  | 'dom-ready'
  | 'clipboard-text'
  | 'open-settings'
  | 'show-context-menu';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: any[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: any[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: any[]) => void) {
      ipcRenderer.once(channel, (_event, ...args: any[]) => func(...args));
    },
    // 'invoke' yöntemini ekliyoruz
    invoke(channel: Channels, ...args: any[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
  platform: process.platform,
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
