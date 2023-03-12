var CustomXMLHttpRequest = XMLHttpRequest;
var engine: number;

const isChrome = config.chrome;
var username = "hi";
// @ts-ignore
const extensionList = (<cordovaWindow>window.parent).returnExtensionList();
let hls: any;
let doubleTapTime = isNaN(parseInt(localStorage.getItem("doubleTapTime"))) ? 5 : parseInt(localStorage.getItem("doubleTapTime"));
let skipButTime = isNaN(parseInt(localStorage.getItem("skipButTime"))) ? 30 : parseInt(localStorage.getItem("skipButTime"));
let currentVidData: videoData;
let skipIntroInfo: skipData = {
	start: 0,
	end: 0
};
let curTrack: undefined | TextTrack = undefined;
let marginApplied = false;
let updateCurrentTime: number,
	getEpCheck: number,
	lastUpdate: number,
	updateCheck: number,
	int_up: number;
let isPlayingLocally = false;
let engineTemp = location.search.split("engine=");
let nextTrackTime: number;
let downloaded = localStorage.getItem("offline") === 'true';
let fMode = parseInt(localStorage.getItem("fillMode"));
let errorCount = 0;
let vidInstance: vid;
let subtitleConfig: subtitleConfig = {
	backgroundColor: localStorage.getItem("subtitle-bgColor"),
	backgroundOpacity: parseInt(localStorage.getItem("subtitle-bgOpacity")),
	fontSize: parseInt(localStorage.getItem("subtitle-fontSize")),
	color: localStorage.getItem("subtitle-color"),
	lineHeight: parseInt(localStorage.getItem("subtitle-lineHeight")),
};
let lastFragError = -10;
let lastFragDuration = 0;
let fragErrorCount = 0;

function applySubtitleConfig(): void {
	let subtitleStyle = document.getElementById("subtitleStyle") as HTMLStyleElement;
	while (subtitleStyle.sheet.cssRules.length > 0) {
		subtitleStyle.sheet.deleteRule(0);
	}

	let subtitleStyleString = ``;
	let opacity = 255;
	if (!isNaN(subtitleConfig.backgroundOpacity)) {
		opacity = subtitleConfig.backgroundOpacity;
	}

	let opacityHex = opacity.toString(16);
	if (opacityHex.length == 1) {
		opacityHex = `0${opacityHex}`
	}

	if (subtitleConfig.backgroundColor) {
		subtitleStyleString += `background-color: ${subtitleConfig.backgroundColor}${opacityHex};`;
	} else if (!isNaN(subtitleConfig.backgroundOpacity)) {
		subtitleStyleString += `background-color: #000000${opacityHex};`;
	}

	if (!isNaN(subtitleConfig.fontSize)) {
		subtitleStyleString += `font-size: ${subtitleConfig.fontSize}px;`;
	}

	if (!isNaN(subtitleConfig.lineHeight)) {
		subtitleStyleString += `line-height: ${subtitleConfig.lineHeight}px;`;
	}

	if (subtitleConfig.color) {
		subtitleStyleString += `color: ${subtitleConfig.color};`;
	}

	subtitleStyle.sheet.insertRule(`::cue{
		${subtitleStyleString}
	}`);

}



