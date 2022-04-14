const {Plugin} = require("obsidian");


let include = [
    {
        match: (url) => url.indexOf("/releases/download/") >= 0
        , to: (url) => url.replace("https://github.com/", "https://download.fastgit.org/")
    }
    , {
        match: (url) => url.startsWith("https://raw.githubusercontent.com/") >= 0
        , to: (url) => url.replace("https://raw.githubusercontent.com/", "https://raw.fastgit.org/")
    }
    , {
        match: (url) => url.startsWith("https://github.com/") >= 0
        , to: (url) => url.replace("https://github.com/", "https://hub.fastgit.org/")
    }
]

// 匹配URL
function matchUrl(e) {
    for (var key in include) {
        let item = include[key]
        if (item.match(e.url)) {
            e.url = item.to(e.url)
            if (!e.headers) {
                e.headers = {}
            }
            e.headers["content-type"] = "application/x-www-form-urlencoded";
            e.headers["Access-Control-Allow-Origin"] = "*"
            return true;
        }
    }
    console.log("开始访问：" + JSON.stringify(e))
    return false;
}

// 代理访问
function proxy(e) {
    return new Promise((function (t, n) {
        e.success = t;
        e.error = function (e, t) {
            return n(t)
        }
        debugger
        if (app.isMobile) {
            forMobile(e);
            return;
        }
        forPC(e)
    }))
}

/**
 *
 * https://github.com/denolehov/obsidian-git/issues/57
 * https://capacitorjs.com/blog/bypassing-cors-with-the-http-plugin
 * https://github.com/capacitor-community/http
 *
 * @param {*} e
 */
async function forMobile(e) {
    try {
        const http = require('@capacitor-community/http')
        const options = {url: e.url};
        new window.Notice("发送请求：" + e.url, 10000)
        new window.Notice(JSON.stringify(http.get) + "123", 10000)
        // http.get(options);
        const resp = await http.get(options).then((resp) => {
            new window.Notice("请求成功：", 10000)
            new window.Notice("请求成功：" + resp.status, 10000)
            e.success(resp.data)
        }).catch((error) => {
            new window.Notice("出错了：" + JSON.stringify(error), 10000)
        })
        new window.Notice("请求成功12", 10000)
        e.success(resp.data)

    } catch (e) {
        e.error(e)
        new window.Notice("加载@capacitor-community/http出错", 10000)
    }
}

function forPC(e) {
    try {
        const https = require('https')
        https.get(e.url, function (res) {
            new window.Notice("https.get成功", 10000)
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    new window.Notice("https.get处理数据成功", 10000)
                    e.success(rawData)
                } catch (e) {
                    new window.Notice("https.get处理数据失败", 10000)
                    e.error(e)
                }
            });

        }).on('error', function (e) {
            new window.Notice("https.get失败", 10000)
            e.error(e)
        })
    } catch (e) {
        new window.Notice("导入http出错", 10000)
        new window.Notice(JSON.parse(e), 10000)
    }
}

function apProxy() {
    var ap;
    this.regedit = function() {
        ap = window.ajaxPromise;
        window.ajaxPromise = function (e) {
            if (!matchUrl(e)) {
                return ap(e);
            }
            new window.Notice("正在通过 ProxyGithub 来代理访问社区插件！")
            return proxy(e)
        }
    }
    this.unRegedit = function() {
        window.ajaxPromise = ap;
    }
}

//window.Capacitor.registerPlugin("App").request
 function apCapacitor() {
    var ap;
    this.regedit = function() {
        ap = window.Capacitor.registerPlugin("App").request;
        console.log(ap)
        window.Capacitor.registerPlugin("App").request = function (e){
            matchUrl(e);
            new window.Notice("正在通过 ProxyGithub 来代理访问社区插件！")
            ap(e);
            // if (matchUrl(e)) {
            //     return ap(e);
            // }
        }
        console.log("apc注册成功")
    }
    this.unRegedit = function() {
        window.window.Capacitor.registerPlugin("App").request = ap;
    }
}

function apElectron() {
    var ap;
    this.regedit = function() {
        ap = window.require("electron").ipcRenderer.send;
        console.log(ap)
        window.require("electron").ipcRenderer.send = function (a,b,e){
            matchUrl(e);
            new window.Notice("正在通过 ProxyGithub 来代理访问社区插件！")
            ap(a,b,e);
            // if (matchUrl(e)) {
            //     return ap(e);
            // }
        }
        console.log("apc注册成功")
    }
    this.unRegedit = function() {
        window.require("electron").ipcRenderer.send = ap;
    }
}

let app = new apProxy();
let apc = new apCapacitor();
let ape = new apElectron();
module.exports = class ProxyGithub extends Plugin {
    onload() {
        new window.Notice("添加 ProxyGithub 代理访问社区插件！")
        ape.regedit();
        apc.regedit();
        app.regedit();
    }

    onunload() {
        ape.unRegedit()
        apc.unRegedit()
        app.unRegedit()
    }
}

