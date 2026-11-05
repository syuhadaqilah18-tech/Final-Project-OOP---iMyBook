//import app(control app) and browserwindow(create desktop window) from electron
const {app, BrowserWindow} = require ('electron');
const path = require('path');

function createWindow(){
    const win = new BrowserWindow({width: 1100, height: 750});
    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});