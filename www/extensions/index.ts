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

String.prototype["substringAfter"] = function (toFind: string) {
    let str = this;
    let index = str.indexOf(toFind);
    return index == -1 ? "" : str.substring(index + toFind.length);
}

String.prototype["substringBefore"] = function (toFind: string) {
    let str = this;
    let index = str.indexOf(toFind);
    return index == -1 ? "" : str.substring(0, index);
}

String.prototype["substringAfterLast"] = function (toFind: string) {
    let str = this;
    let index = str.lastIndexOf(toFind);
    return index == -1 ? "" : str.substring(index + toFind.length);
}

String.prototype["substringBeforeLast"] = function (toFind: string) {
    let str = this;
    let index = str.lastIndexOf(toFind);
    return index == -1 ? "" : str.substring(0, index);
}

String.prototype["onlyOnce"] = function (substring: string) {
    let str = this;
    return str.lastIndexOf(substring) == str.indexOf(substring);
}

function extractKey(id: number, url = null, useCached = false): Promise<string> {
    return (new Promise(async function (resolve, reject) {
        if (config.chrome || useCached) {
            try {
                let gitHTML = (await MakeFetch(`https://github.com/enimax-anime/key/blob/e${id}/key.txt`)) as unknown as modifiedString;
                let key = gitHTML.substringAfter('"blob-code blob-code-inner js-file-line">').substringBefore("</td>");
                if (!key) {
                    key = gitHTML.substringAfter('"rawBlob":"').substringBefore("\"");
                }

                if (!key) {
                    key = (await MakeFetch(`https://raw.githubusercontent.com/enimax-anime/key/e${id}/key.txt`)) as unknown as modifiedString;
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

async function MakeFetch(url: string, options = {}): Promise<string> {
    return new Promise(function (resolve, reject) {
        fetch(url, options).then(response => response.text()).then((response: string) => {
            resolve(response);
        }).catch(function (err) {
            reject(new Error(`${err.message}: ${url}`));
        });
    });
}

async function MakeFetchTimeout(url, options = {}, timeout = 5000): Promise<string> {
    const controller = new AbortController();
    const signal = controller.signal;
    options["signal"] = signal;
    return new Promise(function (resolve, reject) {
        fetch(url, options).then(response => response.text()).then((response) => {
            resolve(response);
        }).catch(function (err) {
            reject(new Error(`${err.message}: ${url}`));
        });

        setTimeout(function () {
            controller.abort();
            reject(new Error("timeout"));
        }, timeout);
    });
}

let customHeaders = {};
var MakeCusReqFmovies = async function (url: string, options: { [key: string]: string | object }): Promise<string> {
    return new Promise(function (resolve, reject) {
        // @ts-ignore
        cordova.plugin.http.sendRequest(url, options, function (response) {
            resolve(response.data);
        }, function (response) {
            reject(response.error);
        });
    });
}

// for v2
if (config && config.chrome) {

    if (config.manifest === "v2") {
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

        // @ts-ignore
        chrome.webRequest.onBeforeSendHeaders.addListener(
            function (details) {
                details.requestHeaders.push({
                    "name": "Referer",
                    "value": "https://mcloud.to"
                });
                return { requestHeaders: details.requestHeaders };
            },
            { urls: ['https://*.mcloud.to/*'] },
            ['blocking', 'requestHeaders', 'extraHeaders']
        );


        // @ts-ignore
        chrome.webRequest.onBeforeSendHeaders.addListener(
            function (details) {
                details.requestHeaders.push({
                    "name": "Referer",
                    "value": "https://vizcloud.club"
                });

                return { requestHeaders: details.requestHeaders };
            },
            { urls: ['https://*.vizcloud.club/*'] },
            ['blocking', 'requestHeaders', 'extraHeaders']
        );
    }

    MakeCusReqFmovies = async function (url: string, options: { [key: string]: string | object }): Promise<string> {
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


function getWebviewHTML(url = "https://www.zoro.to", hidden = false, timeout: number | undefined = 15000, code: boolean | string = false) {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        const inappRef = cordova.InAppBrowser.open(url, '_blank', hidden ? "hidden=true" : "");

        inappRef.addEventListener('loadstop', () => {
            inappRef.executeScript({
                'code': code === false ? `let resultInApp={'status':200,'data':document.body.innerText};
                        webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(resultInApp));` : code
            });
        });

        inappRef.addEventListener('loaderror', (err: Error) => {
            inappRef.show();
            reject(new Error("Error"));
        });

        inappRef.addEventListener('message', (result: string) => {
            console.log(result);
            inappRef.close();
            resolve(result);
        });

        inappRef.addEventListener('exit', (result: string) => {
            setTimeout(() => {
                resolve("closed");
            }, 500);
        });

        if (timeout) {
            setTimeout(function () {
                inappRef.close();
                reject("Timeout");
            }, timeout);
        }
    });
}

async function MakeFetchZoro(url: string, options = {}): Promise<string> {
    return new Promise(function (resolve, reject) {
        fetch(url, options).then(response => response.text()).then((response) => {
            if ((response.includes("if the site connection is secure") || response.includes("Security checking...")) && !config.chrome) {
                getWebviewHTML(url);
            }
            resolve(response);
        }).catch(function (err) {
            reject(new Error(`${err.message}: ${url}`));
        });
    });
}

function removeDOM(domElem: HTMLElement) {
    console.log("Removing", domElem);
    try {
        domElem.innerHTML = "";
        domElem.remove();
    } catch (err) {

    }
}


function getCurrentSeason(type: "current" | "next") {
    const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"];
    let season = "";
    const month = new Date().getMonth();
    switch (month) {
        case 11:
        case 0:
        case 1:
            season = "WINTER";
            break;
        case 2:
        case 3:
        case 4:
            season = "SPRING";
            break;
        case 5:
        case 6:
        case 7:
            season = "SUMMER";
            break;
        case 8:
        case 9:
        case 10:
            season = "FALL";
            break;
    }

    if (type === "next") {
        season = seasons[(seasons.indexOf(season) + 1) % 4];
    }

    return season;
}

function getCurrentYear(type: "current" | "next") {
    let year = new Date().getFullYear();
    if (type == "next" && getCurrentSeason(type) === "WINTER") {
        year++;
    }
    return year;
}

const anilistQueries = {
    "info": `query ($id: Int) {
                Media (id: $id, type: ANIME) { 
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage { 
                        extraLarge 
                        large 
                        color 
                    }
                    bannerImage
                    averageScore
                    status(version: 2)
                    idMal
                    genres
                    season
                    seasonYear
                    averageScore
                    nextAiringEpisode { airingAt timeUntilAiring episode }
                    relations {
                        edges{
                            relationType
                        }
                        nodes{
                            id
                            idMal
                            coverImage{
                                large
                                extraLarge
                            }
                            title{
                                english
                                native
                            }
                            type
                        }
                    }
                    recommendations { 
                        edges { 
                            node { 
                                id 
                                mediaRecommendation 
                                { 
                                    id
                                    idMal
                                    coverImage{
                                        large
                                        extraLarge
                                    }
                                    title{
                                        english
                                        native
                                    }
                                    type
                                    seasonYear
                                } 
                            } 
                        } 
                    }
                }
            }`,
    "trending": `query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
                    Page(page: $page, perPage: $perPage) {
                        media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $seasonYear) {
                            id
                            idMal
                            coverImage{
                                large
                                extraLarge
                            }
                            bannerImage
                            description(asHtml: false)
                            title{
                                english
                                native
                            }
                            type
                            genres
                            startDate{
                                day
                                month
                                year
                            }
                            seasonYear
                        }
                    }
                }`
};

async function anilistAPI(type: "info" | "trending", variables = {}) {

    const query = anilistQueries[type];
    const url = 'https://graphql.anilist.co',
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

    return JSON.parse(await MakeFetch(url, options));
}

async function getAnilistInfo(type: anilistType, id: string) {
    const anilistID = JSON.parse(await MakeFetch(`https://raw.githubusercontent.com/MALSync/MAL-Sync-Backup/master/data/pages/${type}/${id}.json`)).aniId;

    return (await anilistAPI("info", { id: anilistID })).data.Media;
}

async function getAnilistTrending(type: "current" | "next") {

    return (await anilistAPI("trending", {
        page: 1,
        perPage: 25,
        season: getCurrentSeason(type),
        seasonYear: getCurrentYear(type)
    })).data.Page.media;
}