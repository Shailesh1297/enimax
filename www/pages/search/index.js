// @ts-ignore
const extensionNames = window.parent.returnExtensionNames();
// @ts-ignore
const extensionList = window.parent.returnExtensionList();
// @ts-ignore
const extensionDisabled = window.parent.returnExtensionDisabled();
let sourcesNames = extensionNames;
const queries = (new URLSearchParams(location.search));
// @ts-ignore
let pullTabArray = [];
let engineID = queries.get("engine") || localStorage.getItem("currentEngine");
const searchQuery = queries.get("search");
pullTabArray.push(new pullToRefresh(document.getElementById("mainConSearch")));
for (var i = 0; i < extensionList.length; i++) {
    if (extensionDisabled[i]) {
        continue;
    }
    let atr = {
        "value": i.toString(),
    };
    if (i == parseInt(engineID) || (isNaN(parseInt(engineID)) && i == 0)) {
        atr["selected"] = "";
    }
    let tempDiv = createElement({
        "element": "option",
        "attributes": atr,
        "innerHTML": sourcesNames[i]
    });
    document.getElementById("sources").append(tempDiv);
}
let searchInput = document.querySelector('.searchInput');
let searchBox = document.querySelector('.searchBox');
let searchButton = document.querySelector('.searchButton');
let searchClose = document.getElementById('s_c');
document.getElementById("sources").onchange = function () {
    engineID = this.value;
    localStorage.setItem("currentEngine", engineID);
};
document.getElementById("back").onclick = function () {
    window.parent.postMessage({ "action": 500, data: `pages/homepage/index.html` }, "*");
};
searchBox.onclick = function () {
    openSearch();
};
searchClose.onclick = function (event) {
    close_search(event);
};
constructErrorPage(document.getElementById("mainConSearch"), "Start searching by clicking on the search icon above!", {
    hasLink: false,
    hasReload: false,
    isError: false,
    customConClass: "absolute",
    positive: true
});
function openSearch() {
    searchInput.style.width = 'calc(100% - 50px)';
    searchBox.style.width = 'calc(100% - 70px)';
    searchClose.style.display = 'flex';
    searchInput.style.paddingLeft = '40px';
    searchButton.onclick = function () { search(); };
}
function close_search(event) {
    searchClose.style.display = 'none';
    searchInput.style.width = '0';
    searchInput.style.paddingLeft = '0';
    searchBox.style.width = '40px';
    searchButton.onclick = function () { };
    event.stopPropagation();
}
document.getElementById("searchForm").onsubmit = function (event) {
    event.preventDefault();
    window.parent.postMessage({ "action": 500, data: `pages/search/index.html?search=${searchInput.value}&engine=${engineID}` }, "*");
};
function search() {
    document.getElementById("mainConSearch").innerHTML = "<div style='margin:auto;'>Loading...</div>";
    let currentEngine;
    if (!engineID) {
        localStorage.setItem("currentEngine", "0");
        currentEngine = extensionList[0];
    }
    else {
        currentEngine = parseInt(engineID);
        if (currentEngine == 0) {
            currentEngine = extensionList[0];
        }
        else {
            currentEngine = extensionList[currentEngine];
        }
    }
    if (searchInput.value === "devmode") {
        localStorage.setItem("devmode", "true");
    }
    currentEngine.searchApi(searchInput.value).then(function (x) {
        searchInput.value = searchQuery;
        document.getElementById("sources").value = engineID;
        let main_div = x.data;
        if (main_div.length == 0) {
            document.getElementById("mainConSearch").innerHTML = "";
            constructErrorPage(document.getElementById("mainConSearch"), "No results", {
                hasLink: false,
                hasReload: false,
                isError: false,
                customConClass: "absolute"
            });
        }
        else {
            document.getElementById("mainConSearch").innerHTML = "";
        }
        for (var i = 0; i < main_div.length; i++) {
            let tempDiv1 = createElement({ "class": "s_card" });
            let tempDiv2 = createElement({ "class": "s_card_bg" });
            let tempDiv3 = createElement({ "class": "s_card_title" });
            let tempDiv4 = createElement({ "class": "s_card_title_main", "innerText": main_div[i].name });
            let tempDiv5 = createElement({
                "element": "div", "class": "s_card_play",
                "attributes": {
                    "data-href": `pages/episode/index.html?watch=${main_div[i].link}`
                },
                "listeners": {
                    "click": function () {
                        window.parent.postMessage({ "action": 500, data: this.getAttribute("data-href") }, "*");
                    }
                }
            });
            let tempDiv6 = createElement({ "class": "s_card_img_search", "style": { "backgroundImage": `url("${main_div[i].image}")` } });
            tempDiv3.append(tempDiv4);
            tempDiv2.append(tempDiv3);
            tempDiv2.append(tempDiv5);
            tempDiv1.append(tempDiv6);
            tempDiv1.append(tempDiv2);
            document.getElementById("mainConSearch").append(tempDiv1);
        }
    }).catch(function (error) {
        document.getElementById("mainConSearch").innerHTML = "";
        constructErrorPage(document.getElementById("mainConSearch"), error.toString(), {
            hasLink: false,
            hasReload: false,
            isError: false,
            customConClass: "absolute",
        });
    });
}
applyTheme();
if (searchQuery) {
    searchInput.value = searchQuery;
    openSearch();
    search();
}