let DMenu = new dropDownMenu(
	[
		{
			"id": "initial",
			"heading": {
				"text": "Settings",
			},
			"items": [
				{
					"text": "Quality",
					"iconID": "qualIcon",
					"open": "quality"
				},

				{
					"text": "Sources",
					"iconID": "sourceIcon",
					"open": "source"
				},
				{
					"text": "Subtitles",
					"iconID": "subIcon",
					"open": "subtitles"
				},
				{
					"text": "Subtitle options",
					"iconID": "subIcon",
					"open": "subtitlesOptions"
				},
				{
					"text": "Fill Mode",
					"iconID": "fillIcon",
					"open": "fillmode"
				},
				{
					"text": "Config",
					"iconID": "configIcon",
					"open": "config"
				}
			]
		},
		{
			"id": "quality",
			"selectableScene": true,
			"heading": {
				"text": "Quality",
			},
			"items": [

			]
		},

		{
			"id": "subtitles",
			"selectableScene": true,
			"heading": {
				"text": "Subtitles",
			},
			"items": [

			]
		},

		{
			"id": "subtitlesOptions",
			"selectableScene": true,
			"heading": {
				"text": "Subtitle Options",
			},
			"items": [
				{
					"text": "Background Color",
					"attributes": {
						style: "width: 100%"
					},
					"classes": ["inputItem"],
					"color": true,
					"value": localStorage.getItem("subtitle-bgColor"),
					"onInput": function (event: InputEvent) {
						let target = <HTMLInputElement>event.target;

						localStorage.setItem("subtitle-bgColor", target.value);
						subtitleConfig.backgroundColor = target.value;
						applySubtitleConfig();
					}
				},

				{
					"text": "Background Transparency",
					"slider": true,
					"sliderConfig": {
						"max": 255,
						"min": 0,
						"step": 1
					},
					"classes": ["inputItem", "sliderMenu"],
					"value": localStorage.getItem("subtitle-bgOpacity"),
					"onInput": function (event: InputEvent) {
						let target = <HTMLInputElement>event.target;

						localStorage.setItem("subtitle-bgOpacity", target.value);
						subtitleConfig.backgroundOpacity = parseInt(target.value);
						applySubtitleConfig();
					}
				},

				{
					"text": "Font Size",
					"textBox": true,
					"classes": ["inputItem"],
					"value": localStorage.getItem("subtitle-fontSize"),
					"onInput": function (event: InputEvent) {
						let target = <HTMLInputElement>event.target;

						localStorage.setItem("subtitle-fontSize", target.value);
						subtitleConfig.fontSize = parseInt(target.value);
						applySubtitleConfig();
					}
				},

				{
					"text": "Font Color",
					"color": true,
					"classes": ["inputItem"],
					"attributes": {
						style: "width: 100%"
					},
					"value": localStorage.getItem("subtitle-color"),
					"onInput": function (event: InputEvent) {
						let target = <HTMLInputElement>event.target;

						localStorage.setItem("subtitle-color", target.value);
						subtitleConfig.color = (target.value);
						applySubtitleConfig();
					}
				},

				{
					"text": "Spacing",
					"textBox": true,
					"classes": ["inputItem"],
					"attributes": {
						style: "width: 100%"
					},
					"value": localStorage.getItem("subtitle-lineHeight"),
					"onInput": function (event: InputEvent) {
						let target = <HTMLInputElement>event.target;

						localStorage.setItem("subtitle-lineHeight", target.value);
						subtitleConfig.lineHeight = parseInt(target.value);
						applySubtitleConfig();
					}
				},
				{
					"text": "Subtitle Margin",
					"textBox": true,
					"classes": ["inputItem"],
					"value": isNaN(parseInt(localStorage.getItem("sub-margin"))) ? "0" : parseInt(localStorage.getItem("sub-margin")).toString(),
					"onInput": function (event: InputEvent) {
						let target = <HTMLInputElement>event.target;
						localStorage.setItem("sub-margin", target.value);
						setSubtitleMargin(curTrack);
					}
				}
			]
		},

		{
			"id": "source",
			"selectableScene": true,
			"heading": {
				"text": "Sources",
			},
			"items": [

			]
		},

		{
			"id": "fillmode",
			"selectableScene": true,
			"heading": {
				"text": "Fill Mode",
			},
			"items": [
				{
					"text": "Normal",
					"highlightable": true,
					"selected": fMode == 0,
					"id": "fMode0",
					"callback": () => {
						vidInstance.setObjectSettings(0);
					}
				},
				{
					"text": "Stretch",
					"highlightable": true,
					"selected": fMode == 1,
					"id": "fMode1",
					"callback": () => {
						vidInstance.setObjectSettings(1);
					}
				},
				{
					"text": "Subtitles",
					"highlightable": true,
					"selected": fMode == 2,
					"id": "fMode2",
					"callback": () => {
						vidInstance.setObjectSettings(2);
					}
				},
				{
					"text": "Fill",
					"highlightable": true,
					"selected": fMode == 3,
					"id": "fMode3",
					"callback": () => {
						vidInstance.setObjectSettings(3);
					}
				}
			]
		},

		{
			"id": "config",
			"heading": {
				"text": "Configuration",
			},
			"items": [
				{
					"text": "Autoplay",
					"toggle": true,
					"on": localStorage.getItem("autoplay") === "true",
					"toggleOn": function () {
						localStorage.setItem("autoplay", "true");
					},
					"toggleOff": function () {
						localStorage.setItem("autoplay", "false");
					}
				},
				{
					"text": "Skip broken segments",
					"toggle": true,
					"on": localStorage.getItem("skipBroken") === "true",
					"toggleOn": function () {
						localStorage.setItem("skipBroken", "true");
					},
					"toggleOff": function () {
						localStorage.setItem("skipBroken", "false");
					}
				},
				{
					"text": "Rewatch Mode",
					"toggle": true,
					"on": localStorage.getItem("rewatch") === "true",
					"toggleOn": function () {
						localStorage.setItem("rewatch", "true");
					},
					"toggleOff": function () {
						localStorage.setItem("rewatch", "false");
					}
				},
				{
					"text": "Hide Skip Intro",
					"toggle": true,
					"on": localStorage.getItem("showIntro") === "true",
					"toggleOn": function () {
						localStorage.setItem("showIntro", "true");
					},
					"toggleOff": function () {
						localStorage.setItem("showIntro", "false");
					}
				},
				{
					"text": "Automatically Skip Intro",
					"toggle": true,
					"on": localStorage.getItem("autoIntro") === "true",
					"toggleOn": function () {
						localStorage.setItem("autoIntro", "true");
					},
					"toggleOff": function () {
						localStorage.setItem("autoIntro", "false");
					}
				},
				{
					"text": "Double Tap Time",
					"textBox": true,
					"value": doubleTapTime.toString(),
					"onInput": function (event: InputEvent) {
						let target = <HTMLInputElement>event.target;

						if (isNaN(parseInt(target.value))) {
							target.value = "";
						} else {
							localStorage.setItem("doubleTapTime", target.value);
							doubleTapTime = isNaN(parseInt(localStorage.getItem("doubleTapTime"))) ? 5 : parseInt(localStorage.getItem("doubleTapTime"));
						}

					}
				},
				{
					"text": "Skip Button Time",
					"textBox": true,
					"value": skipButTime.toString(),
					"onInput": function (event: InputEvent) {
						let target = <HTMLInputElement>event.target;
						if (isNaN(parseInt(target.value))) {
							target.value = "";
						} else {
							localStorage.setItem("skipButTime", target.value);
							skipButTime = isNaN(parseInt(localStorage.getItem("skipButTime"))) ? 5 : parseInt(localStorage.getItem("skipButTime"));
						}
					}
				}
			]
		}
	], document.querySelector(".menuCon"));



