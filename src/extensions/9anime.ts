var nineAnime: extension = {
    baseURL: "https://9anime.to",
    searchApi: async function (query) {
        const vrf = await this.getVRF(query);
        const searchHTML = await MakeFetchZoro(`https://9anime.to/filter?keyword=${encodeURIComponent(query)}&vrf=${(vrf)}`);
        const searchDOM = document.createElement("div");
        searchDOM.innerHTML = DOMPurify.sanitize(searchHTML);
        const searchElem = searchDOM.querySelector("#list-items");
        const searchItems = searchElem.querySelectorAll(".item");
        const response: Array<extensionSearchData> = [];

        if (searchItems.length === 0) {
            throw new Error("No results found.");
        }

        for (let i = 0; i < searchItems.length; i++) {
            const currentElem = searchItems[i];
            response.push({
                "name": (currentElem.querySelector(".name") as HTMLElement).innerText,
                "id": currentElem.querySelector(".name").getAttribute("href").replace("/watch/", ""),
                "image": currentElem.querySelector("img").src,
                "link": "/" + currentElem.querySelector(".name").getAttribute("href").replace("/watch/", "") + "&engine=5"
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
        let infoHTML = await MakeFetchZoro(`https://9anime.to/watch/${id}`);
        let infoDOM = document.createElement("div");
        infoDOM.innerHTML = DOMPurify.sanitize(infoHTML);
        let nineAnimeID = infoDOM.querySelector("#watch-main").getAttribute("data-id");
        let infoMainDOM = infoDOM.querySelector("#w-info").querySelector(".info");
        response.mainName = id;
        response.name = (infoMainDOM.querySelector(".title") as HTMLElement).innerText;
        response.description = (infoMainDOM.querySelector(".content") as HTMLElement).innerText;
        response.image = infoDOM.querySelector("#w-info").querySelector("img").getAttribute("src");

        let episodes = [];

        let IDVRF = await this.getVRF(nineAnimeID);

        let episodesHTML = "";

        try {
            const tempResponse = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/episode/list/${nineAnimeID}?vrf=${(IDVRF)}`));

            if (tempResponse.result) {
                episodesHTML = tempResponse.result;
            } else {
                throw new Error("Couldn't find the result");
            }
        } catch (err) {
            throw new Error(`Error 9ANIME_INFO_JSON: The JSON could be be parsed. ${err.message}`);
        }


        let episodesDOM = document.createElement("div");
        episodesDOM.innerHTML = DOMPurify.sanitize(episodesHTML);

        let episodeElem = episodesDOM.querySelectorAll("li");
        for (let i = 0; i < episodeElem.length; i++) {
            let curElem = episodeElem[i];
            let title = "";
            try {
                title = curElem.querySelector("span").innerText;
            } catch (err) {
                console.warn("Could not find the title");
            }
            episodes.push({
                "link": (nextPrev ? "" : "?watch=") + encodeURIComponent(id) + "&ep=" + curElem.querySelector("a").getAttribute("data-ids") + "&engine=5",
                "id": curElem.querySelector("a").getAttribute("data-ids"),
                "title": nextPrev ? title : `Episode ${curElem.querySelector("a").getAttribute("data-num")} - ${title}`
            });
        }

        response.episodes = episodes;
        episodesDOM.remove();
        infoDOM.remove();
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
        const sourceEpVRF = await this.getVRF(sourceEp);
        const promises: Array<Promise<any>> = [];

        const serverHTML = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/server/list/${sourceEp}?vrf=${(sourceEpVRF)}`)).result;
        const serverDOM = document.createElement("div");
        serverDOM.innerHTML = DOMPurify.sanitize(serverHTML);

        const allServers = serverDOM.querySelectorAll("li");
        try {
            response.episode = serverDOM.querySelector("b").innerText.split("Episode")[1];
        } catch (err) {
            response.episode = serverDOM.querySelector("b").innerText;
        }

        response.name = searchParams.get("watch");
        response.nameWSeason = searchParams.get("watch");
        response.status = 200;
        let sources: Array<videoSource> = [];
        let vidstreamIDs = [];
        for (let i = 0; i < allServers.length; i++) {
            let currentServer = allServers[i];
            if (currentServer.innerText.toLowerCase() == "vidstream") {
                vidstreamIDs.push(currentServer.getAttribute("data-link-id"));
            }
        }

        async function addSource(ID, self, index) {
            try {
                const serverVRF = await self.getVRF(ID);
                const serverData = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/server/${ID}?vrf=${(serverVRF)}`)).result;
                const serverURL = serverData.url;
                const sourceDecrypted = await self.decryptSource(serverURL);
                const vidstreamID = sourceDecrypted.split("/").pop();
                const m3u8File = await self.getVidstreamLink(vidstreamID);

                const source: videoSource = {
                    "name": "HLS#" + index,
                    "type": "hls",
                    "url": m3u8File,
                };

                sources.push(source);

                if ("skip_data" in serverData) {
                    source.skipIntro = {
                        start: serverData.skip_data.intro_begin,
                        end: serverData.skip_data.intro_end
                    };
                }
            } catch (err) {
                console.warn(err);
            }
        }

        for (let i = 0; i < vidstreamIDs.length; i++) {
            promises.push(addSource(vidstreamIDs[i], this, i));
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
        serverDOM.remove();
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
    getVRF: async function (query: string): Promise<string> {
        this.checkConfig();
        const nineAnimeURL = localStorage.getItem("9anime").trim();
        const apiKey = localStorage.getItem("apikey").trim();
        const source = await MakeFetch(`https://${nineAnimeURL}/vrf?query=${encodeURIComponent(query)}&apikey=${apiKey}`);
        try {
            const parsedJSON = JSON.parse(source);
            if (parsedJSON.url) {
                return parsedJSON.url;
            } else {
                throw new Error("VRF1: Received an empty URL or the URL was not found.");
            }
        } catch (err) {
            throw new Error("VRF1: Could not parse the JSON correctly.");
        }
    },
    decryptSource: async function (query: string): Promise<string> {
        this.checkConfig();
        const nineAnimeURL = localStorage.getItem("9anime").trim();
        const apiKey = localStorage.getItem("apikey").trim();
        const source = await MakeFetch(`https://${nineAnimeURL}/decrypt?query=${encodeURIComponent(query)}&apikey=${apiKey}`);

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
    getVidstreamLink: async function (query: string): Promise<string> {
        this.checkConfig();
        const nineAnimeURL = localStorage.getItem("9anime").trim();
        const apiKey = localStorage.getItem("apikey").trim();
        const source = await MakeFetch(`https://${nineAnimeURL}/vizcloud?query=${encodeURIComponent(query)}&apikey=${apiKey}`);

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
    fixTitle: function (title: string) {
        try {
            const tempTitle = title.split(".");
            if (tempTitle.length > 1) {
                tempTitle.pop();
                title = tempTitle.join(".");
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


            try {
                link = (new URL(link)).pathname;
            } catch (err) {

            }

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
    }
}