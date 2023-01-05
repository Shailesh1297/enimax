// @ts-ignore
const extensionNames = (<cordovaWindow>window.parent).returnExtensionNames();
// @ts-ignore
const extensionList = (<cordovaWindow>window.parent).returnExtensionList();
// @ts-ignore
const extensionDisabled = (<cordovaWindow>window.parent).returnExtensionDisabled();

let sourcesNames = extensionNames;

// @ts-ignore
let pullTabArray : Array<pullToRefresh> = [];

pullTabArray.push(new pullToRefresh(document.getElementById("mainConSearch")));

for (var i = 0; i < extensionList.length; i++) {
    if(extensionDisabled[i]){
        continue;
    }
    let atr : any = {
        "value": i.toString(),
    };

    if (i == parseInt(localStorage.getItem("currentEngine")) || (isNaN(parseInt(localStorage.getItem("currentEngine"))) && i == 0)) {
        atr["selected"] = "";
    }
    let tempDiv = createElement(<createElementConfig>{
        "element": "option",
        "attributes": atr,
        "innerHTML": sourcesNames[i]
    });

    document.getElementById("sources").append(tempDiv);
}

let searchInput = document.querySelector('.searchInput') as HTMLInputElement;
let searchBox = document.querySelector('.searchBox') as HTMLInputElement;
let searchButton = document.querySelector('.searchButton') as HTMLInputElement;
let searchClose = document.getElementById('s_c') as HTMLInputElement;


document.getElementById("sources").onchange = function () {
    localStorage.setItem("currentEngine", (this as HTMLInputElement).value);
};

searchBox.onclick = function () {
    openSearch();
}

searchClose.onclick = function (event) {
    close_search(event);

}

searchInput.onkeydown = function (event) {
    if (event.keyCode == 13) {
        search();
    }
}

function openSearch() {
    searchInput.style.width = 'calc(100% - 90px)';
    searchBox.style.width = 'calc(100% - 40px)';
    searchClose.style.display = 'flex';
    searchInput.style.paddingLeft = '40px';
    searchButton.onclick = function () { search(); }
}
function close_search(event : Event) {
    searchClose.style.display = 'none';
    searchInput.style.width = '0';
    searchInput.style.paddingLeft = '0';
    searchBox.style.width = '40px';
    searchButton.onclick = function () { };
    event.stopPropagation();
}


document.getElementById("searchForm").onsubmit = function (event) {
    event.preventDefault();
    search();
};

function search() {
    document.getElementById("mainConSearch").innerHTML = "<div style='margin:auto;'>Loading...</div>";

    let currentEngine;
    if (localStorage.getItem("currentEngine") == null) {
        localStorage.setItem("currentEngine", "0");
        currentEngine = extensionList[0];
    } else {
        currentEngine = parseInt(localStorage.getItem("currentEngine"));
        if (currentEngine == 0) {
            currentEngine = extensionList[0];
        } else {
            currentEngine = extensionList[currentEngine];
        }
    }
    if (searchInput.value === "devmode") {
        localStorage.setItem("devmode", "true");
    }
    currentEngine.searchApi(searchInput.value).then(function (x) {

        let main_div = x.data;

        if (main_div.length == 0) {
            document.getElementById("mainConSearch").innerHTML = "<div style='margin:auto;'>No results :(</div>";
        } else {
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
        console.error(error);
        document.getElementById("mainConSearch").innerHTML = "Error";
        sendNoti([0, null, "Message", error.data]);

    });
}

applyTheme();