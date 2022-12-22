interface skipData{
	start : number,
	end : number
}

interface videoSource{
	name : string,
	type : string,
	url : string,
	skipIntro? : skipData
}

interface videoSubtitle{
	file : string,
	label : string
}

interface videoData{
	next? : string | null,
	prev? : string | null,
	sources : Array<videoSource>,
	episode : number,
	name : string,
	nameWSeason : string,
	subtitles : Array<videoSubtitle>
	engine? : number
}

interface videoDoubleTapEvent extends Event{
	DTType : string
}

interface videoOpenSettingsEvent extends Event{
	translate : number
}

interface videoChangedFillModeEvent extends Event{
	fillMode : string
}

interface cordovaWindow extends Window{
	cordova : any,
	makeLocalRequest : Function,
	apiCall : Function,
	returnExtensionList: Function,
	XMLHttpRequest : any
}

var username = "hi";
var lastSrc = "";
const extensionList = (<cordovaWindow>window.parent).returnExtensionList();
var token;
var hls;
let doubleTapTime = isNaN(parseInt(localStorage.getItem("doubleTapTime"))) ? 5 : parseInt(localStorage.getItem("doubleTapTime"));
let skipButTime = isNaN(parseInt(localStorage.getItem("skipButTime"))) ? 30 : parseInt(localStorage.getItem("skipButTime"));
let data_main : videoData;
let skipIntroInfo : skipData = {
	start : 0,
	end : 0
};
var CustomXMLHttpRequest = XMLHttpRequest;
let curTrack = undefined;
let marginApplied = false;


