const {Plugin, PluginSettingTab, Setting } = require("obsidian");

let server = 'fastgit'

let proMap = {
	fastgit:{
		down:"https://download.fastgit.org/"
		,raw:"https://raw.fastgit.org/"
		,home:"https://hub.fastgit.org/"
	}
	,mtr:{
		down:"https://download.fastgit.org/"
		,raw:"https://raw-gh.gcdn.mirr.one/"
		,home:"https://api.mtr.pub/"
	}
	,ghproxy:{
		down:"https://mirror.ghproxy.com/https://github.com/"
		,raw:"https://mirror.ghproxy.com/https://github.com/"
		,home:"https://mirror.ghproxy.com/https://github.com/"
	}
	,gitclone:{
		down:"https://download.fastgit.org/"
		,raw:"https://raw.fastgit.org/"
		,home:"https://gitclone.com/github.com/"
	}
	,mirr:{
		down:"https://gh.gcdn.mirr.one/"
		,raw:"https://raw-gh.gcdn.mirr.one/"
		,home:"https://gh.gcdn.mirr.one/"
	}
}

let include = [
    {
        match: (url) => url.indexOf("/releases/download/") >= 0
        , to: (url) => url.replace("https://github.com/", proMap[server].down)
    }
    , {
        match: (url) => url.startsWith("https://raw.githubusercontent.com/") >= 0
        , to: (url) => url.replace("https://raw.githubusercontent.com/", proMap[server].raw)
    }
    , {
        match: (url) => url.startsWith("https://github.com/") >= 0
        , to: (url) => url.replace("https://github.com/", proMap[server].home)
    }
]

// 匹配URL
function matchUrl(e) {
	console.log("开始访问：" + JSON.stringify(e))
    for (var key in include) {
        let item = include[key]
		console.log(key)
		console.log(item)
        if (e && e.url && item.match(e.url)) {
            e.url = item.to(e.url)
            console.log("要访问的地址：" + e.url)
            if (!e.headers) {
                e.headers = {}
            }
            e.headers["content-type"] = "application/x-www-form-urlencoded";
            e.headers["Access-Control-Allow-Origin"] = "*"
            return true;
        }
    }
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
		debugger
        console.log(ap)
        window.require("electron").ipcRenderer.send = function (a,b,e,...rest){
			debugger
            matchUrl(e);
            new window.Notice("正在通过 ProxyGithub 来代理访问社区插件！")
            ap(a,b,e, ...rest);
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




class ProxyGithubSettingTab extends PluginSettingTab {

    constructor(app, plugin) {
        console.log("加载了tab~~~~~~~~~~~~~~~~~~~~~~")
        super(app, plugin)
        this.plugin = plugin
    }
    async display() {
        this.containerEl.empty()
        new Setting(this.containerEl)
            .setName('代理服务器')
            .setDesc(`通过选择不同的服务器来切换代理，可以解决某些情况下，某个服务器无法访问的情况。当前代理服务器：${this.plugin.settings.server}`)
            // .setValue(this.plugin.settings.server) // <-- Add me!
            .addDropdown(dropDown => {
                dropDown.addOption('mirr', '请选择');
                dropDown.addOption('fastgit', 'fastgit');
                dropDown.addOption('mtr', 'mtr');
                dropDown.addOption('ghproxy', 'ghproxy');
                dropDown.addOption('gitclone', 'gitclone');
                dropDown.addOption('mirr', 'mirr');
                dropDown.onChange(async (value) =>	{
                    this.plugin.settings.server=value
                    // this.plugin.settings.server = value;
                    await this.plugin.saveSettings();
                });
            });
    }
}




let app = new apProxy();
let apc = new apCapacitor();
let ape = new apElectron();
module.exports = class ProxyGithub extends Plugin {
    onload() {
        new window.Notice("添加 ProxyGithub 代理访问社区插件！");
        this.addSettingTab(new ProxyGithubSettingTab(this.app, this));
        ape.regedit();
        apc.regedit();
        app.regedit();
        this.settings = {server:'mirr'}
    }
    async loadSettings() {
		this.settings = Object.assign({}, {server:'mirr'}, await this.loadData());
	}
    async saveSettings() {
        await this.saveData(this.settings);
		server = this.settings.server;
		debugger
	}

    onunload() {
        ape.unRegedit()
        apc.unRegedit()
        app.unRegedit()
    }
}

