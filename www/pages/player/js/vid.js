class vid {
    constructor(config) {
        this.config = config;
        this.overlay = document.querySelector("#seek_overlay");
        this.bar_main = document.querySelector("#bar_main");
        this.barLine = document.querySelector("#bar");
        this.bar_con = document.querySelector("#bar_con");
        this.big_play = document.querySelector("#big_play");
        this.controlTop = document.querySelectorAll(".controlTop");
        this.current = document.querySelector("#current");
        this.total = document.querySelector("#total");
        this.pop = document.querySelector("#pop");
        this.popControls = document.querySelector("#options");
        this.seeker = document.querySelector("#seeker");
        this.bar_con1 = document.querySelector("#bar_con1");
        this.loaded = document.querySelector("#loaded");
        this.big_play = document.querySelector("#big_play");
        this.con = document.querySelector("#con_2");
        this.fullscreenDOM = document.querySelector("#con");
        this.pip = document.querySelector("#pip");
        this.lock = document.querySelector("#lock");
        this.lock2 = document.querySelector("#lock_2");
        this.retry = document.querySelector("#retry");
        this.buffered = document.querySelector("#buffered");
        this.metaData = document.querySelector("#metaData");
        this.titleCon = document.querySelector("#titleCon");
        this.epCon = document.querySelector("#epCon");
        this.bar = document.querySelector("#bar");
        this.locked = false;
        this.downTown = 0;
        this.seekMode = false;
        this.fullscreenCheck = 0;
        this.open = 1;
        this.type = 0;
        this.wasLocked = false;
        this.vid = document.querySelector("#v");
        this.windowSize = window.innerWidth;
        this.updateTimeout();
        this.seekTimeout;
        var x = this;
        let self = this;
        this.retry.addEventListener("click", function () {
            location.reload();
        });
        this.lock.addEventListener("click", function () {
            self.lockVid.bind(self)();
        });
        this.lock2.addEventListener("click", function () {
            self.lockVid2.bind(self)();
        });
        this.lock.addEventListener("ontouchstart", function (event) {
            event.preventDefault();
            self.lockVid.bind(self)();
        });
        this.lock2.addEventListener("ontouchstart", function (event) {
            event.preventDefault();
            self.lockVid2.bind(self)();
        });
        this.pip.addEventListener("click", function () {
            self.togglePictureInPicture.bind(self)();
        });
        this.vid.addEventListener("timeupdate", function () {
            self.updateTime.bind(self)();
            window.dispatchEvent(new Event("videoTimeUpdated"));
        });
        this.vid.addEventListener("progress", function () {
            self.updateBuffer.bind(self)();
        });
        this.vid.addEventListener("loadedmetadata", function () {
            window.dispatchEvent(new Event("videoLoadedMetaData"));
        });
        this.vid.addEventListener("ended", function () {
            window.dispatchEvent(new Event("videoEnded"));
        });
        this.vid.addEventListener("canplay", function () {
            x.current.innerText = x.timeToString(x.vid.currentTime);
        });
        this.vid.addEventListener("waiting", function () {
        });
        this.big_play.addEventListener("click", function () {
            self.togglePlay.bind(self)();
        });
        this.vid.addEventListener("play", function () {
            window.parent.postMessage({ "action": 15 }, "*");
            self.play.bind(self)();
        });
        this.vid.addEventListener("pause", function () {
            window.parent.postMessage({ "action": 16 }, "*");
            self.pause.bind(self)();
        });
        this.vid.addEventListener("durationchange", function () {
            x.total.innerText = x.timeToString(x.vid.duration);
            window.dispatchEvent(new Event("videoDurationChanged"));
        });
        this.vid.addEventListener("mousemove", function () {
            x.updateTimeout();
        });
        this.bar_con1.addEventListener("mousemove", function (event) {
            self.showTimestamp.bind(self)(event);
        });
        this.bar_con1.addEventListener("click", function () {
            if (x.seekMode) {
                x.bar_con1.blur();
                x.seekMode = false;
            }
            else {
                x.bar_con1.focus();
                x.seekMode = true;
            }
        });
        this.bar_con1.addEventListener("mouseout", function () {
            self.hideTimestamp.bind(self)();
        });
        window.onresize = function () {
            self.windowSize = window.innerWidth;
        };
        this.vid.addEventListener("mousedown", function (event) {
            self.type = 2;
            self.seekIni.bind(self)(0, event);
        });
        this.vid.addEventListener("touchstart", function (event) {
            event.preventDefault();
            self.type = 2;
            self.seekIni.bind(self)(1, event);
        });
        this.vid.addEventListener("touchmove", function (event) {
            event.preventDefault();
            self.seekMove.bind(self)(event);
        });
        this.vid.addEventListener("touchend", function (event) {
            event.preventDefault();
            self.seekEnd.bind(self)(event);
        });
        this.vid.addEventListener("touchcancel", function (event) {
            event.preventDefault();
            self.seekEnd.bind(self)(event);
        });
        this.bar_con1.addEventListener("mousedown", function (event) {
            self.type = 1;
            self.seekIni.bind(self)(0, event);
        });
        this.bar_con1.addEventListener("touchstart", function (event) {
            event.preventDefault();
            self.type = 1;
            self.seekIni.bind(self)(0, event);
        });
        this.bar_con1.addEventListener("touchmove", function (event) {
            event.preventDefault();
            self.seekMove.bind(self)(event);
        });
        this.bar_con1.addEventListener("touchend", function (event) {
            event.preventDefault();
            self.seekEnd.bind(self)(event);
        });
        this.bar_con1.addEventListener("touchcancel", function (event) {
            event.preventDefault();
            self.seekEnd.bind(self)(event);
        });
        this.overlay.addEventListener("mousemove", function (event) {
            self.seekMove.bind(self)(event);
        });
        this.overlay.addEventListener("mouseup", function (event) {
            self.seekEnd.bind(self)(event);
        });
        this.overlay.addEventListener("mouseout", function (event) {
            self.seekEnd.bind(self)(event);
        });
        this.overlay.addEventListener("mousedown", function (event) {
            x.vid_click(event.timeStamp, [event.clientX, event.clientY]);
        });
        this.clickTimeout;
        this.lastTime;
        window.dispatchEvent(new Event("videoStartInterval"));
        this.doubleClickTime;
        this.doubleClickCoords;
        this.doubleClickCheck = 0;
        this.doubleMode = 0;
        this.objectFitArray = ["contain", "cover", "fill"];
        this.objectPositionArray = ["center", "center bottom"];
        this.objectPresets = [[0, 0], [1, 0], [1, 1], [2, 0]];
        this.currentPreset = 0;
        this.objectFit = this.objectFitTemp;
        this.objectPosition = this.objectPositionTemp;
    }
    updateBuffer() {
        let current = this.vid.currentTime;
        for (let i = 0; i < this.vid.buffered.length; i++) {
            let start = this.vid.buffered.start(i);
            let end = this.vid.buffered.end(i);
            if (start <= current && end >= current) {
                this.buffered.style.left = (start / this.vid.duration) * 100 + "%";
                this.buffered.style.width = ((end - start) / this.vid.duration) * 100 + "%";
                break;
            }
        }
    }
    lockVid(opacity = 1) {
        this.con.style.pointerEvents = "none";
        if (opacity === 1) {
            this.lock2.style.opacity = "1";
        }
        else {
            this.lock2.style.opacity = "0";
        }
        this.lock2.style.pointerEvents = "auto";
        this.locked = true;
        this.close_controls();
    }
    lockVid2() {
        this.con.style.pointerEvents = "auto";
        this.lock2.style.pointerEvents = "none";
        this.lock2.style.opacity = "0";
        this.locked = false;
        this.open_controls();
    }
    toggleLock() {
        if (this.locked) {
            this.lockVid2();
        }
        else {
            this.lockVid();
        }
    }
    play() {
        this.big_play.className = "pause_bg";
    }
    pause() {
        this.big_play.className = "play_bg";
    }
    togglePlay() {
        if (isNaN(this.vid.duration)) {
            return;
        }
        if (this.vid.paused) {
            this.vid.play();
        }
        else {
            this.vid.pause();
        }
    }
    toggleMute() {
        if (this.vid.muted) {
            this.vid.muted = false;
        }
        else {
            this.vid.muted = true;
        }
    }
    setObjectSettings(fillMode, updateLocal = true) {
        let settings = this.objectPresets[fillMode];
        if (updateLocal) {
            localStorage.setItem("fillMode", fillMode.toString());
        }
        this.vid.style.objectFit = this.objectFitArray[settings[0]];
        this.vid.style.objectPosition = this.objectPositionArray[settings[1]];
        this.objectFitTemp = this.objectFitArray[settings[0]];
        this.objectPositionTemp = this.objectPositionArray[settings[1]];
        let fillEvent = new CustomEvent("videoChangedFillMode", {
            detail: {
                "fillMode": fillMode.toString()
            }
        });
        window.dispatchEvent(fillEvent);
    }
    vid_click(timeStamp, coords) {
        if (timeStamp - this.doubleClickTime < 400) {
            this.doubleMode = 1;
        }
        else {
            this.doubleMode = 0;
        }
        this.doubleClickTime = timeStamp;
        if (this.doubleMode == 0) {
            if (this.open == 1) {
                this.close_controls();
            }
            else {
                this.open_controls();
            }
        }
        else if (this.doubleMode == 1 && typeof this.doubleClickCoords == 'object' && this.doubleClickCoords.length == 2 && Math.abs(this.doubleClickCoords[0] - coords[0]) < 50 && Math.abs(this.doubleClickCoords[1] - coords[1]) < 50) {
            if (coords[0] > window.innerWidth / 2) {
                const doubleTapEvent = new CustomEvent("videoDoubleTap", {
                    detail: {
                        "DTType": "plus"
                    }
                });
                window.dispatchEvent(doubleTapEvent);
                this.updateTime();
            }
            else {
                const doubleTapEvent = new CustomEvent("videoDoubleTap", {
                    detail: {
                        "DTType": "minus"
                    }
                });
                window.dispatchEvent(doubleTapEvent);
                this.updateTime();
            }
            this.updateTime();
            if (this.open == 0) {
                this.open_controls();
            }
        }
        this.doubleClickCoords = coords;
    }
    showTimestamp(event) {
        this.seeker.style.opacity = "1";
        let coords = this.getcoordinates(event);
        let temp = Math.max(0, Math.min((coords.screenX - this.bar.getBoundingClientRect().x) / this.bar.getBoundingClientRect().width, 1));
        this.seeker.innerText = this.timeToString(temp * this.vid.duration);
        this.seeker.style.left = temp * 100 + "%";
    }
    hideTimestamp() {
        this.seeker.style.opacity = "0";
    }
    seekIni(pointerCheck, event) {
        if (isNaN(this.vid.duration)) {
            return;
        }
        if (!("touches" in event) || (("touches" in event) && event.touches.length <= 1)) {
            let coords = this.getcoordinates(event);
            if (pointerCheck != 1) {
                this.overlay.style.pointerEvents = "auto";
            }
            if (this.type == 2) {
                this.iniX = coords.screenX;
                this.iniY = coords.screenY;
                this.timeStampStart = event.timeStamp;
                this.canSeekNow = false;
                this.shouldPlay = false;
                clearTimeout(this.seekTimeout);
                this.seekTimeout = window.setTimeout(() => {
                    this.canSeekNow = true;
                    this.bar_main.style.display = "block";
                    this.barLine.style.height = "7px";
                    if (this.vid.paused) {
                        this.shouldPlay = false;
                    }
                    else {
                        this.shouldPlay = true;
                        this.vid.pause();
                    }
                    this.updateTimeout();
                    this.seeker.style.opacity = "1";
                }, 700);
            }
            this.currentTime = this.vid.currentTime;
            this.check = 2;
            this.seeker.style.opacity = "1";
            if (this.type == 1) {
                let temp = Math.max(0, Math.min((coords.screenX - this.bar.getBoundingClientRect().x) / this.bar.getBoundingClientRect().width, 1));
                let temp2 = this.vid.duration * temp;
                let temp3 = 100 * temp;
                this.bar_main.style.display = "block";
                this.barLine.style.height = "7px";
                this.vid.currentTime = temp2;
                this.bar_main.style.left = temp3 + "%";
                this.seeker.style.left = Math.min(temp3) + "%";
                this.loaded.style.width = temp3 + "%";
                this.seeker.innerText = this.timeToString(temp2);
                this.current.innerText = this.timeToString(temp2);
            }
            else if (this.type == 2) {
                document.getElementById('con').style.transitionDuration = `0s`;
                let temp = Math.min(this.vid.duration, Math.max(this.currentTime + 30 * (coords.screenX - this.iniX) / this.windowSize, 0));
                let temp3 = 100 * (temp / this.vid.duration);
                this.seeker.innerText = this.timeToString(temp);
                this.seeker.style.opacity = "0";
                this.seeker.style.left = temp3 + "%";
            }
        }
        else {
            this.type = 3;
            clearTimeout(this.seekTimeout);
            this.bar_main.style.display = "block";
            this.barLine.style.height = "7px";
            this.currentPresetTemp = this.currentPreset;
            this.close_controls();
            this.gesture = Math.hypot((event.touches[0].clientX - event.touches[1].clientX), (event.touches[0].clientY - event.touches[1].clientY));
        }
    }
    updateTimeout() {
        this.lastTime = (new Date()).getTime();
        if (this.open == 0 && this.locked === false) {
            this.open_controls();
        }
    }
    seekMove(event) {
        if (isNaN(this.vid.duration)) {
            return;
        }
        let coords = this.getcoordinates(event);
        if (this.type == 1) {
            let temp = Math.max(0, Math.min((coords.screenX - this.bar.getBoundingClientRect().x) / this.bar.getBoundingClientRect().width, 1));
            let temp2 = this.vid.duration * temp;
            let temp3 = 100 * temp;
            this.vid.currentTime = temp2;
            this.bar_main.style.left = temp3 + "%";
            this.seeker.style.left = temp3 + "%";
            this.loaded.style.width = temp3 + "%";
            this.seeker.innerText = this.timeToString(temp2);
            this.current.innerText = this.timeToString(temp2);
            this.updateTimeout();
        }
        else if (this.type == 2) {
            if (this.canSeekNow || this.check == 1) {
                let temp = Math.min(this.vid.duration, Math.max(this.currentTime + (180) * (coords.screenX - this.iniX) / this.windowSize, 0));
                this.seeker.style.opacity = "1";
                let temp3 = 100 * (temp / this.vid.duration);
                this.check = 1;
                this.vid.currentTime = temp;
                this.bar_main.style.left = temp3 + "%";
                this.seeker.style.left = temp3 + "%";
                this.loaded.style.width = temp3 + "%";
                this.seeker.innerText = this.timeToString(temp);
                this.current.innerText = this.timeToString(temp);
                this.updateTimeout();
            }
            else if (this.check != 100 && (Math.abs(this.iniX - coords.screenX) > 50) || ((this.iniY - coords.screenY) < -50)) {
                this.canSeekNow = false;
                clearTimeout(this.seekTimeout);
                this.downTown = -this.iniY + coords.screenY;
                this.check = 99;
                document.getElementById('con').style.transform = `translateY(${Math.max(Math.min(-this.iniY + coords.screenY, 100), 0)}px)`;
            }
            else if (this.check == 99) {
                this.downTown = -this.iniY + coords.screenY;
                document.getElementById('con').style.transform = `translateY(${Math.max(Math.min(-this.iniY + coords.screenY, 100), 0)}px)`;
            }
            else if (this.check != 100 && this.check != 99 && (this.iniY - coords.screenY) > 50) {
                this.check = 100;
                this.canSeekNow = false;
                const event = new CustomEvent("videoOpenSettings", {
                    detail: {
                        translate: 0
                    }
                });
                window.dispatchEvent(event);
                clearTimeout(this.seekTimeout);
            }
            else if (this.check == 100) {
                const event = new CustomEvent("videoOpenSettings", {
                    detail: {
                        translate: this.iniY - coords.screenY
                    }
                });
                window.dispatchEvent(event);
                this.downTown = this.iniY - coords.screenY;
            }
        }
        else if (this.type == 3) {
            try {
                if ("touches" in event && event.touches.length >= 2) {
                    let temp = Math.hypot((event.touches[0].clientX - event.touches[1].clientX), (event.touches[0].clientY - event.touches[1].clientY)) - this.gesture;
                    if (temp > 300 && (this.currentPreset + 3) < this.objectPresets.length) {
                        this.currentPresetTemp = (this.currentPreset + 3);
                        this.setObjectSettings(this.currentPresetTemp);
                    }
                    else if (temp > 200 && (this.currentPreset + 2) < this.objectPresets.length) {
                        this.currentPresetTemp = (this.currentPreset + 2);
                        this.setObjectSettings(this.currentPresetTemp);
                    }
                    else if (temp > 100 && (this.currentPreset + 1) < this.objectPresets.length) {
                        this.currentPresetTemp = (this.currentPreset + 1);
                        this.setObjectSettings(this.currentPresetTemp);
                    }
                    else if (temp < -100 && (this.currentPreset - 1) >= 0) {
                        this.currentPresetTemp = (this.currentPreset - 1);
                        this.setObjectSettings(this.currentPresetTemp);
                    }
                    else if (temp < -200 && (this.currentPreset - 2) >= 0) {
                        this.currentPresetTemp = (this.currentPreset - 2);
                        this.setObjectSettings(this.currentPresetTemp);
                    }
                    else if (temp < -300 && (this.currentPreset - 3) >= 0) {
                        this.currentPresetTemp = (this.currentPreset - 3);
                        this.setObjectSettings(this.currentPresetTemp);
                    }
                    else {
                        this.currentPresetTemp = (this.currentPreset);
                        this.setObjectSettings(this.currentPresetTemp);
                    }
                }
            }
            catch (err) {
                console.error(err);
                this.setObjectSettings(0);
            }
        }
    }
    seekEnd(event) {
        if (isNaN(this.vid.duration)) {
            this.updateTimeout();
            return;
        }
        if (this.type == 2 && this.shouldPlay) {
            this.vid.play();
        }
        if (this.check == 100) {
            if (this.downTown > 130) {
                const event = new CustomEvent("videoOpenSettings", {
                    detail: {
                        translate: -1
                    }
                });
                window.dispatchEvent(event);
            }
            else {
                window.dispatchEvent(new Event("videoCloseSettings"));
            }
        }
        this.updateTime();
        this.updateBuffer();
        document.getElementById('con').style.transitionDuration = "0.2s";
        document.body.style.backgroundColor = "black";
        if (this.check == 99 && this.downTown >= 100 && !this.config.chrome) {
            window.parent.postMessage({ "action": 400 }, "*");
            requestAnimationFrame(function () {
                document.getElementById('con').style.transform = `translateY(0px)`;
                document.getElementById('popOut').style.display = "block";
                document.getElementById('bar_con').style.display = "none";
                document.getElementById('pop').style.display = "none";
            });
        }
        else {
            requestAnimationFrame(function () {
                document.getElementById('con').style.transform = `translateY(0px)`;
            });
        }
        this.downTown = 0;
        this.bar_main.style.display = "none";
        this.barLine.style.height = "4px";
        clearTimeout(this.seekTimeout);
        this.canSeekNow = false;
        if (this.type != 0) {
            this.objectFit = this.objectFitTemp;
            this.objectPosition = this.objectFitTemp;
            if (typeof this.currentPresetTemp == "number") {
                this.currentPreset = this.currentPresetTemp;
            }
            else {
                this.currentPreset = 0;
            }
            let coords = this.getcoordinates(event);
            this.seeker.style.opacity = "0";
            this.seeker.style.pointerEvents = "none";
            this.overlay.style.pointerEvents = "none";
            if (this.check == 2 && this.type == 2) {
                this.vid_click(event.timeStamp, [coords.screenX, coords.screenY]);
            }
            else {
                window.dispatchEvent(new Event("videoSeeked"));
            }
            this.type = 0;
        }
    }
    updateTime() {
        this.bar_main.style.left = 100 * (this.vid.currentTime / this.vid.duration) + "%";
        this.loaded.style.width = 100 * (this.vid.currentTime / this.vid.duration) + "%";
        this.current.innerText = this.timeToString(this.vid.currentTime);
    }
    getcoordinates(event) {
        let tempCoords = {
            "screenX": 0,
            "screenY": 0
        };
        if ("touches" in event) {
            if (event.touches.length == 0) {
                tempCoords.screenY = event.changedTouches[0].clientY;
                tempCoords.screenX = event.changedTouches[0].clientX;
            }
            else {
                tempCoords.screenY = event.touches[0].clientY;
                tempCoords.screenX = event.touches[0].clientX;
            }
        }
        else {
            tempCoords.screenY = event.clientY;
            tempCoords.screenX = event.clientX;
        }
        return tempCoords;
    }
    close_controls() {
        this.metaData.style.opacity = "0";
        this.pop.style.opacity = "0";
        this.popControls.style.opacity = "0";
        this.popControls.style.pointerEvents = "none";
        this.popControls.style.transform = "translateX(100px)";
        this.metaData.style.transform = "translateX(-100px)";
        this.bar_con.style.bottom = "-70px";
        this.bar_con.style.pointerEvents = "none";
        this.bar_con.style.opacity = "0";
        for (var i = 0; i < this.controlTop.length; i++) {
            this.controlTop[i].style.pointerEvents = "none";
            this.controlTop[i].style.opacity = "0";
        }
        this.open = 0;
    }
    open_controls() {
        this.lastTime = (new Date()).getTime();
        this.metaData.style.opacity = "1";
        this.pop.style.opacity = "1";
        this.popControls.style.opacity = "1";
        this.popControls.style.pointerEvents = "auto";
        this.popControls.style.transform = "translateX(0px)";
        this.metaData.style.transform = "translateX(0px)";
        this.bar_con.style.bottom = "10px";
        this.bar_con.style.opacity = "1";
        this.bar_con.style.pointerEvents = "auto";
        for (var i = 0; i < this.controlTop.length; i++) {
            this.controlTop[i].style.pointerEvents = "auto";
            this.controlTop[i].style.opacity = "1";
        }
        this.open = 1;
    }
    togglePictureInPicture() {
        if (this.config.chrome) {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            }
            else if (document.pictureInPictureEnabled) {
                this.vid.requestPictureInPicture();
            }
        }
        else {
            window.parent.postMessage({ "action": 11, data: "landscape" }, "*");
            if (localStorage.getItem("autopip") === "true") {
                this.wasLocked = this.locked;
                this.lockVid(0);
            }
        }
        this.close_controls();
    }
    goFullScreen() {
        if (this.fullscreenCheck == 0) {
            if (this.fullscreenDOM.requestFullscreen) {
                this.fullscreenDOM.requestFullscreen();
            }
            else if (this.fullscreenDOM["mozRequestFullScreen"]) {
                this.fullscreenDOM["mozRequestFullScreen"]();
            }
            else if (this.fullscreenDOM["webkitRequestFullscreen"]) {
                this.fullscreenDOM["webkitRequestFullscreen"]();
            }
            else if (this.fullscreenDOM["msRequestFullscreen"]) {
                this.fullscreenDOM["msRequestFullscreen"]();
            }
            this.fullscreenCheck = 1;
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document["mozCancelFullScreen"]) {
                document["mozCancelFullScreen"]();
            }
            else if (document["webkitExitFullscreen"]) {
                document["webkitExitFullscreen"]();
            }
            else if (document["msExitFullscreen"]) {
                document["msExitFullscreen"]();
            }
            this.fullscreenCheck = 0;
        }
    }
    timeToString(timeInSeconds) {
        let minutes = "0";
        let seconds = "0";
        if (Math.floor(timeInSeconds / 60) < 10) {
            minutes = "0".concat(Math.floor(timeInSeconds / 60).toString());
        }
        else {
            minutes = Math.floor(timeInSeconds / 60).toString();
        }
        if (timeInSeconds % 60 < 10) {
            seconds = "0".concat(Math.floor(timeInSeconds % 60).toString());
        }
        else {
            seconds = Math.floor(timeInSeconds % 60).toString();
        }
        return (minutes + ":" + seconds);
    }
}
