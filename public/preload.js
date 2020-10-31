const { ipcRenderer } = require('electron')

ipcRenderer.on('html', (event, arg) => {
  console.log('Received html')
  ipcRenderer.send('html', document.documentElement.innerHTML)
})
