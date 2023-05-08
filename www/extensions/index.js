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
String.prototype["substringAfter"] = function (toFind) {
    let str = this;
    let index = str.indexOf(toFind);
    return index == -1 ? "" : str.substring(index + toFind.length);
};
String.prototype["substringBefore"] = function (toFind) {
    let str = this;
    let index = str.indexOf(toFind);
    return index == -1 ? "" : str.substring(0, index);
};
String.prototype["substringAfterLast"] = function (toFind) {
    let str = this;
    let index = str.lastIndexOf(toFind);
    return index == -1 ? "" : str.substring(index + toFind.length);
};
String.prototype["substringBeforeLast"] = function (toFind) {
    let str = this;
    let index = str.lastIndexOf(toFind);
    return index == -1 ? "" : str.substring(0, index);
};
String.prototype["onlyOnce"] = function (substring) {
    let str = this;
    return str.lastIndexOf(substring) == str.indexOf(substring);
};
function extractKey(id, url = null, useCached = false) {
    return (new Promise(async function (resolve, reject) {
        if (config.chrome || useCached) {
            try {
                let gitHTML = (await MakeFetch(`https://github.com/enimax-anime/key/blob/e${id}/key.txt`));
                let key = gitHTML.substringAfter('"blob-code blob-code-inner js-file-line">').substringBefore("</td>");
                if (!key) {
                    key = gitHTML.substringAfter('"rawBlob":"').substringBefore("\"");
                }
                if (!key) {
                    key = (await MakeFetch(`https://raw.githubusercontent.com/enimax-anime/key/e${id}/key.txt`));
                }
                resolve(key);
            }
            catch (err) {
                reject(err);
            }
        }
        else {
            let scr;
            if (url == null) {
                if (id == 6) {
                    scr = (await MakeFetch(`https://rabbitstream.net/js/player/prod/e6-player.min.js?v=${(new Date()).getTime()}`));
                }
                else {
                    scr = (await MakeFetch(`https://rabbitstream.net/js/player/prod/e4-player.min.js?v=${(new Date()).getTime()}`));
                }
            }
            else {
                scr = (await MakeFetch(url));
            }
            // @ts-ignore
            scr = extractKeyComp(id, scr);
            if (scr[1]) {
                resolve(scr[0]);
            }
            else {
                currentResolve = resolve;
                currentReject = reject;
                setTimeout(function () {
                    reject(new Error("timeout"));
                }, 3000);
                document.getElementById("evalScript").contentWindow.postMessage(scr[0], "*");
            }
        }
    }));
}
async function MakeFetch(url, options = {}) {
    return new Promise(function (resolve, reject) {
        fetch(url, options).then(response => response.text()).then((response) => {
            resolve(response);
        }).catch(function (err) {
            reject(new Error(`${err.message}: ${url}`));
        });
    });
}
async function MakeFetchTimeout(url, options = {}, timeout = 5000) {
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
var MakeCusReqFmovies = async function (url, options) {
    return new Promise(function (resolve, reject) {
        // @ts-ignore
        cordova.plugin.http.sendRequest(url, options, function (response) {
            resolve(response.data);
        }, function (response) {
            reject(response.error);
        });
    });
};
// for v2
if (config && config.chrome) {
    if (config.manifest === "v2") {
        // @ts-ignore
        chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
            details.requestHeaders.push({
                "name": "referer",
                "value": wcoRef
            });
            details.requestHeaders.push({
                "name": "x-requested-with",
                "value": "XMLHttpRequest"
            });
            return { requestHeaders: details.requestHeaders };
        }, { urls: ['https://*.watchanimesub.net/*'] }, ['blocking', 'requestHeaders', 'extraHeaders']);
        // @ts-ignore
        chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
            details.requestHeaders.push({
                "name": "Referer",
                "value": "https://mcloud.to"
            });
            return { requestHeaders: details.requestHeaders };
        }, { urls: ['https://*.mcloud.to/*'] }, ['blocking', 'requestHeaders', 'extraHeaders']);
        // @ts-ignore
        chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
            details.requestHeaders.push({
                "name": "Referer",
                "value": "https://vizcloud.club"
            });
            return { requestHeaders: details.requestHeaders };
        }, { urls: ['https://*.vizcloud.club/*'] }, ['blocking', 'requestHeaders', 'extraHeaders']);
    }
    MakeCusReqFmovies = async function (url, options) {
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
    };
}
function getWebviewHTML(url = "https://www.zoro.to", hidden = false, timeout = 15000, code = false) {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        const inappRef = cordova.InAppBrowser.open(url, '_blank', hidden ? "hidden=true" : "");
        inappRef.addEventListener('loadstop', () => {
            inappRef.executeScript({
                'code': code === false ? `let resultInApp={'status':200,'data':document.body.innerText};
                        webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(resultInApp));` : code
            });
        });
        inappRef.addEventListener('loaderror', (err) => {
            inappRef.show();
            reject(new Error("Error"));
        });
        inappRef.addEventListener('message', (result) => {
            console.log(result);
            inappRef.close();
            resolve(result);
        });
        inappRef.addEventListener('exit', (result) => {
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
async function MakeFetchZoro(url, options = {}) {
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
function removeDOM(domElem) {
    console.log("Removing", domElem);
    try {
        domElem.innerHTML = "";
        domElem.remove();
    }
    catch (err) {
    }
}

var wco = {
    baseURL: "https://www.wcoforever.net",
    searchApi: function (query) {
        let baseURL = this.baseURL;
        let tempDiv = document.createElement("div");
        return (new Promise(function (resolve, reject) {
            let formData = new FormData();
            formData.append('catara', query);
            formData.append('konuara', 'series');
            fetch(`${baseURL}/search`, {
                method: 'POST', body: formData
            }).then(response => response.text()).then(function (x) {
                tempDiv.innerHTML = DOMPurify.sanitize(x);
                var conDIV = tempDiv.querySelector(".items").children;
                let data = [];
                for (var i = 0; i < conDIV.length; i++) {
                    data.push({
                        "image": conDIV[i].getElementsByTagName("img")[0].getAttribute("src"),
                        "name": conDIV[i].getElementsByTagName("a")[1].innerText,
                        "link": conDIV[i].getElementsByTagName("a")[1].getAttribute("href").replace(baseURL, "") + "&engine=0",
                    });
                }
                resolve({
                    "status": 200,
                    "data": data
                });
            }).catch(function (x) {
                reject(x);
            }).finally(() => {
                removeDOM(tempDiv);
            });
        }));
    },
    getAnimeInfo: function (url) {
        let baseURL = this.baseURL;
        let rawURL = "";
        return (new Promise(function (resolve, reject) {
            url = url.split("&engine")[0];
            url = baseURL + "/" + url;
            rawURL = url;
            let temp = document.createElement("div");
            fetch(url).then(response => response.text()).then(function (response) {
                temp.innerHTML = DOMPurify.sanitize(response);
                let data = {
                    "name": "",
                    "image": "",
                    "description": "",
                    "episodes": [],
                    "mainName": ""
                };
                data.name = temp.querySelectorAll(".video-title")[0].innerText;
                data.image = temp.querySelector("#sidebar_cat").querySelectorAll(".img5")[0].getAttribute("src");
                if (data.image.indexOf("//") == 0) {
                    data.image = "https:" + data.image;
                }
                data.description = temp.querySelector("#sidebar_cat").querySelectorAll("p")[0].innerText;
                data.totalPages = 1;
                data.pageInfo = [{
                        "pageName": "Season 1",
                        "pageSize": 0
                    }];
                let lastSeason = "1";
                let episodesDOM = temp.querySelector("#sidebar_right3");
                let animeEps = data.episodes;
                let animeDOM = episodesDOM.querySelectorAll("a");
                let animeName;
                for (var i = animeDOM.length - 1; i >= 0; i--) {
                    let season = lastSeason;
                    try {
                        let hasSeason = parseInt(animeDOM[i].innerText.toLowerCase().split("season")[1]);
                        if (!isNaN(hasSeason)) {
                            season = hasSeason.toString();
                        }
                        else {
                            season = "1";
                        }
                    }
                    catch (err) {
                    }
                    if (season != lastSeason) {
                        lastSeason = season;
                        data.totalPages++;
                        data.pageInfo[data.totalPages - 1] = {
                            "pageSize": 0,
                            "pageName": `Season ${season}`
                        };
                    }
                    data.pageInfo[data.totalPages - 1].pageSize++;
                    animeEps.push({
                        "link": animeDOM[i].href.replace(baseURL, "?watch=") + "&engine=0",
                        "title": animeDOM[i].innerText,
                    });
                }
                // Very convoluted but it works
                try {
                    let animeNameMain = animeEps[0].link.replace(baseURL, "?watch=").split("?watch=/")[1];
                    animeName = animeNameMain.trim();
                    animeName = animeName.split("episode")[0];
                    if (animeNameMain.split("episode").length == 1) {
                        animeName = animeName.split("?id=")[0];
                        animeName = animeName.trim();
                        animeName = animeName + "-";
                        animeName = animeName.trim();
                    }
                    try {
                        if (animeName.indexOf("season") > -1) {
                            animeName = animeName.split("season")[0];
                        }
                    }
                    catch (err) {
                    }
                }
                catch (err) {
                    animeName = animeName + "-";
                }
                data.episodes = animeEps;
                data.mainName = url.replace("https://www.wcoforever.net/anime/", "") + "-";
                resolve(data);
            }).catch(function (err) {
                err.url = rawURL;
                reject(err);
            }).finally(() => {
                removeDOM(temp);
            });
        }));
    },
    getLinkFromUrl: async function (url) {
        let baseURL = this.baseURL;
        url = url.split("&engine")[0];
        url = `${baseURL}${url}`;
        let animeNameMain = decodeURIComponent(url.split(`${baseURL}/`)[1].split("/")[0]);
        let animeEp;
        let animeName = animeNameMain.split("episode")[0];
        animeName = animeName.trim();
        if (animeNameMain.split("episode").length == 1) {
            animeName = animeName.split("?id=")[0];
            animeName = animeName.trim();
            animeName = animeName + "-";
            animeName = animeName.trim();
        }
        try {
            if (animeName.indexOf("season") > -1) {
                animeName = animeName.split("season")[0];
            }
        }
        catch (err) {
        }
        try {
            let animeEpTemp = animeNameMain.split("episode")[1];
            if (animeEpTemp.substring(0, 1) == "-") {
                animeEpTemp = animeEpTemp.substring(1);
                animeEpTemp = animeEpTemp.replace("-", ".");
            }
            animeEp = Math.abs(parseFloat(animeEpTemp));
        }
        catch (err) {
        }
        if (isNaN(parseFloat(animeEp))) {
            animeEp = 1;
        }
        else if (animeEp < 1) {
            animeEp = 0.1;
        }
        const data = {
            sources: [],
            name: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null,
        };
        let dom = document.createElement("div");
        try {
            let reqOption = {
                'headers': {
                    'x-requested-with': 'XMLHttpRequest'
                },
                "method": "GET",
            };
            let pageHTML = await MakeFetch(url, {});
            let sources = data.sources;
            dom.innerHTML = DOMPurify.sanitize(pageHTML);
            try {
                let tmpName = dom.querySelector('[rel="category tag"]').getAttribute("href").replace(`${baseURL}/anime/`, "");
                if (tmpName != "") {
                    animeName = tmpName + "-";
                }
            }
            catch (err) {
            }
            let nextPrev = dom.getElementsByClassName("prev-next");
            for (let npi = 0; npi < nextPrev.length; npi++) {
                try {
                    let tempData = nextPrev[npi].children[0].getAttribute("rel").trim().toLowerCase();
                    if (tempData == "next" || tempData == "prev") {
                        data[tempData] = (nextPrev[npi].children[0].getAttribute("href").replace(baseURL, "")) + "&engine=0";
                    }
                }
                catch (err) {
                }
            }
            let tempReg = /<script>var.+?document\.write\(decodeURIComponent\(escape.+?<\/script>/gis;
            let tempRegOut = tempReg.exec(pageHTML)[0];
            let arrayReg = /\[.+\]/gis;
            let mainVidLink = "";
            let arrayRegOut = JSON.parse(arrayReg.exec(tempRegOut)[0]);
            let num = parseInt(tempRegOut.split(`.replace(\/\\D\/g,'')) -`)[1]);
            arrayRegOut.forEach(function (value) {
                mainVidLink += String.fromCharCode(parseInt(atob(value).replace(/\D/g, '')) - num);
            });
            mainVidLink = mainVidLink.split("src=\"")[1].split("\" ")[0];
            wcoRef = mainVidLink;
            reqOption.headers["referer"] = mainVidLink;
            let domain;
            try {
                domain = new URL(mainVidLink).origin;
            }
            catch (err) {
                domain = "https://embed.watchanimesub.net";
            }
            let videoHTML;
            if (config.chrome) {
                videoHTML = await MakeFetch(mainVidLink, {});
            }
            else {
                videoHTML = await MakeCusReqFmovies(mainVidLink, reqOption);
            }
            let vidLink = domain + videoHTML.split("$.getJSON(\"")[1].split("\"")[0];
            try {
                let vidLink2 = (vidLink.split("v=cizgi").join('v=')).split('&embed=cizgi').join('&embed=anime');
                let vidLink2HTML;
                if (config.chrome) {
                    vidLink2HTML = await MakeFetch(vidLink2, {});
                }
                else {
                    vidLink2HTML = await MakeCusReqFmovies(vidLink2, reqOption);
                }
                let vidLink2Data = JSON.parse(vidLink2HTML);
                if (vidLink2Data.hd != "") {
                    sources.push({
                        "url": vidLink2Data.cdn + "/getvid?evid=" + vidLink2Data.hd,
                        "name": "HD#2",
                        "type": "mp4"
                    });
                }
                if (vidLink2Data.enc != "") {
                    sources.push({
                        "url": vidLink2Data.cdn + "/getvid?evid=" + vidLink2Data.enc,
                        "name": "SD#2",
                        "type": "mp4"
                    });
                }
                if (vidLink2Data.fhd != "") {
                    sources.push({
                        "url": vidLink2Data.cdn + "/getvid?evid=" + vidLink2Data.fhd,
                        "name": "FHD#2",
                        "type": "mp4"
                    });
                }
            }
            catch (err) {
                console.error(err);
            }
            let vidLinkHTML;
            if (config.chrome) {
                vidLinkHTML = await MakeFetch(vidLink, {});
            }
            else {
                vidLinkHTML = await MakeCusReqFmovies(vidLink, reqOption);
            }
            let vidLinkData = JSON.parse(vidLinkHTML);
            if (vidLinkData.enc != "") {
                sources.unshift({
                    "url": vidLinkData.cdn + "/getvid?evid=" + vidLinkData.enc,
                    "name": "SD",
                    "type": "mp4",
                });
            }
            if (vidLinkData.hd != "") {
                sources.unshift({
                    "url": vidLinkData.cdn + "/getvid?evid=" + vidLinkData.hd,
                    "name": "HD",
                    "type": "mp4"
                });
            }
            if (vidLinkData.fhd != "") {
                sources.unshift({
                    "url": vidLinkData.cdn + "/getvid?evid=" + vidLinkData.fhd,
                    "name": "FHD",
                    "type": "mp4"
                });
            }
            data.sources = sources;
            data.name = animeName;
            data.nameWSeason = animeName;
            data.episode = animeEp;
            data.status = 200;
            data.message = "done";
            return data;
        }
        catch (err) {
            console.error(err);
            alert("Couldn't get the link");
            data.message = "Couldn't get the link";
            return data;
        }
        finally {
            removeDOM(dom);
        }
    },
    discover: async function () {
        let baseURL = this.baseURL;
        let temp = document.createElement("div");
        try {
            temp.innerHTML = DOMPurify.sanitize(await MakeFetch(baseURL, {}));
            let data = [];
            for (let elem of temp.querySelectorAll(".items")[1].querySelectorAll("li")) {
                let image = "https:" + elem.querySelector("img").getAttribute("src");
                let tempAnchor = elem.querySelectorAll("a")[1];
                let name = tempAnchor.innerText;
                let link = tempAnchor.getAttribute("href");
                if (link == "") {
                    link = null;
                }
                data.push({
                    image,
                    name,
                    link,
                    "getLink": true
                });
            }
            return data;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(temp);
        }
    },
    getDiscoverLink: async function (mainLink) {
        let baseURL = this.baseURL;
        let temp = document.createElement("div");
        try {
            temp.innerHTML = DOMPurify.sanitize(await MakeFetch(`${baseURL}${mainLink}`, {}));
            mainLink = temp.querySelector('[rel="category tag"]').getAttribute("href").replace(baseURL, "");
            return mainLink;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(temp);
        }
    }
};

// RIP
var animixplay = {
    baseURL: "https://animixplay.to",
    searchApi: async function (query) {
        const response = [];
        alert("Animixplay has been shut down.");
        return { status: 400, data: response };
    },
    getAnimeInfo: async function (url) {
        alert("Animixplay has been shut down.");
        return {
            "name": "",
            "image": "",
            "description": "",
            "episodes": [],
            "mainName": ""
        };
    },
    getLinkFromUrl: async function (url) {
        alert("Animixplay has been shut down.");
        return {
            sources: [],
            name: "",
            title: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null
        };
    }
};

var fmovies = {
    baseURL: fmoviesBaseURL,
    searchApi: async function (query) {
        let tempDOM = document.createElement("div");
        try {
            query = decodeURIComponent(query);
            let response = await MakeFetchZoro(`https://${fmoviesBaseURL}/search/${query.replace(" ", "-")}`, {});
            tempDOM.innerHTML = DOMPurify.sanitize(response);
            let data = [];
            let section = tempDOM.querySelectorAll(".flw-item");
            for (var i = 0; i < section.length; i++) {
                let current = section[i];
                let dataCur = {
                    "image": "",
                    "link": "",
                    "name": "",
                };
                let poster = current.querySelector(".film-poster");
                let detail = current.querySelector(".film-detail");
                let temlLink = poster.querySelector("a").getAttribute("href");
                if (temlLink.includes("http")) {
                    temlLink = (new URL(temlLink)).pathname;
                }
                dataCur.image = poster.querySelector("img").getAttribute("data-src");
                dataCur.link = temlLink + "&engine=2";
                dataCur.name = detail.querySelector(".film-name").innerText.trim();
                data.push(dataCur);
            }
            return {
                "status": 200,
                "data": data
            };
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(tempDOM);
        }
    },
    getSeason: async function getSeason(showID, showURL) {
        let tempSeasonDIV = document.createElement("div");
        let tempMetaDataDIV = document.createElement("div");
        try {
            const isInk = fmoviesBaseURL.includes(".ink");
            let seasonHTML = await MakeFetch(`https://${fmoviesBaseURL}/ajax/v2/tv/seasons/${showID}`);
            tempSeasonDIV.innerHTML = DOMPurify.sanitize(seasonHTML);
            let tempDOM = tempSeasonDIV.getElementsByClassName("dropdown-item ss-item");
            let seasonInfo = {};
            for (var i = 0; i < tempDOM.length; i++) {
                seasonInfo[tempDOM[i].innerText] = tempDOM[i].getAttribute("data-id");
            }
            let showMetaData = await MakeFetch(`https://${fmoviesBaseURL}/${showURL}`);
            tempMetaDataDIV.innerHTML = DOMPurify.sanitize(showMetaData);
            let metaData;
            if (isInk) {
                metaData = {
                    "name": tempMetaDataDIV.querySelector(".detail_page-infor").querySelector(".heading-name").innerText,
                    "image": tempMetaDataDIV.querySelector(".detail_page-infor").querySelector(".film-poster-img").src,
                    "des": tempMetaDataDIV.querySelector(".detail_page-infor").querySelector(".description").innerText,
                };
            }
            else {
                metaData = {
                    "name": tempMetaDataDIV.querySelector(".movie_information").querySelector(".heading-name").innerText,
                    "image": tempMetaDataDIV.querySelector(".movie_information").querySelector(".film-poster-img").src,
                    "des": tempMetaDataDIV.querySelector(".m_i-d-content").querySelector(".description").innerText,
                };
            }
            try {
                metaData.genres = [];
                const metaCon = tempMetaDataDIV.querySelector(".elements");
                for (const genreAnchor of metaCon.querySelectorAll("a")) {
                    const href = genreAnchor.getAttribute("href");
                    if (href && href.includes("/genre/")) {
                        metaData.genres.push(genreAnchor.innerText);
                    }
                }
            }
            catch (err) {
                console.log(err);
            }
            return { "status": 200, "data": { "seasons": seasonInfo, "meta": metaData } };
        }
        catch (error) {
            return { "status": 400, "data": error.toString() };
        }
        finally {
            removeDOM(tempSeasonDIV);
            removeDOM(tempMetaDataDIV);
        }
    },
    getEpisode: async function getEpisode(seasonID) {
        let temp = document.createElement("div");
        try {
            let r = await MakeFetch(`https://${fmoviesBaseURL}/ajax/v2/season/episodes/${seasonID}`);
            temp.innerHTML = DOMPurify.sanitize(r);
            let tempDOM = temp.getElementsByClassName("nav-link btn btn-sm btn-secondary eps-item");
            let data = [];
            for (var i = 0; i < tempDOM.length; i++) {
                let episodeData = {
                    title: tempDOM[i].getAttribute("title"),
                    id: tempDOM[i].getAttribute("data-id"),
                };
                data.push(episodeData);
            }
            return { "status": 200, "data": data };
        }
        catch (error) {
            return { "status": 400, "data": error.toString() };
        }
        finally {
            removeDOM(temp);
        }
    },
    getAnimeInfo: async function (url) {
        const isInk = url.includes("-full-");
        // For backwards compatibility
        if (!url.includes("-online-") && !fmoviesBaseURL.includes(".ink")) {
            url = url.replace("-full-", "-online-");
        }
        else if (url.includes("-online-") && fmoviesBaseURL.includes(".ink")) {
            url = url.replace("-online-", "-full-");
        }
        let self = this;
        let urlSplit = url.split("&engine");
        if (urlSplit.length >= 2) {
            url = urlSplit[0];
        }
        let data = {
            "name": "",
            "image": "",
            "description": "",
            "episodes": [],
            "mainName": ""
        };
        let showIdSplit = url.split("-");
        let showId = showIdSplit[showIdSplit.length - 1].split(".")[0];
        const rawURL = `https://${fmoviesBaseURL}/${url}`;
        try {
            let response = await self.getSeason(showId, url);
            if (response.status == 200) {
                data.name = response.data.meta.name;
                data.image = response.data.meta.image;
                data.description = response.data.meta.des;
                data.mainName = url.split("/watch-")[1].split(isInk ? "-full" : "-online")[0] + "-" + showId + "-";
                data.episodes = [];
                if (response.data.meta.genres && response.data.meta.genres.length > 0) {
                    data.genres = response.data.meta.genres;
                }
                let allAwaits = [];
                let seasonNames = [];
                let metaDataPromises = [];
                let metaData = {};
                for (let season in response.data.seasons) {
                    seasonNames.push(season);
                    try {
                        // metaDataPromises.push(await MakeFetchTimeout(`https://ink-fork-carpenter.glitch.me/tv/season?id=${showId}&season=${season.split(" ")[1].trim()}`, {}, 1000));
                    }
                    catch (err) {
                    }
                    allAwaits.push(self.getEpisode(response.data.seasons[season]));
                }
                let values;
                let tempMetaData = [];
                let isSettleSupported = "allSettled" in Promise;
                if (!isSettleSupported) {
                    try {
                        tempMetaData = await Promise.all(metaDataPromises);
                    }
                    catch (err) {
                    }
                    values = await Promise.all(allAwaits);
                }
                else {
                    let allReponses = await Promise.allSettled([Promise.all(allAwaits), Promise.all(metaDataPromises)]);
                    if (allReponses[0].status === "fulfilled") {
                        values = allReponses[0].value;
                        console.log(values);
                    }
                    else {
                        throw Error("Could not get the seasons. Try again.");
                    }
                    if (allReponses[1].status === "fulfilled") {
                        tempMetaData = allReponses[1].value;
                    }
                }
                try {
                    for (let i = 0; i < tempMetaData.length; i++) {
                        let metaJSON = JSON.parse(tempMetaData[i]);
                        let episodeData = {};
                        for (let j = 0; j < metaJSON.episodes.length; j++) {
                            let curEpisode = metaJSON.episodes[j];
                            episodeData[curEpisode.episode_number] = {};
                            episodeData[curEpisode.episode_number].thumbnail = `https://image.tmdb.org/t/p/w300${curEpisode.still_path}`,
                                episodeData[curEpisode.episode_number].description = curEpisode.overview;
                        }
                        metaData[metaJSON.season_number] = episodeData;
                    }
                }
                catch (err) {
                    console.error(err);
                }
                data.totalPages = values.length;
                data.pageInfo = [];
                for (let key = 0; key < values.length; key++) {
                    let seasonData = values[key];
                    data.pageInfo.push({
                        "pageName": seasonNames[key],
                        "pageSize": seasonData.data.length
                    });
                    for (let i = 0; i < seasonData.data.length; i++) {
                        let tempData = {
                            title: `${seasonNames[key]} | ${seasonData.data[i].title}`,
                            link: `?watch=${url}.${seasonData.data[i].id}&engine=2`,
                        };
                        try {
                            let ep = parseInt(seasonData.data[i].title.split("Eps ")[1]);
                            let season = seasonNames[key].split(" ")[1].trim();
                            if (season in metaData && ep in metaData[season]) {
                                tempData.thumbnail = metaData[season][ep].thumbnail;
                                tempData.description = metaData[season][ep].description;
                            }
                        }
                        catch (err) {
                            console.error(err);
                        }
                        data.episodes.push(tempData);
                    }
                }
                if (Object.keys(response.data.seasons).length === 0) {
                    let thumbnail = null;
                    try {
                        // thumbnail = `https://image.tmdb.org/t/p/w300${JSON.parse(await MakeFetchTimeout(`https://ink-fork-carpenter.glitch.me/movies?id=${showId}`, {}, 1000)).backdrop_path}`;
                    }
                    catch (err) {
                    }
                    let tempData = {
                        title: `Watch`,
                        link: `?watch=${url}&engine=2`
                    };
                    if (thumbnail) {
                        tempData.thumbnail = thumbnail;
                    }
                    data.episodes.push(tempData);
                    data.totalPages = 1;
                    data.pageInfo = [{
                            "pageName": "Movie",
                            "pageSize": 1
                        }];
                }
                return data;
            }
            else {
                throw Error("Could not get the seasons.");
            }
        }
        catch (err) {
            err.url = rawURL;
            throw err;
        }
    },
    getLinkFromStream: async function getLinkFromStream(url) {
        try {
            var option = {
                'headers': {
                    'x-requested-with': 'XMLHttpRequest',
                }
            };
            let host = (new URL(url)).origin;
            let linkSplit = url.split("/");
            let link = linkSplit[linkSplit.length - 1];
            link = link.split("?")[0];
            let sourceJSON = JSON.parse(await MakeCusReqFmovies(`${host}/ajax/embed-4/getSources?id=${link}&_token=3&_number=${6}`, option));
            return (sourceJSON);
        }
        catch (err) {
            throw err;
        }
    },
    getLinkFromUrl: async function (url) {
        const isInk = fmoviesBaseURL.includes(".ink");
        let self = this;
        if (!url.includes("-online-") && !fmoviesBaseURL.includes(".ink")) {
            url = url.replace("-full-", "-online-");
        }
        else if (url.includes("-online-") && fmoviesBaseURL.includes(".ink")) {
            url = url.replace("-online-", "-full-");
        }
        url = url.split("&engine")[0];
        const data = {
            sources: [],
            name: "",
            title: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null
        };
        let showIdSplit = url.split("-");
        let showId = showIdSplit[showIdSplit.length - 1].split(".")[0];
        const infoDOM = document.createElement("div");
        const tempGetDom = document.createElement("div");
        const temp = document.createElement("div");
        try {
            const option = {
                'headers': {
                    'referer': 'https://fmovies.ps/',
                    'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36 Edg/98.0.1108.43",
                }
            };
            let split = url.split("-");
            split = split[split.length - 1].split(".");
            let isShow = split.length == 1;
            let server;
            let ep;
            let responseAPI;
            if (isShow) {
                ep = split[0];
                responseAPI = await MakeCusReqFmovies(`https://${fmoviesBaseURL}/ajax/movie/episodes/${ep}`, option);
            }
            else {
                ep = split[1];
                responseAPI = await MakeCusReqFmovies(`https://${fmoviesBaseURL}/ajax/v2/episode/servers/${ep}`, option);
            }
            if (isShow) {
                let getLink2 = responseAPI;
                infoDOM.innerHTML = DOMPurify.sanitize(getLink2);
                let tempDOM = infoDOM.getElementsByClassName("nav-link btn btn-sm btn-secondary");
                for (var i = 0; i < tempDOM.length; i++) {
                    if (tempDOM[i].getAttribute("title").toLowerCase().indexOf("vidcloud") > -1) {
                        server = tempDOM[i].getAttribute("data-linkid");
                        break;
                    }
                }
            }
            else {
                let getLink2 = responseAPI;
                infoDOM.innerHTML = DOMPurify.sanitize(getLink2);
                let tempDOM = infoDOM.getElementsByClassName("nav-link btn btn-sm btn-secondary");
                for (var i = 0; i < tempDOM.length; i++) {
                    if (tempDOM[i].getAttribute("title").toLowerCase().indexOf("vidcloud") > -1) {
                        server = tempDOM[i].getAttribute("data-id");
                        break;
                    }
                }
            }
            let seasonLinkPromises = [
                MakeFetch(`https://${fmoviesBaseURL}/watch-${url.split(".")[0]}.${server}`),
                MakeCusReqFmovies(`https://${fmoviesBaseURL}/ajax/get_link/${server}`, option)
            ];
            let seasonLinkData = await Promise.all(seasonLinkPromises);
            let getSeason = seasonLinkData[0];
            tempGetDom.innerHTML = DOMPurify.sanitize(getSeason);
            let currentSeason = tempGetDom.querySelector(".detail_page-watch").getAttribute("data-season");
            let getLink = seasonLinkData[1];
            let title = JSON.parse(getLink).title;
            let link = JSON.parse(getLink).link;
            let promises = [self.getLinkFromStream(link)];
            let seasonNotEmpty = false;
            if (currentSeason != "") {
                seasonNotEmpty = true;
                promises.push(MakeFetch(`https://${fmoviesBaseURL}/ajax/v2/season/episodes/${currentSeason}`));
            }
            let parallelReqs = await Promise.all(promises);
            if (seasonNotEmpty) {
                let r = parallelReqs[1];
                temp.innerHTML = DOMPurify.sanitize(r);
                let tempDOM = temp.getElementsByClassName("nav-link btn btn-sm btn-secondary eps-item");
                for (var i = 0; i < tempDOM.length; i++) {
                    if (ep == tempDOM[i].getAttribute("data-id")) {
                        if (i != 0) {
                            data.prev = url.split(".")[0] + "." + tempDOM[i - 1].getAttribute("data-id") + "&engine=2";
                        }
                        if (i != (tempDOM.length - 1)) {
                            data.next = url.split(".")[0] + "." + tempDOM[i + 1].getAttribute("data-id") + "&engine=2";
                        }
                    }
                }
            }
            let sourceJSON = parallelReqs[0];
            let encryptedURL = sourceJSON.sources;
            let decryptKey;
            if (typeof encryptedURL == "string") {
                try {
                    decryptKey = await extractKey(4, null, true);
                    sourceJSON.sources = JSON.parse(CryptoJS.AES.decrypt(encryptedURL, decryptKey).toString(CryptoJS.enc.Utf8));
                }
                catch (err) {
                    if (err.message == "Malformed UTF-8 data") {
                        decryptKey = await extractKey(4);
                        try {
                            sourceJSON.sources = JSON.parse(CryptoJS.AES.decrypt(encryptedURL, decryptKey).toString(CryptoJS.enc.Utf8));
                        }
                        catch (err) {
                        }
                    }
                }
            }
            data.status = 200;
            data.message = "done";
            if (title == "") {
                data.episode = (1).toString();
            }
            else {
                data.episode = parseFloat(title.split(" ")[1]).toString();
            }
            data.name = url.split("/watch-")[1].split(isInk ? "-full" : "-online")[0] + "-" + showId + "-";
            data.nameWSeason = url.split("/watch-")[1].split(isInk ? "-full" : "-online")[0] + "-" + currentSeason;
            data.sources = [{
                    "url": sourceJSON.sources[0].file,
                    "name": "HLS",
                    "type": "hls",
                }];
            try {
                title = title.split(":");
                title.shift();
                title = title.join(":").trim();
            }
            catch (err) {
            }
            data.title = title;
            data.subtitles = sourceJSON.tracks;
            return (data);
        }
        catch (err) {
            console.error(err);
            throw (new Error("Couldn't get the link"));
        }
        finally {
            removeDOM(infoDOM);
            removeDOM(tempGetDom);
            removeDOM(temp);
        }
    },
    discover: async function () {
        let temp = document.createElement("div");
        try {
            temp.innerHTML = DOMPurify.sanitize(await MakeFetch(`https://fmovies.ink/tv-show`, {}));
            let data = [];
            for (const elem of temp.querySelectorAll(".flw-item")) {
                let image = elem.querySelector("img").getAttribute("data-src");
                let tempAnchor = elem.querySelector(".film-name");
                let name = tempAnchor.innerText.trim();
                let link = tempAnchor.querySelector("a").getAttribute("href");
                try {
                    link = (new URL(link)).pathname;
                }
                catch (err) {
                }
                data.push({
                    image,
                    name,
                    link
                });
            }
            return data;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(temp);
        }
    },
    fixTitle: function (title) {
        try {
            const tempTitle = title.split("-");
            console.log(tempTitle, title);
            if (tempTitle.length > 2) {
                tempTitle.pop();
                if (title[title.length - 1] == "-") {
                    tempTitle.pop();
                }
                title = tempTitle.join("-");
                return title;
            }
            else {
                return title;
            }
        }
        catch (err) {
            return title;
        }
    }
};

var zoro = {
    baseURL: "https://zoro.to",
    searchApi: async function (query) {
        let dom = document.createElement("div");
        try {
            let searchHTML = await MakeFetchZoro(`https://zoro.to/search?keyword=${query}`, {});
            dom.innerHTML = DOMPurify.sanitize(searchHTML);
            let itemsDOM = dom.querySelectorAll('.flw-item');
            let data = [];
            for (var i = 0; i < itemsDOM.length; i++) {
                let con = itemsDOM[i];
                let src = con.querySelector("img").getAttribute("data-src");
                let aTag = con.querySelector("a");
                let animeName = aTag.getAttribute("title");
                let animeId = aTag.getAttribute("data-id");
                let animeHref = aTag.getAttribute("href").split("?")[0] + "&engine=3";
                data.push({ "name": animeName, "id": animeId, "image": src, "link": animeHref });
            }
            return ({ data, "status": 200 });
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(dom);
        }
    },
    getAnimeInfo: async function (url, idToFind = null) {
        url = url.split("&engine")[0];
        const rawURL = `https://zoro.to/${url}`;
        const animeDOM = document.createElement("div");
        const dom = document.createElement("div");
        try {
            let idSplit = url.replace("?watch=/", "").split("-");
            let id = idSplit[idSplit.length - 1].split("?")[0];
            let response = {
                "name": "",
                "image": "",
                "description": "",
                "episodes": [],
                "mainName": ""
            };
            let animeHTML = await MakeFetchZoro(`https://zoro.to/${url}`, {});
            let malID = null;
            let settled = "allSettled" in Promise;
            try {
                let tempID = parseInt(animeHTML.split(`"mal_id":"`)[1]);
                if (!isNaN(tempID)) {
                    malID = tempID;
                }
            }
            catch (err) {
            }
            animeDOM.innerHTML = DOMPurify.sanitize(animeHTML);
            let name = url;
            let nameSplit = name.replace("?watch=", "").split("&ep=")[0].split("-");
            nameSplit.pop();
            name = nameSplit.join("-");
            response.mainName = name;
            response.name = animeDOM.querySelector(".film-name.dynamic-name").innerText;
            response.image = animeDOM.querySelector(".layout-page.layout-page-detail").querySelector("img").src;
            response.description = animeDOM.querySelector(".film-description.m-hide").innerText;
            try {
                response.genres = [];
                const metaCon = animeDOM.querySelector(".item.item-list");
                for (const genreAnchor of metaCon.querySelectorAll("a")) {
                    response.genres.push(genreAnchor.innerText);
                }
            }
            catch (err) {
                console.log(err);
            }
            let thumbnails = {};
            let promises = [];
            let episodeHTML;
            let check = false;
            if (malID !== null) {
                try {
                    let thumbnailsTemp = [];
                    if (settled) {
                        promises.push(MakeFetchTimeout(`https://api.enime.moe/mapping/mal/${malID}`, {}, 2000));
                        promises.push(MakeFetchZoro(`https://zoro.to/ajax/v2/episode/list/${id}`, {}));
                        let responses = await Promise.allSettled(promises);
                        try {
                            if (responses[0].status === "fulfilled") {
                                thumbnailsTemp = JSON.parse(responses[0].value).episodes;
                            }
                        }
                        catch (err) {
                        }
                        if (responses[1].status === "fulfilled") {
                            episodeHTML = responses[1].value;
                            check = true;
                        }
                    }
                    else {
                        let metaData = await MakeFetchTimeout(`https://api.enime.moe/mapping/mal/${malID}`, {}, 2000);
                        thumbnailsTemp = JSON.parse(metaData).episodes;
                    }
                    for (let i = 0; i < thumbnailsTemp.length; i++) {
                        thumbnails[thumbnailsTemp[i].number] = thumbnailsTemp[i];
                    }
                }
                catch (err) {
                    console.error(err);
                }
            }
            if (!check) {
                episodeHTML = await MakeFetchZoro(`https://zoro.to/ajax/v2/episode/list/${id}`, {});
            }
            episodeHTML = JSON.parse(episodeHTML).html;
            dom.innerHTML = DOMPurify.sanitize(episodeHTML);
            let episodeListDOM = dom.querySelectorAll('.ep-item');
            let data = [];
            for (var i = 0; i < episodeListDOM.length; i++) {
                let tempEp = {
                    "link": episodeListDOM[i].getAttribute("href").replace("/watch/", "?watch=").replace("?ep=", "&ep=") + "&engine=3",
                    "id": episodeListDOM[i].getAttribute("data-id"),
                    "title": "Episode " + episodeListDOM[i].getAttribute("data-number"),
                };
                if (idToFind !== null && parseInt(episodeListDOM[i].getAttribute("data-id")) == idToFind) {
                    try {
                        let epIndex = parseFloat(episodeListDOM[i].getAttribute("data-number"));
                        if (epIndex in thumbnails) {
                            response.name = thumbnails[epIndex].title;
                        }
                    }
                    catch (err) {
                        console.error(err);
                    }
                    return response;
                }
                try {
                    let epIndex = parseFloat(episodeListDOM[i].getAttribute("data-number"));
                    if (epIndex in thumbnails) {
                        tempEp.thumbnail = thumbnails[epIndex].image;
                        tempEp.title = "Episode " + epIndex + " - " + thumbnails[epIndex].title;
                        tempEp.description = thumbnails[epIndex].description;
                    }
                }
                catch (err) {
                }
                data.push(tempEp);
            }
            response.episodes = data;
            return response;
        }
        catch (err) {
            err.url = rawURL;
            throw err;
        }
        finally {
            removeDOM(animeDOM);
            removeDOM(dom);
        }
    },
    getEpisodeListFromAnimeId: async function getEpisodeListFromAnimeId(showID, episodeId) {
        let dom = document.createElement("div");
        try {
            let res = JSON.parse((await MakeFetchZoro(`https://zoro.to/ajax/v2/episode/list/${showID}`, {})));
            res = res.html;
            let ogDOM = dom;
            dom.innerHTML = DOMPurify.sanitize(res);
            let epItemsDOM = dom.querySelectorAll('.ep-item');
            let data = [];
            for (var i = 0; i < epItemsDOM.length; i++) {
                let temp = {
                    "link": epItemsDOM[i].getAttribute("href").replace("/watch/", "").replace("?ep=", "&ep=") + "&engine=3",
                    "id": epItemsDOM[i].getAttribute("data-id"),
                    "title": parseFloat(epItemsDOM[i].getAttribute("data-number")),
                    "current": 0
                };
                if (parseFloat(epItemsDOM[i].getAttribute("data-id")) == parseFloat(episodeId)) {
                    temp.current = 1;
                }
                data.push(temp);
            }
            return data;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(dom);
        }
    },
    addSource: async function addSource(type, id, subtitlesArray, sourceURLs) {
        let shouldThrow = false;
        try {
            let sources = await MakeFetchZoro(`https://zoro.to/ajax/v2/episode/sources?id=${id}`, {});
            sources = JSON.parse(sources).link;
            let urlHost = (new URL(sources)).origin;
            let sourceIdArray = sources.split("/");
            let sourceId = sourceIdArray[sourceIdArray.length - 1];
            sourceId = sourceId.split("?")[0];
            let token = localStorage.getItem("rapidToken");
            let sourceJSON = JSON.parse((await MakeFetchZoro(`${urlHost}/ajax/embed-6/getSources?id=${sourceId}&token=${token}`, {})));
            if (sourceJSON.status === false) {
                shouldThrow = true;
            }
            try {
                for (let j = 0; j < sourceJSON.tracks.length; j++) {
                    sourceJSON.tracks[j].label += " - " + type;
                    if (sourceJSON.tracks[j].kind == "captions") {
                        subtitlesArray.push(sourceJSON.tracks[j]);
                    }
                }
            }
            catch (err) {
            }
            try {
                if (sourceJSON.encrypted && typeof sourceJSON.sources == "string") {
                    let encryptedURL = sourceJSON.sources;
                    let decryptKey, tempFile;
                    try {
                        decryptKey = await extractKey(6, null, true);
                        sourceJSON.sources = JSON.parse(CryptoJS.AES.decrypt(encryptedURL, decryptKey).toString(CryptoJS.enc.Utf8));
                    }
                    catch (err) {
                        if (err.message == "Malformed UTF-8 data") {
                            decryptKey = await extractKey(6);
                            try {
                                sourceJSON.sources = JSON.parse(CryptoJS.AES.decrypt(encryptedURL, decryptKey).toString(CryptoJS.enc.Utf8));
                            }
                            catch (err) {
                            }
                        }
                    }
                }
                let tempSrc = { "url": sourceJSON.sources[0].file, "name": "HLS#" + type, "type": "hls" };
                if ("intro" in sourceJSON && "start" in sourceJSON.intro && "end" in sourceJSON.intro) {
                    tempSrc.skipIntro = sourceJSON.intro;
                }
                sourceURLs.push(tempSrc);
            }
            catch (err) {
                console.error(err);
            }
        }
        catch (err) {
            console.error(err);
        }
        if (shouldThrow) {
            throw new Error("Token not found");
        }
    },
    getVideoTitle: async function (url) {
        let showURL = new URLSearchParams(url);
        try {
            return (await this.getAnimeInfo(showURL.get("watch"), showURL.get("ep"))).name;
        }
        catch (err) {
            return "";
        }
    },
    getLinkFromUrl: async function (url) {
        const sourceURLs = [];
        let subtitles = [];
        const resp = {
            sources: sourceURLs,
            name: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null,
        };
        let episodeId, animeId;
        const dom = document.createElement("div");
        try {
            episodeId = parseFloat(url.split("&ep=")[1]).toString();
            animeId = url.replace("?watch=", "").split("-");
            animeId = animeId[animeId.length - 1].split("&")[0];
            let a = await MakeFetchZoro(`https://zoro.to/ajax/v2/episode/servers?episodeId=${episodeId}`, {});
            let domIn = JSON.parse(a).html;
            dom.innerHTML = DOMPurify.sanitize(domIn);
            let promises = [];
            promises.push(this.getEpisodeListFromAnimeId(animeId, episodeId));
            let tempDom = dom.querySelectorAll('[data-server-id="4"]');
            let hasSource = false;
            for (var i = 0; i < tempDom.length; i++) {
                hasSource = true;
                promises.push(this.addSource(tempDom[i].getAttribute("data-type"), tempDom[i].getAttribute('data-id'), subtitles, sourceURLs));
            }
            tempDom = dom.querySelectorAll('[data-server-id="1"]');
            for (var i = 0; i < tempDom.length; i++) {
                promises.push(this.addSource(tempDom[i].getAttribute("data-type"), tempDom[i].getAttribute('data-id'), subtitles, sourceURLs));
            }
            let promRes;
            try {
                promRes = await Promise.all(promises);
            }
            catch (err) {
                this.genToken();
            }
            let links = promRes[0];
            let prev = null;
            let next = null;
            let check = false;
            let epNum = 1;
            for (var i = 0; i < (links).length; i++) {
                if (check === true) {
                    next = links[i].link;
                    break;
                }
                if (parseFloat(links[i].id) == parseFloat(episodeId)) {
                    check = true;
                    epNum = links[i].title;
                }
                if (check === false) {
                    prev = links[i].link;
                }
            }
            resp["sources"] = sourceURLs;
            resp["episode"] = epNum.toString();
            if (next != null) {
                resp.next = next;
            }
            if (prev != null) {
                resp.prev = prev;
            }
            let name = url;
            let nameSplit = name.replace("?watch=", "").split("&ep=")[0].split("-");
            nameSplit.pop();
            name = nameSplit.join("-");
            resp.name = name;
            resp.nameWSeason = name;
            resp.subtitles = subtitles;
            resp.status = 200;
            return resp;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(dom);
        }
    },
    discover: async function () {
        let temp = document.createElement("div");
        try {
            temp.innerHTML = DOMPurify.sanitize(await MakeFetchZoro(`https://zoro.to/top-airing`, {}));
            let data = [];
            for (let elem of temp.querySelectorAll(".flw-item")) {
                let image = elem.querySelector("img").getAttribute("data-src");
                let tempAnchor = elem.querySelector("a");
                let name = tempAnchor.getAttribute("title");
                let link = tempAnchor.getAttribute("href");
                data.push({
                    image,
                    name,
                    link
                });
            }
            return data;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(temp);
        }
    },
    genToken: async function genToken() {
        await getWebviewHTML("https://rapid-cloud.co/", false, 15000, `let resultInApp={'status':200,'data':localStorage.setItem("v1.1_getSourcesCount", "40")};webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(resultInApp));`);
        await new Promise(r => setTimeout(r, 500));
        try {
            alert("Close the inAppBrowser when the video has started playing.");
            await getWebviewHTML("https://zoro.to/watch/eighty-six-2nd-season-17760?ep=84960", false, 120000, '');
        }
        catch (err) {
        }
        await new Promise(r => setTimeout(r, 500));
        try {
            const token = await getWebviewHTML("https://rapid-cloud.co/", false, 15000, `let resultInApp={'status':200,'data':localStorage.getItem("v1.1_token")};webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(resultInApp));`);
            localStorage.setItem("rapidToken", token.data.data);
            alert("Token extracted. You can now refresh the page.");
        }
        catch (err) {
            alert("Could not extract the token. Try again or Contact the developer.");
        }
    },
    getMetaData: async function (search) {
        const id = search.get("watch").split("-").pop();
        return await getAnilistInfo("Zoro", id);
    },
    rawURLtoInfo: function (url) {
        // https://zoro.to/kimetsu-no-yaiba-movie-mugen-ressha-hen-15763
        return `?watch=${url.pathname}&engine=3`;
    }
};

var twitch = {
    baseURL: "https://twitch.tv",
    searchApi: async function (query) {
        try {
            const clientId = "kimne78kx3ncx6brgo4mv6wki5h1ko";
            const response = await MakeFetch("https://gql.twitch.tv/gql", {
                "headers": {
                    'Client-id': clientId,
                    'Content-Type': 'application/json',
                },
                "method": "POST",
                "body": JSON.stringify({
                    "operationName": "SearchResultsPage_SearchResults",
                    "variables": { "query": query, "options": null },
                    "extensions": {
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "6ea6e6f66006485e41dbe3ebd69d5674c5b22896ce7b595d7fce6411a3790138"
                        }
                    }
                })
            });
            const responseJSON = JSON.parse(response);
            const data = [];
            for (let channels of responseJSON.data.searchFor.channels.edges) {
                data.push({
                    "name": channels.item.login,
                    "id": channels.item.login,
                    "image": channels.item.profileImageURL.replace("150x150.png", "300x300.png"),
                    "link": "/" + encodeURIComponent(channels.item.login) + "&engine=4"
                });
            }
            return { data, "status": 200 };
        }
        catch (err) {
            return {
                data: err.toString(),
                status: 400
            };
        }
    },
    getAnimeInfo: function (url, sibling = false, currentID = -1) {
        url = url.split("&engine")[0];
        let id = url.replace("?watch=/", "");
        const rawURL = `${this.baseURL}/${url}`;
        let response = {
            "name": "",
            "image": "",
            "description": "",
            "episodes": [],
            "mainName": ""
        };
        response.name = id;
        response.image = "https://wallpaperaccess.com/full/4487013.jpg";
        response.description = "Twitch VOD";
        response.mainName = id;
        const clientId = "kimne78kx3ncx6brgo4mv6wki5h1ko";
        return new Promise((resolve, reject) => {
            fetch("https://gql.twitch.tv/gql", {
                "headers": {
                    'Client-id': clientId,
                    'Content-Type': 'application/json',
                },
                "method": "POST",
                "body": JSON.stringify([
                    { "operationName": "StreamRefetchManager", "variables": { "channel": id }, "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "ecdcb724b0559d49689e6a32795e6a43bba4b2071b5e762a4d1edf2bb42a6789" } } },
                    { "operationName": "FilterableVideoTower_Videos", "variables": { "limit": 50, "channelOwnerLogin": id, "broadcastType": "ARCHIVE", "videoSort": "TIME" }, "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "a937f1d22e269e39a03b509f65a7490f9fc247d7f83d6ac1421523e3b68042cb" } } }
                ])
            }).then((x) => x.json()).then((resData) => {
                let isLive = resData[0].data.user.stream !== null;
                let items = resData[1].data.user.videos.edges;
                let data = [];
                response.totalPages = 2;
                response.pageInfo = [{
                        pageName: "VODs",
                        pageSize: items.length,
                    }];
                if (sibling) {
                    data = [null, null, null];
                    for (let i = 0; i < items.length; i++) {
                        let which = -1;
                        if (currentID == items[i].node.id) {
                            which = 1;
                        }
                        else if (i != 0 && currentID == items[i - 1].node.id) {
                            which = 0;
                        }
                        else if (i != (items.length - 1) && currentID == items[i + 1].node.id) {
                            which = 2;
                        }
                        if (which != -1) {
                            data[which] = {
                                "link": encodeURIComponent(id) + "&id=" + items[i].node.id + "&engine=4",
                                "id": id,
                                "title": items[i].node.title,
                            };
                        }
                    }
                }
                else {
                    for (let vod of items) {
                        response.image = vod.node.owner.profileImageURL.replace("50x50.png", "300x300.png");
                        data.unshift({
                            "link": "?watch=" + encodeURIComponent(id) + "&id=" + vod.node.id + "&engine=4",
                            "id": id,
                            "title": vod.node.title,
                            "thumbnail": vod.node.previewThumbnailURL,
                            "date": new Date(vod.node.publishedAt)
                        });
                    }
                }
                if (isLive && !sibling) {
                    data.push({
                        "link": "?watch=" + encodeURIComponent(id) + "&id=" + "live" + "&engine=4",
                        "id": id,
                        "title": `${id} is Live!`,
                    });
                    response.pageInfo.push({
                        pageName: "Live",
                        pageSize: 1,
                    });
                }
                response.episodes = data;
                resolve(response);
            }).catch((error) => {
                error.url = rawURL;
                reject(error);
            });
        });
    },
    'getLinkFromUrl': async function (url) {
        url = "?watch=" + url;
        const params = new URLSearchParams(url);
        const name = params.get("watch");
        const ep = params.get("id");
        const isLive = (ep == "live");
        const clientId = "kimne78kx3ncx6brgo4mv6wki5h1ko";
        let title = "";
        function getAccessToken(id, isVod) {
            const data = JSON.stringify({
                operationName: "PlaybackAccessToken",
                extensions: {
                    persistedQuery: {
                        version: 1,
                        sha256Hash: "0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712"
                    }
                },
                variables: {
                    isLive: !isVod,
                    login: (isVod ? "" : id),
                    isVod: isVod,
                    vodID: (isVod ? id : ""),
                    playerType: "embed"
                }
            });
            return new Promise((resolve, reject) => {
                fetch("https://gql.twitch.tv/gql", {
                    "headers": {
                        'Client-id': clientId,
                        'Content-Type': 'application/json',
                    },
                    "method": "POST",
                    "body": data
                }).then((x) => x.json()).then((resData) => {
                    console.log(resData);
                    if (isVod) {
                        resolve(resData.data.videoPlaybackAccessToken);
                    }
                    else {
                        resolve(resData.data.streamPlaybackAccessToken);
                    }
                }).catch((error) => reject(error));
            });
        }
        function getPlaylist(id, accessToken, vod) {
            return `https://usher.ttvnw.net/${vod ? 'vod' : 'api/channel/hls'}/${id}.m3u8?client_id=${clientId}&token=${accessToken.value}&sig=${accessToken.signature}&allow_source=true&allow_audio_only=true`;
        }
        function getStream(channel) {
            return new Promise((resolve, reject) => {
                getAccessToken(channel, false)
                    .then((accessToken) => getPlaylist(channel, accessToken, false))
                    .then((playlist) => resolve(playlist))
                    .catch(error => reject(error));
            });
        }
        function getVod(vid) {
            return new Promise((resolve, reject) => {
                getAccessToken(vid, true)
                    .then((accessToken) => getPlaylist(vid, accessToken, true))
                    .then((playlist) => resolve(playlist))
                    .catch(error => reject(error));
            });
        }
        const resp = {
            sources: [],
            name: "",
            title: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null
        };
        if (!isLive) {
            try {
                const epList = await this.getAnimeInfo(name, true, parseInt(ep));
                if (epList.episodes[0]) {
                    resp.prev = epList.episodes[0].link;
                }
                if (epList.episodes[2]) {
                    resp.next = epList.episodes[2].link;
                }
                try {
                    if (epList.episodes[1]) {
                        title = epList.episodes[1].title;
                    }
                }
                catch (err) {
                    title = "";
                }
            }
            catch (err) {
            }
        }
        else {
            title = "Live";
        }
        resp.sources = [
            {
                "url": isLive ? (await getStream(name)) : (await getVod(ep)),
                "name": "VOD",
                "type": "hls"
            }
        ];
        resp.name = name;
        resp.episode = "1";
        resp.nameWSeason = name + ep;
        resp.subtitles = [];
        resp.status = 200;
        resp.title = title;
        return resp;
    },
};

var nineAnime = {
    baseURL: "https://9anime.to",
    searchApi: async function (query) {
        const searchDOM = document.createElement("div");
        try {
            const vrf = await this.getVRF(query, "9anime-search");
            const searchHTML = await MakeFetchZoro(`https://9anime.to/filter?keyword=${encodeURIComponent(query)}&${vrf[1]}=${vrf[0]}`);
            searchDOM.innerHTML = DOMPurify.sanitize(searchHTML);
            const searchElem = searchDOM.querySelector("#list-items");
            const searchItems = searchElem.querySelectorAll(".item");
            const response = [];
            if (searchItems.length === 0) {
                throw new Error("No results found.");
            }
            for (let i = 0; i < searchItems.length; i++) {
                const currentElem = searchItems[i];
                response.push({
                    "name": currentElem.querySelector(".name").innerText,
                    "id": currentElem.querySelector(".name").getAttribute("href").replace("/watch/", ""),
                    "image": currentElem.querySelector("img").src,
                    "link": "/" + currentElem.querySelector(".name").getAttribute("href").replace("/watch/", "") + "&engine=5"
                });
            }
            return { "data": response, "status": 200 };
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(searchDOM);
        }
    },
    getAnimeInfo: async function (url, nextPrev = false) {
        url = url.split("&engine")[0];
        const response = {
            "name": "",
            "image": "",
            "description": "",
            "episodes": [],
            "mainName": ""
        };
        let id = url.replace("?watch=/", "");
        const rawURL = `https://9anime.to/watch/${id}`;
        const episodesDOM = document.createElement("div");
        const infoDOM = document.createElement("div");
        try {
            let infoHTML = await MakeFetchZoro(`https://9anime.to/watch/${id}`);
            infoDOM.innerHTML = DOMPurify.sanitize(infoHTML);
            let nineAnimeID = infoDOM.querySelector("#watch-main").getAttribute("data-id");
            let infoMainDOM = infoDOM.querySelector("#w-info").querySelector(".info");
            response.mainName = id;
            response.name = infoMainDOM.querySelector(".title").innerText;
            response.description = infoMainDOM.querySelector(".content").innerText;
            response.image = infoDOM.querySelector("#w-info").querySelector("img").getAttribute("src");
            try {
                response.genres = [];
                const metaCon = infoDOM.querySelector(".bmeta").querySelector(".meta");
                for (const genreAnchor of metaCon.querySelectorAll("a")) {
                    const href = genreAnchor.getAttribute("href");
                    if (href && href.includes("/genre/")) {
                        response.genres.push(genreAnchor.innerText);
                    }
                }
            }
            catch (err) {
                console.log(err);
            }
            let episodes = [];
            let IDVRF = await this.getVRF(nineAnimeID, "ajax-episode-list");
            let episodesHTML = "";
            try {
                const tempResponse = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/episode/list/${nineAnimeID}?${IDVRF[1]}=${IDVRF[0]}`));
                if (tempResponse.result) {
                    episodesHTML = tempResponse.result;
                }
                else {
                    throw new Error("Couldn't find the result");
                }
            }
            catch (err) {
                throw new Error(`Error 9ANIME_INFO_JSON: The JSON could be be parsed. ${err.message}`);
            }
            episodesDOM.innerHTML = DOMPurify.sanitize(episodesHTML);
            let episodeElem = episodesDOM.querySelectorAll("li");
            for (let i = 0; i < episodeElem.length; i++) {
                let curElem = episodeElem[i];
                let title = "";
                try {
                    title = curElem.querySelector("span").innerText;
                }
                catch (err) {
                    console.warn("Could not find the title");
                }
                episodes.push({
                    "link": (nextPrev ? "" : "?watch=") + encodeURIComponent(id) + "&ep=" + curElem.querySelector("a").getAttribute("data-ids") + "&engine=5",
                    "id": curElem.querySelector("a").getAttribute("data-ids"),
                    "title": nextPrev ? title : `Episode ${curElem.querySelector("a").getAttribute("data-num")} - ${title}`
                });
            }
            response.episodes = episodes;
            return response;
        }
        catch (err) {
            err.url = rawURL;
            throw err;
        }
        finally {
            removeDOM(episodesDOM);
            removeDOM(infoDOM);
        }
    },
    getLinkFromUrl: async function (url) {
        url = "watch=" + url;
        const response = {
            sources: [],
            name: "",
            title: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null
        };
        const serverDOM = document.createElement("div");
        try {
            const searchParams = new URLSearchParams(url);
            const sourceEp = searchParams.get("ep");
            const sourceEpVRF = await this.getVRF(sourceEp, "ajax-server-list");
            const promises = [];
            const serverHTML = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/server/list/${sourceEp}?${sourceEpVRF[1]}=${sourceEpVRF[0]}`)).result;
            serverDOM.innerHTML = DOMPurify.sanitize(serverHTML);
            const allServers = serverDOM.querySelectorAll("li");
            try {
                response.episode = serverDOM.querySelector("b").innerText.split("Episode")[1];
            }
            catch (err) {
                response.episode = serverDOM.querySelector("b").innerText;
            }
            response.name = searchParams.get("watch");
            response.nameWSeason = searchParams.get("watch");
            response.status = 200;
            let sources = [];
            let vidstreamIDs = [];
            let mCloudIDs = [];
            let filemoonIDs = [];
            for (let i = 0; i < allServers.length; i++) {
                let currentServer = allServers[i];
                let type = i.toString();
                try {
                    const tempType = currentServer.parentElement.previousElementSibling
                        .innerText
                        .trim();
                    if (tempType) {
                        type = tempType;
                    }
                }
                catch (err) {
                    console.warn(err);
                }
                if (currentServer.innerText.toLowerCase() == "vidstream") {
                    vidstreamIDs.push({
                        id: currentServer.getAttribute("data-link-id"),
                        type
                    });
                }
                else if (currentServer.innerText.toLowerCase() == "filemoon") {
                    filemoonIDs.push({
                        id: currentServer.getAttribute("data-link-id"),
                        type
                    });
                }
                else if (currentServer.innerText.toLowerCase() == "mycloud") {
                    mCloudIDs.push({
                        id: currentServer.getAttribute("data-link-id"),
                        type
                    });
                }
            }
            async function addSource(ID, self, index, extractor = "vidstream") {
                try {
                    const serverVRF = await self.getVRF(ID, "ajax-server");
                    const serverData = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/server/${ID}?${serverVRF[1]}=${serverVRF[0]}`)).result;
                    const serverURL = serverData.url;
                    const sourceDecrypted = await self.decryptSource(serverURL);
                    let source = {
                        "name": "",
                        "type": "",
                        "url": "",
                    };
                    if (extractor == "vidstream") {
                        const vidstreamID = sourceDecrypted.split("/").pop();
                        const m3u8File = await self.getVidstreamLink(vidstreamID);
                        source = {
                            "name": "HLS#" + index,
                            "type": "hls",
                            "url": m3u8File,
                        };
                        sources.push(source);
                    }
                    else if (extractor == "filemoon") {
                        const filemoonHTML = await MakeFetch(sourceDecrypted);
                        const m3u8File = await self.getFilemoonLink(filemoonHTML);
                        source = {
                            "name": "Filemoon#" + index,
                            "type": m3u8File.includes(".m3u8") ? "hls" : "mp4",
                            "url": m3u8File,
                        };
                        sources.push(source);
                    }
                    else {
                        const mCloudID = sourceDecrypted.split("/").pop();
                        const m3u8File = await self.getVidstreamLink(mCloudID, false);
                        source = {
                            "name": "Mycloud#" + index,
                            "type": m3u8File.includes(".m3u8") ? "hls" : "mp4",
                            "url": m3u8File,
                        };
                        sources.push(source);
                    }
                    if ("skip_data" in serverData) {
                        serverData.skip_data = JSON.parse(await self.decryptSource(serverData.skip_data));
                        source.skipIntro = {
                            start: serverData.skip_data.intro[0],
                            end: serverData.skip_data.intro[1]
                        };
                    }
                }
                catch (err) {
                    console.warn(err);
                }
            }
            for (let i = 0; i < vidstreamIDs.length; i++) {
                promises.push(addSource(vidstreamIDs[i].id, this, vidstreamIDs[i].type));
            }
            for (let i = 0; i < filemoonIDs.length; i++) {
                promises.push(addSource(filemoonIDs[i].id, this, filemoonIDs[i].type, "filemoon"));
            }
            for (let i = 0; i < mCloudIDs.length; i++) {
                promises.push(addSource(mCloudIDs[i].id, this, mCloudIDs[i].type, "mycloud"));
            }
            let settledSupported = "allSettled" in Promise;
            let epList = [];
            if (settledSupported) {
                promises.unshift(this.getAnimeInfo(`?watch=/${searchParams.get("watch")}`, true));
                const promiseResult = await Promise.allSettled(promises);
                if (promiseResult[0].status === "fulfilled") {
                    epList = promiseResult[0].value.episodes;
                }
            }
            else {
                try {
                    await Promise.all(promises);
                    epList = (await this.getAnimeInfo(`?watch=/${searchParams.get("watch")}`, true)).episodes;
                }
                catch (err) {
                    console.error(err);
                }
            }
            let check = false;
            for (var i = 0; i < epList.length; i++) {
                if (check === true) {
                    response.next = epList[i].link;
                    break;
                }
                if (epList[i].id == sourceEp) {
                    check = true;
                    response.title = epList[i].title;
                }
                if (check === false) {
                    response.prev = epList[i].link;
                }
            }
            if (!sources.length) {
                throw new Error("No sources were found. Try again later or contact the developer.");
            }
            response.sources = sources;
            return response;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(serverDOM);
        }
    },
    checkConfig: function () {
        if (!localStorage.getItem("9anime")) {
            throw new Error("9anime URL not set");
        }
        if (!localStorage.getItem("apikey")) {
            throw new Error("API keynot set");
        }
    },
    getVRF: async function (query, action) {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        }
        catch (err) {
            console.warn("Defaulting to Consumet.");
        }
        let reqURL = `https://${nineAnimeURL}/${action}?query=${encodeURIComponent(query)}&apikey=${apiKey}`;
        if (fallbackAPI) {
            reqURL = `https://${nineAnimeURL}?query=${encodeURIComponent(query)}&action=${action}`;
        }
        const source = await MakeFetch(reqURL);
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.url) {
                return [encodeURIComponent(parsedJSON.url), parsedJSON.vrfQuery];
            }
            else {
                throw new Error(`${action}-VRF1: Received an empty URL or the URL was not found.`);
            }
        }
        catch (err) {
            throw new Error(`${action}-VRF1: Could not parse the JSON correctly.`);
        }
    },
    decryptSource: async function (query) {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        }
        catch (err) {
            console.warn("Defaulting to Consumet.");
        }
        let reqURL = `https://${nineAnimeURL}/decrypt?query=${encodeURIComponent(query)}&apikey=${apiKey}`;
        if (fallbackAPI) {
            reqURL = `https://${nineAnimeURL}?query=${encodeURIComponent(query)}&action=decrypt`;
        }
        const source = await MakeFetch(reqURL);
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.url) {
                return parsedJSON.url;
            }
            else {
                throw new Error("DECRYPT1: Received an empty URL or the URL was not found.");
            }
        }
        catch (err) {
            throw new Error("DECRYPT0: Could not parse the JSON correctly.");
        }
    },
    getVidstreamLink: async function (query, isViz = true) {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        }
        catch (err) {
            console.warn("Defaulting to Consumet.");
        }
        let reqURL = `https://${nineAnimeURL}/${isViz ? "vizcloud" : "mcloud"}?query=${encodeURIComponent(query)}&apikey=${apiKey}`;
        if (fallbackAPI) {
            reqURL = `https://${nineAnimeURL}?query=${encodeURIComponent(query)}&action=${isViz ? "vizcloud" : "mcloud"}`;
        }
        const source = await MakeFetch(reqURL);
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.data &&
                parsedJSON.data.media &&
                parsedJSON.data.media.sources &&
                parsedJSON.data.media.sources[0] &&
                parsedJSON.data.media.sources[0].file) {
                return parsedJSON.data.media.sources[0].file;
            }
            else {
                throw new Error("VIZCLOUD1: Received an empty URL or the URL was not found.");
            }
        }
        catch (err) {
            throw new Error("VIZCLOUD0: Could not parse the JSON correctly.");
        }
    },
    getFilemoonLink: async function (filemoonHTML) {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        }
        catch (err) {
            console.warn("Defaulting to Consumet.");
        }
        let reqURL = `https://${nineAnimeURL}/filemoon?apikey=${apiKey}`;
        if (fallbackAPI) {
            throw new Error("Not supported");
        }
        const source = await MakeFetch(reqURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                "query": filemoonHTML
            })
        });
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.url) {
                return parsedJSON.url;
            }
            else {
                throw new Error("FILEMOON1: Received an empty URL or the URL was not found.");
            }
        }
        catch (err) {
            throw new Error("FILEMOON0: Could not parse the JSON correctly.");
        }
    },
    fixTitle: function (title) {
        try {
            const tempTitle = title.split(".");
            if (tempTitle.length > 1) {
                tempTitle.pop();
                title = tempTitle.join(".");
                return title;
            }
            else {
                return title;
            }
        }
        catch (err) {
            return title;
        }
    },
    discover: async function () {
        let temp = document.createElement("div");
        temp.innerHTML = DOMPurify.sanitize(await MakeFetchZoro(`https://9anime.to/home`, {}));
        temp = temp.querySelector(".ani.items");
        let data = [];
        for (const elem of temp.querySelectorAll(".item")) {
            let image = elem.querySelector("img").getAttribute("src");
            let name = elem.querySelector(".name.d-title").innerText.trim();
            let link = elem.querySelector(".name.d-title").getAttribute("href");
            const splitLink = link.split("/");
            splitLink.pop();
            link = splitLink.join("/").replace("/watch", "");
            data.push({
                image,
                name,
                link
            });
        }
        return data;
    },
    config: {
        "referer": "https://9anime.to",
    },
    getConfig: function (url) {
        if (url.includes("mcloud.to")) {
            return {
                "referer": "https://mcloud.to/"
            };
        }
        else {
            return this.config;
        }
    },
    getMetaData: async function (search) {
        const id = search.get("watch").split(".").pop();
        return await getAnilistInfo("9anime", id);
    },
    rawURLtoInfo: function (url) {
        // https://9anime.pl/watch/demon-slayer-kimetsu-no-yaiba-the-movie-mugen-train.lj5q
        return `?watch=${url.pathname.replace("/watch", "")}&engine=5`;
    }
};