function setSubtitleMarginMain(track: TextTrack) {
	let success = -1;
	try {
		let subMargin = parseInt(localStorage.getItem("sub-margin"));
		if (track && "cues" in track) {
			if (!isNaN(subMargin)) {
				for (let j = 0; j < track.cues.length; j++) {
					success = 1;
					(<VTTCue>track.cues[j]).line = -subMargin;
				}
			} else {
				success = -2;
			}
		}
	} catch (err) {
		success = -1;
	}

	return success;
}

function setSubtitleMargin(track: TextTrack, count = 0) {
	let status = setSubtitleMarginMain(track);
	if (status === -1 && count < 20) {
		setTimeout(function () {
			setSubtitleMargin(track, ++count);
		}, 400);
	}
}

// Should be declared before vidInstance is initialised
window.addEventListener("videoStartInterval", () => {
	setInterval(function () {
		if (config.beta) {
			window.parent.postMessage({ "action": 301, "elapsed": vidInstance.vid.currentTime, "isPlaying": !vidInstance.vid.paused }, "*");
		}

		try {
			if (skipIntroInfo && vidInstance.vid.currentTime > skipIntroInfo.start && vidInstance.vid.currentTime < skipIntroInfo.end) {
				if (localStorage.getItem("autoIntro") === "true") {
					vidInstance.vid.currentTime = skipIntroInfo.end;
				}

				if (localStorage.getItem("showIntro") !== "true") {
					document.getElementById("skipIntroDOM").style.display = "block";
				} else {
					document.getElementById("skipIntroDOM").style.display = "none";

				}

			} else {
				document.getElementById("skipIntroDOM").style.display = "none";

			}
		} catch (err) {

		}

		if (((new Date()).getTime() - vidInstance.lastTime) > 3000 && vidInstance.open == 1) {
			vidInstance.close_controls();
		}
	}, 1000);

});

function normalise(url: string): string {
	url = url.replace("?watch=", "");
	url = url.split("&engine=")[0];
	return url;
}

// @ts-ignore
function checkIfExists(localURL: string): Promise<string> {
	return (new Promise(function (resolve, reject) {
		let timeout = setTimeout(function () {
			reject(new Error("timeout"));
		}, 1000);

		(<cordovaWindow>window.parent).makeLocalRequest("GET", `${localURL}`).then(function () {
			clearTimeout(timeout);
			resolve("yes");
		}).catch(function (err: Error) {
			clearTimeout(timeout);
			reject(err);
		});
	}));
}


function sendNoti(notiConfig: any) {
	return new notification(document.getElementById("noti_con"), {
		"perm": notiConfig[0],
		"color": notiConfig[1],
		"head": notiConfig[2],
		"notiData": notiConfig[3]
	});
}

function nextTrack() {
	let curTime = vidInstance.vid.currentTime;
	let check = false;
	for (let i = 0; i < curTrack.cues.length; i++) {
		if (curTrack.cues[i].startTime > curTime) {
			nextTrackTime = curTrack.cues[i].startTime;
			check = true;
			break;
		}

	}
	if (check === false) {
		nextTrackTime = vidInstance.vid.duration;
	}
}

function skipToNextTrack() {
	if (curTrack instanceof TextTrack && !isNaN(Math.floor(nextTrackTime))) {
		vidInstance.vid.currentTime = nextTrackTime - 2;
	}
}

function backToNormal() {
	window.parent.postMessage({ "action": 401 }, "*");
	document.getElementById('pop').style.display = "block";
	document.getElementById('popOut').style.display = "none";
	document.getElementById('bar_con').style.display = "block";
}

