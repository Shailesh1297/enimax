let showLastEpDB;
// @ts-ignore
showLastEpDB = new Dexie("updateLib");
showLastEpDB.version(1.0).stores({
    lastestEp: "++id, name, latest"
});

window.parent.postMessage({ "action": 1, data: "any" }, "*");

if (config.chrome) {
    let chromeDOM = document.getElementsByClassName("notChrome") as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < chromeDOM.length; i++) {
        chromeDOM[i].style.display = "none";
    }
}

let rooms2;
let downloadedFolders: any = {};
// @ts-ignore
let pullTabArray: Array<pullToRefresh> = [];
let flaggedShow: Array<flaggedShows> = [];

let errDOM: HTMLElement = document.getElementById("errorCon");
let firstLoad = true;
let states: string = "";
let stateAction = {
    access: () => {
        document.getElementById("accessabilityCon").style.display = "none";
    },
    themes: () => {
        document.getElementById("themesCon").style.display = "none";
    },
    menu: () => {
        toggleMenu("1");
    },
    movecat: () => {
        document.getElementById("room_add_show").style.display = "none";
    },
    addcat: () => {
        document.getElementById("room_con").style.display = "none";
    },
    reordercat: () => {
        document.getElementById("room_dis").style.display = "none";
    },
    queue: () => {
        document.getElementById("queueCon").style.display = "none";
        document.getElementById("queueCon").setAttribute("data-conopen", "false");
    }

};


function addState(id: string) {
    states = id;
    const currentAction = new URLSearchParams(location.search);

    if (!currentAction.get("action")) {
        window.history.pushState({}, "", `?action=${id}`);
    } else {
        window.history.replaceState({}, "", `?action=${id}`);
    }
}

async function populateDownloadedArray() {
    try {
        downloadedFolders = {};
        let temp = await (<cordovaWindow>window.parent).listDir("");
        for (let i = 0; i < temp.length; i++) {
            if (temp[i].isDirectory) {
                downloadedFolders[temp[i].name] = true;
            }
        }
    } catch (err) {

    }
}

async function testIt(idx = -1): Promise<void> {
    let extensionList = (<cordovaWindow>window.parent).returnExtensionList();
    let extensionNames = (<cordovaWindow>window.parent).returnExtensionNames();
    let searchQuery = "odd";
    let errored = false;
    for (let i = 0; i < extensionList.length; i++) {
        if (idx != -1 && i != idx) {
            continue;
        }
        let searchResult, episodeResult, playerResult;
        try {
            searchResult = (await extensionList[i].searchApi((i == 2) ? "friends" : searchQuery)).data;
        } catch (err) {
            errored = true;
            alert(`${extensionNames[i]} - search :  ${err.toString()}`);
        }

        try {
            let tempSea = searchResult[0].link;
            if (tempSea[0] == "/") {
                tempSea = tempSea.substring(1);
            }
            episodeResult = (await extensionList[i].getAnimeInfo(tempSea));
        } catch (err) {
            errored = true;
            alert(`${extensionNames[i]} - episode :  ${err.toString()}`);
        }

        try {
            playerResult = await extensionList[i].getLinkFromUrl(episodeResult.episodes[0].link.replace("?watch=", ""));
        } catch (err) {
            console.error(err);
            errored = true;
            alert(`${extensionNames[i]} - player :  ${err.toString()}`);
        }

        try {
            alert(`${extensionNames[i]} - Here's the link: ${playerResult.sources[0].url}`);
        } catch (err) {
            alert(extensionNames[i] + " Failed");
        }
    }

    if (!errored) {
        alert("Everything seems to be working fine");
    }
}


async function testKey(): Promise<void> {
    try {
        alert(await (<cordovaWindow>window.parent).extractKey(4));
    } catch (err) {
        alert("Fmovies failed");
    }

    try {
        alert(await (<cordovaWindow>window.parent).extractKey(6));
    } catch (err) {
        alert("zoro failed");
    }

    // return;


    try {

        let links = ["main-2022-10-11-14-00-01.js"];


        for (let link of links) {
            try {
                alert(await (<cordovaWindow>window.parent).extractKey(4, "http://10.0.0.203/dump/e4/" + link));
            } catch (err) {
                console.error(err);
                alert(link + "failed");
            }

        }


    } catch (err) {
        console.error(err);
        alert("fmovies failed");
    }

    return;

}
if (localStorage.getItem("devmode") === "true") {
    document.getElementById("testExtensions").style.display = "block";
    for (let elem of document.getElementsByClassName("testExt")) {
        (elem as HTMLElement).style.display = "block";
        (elem as HTMLElement).onclick = function () {
            testIt(parseInt((this as HTMLElement).getAttribute("data-exId")));
        }
    }
    document.getElementById("testKey").style.display = "block";
    document.getElementById("testExtensions").onclick = function () {
        testIt();
    }
    document.getElementById("testKey").onclick = function () {
        testKey();
    }
}


if (isSnapSupported) {
    document.getElementById("custom_rooms").className = "snappedCustomRooms";
}
function resetOfflineQual() {
    let qual = [360, 480, 720, 1080];
    while (true) {
        let choice = parseInt(prompt(`What quality do you want the downloaded videos to be of? \n1. 360 \n2. 480\n3. 720 \n4. 1080`));
        if (!isNaN(choice) && choice >= 1 && choice <= 4) {
            localStorage.setItem("offlineQual", qual[choice - 1].toString());
            break;
        } else {
            alert("Enter a number between 1 and 4");
        }
    }
}

function readImage(file: File): Promise<ArrayBuffer> {
    return (new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
            resolve(event.target.result as ArrayBuffer);
        });

        reader.addEventListener('error', (event) => {
            reject("err");
        });
        reader.readAsArrayBuffer(file);
    }));
}



function exportDataSQL() {
    var options = {
        files: [(<cordovaWindow>window.parent).cordova.file.applicationStorageDirectory + "databases/data4.db"],
    };

    (<cordovaWindow>window.parent).plugins.socialsharing.shareWithOptions(options, () => { }, () => {
        alert("Something went wrong");
    });

}

document.getElementById("resetQuality").onclick = function () {
    resetOfflineQual();
}

document.getElementById("importFile").onchange = async function (event) {

    try {
        let confirmation = prompt("Are you sure you want to import this file? Your current data will be replaced by the imported file. Type \"YES\" to continue.");

        if (confirmation == "YES") {
            const fileList = (event.target as HTMLInputElement).files;
            let result = await readImage(fileList[0]);
            (<cordovaWindow>window.parent).saveAsImport(result);
        } else {
            alert("Aborting");
        }


    } catch (err) {
        alert("Error reading the file.");
    }
}


document.getElementById("getImage").onchange = async function (event) {
    try {
        const fileList = (event.target as HTMLInputElement).files;
        let result = await readImage(fileList[0]);
        (<cordovaWindow>window.parent).saveImage(result);
    } catch (err) {
        alert("Error reading the file.");
    }

}

document.getElementById("exportData").onclick = function () {
    exportDataSQL();
}

document.getElementById("accessability").onclick = function () {
    addState("access");
    document.getElementById("accessabilityCon").style.display = "flex";
}

document.getElementById("queueButton").setAttribute("data-paused", (localStorage.getItem("downloadPaused") === 'true').toString());

if (document.getElementById("queueButton").getAttribute("data-paused") === 'true') {
    document.getElementById("queueButton").className = "queuePlay";
} else {
    document.getElementById("queueButton").className = "queuePause";

}

