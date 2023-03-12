var config = {
    "local": localStorage.getItem("local") === "true",
    "remote": localStorage.getItem("remote"),
    "remoteWOport": localStorage.getItem("remoteWOport"),
    "chrome": false,
    "firefox": false,
    "beta": false,
    "sockets": false
};
localStorage.setItem("version", "1.2.4");
if (localStorage.getItem("lastUpdate") === null) {
    localStorage.setItem("lastUpdate", "0");
}
