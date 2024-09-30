// main.ts

import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  clipboard,
  IpcMainEvent,
  screen,
} from 'electron';
import log from 'electron-log';
import axios from 'axios';
import os from 'os';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import { resolveHtmlPath } from './util';
import http from 'http';
import https from 'https';

interface StoreSchema {
  shortcut: string;
  shortcut_prefix: string;
  keep_in_background: boolean;
  auto_start: boolean;
  run_in_background: boolean;
  isClipboardMonitoringActive: boolean;
  followMouseCursor: boolean;
}

const store = new Store<StoreSchema>({
  schema: {
    shortcut: {
      type: 'string',
      default: 'q',
    },
    shortcut_prefix: {
      type: 'string',
      default: os.platform() === 'darwin' ? 'option' : 'alt',
    },
    keep_in_background: {
      type: 'boolean',
      default: true,
    },
    auto_start: {
      type: 'boolean',
      default: false,
    },
    run_in_background: {
      type: 'boolean',
      default: true,
    },
    isClipboardMonitoringActive: {
      type: 'boolean',
      default: true,
    },
    followMouseCursor: {
      type: 'boolean',
      default: true,
    },
  },
});

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

let previousClipboardText = '';
let lastFocusTime = 0;
let isClipboardMonitoringActive = store.get('isClipboardMonitoringActive');

// Function to position the window relative to the cursor
function positionWindowRelativeToCursor() {
  if (!mainWindow) return;

  // Get the cursor position
  const cursorPos = screen.getCursorScreenPoint();

  // Get the window size
  const [winWidth, winHeight] = mainWindow.getSize();

  // Get the display work area
  const display = screen.getDisplayNearestPoint(cursorPos);
  const workArea = display.workArea;

  // Calculate the Y position
  let y = cursorPos.y - winHeight - 38; // 1 cm above

  if (y < workArea.y) {
    // If the window goes above the screen, position it below the cursor
    y = cursorPos.y + 38; // 1 cm below
  }

  // Calculate the X position and keep it within screen bounds
  const x = Math.max(
    Math.min(cursorPos.x - winWidth / 2, workArea.x + workArea.width - winWidth),
    workArea.x
  );

  // Set the window position
  mainWindow.setPosition(x, y);
}

// Clipboard monitoring function
function checkClipboardForChange() {
  if (!isClipboardMonitoringActive) return;
  const text = clipboard.readText();
  if (text && text !== previousClipboardText) {
    previousClipboardText = text;

    if (mainWindow) {
      mainWindow.webContents.send('clipboard-text', text);
    }

    const now = Date.now();
    if (now - lastFocusTime < 1000) {
      return;
    }
    lastFocusTime = now;

    if (mainWindow) {
      if (store.get('followMouseCursor')) {
        // Position the window relative to the cursor
        positionWindowRelativeToCursor();
      }

      // Bring the window to the front and show it
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      } else if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      // Focus the window
      mainWindow.focus();

      // Temporarily set 'always on top'
      const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();

      // Restore 'always on top' setting after a short delay
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(isAlwaysOnTop);
        }
      }, 500);
    }
  }
}

// IPC listener for context menu
ipcMain.on('show-context-menu', (event: IpcMainEvent, x: number, y: number) => {
  const template: Electron.MenuItemConstructorOptions[] = [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'delete' },
    { type: 'separator' },
    { role: 'selectAll' },
  ];
  const menu = Menu.buildFromTemplate(template);
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    menu.popup({ window: win, x, y });
  }
});

// IPC handler for translation
ipcMain.handle('translate', async (event, text: string, targetLangs: string[]) => {
  try {
    const translatedTexts = await Promise.all(
      targetLangs.map((targetLang: string) => translateText(text, targetLang))
    );

    return ['success', ...translatedTexts];
  } catch (error) {
    console.error('Translation error:', error);
    return ['error', 'Translation failed.'];
  }
});

// Create an Axios instance with keep-alive settings
const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

// Optimized translation function
async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const url = 'https://translate.googleapis.com/translate_a/single';
    const params = {
      client: 'gtx',
      sl: 'auto',
      tl: targetLanguage,
      dt: 't',
      q: text,
    };

    const response = await axiosInstance.get(url, { params });

    const translations = response.data[0];
    let translatedText = '';

    translations.forEach((translation: any) => {
      translatedText += translation[0];
    });

    return translatedText;
  } catch (error: any) {
    console.error('Translation error:', error);
    return `Translation failed: ${error.message}`;
  }
}