document.getElementById("queueButton").onclick = function () {
    let downloadQueue = (<cordovaWindow>window.parent).returnDownloadQueue();
    if (document.getElementById("queueButton").getAttribute("data-paused") === 'true') {
        let bool = downloadQueue.playIt(downloadQueue);
        if (bool) {
            document.getElementById("queueButton").className = "queuePause";
            document.getElementById("queueButton").setAttribute("data-paused", "false");
        }
    } else {
        let bool = downloadQueue.pauseIt(downloadQueue);
        if (bool) {
            document.getElementById("queueButton").className = "queuePlay";
            document.getElementById("queueButton").setAttribute("data-paused", "true");

        }

    }
};

document.getElementById("activeRemove").onclick = function () {
    let downloadQueue = (<cordovaWindow>window.parent).returnDownloadQueue();
    downloadQueue.removeActive(downloadQueue);
}


document.getElementById("doneRemove").onclick = function () {
    let downloadQueue = (<cordovaWindow>window.parent).returnDownloadQueue();
    downloadQueue.removeDone(downloadQueue, true);
}

document.getElementById("errorRemove").onclick = function () {
    let downloadQueue = (<cordovaWindow>window.parent).returnDownloadQueue();
    downloadQueue.removeDone(downloadQueue, false);
}

if (config.chrome) {
    document.getElementById("queueOpen").style.display = "none";
    document.getElementById("restoreData").style.display = "none";
}

// todo
function addQueue(queue: Array<queueElement>, queueDOM: HTMLElement, downloadQueue: downloadQueue, isDone: boolean) {


    if (!isDone && queue.length == 0) {
        queueDOM.append(createElement(
            {
                "style": {
                    "color": "white",
                    "fontSize": "15px",
                    "margin": "10px 0 30px 0",
                },
                "innerText": "Empty"
            }
        ));
    }
    for (let i = 0; i < queue.length; i++) {
        let temp = createElement(
            {
                "element": "div", "class": "episodesCon",
                "attributes": {
                    "data-url": queue[i].data
                },

            }
        );

        let temp2 = createElement({ "element": "div", "class": "queueMessageCon" });


        let temp3 = createElement({ "element": "div", "innerText": queue[i].message, "class": "queueMessage" });

        let temp4Con = createElement({ "element": "div" });

        let temp4 = createElement({
            "element": "div", "class": "episodesDownloaded", "attributes": {
                "data-url": queue[i].data
            }
        });

        temp4.onclick = function () {
            if (isDone) {
                downloadQueue.removeFromDoneQueue((this as HTMLElement).getAttribute("data-url"), downloadQueue);

            } else {
                downloadQueue.removeFromQueue((this as HTMLElement).getAttribute("data-url"), downloadQueue);

            }

        }
        temp4Con.append(temp4);

        if (isDone && queue[i].errored === true) {
            let temp6 = createElement({
                "element": "div", "class": "episodesRetry", "attributes": {
                    "data-url": queue[i].data
                }
            });

            temp6.onclick = function () {
                downloadQueue.retryFromDoneQueue((this as HTMLElement).getAttribute("data-url"), downloadQueue);
            }

            temp4Con.append(temp6);

        }
        let downloadPercent;

        try {
            let temp = downloadQueue.queue[0].downloadInstance;

            //todo
            downloadPercent = temp.downloaded / temp.total;
            downloadPercent = Math.floor(downloadPercent * 10000) / 100;
        } catch (err) {

        }


        let temp5 = createElement({ "element": "div", "innerHTML": `${queue[i].title} - ${queue[i].anime.name.trim()}` });

        temp.append(temp2);
        temp.append(temp4Con);
        temp2.append(temp5);

        if (!isDone && i === 0) {
            temp3.id = "downloadingPercent";

        }


        temp2.append(temp3);
        if (isDone) {
            if (queue[i].errored === true) {
                errDOM.prepend(temp);
            } else {
                queueDOM.prepend(temp);
            }
        } else {
            queueDOM.append(temp);
        }
    }

    errDOM.children.length == 0 ? errDOM.append(createElement(
        {
            "style": {
                "color": "white",
                "fontSize": "15px",
                "margin": "10px 0 30px 0",
            },
            "innerText": "Empty"
        }
    )) : null;


    queueDOM.children.length == 0 ? queueDOM.append(createElement(
        {
            "style": {
                "color": "white",
                "fontSize": "15px",
                "margin": "10px 0 30px 0",
            },
            "innerText": "Empty"
        }
    )) : null;
}



function reloadQueue(mode = 0) {
    let downloadQueue = (<cordovaWindow>window.parent).returnDownloadQueue();
    if (downloadQueue.pause) {
        document.getElementById("queueButton").className = "queuePlay";
        document.getElementById("queueButton").setAttribute("data-paused", "true");
    } else {
        document.getElementById("queueButton").className = "queuePause";
        document.getElementById("queueButton").setAttribute("data-paused", "false");
    }

    if (mode == 0 || mode == 1) {
        let queueDOM = document.getElementById("activeCon");
        queueDOM.innerHTML = "";
        let queue = downloadQueue.queue;
        addQueue(queue, queueDOM, downloadQueue, false);
    }


    if (mode == 0 || mode == 2) {
        let doneQueueDOM = document.getElementById("doneCon");
        doneQueueDOM.innerHTML = "";
        errDOM.innerHTML = "";
        let doneQueue = downloadQueue.doneQueue;
        addQueue(doneQueue, doneQueueDOM, downloadQueue, true);
    }

}




document.getElementById("queueOpen").onclick = function () {
    document.getElementById("queueCon").setAttribute("data-conopen", "true");
    document.getElementById("queueCon").style.display = "block";
    addState("queue");
    reloadQueue();
}

document.getElementById("themes").onclick = function () {
    addState("themes");
    document.getElementById("themesCon").setAttribute("data-conopen", "true");
    document.getElementById("themesCon").style.display = "flex";
}



if (!config.chrome) {
    document.getElementById("offlineCon").style.display = "block";

    if (config.local) {
        document.getElementById("exportData").style.display = "block";
        document.getElementById("importData").style.display = "block";
    }
}

if (localStorage.getItem("offline") === 'true') {
    document.getElementById("resetSource").style.display = "block";
    document.getElementById("resetQuality").style.display = "block";
    document.getElementById("searchIcon").style.display = "none";



}

document.getElementById("resetSource").onclick = function () {
    const extensionNames = (<cordovaWindow>window.parent).returnExtensionNames();
    let message = `What extension's source do you want to reset?\n`;
    for (let i = 0; i < extensionNames.length; i++) {
        message += `${i}. ${extensionNames[i]}\n`;
    }

    while (true) {
        let res = parseInt(prompt(message));
        if (res >= 0 && res < extensionNames.length) {
            localStorage.removeItem(`${res}-downloadSource`);
            break;
        }
    }
}


let offlineDOM = document.getElementById("offline");

offlineDOM.onchange = function () {
    let val = (offlineDOM as HTMLInputElement).checked.toString();

    if (val == "false") {
        localStorage.setItem("offline", "false");
        window.parent.postMessage({ "action": 500, data: "pages/homepage/index.html" }, "*");
    } else {
        if (isNaN(parseInt(localStorage.getItem("offlineQual")))) {
            resetOfflineQual();
        }
        localStorage.setItem("offline", "true");
        window.parent.postMessage({ "action": 500, data: "pages/homepage/index.html" }, "*");

    }
};