function getEpIni() {
	vidInstance.setObjectSettings(1, false);

	let param = decodeURIComponent(location.search.replace("?watch=", ""));
	if (downloaded) {
		let rootDir = decodeURIComponent(location.search.replace("?watch=", "").split("&")[0]);

		// Getting the meta data
		(<cordovaWindow>window.parent).makeLocalRequest("GET", `${rootDir}/viddata.json`).then(function (vidString) {
			let viddata = JSON.parse(vidString).data;

			currentVidData = viddata;

			if ("next" in currentVidData && currentVidData.next) {
				let tempData = currentVidData.next.split("&");
				tempData.pop();
				let temp = tempData.join("&");
				delete currentVidData["next"];
				try {

					(<cordovaWindow>window.parent).makeLocalRequest("GET", `/${rootDir.split("/")[1]}/${btoa(temp)}/.downloaded`).then((x) => {
						currentVidData.next = encodeURIComponent(`/${rootDir.split("/")[1]}/${btoa(temp)}`);
						document.getElementById("next_ep").style.display = "table-cell";

					}).catch((x) => console.error(x));

				} catch (err) {

				}
			}

			if ("prev" in currentVidData && currentVidData.prev) {
				let tempData = currentVidData.prev.split("&");
				tempData.pop();
				let temp = tempData.join("&");
				delete currentVidData["prev"];
				try {
					(<cordovaWindow>window.parent).makeLocalRequest("GET", `/${rootDir.split("/")[1]}/${btoa(temp)}/.downloaded`).then((x) => {
						currentVidData.prev = encodeURIComponent(`/${rootDir.split("/")[1]}/${btoa(temp)}`);
						document.getElementById("prev_ep").style.display = "table-cell";

					}).catch((error: Error) => console.error(error));
				} catch (err) {

				}
			}

			let skipIntro: skipData;
			if ("skipIntro" in viddata.sources[0]) {
				skipIntro = viddata.sources[0].skipIntro;
			}
			currentVidData.sources = [{
				"name": viddata.sources[0].name,
				"type": viddata.sources[0].type,
				"url": viddata.sources[0].type == 'hls' ? `${rootDir}/master.m3u8` : `${(<cordovaWindow>window.parent).cordova.file.externalDataDirectory}/${rootDir}/master.m3u8`,
			}];

			if (skipIntro) {
				currentVidData.sources[0].skipIntro = skipIntro;
			}

			engine = currentVidData.engine;
			getEp();
		}).catch(function (err: Error) {
			alert(err);
		});

	} else {
		window.parent.postMessage({ "action": 5, "data": `${param}` }, "*");
	}
}

function changeEp(nextOrPrev: number, msg: null | string = null) {

	// Discarding all text tracks
	for (var i = 0; i < vidInstance.vid.textTracks.length; i++) {
		vidInstance.vid.textTracks[i].mode = "hidden";
	}

	let newLocation = "";
	if (nextOrPrev == 1 && currentVidData.next) {
		newLocation = "?watch=" + (currentVidData.next);
	} else if (nextOrPrev == -1 && currentVidData.prev) {
		newLocation = "?watch=" + (currentVidData.prev);
	} else if (nextOrPrev == 0) {
		newLocation = msg;
	}


	if (newLocation) {
		history.replaceState({ page: 1 }, "", newLocation);
		currentVidData = null;
		vidInstance.vid.pause();
		vidInstance.vid.src = "";
		vidInstance.vid.load();
		clearInterval(updateCurrentTime);
		document.getElementById("ep_dis").innerHTML = "loading...";
		document.getElementById("total").innerHTML = "";
		ini_main();
	}
}



function ini_main() {
	if (getEpCheck != 1) {

		clearInterval(updateCurrentTime);
		curTrack = undefined;
		document.getElementById("fastFor").style.display = "none";

		updateCurrentTime = 0;
		getEpCheck = 0;
		lastUpdate = -1;
		updateCheck = 0;
		int_up = 3000;
		vidInstance.vid.currentTime = 0;


		getEpIni();

		try {
			navigator.mediaSession.setActionHandler('nexttrack', () => {
				changeEp(1);

			});
			navigator.mediaSession.setActionHandler('previoustrack', () => {
				changeEp(-1);

			});
		}
		catch (error) {

		}

	}
}

async function update(shouldCheck: number) {
	let currentTime = vidInstance.vid.currentTime;
	let currentDuration = Math.floor(vidInstance.vid.duration);

	if (updateCheck == 1 && (vidInstance.vid.currentTime - lastUpdate) > 60 && shouldCheck != 19) {
		alert("Could not sync time with the server.");
	}

	if ((updateCheck == 1 || getEpCheck == 1 || lastUpdate == currentTime) && shouldCheck != 19) {
		return;
	}

	updateCheck = 1;

	(<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 1, "time": currentTime, "ep": currentVidData.episode, "name": currentVidData.nameWSeason, "nameUm": currentVidData.name, "prog": currentDuration }, () => { }, [], true, false).then(function (response: any) {
		try {
			if (response.status == 200) {
				lastUpdate = currentTime;

			} else if ("errorCode" in response && response["errorCode"] == 70001) {
				window.parent.postMessage({ "action": 21, data: "" }, "*");

			}
		} catch (err) {

		}

	}).catch(function (error: Error) {
		console.error(error);

	}).finally(function () {
		updateCheck = 0;
		if (currentTime != lastUpdate) {
			errorCount++;
		} else {
			errorCount = 0;
		}

		if (errorCount > 10) {
			errorCount = 0;
			alert("Time could not be synced with the server.");

		} else if (errorCount == 5) {
			lastUpdate = vidInstance.vid.currentTime;
		}

	});

}


function chooseQualHls(x: string, type: string, elem: HTMLElement): void {
	hls.loadLevel = parseInt(x);
	localStorage.setItem("hlsqual", x);
	localStorage.setItem("hlsqualnum", parseInt(elem.innerText).toString());
}


