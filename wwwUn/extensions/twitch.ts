
var twitch : extension = {
    'searchApi': function (query) {
        const clientId = "kimne78kx3ncx6brgo4mv6wki5h1ko";

        return (new Promise(function (resolve, reject) {
            fetch("https://gql.twitch.tv/gql", {
                "headers": {
                    'Client-id': clientId,
                    'Content-Type': 'application/json',
                },
                "method": "POST",
                "body": JSON.stringify(
                    { "operationName": "SearchResultsPage_SearchResults", "variables": { "query": query, "options": null }, "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "6ea6e6f66006485e41dbe3ebd69d5674c5b22896ce7b595d7fce6411a3790138" } } }
                )
            }).then((x) => x.json()).then((resData) => {

                const data = [];
                for (let channels of resData.data.searchFor.channels.edges) {
                    data.push({ "name": channels.item.login, "id": channels.item.login, "image": channels.item.profileImageURL, "link": "/" + encodeURIComponent(channels.item.login) + "&engine=4" });
                }
                resolve({ data, "status": 200 });
            }).catch((err) => { reject({ data: "error", "status": 400 }) });


        }));

    },


    'getAnimeInfo': function (url, sibling = false, currentID = -1) {
        url = url.split("&engine")[0];
        let id = url.replace("?watch=/", "");

        let response : extensionInfo = {};
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
                "body": JSON.stringify(
                    [
                        { "operationName": "StreamRefetchManager", "variables": { "channel": id }, "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "ecdcb724b0559d49689e6a32795e6a43bba4b2071b5e762a4d1edf2bb42a6789" } } },
                        { "operationName": "FilterableVideoTower_Videos", "variables": { "limit": 50, "channelOwnerLogin": id, "broadcastType": "ARCHIVE", "videoSort": "TIME" }, "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "a937f1d22e269e39a03b509f65a7490f9fc247d7f83d6ac1421523e3b68042cb" } } }
                    ]
                )
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
                        } else if (i != 0 && currentID == items[i - 1].node.id) {
                            which = 0;
                        } else if (i != (items.length - 1) && currentID == items[i + 1].node.id) {
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

                } else {
                    for (let vod of items) {
                        response.image = vod.node.owner.profileImageURL;
                        data.unshift({
                            "link": "?watch=" + encodeURIComponent(id) + "&id=" + vod.node.id + "&engine=4",
                            "id": id,
                            "title": vod.node.title,
                            "thumbnail" : vod.node.previewThumbnailURL
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
                    })
                }
                response.episodes = data;

                resolve(response);
            }).catch((error) => reject(error));

        });

    },

    'getLinkFromUrl': async function (url) : Promise<extensionVidSource> {
        url = "?watch=" + url;
        let start = performance.now();
        let params = new URLSearchParams(url);
        let name = params.get("watch");
        let ep = params.get("id");
        let isLive = (ep == "live");
        let title = "";

        const clientId = "kimne78kx3ncx6brgo4mv6wki5h1ko";

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
                    } else {
                        resolve(resData.data.streamPlaybackAccessToken);
                    }
                }).catch((error) => reject(error));

            });
        }

        function getPlaylist(id, accessToken, vod) {
            return `https://usher.ttvnw.net/${vod ? 'vod' : 'api/channel/hls'}/${id}.m3u8?client_id=${clientId}&token=${accessToken.value}&sig=${accessToken.signature}&allow_source=true&allow_audio_only=true`;
        }

        function getStream(channel, raw) {
            return new Promise((resolve, reject) => {
                getAccessToken(channel, false)
                    .then((accessToken) => getPlaylist(channel, accessToken, false))
                    .then((playlist) => resolve(playlist))
                    .catch(error => reject(error));
            });
        }

        function getVod(vid, raw) {
            return new Promise((resolve, reject) => {
                getAccessToken(vid, true)
                    .then((accessToken) => getPlaylist(vid, accessToken, true))
                    .then((playlist) => resolve(playlist))
                    .catch(error => reject(error));
            });
        }

        let resp : extensionVidSource = {};

        if (!isLive) {
            try {
                let epList = await this.getAnimeInfo(name, true, parseInt(ep));

                if (epList.episodes[0]) {
                    resp.prev = epList.episodes[0].link;
                }

                if (epList.episodes[2]) {
                    resp.next = epList.episodes[2].link;
                }

                try{
                    if(epList.episodes[1]){
                        title = epList.episodes[1].title;
                    }
                }catch(err){
                    title = "";
                }
            } catch (err) {

            }
        }else{
            title = "Live";
        }

        resp.sources = [
            {
                "url": isLive ? (await getStream(name, false)) : (await getVod(ep, false)),
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