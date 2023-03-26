var fmoviesto: extension = {
    baseURL: "https://fmovies.to",
    searchApi: async function (query) {
        query = query.replace(" ", "+");

        const vrf = await this.getVRF(query, "fmovies-vrf");
        const searchHTML = await MakeFetchZoro(`https://fmovies.to/search?keyword=${encodeURIComponent(query)}&vrf=${vrf[0]}`);
        const searchDOM = document.createElement("div");
        searchDOM.innerHTML = DOMPurify.sanitize(searchHTML);
        const searchElem = searchDOM.querySelector(".filmlist");
        const searchItems = searchElem.querySelectorAll(".item");
        const response: Array<extensionSearchData> = [];

        if (searchItems.length === 0) {
            throw new Error("No results found.");
        }

        for (let i = 0; i < searchItems.length; i++) {
            const currentElem = searchItems[i];
            response.push({
                "id": (currentElem.querySelector(".title") as HTMLElement).getAttribute('href').slice(1),
                "name": (currentElem.querySelector(".title") as HTMLElement).innerText,
                "image": currentElem.querySelector("img").src,
                "link": "/" + currentElem.querySelector(".title").getAttribute("href").slice(1).replace("/watch/", "") + "&engine=6"
            } as extensionSearchData);
        }

        searchDOM.remove();
        return { "data": response, "status": 200 } as extensionSearch;
    },
    getAnimeInfo: async function (url: string, nextPrev: Boolean = false): Promise<extensionInfo> {
        url = url.split("&engine")[0];
        const response: extensionInfo = {
            "name": "",
            "image": "",
            "description": "",
            "episodes": [],
            "mainName": ""
        };

        let id = url.replace("?watch=/", "");

        let infoHTML = await MakeFetchZoro(`https://fmovies.to/${id}`);
        let infoDOM = document.createElement("div");
        infoDOM.innerHTML = DOMPurify.sanitize(infoHTML, {
            "ADD_ATTR": ["itemprop"]
        });


        const container = infoDOM.querySelector(".watch-extra");
        response.mainName = id.replace("series/", "").replace("movie/", "");
        response.name = (container.querySelector(`h1`) as HTMLElement).innerText;
        response.image = container.querySelector(`img`).getAttribute("src");
        response.description = (container.querySelector("div[itemprop=\"description\"]") as HTMLElement).innerText.trim();

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
        } catch (err) {
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
            } else {
                throw new Error("Couldn't find the result");
            }
        } catch (err) {
            throw new Error(`Error 9ANIME_INFO_JSON: The JSON could be be parsed. ${err.message}`);
        }


        let episodesDOM = document.createElement("div");
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
            let episodeNum: number;
            let season: number;

            try {
                if (isMovie) {
                    title = (curElem as HTMLElement).innerText;
                } else {
                    title = curElem.querySelector('a').getAttribute('title');
                }
            } catch (err) {
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
                } else {
                    response.pageInfo[response.pageInfo.length - 1].pageSize++;
                }

                lastSeason = season;
            } else {
                response.pageInfo[response.pageInfo.length - 1].pageSize++;
            }

            episodes.push({
                "link": (nextPrev ? "" : "?watch=") + encodeURIComponent(id) + "&ep=" + curElem.querySelector("a").getAttribute("data-kname") + "&engine=6",
                "id": curElem.querySelector("a").getAttribute("data-kname"),
                "title": (nextPrev || isMovie) ? title : `Season ${season} | Episode ${episodeNum} - ${title}`
            });
        }

        response.episodes = episodes;
        episodesDOM.remove();
        infoDOM.remove();

        console.log(response);
        return response;
    },
    getLinkFromUrl: async function (url: string) {
        url = "watch=" + url;
        const response: extensionVidSource = {
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


        const searchParams = new URLSearchParams(url);
        const sourceEp = searchParams.get("ep");

        const isMovie = searchParams.get("watch").split('/')[0] !== "series";

        const promises: Array<Promise<any>> = [];

        const infoHTML = await MakeFetchZoro(`https://fmovies.to/${searchParams.get("watch")}`);
        const infoDOM = document.createElement("div");
        infoDOM.innerHTML = DOMPurify.sanitize(infoHTML);


        const uid = infoDOM.querySelector("#watch").getAttribute('data-id');
        const epsiodeServers = [];


        const serverVRF = await this.getVRF(uid, "fmovies-vrf");

        const serverHTML = JSON.parse(await MakeFetchZoro(`https://fmovies.to/ajax/film/servers?id=${uid}&vrf=${serverVRF[0]}`)).html;
        const serverDOM = document.createElement("div");
        serverDOM.innerHTML = DOMPurify.sanitize(serverHTML, {
            "ADD_ATTR": ["data-kname", "data-id"]
        });

        const servers: { [key: string]: string } = {};

        const serverDIVs = serverDOM.querySelectorAll(".server");

        for (let i = 0; i < serverDIVs.length; i++) {
            const curServer = serverDIVs[i];
            const serverId = curServer.getAttribute("data-id");

            let serverName = (curServer as HTMLElement).innerText.toLowerCase().split('server')[1].trim();
            servers[serverId] = serverName;

        }

        const currentEpisode = serverDOM.querySelector(`a[data-kname="${sourceEp}"]`);
        try {
            const serverString: { [key: string]: string } = JSON.parse(currentEpisode.getAttribute("data-ep"));
            for (const serverId in serverString) {
                console.log(servers, serverId);
                epsiodeServers.push({
                    type: servers[serverId],
                    id: serverString[serverId],
                });
            }
        } catch (err) {
            console.log(err);
            throw new Error('Episode not found');
        }


        try {
            const epTemp = sourceEp.split('-');
            let ep = epTemp[epTemp.length - 1];
            if (!isMovie) {
                response.episode = ep;
            } else {
                if (ep == "full") {
                    response.episode = "1";
                } else {
                    response.episode = Math.max(1, ep.charCodeAt(0) - "a".charCodeAt(0) + 1).toString();
                }

                if (isNaN(parseInt(response.episode))) {
                    response.episode = "1";
                }
            }
        } catch (err) {
            response.episode = "1";
        }

        response.name = searchParams.get("watch").replace("series/", "").replace("movie/", "");
        response.nameWSeason = response.name;
        response.status = 200;

        let sources: Array<videoSource> = [];

        async function addSource(ID: string, self: extension, index: string, extractor: string) {
            try {
                const serverVRF = await self.getVRF(ID, "fmovies-vrf");
                const serverData = JSON.parse(await MakeFetchZoro(`https://fmovies.to/ajax/episode/info?id=${ID}&vrf=${serverVRF[0]}`));
                const serverURL = serverData.url;
                const sourceDecrypted = await self.decryptSource(serverURL);


                if (!response.subtitles) {
                    try {

                        // Blame Fmovies, not me
                        const subURL = new URLSearchParams(
                            (new URLSearchParams(
                                (new URL(sourceDecrypted)).search)
                            ).get("h")
                        ).values().next().value;

                        response.subtitles = JSON.parse(await MakeFetchZoro(subURL));
                    } catch (err) {
                        console.warn(err);
                    }
                }

                let source: videoSource = {
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
                } else if (extractor == "filemoon") {
                    const filemoonHTML = await MakeFetch(sourceDecrypted);
                    const m3u8File = await self.getFilemoonLink(filemoonHTML);

                    source = {
                        "name": "Filemoon#" + index,
                        "type": m3u8File.includes(".m3u8") ? "hls" : "mp4",
                        "url": m3u8File,
                    };

                    sources.push(source);
                } else {
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
            } catch (err) {
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
        } else {
            try {
                await Promise.all(promises);
                epList = (await this.getAnimeInfo(`?watch=/${searchParams.get("watch")}`, true)).episodes;
            } catch (err) {
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
        infoDOM.remove();
        return response;
    },
    checkConfig: function () {
        if (!localStorage.getItem("9anime")) {
            throw new Error("9anime URL not set");
        }

        if (!localStorage.getItem("apikey")) {
            throw new Error("API keynot set");
        }
    },
    getVRF: async function (query: string, action: string): Promise<[string, string]> {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";

        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        } catch (err) {
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
            } else {
                throw new Error(`${action}-VRF1: Received an empty URL or the URL was not found.`);
            }
        } catch (err) {
            throw new Error(`${action}-VRF1: Could not parse the JSON correctly.`);
        }
    },
    decryptSource: async function (query: string): Promise<string> {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";

        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        } catch (err) {
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
            } else {
                throw new Error("DECRYPT1: Received an empty URL or the URL was not found.");
            }
        } catch (err) {
            throw new Error("DECRYPT0: Could not parse the JSON correctly.");
        }
    },
    getVidstreamLink: async function (query: string, isViz = true): Promise<string> {
        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";

        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        } catch (err) {
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
            } else {
                throw new Error("VIZCLOUD1: Received an empty URL or the URL was not found.");
            }
        } catch (err) {
            throw new Error("VIZCLOUD0: Could not parse the JSON correctly.");
        }
    },
    getFilemoonLink: async function (filemoonHTML: string) {

        let fallbackAPI = true;
        let nineAnimeURL = "api.consumet.org/anime/9anime/helper";
        let apiKey = "";
        try {
            this.checkConfig();
            nineAnimeURL = localStorage.getItem("9anime").trim();
            apiKey = localStorage.getItem("apikey").trim();
            fallbackAPI = false;
        } catch (err) {
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
            } else {
                throw new Error("FILEMOON1: Received an empty URL or the URL was not found.");
            }
        } catch (err) {
            throw new Error("FILEMOON0: Could not parse the JSON correctly.");
        }
    },
    fixTitle: function (title: string) {
        try {
            const tempTitle = title.split("-");

            if (tempTitle.length > 1) {
                tempTitle.pop();
                title = tempTitle.join("-").toLowerCase().replace("series/", "").replace("movie/", "");
                return title;
            } else {
                return title;
            }
        } catch (err) {
            return title;
        }
    },
    discover: async function (): Promise<Array<extensionDiscoverData>> {
        let temp = document.createElement("div");
        temp.innerHTML = DOMPurify.sanitize(await MakeFetchZoro(`https://9anime.to/home`, {}));
        temp = temp.querySelector(".ani.items");
        let data = [];
        for (const elem of temp.querySelectorAll(".item")) {
            let image = elem.querySelector("img").getAttribute("src");
            let name = (elem.querySelector(".name.d-title") as HTMLElement).innerText.trim();
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
        "referer": "https://fmovies.to",
    },
    getConfig(url: string) {
        if (url.includes("mcloud.to")) {
            return {
                "referer": "https://mcloud.to/"
            }
        } else {
            return this.config;
        }
    }
}