async function logout() {
    try {
        sendNoti([2, "", "Alert", "Trying to log you out..."]);

        await (<cordovaWindow>window.parent).makeRequest("POST", `${config.remote}/logout`, {});
        window.parent.postMessage({ "action": 500, data: "pages/homepage/index.html" }, "*");

    } catch (err) {
        sendNoti([2, "red", "Error", err]);

    }
}

if (config.local || localStorage.getItem("offline") === 'true') {
    document.getElementById("logout").style.display = "none";
    document.getElementById("reset").style.display = "none";
}


document.getElementById("retry").addEventListener("click", function () {
    window.parent.postMessage({ "action": 500, data: "pages/homepage/index.html" }, "*");

});

document.getElementById("searchIcon").addEventListener("click", function () {
    window.parent.postMessage({ "action": 500, data: "pages/search/index.html" }, "*");

});

document.getElementById("add_room").addEventListener("click", function () {
    add_room_open();
});

document.getElementById("show_room").addEventListener("click", function () {
    show_room_open();
});





document.getElementById("changeServerDiv").addEventListener("click", function () {
    changeServer();
});

document.getElementById("logout").addEventListener("click", function () {
    logout();
});



let tempCloseDom = document.getElementsByClassName("closeDom") as HTMLCollectionOf<HTMLElement>;

for (let i = 0; i < tempCloseDom.length; i++) {
    tempCloseDom[i].onclick = function () {
        hide_dom(this);
    }
}


document.getElementById("closeRoom").onclick = function () {
    hide_dom2(this);
};
document.getElementById("closeDomQueue").onclick = function () {
    hide_dom(this);
    document.getElementById("queueCon").setAttribute("data-conopen", "false");
}


document.getElementById("addRoom").onclick = function () {
    ini_api.add_room();
};

document.getElementById("saveRoom").onclick = function () {
    ini_api.change_order();
};


document.getElementById("outlineColor").onchange = function () {
    localStorage.setItem("outlineColor", (this as HTMLInputElement).value);
}


document.getElementById("outlineWidth").oninput = function () {
    localStorage.setItem("outlineWidth", (this as HTMLInputElement).value);
}

document.getElementById("backgroundBlur").oninput = function () {
    localStorage.setItem("backgroundBlur", (this as HTMLInputElement).value);
    (<cordovaWindow>window.parent).updateBackgroundBlur();
}

document.getElementById("fmoviesBase").oninput = function () {
    localStorage.setItem("fmoviesBaseURL", (this as HTMLInputElement).value);
    (<cordovaWindow>window.parent).setFmoviesBase();
}

document.getElementById("themeColor").onchange = function () {
    localStorage.setItem("themecolor", (this as HTMLInputElement).value);
    applyTheme();
}

document.getElementById("downloadTimeout").oninput = function () {
    localStorage.setItem("downloadTimeout", (this as HTMLInputElement).value);
}

document.getElementById("scrollBool").onchange = function () {
    localStorage.setItem("scrollBool", (this as HTMLInputElement).checked.toString());
}

document.getElementById("discoverHide").onchange = function () {
    localStorage.setItem("discoverHide", (this as HTMLInputElement).checked.toString());
    location.reload();
}

document.getElementById("autoPause").onchange = function () {
    localStorage.setItem("autoPause", (this as HTMLInputElement).checked.toString());
}


document.getElementById("hideNotification").onchange = function () {
    localStorage.setItem("hideNotification", (this as HTMLInputElement).checked.toString());
}

document.getElementById("fancyHome").onchange = function () {
    localStorage.setItem("fancyHome", (this as HTMLInputElement).checked.toString());
    location.reload();
}

document.getElementById("alwaysDown").onchange = function () {
    localStorage.setItem("alwaysDown", (this as HTMLInputElement).checked.toString());
}

document.getElementById("9animeHelper").oninput = function () {
    localStorage.setItem("9anime", (this as HTMLInputElement).value);
}

document.getElementById("9animeAPIKey").oninput = function () {
    localStorage.setItem("apikey", (this as HTMLInputElement).value);
}

function switchOption(value: string) {
    if (value === "true") {
        document.getElementById("themeMainCon").style.display = "none";
        document.getElementById("imageInput").style.display = "table-row";
        document.getElementById("blurInput").style.display = "table-row";
    } else {
        document.getElementById("imageInput").style.display = "none";
        document.getElementById("blurInput").style.display = "none";
        document.getElementById("themeMainCon").style.display = "block";
    }
}

document.getElementById("useImageBack").onchange = function () {
    localStorage.setItem("useImageBack", (this as HTMLInputElement).checked.toString());
    switchOption((this as HTMLInputElement).checked.toString());
    (<cordovaWindow>window.parent).updateImage();
}

document.getElementById("rangeCon").addEventListener("touchmove", function (event: TouchEvent) {
    event.stopPropagation();
});


(document.getElementById("outlineColor") as HTMLInputElement).value = localStorage.getItem("outlineColor");
(document.getElementById("outlineWidth") as HTMLInputElement).value = localStorage.getItem("outlineWidth");
(document.getElementById("backgroundBlur") as HTMLInputElement).value = localStorage.getItem("backgroundBlur");
(document.getElementById("fmoviesBase") as HTMLInputElement).value = localStorage.getItem("fmoviesBaseURL");
(document.getElementById("themeColor") as HTMLInputElement).value = localStorage.getItem("themecolor");
(document.getElementById("9animeHelper") as HTMLInputElement).value = localStorage.getItem("9anime");
(document.getElementById("9animeAPIKey") as HTMLInputElement).value = localStorage.getItem("apikey");
(document.getElementById("downloadTimeout") as HTMLInputElement).value = localStorage.getItem("downloadTimeout");
(document.getElementById("scrollBool") as HTMLInputElement).checked = localStorage.getItem("scrollBool") !== "false";
(document.getElementById("discoverHide") as HTMLInputElement).checked = localStorage.getItem("discoverHide") === "true";
(document.getElementById("autoPause") as HTMLInputElement).checked = localStorage.getItem("autoPause") === "true";
(document.getElementById("hideNotification") as HTMLInputElement).checked = localStorage.getItem("hideNotification") === "true";
(document.getElementById("fancyHome") as HTMLInputElement).checked = localStorage.getItem("fancyHome") === "true";
(document.getElementById("alwaysDown") as HTMLInputElement).checked = localStorage.getItem("alwaysDown") === "true";
(document.getElementById("useImageBack") as HTMLInputElement).checked = localStorage.getItem("useImageBack") === "true";
(document.getElementById("offline") as HTMLInputElement).checked = (localStorage.getItem("offline") === 'true');



document.getElementById("reset").addEventListener("click", function () {
    window.parent.postMessage({ "action": 22, data: "" }, "*");

});


function changeServer() {
    window.parent.postMessage({ "action": 26, data: "settings.html" }, "*");

}