// IPC listener for settings
ipcMain.on('settings', async (event, arg) => {
  const type = arg[0];
  if (type === 'get') {
    const items = arg[1];
    const res: any[] = [];
    items.forEach((item: keyof StoreSchema) => res.push(store.get(item)));
    event.reply('settings', res);
  } else if (type === 'set') {
    const key = arg[1][0] as keyof StoreSchema;
    const value = arg[1][1];
    if (value !== undefined) {
      store.set(key, value);
    }
    if (key === 'auto_start') {
      updateAutoStart();
    }
  }
});

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')({ showDevTools: false });
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name: string) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const getAssetPath = (...paths: string[]): string => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');
  return path.join(RESOURCES_PATH, ...paths);
};

// Function to create the system tray
function createTray() {
  const icon = getAssetPath('icon.png');
  const trayIcon = nativeImage.createFromPath(icon);
  tray = new Tray(trayIcon.resize({ width: 16 }));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        if (mainWindow) {
          mainWindow.removeAllListeners();
        }
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// Function to create the main window
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  if (!tray) {
    createTray();
  }

  const defaultW = 300;
  const defaultH = 500;

  mainWindow = new BrowserWindow({
    show: false,
    width: defaultW,
    height: defaultH,
    icon: getAssetPath('icon.png'),
    alwaysOnTop: false,
    webPreferences: {
      devTools: !app.isPackaged,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Added to prevent renderer throttling
    },
    frame: true,
    focusable: true,
    skipTaskbar: false,
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      if (store.get('followMouseCursor')) {
        // Position the window relative to the cursor
        positionWindowRelativeToCursor();
      }

      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
      }
    }
  });

  mainWindow.webContents.on('dom-ready', () => {
    if (mainWindow) {
      mainWindow.setSize(defaultW, defaultH);
    }
  });

  mainWindow.on('close', (event) => {
    if (store.get('run_in_background') === true) {
      event.preventDefault();
      if (mainWindow) {
        mainWindow.hide();
      }
    }
  });

  mainWindow.webContents.on('will-navigate', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });

  // Custom context menu for the title bar
  mainWindow.on('system-context-menu', (event) => {
    event.preventDefault();
    const titleBarContextMenu = Menu.buildFromTemplate([
      {
        label: 'Always on Top',
        type: 'checkbox',
        checked: mainWindow ? mainWindow.isAlwaysOnTop() : false,
        click: () => {
          if (mainWindow) {
            const isOnTop = !mainWindow.isAlwaysOnTop();
            mainWindow.setAlwaysOnTop(isOnTop);
          }
        },
      },
      {
        label: 'Follow Mouse Cursor',
        type: 'checkbox',
        checked: store.get('followMouseCursor'),
        click: () => {
          const currentSetting = store.get('followMouseCursor');
          store.set('followMouseCursor', !currentSetting);
        },
      },
      {
        label: "Don't jump with ctrl+c",
        type: 'checkbox',
        checked: !isClipboardMonitoringActive,
        click: () => {
          isClipboardMonitoringActive = !isClipboardMonitoringActive;
          store.set('isClipboardMonitoringActive', isClipboardMonitoringActive);
        },
      },
    ]);

    if (mainWindow) {
      titleBarContextMenu.popup({ window: mainWindow });
    }
  });
};

// Function to update auto-start settings
function updateAutoStart() {
  app.setLoginItemSettings({
    openAtLogin: store.get('auto_start'),
    path: app.getPath('exe'),
  });
}

// Function to start the application
const startApp = async () => {
  await app.whenReady();

  if (os.platform() === 'darwin') {
    store.set('shortcut_prefix', 'option');
  }

  await createWindow();

  // Clipboard monitoring (adjusted interval)
  setInterval(checkClipboardForChange, 500); // Reduced interval from 1000ms to 500ms

  app.on('activate', () => {
    if (mainWindow === null) createWindow();
  });
};

startApp().catch(console.log);

app.on('ready', () => {
  updateAutoStart();
});

// When the application is closing
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow = null;
  }
});