function setSubtitleMarginMain(track : TextTrack) {
	let success = -1;
	try {
		let subMargin = parseInt(localStorage.getItem("sub-margin"));
		if (track && "cues" in track) {
			if (!isNaN(subMargin) && subMargin !== 0) {
				for (let j = 0; j < track.cues.length; j++) {
					success = 1;
					(<VTTCue>track.cues[j]).line = subMargin;
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

function setSubtitleMargin(track : TextTrack, count = 0) {
	let status = setSubtitleMarginMain(track);
	if (status === -1 && count < 20) {
		setTimeout(function () {
			setSubtitleMargin(track, ++count);
		}, 400);
	}
}



window.addEventListener("videoStartInterval", () => {

	setInterval(function () {
		if (config.beta) {
			window.parent.postMessage({ "action": 301, "elapsed": a.vid.currentTime, "isPlaying": !a.vid.paused }, "*");
		}

		try {
			if (skipIntroInfo && a.vid.currentTime > skipIntroInfo.start && a.vid.currentTime < skipIntroInfo.end) {
				if (localStorage.getItem("autoIntro") === "true") {
					a.vid.currentTime = skipIntroInfo.end;
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

		if (((new Date()).getTime() - a.lastTime) > 3000 && a.open == 1) {
			a.close_controls();
		}
	}, 1000);

});

let fMode = parseInt(localStorage.getItem("fillMode"));
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
					"highlightable" : true,
					"selected" : fMode == 0,
					"id" : "fMode0",
					"callback" : () =>{
						a.setObjectSettings(0);
					}
				},
				{
					"text": "Stretch",
					"highlightable" : true,
					"selected" : fMode == 1,
					"id" : "fMode1",
					"callback" : () =>{
						a.setObjectSettings(1);
					}
				},
				{
					"text": "Subtitles",
					"highlightable" : true,
					"selected" : fMode == 2,
					"id" : "fMode2",
					"callback" : () =>{
						a.setObjectSettings(2);
					}
				},
				{
					"text": "Fill",
					"highlightable" : true,
					"selected" : fMode == 3,
					"id" : "fMode3",
					"callback" : () =>{
						a.setObjectSettings(3);
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
					"toggle" : true,
					"on" : localStorage.getItem("autoplay") === "true",
					"toggleOn" : function(){
						localStorage.setItem("autoplay", "true");
					},
					"toggleOff" : function(){
						localStorage.setItem("autoplay", "false");
					}
				},
				{
					"text": "Rewatch Mode",
					"toggle" : true,
					"on" : localStorage.getItem("rewatch") === "true",
					"toggleOn" : function(){
						localStorage.setItem("rewatch", "true");
					},
					"toggleOff" : function(){
						localStorage.setItem("rewatch", "false");
					}
				},
				{
					"text": "Hide Skip Intro",
					"toggle" : true,
					"on" : localStorage.getItem("showIntro") === "true",
					"toggleOn" : function(){
						localStorage.setItem("showIntro", "true");
					},
					"toggleOff" : function(){
						localStorage.setItem("showIntro", "false");
					}
				},
				{
					"text": "Automatically Skip Intro",
					"toggle" : true,
					"on" : localStorage.getItem("autoIntro") === "true",
					"toggleOn" : function(){
						localStorage.setItem("autoIntro", "true");
					},
					"toggleOff" : function(){
						localStorage.setItem("autoIntro", "false");
					}
				},
				{
					"text": "Double Tap Time",
					"textBox" : true,
					"value" : doubleTapTime.toString(),
					"onInput" : function(event : InputEvent){
						let target  = <HTMLInputElement>event.target;

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
					"textBox" : true,
					"value" : skipButTime.toString(),
					"onInput" : function(event  : InputEvent){
						let target = <HTMLInputElement>event.target;
						if (isNaN(parseInt(target.value))) {
							target.value = "";
						} else {
							localStorage.setItem("skipButTime", target.value);
							skipButTime = isNaN(parseInt(localStorage.getItem("skipButTime"))) ? 5 : parseInt(localStorage.getItem("skipButTime"));
						}
					}
				},
				{
					"text": "Subtitle Margin",
					"textBox" : true,
					"value" : isNaN(parseInt(localStorage.getItem("sub-margin"))) ? "0" : parseInt(localStorage.getItem("sub-margin")).toString(),
					"onInput" : function(event){
						let target = event.target;
						localStorage.setItem("sub-margin", target.value);
						setSubtitleMargin(curTrack);
					}
				}
			]
		}
	], document.querySelector(".menuCon"));


DMenu.open("initial");
DMenu.closeMenu();
var sid;

let engineTemp = location.search.split("engine=");
let engine;
let nextTrackTime;
if (engineTemp.length == 1) {
	engine = 0;
} else {
	engine = parseInt(engineTemp[1]);
}


let downloaded = localStorage.getItem("offline") === 'true';
if (downloaded) {
	CustomXMLHttpRequest = (<cordovaWindow> window.parent).XMLHttpRequest;
}
let tempConfig = config;


function normalise(x) {
	x = x.replace("?watch=", "");
	x = x.split("&engine=")[0];
	return x;
}


function checkIfExists(localURL) {
	return (new Promise(function (resolve, reject) {
		let timeout = setTimeout(function () {
			reject("timeout");
		}, 1000);
		
		(<cordovaWindow>window.parent).makeLocalRequest("GET", `${localURL}`).then(function (x) {
			clearTimeout(timeout);
			resolve("yes");
		}).catch(function (err) {
			clearTimeout(timeout);
			reject("no");
		});
	}));
}
window.onmessage = async function (x) {
	if (x.data.action == 1) {
		data_main = x.data;
		if (config.chrome) {
			get_ep();
		} else {
			let mainName = localStorage.getItem("mainName");
			let rootDir = `/${mainName}/${btoa(normalise(location.search))}`;
			let localURL = `${rootDir}/.downloaded`;

			try {
				await checkIfExists(localURL);
				let res;
				if (localStorage.getItem("alwaysDown") === "true") {
					res = true;
				} else {
					res = confirm("Want to open the downloaded version?");
				}
				if (res) {
					let viddata = (await (<cordovaWindow>window.parent).makeLocalRequest("GET", `${rootDir}/viddata.json`));
					viddata = JSON.parse(viddata).data;
					data_main.sources = [{
						"name": viddata.sources[0].name,
						"type": viddata.sources[0].type,
						"url": viddata.sources[0].type == 'hls' ? `${rootDir}/master.m3u8` : `${(<cordovaWindow>window.parent).cordova.file.externalDataDirectory}/${rootDir}/master.m3u8`,
					}];
					CustomXMLHttpRequest = (<cordovaWindow>window.parent).XMLHttpRequest;
				}
			} catch (err) {
				console.error(err);
			} finally {
				get_ep();
			}
		}
	} else if (x.data.action == "play") {
		a.vid.play();
	} else if (x.data.action == "pause") {
		a.vid.pause();
	} else if (x.data.action == "toggle") {
		a.togglePlay();
	} else if (x.data.action == "next") {
		next_ep_func(1);
	} else if (x.data.action == "previous") {
		next_ep_func(-1);
	} else if (x.data.action == "elapsed") {
		a.vid.currentTime = x.data.elapsed;
	} else if (parseInt(x.data.action) == 200) {
		token = x.data.data;
		if (config.chrome == false && token.indexOf("connect.sid") == -1) {
			window.parent.postMessage({ "action": 21, data: "" }, "*");

		} else {

			ini_main();




		}
	}



};



window.parent.postMessage({ "action": 401, data: "landscape" }, "*");





function sendNoti(x) {
	return new notification(document.getElementById("noti_con"), {
		"perm": x[0],
		"color": x[1],
		"head": x[2],
		"notiData": x[3]
	});
}



function nextTrack() {
	let curTime = a.vid.currentTime;
	let check = false;

	for (let i = 0; i < curTrack.cues.length; i++) {

		if (curTrack.cues[i].startTime > curTime) {
			nextTrackTime = curTrack.cues[i].startTime;
			check = true;
			break;
		}

	}



	if (check === false) {
		nextTrackTime = a.vid.duration;
	}

}

function skipToNextTrack() {
	if (curTrack instanceof TextTrack && !isNaN(parseInt(nextTrackTime))) {
		a.vid.currentTime = nextTrackTime - 2;
	}
}
document.getElementById("fastFor").onclick = function () {
	skipToNextTrack();
};


function backToNormal() {
	window.parent.postMessage({ "action": 401 }, "*");
	document.getElementById('epCon').style.display = "block";
	document.getElementById('popOut').style.display = "none";
	document.getElementById('bar_con').style.display = "block";
}

window.addEventListener('message', function (x) {
	if (x.data.action == 4) {
		next_ep_func(0, x.data.data);
	}
});
var a = new vid(config);


if (CSS.supports('backdrop-filter: blur(10px)')) {
	document.getElementById("setting_con").style.backgroundColor = "#19181caa";
	document.getElementById("setting_con").style.backdropFilter = " blur(10px)";

} else {
	document.getElementById("setting_con").style.backgroundColor = "#19181c";
}





var set = document.querySelector("#setting_con_main");
var set_con = document.querySelector("#setting_con");
var setting_icon_dom = document.querySelector("#setting_icon");


setting_icon_dom.addEventListener("click", function () {

	openSettingsSemi(-1);
});



function get_ep_ini() {
	a.setObjectSettings(1, false);

	let tttf = decodeURIComponent(location.search.replace("?watch=", ""));
	if (downloaded) {
		let rootDir = decodeURIComponent(location.search.replace("?watch=", "").split("&")[0]);
		(<cordovaWindow>window.parent).makeLocalRequest("GET", `${rootDir}/viddata.json`).then(function (viddata) {
			viddata = JSON.parse(viddata).data;

			data_main = viddata;
			if ("next" in data_main) {
				let tempData = data_main.next.split("&");
				tempData.pop();
				let temp = tempData.join("&");
				delete data_main["next"];
				try {
					(<cordovaWindow>window.parent).makeLocalRequest("GET", `/${rootDir.split("/")[1]}/${btoa(temp)}/.downloaded`).then((x) => {
						data_main.next = encodeURIComponent(`/${rootDir.split("/")[1]}/${btoa(temp)}`);
						document.getElementById("next_ep").style.display = "table-cell";

					}).catch((x) => console.error(x));
				} catch (err) {

				}
			}

			if ("prev" in data_main) {
				let tempData = data_main.prev.split("&");
				tempData.pop();
				let temp = tempData.join("&");
				delete data_main["prev"];
				try {
					(<cordovaWindow>window.parent).makeLocalRequest("GET", `/${rootDir.split("/")[1]}/${btoa(temp)}/.downloaded`).then((x) => {
						data_main.prev = encodeURIComponent(`/${rootDir.split("/")[1]}/${btoa(temp)}`);
						document.getElementById("prev_ep").style.display = "table-cell";

					}).catch((x) => console.error(x));
				} catch (err) {

				}
			}

			let skipIntro;
			if ("skipIntro" in viddata.sources[0]) {
				skipIntro = viddata.sources[0].skipIntro;
			}
			data_main.sources = [{
				"name": viddata.sources[0].name,
				"type": viddata.sources[0].type,
				"url": viddata.sources[0].type == 'hls' ? `${rootDir}/master.m3u8` : `${(<cordovaWindow>window.parent).cordova.file.externalDataDirectory}/${rootDir}/master.m3u8`,
			}];

			if (skipIntro) {
				data_main.sources[0].skipIntro = skipIntro;
			}



			engine = data_main.engine;
			get_ep();
		}).catch(function (err) {
			alert(err);
		});

	} else {
		window.parent.postMessage({ "action": 5, "data": `${tttf}` }, "*");
	}
}
function next_ep_func(t, msg = null) {
	for (var i = 0; i < a.vid.textTracks.length; i++) {
		a.vid.textTracks[i].mode = "hidden";
	}


	if (t == 1 && typeof data_main.next != "undefined") {
		history.replaceState({ page: 1 }, "", "?watch=" + (data_main.next));
		data_main = null;

		a.vid.pause();
		a.vid.src = "";
		a.vid.load();
		clearInterval(update_int);
		document.getElementById("ep_dis").innerHTML = "loading...";
		document.getElementById("total").innerHTML = "";
		ini_main();

	} else if (t == -1 && typeof data_main.prev != "undefined") {
		history.replaceState({ page: 1 }, "", "?watch=" + (data_main.prev));
		data_main = null;


		a.vid.pause();
		a.vid.src = "";
		a.vid.load();
		clearInterval(update_int);
		document.getElementById("ep_dis").innerHTML = "loading...";
		document.getElementById("total").innerHTML = "";
		ini_main();

	} else if (t == 0) {
		history.replaceState({ page: 1 }, "", msg);
		data_main = null;


		a.vid.pause();
		a.vid.src = "";
		a.vid.load();
		clearInterval(update_int);
		document.getElementById("ep_dis").innerHTML = "loading...";
		document.getElementById("total").innerHTML = "";
		ini_main();

	}
}


document.querySelector<HTMLElement>("#next_ep").onclick = function () {

	next_ep_func(1);


}

document.querySelector<HTMLElement>("#prev_ep").onclick = function () {


	next_ep_func(-1);

}


var update_int, get_ep_check, lastUpdate, update_check, int_up, cur_link, name_ep_main, source;
function ini_main() {
	if (get_ep_check != 1) {

		clearInterval(update_int);
		curTrack = undefined;
		document.getElementById("fastFor").style.display = "none";

		update_int = 0;
		get_ep_check = 0;
		lastUpdate = -1;
		update_check = 0;
		int_up = 3000;

		cur_link = location.search;





		a.vid.currentTime = 0;


		get_ep_ini();

		try {
			navigator.mediaSession.setActionHandler('nexttrack', () => {
				next_ep_func(1);

			});
			navigator.mediaSession.setActionHandler('previoustrack', () => {
				next_ep_func(-1);

			});
		}
		catch (error) {

		}

	}
}










let errorCount = 0;
var lastLastcount;
var controller;
let didNotWork1 = 0;
let didNotWork2 = 0;


async function update(x){
	let currentTime = a.vid.currentTime;
	let currentDuration = Math.floor(a.vid.duration);

	if (update_check == 1 && (a.vid.currentTime - lastUpdate) > 60 && x != 19) {
		alert("Could not sync time with the server.");
	}

	if ((update_check == 1 || get_ep_check == 1 || lastUpdate == currentTime) && x != 19) {
		return;
	}

	update_check = 1;

	(<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 1, "time": currentTime, "ep": data_main.episode, "name": data_main.nameWSeason, "nameUm" : data_main.name, "prog": currentDuration}, (x) => { }, [], true).then(function (x) {
		try {

			if (x.status == 200) {
				lastUpdate = currentTime;

			} else if ("errorCode" in x && x["errorCode"] == 70001) {
				window.parent.postMessage({ "action": 21, data: "" }, "*");

			}
		} catch (err) {

		}



	}).catch(function (error) {
		console.error(error);


	}).finally(function () {
		update_check = 0;
		if (currentTime != lastUpdate) {
			errorCount++;
		} else {
			errorCount = 0;
		}

		if (errorCount > 10) {
			errorCount = 0;
			alert("Time could not be synced with the server.");

		} else if (errorCount == 5) {
			lastUpdate = a.vid.currentTime;
		}

	});



}


function chooseQualHls(x : string, type : string, elem : HTMLElement) : void {
	hls.loadLevel = parseInt(x);
	localStorage.setItem("hlsqual", x);
	localStorage.setItem("hlsqualnum", parseInt(elem.innerText).toString());
}


function loadSubs() {
	let vidDom = document.getElementById("v").children;



	while (vidDom.length > 0) {
		vidDom[0].remove();
	}

	DMenu.getScene("subtitles").deleteItems();
	DMenu.getScene("subtitles").addItem({
			"text": "Subtitles",
	}, true);
	if ("subtitles" in data_main && data_main["subtitles"].length > 0) {

		let selectFunc = function () {
			let value = this.getAttribute("value");
			if (value == "off") {
				localStorage.setItem(`${engine}-subtitle`, "off");
				curTrack = undefined;
				document.getElementById("fastFor").style.display = "none";

			}

			for (let i = 0; i < a.vid.textTracks.length; i++) {
				if (i == parseInt(value)) {
					a.vid.textTracks[i].mode = "showing";
					curTrack = a.vid.textTracks[i];
					setSubtitleMargin(curTrack);
					document.getElementById("fastFor").style.display = "block";
					localStorage.setItem(`${engine}-subtitle`, a.vid.textTracks[i].label);
				} else {
					a.vid.textTracks[i].mode = "hidden";

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
			"id" : `subtitle-off`,
		});


		for (var i = 0; i < data_main.subtitles.length; i++) {
			DMenu.getScene("subtitles").addItem({
				"text": data_main.subtitles[i].label,
				"callback": selectFunc,
				"attributes": {
					"value": i.toString(),
				},
				"highlightable": true,
				"id" : `subtitle-${i}`
			});


			let trackDOM = createElement({
				"element": "track",
				"attributes": {
					"kind": "subtitles",
					"label": data_main.subtitles[i].label,
					"src": data_main.subtitles[i].file
				},
				"innerText": data_main.subtitles[i].label
			});

			document.getElementById("v").append(trackDOM);
		}




		let check = true;
		for (var i = 0; i < a.vid.textTracks.length; i++) {
			if (a.vid.textTracks[i].label == localStorage.getItem(`${engine}-subtitle`) && check) {
				console.log("e");
				let subDOM = DMenu.selections[`subtitle-${i}`];
				console.log(subDOM);

				if(subDOM){
					subDOM.select();
				}
				curTrack = a.vid.textTracks[i];
				setSubtitleMargin(curTrack);

				document.getElementById("fastFor").style.display = "block";

				a.vid.textTracks[i].mode = "showing";
				check = false;

			} else {
				a.vid.textTracks[i].mode = "hidden";

			}
		}


		if(check){
			DMenu.selections["subtitle-off"].selectWithCallback();
		}



	} else {


	}
}

function chooseQual(x, type, th) {
	let skipTo;

	document.getElementById("hls_con").innerHTML = "";
	document.getElementById("qualityTitle").style.display = "none";

	loadSubs();
	let defURL;
	if (x !== null) {
		skipTo = a.vid.currentTime;
		if (th.getAttribute("data-intro") === "true") {
			skipIntroInfo.start = parseInt(th.getAttribute("data-start"));
			skipIntroInfo.end = parseInt(th.getAttribute("data-end"));
		} else {
			skipIntroInfo = {
				start : 0,
				end : 0
			};
		}

	} else {
		skipTo = th;
		defURL = data_main.sources[0].url;
		let sName = localStorage.getItem(`${engine}-sourceName`);
		let qCon = DMenu.getScene("source").element.querySelectorAll(".menuItem");
		for (let i = 0; i < qCon.length; i++) {
			if (sName == qCon[i].getAttribute("data-name")) {
				defURL = data_main.sources[i].url;
				if (qCon[i].getAttribute("data-intro") === "true") {
					skipIntroInfo.start = parseInt(qCon[i].getAttribute("data-start"));
					skipIntroInfo.end = parseInt(qCon[i].getAttribute("data-end"));
				} else {
					skipIntroInfo = {
						start : 0,
						end : 0
					};
				}


				let sourceItem = DMenu.selections[`source-${qCon[i].getAttribute("data-name")}`];
				if(sourceItem){
					sourceItem.select();
				}
				break;
			}
		}


	}


	if (hls) {
		hls.destroy();
	}

	if (type == "hls") {

		//@ts-ignore
		if (Hls.isSupported()) {

			//@ts-ignore
			hls = new Hls({
			});

			if (x == null) {

				hls.loadSource(defURL);
			}
			else {
				hls.loadSource(x);

			}


			hls.attachMedia(a.vid);

			//@ts-ignore
			hls.on(Hls.Events.MANIFEST_PARSED, function () {
				a.vid.play();
				loadHLSsource();
				a.vid.currentTime = skipTo;
			});
		}

	}
	else {
		try {
			if (x == null) {
				a.vid.src = defURL;

			} else {
				a.vid.src = x;
			}
			a.vid.load();
			a.vid.currentTime = skipTo;
			a.vid.play();


		} catch (err) {
			console.error(err);
			sendNoti([0, null, "Error", "Wait until the episode is being loaded."]);

		}
	}
}


function loadHLSsource() {
	try {
		let qCon = document.getElementById("hls_con");

		qCon.innerHTML = "";
		DMenu.getScene("quality").deleteItems();
		DMenu.getScene("quality").addItem({
			"text" : "Quality",
		}, true);

		document.getElementById("qualityTitle").style.display = "block";


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

			if (i == -1) {
				DMenu.getScene("quality").addItem({
					"text": "Auto",
					"attributes": {
						"data-url": i.toString(),
						"data-type": "hls",
					},
					"callback": function () {
						chooseQualHls(this.getAttribute("data-url"), this.getAttribute("data-type"), this);
					},
					"highlightable": true,
					"selected" : selected,
				},false);
			} else {


				DMenu.getScene("quality").addItem({
					"text": hls.levels[i].height + "p",
					"attributes": {
						"data-url": i.toString(),
						"data-type": "hls",
					},
					"callback": function () {
						chooseQualHls(this.getAttribute("data-url"), this.getAttribute("data-type"), this);
					},
					"highlightable": true,
					"selected" : selected,
				},false);
			}

		}
	} catch (err) {
		console.error(err);
	}
}


async function get_ep(x = 0) {
	if (get_ep_check == 1) {
		return;
	}

	get_ep_check = 1;
	try {
		let tttf = location.search.replace("?watch=", "");


		let qCon = document.getElementById("quality_con");
		qCon.innerHTML = "";

		DMenu.getScene("source").deleteItems();
		DMenu.getScene("source").addItem({
				"text": "Sources",
		}, true);
		for (var i = 0; i < data_main.sources.length; i++) {
			let style = {

			};
			if (i == 0) {
				style["backgroundColor"] = "white";
				style["color"] = "black";
			} else {
				style["backgroundColor"] = "#606060";
				style["color"] = "white";
			}

			let temp1;
			let curAttributes = {
				"data-url": data_main.sources[i].url,
				"data-type": data_main.sources[i].type,
				"data-name": data_main.sources[i].name,
			};

			if ("skipIntro" in data_main.sources[i] && "start" in data_main.sources[i].skipIntro && "end" in data_main.sources[i].skipIntro) {
				curAttributes["data-intro"] = "true";
				curAttributes["data-start"] = data_main.sources[i].skipIntro.start;
				curAttributes["data-end"] = data_main.sources[i].skipIntro.end;
				if (i == 0) {
					skipIntroInfo.start = data_main.sources[i].skipIntro.start;
					skipIntroInfo.end = data_main.sources[i].skipIntro.end;
				}
			}
			// if(data_main.sources[i].type != "hls"){			
			temp1 = createElement({
				"class": "qual",
				"innerText": data_main.sources[i].name,
				"attributes": curAttributes,
				"listeners": {
					"click": function () {
						localStorage.setItem(`${engine}-sourceName`, this.getAttribute("data-name"));
						chooseQual(this.getAttribute("data-url"), this.getAttribute("data-type"), this);
					}
				},
				style
			});

			DMenu.getScene("source").addItem(
				{
					"text": data_main.sources[i].name,
					"highlightable" : true,
					"attributes" : curAttributes,
					"id" : `source-${data_main.sources[i].name}`,
					"callback": function () {
						localStorage.setItem(`${engine}-sourceName`, this.getAttribute("data-name"));
						chooseQual(this.getAttribute("data-url"), this.getAttribute("data-type"), this);
					},
					"selected" : i==0
				}
			)

			

			// }

			qCon.append(temp1);
		}


		if (typeof data_main.prev == "undefined" || data_main.prev == null) {
			document.getElementById("prev_ep").style.display = "none";
		} else {
			document.getElementById("prev_ep").style.display = "table-cell";

		}

		if (typeof data_main.next == "undefined" || data_main.next == null) {
			document.getElementById("next_ep").style.display = "none";

		}
		else {
			document.getElementById("next_ep").style.display = "table-cell";

		}



		let response = await (<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 2, "name": data_main.nameWSeason, "nameUm": data_main.name, "ep": data_main.episode, "cur": cur_link }, (x) => { });


		document.getElementById("ep_dis").innerHTML = data_main.episode.toString();
		clearInterval(update_int);
		update_int = setInterval(update, int_up);

		let skipTo = 0;

		if (localStorage.getItem("rewatch") == "true") {

		} else {
			skipTo = response.data.time;
		}


		if (data_main.sources[0].type == "hls") {
			chooseQual(null, "hls", skipTo);


		}
		else {

			chooseQual(null, "", skipTo);


		}







		get_ep_check = 0;






	} catch (error) {
		console.error(error);
		sendNoti([0, null, "Error", error]);

	}



}




document.querySelector<HTMLElement>("#repBack").onclick = function () {
	a.vid.currentTime -= skipButTime;
	a.updateTime();

};


document.querySelector<HTMLElement>("#popOut").onclick = function () {
	backToNormal();
};

document.querySelector<HTMLElement>("#closeSetting").onclick = function () {
	document.getElementById("setting_con").style.display = "none";
};



document.querySelector<HTMLElement>("#repForward").onclick = function () {
	a.vid.currentTime += skipButTime;
	a.updateTime();

};




let socketCalledIni = false;


if (config.local || downloaded) {
	ini_main();
} else {
	window.parent.postMessage({ "action": 20, data: "" }, "*");

}






window.addEventListener("keydown", function (event) {

	if (event.keyCode == 32) {
		a.togglePlay();
	}
	else if (event.keyCode == 38 || event.keyCode == 40) {
		a.updateTimeout();
	} else if (event.keyCode == 39) {
		if (a.seekMode || config.chrome) {
			a.vid.currentTime += 30;
			a.updateTime();
			event.preventDefault();
		} else {
			a.updateTimeout();

		}
	} else if (event.keyCode == 37) {
		if (a.seekMode || config.chrome) {
			a.vid.currentTime -= 30;
			a.updateTime();

			event.preventDefault();

		} else {
			a.updateTimeout();

		}

	} else if (event.keyCode == 77) {
		a.toggleMute();

	} else if (event.keyCode == 70) {
		a.goFullScreen();

	} else if (event.keyCode == 76) {
		a.toggleLock();

	} else if (event.keyCode == 80) {
		a.togglePictureInPicture();

	}
});

if (config.chrome) {
	document.getElementById("fullscreenToggle").style.display = "block";
}
document.getElementById("fullscreenToggle").onclick = function () {
	a.goFullScreen();
};

document.getElementById("skipIntroDOM").onclick = function () {
	if ("end" in skipIntroInfo && !isNaN(skipIntroInfo.end)) {
		a.vid.currentTime = skipIntroInfo.end;
		document.getElementById("skipIntroDOM").style.display = "none";
	}
}


applyTheme();

function openSettingsSemi(translateY : number) {

	let settingCon = document.querySelector<HTMLElement>(".menuCon");
	settingCon.style.display = "block";

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
			setTimeout(function () {
				settingCon.style.opacity = "1";
				settingCon.style.display = "none";
				settingCon.style.transitionDuration = "0s";
			}, 200);
		});
	});
}

