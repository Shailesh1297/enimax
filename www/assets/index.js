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
const backgroundGradients = [
    "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)",
    "linear-gradient(to bottom, #c31432, #240b36)",
    "linear-gradient(to bottom, #c04848, #480048)",
    "linear-gradient(to bottom, #4b6cb7, #182848)",
    "linear-gradient(to bottom, #12c2e9, #c471ed, #f64f59)",
    "linear-gradient(to bottom, #00c6ff, #0072ff)",
    "linear-gradient(to bottom, #ec008c, #fc6767)",
    "linear-gradient(to bottom, #ffd89b, #19547b)"
];
//# sourceMappingURL=index.js.map