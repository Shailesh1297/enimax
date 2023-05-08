
// https://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript
function getAverageRGB(imgEl: HTMLImageElement) {

    var blockSize = 5, // only visit every 5 pixels
        defaultRGB = { r: 0, g: 0, b: 0 }, // for non-supporting envs
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, width, height,
        i = -4,
        length,
        rgb = { r: 0, g: 0, b: 0 },
        count = 0;

    if (!context) {
        return defaultRGB;
    }

    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

    context.drawImage(imgEl, 0, 0);

    try {
        data = context.getImageData(0, 0, width, height);
    } catch (e) {
        /* security error, img on diff domain */
        return defaultRGB;
    }

    length = data.data.length;

    while ((i += blockSize * 4) < length) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i + 1];
        rgb.b += data.data[i + 2];
    }

    // ~~ used to floor values
    rgb.r = ~~(rgb.r / count);
    rgb.g = ~~(rgb.g / count);
    rgb.b = ~~(rgb.b / count);
    canvas.remove();
    context = null;
    return rgb;
}

function componentToHex(c: number) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


// @ts-ignore
const extensionList = (<cordovaWindow>window.parent).returnExtensionList();

if (config.local || localStorage.getItem("offline") === 'true') {
    ini();
} else {
    window.parent.postMessage({ "action": 20 }, "*");
}

let lastScrollPos: number;
let scrollDownTopDOM = document.getElementById("scrollDownTop");
let scrollSnapFunc: undefined | Function;
let showMainName = null;
let showImage = null;
// @ts-ignore
let pullTabArray = [];
let webviewLink = "";
let averageColor = "";
const imageDOM = document.getElementById("imageMain") as HTMLImageElement;

// @ts-ignore
const backdrop = document.getElementsByClassName("backdrop")[0] as HTMLImageElement;
// @ts-ignore
const sourceChoiceDOM = document.getElementById("sourceChoice");
// @ts-ignore
const relationsCon = document.getElementById("relationsCon");
// @ts-ignore
const recomCon = document.getElementById("recomCon");
// @ts-ignore
const sourceCardsDOM = document.getElementById("sourceCards");

iniChoiceDOM();

pullTabArray.push(new pullToRefresh(document.getElementById("con_11")));

function collapseDesc() {
    const descDOM = document.getElementById("imageDesc");
    const descMoreDOM = document.getElementById("descReadMore");

    if (descDOM.getAttribute("data-expanded") !== "true") {
        descDOM.setAttribute("data-expanded", "true");
        descMoreDOM.innerText = "";
        descDOM.style.maxHeight = "none";
    } else {
        descDOM.setAttribute("data-expanded", "false");
        descMoreDOM.innerText = "Read more...";
        descDOM.style.maxHeight = "240px";
    }
}

document.getElementById("showDescription").addEventListener("click", collapseDesc);
document.getElementById("descReadMore").addEventListener("click", collapseDesc);

document.getElementById("dottedMenu").addEventListener("click", function () {
    let settingDOM = document.getElementById("settingsCon");
    if (settingDOM.getAttribute("data-open") == "true") {
        settingDOM.setAttribute("data-open", "false");
        settingDOM.style.display = "none";
    } else {
        settingDOM.setAttribute("data-open", "true");
        settingDOM.style.display = "block";
    }
});



let lastScrollElem: Element = undefined;

scrollDownTopDOM.onclick = function () {
    if (scrollDownTopDOM.className == "scrollTopDOM" && lastScrollElem) {
        lastScrollElem.scrollTop = 0;
    } else if (scrollDownTopDOM.className == "scrollBottomDOM" && lastScrollElem) {
        lastScrollElem.scrollTop = lastScrollElem.scrollHeight;
    }
};

// @ts-ignore
// todo
function fix_title(title: string) {
    try {
        let titleArray = title.split("-");
        let temp = "";
        for (var i = 0; i < titleArray.length; i++) {
            temp = temp + titleArray[i].substring(0, 1).toUpperCase() + titleArray[i].substring(1) + " ";
        }
        return temp;
    } catch (err) {
        return title;
    }
}

