'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('anon', {
  nav: (action, payload) => ipcRenderer.invoke('nav', action, payload),
  tab: (action, id) => ipcRenderer.invoke('tab', action, id),
  newIdentity: () => ipcRenderer.invoke('tor:new-identity'),
  toggleJs: () => ipcRenderer.invoke('js:toggle'),
  panic: () => ipcRenderer.invoke('panic'),
  on: (channel, cb) => {
    const allowed = ['tab:state', 'tab:created', 'tab:closed', 'tor:status']
    if (!allowed.includes(channel)) return
    ipcRenderer.on(channel, (_e, data) => cb(data))
  }
})
