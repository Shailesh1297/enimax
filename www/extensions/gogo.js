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