// @ts-ignore
// todo
function normalise(url: string) {
    url = url.replace("?watch=", "");
    url = url.split("&engine=")[0];
    return url;
}

window.onmessage = function (x) {
    if (parseInt(x.data.action) == 200) {
        ini();
    }

};


function sendNoti(notiConfig: any) {
    return new notification(document.getElementById("noti_con"), {
        "perm": notiConfig[0],
        "color": notiConfig[1],
        "head": notiConfig[2],
        "notiData": notiConfig[3]
    });
}

// @ts-ignore
// todo
function checkIfExists(localURL: string, dList: Array<string>, dName: string): Promise<string> {
    return (new Promise(function (resolve, reject) {
        let index = dList.indexOf(dName);
        if (index > -1) {
            dList.splice(index, 1);
            let timeout = setTimeout(function () {
                reject(new Error("timeout"));
            }, 1000);

            (<cordovaWindow>window.parent).makeLocalRequest("GET", `${localURL}`).then(function (x) {
                clearTimeout(timeout);
                resolve(x);
            }).catch(function () {
                clearTimeout(timeout);
                reject("notdownloaded");

            });
        } else {
            reject("notinlist");
        }
    }));
}

function ini() {
    let downloadQueue = (<cordovaWindow>window.parent).returnDownloadQueue();

    let username = "hi";

    if (location.search.indexOf("?watch=/") > -1 || localStorage.getItem("offline") === 'true') {

        let main_url = location.search.replace("?watch=/", "");

        //todo
        let currentEngine: extension;
        let temp3 = main_url.split("&engine=");
        if (temp3.length == 1) {
            currentEngine = extensionList[0];
        } else {
            currentEngine = extensionList[parseInt(temp3[1])];
        }


        async function processEpisodeData(data: extensionInfo, downloaded, main_url) {
            showMainName = data.mainName;
            showImage = data.image;
            let currentLink = '';
            if (localStorage.getItem("currentLink")) {
                currentLink = localStorage.getItem("currentLink");
            }

            let scrollToDOM;
            var a = document.getElementsByClassName("card_con");
            document.getElementById("updateImage").style.display = "inline-block";
            if (!config.chrome) {
                document.getElementById("downloadAll").style.display = "inline-block";
            }
            document.getElementById("copyLink").style.display = "inline-block";
            document.getElementById("updateLink").style.display = "inline-block";
            document.getElementById("copyImage").style.display = "inline-block";


            document.getElementById("copyLink").onclick = function () {
                window.prompt("Copy it from below:", location.search);
            };

            document.getElementById("copyImage").onclick = function () {
                window.prompt("Copy it from below:", data.image);
            };

            document.getElementById("updateLink").onclick = function () {
                (<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 14, "name": data.mainName, "url": location.search }, (x) => {
                    sendNoti([2, "", "Alert", "Done!"]);
                });
            };


            document.getElementById("updateImage").onclick = function () {
                (<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 9, "name": data.mainName, "img": data.image }, (x) => {
                    sendNoti([2, "", "Alert", "Done!"]);
                });
            };

            let downloadedList = [];
            if (!config.chrome) {
                try {
                    downloadedList = await (<cordovaWindow>window.parent).listDir(data.mainName);
                    let tempList = [];
                    for (let i = 0; i < downloadedList.length; i++) {
                        if (downloadedList[i].isDirectory) {
                            tempList.push(downloadedList[i].name);
                        }
                    }

                    downloadedList = tempList;
                } catch (err) {
                    console.error(err);
                }

            }





            document.getElementById("imageTitle").innerText = data.name.trim();
            document.getElementById("showDescription").innerText = data.description.trim();
            if (document.getElementById("showDescription").offsetHeight < 180) {
                document.getElementById("descReadMore").style.display = "none";
                document.getElementById("epListCon").style.marginTop = "0";
            }

            imageDOM.src = data.image;
            imageDOM.onload = function () {
                let color = getAverageRGB(imageDOM);
                averageColor = rgbToHex(color.r, color.g, color.b);
                document.documentElement.style.setProperty('--theme-color', averageColor);
            };

            let animeEps = data.episodes;
            let epCon = document.getElementById("epListCon");

            let catCon = createElement({
                id: "categoriesCon",
                style: {
                    position: "sticky",
                    top: "0",
                    zIndex: "2",
                    boxSizing: "border-box",
                    padding: "10px",
                    backgroundColor: "black"
                },
                innerHTML: `<div id="catActive">
                                <div style="position: absolute;background: red;" id="catActiveMain"></div>
                            <div>`
            });

            let catDataCon = createElement({
                style: {
                    width: "100%"
                },
                id: "custom_rooms",
                class: "snappedCustomRooms"
            });


            const partitions = 50;
            const catDataCons = [];
            let totalCats = Math.ceil(animeEps.length / partitions);
            let partitionSize = [];
            let usesCustomPartions = false;
            if (data.totalPages) {
                totalCats = data.pageInfo.length;
                usesCustomPartions = true;
            }

            if (downloaded) {
                totalCats = 0;
            } else {

                function secondsToHuman(seconds: number) {
                    const d = Math.floor(seconds / (3600 * 24));
                    const h = Math.floor(seconds % (3600 * 24) / 3600);
                    const m = Math.floor(seconds % 3600 / 60);
                    const s = Math.floor(seconds % 60);

                    const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days ") : "";
                    const hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours ") : "";
                    const mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes ") : "";
                    const sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";

                    if (dDisplay) {
                        return dDisplay;
                    }

                    if (hDisplay) {
                        return hDisplay;
                    }

                    if (mDisplay) {
                        return mDisplay;
                    }

                    if (sDisplay) {
                        return sDisplay;
                    }

                }

                try {
                    const timeDOM = document.getElementById("metaTime");
                    const statusDOM = document.getElementById("metaStatus");
                    const nextDOM = document.getElementById("metaNext");
                    const malDOM = document.getElementById("metaMal");
                    const anilistDOM = document.getElementById("metaAnilist");
                    const relationsDOM = relationsCon;
                    const recomDOM = recomCon;


                    const metaData = await currentEngine.getMetaData(new URLSearchParams(location.search));
                    let addedCover = false;

                    if (metaData.nextAiringEpisode) {
                        nextDOM.style.display = "inline-block";
                        nextDOM.textContent = `Episode ${metaData.nextAiringEpisode.episode} in ${secondsToHuman(metaData.nextAiringEpisode.timeUntilAiring)}`;
                    }

                    if (metaData.season || metaData.seasonYear) {
                        timeDOM.style.display = "inline-block";
                        timeDOM.textContent = `${metaData.season} ${metaData.seasonYear}`;
                    }

                    if (metaData.status) {
                        statusDOM.style.display = "inline-block";
                        statusDOM.textContent = `${fixStatus(metaData.status)}`;
                    }

                    if (window.innerWidth > 600) {
                        if (metaData.bannerImage) {
                            addedCover = true;
                            document.getElementById("con_11").style.background = `url("${metaData.bannerImage}") top no-repeat`;
                            document.getElementById("con_11").style.backgroundSize = `auto 400px`;
                        }
                    } else {
                        if (metaData?.coverImage?.extraLarge) {
                            addedCover = true;
                            document.getElementById("con_11").style.background = `url("${metaData.coverImage.extraLarge}") top no-repeat`;
                            document.getElementById("con_11").style.backgroundSize = `contain`;
                        }
                    }

                    if (metaData?.relations?.nodes.length > 0) {
                        document.getElementById("relations").style.display = "inline-block";
                        const nodes = metaData.relations.nodes;
                        const edges = metaData.relations.edges;
                        makeCardCon(relationsDOM, nodes, edges);
                    }

                    if (metaData?.recommendations?.edges.length > 0) {
                        document.getElementById("recommendations").style.display = "inline-block";
                        const nodes = metaData.recommendations.edges.map((edge: any) => edge.node.mediaRecommendation);
                        makeCardCon(recomDOM, nodes);
                    }

                    if (addedCover) {
                        imageDOM.style.display = "none";
                        document.documentElement.style.setProperty('--theme-color', averageColor + "60");
                    }

                    malDOM.onclick = function () {
                        openWebview(`https://myanimelist.net/anime/${metaData.idMal}`);
                    };

                    anilistDOM.onclick = function () {
                        openWebview(`https://anilist.co/anime/${metaData.id}`);
                    };

                    malDOM.style.display = "inline-block";
                    anilistDOM.style.display = "inline-block";

                    document.getElementById("metadata").style.display = "block";
                } catch (err) {
                    console.error(err);
                }
                epCon.append(catCon);
                epCon.append(catDataCon);
            }

            if (data.genres) {
                const genreContainer = document.getElementById("genres");
                genreContainer.style.display = "block";
                for (const genreText of data.genres) {
                    const genreDOM = createElement({
                        class: "genreItem",
                        innerText: genreText
                    });

                    genreContainer.append(genreDOM);
                }
            }

            for (let i = 0; i < totalCats; i++) {

                let pageName = "? - ?"
                try {
                    if (!usesCustomPartions) {
                        const episodeKeyword = "episode";
                        const fromNum = parseInt(animeEps[partitions * (i)].title.toLowerCase().split(episodeKeyword)[1]).toString();
                        const toNum = parseInt(animeEps[Math.min(partitions * (i + 1) - 1, animeEps.length - 1)].title.toLowerCase().split(episodeKeyword)[1]).toString();
                        pageName = `${fromNum} - ${toNum}`;
                        partitionSize.push(partitions);
                    } else {
                        pageName = data.pageInfo[i].pageName;
                        partitionSize.push(data.pageInfo[i].pageSize);
                    }

                } catch (err) {

                }

                catCon.append(createCat(`room_${partitions * i}`, pageName, 1));
                catDataCons.push(createElement({
                    "class": `categoriesDataMain snappedCategoriesDataMain closed`,
                    style: {
                        "min-width": "100%"
                    },
                    "id": `room_${partitions * i}`,
                    listeners: {
                        scroll: function () {
                            lastScrollElem = this;
                            if (lastScrollPos) {
                                if (2 * this.offsetHeight + this.scrollTop < this.scrollHeight) {
                                    scrollDownTopDOM.style.display = "block !important";

                                    if (lastScrollPos - this.scrollTop > 0) {
                                        scrollDownTopDOM.className = "scrollTopDOM";
                                    } else {
                                        scrollDownTopDOM.className = "scrollBottomDOM";
                                    }
                                } else {
                                    scrollDownTopDOM.className = "scrollHidden";
                                }
                            }
                            lastScrollPos = this.scrollTop;
                        }
                    }
                }));

                catDataCon.append(catDataCons[catDataCons.length - 1]);
            }


            if (isSnapSupported && !downloaded) {
                let scrollLastIndex;
                let tempCatDOM = document.getElementsByClassName("categories");
                let cusRoomDOM = document.getElementById("custom_rooms");
                scrollSnapFunc = function (shouldScroll = true) {
                    let unRoundedIndex = cusRoomDOM.scrollLeft / cusRoomDOM.offsetWidth;
                    let index = Math.round(unRoundedIndex);

                    if (index != scrollLastIndex) {
                        for (let i = 0; i < tempCatDOM.length; i++) {
                            if (i == index) {
                                tempCatDOM[i].classList.add("activeCat");
                                if (shouldScroll) {
                                    tempCatDOM[i].scrollIntoView();
                                }
                                lastScrollElem = document.getElementById(tempCatDOM[i].getAttribute("data-id"));
                            } else {
                                tempCatDOM[i].classList.remove("activeCat");
                            }
                        }

                        let activeCatDOM = document.querySelector(".categories.activeCat") as HTMLElement;
                        let temp = document.getElementById("catActiveMain") as HTMLElement;
                        window.requestAnimationFrame(function () {
                            window.requestAnimationFrame(function () {
                                if (temp && activeCatDOM) {
                                    temp.style.left = (parseFloat(activeCatDOM.offsetLeft.toString()) - 10) + "px";
                                    temp.style.height = activeCatDOM.offsetHeight.toString();
                                    temp.style.width = activeCatDOM.offsetWidth.toString();
                                }

                                setTimeout(() => {
                                    let foundCurrentCon = false;
                                    for (let i = 0; i < tempCatDOM.length; i++) {
                                        const dataCon = document.getElementById(tempCatDOM[i].getAttribute("data-id"));
                                        const prevCon = document.getElementById(tempCatDOM[i - 1]?.getAttribute("data-id"));

                                        if (i == index) {
                                            foundCurrentCon = true;
                                            prevCon?.classList.remove("closed");
                                            dataCon.classList.remove("closed");
                                        } else {

                                            if (foundCurrentCon) {
                                                dataCon.classList.remove("closed");
                                                foundCurrentCon = false;
                                            }
                                            else if (dataCon) {
                                                dataCon.classList.add("closed");
                                            }
                                        }
                                    }
                                }, 250);
                            });
                        });
                    }
                    scrollLastIndex = index;
                };
                cusRoomDOM.addEventListener("scroll", () => { scrollSnapFunc() }, { "passive": true });
            }

            let toAdd = [];
            for (var i = 0; i < animeEps.length; i++) {
                let trr = animeEps[i].link;

                let tempDiv = document.createElement("div");
                tempDiv.className = 'episodesCon';
                tempDiv.setAttribute('data-url', animeEps[i].link);




                let tempDiv4 = document.createElement("div");
                tempDiv4.className = 'episodesDownload';
                tempDiv4.setAttribute('data-url', animeEps[i].link);
                tempDiv4.setAttribute('data-title', animeEps[i].title);

                tempDiv4.onclick = function () {
                    window.parent.postMessage({
                        "action": 403,
                        "data": (this as HTMLElement).getAttribute("data-url"),
                        "anime": data,
                        "mainUrl": main_url,
                        "title": (this as HTMLElement).getAttribute("data-title")
                    }, "*");

                    (this as HTMLElement).className = 'episodesLoading';
                };

                let tempDiv3 = document.createElement("div");
                let tempTitle = animeEps[i].title;
                tempDiv3.className = 'episodesTitle';
                tempDiv3.innerText = tempTitle;

                if (animeEps[i].date) {
                    tempDiv3.append(createElement({
                        element: "div",
                        style: {
                            "fontSize": "13px",
                            "marginTop": "6px"
                        },
                        innerText: animeEps[i].date.toLocaleString()
                    }));
                }

                let check = false;
                if (!config.chrome) {

                    try {
                        await checkIfExists(`/${data.mainName}/${btoa(normalise(trr))}/.downloaded`, downloadedList, btoa(normalise(trr)));
                        tempDiv4.className = 'episodesDownloaded';
                        tempDiv4.onclick = function () {
                            (<cordovaWindow>window.parent).removeDirectory(`/${data.mainName}/${btoa(normalise(trr))}/`).then(function () {
                                if (downloaded) {
                                    tempDiv.remove();
                                } else {
                                    tempDiv4.className = 'episodesDownload';
                                    tempDiv4.onclick = function () {
                                        tempDiv4.className = 'episodesLoading';

                                        window.parent.postMessage({ "action": 403, "data": tempDiv4.getAttribute("data-url"), "anime": data, "mainUrl": main_url, "title": tempDiv4.getAttribute("data-title") }, "*");


                                    };
                                }
                            }).catch(function (err) {
                                alert("Error deleting the files.");
                            });
                        }


                        check = true;

                    } catch (err) {
                        if (downloadQueue.isInQueue(downloadQueue, animeEps[i].link)) {
                            tempDiv4.className = 'episodesLoading';
                            check = true;

                        } else if (err == "notdownloaded") {
                            check = true;
                            tempDiv4.className = 'episodesBroken';
                        }

                    }

                }




                let tempDiv2 = document.createElement("div");
                tempDiv2.className = 'episodesPlay';

                tempDiv2.onclick = function () {
                    localStorage.setItem("mainName", data.mainName);
                    window.parent.postMessage({ "action": 4, "data": trr }, "*");
                };

                if (check || !downloaded || config.chrome) {



                    if (!downloaded) {
                        tempDiv.style.flexDirection = "column";

                        tempDiv2.remove();
                        let tempDiv2Con = createElement({
                            class: "episodesImageCon",
                        });

                        tempDiv2Con.append(createElement({
                            class: "episodesBackdrop",
                        }));


                        tempDiv2 = <HTMLImageElement>createElement({
                            "class": "episodesThumbnail",
                            "element": "img",
                            "attributes": {
                                "loading": "lazy",
                                "src": (animeEps[i].thumbnail ? animeEps[i].thumbnail : "../../assets/images/anime2.png"),
                            }
                        });


                        let horizontalCon = createElement({
                            "class": "hozCon"
                        });

                        let horizontalConT = createElement({
                            "class": "hozCon",
                            "style": {
                                "marginTop": "12px"
                            }
                        });


                        horizontalConT.append(tempDiv3);
                        tempDiv3.className = 'episodesTitle aLeft';


                        horizontalConT.append(createElement({
                            "class": "episodesPlaySmall",
                            "listeners": {
                                "click": function () {
                                    localStorage.setItem("mainName", data.mainName);
                                    window.parent.postMessage({ "action": 4, "data": trr }, "*");
                                }
                            }
                        }));


                        tempDiv2Con.append(tempDiv2);
                        horizontalCon.append(tempDiv2Con);
                        horizontalCon.append(createElement({
                            "class": "episodesTitleTemp"
                        }));

                        if (!config.chrome) {
                            horizontalCon.append(tempDiv4);
                        }
                        tempDiv.append(horizontalCon);
                        tempDiv.append(horizontalConT);

                        let horizontalConD;
                        if (animeEps[i].description) {
                            horizontalConD = createElement({
                                "class": "hozCon",
                                "style": {
                                    "marginTop": "12px",
                                    "flex-direction": "column"
                                }
                            });

                            horizontalConD.append(createElement({
                                "class": "episodesDescription",
                                "innerText": animeEps[i].description,
                                "listeners": {
                                    "click": function () {
                                        let collapsed = this.getAttribute("collapsed");
                                        let readMore = this.nextSibling;
                                        if (collapsed !== "false") {
                                            this.style.maxHeight = "none";
                                            this.setAttribute("collapsed", "false");

                                            if (readMore) {
                                                readMore.style.display = "none";
                                            }
                                        } else {
                                            this.style.maxHeight = "94px";
                                            this.setAttribute("collapsed", "true");
                                            if (readMore) {
                                                readMore.style.display = "block";
                                            }
                                        }
                                    }
                                }
                            }));
                            horizontalConD.append(createElement({
                                "class": "episodesDescEllipsis",
                                "innerText": "Read more..."
                            }));
                            tempDiv.append(horizontalConD);

                        }
                        // epCon.append(tempDiv);
                        toAdd.push(tempDiv);
                    } else {
                        if (downloaded) {
                            let localQuery = encodeURIComponent(`/${data.mainName}/${btoa(normalise(trr))}`);
                            tempDiv2.onclick = function () {
                                window.parent.postMessage({ "action": 4, "data": `?watch=${localQuery}` }, "*");
                            };
                        }
                        tempDiv.append(tempDiv2);
                        tempDiv.append(tempDiv3);
                        if (!config.chrome) {
                            tempDiv.append(tempDiv4);
                        }
                        // epCon.append(tempDiv);
                        toAdd.push(tempDiv);
                    }


                    if (trr == currentLink) {
                        scrollToDOM = tempDiv;
                        tempDiv.style.backgroundColor = "rgba(255,255,255,1)";
                        tempDiv.classList.add("episodesSelected");
                    }
                } else {
                    try {
                        tempDiv.remove();
                    } catch (err) {

                    }
                }

            }

            let countAdded = 0;
            let whichCon = 0;

            for (let e of toAdd) {
                if (downloaded) {
                    epCon.append(e);
                } else {
                    if (countAdded >= partitionSize[whichCon]) {
                        whichCon++;
                        countAdded = 0;
                    }
                    catDataCons[whichCon].append(e);
                    countAdded++;
                }

            }


            if (downloaded) {
                for (let downloadIndex = 0; downloadIndex < downloadedList.length; downloadIndex++) {

                    let thisLink = downloadedList[downloadIndex];
                    let localQuery = encodeURIComponent(`/${data.mainName}/${thisLink}`);

                    let tempDiv = document.createElement("div");
                    tempDiv.className = 'episodesCon';


                    let tempDiv2 = document.createElement("div");
                    tempDiv2.className = 'episodesPlay';

                    tempDiv2.onclick = function () {
                        localStorage.setItem("mainName", data.mainName);
                        window.parent.postMessage({ "action": 4, "data": `?watch=${localQuery}` }, "*");

                    };

                    let tempDiv4 = document.createElement("div");
                    tempDiv4.className = 'episodesDownloaded';
                    tempDiv4.onclick = function () {
                        (<cordovaWindow>window.parent).removeDirectory(`/${data.mainName}/${thisLink}`).then(function () {
                            tempDiv.remove();
                        }).catch(function () {
                            alert("Error deleting the files");
                        });
                    }


                    let tempDiv3 = document.createElement("div");
                    tempDiv3.className = 'episodesTitle';
                    try {
                        tempDiv3.innerText = fix_title(atob(thisLink));
                    } catch (err) {
                        tempDiv3.innerText = "Could not parse the titles";
                    }



                    tempDiv.append(tempDiv2);
                    tempDiv.append(tempDiv3);
                    tempDiv.append(tempDiv4);
                    epCon.append(tempDiv);
                }
            }

            try {

                if (scrollSnapFunc) {
                    scrollSnapFunc(false);
                }

                if (!downloaded && scrollToDOM && localStorage.getItem("scrollBool") !== "false") {
                    scrollToDOM.scrollIntoView();
                }

            } catch (err) {
                console.error(err);
            }

            if (scrollToDOM && !config.chrome) {
                document.getElementById("downloadNext").style.display = "inline-block";
                document.getElementById("downloadNext").onclick = function () {
                    let howmany = parseInt(prompt("How many episodes do you want to download?", "5"));
                    if (isNaN(howmany)) {
                        alert("Not a valid number");
                    } else {
                        let cur = scrollToDOM;
                        let count = howmany;
                        while (cur != null && count > 0) {
                            cur = cur.nextElementSibling;
                            let temp = cur.querySelector(".episodesDownload");
                            if (temp) {
                                temp.click();
                            }
                            count--;
                        }
                    }
                };
            }

            document.getElementById("downloadAll").onclick = function () {
                let allEps = document.querySelectorAll(".episodesDownload");
                for (let index = 0; index < allEps.length; index++) {
                    const element = <HTMLElement>allEps[index];
                    element.click();
                }

            };


            if (!("image" in data) || data.image == undefined || data.image == null || data.image == "") {
                data.image = "https://raw.githubusercontent.com/enimax-anime/enimax/main/www/assets/images/placeholder.jpg";
            }

            (<cordovaWindow>window.parent).apiCall("POST", {
                "username": username,
                "action": 5,
                "name": data.mainName,
                "img": data.image,
                "url": location.search
            }, () => { });

            (<cordovaWindow>window.parent).apiCall("POST", {
                "username": username,
                "action": 2,
                "name": data.mainName,
                "fallbackDuration": true
            }, (epData) => {
                let episodes = {};
                for (let ep of epData.data) {
                    if (epData.dexie) {
                        if (ep.comp != 0 && ep.ep != 0) {
                            let thisEp = {
                                duration: ep.comp,
                                curtime: ep.cur_time
                            };
                            episodes[ep.main_link] = thisEp;
                        }
                    } else {
                        if (ep.duration != 0 && ep.ep != 0) {
                            let thisEp = {
                                duration: ep.duration,
                                curtime: ep.curtime,
                            };
                            episodes[ep.name] = thisEp;
                        }
                    }
                }


                for (const elem of document.getElementsByClassName("episodesCon")) {
                    let dataURL = elem.getAttribute("data-url");
                    if (dataURL in episodes) {
                        try {
                            let imageCon = elem.children[0].children[0];
                            let curEp = episodes[dataURL];

                            let tempDiv = createElement({
                                "class": "episodesProgressCon",
                            });

                            tempDiv.append(createElement({
                                "class": "episodesProgress",
                                "style": {
                                    "width": `${100 * (parseInt(curEp.curtime) / parseInt(curEp.duration))}%`
                                }
                            }));

                            imageCon.append(tempDiv);
                        } catch (err) {
                            console.error(err);
                        }

                        delete episodes[dataURL];
                    }


                    if (Object.keys(episodes).length == 0) {
                        break;
                    }
                }

            });
        }


        if (localStorage.getItem("offline") === 'true') {
            (<cordovaWindow>window.parent).makeLocalRequest("GET", `/${main_url.split("&downloaded")[0]}/info.json`).then(function (data) {
                let temp = JSON.parse(data);
                temp.data.episodes = temp.episodes;
                processEpisodeData(temp.data, true, main_url);

            }).catch(function (err) {
                console.error(err);
                alert("Could not find info.json");
            });

        } else {
            currentEngine.getAnimeInfo(main_url).then(function (data) {
                processEpisodeData(data, false, main_url);
            }).catch(function (err: infoError) {

                const epCon = document.getElementById("epListCon");
                constructErrorPage(
                    epCon,
                    err.message,
                    {
                        hasLink: true,
                        hasReload: true,
                        clickEvent: () => {
                            openWebview(webviewLink)
                        }
                    }
                );

                epCon.style.marginTop = "0";

                webviewLink = err.url;
                (document.querySelector(".infoCon") as HTMLElement).style.display = "none";

            });
        }
    }
}