function loadSubs(sourceName: string) {
	let vidDom = document.getElementById("v").children;



	while (vidDom.length > 0) {
		vidDom[0].remove();
	}

	DMenu.getScene("subtitles").deleteItems();
	DMenu.getScene("subtitles").addItem({
		"text": "Subtitles",
	}, true);
	if ("subtitles" in currentVidData && currentVidData["subtitles"].length > 0) {

		let selectFunc = function () {
			let value = this.getAttribute("value");
			if (value == "off") {
				localStorage.setItem(`${engine}-${sourceName}-subtitle`, "off");
				curTrack = undefined;
				document.getElementById("fastFor").style.display = "none";

			}

			for (let i = 0; i < vidInstance.vid.textTracks.length; i++) {
				if (i == parseInt(value)) {
					vidInstance.vid.textTracks[i].mode = "showing";
					curTrack = vidInstance.vid.textTracks[i];
					setSubtitleMargin(curTrack);
					document.getElementById("fastFor").style.display = "block";
					localStorage.setItem(`${engine}-${sourceName}-subtitle`, vidInstance.vid.textTracks[i].label);
				} else {
					vidInstance.vid.textTracks[i].mode = "hidden";

				}
			}

		};

		DMenu.getScene("subtitles").addItem({
			"text": "off",
			"callback": selectFunc,
			"attributes": {
				"value": "off",
			},
			"highlightable": true,
			"id": `subtitle-off`,
		});


		for (var i = 0; i < currentVidData.subtitles.length; i++) {
			DMenu.getScene("subtitles").addItem({
				"text": currentVidData.subtitles[i].label,
				"callback": selectFunc,
				"attributes": {
					"value": i.toString(),
				},
				"highlightable": true,
				"id": `subtitle-${i}`
			});


			let trackDOM = createElement({
				"element": "track",
				"attributes": {
					"kind": "subtitles",
					"label": currentVidData.subtitles[i].label,
					"src": currentVidData.subtitles[i].file
				},
				"innerText": currentVidData.subtitles[i].label
			});

			document.getElementById("v").append(trackDOM);
		}




		let check = true;
		for (var i = 0; i < vidInstance.vid.textTracks.length; i++) {
			if (vidInstance.vid.textTracks[i].label == localStorage.getItem(`${engine}-${sourceName}-subtitle`) && check) {
				console.log("e");
				let subDOM: Selectables = DMenu.selections[`subtitle-${i}`];
				console.log(subDOM);

				if (subDOM) {
					subDOM.select();
				}
				curTrack = vidInstance.vid.textTracks[i];
				setSubtitleMargin(curTrack);

				document.getElementById("fastFor").style.display = "block";

				vidInstance.vid.textTracks[i].mode = "showing";
				check = false;

			} else {
				vidInstance.vid.textTracks[i].mode = "hidden";

			}
		}


		if (check) {
			DMenu.selections["subtitle-off"].selectWithCallback();
		}
	}
}

function chooseQual(config: sourceConfig) {
	let skipTo = 0;
	let defURL: string = "";
	let selectedSourceName: string;

	if (config.clicked) {
		selectedSourceName = config.name;
		skipTo = vidInstance.vid.currentTime;
		if (config.element.getAttribute("data-intro") === "true") {
			skipIntroInfo.start = parseInt(config.element.getAttribute("data-start"));
			skipIntroInfo.end = parseInt(config.element.getAttribute("data-end"));
		} else {
			skipIntroInfo = {
				start: 0,
				end: 0
			};
		}

	} else {
		skipTo = config.skipTo;
		defURL = currentVidData.sources[0].url;

		let sName = localStorage.getItem(`${engine}-sourceName`);
		let qCon = DMenu.getScene("source").element.querySelectorAll(".menuItem");
		selectedSourceName = sName;
		for (let i = 0; i < qCon.length; i++) {
			if (sName == qCon[i].getAttribute("data-name")) {
				defURL = currentVidData.sources[i].url;
				if (qCon[i].getAttribute("data-intro") === "true") {
					skipIntroInfo.start = parseInt(qCon[i].getAttribute("data-start"));
					skipIntroInfo.end = parseInt(qCon[i].getAttribute("data-end"));
				} else {
					skipIntroInfo = {
						start: 0,
						end: 0
					};
				}

				let sourceItem = DMenu.selections[`source-${qCon[i].getAttribute("data-name")}`];
				if (sourceItem) {
					sourceItem.select();
				}
				break;
			}
		}
	}

	loadSubs(selectedSourceName);

	if (hls) {
		hls.destroy();
	}

	if (config.type == "hls") {
		//@ts-ignore
		if (Hls.isSupported()) {
			if (typeof engine === "number" &&
				extensionList[engine] &&
				extensionList[engine].config &&
				!isChrome &&
				CustomXMLHttpRequest != (<cordovaWindow>window.parent).XMLHttpRequest) {
				CustomXMLHttpRequest = XMLHttpRequest2;
			}

			//@ts-ignore
			hls = new Hls({});

			if (localStorage.getItem("skipBroken") === "true") {
				lastFragError = -10;
				fragErrorCount = 0;

				//@ts-ignore
				hls.on(Hls.Events.BUFFER_APPENDING, function (event, data) {
					if (localStorage.getItem("skipBroken") !== "true") {
						return;
					}
					fragErrorCount = 0;
				});

				// @ts-ignore
				hls.on(Hls.Events.ERROR, function (event, data) {
					if (localStorage.getItem("skipBroken") !== "true") {
						return;
					}

					console.log(data);
					const errorFatal = data.fatal;
					if (data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
						data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT ||
						data.details === Hls.ErrorDetails.FRAG_PARSING_ERROR) {
						lastFragError = data.frag.start;
						lastFragDuration = data.frag.duration;
						if ((errorFatal || (data.frag.start - vidInstance.vid.currentTime) < 0.3) && fragErrorCount < 10) {
							vidInstance.vid.currentTime = data.frag.start + data.frag.duration + 0.3;
							fragErrorCount++;
							hls.startLoad();
						}
					} else if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
						console.log(lastFragError, lastFragDuration, vidInstance.vid.currentTime);
						if ((Math.abs(lastFragError - vidInstance.vid.currentTime) < 0.3) && fragErrorCount < 10) {
							vidInstance.vid.currentTime = lastFragError + lastFragDuration + 0.3;
							fragErrorCount++;
							hls.startLoad();
						}
					}
				});
			}

			if (!config.clicked) {
				hls.loadSource(defURL);
			}
			else {
				hls.loadSource(config.url);
			}

			hls.attachMedia(vidInstance.vid);

			//@ts-ignore
			hls.on(Hls.Events.MANIFEST_PARSED, function () {
				vidInstance.vid.currentTime = skipTo;
				vidInstance.vid.play();
				loadHLSsource();
			});
		}

	}
	else {
		try {
			if (!config.clicked) {
				vidInstance.vid.src = defURL;
			} else {
				vidInstance.vid.src = config.url;
			}

			vidInstance.vid.currentTime = skipTo;
			vidInstance.vid.load();
			vidInstance.vid.play();

		} catch (err) {
			console.error(err);
			sendNoti([0, null, "Error", "Wait until the episode is being loaded."]);

		}
	}
}