function toggleMenu(state?: string) {
    let menuI = document.getElementById("menuIcon");
    let menuElem = document.getElementById("menu");
    let conElem = document.getElementById("con_11");

    if (state) {
        menuElem.setAttribute("data-open", state);
    }
    if (menuElem.getAttribute("data-open") === "0") {
        conElem.style.transform = "scale(0.8) translateX(300px)";
        conElem.style.opacity = "0.6";
        conElem.style.pointerEvents = "none";
        document.getElementById("toggleMenuOpen").style.display = "block";
        menuElem.setAttribute("data-open", "1");
        menuElem.style.transform = "translateX(0px)";
        menuElem.style.opacity = "1";
        menuElem.style.pointerEvents = "auto";
        menuI.classList.add("change");

        addState("menu");
    } else {
        conElem.style.transform = "scale(1) translateX(0)";
        conElem.style.opacity = "1";
        conElem.style.pointerEvents = "auto";
        document.getElementById("toggleMenuOpen").style.display = "none";

        menuElem.setAttribute("data-open", "0");
        menuElem.style.transform = "translateX(-200px)";
        menuElem.style.opacity = "0";
        menuElem.style.pointerEvents = "none";
        menuI.classList.remove("change");

    }
}

document.getElementById("menuIcon").addEventListener("click", function () {
    toggleMenu();
});


window.onmessage = function (x) {

    if (parseInt(x.data.action) == 200) {
        token = x.data.data;
        if (config.chrome == false && token.indexOf("connect.sid") == -1) {
            window.parent.postMessage({ "action": 21, data: "" }, "*");

        } else {
            getUserInfo();

        }
    } else if (document.getElementById("queueCon").getAttribute("data-conopen") == "true") {
        if (x.data.action == "activeUpdate") {
            reloadQueue(1);
        } else if (x.data.action == "doneUpdate") {
            reloadQueue(2);
        } else if (x.data.action == "paused") {
            document.getElementById("queueButton").className = "queuePlay";
            document.getElementById("queueButton").setAttribute("data-paused", "true");
        }
        else if (x.data.action == "percentageUpate") {
            if (document.getElementById("downloadingPercent")) {
                if (parseInt(x.data.data) == 100) {
                    document.getElementById("downloadingPercent").innerText = "Storing the downloaded data...";

                } else {
                    document.getElementById("downloadingPercent").innerText = x.data.data + "%";
                }
            }
        }
    }
};


var rooms: Array<string | number>;
var token;
var rooms_order: Array<number>;
var selectedShow = null;
var permNoti = null;
var check_sort = 0;
var yy;
var saveCheck = 0;
var last_order;

// todo
// @ts-ignore
function toFormData(formObject: { [key: string]: string }) {
    const form = new FormData();
    for (const value in formObject) {
        form.append(value, formObject[value]);
    }
    return form;
}





var username = "hi";




function open_menu(x) {
    let state = x.parentElement.getAttribute("data-state-menu");
    if (state == "open") {
        x.parentElement.style.width = "40px";
        x.parentElement.style.zIndex = "0";
        x.parentElement.setAttribute("data-state-menu", "closed");
        x.style.transform = "rotate(0deg)";
    } else {
        x.parentElement.style.width = "auto";
        x.parentElement.style.zIndex = "99";
        x.parentElement.setAttribute("data-state-menu", "open");
        x.style.transform = "rotate(45deg)";

    }
}



function watched_card(y) {
    var x = y.getAttribute("data-showname");
    selectedShow = x;
    document.getElementById("room_add_show").style.display = "flex";
    addState("movecat")

}

function makeRoomElem(roomID, roomName, add = false) {
    let className = "room_card_delete";

    if (add) {
        className = "draggable_room add_to_room";
    }

    let tempDiv = createElement({ "class": "room_card_con", "attributes": { "data-roomid": roomID }, "listeners": {} });
    let tempDiv2 = createElement({ "class": "room_card", "attributes": {}, "listeners": {} });
    let tempDiv3 = createElement({ "class": "room_text", "attributes": {}, "listeners": {}, "innerText": roomName });
    let tempDiv4 = createElement({
        "class": className, "attributes": { "data-roomid": roomID }, "listeners": {
            "click": function () {
                if (add) {
                    ini_api.change_state(this);
                } else {
                    ini_api.delete_room(this);
                }
            }
        }
    });

    tempDiv2.append(tempDiv3);
    tempDiv2.append(tempDiv4);
    if (!add) {
        tempDiv2.append(createElement({ "class": "draggable_room", "attributes": {}, "listeners": {} }));
    }
    tempDiv.append(tempDiv2);
    return tempDiv;
}


function updateRoomDis() {

    rooms2 = rooms.slice(0);
    document.getElementById("room_dis_child").innerHTML = "";

    for (var i = 0; i < rooms_order.length; i++) {
        let roomIndex = rooms2.indexOf(rooms_order[i]);
        let roomID = rooms2[roomIndex + 0];
        let roomName = rooms2[roomIndex - 1];
        if (roomIndex > -1) {
            document.getElementById("room_dis_child").append(makeRoomElem(roomID, roomName));
            rooms2.splice(roomIndex - 1, 2);
        }
    }

    for (var i = 0; i < rooms2.length; i += 2) {
        let roomID = rooms2[i + 1];
        let roomName = rooms2[i];
        document.getElementById("room_dis_child").append(makeRoomElem(roomID, roomName));
    }
}


function updateRoomAdd() {
    rooms2 = rooms.slice(0);
    document.getElementById("room_add_child").innerHTML = "";

    document.getElementById("room_add_child").append(makeRoomElem(0, "Recently Watched", true));
    document.getElementById("room_add_child").append(makeRoomElem(-1, "Ongoing", true));

    for (var i = 0; i < rooms_order.length; i++) {
        let roomIndex = rooms2.indexOf(rooms_order[i]);
        let roomID = rooms2[roomIndex + 0];
        let roomName = rooms2[roomIndex - 1];
        if (roomIndex > -1) {
            document.getElementById("room_add_child").append(makeRoomElem(roomID, roomName, true));
            rooms2.splice(roomIndex - 1, 2);
        }
    }


    for (var i = 0; i < rooms2.length; i += 2) {
        let roomID = rooms2[i + 1];
        let roomName = rooms2[i];
        document.getElementById("room_add_child").append(makeRoomElem(roomID, roomName, true));
    }
}
if (isSnapSupported) {
    let scrollLastIndex;
    let tempCatDOM = document.getElementsByClassName("categories");
    let cusRoomDOM = document.getElementById("custom_rooms");
    cusRoomDOM.addEventListener("scroll", function () {
        let unRoundedIndex = cusRoomDOM.scrollLeft / cusRoomDOM.offsetWidth;
        let index = Math.round(unRoundedIndex);

        if (index != scrollLastIndex) {
            for (let i = 0; i < tempCatDOM.length; i++) {
                if (i == index) {
                    tempCatDOM[i].classList.add("activeCat");
                    tempCatDOM[i].scrollIntoView();
                    localStorage.setItem("currentCategory", tempCatDOM[i].getAttribute("data-id"));
                } else {
                    tempCatDOM[i].classList.remove("activeCat");
                }
            }

            let activeCatDOM = document.querySelector(".categories.activeCat") as HTMLElement;
            let temp = document.getElementById("catActiveMain") as HTMLElement;
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    if (temp && activeCatDOM) {
                        temp.style.left = activeCatDOM.offsetLeft.toString();
                        temp.style.height = activeCatDOM.offsetHeight.toString();
                        temp.style.width = activeCatDOM.offsetWidth.toString();
                    }
                });
            });
        }
        scrollLastIndex = index;
    }, { "passive": true });
}

