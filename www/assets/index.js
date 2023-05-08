function createElement(config) {
    let temp;
    if ("element" in config) {
        temp = document.createElement(config.element);
    }
    else {
        temp = document.createElement("div");
    }
    let attributes = config.attributes;
    for (let value in attributes) {
        temp.setAttribute(value, attributes[value]);
    }
    for (let value in config.style) {
        temp.style[value] = config.style[value];
    }
    if ("id" in config) {
        temp.id = config.id;
    }
    if ("class" in config) {
        temp.className = config.class;
    }
    if ("innerText" in config) {
        temp.textContent = config.innerText;
    }
    if ("innerHTML" in config) {
        temp.innerHTML = config.innerHTML;
    }
    let listeners = config.listeners;
    for (let value in listeners) {
        temp.addEventListener(value, function () {
            listeners[value].bind(this)();
        });
    }
    return temp;
}
try {
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
    if (localStorage.getItem("outlineWidth") && isNaN(parseInt(localStorage.getItem("outlineColor")))) {
        document.getElementsByTagName("style")[0].sheet.insertRule(`*:focus {
            outline-width: ${parseInt(localStorage.getItem("outlineWidth"))}px !important;
            outline-style: solid !important;
            outline-color: ${(localStorage.getItem("outlineColor"))} !important;
        }`, 0);
    }
}
catch (err) {
}
function applyTheme() {
    let themeColorL = localStorage.getItem("themecolor");
    if (themeColorL) {
        document.documentElement.style.setProperty('--theme-color', themeColorL);
    }
    else {
        document.documentElement.style.setProperty('--theme-color', "#4b4bc2");
    }
}
function changeTheme() {
    let promptT = prompt("Enter the theme color", "#4b4bc2");
    if (promptT.trim() != "" && promptT != null && promptT != undefined) {
        localStorage.setItem("themecolor", promptT);
        applyTheme();
    }
    else {
    }
}
const isSnapSupported = CSS.supports('scroll-snap-align:start') && CSS.supports("scroll-snap-stop: always") && CSS.supports("scroll-snap-type: x mandatory") && localStorage.getItem("fancyHome") !== "true";
const backgroundGradients = [
    "linear-gradient(0deg, black 0 71%, var(--theme-color) 135% 100%)",
    "linear-gradient(to bottom, #000000, #000000)",
    "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)",
    "linear-gradient(to bottom, #c31432, #240b36)",
    "linear-gradient(to bottom, #c04848, #480048)",
    "linear-gradient(to bottom, #4b6cb7, #182848)",
    "linear-gradient(to bottom, #12c2e9, #c471ed, #f64f59)",
    "linear-gradient(to bottom, #00c6ff, #0072ff)",
    "linear-gradient(to bottom, #ec008c, #fc6767)",
    "linear-gradient(to bottom, #ffd89b, #19547b)"
];
function createCat(dataId, dataText, mode = 0) {
    return createElement({
        "class": `categories${(localStorage.getItem("currentCategory") === dataId) ? " activeCat" : ""}`,
        "attributes": {
            "data-id": dataId
        },
        "listeners": {
            "click": function () {
                let thisDataId = this.getAttribute("data-id");
                localStorage.setItem("currentCategory", thisDataId);
                if (!isSnapSupported) {
                    let tempCat = document.getElementsByClassName("categories");
                    for (let i = 0; i < tempCat.length; i++) {
                        if (this == tempCat[i]) {
                            tempCat[i].classList.add("activeCat");
                        }
                        else {
                            tempCat[i].classList.remove("activeCat");
                        }
                    }
                }
                let activeCatDOM = document.querySelector(".categories.activeCat");
                let temp = document.getElementById("catActiveMain");
                window.requestAnimationFrame(function () {
                    window.requestAnimationFrame(function () {
                        if (temp && activeCatDOM) {
                            temp.style.left = activeCatDOM.offsetLeft.toString();
                            temp.style.height = activeCatDOM.offsetHeight.toString();
                            temp.style.width = activeCatDOM.offsetWidth.toString();
                        }
                        if (isSnapSupported) {
                            let tempCatData = document.getElementsByClassName("categoriesDataMain");
                            for (let i = 0; i < tempCatData.length; i++) {
                                if (tempCatData[i].id == thisDataId) {
                                    tempCatData[i].classList.add("active");
                                    window.requestAnimationFrame(function () {
                                        window.requestAnimationFrame(function () {
                                            document.getElementById("custom_rooms").scrollTo(tempCatData[i].offsetLeft, 0);
                                        });
                                    });
                                }
                                else {
                                    tempCatData[i].classList.remove("active");
                                }
                            }
                        }
                        else {
                            setTimeout(function () {
                                let tempCatData = document.getElementsByClassName("categoriesDataMain");
                                for (let i = 0; i < tempCatData.length; i++) {
                                    if (tempCatData[i].id == thisDataId) {
                                        tempCatData[i].classList.add("active");
                                    }
                                    else {
                                        tempCatData[i].classList.remove("active");
                                    }
                                }
                            }, 200);
                        }
                    });
                });
            }
        }, "innerText": dataText
    });
}
// https://github.com/dysfunc/ascii-emoji
// http://asciimoji.com/
// const moji = "(╯°□°）╯︵ ┻━┻";
// const array = [];
// for(let i = 0; i < moji.length; i++){
//     array.push(moji.charCodeAt(i));
// }
const unicodeMojiCodes = [
    [123, 8226, 771, 95, 8226, 771, 125],
    [40, 9583, 176, 9633, 176, 65289, 9583, 65077, 32, 9531, 9473, 9531],
    [40, 9573, 65103, 9573, 41],
    [40, 12678, 32, 95, 32, 12678, 41],
    [40, 32, 48, 32, 95, 32, 48, 32, 41]
];
const unicodeMojiCodesPos = [
    [8834, 40, 9673, 8255, 9673, 41, 12388]
];
const unicodeMojis = [];
const unicodeMojisPos = [];
for (let uniCount = 0; uniCount < unicodeMojiCodes.length; uniCount++) {
    const codes = unicodeMojiCodes[uniCount];
    let emoji = "";
    for (let i = 0; i < codes.length; i++) {
        let hex = codes[i].toString(16);
        emoji += String.fromCodePoint(parseInt("0x" + hex));
    }
    unicodeMojis.push(emoji);
}
for (let uniCount = 0; uniCount < unicodeMojiCodesPos.length; uniCount++) {
    const codes = unicodeMojiCodesPos[uniCount];
    let emoji = "";
    for (let i = 0; i < codes.length; i++) {
        let hex = codes[i].toString(16);
        emoji += String.fromCodePoint(parseInt("0x" + hex));
    }
    unicodeMojisPos.push(emoji);
}
function constructErrorPage(errorCon, message, config) {
    const container = createElement({
        "id": "errorPageCon"
    });
    if (config.customConClass) {
        container.className = config.customConClass;
    }
    const errorMessage = createElement({});
    const icons = createElement({});
    const emojiVar = config.positive === true ? unicodeMojisPos : unicodeMojis;
    container.append(errorMessage);
    container.append(icons);
    if (config.hasLink) {
        icons.append(createElement({
            "class": `icon ${config.linkClass ? config.linkClass : "webview"}`,
            listeners: {
                click: config.clickEvent,
            }
        }));
    }
    if (config.hasReload) {
        icons.append(createElement({
            "class": "icon reload",
            listeners: {
                click: function () {
                    window.location.reload();
                },
            }
        }));
    }
    errorMessage.append(createElement({
        innerText: `${emojiVar[Math.floor(Math.random() * emojiVar.length)]}`,
        style: {
            "fontSize": "30px",
            "marginBottom": "20px"
        }
    }));
    errorMessage.append(createElement({
        innerText: config.isError ? `Something went wrong: ${message}` : message,
        style: {
            "marginBottom": "20px",
        }
    }));
    errorCon.append(container);
}
function openWebview(url) {
    if (config.chrome) {
        window.open(url, "_blank");
    }
    else {
        // @ts-ignore
        window.parent.getWebviewHTML(url, false, null, "console.log()");
    }
}
const sourceExtensionID = [7, 5, 3];
const sourceID = ["Gogoanime", "9anime", "Zoro"];
const sourcesURL = {
    "Zoro": [],
    "Gogoanime": [],
    "9anime": []
};
function makeCross(type, bottom = 260) {
    const cross = createElement({
        class: "close_con"
    });
    cross.addEventListener("click", function () {
        const parentID = this.parentElement.id;
        if (parentID == "recomCon" || parentID == "relationsCon" || bottom != 260) {
            closeCon();
        }
        else {
            this.parentElement.style.display = "none";
        }
    });
    if (type === "fixed") {
        cross.style.position = "fixed";
        cross.style.top = "auto";
        cross.style.bottom = `${bottom}px`;
    }
    else {
        cross.style.position = "absolute";
    }
    return cross;
}
function iniChoiceDOM(bottom = 260) {
    const choiceDOM = document.getElementsByClassName("choice");
    const sourceCardsDOM = document.getElementById("sourceCards");
    const sourceChoiceDOM = document.getElementById("sourceChoice");
    sourceChoiceDOM.appendChild(makeCross("fixed", bottom));
    backdrop.addEventListener("click", function () {
        closeCon();
    });
    for (let i = 0; i < choiceDOM.length; i++) {
        const currentIndex = i;
        choiceDOM[currentIndex].onclick = function () {
            sourceCardsDOM.innerHTML = "";
            sourceCardsDOM.style.display = "block";
            sourceCardsDOM.append(makeCross("fixed"));
            const metaData = sourcesURL[sourceID[currentIndex]];
            for (let i = 0; i < metaData.length; i++) {
                const card = makeCard({
                    id: "",
                    name: metaData[i].title,
                    image: metaData[i].image,
                    label: sourceID[currentIndex]
                });
                card.onclick = function () {
                    const newLocation = extensionList[sourceExtensionID[currentIndex]].rawURLtoInfo(new URL(metaData[i].url));
                    window.parent.postMessage({ "action": 500, data: "pages/episode/index.html" + newLocation }, "*");
                };
                sourceCardsDOM.append(card);
            }
        };
    }
}
function makeCard(config) {
    const card = document.createElement("div");
    card.setAttribute("data-id", config.id);
    card.className = "showCard";
    card.style.backgroundImage = `url("${config.image}")`;
    card.appendChild(createElement({
        class: "showBackdrop"
    }));
    card.appendChild(createElement({
        class: "showName",
        innerText: config.name
    }));
    if (config.label) {
        card.appendChild(createElement({
            class: "showLabel",
            innerText: config.label
        }));
    }
    return card;
}
async function fetchMapping(id) {
    const noti = sendNoti([0, "", "Alert", "Fetching the mappings..."]);
    const sourcesToCheck = ["Zoro", "9anime", "Gogoanime"];
    try {
        const pages = JSON.parse(await window.parent.MakeFetch(`https://raw.githubusercontent.com/MALSync/MAL-Sync-Backup/master/data/anilist/anime/${id}.json`));
        noti.remove();
        sourceChoiceDOM.style.display = "flex";
        for (let i = 0; i < sourcesToCheck.length; i++) {
            const sourcePages = pages.Pages[sourcesToCheck[i]];
            sourcesURL[sourcesToCheck[i]] = [];
            const sourceDOM = sourceChoiceDOM.getElementsByClassName(`${sourcesToCheck[i]}`)[0];
            if (sourceDOM) {
                sourceDOM.style.display = "none";
                for (const page in sourcePages) {
                    sourceDOM.style.display = "block";
                    sourcesURL[sourcesToCheck[i]].push(sourcePages[page]);
                }
            }
        }
    }
    catch (err) {
        noti.remove();
        sendNoti([0, "red", "Alert", "Anime not found."]);
        for (let i = 0; i < sourcesToCheck.length; i++) {
            const sourceDOM = sourceChoiceDOM.getElementsByClassName(`${sourcesToCheck[i]}`)[0];
            if (sourceDOM) {
                sourceDOM.style.display = "none";
            }
        }
    }
}
function makeCardCon(con, nodes, edges) {
    var _a;
    try {
        const relationsCross = makeCross("fixed");
        con.append(relationsCross);
        for (let i = 0; i < nodes.length; i++) {
            if (((_a = nodes[i]) === null || _a === void 0 ? void 0 : _a.type) !== "ANIME") {
                continue;
            }
            const card = makeCard({
                id: nodes[i].id,
                image: nodes[i].coverImage.extraLarge,
                name: nodes[i].title.english ? nodes[i].title.english : nodes[i].title.native,
                label: edges ? fixStatus(edges[i].relationType) : nodes[i].seasonYear ? nodes[i].seasonYear : ""
            });
            card.addEventListener("click", function () {
                fetchMapping(this.getAttribute("data-id"));
            });
            con.append(card);
        }
    }
    catch (err) {
        console.error(err);
    }
}
function openCon(con, display = "block") {
    con.style.display = display;
    backdrop.style.display = "block";
    recomCon.style.opacity = "1";
    relationsCon.style.opacity = "1";
    sourceChoiceDOM.style.opacity = "1";
    sourceCardsDOM.style.opacity = "1";
    backdrop.style.opacity = "1";
    con.style.opacity = "0";
    con.style.bottom = "-20px";
    backdrop.style.opacity = "0";
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            con.style.opacity = "1";
            con.style.bottom = "0";
            backdrop.style.opacity = "1";
        });
    });
}
function closeCon() {
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            recomCon.style.bottom = "-20px";
            relationsCon.style.bottom = "-20px";
            sourceChoiceDOM.style.bottom = "-20px";
            sourceCardsDOM.style.bottom = "-20px";
            recomCon.style.opacity = "0";
            relationsCon.style.opacity = "0";
            sourceChoiceDOM.style.opacity = "0";
            sourceCardsDOM.style.opacity = "0";
            backdrop.style.opacity = "0";
            setTimeout(function () {
                recomCon.style.display = "none";
                relationsCon.style.display = "none";
                sourceChoiceDOM.style.display = "none";
                sourceCardsDOM.style.display = "none";
                backdrop.style.display = "none";
                sourceChoiceDOM.style.bottom = "0px";
                sourceCardsDOM.style.bottom = "0px";
            }, 200);
        });
    });
}
function fixStatus(status) {
    try {
        return status.split("_").map((x) => {
            return x[0].toUpperCase() + x.substring(1).toLowerCase();
        }).join(" ");
    }
    catch (err) {
        return status;
    }
}
