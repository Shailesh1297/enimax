var wco : extension = {
    "baseURL" : "https://www.wcoforever.net",
    'searchApi': function (query : string) : Promise<extensionSearch> {

        let baseURL = this.baseURL;

        return (new Promise(function (resolve, reject) {
            let formData = new FormData();
            formData.append('catara', query);
            formData.append('konuara', 'series');

            fetch(`${baseURL}/search`, {
                method: 'POST', body: formData
            }).then(response => response.text()).then(function (x) {

                let tempDiv = document.createElement("div");
                tempDiv.innerHTML = DOMPurify.sanitize(x);


                var conDIV = tempDiv.querySelector(".items").children;

                let data : Array<extensionSearchData> = [];
                for (var i = 0; i < conDIV.length; i++) {
                    data.push({
                        "image": conDIV[i].getElementsByTagName("img")[0].getAttribute("src"),
                        "name": conDIV[i].getElementsByTagName("a")[1].innerText,
                        "link": conDIV[i].getElementsByTagName("a")[1].getAttribute("href").replace(baseURL, "") + "&engine=0",
                    });
                }

                tempDiv.remove();

                resolve({
                    "status": 200,
                    "data": data
                });

            }).catch(function (x) {
                reject(x);
            });
        }));

    },


    'getAnimeInfo': function (url : string) : Promise<extensionInfo> {
        
        let baseURL = this.baseURL;


        return (new Promise(function (resolve, reject) {
            url = url.split("&engine")[0];
            url = baseURL + "/" + url;
            fetch(url).then(response => response.text()).then(function (response) {
                let temp = document.createElement("div");
                temp.innerHTML = DOMPurify.sanitize(response);

                let data : extensionInfo= {
                    "name" : "",
                    "image" : "",
                    "description" : "",
                    "episodes" : [],
                    "mainName" : ""
                };

                data.name = (temp.querySelectorAll(".video-title")[0]  as HTMLElement).innerText;
                data.image = temp.querySelector("#sidebar_cat").querySelectorAll(".img5")[0].getAttribute("src");

                if (data.image.indexOf("//") == 0) {
                    data.image = "https:" + data.image;
                }

                data.description = temp.querySelector("#sidebar_cat").querySelectorAll("p")[0].innerText;

                let episodesDOM = temp.querySelector("#sidebar_right3");

                let animeEps = data.episodes;
                let animeDOM = episodesDOM.querySelectorAll("a");
                let animeName;
                for (var i = animeDOM.length - 1; i >= 0; i--) {
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
                    } catch (err) {

                    }

                } catch (err) {
                    animeName = animeName + "-";
                }

                data.episodes = animeEps;
                data.mainName = url.replace("https://www.wcoforever.net/anime/", "") + "-";

                temp.remove();
                resolve(data);
            }).catch(function (err) {
                reject(err);
            });

        }));
    },




    'getLinkFromUrl': async function (url : string) : Promise<extensionVidSource> {

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
        } catch (err) {

        }


        try {
            let animeEpTemp = animeNameMain.split("episode")[1];

            if (animeEpTemp.substring(0, 1) == "-") {
                animeEpTemp = animeEpTemp.substring(1);
                animeEpTemp = animeEpTemp.replace("-", ".");
            }

            animeEp = Math.abs(parseFloat(animeEpTemp));

        } catch (err) {

        }

        if (isNaN(parseFloat(animeEp))) {
            animeEp = 1;
        }
        else if (animeEp < 1) {
            animeEp = 0.1;
        }


        const data : extensionVidSource= {
            sources : [],
            name: "",
            nameWSeason : "",
            episode : "",
            status : 400,
            message: ""
        };

        try {
            let reqOption = {
                'headers': {
                    'x-requested-with': 'XMLHttpRequest'
                },
                "method": "GET",
            };

            let pageHTML = await MakeFetch(url, {});
            let sources = data.sources;
            let dom = document.createElement("div");

            dom.innerHTML = DOMPurify.sanitize(pageHTML);


            try {
                let tmpName = dom.querySelector('[rel="category tag"]').getAttribute("href").replace(`${baseURL}/anime/`, "");
                if (tmpName != "") {
                    animeName = tmpName + "-";
                }
            } catch (err) {

            }


            let nextPrev = dom.getElementsByClassName("prev-next");
            

            for (let npi = 0; npi < nextPrev.length; npi++) {
                data[nextPrev[npi].children[0].getAttribute("rel")] = (nextPrev[npi].children[0].getAttribute("href").replace(baseURL, "")) + "&engine=0";
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

            let domain : string;
            try {
                domain = new URL(mainVidLink).origin;
            } catch (err) {
                domain = "https://embed.watchanimesub.net";
            }

            let videoHTML : string;

            if (config.chrome) {
                videoHTML = await MakeFetch(mainVidLink, {});
            } else {
                videoHTML = await MakeCusReqFmovies(mainVidLink, reqOption);
            }

            let vidLink  = domain + videoHTML.split("$.getJSON(\"")[1].split("\"")[0];

            try {
                let vidLink2 = (vidLink.split("v=cizgi").join('v=')).split('&embed=cizgi').join('&embed=anime');


                let vidLink2HTML : string;
                if (config.chrome) {
                    vidLink2HTML = await MakeFetch(vidLink2, {});
                } else {
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

            } catch (err) {
                console.error(err);
            }

            let vidLinkHTML : string;

            if (config.chrome) {
                vidLinkHTML = await MakeFetch(vidLink, {});
            } else {
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
            dom.remove();
            return data;
        } catch (err) {
            console.error(err);
            alert("Couldn't get the link");
            data.message = "Couldn't get the link";
            return data;
        }

    },
    "discover": async function () : Promise<Array<extensionDiscoverData>> {
        let baseURL = this.baseURL;
        let temp = document.createElement("div");
        temp.innerHTML = DOMPurify.sanitize(await MakeFetch(baseURL, {}));
        let data : Array<extensionDiscoverData> = [];

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
    },

    "getDiscoverLink": async function (mainLink : string) : Promise<string> {

        let baseURL = this.baseURL;
        
        try {
            let temp = document.createElement("div");
            temp.innerHTML = DOMPurify.sanitize(await MakeFetch(`${baseURL}${mainLink}`, {}));
            mainLink = temp.querySelector('[rel="category tag"]').getAttribute("href").replace(baseURL, "");
            return mainLink;
        } catch (err) {
            throw err;
        }
    }

};
