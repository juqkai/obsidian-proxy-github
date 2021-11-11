const {Plugin} = require("obsidian");
let include = [
    {
        match: (url) => url.indexOf("/releases/download/") >= 0
        ,to: (url) => url.replace("https://github.com/", "https://download.fastgit.org/")
    }
    , {
        match: (url) => url.startsWith("https://raw.githubusercontent.com/") >= 0
        ,to: (url) => url.replace("https://raw.githubusercontent.com/", "https://raw.fastgit.org/")
    }
    , {
        match: (url) => url.startsWith("https://github.com/") >= 0
        ,to: (url) => url.replace("https://github.com/", "https://hub.fastgit.org/")
    }
]

module.exports = class ProxyGithub extends Plugin {
    onload(){
        let ap = window.ajaxPromise;
        window.ajaxPromise = function(e){
            for(var key in include){
                let item = include[key]
                if(item.match(e.url)){
                    e.url = item.to(e.url)
                    break
                }
            }
            return ap(e)
        }
    }    
}