var fmoviesto = {
    baseURL: "https://fmovies.to",
    searchApi: async function (query) {
        let rawURL = "";
        let searchDOM = document.createElement("div");
        try {
            query = query.replace(" ", "+");
            const vrf = await this.getVRF(query, "fmovies-vrf");
            rawURL = `https://fmovies.to/search?keyword=${encodeURIComponent(query)}&vrf=${vrf[0]}`;
            const searchHTML = await MakeFetchZoro(`https://fmovies.to/search?keyword=${encodeURIComponent(query)}&vrf=${vrf[0]}`);
            searchDOM.innerHTML = DOMPurify.sanitize(searchHTML);
            const searchElem = searchDOM.querySelector(".filmlist");
            if (!searchElem) {
                throw new Error("No results found.");
            }
            const searchItems = searchElem.querySelectorAll(".item");
            const response = [];
            if (searchItems.length === 0) {
                throw new Error("No results found.");
            }
            for (let i = 0; i < searchItems.length; i++) {
                const currentElem = searchItems[i];
                response.push({
                    "id": currentElem.querySelector(".title").getAttribute('href').slice(1),
                    "name": currentElem.querySelector(".title").innerText,
                    "image": currentElem.querySelector("img").src,
                    "link": "/" + currentElem.querySelector(".title").getAttribute("href").slice(1).replace("/watch/", "") + "&engine=6"
                });
            }
            return { "data": response, "status": 200 };
        }
        catch (err) {
            err.rawURL = rawURL;
            throw err;
        }
        finally {
            removeDOM(searchDOM);
        }
    },
    getAnimeInfo: async function (url, nextPrev = false) {
        url = url.split("&engine")[0];
        const response = {
            "name": "",
            "image": "",
            "description": "",
            "episodes": [],
            "mainName": ""
        };
        let id = url.replace("?watch=/", "");
        const rawURL = `https://fmovies.to/${id}`;
        let episodesDOM = document.createElement("div");
        let infoDOM = document.createElement("div");
        try {
            let infoHTML = await MakeFetchZoro(`https://fmovies.to/${id}`);
            infoDOM.innerHTML = DOMPurify.sanitize(infoHTML, {
                "ADD_ATTR": ["itemprop"]
            });
            const container = infoDOM.querySelector(".watch-extra");
            response.mainName = id.replace("series/", "").replace("movie/", "");
            response.name = container.querySelector(`h1`).innerText;
            response.image = container.querySelector(`img`).getAttribute("src");
            response.description = container.querySelector("div[itemprop=\"description\"]").innerText.trim();
            const isMovie = id.split('/')[0] !== "series";
            try {
                response.genres = [];
                const metaCon = infoDOM.querySelector(".bmeta").querySelector(".meta");
                for (const genreAnchor of metaCon.querySelectorAll("a")) {
                    const href = genreAnchor.getAttribute("href");
                    if (href && href.includes("/genre/")) {
                        response.genres.push(genreAnchor.innerText);
                    }
                }
            }
            catch (err) {
                console.log(err);
            }
            let episodes = [];
            const uid = infoDOM.querySelector("#watch").getAttribute("data-id");
            let IDVRF = await this.getVRF(uid, "fmovies-vrf");
            let episodesHTML = "";
            try {
                const tempResponse = JSON.parse(await MakeFetchZoro(`https://fmovies.to/ajax/film/servers?id=${uid}&vrf=${IDVRF[0]}`));
                if (tempResponse.html) {
                    episodesHTML = tempResponse.html;
                }
                else {
                    throw new Error("Couldn't find the result");
                }
            }
            catch (err) {
                throw new Error(`Error 9ANIME_INFO_JSON: The JSON could be be parsed. ${err.message}`);
            }
            episodesDOM.innerHTML = DOMPurify.sanitize(episodesHTML);
            let episodeElem = episodesDOM.querySelectorAll(".episode");
            response.totalPages = 0;
            response.pageInfo = [];
            if (isMovie) {
                response.totalPages = 1;
                response.pageInfo.push({
                    pageName: `Movie`,
                    pageSize: 0
                });
            }
            let lastSeason = -1;
            for (let i = 0; i < episodeElem.length; i++) {
                let curElem = episodeElem[i];
                let title = "";
                let episodeNum;
                let season;
                try {
                    if (isMovie) {
                        title = curElem.innerText;
                    }
                    else {
                        title = curElem.querySelector('a').getAttribute('title');
                    }
                }
                catch (err) {
                    console.warn("Could not find the title");
                }
                if (!isMovie) {
                    episodeNum = parseInt(curElem.querySelector('a').getAttribute('data-kname').split('-')[1]);
                    season = parseInt(curElem.querySelector('a').getAttribute('data-kname').split('-')[0]);
                    if (response.totalPages == 0 || season != lastSeason) {
                        response.pageInfo.push({
                            pageName: `Season ${season}`,
                            pageSize: 1
                        });
                        response.totalPages++;
                    }
                    else {
                        response.pageInfo[response.pageInfo.length - 1].pageSize++;
                    }
                    lastSeason = season;
                }
                else {
                    response.pageInfo[response.pageInfo.length - 1].pageSize++;
                }
                episodes.push({
                    "link": (nextPrev ? "" : "?watch=") + encodeURIComponent(id) + "&ep=" + curElem.querySelector("a").getAttribute("data-kname") + "&engine=6",
                    "id": curElem.querySelector("a").getAttribute("data-kname"),
                    "title": (nextPrev || isMovie) ? title : `Season ${season} | Episode ${episodeNum} - ${title}`
                });
            }
            response.episodes = episodes;
            return response;
        }
        catch (err) {
            err.url = rawURL;
            throw err;
        }
        finally {
            removeDOM(episodesDOM);
            removeDOM(infoDOM);
        }
    },
    getLinkFromUrl: async function (url) {
        url = "watch=" + url;
        const response = {
            sources: [],
            name: "",
            title: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null
        };
        const infoDOM = document.createElement("div");
        const serverDOM = document.createElement("div");
        try {
            const searchParams = new URLSearchParams(url);
            const sourceEp = searchParams.get("ep");
            const isMovie = searchParams.get("watch").split('/')[0] !== "series";
            const promises = [];
            const infoHTML = await MakeFetchZoro(`https://fmovies.to/${searchParams.get("watch")}`);
            infoDOM.innerHTML = DOMPurify.sanitize(infoHTML);
            const uid = infoDOM.querySelector("#watch").getAttribute('data-id');
            const epsiodeServers = [];
            const serverVRF = await this.getVRF(uid, "fmovies-vrf");
            const serverHTML = JSON.parse(await MakeFetchZoro(`https://fmovies.to/ajax/film/servers?id=${uid}&vrf=${serverVRF[0]}`)).html;
            serverDOM.innerHTML = DOMPurify.sanitize(serverHTML, {
                "ADD_ATTR": ["data-kname", "data-id"]
            });
            const servers = {};
            const serverDIVs = serverDOM.querySelectorAll(".server");
            for (let i = 0; i < serverDIVs.length; i++) {
                const curServer = serverDIVs[i];
                const serverId = curServer.getAttribute("data-id");
                let serverName = curServer.innerText.toLowerCase().split('server')[1].trim();
                servers[serverId] = serverName;
            }
            const currentEpisode = serverDOM.querySelector(`a[data-kname="${sourceEp}"]`);
            try {
                const serverString = JSON.parse(currentEpisode.getAttribute("data-ep"));
                for (const serverId in serverString) {
                    console.log(servers, serverId);
                    epsiodeServers.push({
                        type: servers[serverId],
                        id: serverString[serverId],
                    });
                }
            }
            catch (err) {
                console.log(err);
                throw new Error('Episode not found');
            }
            try {
                const epTemp = sourceEp.split('-');
                let ep = epTemp[epTemp.length - 1];
                if (!isMovie) {
                    response.episode = ep;
                }
                else {
                    if (ep == "full") {
                        response.episode = "1";
                    }
                    else {
                        response.episode = Math.max(1, ep.charCodeAt(0) - "a".charCodeAt(0) + 1).toString();
                    }
                    if (isNaN(parseInt(response.episode))) {
                        response.episode = "1";
                    }
                }
            }
            catch (err) {
                response.episode = "1";
            }
            response.name = searchParams.get("watch").replace("series/", "").replace("movie/", "");
            response.nameWSeason = response.name;
            response.status = 200;
            let sources = [];
            async function addSource(ID, self, index, extractor) {
                try {
                    const serverVRF = await self.getVRF(ID, "fmovies-vrf");
                    const serverData = JSON.parse(await MakeFetchZoro(`https://fmovies.to/ajax/episode/info?id=${ID}&vrf=${serverVRF[0]}`));
                    const serverURL = serverData.url;
                    const sourceDecrypted = await self.decryptSource(serverURL);
                    if (!response.subtitles) {
                        try {
                            // Blame Fmovies, not me
                            const subURL = new URLSearchParams((new URLSearchParams((new URL(sourceDecrypted)).search)).get("h")).values().next().value;
                            response.subtitles = JSON.parse(await MakeFetchZoro(subURL));
                        }
                        catch (err) {
                            console.warn(err);
                        }
                    }
                    let source = {
                        "name": "",
                        "type": "",
                        "url": "",
                    };
                    if (extractor == "vidstream") {
                        const vidstreamID = sourceDecrypted.split("/").pop();
                        const m3u8File = await self.getVidstreamLink(vidstreamID);
                        source = {
                            "name": "HLS#" + index,
                            "type": "hls",
                            "url": m3u8File,
                        };
                        sources.push(source);
                    }
                    else if (extractor == "filemoon") {
                        const filemoonHTML = await MakeFetch(sourceDecrypted);
                        const m3u8File = await self.getFilemoonLink(filemoonHTML);
                        source = {
                            "name": "Filemoon#" + index,
                            "type": m3u8File.includes(".m3u8") ? "hls" : "mp4",
                            "url": m3u8File,
                        };
                        sources.push(source);
                    }
                    else {
                        const mCloudID = sourceDecrypted.split("/").pop();
                        const m3u8File = await self.getVidstreamLink(mCloudID, false);
                        source = {
                            "name": "Mycloud#" + index,
                            "type": m3u8File.includes(".m3u8") ? "hls" : "mp4",
                            "url": m3u8File,
                        };
                        sources.push(source);
                    }
                    if ("skip_data" in serverData) {
                        serverData.skip_data = JSON.parse(await self.decryptSource(serverData.skip_data));
                        source.skipIntro = {
                            start: serverData.skip_data.intro[0],
                            end: serverData.skip_data.intro[1]
                        };
                    }
                }
                catch (err) {
                    console.warn(err);
                }
            }
            for (let i = 0; i < epsiodeServers.length; i++) {
                const type = epsiodeServers[i].type;
                if (type == "vidstream" || type == "mycloud" || type == "filemoon") {
                    promises.push(addSource(epsiodeServers[i].id, this, epsiodeServers[i].type, epsiodeServers[i].type));
                }
            }
            let settledSupported = "allSettled" in Promise;
            let epList = [];
            if (settledSupported) {
                promises.unshift(this.getAnimeInfo(`?watch=/${searchParams.get("watch")}`, true));
                const promiseResult = await Promise.allSettled(promises);
                if (promiseResult[0].status === "fulfilled") {
                    epList = promiseResult[0].value.episodes;
                }
            }
            else {
                try {
                    await Promise.all(promises);
                    epList = (await this.getAnimeInfo(`?watch=/${searchParams.get("watch")}`, true)).episodes;
                }
                catch (err) {
                    console.error(err);
                }
            }
            let check = false;
            for (var i = 0; i < epList.length; i++) {
                if (check === true) {
                    response.next = epList[i].link;
                    break;
                }
                if (epList[i].id == sourceEp) {
                    check = true;
                    response.title = epList[i].title ? epList[i].title.trim() : "";
                }
                if (check === false) {
                    response.prev = epList[i].link;
                }
            }
            if (!sources.length) {
                throw new Error("No sources were found. Try again later or contact the developer.");
            }
            response.sources = sources;
            return response;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(infoDOM);
            removeDOM(serverDOM);
        }
    },
    checkConfig: function () {
        if (!localStorage.getItem("9anime")) {
            throw new Error("9anime URL not set");
        }
        if (!localStorage.getItem("apikey")) {
            throw new Error("API keynot set");
        }
    },
    getVRF: async function (query, action) {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        }
        catch (err) {
            console.warn("Defaulting to Consumet.");
        }
        let reqURL = `https://${nineAnimeURL}/${action}?query=${encodeURIComponent(query)}&apikey=${apiKey}`;
        if (fallbackAPI) {
            reqURL = `https://${nineAnimeURL}?query=${encodeURIComponent(query)}&action=${action}`;
        }
        const source = await MakeFetch(reqURL);
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.url) {
                return [encodeURIComponent(parsedJSON.url), parsedJSON.vrfQuery];
            }
            else {
                throw new Error(`${action}-VRF1: Received an empty URL or the URL was not found.`);
            }
        }
        catch (err) {
            throw new Error(`${action}-VRF1: Could not parse the JSON correctly.`);
        }
    },
    decryptSource: async function (query) {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        }
        catch (err) {
            console.warn("Defaulting to Consumet.");
        }
        let reqURL = `https://${nineAnimeURL}/fmovies-decrypt?query=${encodeURIComponent(query)}&apikey=${apiKey}`;
        if (fallbackAPI) {
            reqURL = `https://${nineAnimeURL}?query=${encodeURIComponent(query)}&action=fmovies-decrypt`;
        }
        const source = await MakeFetch(reqURL);
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.url) {
                return parsedJSON.url;
            }
            else {
                throw new Error("DECRYPT1: Received an empty URL or the URL was not found.");
            }
        }
        catch (err) {
            throw new Error("DECRYPT0: Could not parse the JSON correctly.");
        }
    },
    getVidstreamLink: async function (query, isViz = true) {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        }
        catch (err) {
            console.warn("Defaulting to Consumet.");
        }
        let reqURL = `https://${nineAnimeURL}/${isViz ? "vizcloud" : "mcloud"}?query=${encodeURIComponent(query)}&apikey=${apiKey}`;
        if (fallbackAPI) {
            reqURL = `https://${nineAnimeURL}?query=${encodeURIComponent(query)}&action=${isViz ? "vizcloud" : "mcloud"}`;
        }
        const source = await MakeFetch(reqURL);
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.data &&
                parsedJSON.data.media &&
                parsedJSON.data.media.sources &&
                parsedJSON.data.media.sources[0] &&
                parsedJSON.data.media.sources[0].file) {
                return parsedJSON.data.media.sources[0].file;
            }
            else {
                throw new Error("VIZCLOUD1: Received an empty URL or the URL was not found.");
            }
        }
        catch (err) {
            throw new Error("VIZCLOUD0: Could not parse the JSON correctly.");
        }
    },
    getFilemoonLink: async function (filemoonHTML) {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        }
        catch (err) {
            console.warn("Defaulting to Consumet.");
        }
        let reqURL = `https://${nineAnimeURL}/filemoon?apikey=${apiKey}`;
        if (fallbackAPI) {
            throw new Error("Not supported");
        }
        const source = await MakeFetch(reqURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                "query": filemoonHTML
            })
        });
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.url) {
                return parsedJSON.url;
            }
            else {
                throw new Error("FILEMOON1: Received an empty URL or the URL was not found.");
            }
        }
        catch (err) {
            throw new Error("FILEMOON0: Could not parse the JSON correctly.");
        }
    },
    fixTitle: function (title) {
        try {
            const tempTitle = title.split("-");
            if (tempTitle.length > 1) {
                tempTitle.pop();
                title = tempTitle.join("-").toLowerCase().replace("series/", "").replace("movie/", "");
                return title;
            }
            else {
                return title;
            }
        }
        catch (err) {
            return title;
        }
    },
    discover: async function () {
        let temp = document.createElement("div");
        try {
            temp.innerHTML = DOMPurify.sanitize(await MakeFetchZoro(`https://9anime.to/home`, {}));
            temp = temp.querySelector(".ani.items");
            let data = [];
            for (const elem of temp.querySelectorAll(".item")) {
                let image = elem.querySelector("img").getAttribute("src");
                let name = elem.querySelector(".name.d-title").innerText.trim();
                let link = elem.querySelector(".name.d-title").getAttribute("href");
                const splitLink = link.split("/");
                splitLink.pop();
                link = splitLink.join("/").replace("/watch", "");
                data.push({
                    image,
                    name,
                    link
                });
            }
            return data;
        }
        catch (err) {
            console.error(err);
        }
        finally {
            removeDOM(temp);
        }
    },
    config: {
        "referer": "https://fmovies.to",
    },
    getConfig(url) {
        if (url.includes("mcloud.to")) {
            return {
                "referer": "https://mcloud.to/"
            };
        }
        else {
            return this.config;
        }
    }
};

