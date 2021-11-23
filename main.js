const { Plugin } = require("obsidian");


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
function matchUrl(e){
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
    return false;
}

// 代理访问
function proxy(e){
    return new Promise((function (t, n) {
        e.success = t;
        e.error = function (e, t) {
            return n(t)
        }
        const https = require('https')
        https.get(e.url, function (res) {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    e.success(rawData)
                } catch (e) {
                    e.error(e)
                }
            });

        }).on('error', function (e) {
            e.error(e)
        })
    }))
}

let ap;
module.exports = class ProxyGithub extends Plugin {
    onload() {
        ap = window.ajaxPromise;
        window.ajaxPromise = function (e) {
            if (!matchUrl(e)) {
                return ap(e);
            }
            return proxy(e)
        }
    }
    onunload() {
        window.ajaxPromise = ap;
    }
}