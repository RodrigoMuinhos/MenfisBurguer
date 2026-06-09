const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("menfisDesktop", {
  openAdmin: () => ipcRenderer.invoke("menfis:open-admin"),
});