function loadHLSsource() {
	try {

		DMenu.getScene("quality").deleteItems();
		DMenu.getScene("quality").addItem({
			"text": "Quality",
		}, true);


		let hlsqualnum = parseInt(localStorage.getItem("hlsqualnum"));
		let hslLevel = -1;
		if (isNaN(hlsqualnum)) {
			hslLevel = -1;
		}
		else {
			let differences = [];
			for (let i = 0; i < hls.levels.length; i++) {
				differences.push(Math.abs(hlsqualnum - hls.levels[i].height));
			}

			let min = differences[0];
			let minIndex = 0;

			for (let i = 0; i < differences.length; i++) {
				if (min > differences[i]) {
					minIndex = i;
					min = differences[i];
				}
			}

			hslLevel = minIndex;
		}

		hls.loadLevel = hslLevel;

		for (var i = -1; i < hls.levels.length; i++) {

			let selected = false;
			if (i == hslLevel) {
				selected = true;
			}

			DMenu.getScene("quality").addItem({
				"text": (i == -1) ? "Auto" : hls.levels[i].height + "p",
				"attributes": {
					"data-url": i.toString(),
					"data-type": "hls",
				},
				"callback": function () {
					chooseQualHls(this.getAttribute("data-url"), this.getAttribute("data-type"), this);
				},
				"highlightable": true,
				"selected": selected,
			}, false);

		}
	} catch (err) {
		console.error(err);
	}
}


async function getEp(x = 0) {
	if (getEpCheck == 1) {
		return;
	}

	getEpCheck = 1;

	try {
		DMenu.getScene("source").deleteItems();
		DMenu.getScene("source").addItem({
			"text": "Sources",
		}, true);
		for (var i = 0; i < currentVidData.sources.length; i++) {

			let curAttributes: SourceDOMAttributes = {
				"data-url": currentVidData.sources[i].url,
				"data-type": currentVidData.sources[i].type,
				"data-name": currentVidData.sources[i].name,
			};

			if ("skipIntro" in currentVidData.sources[i] && "start" in currentVidData.sources[i].skipIntro && "end" in currentVidData.sources[i].skipIntro) {
				curAttributes["data-intro"] = "true";
				curAttributes["data-start"] = currentVidData.sources[i].skipIntro.start;
				curAttributes["data-end"] = currentVidData.sources[i].skipIntro.end;
				if (i == 0) {
					skipIntroInfo.start = currentVidData.sources[i].skipIntro.start;
					skipIntroInfo.end = currentVidData.sources[i].skipIntro.end;
				}
			}


			DMenu.getScene("source").addItem(
				{
					"text": currentVidData.sources[i].name,
					"highlightable": true,
					"attributes": curAttributes as unknown as { [key: string]: string; },
					"id": `source-${currentVidData.sources[i].name}`,
					"callback": function () {
						localStorage.setItem(`${engine}-sourceName`, this.getAttribute("data-name"));
						chooseQual(<sourceConfig>{
							url: this.getAttribute("data-url"),
							type: this.getAttribute("data-type"),
							name: this.getAttribute("data-name"),
							element: this,
							clicked: true,
						});
					},
					"selected": i == 0
				}
			)

		}


		if (typeof currentVidData.prev == "undefined" || currentVidData.prev == null) {
			document.getElementById("prev_ep").style.display = "none";
		} else {
			document.getElementById("prev_ep").style.display = "table-cell";
		}

		if (typeof currentVidData.next == "undefined" || currentVidData.next == null) {
			document.getElementById("next_ep").style.display = "none";
		}
		else {
			document.getElementById("next_ep").style.display = "table-cell";
		}



		let response = await (<cordovaWindow>window.parent).apiCall("POST",
			{
				"username": username,
				"action": 2,
				"name": currentVidData.nameWSeason,
				"nameUm": currentVidData.name,
				"ep": currentVidData.episode,
				"cur": location.search
			}, () => { });


		document.getElementById("ep_dis").innerHTML = currentVidData.episode.toString();
		clearInterval(updateCurrentTime);
		updateCurrentTime = window.setInterval(update, int_up);

		let skipTo = 0;

		if (localStorage.getItem("rewatch") == "true") {

		} else {
			skipTo = response.data.time;
		}

		chooseQual(<sourceConfig>{
			type: currentVidData.sources[0].type,
			skipTo,
			clicked: false,
		});

		getEpCheck = 0;

	} catch (error) {
		console.error(error);
		sendNoti([0, null, "Error", error]);
	}

}


