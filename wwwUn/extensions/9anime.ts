var nineAnime : extension = {
    'baseURL' : "https://9anime.to",
    'searchApi': async function (query) {
        try{
            let vrf = await this.getVRF(query);
            let searchHTML = await MakeFetchZoro(`https://9anime.to/filter?keyword=${encodeURIComponent(query)}&vrf=${vrf}`);
            let searchDOM = document.createElement("div");
            searchDOM.innerHTML = DOMPurify.sanitize(searchHTML);
            const searchElem = searchDOM.querySelector("#list-items");
            const searchItems = searchElem.querySelectorAll(".item");
            const response : Array<extensionSearchData>= [];
            for(let i = 0; i < searchItems.length; i++){
                let currentElem = searchItems[i];
                response.push({
                    "name": currentElem.querySelector(".name").innerText, 
                    "id": currentElem.querySelector(".name").getAttribute("href").replace("/watch/", ""), 
                    "image": currentElem.querySelector("img").src, 
                    "link": "/" + currentElem.querySelector(".name").getAttribute("href").replace("/watch/", "") + "&engine=5"
                } as extensionSearchData);
            }

            searchDOM.remove();

            return { "data" : response, "status": 200 };
        }catch(err){
            return { "data" : "Error", "status": 400 };
        }

    },
    'getAnimeInfo': async function (url : string): Promise<extensionInfo> {
        try{
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
            response.name = infoMainDOM.querySelector(".title").innerText;
            response.description = infoMainDOM.querySelector(".content").innerText;
            response.image = infoDOM.querySelector("#w-info").querySelector("img").getAttribute("src");

            let episodes = [];

            let IDVRF = await this.getVRF(nineAnimeID);
            let episodesHTML = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/episode/list/${nineAnimeID}?vrf=${IDVRF}`)).result;

            let episodesDOM = document.createElement("div");
            episodesDOM.innerHTML = DOMPurify.sanitize(episodesHTML);
            
            let epsiodeElem = episodesDOM.querySelectorAll("li");
            for(let i = 0; i < epsiodeElem.length; i++){
                let curElem = epsiodeElem[i];
                let title = "";
                try{
                    title = curElem.querySelector("span").innerText;
                }catch(err){

                }
                episodes.push( {
                    "link": "?watch=" + encodeURIComponent(id) + "&ep=" + curElem.querySelector("a").getAttribute("data-ids") + "&engine=5",
                    "id": curElem.querySelector("a").getAttribute("data-ids"),
                    "title": `Epsiode ${curElem.querySelector("a").getAttribute("data-num")} - ${title}`,
                });
            }

            response.episodes = episodes;
            episodesDOM.remove();
            infoDOM.remove();
            return response;
        }catch(err){
            console.error(err);
            throw new Error("An unexpected error has occurred");
        }

    },

    "getLinkFromUrl" : async function (url : string){
        url = "watch=" + url;
        const response: extensionVidSource = {
            sources: [],
            name: "",
            title: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next : null,
            prev : null
        };

        let searchParams = new URLSearchParams(url);
        let sourceEp = searchParams.get("ep");
        let sourceEpVRF = await this.getVRF(sourceEp);

        let serverHTML = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/server/list/${sourceEp}?vrf=${sourceEpVRF}`)).result;
        let serverDOM = document.createElement("div");
        serverDOM.innerHTML = DOMPurify.sanitize(serverHTML);

        let allServers = serverDOM.querySelectorAll("li");
        try{
            response.episode = serverDOM.querySelector("b").innerText.split("Episode")[1];
        }catch(err){
            response.episode = serverDOM.querySelector("b").innerText;
        }

        response.name = searchParams.get("watch");
        response.nameWSeason = searchParams.get("watch");
        response.status = 200;
        let sources = [];
        let vidstreamIDs = [];
        for(let i = 0; i < allServers.length; i++){
            let currentServer = allServers[i];
            if(currentServer.innerText.toLowerCase() == "vidstream"){
                vidstreamIDs.push(currentServer.getAttribute("data-link-id"));
            }
        }

        async function addSource(ID, self, index){
            try{
                let serverVRF = await self.getVRF(ID);
                let serverData = JSON.parse(await MakeFetchZoro(`https://9anime.to/ajax/server/${ID}?vrf=${serverVRF}`)).result.url;

                let sourceDecrypted = await self.decryptSource(serverData);
                let vidstreamID = sourceDecrypted.split("/").pop();
                let m3u8File = await self.getVidstreamLink(vidstreamID);
                sources.push({
                    "name" : "HLS#" + index,
                    "type" : "hls",
                    "url" : m3u8File
                });
            }catch(err){

            }
        }

        let promises = [];
        for(let i = 0; i < vidstreamIDs.length; i++){
            promises.push(addSource(vidstreamIDs[i],this, i));
        }
        await Promise.all(promises);

        response.sources = sources;

        serverDOM.remove();
        return response;
    },
    "getVRF" : async function (query){
        const vrf = await MakeFetch(`https://${localStorage.getItem("9anime").trim()}/vrf?query=${query}&apikey=${localStorage.getItem("apikey").trim()}`);
        return encodeURIComponent(JSON.parse(vrf).url);
    },
    "decryptSource" : async function (query){
        const source = await MakeFetch(`https://${localStorage.getItem("9anime").trim()}/decrypt?query=${query}&apikey=${localStorage.getItem("apikey").trim()}`);
        return JSON.parse(source).url;
    },
    "getVidstreamLink" : async function (query){
        const source = await MakeFetch(`https://${localStorage.getItem("9anime").trim()}/vizcloud?query=${query}&apikey=${localStorage.getItem("apikey").trim()}`);
        return JSON.parse(source).data.media.sources[0].file;
    } 
}