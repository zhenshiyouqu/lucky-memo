// 引入electron并创建一个Browserwindow
const {app, BrowserWindow, Menu, nativeImage, Tray,Notification} = require('electron')
const notifier = require('node-notifier');


const path = require('node:path')
const url = require('url')
//持久化
const Store = require('electron-store');
Store.initRenderer()
//开启远程模块
const remote = require("@electron/remote/main")
remote.initialize()

// 获取在 package.json 中的命令脚本传入的参数，来判断是开发还是生产环境
const mode = process.argv[2];

console.log('mode', mode)

// 保持window对象的全局引用,避免JavaScript对象被垃圾回收时,窗口被自动关闭.
let mainWindow
let appQuitFlag = false;

function createWindow() {
    console.log(path.join(__dirname, 'preload.js'))
    //创建浏览器窗口,宽高自定义
    mainWindow = new BrowserWindow({
        width: 600,
        height: 800,
        //无边框
        // frame: false,
        // transparent: true,
        // alwaysOnTop: true,
        webPreferences: {
            devTools: false, //是否开启调试
            nodeIntegration: true,  //开启主进程和渲染进程之间的通信
            enableRemoteModule: true,
            preload: path.join(__dirname, '/preload.js'),
            contextIsolation: false,
            nodeIntegrationInSubFrames: true
        },
        icon: path.join(__dirname, 'public/icons8-luck-64.png')
    })

    remote.enable(mainWindow.webContents)
    //设置菜单
    const template = [
        {
            label: '新建',
        },
        {
            label: '编辑',
        },
        {
            label: '视图',
        },
        {
            label: '帮助',
            //打开开发者工具
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    // mainWindow.setIgnoreMouseEvents(true)
    if (mode === 'dev') {
        // 加载应用----适用于 react 项目
        mainWindow.loadURL('http://localhost:3000/');
    } else {
        // 加载应用-----react项目打包后的路径
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, './build/index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }
    // 打开开发者工具，默认不打开
    mainWindow.webContents.openDevTools()
    // 关闭window时触发下列事件.
    mainWindow.on('close', function (event) {
        if (!appQuitFlag) {
            event.preventDefault()
            mainWindow.hide()
        }
    });
    mainWindow.on('closed', function (event) {
        mainWindow=null;
    });
}



// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.on('ready', () => {
    //创建系统托盘
    const icon = nativeImage.createFromPath('public/icons8-luck-64.png')
    const tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '打开', click: () => {
                mainWindow.show()
            }
        },

        {
            label: '退出', click: () => {
                appQuitFlag = true;
                app.quit()
            }
        },
        // {
        //     label:'test',
        //     click:()=>{
        //         new Notification({
        //             title: 'Basic Notification',
        //             body: 'Short message part'
        //                 }
        //         ).show()
        //     }
        // }
    ])
    tray.setContextMenu(contextMenu)
    tray.setToolTip('LuckyMemo')
    tray.setTitle('LuckyMemo')
    tray.on('double-click', () => {
        mainWindow.show();
    });
    createWindow()
})
// 所有窗口关闭时退出应用.
app.on('window-all-closed', function () {
    // macOS中除非用户按下 `Cmd + Q` 显式退出,否则应用与菜单栏始终处于活动状态.
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('before-quit', function () {

})

app.on('activate', function () {
    // macOS中点击Dock图标时没有已打开的其余应用窗口时,则通常在应用中重建一个窗口
    if (mainWindow === null) {
        createWindow()
    }
})
// 你可以在这个脚本中续写或者使用require引入独立的js文件.