function openSettingsSemi(translateY: number) {
	let settingCon = document.querySelector<HTMLElement>(".menuCon");
	settingCon.style.display = "block";
	settingCon.style.pointerEvents = "auto";
	settingCon.style.opacity = "1";
	if (translateY == -1) {
		settingCon.style.transform = "translateY(0px)";
	} else if (translateY == 0) {
		settingCon.style.transform = "translateY(100%)";

	} else {
		settingCon.style.transform = `translateY(calc(100% + ${-translateY + 50}px))`;
	}

}

function closeSettings() {
	let settingCon = document.querySelector<HTMLElement>(".menuCon");
	settingCon.style.transitionDuration = "0.2s";
	window.requestAnimationFrame(function () {
		window.requestAnimationFrame(function () {
			settingCon.style.transform = "translateY(100%)";
			settingCon.style.opacity = "0";
			settingCon.style.pointerEvents = "none";
			setTimeout(function () {
				settingCon.style.transitionDuration = "0s";
			}, 200);
		});
	});
}

function isLocked(): boolean {
	return vidInstance.locked;
}


document.querySelector<HTMLElement>("#repBack").onclick = function () {
	vidInstance.vid.currentTime -= skipButTime;
	vidInstance.updateTime();

};


document.querySelector<HTMLElement>("#popOut").onclick = function () {
	backToNormal();
};


document.querySelector<HTMLElement>("#repForward").onclick = function () {
	vidInstance.vid.currentTime += skipButTime;
	vidInstance.updateTime();
};

document.getElementById("fullscreenToggle").onclick = function () {
	vidInstance.goFullScreen();
};

document.getElementById("skipIntroDOM").onclick = function () {
	if ("end" in skipIntroInfo && !isNaN(skipIntroInfo.end)) {
		vidInstance.vid.currentTime = skipIntroInfo.end;
		document.getElementById("skipIntroDOM").style.display = "none";
	}
}

document.getElementById("fastFor").addEventListener("click", function () {
	skipToNextTrack();
});

document.querySelector<HTMLElement>("#next_ep").onclick = function () {
	changeEp(1);
}

document.querySelector<HTMLElement>("#prev_ep").onclick = function () {
	changeEp(-1);
}


document.querySelector("#setting_icon").addEventListener("click", function () {
	openSettingsSemi(-1);
});

window.onmessage = async function (message: MessageEvent) {

	if (message.data.action == 1) {
		currentVidData = message.data;


		if ("title" in currentVidData) {
			document.getElementById("titleCon").innerText = currentVidData.title as string;
		} else {

			document.getElementById("titleCon").innerText = "";
			try {
				extensionList[engine].getVideoTitle(window.location.search).then((title: string) => {
					document.getElementById("titleCon").innerText = title;
				}).catch((err: Error) => {
					console.log(err);
					document.getElementById("titleCon").innerText = "";
				});
			} catch (err) {

			}
		}
		if (config.chrome) {
			getEp();
		} else {
			let mainName = localStorage.getItem("mainName");
			let rootDir = `/${mainName}/${btoa(normalise(location.search))}`;
			let localURL = `${rootDir}/.downloaded`;

			try {
				await checkIfExists(localURL);
				let res: boolean;
				if (localStorage.getItem("alwaysDown") === "true") {
					res = true;
				} else {
					res = confirm("Want to open the downloaded version?");
				}
				if (res) {
					let vidString = (await (<cordovaWindow>window.parent).makeLocalRequest("GET", `${rootDir}/viddata.json`));
					let viddata: videoData = JSON.parse(vidString).data;
					currentVidData.sources = [{
						"name": viddata.sources[0].name,
						"type": viddata.sources[0].type,
						"url": viddata.sources[0].type == 'hls' ? `${rootDir}/master.m3u8` : `${(<cordovaWindow>window.parent).cordova.file.externalDataDirectory}/${rootDir}/master.m3u8`,
					}];
					CustomXMLHttpRequest = (<cordovaWindow>window.parent).XMLHttpRequest;
				}
			} catch (err) {
				console.error(err);
			} finally {
				getEp();
			}
		}
	} else if (message.data.action == "play") {
		vidInstance.vid.play();
	} else if (message.data.action == "pause") {
		vidInstance.vid.pause();
	} else if (message.data.action == "toggle") {
		vidInstance.togglePlay();
	} else if (message.data.action == "next") {
		changeEp(1);
	} else if (message.data.action == "previous") {
		changeEp(-1);
	} else if (message.data.action == "elapsed") {
		vidInstance.vid.currentTime = message.data.elapsed;
	} else if (parseInt(message.data.action) == 200) {
		let token = message.data.data;
		if (config.chrome == false && token.indexOf("connect.sid") == -1) {
			window.parent.postMessage({ "action": 21, data: "" }, "*");
		} else {
			ini_main();
		}
	} else if (message.data.action == 4) {
		changeEp(0, message.data.data);
	}
};

