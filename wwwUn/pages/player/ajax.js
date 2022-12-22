class XMLHttpRequest2 {
	constructor() {
		this.headers = {};
		this.responseHeaders = {};
		this.config = {};

		this.delegate = null;
		this.requestHeaders = {
			"origin": extensionList[3].config.origin,
			"referer": extensionList[3].config.referer,
		};

		if (tempConfig.sockets) {
			this.requestHeaders["sid"] = sid;
		}
		this.responseHeaders = {};
		this.listeners = {};
		this.readyState = 0;
		this.responseType = "text";
		this.withCredentials = false;
		this.status = 0;
		this.statusText = "";
		this.response;
		this.listeners = {};
	}
	setRequestHeader(header, value) {
		this.requestHeaders[header.toLowerCase()] = value;
	}

	set onerror(x) {
	}

	set onabort(x) {
	}


	set onload(x) {
	}


	set onloadend(x) {
	}


	set onloadstart(x) {
	}


	set onprogress(x) {
	}


	set onreadystatechange(x) {
		this.addEventListener("readystatechange", x);
	}

	set ontimeout(x) {
	}



	getAllResponseHeaders() {
		var responseHeaders = this.responseHeaders;
		var names = Object.keys(responseHeaders);
		var list = [];
		for (var i = 0; i < names.length; i++)
			list.push([names[i], responseHeaders[names[i]]].join(":"));

		return list.join("\r\n");
	}

	getResponseHeader(name) {
		name = name.toLowerCase();
		return this.responseHeaders[name];
	}

	open(method, url, async, user, password) {

		this.config.method = !method ? "GET" : method.toUpperCase();
		this.config.url = url;
		this.config.async = async === undefined ? true : async;
		this.config.user = user;
		this.config.password = password;
	}



	send(data) {

		let option = {
			"method": this.config.method,
			"responseType": this.responseType

		}

		if (Object.keys(this.requestHeaders).length != 0) {

			option.headers = this.requestHeaders;
		}


		if (data) {
			option.body = data;
		}

		let self = this;

		window.parent.cordova.plugin.http.sendRequest(self.config.url, option,
			function (response) {
				if (self.responseType == "text") {
					self.responseText = response.data;
				}

				self.responseURL = response.url;
				self.responseHeaders = (response.headers);
				self.status = response.status;
				self.response = response.data;

				self.dispatchReadyStateChangeEvent(1);
				self.dispatchReadyStateChangeEvent(2);
				self.dispatchReadyStateChangeEvent(3);
				self.dispatchReadyStateChangeEvent(4);

			},
			function (response) {
				console.error(response);
			});





	}

	abort() {

	}

	addEventListener(eventName, eventFunc) {
		this.listeners[eventName] = eventFunc;
	}

	dispatchReadyStateChangeEvent(readyState) {
		this.readyState = readyState;

		if ("readystatechange" in this.listeners) {
			if (typeof this.listeners["readystatechange"] == "function") {
				this.listeners["readystatechange"]();
			}
		}
	}



}
