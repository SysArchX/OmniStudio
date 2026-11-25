const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("omniNative", {
  platform: process.platform,
  authLoopbackUrl: ipcRenderer.sendSync("omni:authLoopbackSync"),
  runCommand: (command) => ipcRenderer.invoke("omni:run", command),
  listDir: (target) => ipcRenderer.invoke("omni:listDir", target),
  readFile: (target) => ipcRenderer.invoke("omni:readFile", target),
  writeFile: (target, content) => ipcRenderer.invoke("omni:writeFile", target, content),
  deletePath: (target) => ipcRenderer.invoke("omni:deletePath", target),
  chooseWorkspace: () => ipcRenderer.invoke("omni:chooseWorkspace"),
  getWorkspace: () => ipcRenderer.invoke("omni:getWorkspace"),
  readSkills: () => ipcRenderer.invoke("omni:readSkills"),
  openExternal: (url) => ipcRenderer.invoke("omni:openExternal", url),
  systemInfo: () => ipcRenderer.invoke("omni:info"),
  onAuthCallback: (callback) => {
    const handler = (_event, url) => callback(url);
    ipcRenderer.on("omni:auth-callback", handler);
    return () => ipcRenderer.removeListener("omni:auth-callback", handler);
  },
});