var gogo = {
    baseURL: "https://gogoanime.gr",
    ajaxURL: "https://ajax.gogo-load.com/ajax",
    keys: [
        CryptoJS.enc.Utf8.parse("37911490979715163134003223491201"),
        CryptoJS.enc.Utf8.parse("54674138327930866480207815084989"),
        CryptoJS.enc.Utf8.parse("3134003223491201")
    ],
    searchApi: async function (query) {
        let dom = document.createElement("div");
        try {
            let searchHTML = await MakeFetchZoro(`${this.baseURL}/search.html?keyword=${encodeURIComponent(query)}`, {});
            dom.innerHTML = DOMPurify.sanitize(searchHTML);
            let itemsDOM = dom.querySelectorAll("ul.items li");
            let data = [];
            for (var i = 0; i < itemsDOM.length; i++) {
                let con = itemsDOM[i];
                let src = con.querySelector("img").getAttribute("src");
                let aTag = con.querySelector("a");
                let animeName = aTag.getAttribute("title");
                let animeHref = aTag.getAttribute("href") + "&engine=7";
                data.push({ "name": animeName, "image": src, "link": animeHref });
            }
            return ({ data, "status": 200 });
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(dom);
        }
    },
    getAnimeInfo: async function (url, idToFind = null) {
        url = url.split("&engine")[0];
        const rawURL = `${this.baseURL}/${url}`;
        const animeDOM = document.createElement("div");
        const episodeDOM = document.createElement("div");
        try {
            const response = {
                "name": "",
                "image": "",
                "description": "",
                "episodes": [],
                "mainName": ""
            };
            const animeHTML = await MakeFetchZoro(`${this.baseURL}/${url}`, {});
            const id = url.replace("category/", "gogo-");
            animeDOM.innerHTML = DOMPurify.sanitize(animeHTML);
            response.mainName = id;
            response.image = animeDOM.querySelector(".anime_info_body_bg img").getAttribute("src");
            response.name = animeDOM.querySelector(".anime_info_body_bg h1").innerText.trim();
            response.description = animeDOM.querySelectorAll(".anime_info_body_bg p.type")[1].innerText.trim();
            const episodeCon = animeDOM.querySelector("#episode_page").children;
            const epStart = episodeCon[0].querySelector("a").getAttribute("ep_start");
            const epEnd = episodeCon[episodeCon.length - 1].querySelector("a").getAttribute("ep_end");
            const movieID = animeDOM.querySelector("#movie_id").getAttribute("value");
            const alias = animeDOM.querySelector("#alias_anime").getAttribute("value");
            const epData = [];
            const episodeHTML = await MakeFetchZoro(`${this.ajaxURL}/load-list-episode?ep_start=${epStart}&ep_end=${epEnd}&id=${movieID}&default_ep=${0}&alias=${alias}`);
            episodeDOM.innerHTML = DOMPurify.sanitize(episodeHTML);
            const episodesLI = episodeDOM.querySelectorAll("#episode_related li");
            for (let i = 0; i < episodesLI.length; i++) {
                const el = episodesLI[i];
                let epNum = parseFloat(el.querySelector(`div.name`).innerText.replace('EP ', ''));
                if (epNum == 0) {
                    epNum = 0.1;
                }
                epData.unshift({
                    title: `Episode ${epNum}`,
                    link: `?watch=${id}&ep=${epNum}&engine=7`
                });
            }
            response.episodes = epData;
            return response;
        }
        catch (err) {
            err.url = rawURL;
            throw err;
        }
        finally {
            removeDOM(animeDOM);
            removeDOM(episodeDOM);
        }
    },
    getLinkFromUrl: async function (url) {
        var _a;
        const watchDOM = document.createElement("div");
        const embedDOM = document.createElement("div");
        try {
            const params = new URLSearchParams("?watch=" + url);
            const sourceURLs = [];
            watchDOM.style.display = "none";
            embedDOM.style.display = "none";
            const resp = {
                sources: sourceURLs,
                name: "",
                nameWSeason: "",
                episode: "",
                status: 400,
                message: "",
                next: null,
                prev: null,
            };
            const watchHTML = await MakeFetchZoro(`${this.baseURL}/${params.get("watch").replace("gogo-", "")}-episode-${params.get("ep")}`);
            watchDOM.innerHTML = DOMPurify.sanitize(watchHTML, { ADD_TAGS: ["iframe"] });
            try {
                const prevTemp = watchDOM.querySelector(".anime_video_body_episodes_l a").getAttribute("href");
                let ep = parseFloat(prevTemp.split("-episode-")[1]);
                if (ep == 0) {
                    ep = 0.1;
                }
                resp.prev = `${params.get("watch")}&ep=${ep}&engine=7`;
            }
            catch (err) {
                console.error(err);
            }
            try {
                const nextTemp = watchDOM.querySelector(".anime_video_body_episodes_r a").getAttribute("href");
                let ep = parseFloat(nextTemp.split("-episode-")[1]);
                if (ep == 0) {
                    ep = 0.1;
                }
                resp.next = `${params.get("watch")}&ep=${ep}&engine=7`;
            }
            catch (err) {
                console.error(err);
            }
            let videoURLTemp = watchDOM.querySelector("#load_anime iframe").getAttribute("src");
            if (videoURLTemp.substring(0, 2) === "//") {
                videoURLTemp = "https:" + videoURLTemp;
            }
            const embedHTML = await MakeFetchZoro(videoURLTemp);
            const videoURL = new URL(videoURLTemp);
            embedDOM.innerHTML = DOMPurify.sanitize(embedHTML);
            const encyptedParams = this.generateEncryptedAjaxParams(embedHTML.split("data-value")[1].split("\"")[1], (_a = videoURL.searchParams.get('id')) !== null && _a !== void 0 ? _a : '', this.keys);
            const encryptedData = JSON.parse(await MakeFetch(`${videoURL.protocol}//${videoURL.hostname}/encrypt-ajax.php?${encyptedParams}`, {
                "headers": {
                    "X-Requested-With": "XMLHttpRequest"
                }
            }));
            const decryptedData = await this.decryptAjaxData(encryptedData.data, this.keys);
            if (!decryptedData.source)
                throw new Error('No source found.');
            for (const source of decryptedData.source) {
                sourceURLs.push({
                    url: source.file,
                    type: "hls",
                    name: "HLS"
                });
            }
            resp.name = params.get("watch");
            resp.nameWSeason = params.get("watch");
            resp.episode = params.get("ep");
            return resp;
        }
        catch (err) {
            throw err;
        }
        finally {
            removeDOM(watchDOM);
            removeDOM(embedDOM);
        }
    },
    fixTitle(title) {
        try {
            title = title.replace("gogo-", "");
        }
        catch (err) {
            console.error(err);
        }
        finally {
            return title;
        }
    },
    generateEncryptedAjaxParams: function (scriptValue, id, keys) {
        const encryptedKey = CryptoJS.AES.encrypt(id, keys[0], {
            iv: keys[2],
        });
        const decryptedToken = CryptoJS.AES.decrypt(scriptValue, keys[0], {
            iv: keys[2],
        }).toString(CryptoJS.enc.Utf8);
        return `id=${encryptedKey}&alias=${id}&${decryptedToken}`;
    },
    decryptAjaxData: function (encryptedData, keys) {
        const decryptedData = CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(encryptedData, keys[1], {
            iv: keys[2],
        }));
        return JSON.parse(decryptedData);
    },
    getMetaData: async function (search) {
        const id = search.get("watch").replace("/category/", "");
        return await getAnilistInfo("Gogoanime", id);
    },
    rawURLtoInfo: function (url) {
        // https://gogoanime.bid/category/kimetsu-no-yaiba-movie-mugen-ressha-hen-dub
        return `?watch=${url.pathname}&engine=7`;
    }
};
try {
    (async function () {
        const keys = JSON.parse(await MakeFetchZoro(`https://raw.githubusercontent.com/enimax-anime/gogo/main/index.json`));
        for (let i = 0; i <= 2; i++) {
            keys[i] = CryptoJS.enc.Utf8.parse(keys[i]);
        }
        gogo.baseURL = keys[3];
        gogo.ajaxURL = keys[4];
        gogo.keys = keys;
    })();
}
catch (err) {
    console.error(err);
}

// @ts-ignore
const extensionList = [wco, animixplay, fmovies, zoro, twitch, nineAnime, fmoviesto, gogo];
// @ts-ignore
const extensionNames = ["WCOforever", "Animixplay", "FlixHQ", "Zoro", "Twitch", "9anime", "Fmovies.to", "Gogoanime"];
// @ts-ignore
const extensionDisabled = [false, true, false, false, false, false, false];
async function anilistAPI(id) {
    const query = `
        query ($id: Int) {
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
        }`;
    const variables = {
        id
    };
    const url = 'https://graphql.anilist.co', options = {
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
    return JSON.parse(await MakeFetch(url, options)).data.Media;
}
async function getAnilistInfo(type, id) {
    const anilistID = JSON.parse(await MakeFetch(`https://raw.githubusercontent.com/MALSync/MAL-Sync-Backup/master/data/pages/${type}/${id}.json`)).aniId;
    return await anilistAPI(anilistID);
}