let settingsPullInstance = new settingsPull(document.getElementById("settingHandlePadding"), closeSettings);
let settingsPullInstanceTT = new settingsPull(document.querySelector(".menuCon"), closeSettings, true);


window.addEventListener("videoDurationChanged", () => {
	try{
		(<cordovaWindow>window.parent).apiCall("POST", { "username": username, "action": 2, "name": data_main.nameWSeason, "nameUm": data_main.name, "ep": data_main.episode, "duration": Math.floor(a.vid.duration), "cur" : location.search}, (x) => { });
	}catch(err){
		console.error(err);
	}
});


window.addEventListener("videoTimeUpdated", () => {

	if (curTrack instanceof TextTrack) {
		nextTrack();
	}	

});


window.addEventListener("videoLoadedMetaData", () => {

	window.parent.postMessage({ "action": 12, nameShow: data_main.name, episode: data_main.episode, prev: true, next: true, "duration": a.vid.duration, "elapsed": a.vid.currentTime }, "*");
	a.total.innerText = a.timeToString(a.vid.duration);

	let whichFit = parseInt(localStorage.getItem("fillMode")) || 0;
	a.setObjectSettings(whichFit);

});

window.addEventListener("videoEnded", () => {

	if (localStorage.getItem("autoplay") == "true") {
		next_ep_func(1);
	}

});


window.addEventListener("videoChangedFillMode", (event : videoChangedFillModeEvent) =>{
	DMenu.selections[`fMode${event.fillMode}`].select();
});

window.addEventListener("videoOpenSettings", (event : videoOpenSettingsEvent) =>{
	openSettingsSemi(event.translate);
});


window.addEventListener("videoCloseSettings", (event) =>{
	closeSettings();
});


window.addEventListener("videoDoubleTap", (event : videoDoubleTapEvent) =>{
	let type = event.DTType;

	if(type == "plus"){
		a.vid.currentTime += doubleTapTime;
	}else{
		a.vid.currentTime -= doubleTapTime;
	}
});

window.addEventListener("videoSeeked", (event) =>{
	try {
		update(19);
		lastUpdate = a.vid.currentTime;
	} catch (err) {
	
	}
});



