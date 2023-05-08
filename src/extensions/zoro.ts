var zoro: extension = {
    baseURL: "https://zoro.to",
    searchApi: async function (query: string): Promise<extensionSearch> {
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
        } catch (err) {
            throw err;
        } finally {
            removeDOM(dom);
        }
    },
    getAnimeInfo: async function (url, idToFind = null): Promise<extensionInfo> {
        url = url.split("&engine")[0];

        const rawURL = `https://zoro.to/${url}`;
        const animeDOM = document.createElement("div");
        const dom = document.createElement("div");

        try {
            let idSplit = url.replace("?watch=/", "").split("-");
            let id = idSplit[idSplit.length - 1].split("?")[0];

            let response: extensionInfo = {
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
            } catch (err) {

            }


            animeDOM.innerHTML = DOMPurify.sanitize(animeHTML);

            let name = url;
            let nameSplit = name.replace("?watch=", "").split("&ep=")[0].split("-");
            nameSplit.pop();
            name = nameSplit.join("-");


            response.mainName = name;
            response.name = (animeDOM.querySelector(".film-name.dynamic-name") as HTMLElement).innerText;
            response.image = (animeDOM.querySelector(".layout-page.layout-page-detail") as HTMLElement).querySelector("img").src;
            response.description = (animeDOM.querySelector(".film-description.m-hide") as HTMLElement).innerText;

            try {
                response.genres = [];
                const metaCon = animeDOM.querySelector(".item.item-list");
                for (const genreAnchor of metaCon.querySelectorAll("a")) {
                    response.genres.push(genreAnchor.innerText);
                }
            } catch (err) {
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
                        } catch (err) {

                        }

                        if (responses[1].status === "fulfilled") {
                            episodeHTML = responses[1].value;
                            check = true;
                        }
                    } else {

                        let metaData = await MakeFetchTimeout(`https://api.enime.moe/mapping/mal/${malID}`, {}, 2000);
                        thumbnailsTemp = JSON.parse(metaData).episodes;
                    }

                    for (let i = 0; i < thumbnailsTemp.length; i++) {
                        thumbnails[thumbnailsTemp[i].number] = thumbnailsTemp[i];
                    }
                } catch (err) {
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
                let tempEp: extensionInfoEpisode = {
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
                    } catch (err) {
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
                } catch (err) {

                }

                data.push(tempEp);

            }

            response.episodes = data;
            return response;
        } catch (err) {
            err.url = rawURL;
            throw err;
        } finally {
            removeDOM(animeDOM);
            removeDOM(dom);
        }
    },
    getEpisodeListFromAnimeId: async function getEpisodeListFromAnimeId(showID: string, episodeId: string) {

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
        } catch (err) {
            throw err;
        } finally {
            removeDOM(dom);
        }
    },
    addSource: async function addSource(type: string, id: string, subtitlesArray: Array<videoSubtitle>, sourceURLs: Array<videoSource>) {
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
            } catch (err) {

            }
            try {
                if (sourceJSON.encrypted && typeof sourceJSON.sources == "string") {
                    let encryptedURL = sourceJSON.sources;
                    let decryptKey, tempFile;
                    try {
                        decryptKey = await extractKey(6, null, true);
                        sourceJSON.sources = JSON.parse(CryptoJS.AES.decrypt(encryptedURL, decryptKey).toString(CryptoJS.enc.Utf8));
                    } catch (err) {
                        if (err.message == "Malformed UTF-8 data") {
                            decryptKey = await extractKey(6);
                            try {
                                sourceJSON.sources = JSON.parse(CryptoJS.AES.decrypt(encryptedURL, decryptKey).toString(CryptoJS.enc.Utf8));
                            } catch (err) {

                            }
                        }
                    }
                }
                let tempSrc: videoSource = { "url": sourceJSON.sources[0].file, "name": "HLS#" + type, "type": "hls" };
                if ("intro" in sourceJSON && "start" in sourceJSON.intro && "end" in sourceJSON.intro) {
                    tempSrc.skipIntro = sourceJSON.intro;
                }
                sourceURLs.push(tempSrc);
            } catch (err) {
                console.error(err);
            }
        } catch (err) {
            console.error(err);
        }

        if (shouldThrow) {
            throw new Error("Token not found");
        }
    },
    getVideoTitle: async function (url: string): Promise<string> {
        let showURL = new URLSearchParams(url);

        try {
            return (await this.getAnimeInfo(showURL.get("watch"), showURL.get("ep"))).name;
        } catch (err) {
            return "";
        }
    },
    getLinkFromUrl: async function (url: string): Promise<extensionVidSource> {
        const sourceURLs: Array<videoSource> = [];
        let subtitles: Array<videoSubtitle> = [];

        const resp: extensionVidSource = {
            sources: sourceURLs,
            name: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null,
        };

        let episodeId: string, animeId;

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
            } catch (err) {
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
        } catch (err) {
            throw err;
        } finally {
            removeDOM(dom);
        }

    },
    discover: async function (): Promise<Array<extensionDiscoverData>> {
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
        } catch (err) {
            throw err;
        } finally {
            removeDOM(temp);
        }
    },
    genToken: async function genToken() {

        await getWebviewHTML("https://rapid-cloud.co/", false, 15000, `let resultInApp={'status':200,'data':localStorage.setItem("v1.1_getSourcesCount", "40")};webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(resultInApp));`) as any;

        await new Promise(r => setTimeout(r, 500));

        try {
            alert("Close the inAppBrowser when the video has started playing.")
            await getWebviewHTML("https://zoro.to/watch/eighty-six-2nd-season-17760?ep=84960", false, 120000, '');
        } catch (err) {

        }

        await new Promise(r => setTimeout(r, 500));

        try {
            const token = await getWebviewHTML("https://rapid-cloud.co/", false, 15000, `let resultInApp={'status':200,'data':localStorage.getItem("v1.1_token")};webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(resultInApp));`) as any;

            localStorage.setItem("rapidToken", token.data.data);

            alert("Token extracted. You can now refresh the page.")
        } catch (err) {
            alert("Could not extract the token. Try again or Contact the developer.");
        }

    },
    getMetaData: async function (search: URLSearchParams) {
        const id = search.get("watch").split("-").pop()
        return await getAnilistInfo("Zoro", id);
    },
    rawURLtoInfo: function (url: URL) {
        // https://zoro.to/kimetsu-no-yaiba-movie-mugen-ressha-hen-15763
        return `?watch=${url.pathname}&engine=3`;
    }
};