function makeDiscoverCard(data, engine, engineName) {
    let tempDiv1 = createElement({ "class": "s_card" });
    tempDiv1.style.backgroundImage = `url("${data.image}")`;
    let tempDiv2 = createElement({ "class": "s_card_bg" });
    let tempDiv3 = createElement({ "class": "s_card_title" });
    let tempDiv4 = createElement({ "class": "s_card_title_main", "innerText": data.name, "style": { "text-decoration": "none" } });
    let tempDivEx = createElement({ "class": "card_title_extension", "attributes": {}, "listeners": {}, "innerText": engineName });
    let tempDiv5;


    tempDiv5 = createElement({
        "element": "div", "class": "s_card_play",
        "attributes": {
            "data-href": data.link
        },
        "listeners": {
            "click": async function () {

                let curLink = this.getAttribute("data-href");

                if (data.getLink === true) {
                    sendNoti([0, "", "Alert", "Redirecting. Wait a moment..."]);

                    let extensionList = (<cordovaWindow>window.parent).returnExtensionList();

                    try {
                        let episodeLink = await extensionList[engine].getDiscoverLink(curLink);
                        curLink = `pages/episode/index.html?watch=${episodeLink}&engine=${engine}`;
                    } catch (err) {
                        sendNoti([2, "red", "Alert", "An unexpected error has occurred."]);
                        console.error(err);
                    }

                } else {
                    curLink = `pages/episode/index.html?watch=${curLink}&engine=${engine}`;
                }

                window.parent.postMessage({ "action": 500, data: curLink }, "*");

            }
        }
    });




    tempDiv3.append(tempDiv4);
    tempDiv2.append(tempDiv3);
    tempDiv2.append(tempDiv5);
    tempDiv1.append(tempDiv2);
    tempDiv1.append(tempDivEx);

    return tempDiv1;
}
async function populateDiscover() {
    let extensionList = (<cordovaWindow>window.parent).returnExtensionList();
    let extensionNames = (<cordovaWindow>window.parent).returnExtensionNames();
    let disCon = document.getElementById("discoverCon");
    let parents = [];
    let exTitle = [];

    for (let i = 0; i < extensionList.length; i++) {
        parents.push(createElement({
            "style": {
                "display": "none",
                "height": "280px",
                "marginBottom": "40px",
                "width": "100%",
                "whiteSpace": "nowrap",
                "overflowX": "auto"
            }
        }));

        exTitle.push(createElement({
            "style": {
                "display": "none",
            },
            "class": "discoverTitle",
            "innerText": extensionNames[i]
        }));

        disCon.append(exTitle[i]);
        disCon.append(parents[i]);

    }
    for (let i = 0; i < extensionList.length; i++) {
        let engine = i;
        try {
            extensionList[engine]["discover"]().then(function (data: extensionDiscoverData[]) {
                console.log("here", data);
                let parentDiscover = parents[engine];
                let titleDiscover = exTitle[engine];
                for (const card of data) {
                    if (card.link === null) {
                        continue;
                    }

                    if (engine == 1) {
                        let index = card.link.lastIndexOf("/");
                        card.link = card.link.substring(0, index);
                    }

                    parentDiscover.append(makeDiscoverCard(card, engine, extensionNames[engine]));
                }

                parentDiscover.style.display = "block";
                titleDiscover.style.display = "inline-block";

            }).catch(function (err) {
                console.error(err);
            });
        } catch (err) {
            console.error(err);
        }
    }


    disCon.append(createElement({
        "style": {
            "width": "100%",
            "height": "70px"
        }
    }));
}

function addCustomRoom() {

    rooms2 = rooms.slice(0);
    document.getElementById("custom_rooms").innerHTML = "";
    document.getElementById("categoriesCon").innerHTML = `
    <div id="catActive">
        <div style="position: absolute;background: red;" id="catActiveMain"></div>
    <div>`;

    let tempRecent = createCat("room_recently", "Recently Watched");
    tempRecent.id = "recentlyCat";
    document.getElementById("categoriesCon").append(tempRecent);

    document.getElementById("custom_rooms").append(createElement({
        "class": `categoriesDataMain${(localStorage.getItem("currentCategory") === "room_recently") ? " active" : ""}${(isSnapSupported) ? " snappedCategoriesDataMain" : ""}`,
        "id": `room_recently`
    }));


    let tempOngoing = createCat("room_-1", "Ongoing");
    tempOngoing.id = "ongoingCat";
    document.getElementById("categoriesCon").append(tempOngoing);

    document.getElementById("custom_rooms").append(createElement({
        "class": `categoriesDataMain${(localStorage.getItem("currentCategory") === "room_-1") ? " active" : ""}${(isSnapSupported) ? " snappedCategoriesDataMain" : ""}`,
        "id": `room_-1`
    }));

    if (localStorage.getItem("discoverHide") !== "true" && localStorage.getItem("offline") !== 'true') {
        let tempDiscover = createCat("discoverCon", "Discover");
        tempDiscover.id = "discoverCat";
        document.getElementById("categoriesCon").append(tempDiscover);


        document.getElementById("custom_rooms").append(createElement({
            "class": `categoriesDataMain${(localStorage.getItem("currentCategory") === "discoverCon") ? " active" : ""}${(isSnapSupported) ? " snappedCategoriesDataMain" : ""}`,
            "id": `discoverCon`
        }));
    }

    for (var i = 0; i < rooms_order.length; i++) {

        let yye = rooms2.indexOf(rooms_order[i]);
        if (yye > -1) {

            let roomID = `room_${rooms2[yye]}`;
            let tempDiv = createElement({
                "class": `categoriesDataMain${(localStorage.getItem("currentCategory") === roomID) ? " active" : ""}${(isSnapSupported) ? " snappedCategoriesDataMain" : ""}`,
                "id": roomID
            });

            let tempDiv2 = createCat(roomID, rooms2[yye - 1]);


            document.getElementById("categoriesCon").append(tempDiv2);
            document.getElementById("custom_rooms").append(tempDiv);
            rooms2.splice(yye - 1, 2);


        }



    }


    for (var i = 0; i < rooms2.length; i += 2) {



        let roomID = `room_${rooms2[i + 1]}`;
        let tempDiv = createElement({
            "class": `categoriesDataMain${(localStorage.getItem("currentCategory") === roomID) ? " active" : ""}${(isSnapSupported) ? " snappedCategoriesDataMain" : ""}`,
            "id": roomID
        });


        let tempDiv2 = createCat(roomID, rooms2[i]);

        document.getElementById("categoriesCon").append(tempDiv2);
        document.getElementById("custom_rooms").append(tempDiv);

    }


    if (document.querySelector(".categories.activeCat") === null) {
        document.getElementById("room_recently").classList.add("active");
        document.getElementById("recentlyCat").classList.add("activeCat");
    }
    try {


        document.querySelector(".categories.activeCat").scrollIntoView();
        let activeCatDOM = document.querySelector(".categories.activeCat") as HTMLElement;
        let temp = document.getElementById("catActiveMain") as HTMLElement;
        window.requestAnimationFrame(function () {
            if (temp && activeCatDOM) {
                activeCatDOM.click();
                temp.style.left = activeCatDOM.offsetLeft.toString();
                temp.style.height = activeCatDOM.offsetHeight.toString();
                temp.style.width = activeCatDOM.offsetWidth.toString();
            }
        });
    } catch (err) {

    }

    if (localStorage.getItem("discoverHide") !== "true" && localStorage.getItem("offline") !== 'true' && firstLoad) {
        firstLoad = false;
        populateDiscover();
    }
}

// todo
// @ts-ignore
function getUserInfo() {
    ini_api.get_userinfo();
}




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