window.parent.postMessage({ "action": 401, data: "landscape" }, "*");


window.addEventListener("keydown", function (event) {

	if (event.keyCode == 32) {
		vidInstance.togglePlay();
	}
	else if (event.keyCode == 38 || event.keyCode == 40) {
		vidInstance.updateTimeout();
	} else if (event.keyCode == 39) {
		if (vidInstance.seekMode || config.chrome) {
			vidInstance.vid.currentTime += 30;
			vidInstance.updateTime();
			event.preventDefault();
		} else {
			vidInstance.updateTimeout();

		}
	} else if (event.keyCode == 37) {
		if (vidInstance.seekMode || config.chrome) {
			vidInstance.vid.currentTime -= 30;
			vidInstance.updateTime();

			event.preventDefault();

		} else {
			vidInstance.updateTimeout();

		}

	} else if (event.keyCode == 77) {
		vidInstance.toggleMute();

	} else if (event.keyCode == 70) {
		vidInstance.goFullScreen();

	} else if (event.keyCode == 76) {
		vidInstance.toggleLock();

	} else if (event.keyCode == 80) {
		vidInstance.togglePictureInPicture();

	}
});


window.addEventListener("videoDurationChanged", () => {
	try {
		(<cordovaWindow>window.parent).apiCall("POST",
			{
				"username": username,
				"action": 2,
				"name": currentVidData.nameWSeason,
				"nameUm": currentVidData.name,
				"ep": currentVidData.episode,
				"duration": Math.floor(vidInstance.vid.duration),
				"cur": location.search
			}, () => { });
	} catch (err) {
		console.error(err);
	}
});


window.addEventListener("videoTimeUpdated", () => {

	if (curTrack instanceof TextTrack) {
		nextTrack();
	}

});


window.addEventListener("videoLoadedMetaData", () => {

	window.parent.postMessage({
		"action": 12,
		nameShow: currentVidData.name,
		episode: currentVidData.episode,
		prev: true,
		next: true,
		"duration": vidInstance.vid.duration,
		"elapsed": vidInstance.vid.currentTime
	}, "*");

	vidInstance.total.innerText = vidInstance.timeToString(vidInstance.vid.duration);
	let whichFit = parseInt(localStorage.getItem("fillMode")) || 0;
	vidInstance.setObjectSettings(whichFit);

});

window.addEventListener("videoEnded", () => {
	if (localStorage.getItem("autoplay") == "true") {
		changeEp(1);
	}
});


window.addEventListener("videoChangedFillMode", (event: videoChangedFillModeEvent) => {
	DMenu.selections[`fMode${event.detail.fillMode}`].select();
});

window.addEventListener("videoOpenSettings", (event: videoOpenSettingsEvent) => {
	openSettingsSemi(event.detail.translate);
});


window.addEventListener("videoCloseSettings", (event) => {
	closeSettings();
});


window.addEventListener("videoDoubleTap", (event: videoDoubleTapEvent) => {
	let type = event.detail.DTType;

	if (type == "plus") {
		vidInstance.vid.currentTime += doubleTapTime;
	} else {
		vidInstance.vid.currentTime -= doubleTapTime;
	}
});

window.addEventListener("videoSeeked", (event) => {
	try {
		update(19);
		lastUpdate = vidInstance.vid.currentTime;
	} catch (err) {

	}
});

vidInstance = new vid(config);


if (downloaded) {
	CustomXMLHttpRequest = (<cordovaWindow>window.parent).XMLHttpRequest;
}

if (engineTemp.length == 1) {
	engine = 0;
} else {
	engine = parseInt(engineTemp[1]);
}


DMenu.open("initial");
DMenu.closeMenu();
if (config.chrome) {
	document.getElementById("fullscreenToggle").style.display = "block";
}

if (config.local || downloaded) {
	ini_main();
} else {
	window.parent.postMessage({ "action": 20, data: "" }, "*");
}

let settingsPullInstance = new settingsPull(document.getElementById("settingHandlePadding"), closeSettings);
let settingsPullInstanceTT = new settingsPull(document.querySelector(".menuCon"), closeSettings, true);

applyTheme();
applySubtitleConfig();
