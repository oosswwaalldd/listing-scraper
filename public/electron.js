const electron = require('electron')

const { app } = electron
const { BrowserWindow, ipcMain } = electron

const path = require('path')
const isDev = require('electron-is-dev')

// Reloads on changes (development only)
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  forceHardReset: true
})

let mainWindow
let childWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  )
  mainWindow.on('closed', () => {
    mainWindow = null
    childWindow = null
  })
  childWindow = new BrowserWindow({
    parent: mainWindow,
    center: true,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true, // https://electronjs.org/docs/tutorial/security#2-d%C3%A9sactiver-lint%C3%A9gration-de-nodejs-dans-tous-les-renderers-affichant-des-contenus-distants
      preload: path.join(__dirname, './preload.js')
    }
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

const scrape = url => {
  return new Promise(async (resolve, reject) => {
    try {
      // Loads URL into child window
      childWindow.loadURL(url)
      // Communicate with child window
      childWindow.webContents.on('dom-ready', () => {
        console.log('dom-ready, sending "html" to child window')
        childWindow.send('html')
      })
      // Show listing
      childWindow.show()
      // Listen response from child window
      ipcMain.on('html', (_, html) => {
        console.log('Received "html" from child window')
        childWindow.hide()
        resolve(html)
      })
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

/**
 * Scraping
 */
ipcMain.on('scrape', async (_, { url }) => {
  try {
    console.log(`Url to Scrape -> ${url}`)
    const html = await scrape(url)
    console.log('Chars received (HTML) -> ', html.length)
    mainWindow.send('html', html)
  } catch ({ message }) {
    console.log(`Error: ${message}`)
  }
})