const addToLibrary = document.getElementById("addToLibrary");
const playIcon = document.getElementById("play");

playIcon.onclick = function () {
    const selectedExists = document.querySelector(".episodesSelected");
    if (selectedExists) {
        (selectedExists.querySelector(".episodesPlaySmall") as HTMLElement).click();
    } else {
        (document.querySelector(".episodesCon").querySelector(".episodesPlaySmall") as HTMLElement).click();
    }
};

addToLibrary.onclick = function () {
    if (showMainName) {
        addToLibrary.classList.add("isWaiting");

        if (addToLibrary.classList.contains("notInLib")) {
            (<cordovaWindow>window.parent).apiCall("POST", {
                "username": "",
                "action": 5,
                "name": showMainName,
                "img": showImage,
                "url": location.search
            }, () => {

                (<cordovaWindow>window.parent).apiCall("POST",
                    {
                        "username": "",
                        "action": 2,
                        "name": showMainName,
                        "cur": document.querySelector(".episodesCon").getAttribute("data-url"),
                        "ep": 1
                    }, (response) => {
                        addToLibrary.classList.remove("isWaiting");
                        addToLibrary.classList.remove("notInLib");
                        addToLibrary.classList.add("isInLib");
                    });

            });


        } else {
            const shouldDelete = confirm("Are you sure that you want to remove this show from your library?");
            if (shouldDelete) {
                (<cordovaWindow>window.parent).apiCall("POST", { "username": "", "action": 6, "name": showMainName }, () => {
                    addToLibrary.classList.remove("isWaiting");
                    addToLibrary.classList.remove("isInLib");
                    addToLibrary.classList.add("notInLib");
                });
            } else {
                addToLibrary.classList.remove("isWaiting");
            }
        }
    } else {
        alert("Try again after the page has loaded.");
    }
};

(<cordovaWindow>window.parent).apiCall("POST", { "username": "", "action": 4 }, (response) => {
    const doesExist = response.data[0].find(elem => elem[5] === location.search);
    if (doesExist) {
        addToLibrary.classList.add("isInLib");
    } else {
        addToLibrary.classList.add("notInLib");
    }

});

document.getElementById("relations").onclick = function () {
    openCon(relationsCon);
};

document.getElementById("recommendations").onclick = function () {
    openCon(recomCon);
};

document.getElementById("back").onclick = function () {
    window.parent.postMessage({ "action": 500, data: "pages/homepage/index.html" }, "*");
};


applyTheme();