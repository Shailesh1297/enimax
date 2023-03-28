// https://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript
function getAverageRGB(imgEl) {
    var blockSize = 5, // only visit every 5 pixels
    defaultRGB = { r: 0, g: 0, b: 0 }, // for non-supporting envs
    canvas = document.createElement('canvas'), context = canvas.getContext && canvas.getContext('2d'), data, width, height, i = -4, length, rgb = { r: 0, g: 0, b: 0 }, count = 0;
    if (!context) {
        return defaultRGB;
    }
    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
    context.drawImage(imgEl, 0, 0);
    try {
        data = context.getImageData(0, 0, width, height);
    }
    catch (e) {
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
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
// @ts-ignore
const extensionList = window.parent.returnExtensionList();
if (config.local || localStorage.getItem("offline") === 'true') {
    ini();
}
else {
    window.parent.postMessage({ "action": 20 }, "*");
}
let lastScrollPos;
let scrollDownTopDOM = document.getElementById("scrollDownTop");
let scrollSnapFunc;
let showMainName = null;
let showImage = null;
// @ts-ignore
let pullTabArray = [];
pullTabArray.push(new pullToRefresh(document.getElementById("con_11")));
function collapseDesc() {
    const descDOM = document.getElementById("imageDesc");
    const descMoreDOM = document.getElementById("descReadMore");
    if (descDOM.getAttribute("data-expanded") !== "true") {
        descDOM.setAttribute("data-expanded", "true");
        descMoreDOM.innerText = "";
        descDOM.style.maxHeight = "none";
    }
    else {
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
    }
    else {
        settingDOM.setAttribute("data-open", "true");
        settingDOM.style.display = "block";
    }
});
let lastScrollElem = undefined;
scrollDownTopDOM.onclick = function () {
    if (scrollDownTopDOM.className == "scrollTopDOM" && lastScrollElem) {
        lastScrollElem.scrollTop = 0;
    }
    else if (scrollDownTopDOM.className == "scrollBottomDOM" && lastScrollElem) {
        lastScrollElem.scrollTop = lastScrollElem.scrollHeight;
    }
};
// @ts-ignore
// todo
function fix_title(title) {
    try {
        let titleArray = title.split("-");
        let temp = "";
        for (var i = 0; i < titleArray.length; i++) {
            temp = temp + titleArray[i].substring(0, 1).toUpperCase() + titleArray[i].substring(1) + " ";
        }
        return temp;
    }
    catch (err) {
        return title;
    }
}
// @ts-ignore
// todo
function normalise(url) {
    url = url.replace("?watch=", "");
    url = url.split("&engine=")[0];
    return url;
}
window.onmessage = function (x) {
    if (parseInt(x.data.action) == 200) {
        ini();
    }
};
function sendNoti(notiConfig) {
    return new notification(document.getElementById("noti_con"), {
        "perm": notiConfig[0],
        "color": notiConfig[1],
        "head": notiConfig[2],
        "notiData": notiConfig[3]
    });
}
// @ts-ignore
// todo
function checkIfExists(localURL, dList, dName) {
    return (new Promise(function (resolve, reject) {
        let index = dList.indexOf(dName);
        if (index > -1) {
            dList.splice(index, 1);
            let timeout = setTimeout(function () {
                reject(new Error("timeout"));
            }, 1000);
            window.parent.makeLocalRequest("GET", `${localURL}`).then(function (x) {
                clearTimeout(timeout);
                resolve(x);
            }).catch(function () {
                clearTimeout(timeout);
                reject("notdownloaded");
            });
        }
        else {
            reject("notinlist");
        }
    }));
}
function ini() {
    let downloadQueue = window.parent.returnDownloadQueue();
    let username = "hi";
    if (location.search.indexOf("?watch=/") > -1 || localStorage.getItem("offline") === 'true') {
        let main_url = location.search.replace("?watch=/", "");
        //todo
        let currentEngine;
        let temp3 = main_url.split("&engine=");
        if (temp3.length == 1) {
            currentEngine = extensionList[0];
        }
        else {
            currentEngine = extensionList[parseInt(temp3[1])];
        }
        async function processEpisodeData(data, downloaded, main_url) {
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
                window.parent.apiCall("POST", { "username": username, "action": 14, "name": data.mainName, "url": location.search }, (x) => {
                    sendNoti([2, "", "Alert", "Done!"]);
                });
            };
            document.getElementById("updateImage").onclick = function () {
                window.parent.apiCall("POST", { "username": username, "action": 9, "name": data.mainName, "img": data.image }, (x) => {
                    sendNoti([2, "", "Alert", "Done!"]);
                });
            };
            let downloadedList = [];
            if (!config.chrome) {
                try {
                    downloadedList = await window.parent.listDir(data.mainName);
                    let tempList = [];
                    for (let i = 0; i < downloadedList.length; i++) {
                        if (downloadedList[i].isDirectory) {
                            tempList.push(downloadedList[i].name);
                        }
                    }
                    downloadedList = tempList;
                }
                catch (err) {
                    console.error(err);
                }
            }
            document.getElementById("imageTitle").innerText = data.name.trim();
            document.getElementById("showDescription").innerText = data.description.trim();
            if (document.getElementById("showDescription").offsetHeight < 180) {
                document.getElementById("descReadMore").style.display = "none";
                document.getElementById("epListCon").style.marginTop = "0";
            }
            const imageDOM = document.getElementById("imageMain");
            imageDOM.src = data.image;
            imageDOM.onload = function () {
                let color = getAverageRGB(imageDOM);
                document.documentElement.style.setProperty('--theme-color', rgbToHex(color.r, color.g, color.b));
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
            }
            else {
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
                let pageName = "? - ?";
                try {
                    if (!usesCustomPartions) {
                        const episodeKeyword = "episode";
                        const fromNum = parseInt(animeEps[partitions * (i)].title.toLowerCase().split(episodeKeyword)[1]).toString();
                        const toNum = parseInt(animeEps[Math.min(partitions * (i + 1) - 1, animeEps.length - 1)].title.toLowerCase().split(episodeKeyword)[1]).toString();
                        pageName = `${fromNum} - ${toNum}`;
                        partitionSize.push(partitions);
                    }
                    else {
                        pageName = data.pageInfo[i].pageName;
                        partitionSize.push(data.pageInfo[i].pageSize);
                    }
                }
                catch (err) {
                }
                catCon.append(createCat(`room_${partitions * i}`, pageName, 1));
                catDataCons.push(createElement({
                    "class": `categoriesDataMain snappedCategoriesDataMain`,
                    style: {
                        "min-width": "100%"
                    },
                    "id": `room_${partitions * i}`,
                    listeners: {
                        scroll: function () {
                            lastScrollElem = this;
                            if (lastScrollPos) {
                                if (lastScrollPos - this.scrollTop > 0) {
                                    scrollDownTopDOM.className = "scrollTopDOM";
                                }
                                else {
                                    scrollDownTopDOM.className = "scrollBottomDOM";
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
                            }
                            else {
                                tempCatDOM[i].classList.remove("activeCat");
                            }
                        }
                        let activeCatDOM = document.querySelector(".categories.activeCat");
                        let temp = document.getElementById("catActiveMain");
                        window.requestAnimationFrame(function () {
                            window.requestAnimationFrame(function () {
                                if (temp && activeCatDOM) {
                                    temp.style.left = (parseFloat(activeCatDOM.offsetLeft.toString()) - 10) + "px";
                                    temp.style.height = activeCatDOM.offsetHeight.toString();
                                    temp.style.width = activeCatDOM.offsetWidth.toString();
                                }
                            });
                        });
                    }
                    scrollLastIndex = index;
                };
                cusRoomDOM.addEventListener("scroll", () => { scrollSnapFunc(); }, { "passive": true });
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
                        "data": this.getAttribute("data-url"),
                        "anime": data,
                        "mainUrl": main_url,
                        "title": this.getAttribute("data-title")
                    }, "*");
                    this.className = 'episodesLoading';
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
                            window.parent.removeDirectory(`/${data.mainName}/${btoa(normalise(trr))}/`).then(function () {
                                if (downloaded) {
                                    tempDiv.remove();
                                }
                                else {
                                    tempDiv4.className = 'episodesDownload';
                                    tempDiv4.onclick = function () {
                                        tempDiv4.className = 'episodesLoading';
                                        window.parent.postMessage({ "action": 403, "data": tempDiv4.getAttribute("data-url"), "anime": data, "mainUrl": main_url, "title": tempDiv4.getAttribute("data-title") }, "*");
                                    };
                                }
                            }).catch(function (err) {
                                alert("Error deleting the files.");
                            });
                        };
                        check = true;
                    }
                    catch (err) {
                        if (downloadQueue.isInQueue(downloadQueue, animeEps[i].link)) {
                            tempDiv4.className = 'episodesLoading';
                            check = true;
                        }
                        else if (err == "notdownloaded") {
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
                        tempDiv2 = createElement({
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
                                        }
                                        else {
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
                    }
                    else {
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
                }
                else {
                    try {
                        tempDiv.remove();
                    }
                    catch (err) {
                    }
                }
            }
            let countAdded = 0;
            let whichCon = 0;
            for (let e of toAdd) {
                if (downloaded) {
                    epCon.append(e);
                }
                else {
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
                        window.parent.removeDirectory(`/${data.mainName}/${thisLink}`).then(function () {
                            tempDiv.remove();
                        }).catch(function () {
                            alert("Error deleting the files");
                        });
                    };
                    let tempDiv3 = document.createElement("div");
                    tempDiv3.className = 'episodesTitle';
                    try {
                        tempDiv3.innerText = fix_title(atob(thisLink));
                    }
                    catch (err) {
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
            }
            catch (err) {
                console.error(err);
            }
            if (scrollToDOM && !config.chrome) {
                document.getElementById("downloadNext").style.display = "inline-block";
                document.getElementById("downloadNext").onclick = function () {
                    let howmany = parseInt(prompt("How many episodes do you want to download?", "5"));
                    if (isNaN(howmany)) {
                        alert("Not a valid number");
                    }
                    else {
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
                    const element = allEps[index];
                    element.click();
                }
            };
            if (!("image" in data) || data.image == undefined || data.image == null || data.image == "") {
                data.image = "https://raw.githubusercontent.com/enimax-anime/enimax/main/www/assets/images/placeholder.jpg";
            }
            window.parent.apiCall("POST", {
                "username": username,
                "action": 5,
                "name": data.mainName,
                "img": data.image,
                "url": location.search
            }, () => { });
            window.parent.apiCall("POST", {
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
                    }
                    else {
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
                        }
                        catch (err) {
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
            window.parent.makeLocalRequest("GET", `/${main_url.split("&downloaded")[0]}/info.json`).then(function (data) {
                let temp = JSON.parse(data);
                temp.data.episodes = temp.episodes;
                processEpisodeData(temp.data, true, main_url);
            }).catch(function (err) {
                console.error(err);
                alert("Could not find info.json");
            });
        }
        else {
            currentEngine.getAnimeInfo(main_url).then(function (data) {
                processEpisodeData(data, false, main_url);
            }).catch(function (err) {
                console.error(err);
                alert(err);
            });
        }
    }
}
const addToLibrary = document.getElementById("addToLibrary");
const playIcon = document.getElementById("play");
playIcon.onclick = function () {
    const selectedExists = document.querySelector(".episodesSelected");
    if (selectedExists) {
        selectedExists.querySelector(".episodesPlaySmall").click();
    }
    else {
        document.querySelector(".episodesCon").querySelector(".episodesPlaySmall").click();
    }
};
addToLibrary.onclick = function () {
    if (showMainName) {
        addToLibrary.classList.add("isWaiting");
        if (addToLibrary.classList.contains("notInLib")) {
            window.parent.apiCall("POST", {
                "username": "",
                "action": 5,
                "name": showMainName,
                "img": showImage,
                "url": location.search
            }, () => { });
            window.parent.apiCall("POST", {
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
        }
        else {
            const shouldDelete = confirm("Are you sure that you want to remove this show from your library?");
            if (shouldDelete) {
                window.parent.apiCall("POST", { "username": "", "action": 6, "name": showMainName }, () => {
                    addToLibrary.classList.remove("isWaiting");
                    addToLibrary.classList.remove("isInLib");
                    addToLibrary.classList.add("notInLib");
                });
            }
            else {
                addToLibrary.classList.remove("isWaiting");
            }
        }
    }
    else {
        alert("Try again after the page has loaded.");
    }
};
window.parent.apiCall("POST", { "username": "", "action": 4 }, (response) => {
    const doesExist = response.data[0].find(elem => elem[5] === location.search);
    if (doesExist) {
        addToLibrary.classList.add("isInLib");
    }
    else {
        addToLibrary.classList.add("notInLib");
    }
});
applyTheme();
