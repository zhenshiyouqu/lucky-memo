

const { contextBridge, ipcRenderer } = require('electron')

window.electron = require('electron')
window.remote = require('@electron/remote')
window.Store = require('electron-store');
window.notifier = require('node-notifier');



console.log('前置脚本加载完成')