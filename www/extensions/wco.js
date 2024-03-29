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
