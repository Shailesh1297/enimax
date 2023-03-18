

class downloadQueue {
    queue : Array<queueElement>;
    doneQueue : Array<queueElement>;
    pause : boolean;
    constructor() {
        this.queue = [];
        this.doneQueue = [];
        this.pause = localStorage.getItem("downloadPaused") === 'true';
        this.init();

        let self = this;

        setInterval(function () {
            self.emitPercent(self);
            if (self.shouldPause()) {
                self.pauseIt(self);
            }
        }, 1000);

        setInterval(function () {
            // @ts-ignore
            if (self.pause && cordova.plugins.backgroundMode.isActive()) {
                // @ts-ignore
                cordova.plugins.backgroundMode.disable();
            }
        }, 5000);
    }

    emitPercent(self : downloadQueue) {
        try {
            let currentHead = self.queue[0].downloadInstance;
            let downloadPercent = currentHead.downloaded / currentHead.total;
            downloadPercent = Math.floor(downloadPercent * 10000) / 100;
            (document.getElementById("frame") as HTMLIFrameElement).contentWindow.postMessage({
                "action": "percentageUpate",
                "data": downloadPercent
            }, "*");

        } catch (err) {

        }


    }

    isInQueue(self, url) {
        for (var i = 0; i < self.queue.length; i++) {
            if (self.queue[i].data == url) {
                return true;
            }
        }

        return false;

    }

    async init() {
        try {
            let temp2 = (await downloadedDB.keyValue.get({ "key": "localQueue" })).value;
            let temp = JSON.parse(temp2);
            this.queue = temp ? temp : [];
        } catch (err) {
            console.error(err);
        }

        try {
            let temp = JSON.parse((await downloadedDB.keyValue.get({ "key": "localDoneQueue" })).value);
            this.doneQueue = temp ? temp : [];
        } catch (err) {
            console.error(err);
        }

        this.startDownload(this);
    }
    async removeFromDoneQueue(name, self) {
        if (self.doneQueue.length == 0) {
            return;
        }

        let curElem;
        let curElemIndex = 0;
        for (let i = 0; i < self.doneQueue.length; i++) {
            if (self.doneQueue[i].data == name) {
                curElem = self.doneQueue[i];
                curElemIndex = i;
                break;
            }
        }

        if (curElem) {
            self.doneQueue.splice(curElemIndex, 1);
            await self.updateLocalDoneQueue(self);
        }
    }


    async retryFromDoneQueue(name, self) {
        if (self.doneQueue.length == 0) {
            return;
        }

        let curElem;
        let curElemIndex = 0;
        for (let i = 0; i < self.doneQueue.length; i++) {
            if (self.doneQueue[i].data == name) {
                curElem = self.doneQueue[i];
                curElemIndex = i;
                break;
            }
        }

        if (curElem) {
            let temp = self.doneQueue.splice(curElemIndex, 1)[0];
            await self.updateLocalDoneQueue(self);


            self.add(
                temp.data,
                temp.anime,
                temp.mainUrl,
                temp.title,
                self,
            );
        }
    }

    deleteFilesHead(self) {

        try {
            let curElem = self.queue[0];
            let temp3 = curElem.data.replace("?watch=", "");
            temp3 = temp3.split("&engine=");
            (window.parent as cordovaWindow).removeDirectory(`/${curElem.anime.mainName}/${btoa(temp3[0])}/`).then(function () {

            }).catch(function () {
                alert("Could not delete the file. You have to delete it manually. Error 1000");

            });
        } catch (err) {
            alert("Could not delete the file. You have to delete it manually.");
        }
    }
    async removeFromQueue(name, self) {
        if (self.queue.length == 0) {
            return;
        }
        let currentHead = self.queue[0];
        let curElem;
        let curElemIndex = 0;
        for (let i = 0; i < self.queue.length; i++) {
            if (self.queue[i].data == name) {
                curElem = self.queue[i];
                curElemIndex = i;
                break;
            }
        }


        if (curElem) {
            if (curElem == currentHead) {
                self.deleteFilesHead(self);
                try {
                    if (!("downloadInstance" in currentHead)) {
                        currentHead.downloadInstance = {};
                    }
                    currentHead.downloadInstance.pause = true;
                    currentHead.downloadInstance.message = "Cancelled by the user.";
                    self.error(self);

                } catch (err) {

                }
            } else {
                self.queue.splice(curElemIndex, 1);
                await self.updateLocalStorage(self);
            }
        }
    }
    async add(data : string, anime : extensionInfo, mainUrl : string, title : string, self : downloadQueue) {
        if (!self) {
            self = this;
        }
        let flag = true;
        for (let i = 0; i < self.queue.length; i++) {
            if (self.queue[i].data == data) {
                alert("This is already in the queue");
                flag = false;
                break;
            }
        }

        if ("episodes" in anime) {
            delete anime["episodes"];
        }

        if (flag) {
            self.queue.push({
                "data": data,
                "anime": anime,
                "mainUrl": mainUrl,
                "title": title,
            });

            if (self.queue.length == 1) {
                self.startDownload(self);
            }

            await self.updateLocalStorage(self);
        }
    }

