const { app, BrowserWindow, ipcMain, nativeImage, Tray, Menu, screen } = require('electron')
const superagent = require('superagent');
require('dotenv').config()


const CMKC_API_KEY = process.env.CMKC_API_KEY
const testAPI = process.env.TEST_API === 'true'
const dev = process.env.DEV === 'true'

console.log({testAPI, dev})

const [devTools, frame, transparent] = [false, false, true].map((v) => v ^ dev)
const [width, height] = [300, 300]
const dockIcon = nativeImage.createFromPath('icons/icon.png')
let tray = null
app.dock.setIcon(dockIcon)

const createWindow = () => {
    const win = new BrowserWindow({
        width,
        height,
        x: 0, y: 0,
        transparent,
        frame,
        icon: 'icon.png',
        webPreferences: {
            devTools,
            contextIsolation: false,
            nodeIntegration: true,
        }
    })
    win.loadFile('index.html')
    win.on('minimize', () => {
        if (tray) {return win.hide()}
        tray = new Tray('icons/tray-icon.png')
        const template = [
            {
                label: 'Show Digivice',
                click: () => {
                    win.show()
                    tray.destroy()
                    tray = null
                }
            },
            {
                label: 'Quit',
                click: () => {
                    win.close()
                    app.quit()
                }
            }
        ]
        const contextMenu = Menu.buildFromTemplate(template)
        tray.setContextMenu(contextMenu)
        tray.setToolTip('Digivice')
        win.hide()
    })
}

app.whenReady().then(async () => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
    if (tray) {
        tray.destroy()
        tray = null
    }
})

const callAPI = (event) => {
    const API_BASE = testAPI
    ? 'https://sandbox-api.coinmarketcap.com'
    : 'pro-api.coinmarketcap.com'
    const API_KEY = testAPI 
    ? 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c'
    : CMKC_API_KEY

    const API_URL = `${API_BASE}/v1/cryptocurrency/listings/latest`
    try {
        superagent.get(API_URL)
        .set('Content-Type', 'application/json')
        .set({'X-CMC_PRO_API_KEY': API_KEY})
        .set({'start':1})
        .set({'limit':1})
        .set({sort_dir:'asc'})
        .type('json')
        .then((res) => {
            const data = res.body.data
            if (Array.isArray(data)) {
                console.log('API call succeded')
                event.reply('updateData', data[0])
            }
        }, (err) => {
            console.error(error)
        })
    } catch (error) {
        console.error(error)
    }
}



ipcMain.on('requestData', (event) => {
    console.log('requestData received')
    callAPI(event)
})

ipcMain.on('minimize', (event) => {
    let win = BrowserWindow.getFocusedWindow()
    if (!win) win = BrowserWindow.getAllWindows[0]
    win.minimize()
    event.returnValue = true
})


//app.disableHardwareAcceleration()