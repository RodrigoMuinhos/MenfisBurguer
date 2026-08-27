const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kioskMenfis", {
  desktop: true,
  edition: "KIOSKPDV",
  version: "1.0.0",
  printOrder: (content) => ipcRenderer.invoke("printer:order", content),
  listPrinters: () => ipcRenderer.invoke("printer:list"),
  selectPrinter: (name) => ipcRenderer.invoke("printer:select", name),
  testPrinter: () => ipcRenderer.invoke("printer:test"),
});