    pauseIt(self) {
        (document.getElementById("frame") as HTMLIFrameElement).contentWindow.postMessage({
            "action": "paused",
        }, "*");
        if (self.queue.length == 0) {
            self.pause = true;
            localStorage.setItem("downloadPaused", "true");
            return true;
        } else {
            if ("downloadInstance" in self.queue[0]) {
                self.queue[0].downloadInstance.pause = true;
            }
            self.pause = true;
            localStorage.setItem("downloadPaused", "true");
            return true;
        }


    }

    playIt(self) {
        if (self.queue.length == 0 || self.shouldPause()) {
            return false;
        } else {
            self.pause = false;
            self.startDownload(self);
            localStorage.setItem("downloadPaused", "false");
            return true;
        }
    }

    shouldPause() {
        // @ts-ignore
        return (localStorage.getItem("autoPause") === "true" && navigator.connection.type !== Connection.WIFI);
    }

    removeActive(self) {
        if (self.queue.length !== 0) {
            if ("downloadInstance" in self.queue[0]) {
                self.queue[0].downloadInstance.pause = true;

            }
            self.deleteFilesHead(self);
            self.queue = [];
            self.updateLocalStorage(self);
        }
    }

    removeDone(self, isDone) {
        if (self.doneQueue.length !== 0) {
            let tempDoneQueue = [];
            for (let i = 0; i < self.doneQueue.length; i++) {
                if (isDone && self.doneQueue[i].errored === true) {
                    tempDoneQueue.push(self.doneQueue[i]);
                } else if (!isDone && self.doneQueue[i].errored !== true) {
                    tempDoneQueue.push(self.doneQueue[i]);
                }
            }
            self.doneQueue = tempDoneQueue;
            self.updateLocalDoneQueue(self);
        }
    }
    async updateLocalStorage(self : downloadQueue) {
        
        (document.getElementById("frame") as HTMLIFrameElement).contentWindow.postMessage({
            "action": "activeUpdate",
        }, "*");


        let tempLen = await (downloadedDB.keyValue.where({ "key": "localQueue" })).toArray();

        if (tempLen.length == 0) {
            await downloadedDB.keyValue.add({ "key": "localQueue", "value": JSON.stringify(self.queue) });
        } else {
            await downloadedDB.keyValue.where({ "key": "localQueue" }).modify({ "value": JSON.stringify(self.queue) });

        }

    }

    async updateLocalDoneQueue(self) {
        (document.getElementById("frame") as HTMLIFrameElement).contentWindow.postMessage({
            "action": "doneUpdate",
        }, "*");


        let tempLen = await (downloadedDB.keyValue.where({ "key": "localDoneQueue" })).toArray();

        if (tempLen.length == 0) {
            await downloadedDB.keyValue.add({ "key": "localDoneQueue", "value": JSON.stringify(self.doneQueue) });
        } else {
            await downloadedDB.keyValue.where({ "key": "localDoneQueue" }).modify({ "value": JSON.stringify(self.doneQueue) });

        }

    }

    startDownload(self : downloadQueue) {
        if (self.pause) {
            return;
        }


        if (self.queue.length == 0) {
            // @ts-ignore
            cordova.plugins.backgroundMode.disable();
            return;
        } else {
            // @ts-ignore
            cordova.plugins.backgroundMode.enable();
        }
        let currentEngine;
        let engineNum;
        let curQueueElem = self.queue[0];
        let temp3 = curQueueElem.data.replace("?watch=", "").split("&engine=");
        if (temp3.length == 1) {
            currentEngine = wco;
            engineNum = 0;
        } else {
            currentEngine = parseInt(temp3[1]);
            engineNum = currentEngine;
            if (currentEngine == 0) {
                currentEngine = extensionList[0];
            } else {
                currentEngine = extensionList[currentEngine];
            }
        }
        currentEngine.getAnimeInfo(curQueueElem.mainUrl).then(function (episodes) {
            if (self.pause) {
                return;
            }
            currentEngine.getLinkFromUrl(temp3[0]).then(function (temp) {
                if (self.pause) {
                    return;
                }
                temp.ogURL = temp3[0];
                temp.engine = engineNum;
                curQueueElem.downloadInstance = new DownloadVid(temp, curQueueElem.anime, () => { self.done(self) }, () => { self.error(self) }, episodes.episodes, self.pause);
            }).catch(function (x) {
                // @ts-ignore
                curQueueElem.downloadInstance = {};
                curQueueElem.downloadInstance.message = "Couldn't get the link";
                self.error(self);
            });
        }).catch(function (err) {
            // @ts-ignore
            curQueueElem.downloadInstance = {};
            curQueueElem.downloadInstance.message = "Couldn't get the episode list.";
            self.error(self);
        });
    }

    error(self) {
        setTimeout(async function () {
            if (self.shouldPause()) {
                self.pauseIt(self);
            } else {
                self.doneQueue.push((await self.remove(self, true)));
                self.updateLocalDoneQueue(self);
                self.startDownload(self);
            }
        }, 1000);

    }

    async done(self : downloadQueue) {
        self.doneQueue.push((await self.remove(self)));
        self.updateLocalDoneQueue(self);

        self.startDownload(self);
    }
    async remove(self : downloadQueue, error = false) {
        let temp = self.queue.shift();
        temp.errored = error;
        if ("downloadInstance" in temp) {
            temp.message = temp.downloadInstance.message;
            delete temp["downloadInstance"];
        }
        await self.updateLocalStorage(self);
        return temp;

    }
}