function img_url(url: string | undefined) {
    try {
        return url.replace("file:", "https:");
    } catch (err) {
        return url;
    }
}

function sendNoti(x) {

    return new notification(document.getElementById("noti_con"), {
        "perm": x[0],
        "color": x[1],
        "head": x[2],
        "notiData": x[3]
    });
}




if (true) {
    var a = document.getElementsByClassName("card_con") as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < a.length; i++) {
        a[i].style.display = "block";
    }


    function hide_dom(x) {
        x.parentElement.style.display = "none";
    }



    function hide_dom2(x) {
        if (last_order != getCurrentOrder()) {
            if (confirm("Are you sure you want to close without saving?")) {
                x.parentElement.style.display = "none";


            }
        } else {
            x.parentElement.style.display = "none";


        }
    }




    function getCurrentOrder(): string {
        let elems = document.getElementById("room_dis_child").getElementsByClassName("room_card_con");
        let room_temp = [];

        for (var i = 0; i < elems.length; i++) {
            room_temp.push(parseInt(elems[i].getAttribute("data-roomid")));
        }
        return room_temp.join(',');
    }



    function add_room_open() {
        document.getElementById("room_con").style.display = "flex";
        addState("addcat");
    }




    function show_room_open() {
        updateRoomDis();
        last_order = getCurrentOrder();
        document.getElementById("room_dis").style.display = "flex";
        addState("reordercat");
    }




    var api = {
        add_room: () => {
            let data_in = (document.getElementById("pass_f") as HTMLInputElement).value;
            document.getElementById("room_con").style.display = 'none';
            (<cordovaWindow>window.parent).apiCall("POST", { "action": 10, "username": username, "room": data_in }, getUserInfo);
        },

        delete_room: (domelem) => {
            if (confirm("Are you sure you want to delete this card?")) {
                let room_id = domelem.getAttribute("data-roomid");
                (<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 12, "id": room_id }, getUserInfo);


            }


        },

        change_order: () => {

            let room_temp = getCurrentOrder();
            (<cordovaWindow>window.parent).apiCall("POST", { "action": 13, "username": username, "order": room_temp }, getUserInfo);

        },

        change_state: (domelem) => {
            let state = domelem.getAttribute("data-roomid");
            (<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 7, "name": selectedShow, "state": state }, getUserInfo);
            document.getElementById("room_add_show").style.display = "none";
        },

        change_image_card: (name, domelem) => {


            var img_url_prompt = prompt("Enter the URL of the image", domelem.getAttribute("data-bg1"));
            var main_url_prompt = prompt("Enter the URL of the page", domelem.getAttribute("data-main-link"));

            if (img_url_prompt != "" && img_url_prompt != null && img_url_prompt != undefined) {
                img_url_prompt = img_url_prompt;


                (<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 9, "name": name, "img": img_url_prompt }, getUserInfo, [domelem, img_url_prompt]);




            }


            if (main_url_prompt != "" && main_url_prompt != null && main_url_prompt != undefined) {

                (<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 14, "name": name, "url": main_url_prompt }, change_url_callback, [domelem]);




            }




        },

        delete_card: (x, domelem) => {



            if (confirm("Are you sure you want to delete this show from your watched list?")) {
                (<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 6, "name": x }, delete_card_callback, [domelem]);



            }

        },


        get_userinfo: () => {
            permNoti = sendNoti([0, null, "Message", "Syncing with the server..."]);

            (<cordovaWindow>window.parent)
                .apiCall("POST", { "username": username, "action": 4 }, get_userinfo_callback, [])
                .then(() => {
                    console.log("Success.");
                })
                .catch((err: Error) => {
                    const errorCon = document.getElementById("custom_rooms");
                    constructErrorPage(errorCon, err.message, {
                        "hasReload": true,
                        "hasLink": false
                    });
                });

            permNoti.remove();
        }

    }


    function change_image_callback(x, y, z) {

        x.setAttribute("data-bg1", z.data.image);
        x.parentElement.parentElement.parentElement.style.backgroundImage = "url('" + z.data.image + "')";


    }

    function change_url_callback(x, z) {

        x.setAttribute("data-main-link", z.data.url);
        x.parentElement.parentElement.getElementsByClassName("s_card_title_main")[0].href = z.data.url

    }
    function delete_card_callback(x) {
        x.parentElement.parentElement.parentElement.remove();
    }

    async function updateNewEpCached() {
        for (const dom of document.getElementById("room_-1").querySelectorAll(".s_card")) {
            (dom as HTMLElement).style.border = "none";
        }
        let updateLibNoti = sendNoti([0, null, "Message", "Fetching cached data..."]);
        for (const show of flaggedShow) {
            try {
                let lastestEp = await showLastEpDB.lastestEp.where({ "name": show.name }).toArray();
                if (lastestEp.length != 0) {
                    lastestEp = lastestEp[0].latest;
                    if (show.currentEp != lastestEp) {
                        show.dom.style.boxSizing = "border-box";
                        show.dom.style.border = "3px solid white";
                    }
                }
            } catch (err) {

            }
        }

        try {
            updateLibNoti.noti.remove();
        } catch (err) {

        }


    }
    async function updateNewEp() {
        let updateLibNoti = sendNoti([0, null, "Message", "Updating Libary"]);
        let updatedShow = [];
        let extensionList = (<cordovaWindow>window.parent).returnExtensionList();
        let promises = [];
        let promiseShowData = [];
        let allSettled = "allSettled" in Promise;
        // let allSettled = false;

        for (let show of flaggedShow) {
            let showURL = show.showURL;
            showURL = showURL.replace("?watch=/", "");
            let currentEp = show.currentEp;


            let currentEngine;
            let temp = showURL.split("&engine=");
            if (temp.length == 1) {
                currentEngine = extensionList[0];
            } else {
                currentEngine = parseInt(temp[1]);
                currentEngine = extensionList[currentEngine];
            }

            promises.push(currentEngine.getAnimeInfo(showURL));
            promiseShowData.push({
                "ep": currentEp,
                "dom": show.dom,
                "name": show.name
            });
        }

        let promiseResult = [];
        try {
            if (allSettled) {
                let res = await Promise.allSettled(promises);
                for (let promise of res) {
                    if (promise.status === "fulfilled") {
                        promiseResult.push(promise.value);
                    } else {
                        promiseResult.push(null);
                    }
                }
            } else {
                promiseResult = await Promise.all(promises);
            }


            await showLastEpDB.lastestEp.clear();

            let count = 0;
            for (let promise of promiseResult) {
                try {
                    if (promise === null) {
                        sendNoti([0, "red", "Error", `Could not update ${fix_title(promiseShowData[count].name)}`]);
                        promiseShowData[count].dom.style.boxSizing = "border-box";
                        promiseShowData[count].dom.style.border = "3px solid grey";
                    } else {
                        let latestEpisode = promise.episodes;
                        latestEpisode = latestEpisode[latestEpisode.length - 1].link;
                        if (promiseShowData[count].ep != latestEpisode) {
                            await showLastEpDB.lastestEp.put({ "name": promiseShowData[count].name, "latest": latestEpisode });
                            promiseShowData[count].dom.style.boxSizing = "border-box";
                            promiseShowData[count].dom.style.border = "3px solid white";
                        } else {
                            promiseShowData[count].dom.style.boxSizing = "content-box";
                            promiseShowData[count].dom.style.border = "none";
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
                count++;
            }

            try {
                updateLibNoti.noti.remove();
            } catch (err) {

            }
        } catch (err) {
            alert("Couldn't update the library");
            console.error(err);
            console.error("Error 342");
        }
    }

    function helpUpdateLib() {
        alert("Outlines the shows that have new unwatched episodes. This is automatically updated twice a day, but you can manually do it by clicking on \"Update Library\". This may take tens of seconds.");
    }


    async function get_userinfo_callback(response) {
        flaggedShow = [];

        document.getElementById("room_dis_child").innerHTML = "";
        document.getElementById("room_add_child").innerHTML = "";
        let offlineMode = localStorage.getItem("offline") === "true";

        if (offlineMode) {
            await populateDownloadedArray();
        }
        let a = response.data;

        rooms = a[1].slice(0);
        let data = a[0];

        rooms_order = [];
        if (a[2].length > 0) {
            rooms_order = a[2][0].split(",");

            for (var i = 0; i < rooms_order.length; i++) {
                // todo
                rooms_order[i] = parseInt(rooms_order[i].toString());

            }
        }






        updateRoomDis();
        updateRoomAdd();
        addCustomRoom();
        let extensionNames = (<cordovaWindow>window.parent).returnExtensionNames();
        let extensionList = (<cordovaWindow>window.parent).returnExtensionList();

        if (!offlineMode) {
            let updateLibCon = createElement({
                "style": {
                    "width": "100%",
                    "bottomMargin": "10px",
                    "textAlign": "center"
                }
            });

            let updateLibButton = createElement({
                "id": "updateLib",
                "innerText": "Update Library"
            });

            let updateLibInfo = createElement({
                "id": "infoBut",
            });

            updateLibInfo.onclick = function () {
                helpUpdateLib();
            };

            updateLibButton.onclick = function () {
                updateNewEp();
            }

            updateLibCon.append(updateLibButton);
            updateLibCon.append(updateLibInfo);

            document.getElementById('room_-1').append(
                updateLibCon
            );
        }

        for (var i = 0; i < data.length; i++) {
            let domToAppend;
            let findUnwatched = false;
            if (offlineMode) {
                if (data[i][0] in downloadedFolders) {
                    delete downloadedFolders[data[i][0]];
                }
            }

            if (document.getElementById(`room_${data[i][4]}`)) {
                domToAppend = document.getElementById(`room_${data[i][4]}`);
            } else {
                domToAppend = document.getElementById('room_recently');
            }

            domToAppend.setAttribute("data-empty", "false");

            if (parseInt(data[i][4]) == -1) {
                findUnwatched = true;
            }

            let tempDiv = createElement({ "class": "s_card", "attributes": {}, "listeners": {} });

            tempDiv.append(createElement({
                element: "img",
                class: "cardImage",
                attributes: {
                    "src": img_url(data[i][2]),
                    "loading": "lazy",
                }
            }));

            let tempDiv1 = createElement({ "class": "s_card_bg", "attributes": {}, "listeners": {} });
            let tempDiv2 = createElement({ "class": "s_card_title", "attributes": {}, "listeners": {} });

            let currentExtensionName = "null";
            let currentExtension = null;
            try {
                let engineTemp = data[i][5].split("engine=");
                let engine;
                if (engineTemp.length == 1) {
                    engine = 0;
                } else {
                    engine = parseInt(engineTemp[1]);
                }

                currentExtensionName = extensionNames[engine];
                currentExtension = extensionList[engine];
            } catch (err) {
                console.error(err);
                console.error(data[i]);
            }

            let tempDivEx = createElement({ "class": "card_title_extension", "attributes": {}, "listeners": {}, "innerText": currentExtensionName });


            let tempDiv3 = document.createElement("div");
            tempDiv3.className = "s_card_title_main";
            tempDiv3.textContent = (currentExtension && "fixTitle" in currentExtension) ? fix_title(currentExtension.fixTitle(data[i][0])) : fix_title(data[i][0]);
            tempDiv3.setAttribute("data-href", data[i][5]);
            tempDiv3.setAttribute("data-current", data[i][3]);
            tempDiv3.setAttribute("data-mainname", data[i][0]);

            if (findUnwatched) {
                flaggedShow.push({
                    "showURL": data[i][5],
                    "currentEp": data[i][3],
                    "dom": tempDiv,
                    "name": data[i][0]
                });
            }

            tempDiv3.onclick = function () {
                localStorage.setItem("currentLink", (this as HTMLElement).getAttribute("data-current"));
                window.parent.postMessage({ "action": 500, data: "pages/episode/index.html" + (this as HTMLElement).getAttribute("data-href") }, "*");

            };

            let tempDiv4 = createElement({ "class": "card_ep", "attributes": {}, "listeners": {}, "innerText": `Episode ${data[i][1]}` });
            let tempDiv5 = createElement({
                "class": "s_card_delete", "attributes": {
                    "data-showname": data[i][0]

                }, "listeners": {
                    "click": function () {
                        ini_api.delete_card(this.getAttribute("data-showname"), this);
                    }
                }
            });

            let tempDiv6 = createElement({
                "class": "s_card_play", "attributes": {
                    "data-href": data[i][3],
                    "data-mainname": data[i][0]
                }, "listeners": {
                    "click": function () {
                        localStorage.setItem("mainName", this.getAttribute("data-mainname"));
                        window.parent.postMessage({ "action": 4, "data": this.getAttribute("data-href") }, "*");
                    }
                }, "element": "div"
            });

            let tempDiv7 = createElement({ "class": "card_menu", "attributes": {}, "listeners": {} });

            let tempDiv8 = createElement({
                "class": "card_menu_item card_menu_icon_add", "attributes": {}, "listeners": {
                    "click": function () {
                        open_menu(this);
                    }
                }
            });

            let tempDiv9 = createElement({
                "class": "card_menu_item card_menu_icon_delete", "attributes": {
                    "data-showname": data[i][0]
                }, "listeners": {
                    "click": function () {
                        ini_api.delete_card(this.getAttribute("data-showname"), this);
                    }
                }
            });

            let tempDiv10 = createElement({
                "class": "card_menu_item card_menu_icon_image", "attributes": {
                    "data-bg1": data[i][2],
                    "data-main-link": data[i][5],
                    "data-showname": data[i][0]
                }, "listeners": {
                    "click": function () {
                        ini_api.change_image_card(this.getAttribute("data-showname"), this);
                    }
                }
            });

            let tempDiv11 = createElement({
                "class": "card_menu_item card_menu_icon_watched", "attributes": {
                    "data-showname": data[i][0]
                }, "listeners": {
                    "click": function () {
                        watched_card(this);
                    }
                }
            });

            tempDiv7.append(tempDiv8);
            tempDiv7.append(tempDiv9);
            tempDiv7.append(tempDiv10);
            tempDiv7.append(tempDiv11);

            tempDiv2.append(tempDiv3);
            tempDiv2.append(tempDiv4);

            tempDiv1.append(tempDiv2);
            tempDiv1.append(tempDiv5);
            tempDiv1.append(tempDiv6);
            tempDiv1.append(tempDiv7);
            tempDiv1.append(tempDivEx);
            tempDiv.append(tempDiv1);

            try {
                if (data[i].length >= 7 && JSON.parse(data[i][6])[1] > 0) {
                    let progData = JSON.parse(data[i][6]);
                    let tempProgDiv = createElement({
                        "class": "episodesProgressCon",
                    });

                    tempProgDiv.append(createElement({
                        "class": "episodesProgress",
                        "style": {
                            "width": `${100 * (parseInt(progData[0]) / parseInt(progData[1]))}%`
                        }
                    }));

                    tempDiv1.append(tempProgDiv);

                }
            } catch (err) {

            }
            domToAppend.append(tempDiv);

        }

        pullTabArray = [];

        last_order = getCurrentOrder();

        if (permNoti != null) {
            if (permNoti.noti) {
                permNoti.noti.remove();

            }
        }

        if (offlineMode) {
            for (let showname in downloadedFolders) {
                if (showname == "socialsharing-downloads") {
                    continue;
                }

                let domToAppend = document.getElementById('room_recently');

                let tempDiv = createElement({ "class": "s_card", "attributes": {}, "listeners": {} });
                tempDiv.style.backgroundImage = `url("../../assets/images/placeholder.jpg")`;

                let tempDiv1 = createElement({ "class": "s_card_bg", "attributes": {}, "listeners": {} });
                let tempDiv2 = createElement({ "class": "s_card_title", "attributes": {}, "listeners": {} });


                let tempDiv3 = document.createElement("div");
                tempDiv3.className = "s_card_title_main";
                tempDiv3.textContent = fix_title(showname);
                tempDiv3.setAttribute("data-href", "?watch=/" + showname);

                let tempDiv7 = createElement({ "class": "card_menu", "attributes": {}, "listeners": {} });

                let tempDiv9 = createElement({
                    "class": "card_menu_item card_menu_icon_delete", "attributes": {
                        "data-showname": showname
                    },
                    "listeners": {
                        "click": async function () {
                            try {
                                await (<cordovaWindow>window.parent).removeDirectory(`${showname}`);
                                tempDiv.remove();
                            } catch (err) {
                                alert("Could not delete the files. You have to manually delete it by going to the show's page.");
                            }
                        }
                    }
                });

                tempDiv3.onclick = function () {
                    window.parent.postMessage({ "action": 500, data: "pages/episode/index.html" + (this as HTMLElement).getAttribute("data-href") }, "*");
                };




                tempDiv2.append(tempDiv3);

                tempDiv1.append(tempDiv2);
                tempDiv7.append(tempDiv9);

                tempDiv1.append(tempDiv7);

                tempDiv.append(tempDiv1);

                domToAppend.append(tempDiv);
            }
        }

        let catMainDOM = document.getElementsByClassName("categoriesDataMain") as HTMLCollectionOf<HTMLElement>;
        for (var i = 0; i < catMainDOM.length; i++) {
            pullTabArray.push(new pullToRefresh(catMainDOM[i]));
            if (catMainDOM[i].id == "discoverCon") {
                continue;
            }

            if (catMainDOM[i].getAttribute("data-empty") !== "false") {
                constructErrorPage(
                    catMainDOM[i],
                    "So empty. Try searching things and adding it to the library!",
                    {
                        hasLink: true,
                        hasReload: false,
                        customConClass: "absolute",
                        isError: false,
                        linkClass: "search",
                        clickEvent: () => {
                            window.parent.postMessage({ "action": 500, data: "pages/search/index.html" }, "*");
                        }
                    }
                )
            }

            catMainDOM[i].append(createElement({
                "style": {
                    "width": "100%",
                    "height": "70px"
                }
            }));
        }

        if (isNaN(parseInt(localStorage.getItem("lastupdatelib")))) {
            localStorage.setItem("lastupdatelib", "0");
        }

        let curTime = (new Date()).getTime() / 1000;
        if (offlineMode) {

        } else if ((curTime - parseInt(localStorage.getItem("lastupdatelib"))) > 43200) {
            updateNewEp();
            localStorage.setItem("lastupdatelib", curTime.toString());
        } else {
            updateNewEpCached();
        }
    }

    var ini_api = api;


    if (config.local || localStorage.getItem("offline") === 'true') {
        getUserInfo();
    }
    else {
        window.parent.postMessage({ "action": 20, data: "" }, "*");
    }

    // @ts-ignore
    new Sortable(document.getElementById("room_dis_child"), {
        animation: 150,
        handle: '.draggable_room',
        ghostClass: 'room_card_ghost'
    });


    let verURL = "https://raw.githubusercontent.com/enimax-anime/enimax/main/version.json";

    if (config.firefox) {
        verURL = "https://raw.githubusercontent.com/enimax-anime/enimax-firefox-extension/main/version.json";
    } else if (config.chrome) {
        verURL = "https://raw.githubusercontent.com/enimax-anime/enimax-chrome-extension/main/version.json";

    }

    fetch(verURL)
        .then((x) => x.json())
        .then(function (x) {
            let curTime = Math.floor((new Date()).getTime() / 1000);
            let lastUpdate = parseInt(localStorage.getItem("lastUpdate"));

            let bool: boolean;
            if (isNaN(lastUpdate)) {
                bool = true;
            } else {
                bool = (curTime - lastUpdate) > 86400;   // 1 day
            }

            if (x.version != localStorage.getItem("version") && bool) {
                sendNoti([0, "", "New update!", x.message]);
                localStorage.setItem("lastUpdate", curTime.toString());
            }
        }).catch((err) => {
            console.error(err);
        });

}





function changeEngine() {
    let val = localStorage.getItem("currentEngine");
    if (val == null || val == "1") {
        localStorage.setItem("currentEngine", "0");

    } else {
        localStorage.setItem("currentEngine", '1');

    }
}

for (let element of document.getElementsByClassName("menuItem")) {
    element.addEventListener("click", () => { toggleMenu() });
}


applyTheme();
switchOption(localStorage.getItem("useImageBack"));

let bgGradientIndex = parseInt(localStorage.getItem("themegradient"));

function selectTheme(index: number) {
    window.parent.postMessage({ "action": "updateGrad", data: index }, "*");
    let themeCount = 0;
    for (let themeElem of document.getElementsByClassName("themesContainer")) {
        if (themeCount == index) {
            themeElem.classList.add("selected");
        } else {
            themeElem.classList.remove("selected");
        }
        themeCount++;
    }
}

let menuP = new menuPull(document.getElementById("con_11"), toggleMenu);
document.getElementById("toggleMenuOpen").addEventListener("click", () => { toggleMenu() });


let themeCount = 0;

for (let themeElem of (document.getElementsByClassName("themesContainer") as HTMLCollectionOf<HTMLElement>)) {
    let curCount = themeCount;
    if (bgGradientIndex == curCount) {
        themeElem.classList.add("selected");
    }

    themeElem.style.backgroundImage = backgroundGradients[curCount];
    themeElem.addEventListener("click", function () {
        selectTheme(curCount);
    });

    themeCount++;
}

(document.getElementById("opSlider") as HTMLInputElement).value = isNaN(parseFloat(localStorage.getItem("bgOpacity"))) ? "0.6" : parseFloat(localStorage.getItem("bgOpacity")).toString();
(document.getElementById("token") as HTMLElement).onclick = function () {
    const url = prompt("Enter the URL", "https://www.zoro.to");
    // @ts-ignore
    window.parent.getWebviewHTML(url, false, null, "console.log()");
}
document.getElementById("opSlider").oninput = function () {
    let elem = document.getElementById("opSlider") as HTMLInputElement;
    window.parent.postMessage({ "action": "updateOpacity", data: elem.value }, "*");
};

window.addEventListener("popstate", function (event) {
    console.log(states);
    try {
        stateAction[states]();
    } catch (err) {
        console.error(err);
    }
});
