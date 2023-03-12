let localVal = localStorage.getItem("local");
if (localVal != "true" && localVal != "false") {
    localStorage.setItem("local", "true");
    config.local = true;
}
let currentResolve;
let currentReject;
let wcoRef;
let fmoviesBaseURL = !localStorage.getItem("fmoviesBaseURL") ? "fmovies.ink" : localStorage.getItem("fmoviesBaseURL");

function setFmoviesBase() {
    fmoviesBaseURL = !localStorage.getItem("fmoviesBaseURL") ? "fmovies.ink" : localStorage.getItem("fmoviesBaseURL");
}

String.prototype["substringAfter"] = function (toFind : string) {
    let str = this;
    let index = str.indexOf(toFind);
    return index == -1 ? "" : str.substring(index + toFind.length);
}

String.prototype["substringBefore"] = function (toFind : string) {
    let str = this;
    let index = str.indexOf(toFind);
    return index == -1 ? "" : str.substring(0, index);
}

String.prototype["substringAfterLast"] = function (toFind : string) {
    let str = this;
    let index = str.lastIndexOf(toFind);
    return index == -1 ? "" : str.substring(index + toFind.length);
}

String.prototype["substringBeforeLast"] = function (toFind : string) {
    let str = this;
    let index = str.lastIndexOf(toFind);
    return index == -1 ? "" : str.substring(0, index);
}

String.prototype["onlyOnce"] = function (substring : string) {
    let str = this;
    return str.lastIndexOf(substring) == str.indexOf(substring);
}

function extractKey(id : number, url = null, useCached = false) : Promise<string> {
    return (new Promise(async function (resolve, reject) {
        if (config.chrome || useCached) {
            try {
                let gitHTML = (await MakeFetch(`https://github.com/enimax-anime/key/blob/e${id}/key.txt`)) as unknown  as modifiedString;
                let key = gitHTML.substringAfter('"blob-code blob-code-inner js-file-line">').substringBefore("</td>");
                if(!key){
                    key = gitHTML.substringAfter('"rawBlob":"').substringBefore("\"");
                }

                if(!key){
                    key = (await MakeFetch(`https://raw.githubusercontent.com/enimax-anime/key/e${id}/key.txt`)) as unknown  as modifiedString;
                }
                resolve(key);
            } catch (err) {
                reject(err);
            }
        } else {
            let scr;
            if (url == null) {
                if (id == 6) {
                    scr = (await MakeFetch(`https://rabbitstream.net/js/player/prod/e6-player.min.js?v=${(new Date()).getTime()}`));
                } else {
                    scr = (await MakeFetch(`https://rabbitstream.net/js/player/prod/e4-player.min.js?v=${(new Date()).getTime()}`));
                }
            } else {
                scr = (await MakeFetch(url));
            }

            // @ts-ignore
            scr = extractKeyComp(id, scr);
            if (scr[1]) {
                resolve(scr[0]);
            } else {
                currentResolve = resolve;
                currentReject = reject;

                setTimeout(function () {
                    reject(new Error("timeout"));
                }, 3000);

                (document.getElementById("evalScript") as HTMLIFrameElement).contentWindow.postMessage(scr[0], "*");
            }
        }
    }));

}

async function MakeFetch(url : string, options = {}) : Promise<string> {
    return new Promise(function (resolve, reject) {
        fetch(url, options).then(response => response.text()).then((response : string) => {
            resolve(response);
        }).catch(function (err) {
            reject(new Error(`${err.message}: ${url}`));
        });
    });
}

async function MakeFetchTimeout(url, options = {}, timeout = 5000) : Promise<string> {
    const controller = new AbortController();
    const signal = controller.signal;
    options["signal"] = signal;
    return new Promise(function (resolve, reject) {
        fetch(url, options).then(response => response.text()).then((response) => {
            resolve(response);
        }).catch(function (err) {
            reject(new Error(`${err.message}: ${url}`));
        });

        setTimeout(function(){
            controller.abort();
            reject(new Error("timeout"));
        },timeout);
    });
}

let customHeaders = {};
var MakeCusReqFmovies = async function (url : string , options : {[key: string]: string | object}) : Promise<string> {
    return new Promise(function (resolve, reject) {
        // @ts-ignore
        cordova.plugin.http.sendRequest(url, options, function (response) {
            resolve(response.data);
        }, function (response) {
            reject(response.error);
        });
    });
}


if (config && config.chrome) {

    // @ts-ignore
    chrome.webRequest.onBeforeSendHeaders.addListener(
        function (details) {
            details.requestHeaders.push({
                "name": "referer",
                "value": wcoRef
            });

            details.requestHeaders.push({
                "name": "x-requested-with",
                "value": "XMLHttpRequest"
            });
            return { requestHeaders: details.requestHeaders };
        },
        { urls: ['https://*.watchanimesub.net/*'] },
        ['blocking', 'requestHeaders', 'extraHeaders']
    );

    MakeCusReqFmovies = async function (url : string , options : {[key: string]: string | object}) : Promise<string> {
        if ("headers" in options) {
            customHeaders = options["headers"];
        }

        return new Promise(function (resolve, reject) {
            fetch(url, options).then(response => response.text()).then((response) => {
                customHeaders = {};

                resolve(response);
            }).catch(function (err) {
                reject(err);
            });
        });
    }
}

function getWebviewHTML(url = "https://www.zoro.to", hidden = false){
    return new Promise((resolve, reject) => {
        // @ts-ignore
        const inappRef = cordova.InAppBrowser.open(url, '_blank', hidden ? "hidden=true" : "");

        inappRef.addEventListener('loadstop', () => {
            inappRef.executeScript({
                'code': `let resultInApp={'status':200,'data':document.body.innerText};
                        webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(resultInApp));`
            });
        });
    
        inappRef.addEventListener('loaderror', (err : Error) => {
            inappRef.show();
            reject(new Error("Error"));
        });
    
        inappRef.addEventListener('message', (result : string) => {
            resolve(result);
        });

        setTimeout(function(){
            inappRef.close();
            reject("Timeout");
        }, 15000);
    });
}

async function MakeFetchZoro(url : string, options = {}) : Promise<string> {
    return new Promise(function (resolve, reject) {
        fetch(url, options).then(response => response.text()).then((response) => {
            if(response.includes("if the site connection is secure") && !config.chrome){
                getWebviewHTML(url);
            }
            resolve(response);
        }).catch(function (err) {
            reject(new Error(`${err.message}: ${url}`));
        });
    });
}