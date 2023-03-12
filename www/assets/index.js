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
