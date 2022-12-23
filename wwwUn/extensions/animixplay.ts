var animixplay = {
    'searchApi': function (query) {
        return (new Promise(function (resolve, reject) {

            fetch("https://v1.ic5qwh28vwloyjo28qtg.workers.dev/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'q2': query,
                    'origin': 1,
                    'root': 'animixplay.to',
                    'd': 'gogoanime.gg'
                })
            }).then(response => response.json())
                .then(response => {
                    let temp = document.createElement("div");
                    temp.innerHTML = DOMPurify.sanitize(response.result);
                    let li = temp.querySelectorAll("li");
                    let data = [];

                    for (var i = 0; i < li.length; i++) {
                        data.push({
                            "image": li[i].getElementsByTagName("img")[0].getAttribute("src"),
                            "name": li[i].getElementsByTagName("a")[0].getAttribute("title"),
                            "link": li[i].getElementsByTagName("a")[0].getAttribute("href") + "&engine=1",
                        });

                    }

                    temp.remove();

                    resolve({
                        "status": 200,
                        "data": data
                    });

                }).catch(function (err) {
                    reject(err);
                });

        }));
    },


    'getAnimeInfo': function (url) {
        return (new Promise(function (resolve, reject) {
            url = url.split("&engine");
            if (url.length == 2) {
                url = url[0];
            }
            let ogURL = url;
            url = "https://animixplay.to/" + url;

            let settled = "allSettled" in Promise;


            fetch(url).then(response => response.text()).then(async function (response) {
                let temp = document.createElement("div");
                temp.innerHTML = DOMPurify.sanitize(response);
                let data = {};


                data.name = url.split("/")[url.split("/").length - 1].split("-").join(" ");
                data.image = "";
                data.description = "";
                let temp2 = document.createElement("div");
                let malId = null;
                try {
                    malId = parseInt(response.split("malid = '")[1]);
                    let response2 = await MakeFetch(`https://myanimelist.net/anime/${malId}`, {});
                    temp2.innerHTML = DOMPurify.sanitize(response2, { ALLOWED_ATTR: ['itemprop'] });

                    data.image = temp2.querySelector('[itemprop="image"]').src;


                    if (data.image == null || data.image == undefined || data.image.trim() == "") {
                        data.image = temp2.querySelector('[itemprop="image"]').getAttribute('data-image');
                        if (data.image == null || data.image == undefined || data.image.trim() == "") {
                            data.image = temp2.querySelector('[itemprop="image"]').getAttribute('data-src');

                        }

                    }

                    data.description = temp2.querySelector('[itemprop="description"]').innerText;
                } catch (err) {
                    console.error(err);
                } finally {
                    temp2.remove();
                }

                let thumbnails = {};
                if(malId !== null){
                    try{
                        let thumbnailsTemp = JSON.parse(await MakeFetchTimeout(`https://api.enime.moe/mapping/mal/${malId}`, {})).episodes;
                        for(let i = 0; i < thumbnailsTemp.length; i++){
                            thumbnails[thumbnailsTemp[i].number] = thumbnailsTemp[i];
                        }
                    }catch(err){
        
                    }
                }
                let animeEps = [];
                let animeDOM = JSON.parse(temp.querySelector("#epslistplace").innerHTML);
                let animeName;
                let count = 0;
                for (value in animeDOM) {
                    if (value == "eptotal" || typeof animeDOM[value] != "string") {
                        continue;
                    }


                    try {
                        let l = animeDOM[value].split("id=")[1].split("&")[0];
                        let epNum = parseFloat(value) + 1;
                        let tempEp = {
                            "link": "?watch=" + ogURL + "/ep" + value + "&engine=1",
                            "title": `Episode ${isNaN(epNum) ? 0.1 : epNum}`,
                        };

                        try{
                            let epIndex = parseFloat(value) + 1;
                            if(epIndex in thumbnails){
                                tempEp.thumbnail = thumbnails[epIndex].image;
                                tempEp.title = "Episode " + epIndex + " - " + thumbnails[epIndex].title;
                                tempEp.description = thumbnails[epIndex].description;
                            }
                        }catch(err){
            
                        }
                        
                        animeEps.push(tempEp);

                    } catch (err) {
                        console.error(err);
                    }

                    count++;
                }

                animeName = url.split("/")[url.split("/").length - 1] + "-";

                data.episodes = animeEps;
                data.mainName = animeName;
                temp.remove();
                resolve(data);
            }).catch(function (err) {
                console.error(err);

                reject(err);
            });

        }));
    },

    'getLinkFromUrl': function (url) {
        return (new Promise(async function (resolve, reject) {
            url = url.split("&engine");
            url = url[0];

            let nextUrl = "https://animixplay.to/" + url;
            let data = {};
            let response = await MakeFetch(nextUrl, {});
            let temp = document.createElement("div");
            temp.innerHTML = DOMPurify.sanitize(response);
            let animeDOM = JSON.parse(temp.querySelector("#epslistplace").innerHTML);
            temp.remove();
            let episode = parseFloat(url.split("ep")[1]);

            if ((episode - 1).toString() in animeDOM) {
                data.prev = (url.split("ep")[0] + "ep" + (episode - 1)) + "&engine=1";
            }

            if ((episode + 1).toString() in animeDOM) {
                data.next = (url.split("ep")[0] + "ep" + (episode + 1)) + "&engine=1";
            }


            if (episode == -1) {

                data.episode = 0.1;
            } else {
                data.episode = episode + 1;

            }

            if(isNaN(data.episode)){
                data.episode = 0.1;
            }

            data.nameWSeason = url.split("/")[1].split("-").join("-") + "-";
            data.name = (url.split("/")[1].split("-").join("-")) + "-";

            let l = animeDOM[isNaN(episode) ? url.substringAfter("ep") :  episode.toString()].split("id=")[1].split("&")[0];

            function padding(string, len) {
                let length = len - string.length;
                for (var i = 0; i < length; i++) {
                    string += "=";
                }

                return string;

            }
            function idToLink(id) {

                let start = padding(id, 8);
                start = start + "LTXs3GrU8we9O";
                start = btoa(start);
                let end = start.substring(0, 10) + String.fromCharCode(start.charCodeAt(10) - 1) + "\n";
                let endRes = start + btoa(end);
                return endRes;
            }

            let link = idToLink(l);

            data.sources = [];

            if (config.chrome) {
                let reqTimeout = setTimeout(function () {
                    chrome.webRequest.onHeadersReceived.removeListener(
                        callbackReq
                    );
                    reject("Timeout");
                }, 3000);
                function callbackReq(details) {
                    clearTimeout(reqTimeout);
                    let res = details.url;
                    res = atob(res.split("#")[1]);
                    data.sources.push({
                        "url": res,
                        "name": "HlS",
                        "type": "hls"
                    });


                    data.status = 200;
                    data.message = "done";
                    chrome.webRequest.onHeadersReceived.removeListener(
                        callbackReq
                    );
                    resolve(data);
                }



                chrome.webRequest.onHeadersReceived.addListener(
                    callbackReq,
                    { urls: ["https://plyr.link/*"] }
                );

                MakeFetch(`https://animixplay.to/api/live${link}`, {
                    method: 'GET'
                });


            } else {

                cordova.plugin.http.sendRequest(`https://animixplay.to/api/live${link}`, {
                    method: 'GET'
                }, function (response) {
                    let res = response.url;
                    res = atob(res.split("#")[1]);
                    data.sources.push({
                        "url": res,
                        "name": "HlS",
                        "type": "hls"
                    });


                    data.status = 200;
                    data.message = "done";
                    resolve(data);

                }, function (response) {
                    console.error(response);
                    reject("err 4583");
                });
            }

        }));


    },
    "discover": async function () {
        let temp = document.createElement("div");
        temp.innerHTML = DOMPurify.sanitize(await MakeFetch("https://animixplay.to/?tab=popular", {}));
        let data = [];
        for (elem of temp.querySelector("#resultplace").querySelectorAll("li")) {
            let image = elem.querySelector("img").getAttribute("src");
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
}
