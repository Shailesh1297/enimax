class pullToRefresh {
	constructor(dom) {
		if (!dom) {
			return;
		}
		this.dom = dom;
		let self = this;
		this.flag = true;
		this.pullNum = 0;
		this.threshold = 200;
		self.down = false;
		this.sensitivity = 50;
		this.scrollTopZero = false;
		this.iniY;
		this.dom.addEventListener("touchstart", function (event) {
			self.touchStart(event, self);
		}, { passive: true });

		this.dom.addEventListener("touchmove", function (event) {
			self.touchMove(event, self);
		}, { passive: true });

		this.dom.addEventListener("touchend", function (event) {
			self.touchEnd(self);
		});

		this.dom.addEventListener("touchcancel", function (event) {
			self.touchEnd(self);
		});
	}

	touchStart(event, self) {
		const targetTouches = event.targetTouches;
		if (self.dom.scrollTop <= 0) {
			self.scrollTopZero = true;
			self.flag = true;
			self.down = false;
			self.iniY = targetTouches[0].screenY;
		}
	}

	touchMove(event, self) {
		const targetTouches = event.targetTouches;
		let y = targetTouches[0].screenY;
		if (!self.down && (y - self.iniY) < 0) {
			self.scrollTopZero = false;
		}
		self.down = true;
		if (targetTouches.length == 1 && self.scrollTopZero && (y - self.iniY) > self.sensitivity) {
			if (self.flag) {
				self.flag = false;
				self.pullNum = 0;
				self.pullstart(self);
			} else {
				self.flag = false;
				self.pullNum = -self.iniY + y - self.sensitivity;
				self.pullmove(self);
			}
		}
	}

	pullstart(self) {
		document.getElementById("pullTab").style.opacity = "1";
		document.getElementById("pullTab").style.transitionDuration = "0ms";
	}

	pullmove(self) {
		let thisPullNum = self.pullNum;
		let opacity = 0.8;
		if (self.pullNum > self.threshold) {
			thisPullNum = self.threshold;
			opacity = 1;
		}
		document.getElementById("pullTab").style.top = thisPullNum / 1.3 + "px";
		document.getElementById("pullTab").style.opacity = opacity;
		document.getElementById("pullTab").style.transform = `rotate(${parseInt(thisPullNum)}deg)`;
	}

	pullend() {
		document.getElementById("pullTab").style.transitionDuration = "200ms";
		window.requestAnimationFrame(function () {
			document.getElementById("pullTab").style.opacity = "0";
			document.getElementById("pullTab").style.top = "0px";
			document.getElementById("pullTab").style.transform = `rotate(${0}deg)`;
		});
	}

	pullrefresh() {
		window.location.reload();
	}
	touchEnd(self) {
		if (self.flag) {
			return;
		}
		self.flag = true;
		self.down = false;
		self.pullend(self);
		if (self.pullNum > self.threshold) {
			self.pullrefresh();
		}

		self.pullNum = 0;
		self.scrollTopZero = false;

	}

}


class menuPull {
	constructor(dom, callback) {
		this.dom = dom;
		let self = this;
		this.callback = callback;
		this.iniX = 0;
		this.sensitivity = 50;
		this.dom.addEventListener("touchstart", function (event) {
			self.touchStart(event, self);
		}, { passive: true });

		this.dom.addEventListener("touchmove", function (event) {
			self.touchMove(event, self);
		}, { passive: true });

		this.dom.addEventListener("touchend", function (event) {
			self.touchEnd(self);
		});

		this.dom.addEventListener("touchcancel", function (event) {
			self.touchEnd(self);
		});

		self.scrollCon = document.getElementById("custom_rooms");
		self.shouldStart = false;
		self.hasMoved = false;
	}

	touchStart(event, self) {
		const targetTouches = event.targetTouches;
		let x = targetTouches[0].screenX;
		self.iniX = x;
		if (self.scrollCon.offsetLeft == 0) {
			self.shouldStart = true;
		} else {
			self.shouldStart = false;
		}
	}

	touchMove(event, self) {
		if (self.scrollCon.scrollLeft > 0 || self.shouldStart === false) {
			self.shouldStart = false;
			return;
		}
		const targetTouches = event.targetTouches;
		let x = targetTouches[0].screenX;
		if ((x - self.iniX) > 0 && (x - self.iniX) <= 150 && (x - self.iniX) > self.sensitivity) {
			self.dom.style.opacity = "1";
			self.hasMoved = false;
			self.dom.style.transform = `translateX(${(x - self.iniX - self.sensitivity)}px)`;
		} else if ((x - self.iniX) > 150) {
			self.dom.style.opacity = "0.5";
			self.hasMoved = true;
		} else {
			self.dom.style.opacity = "1";
			self.hasMoved = false;
		}
	}

	touchEnd(self) {
		if (self.hasMoved) {
			self.callback();
		} else {
			self.dom.style.opacity = "1";
			self.dom.style.transform = `translateX(0px)`;
		}
		self.iniX = 0;
		self.shouldStart = false;
		self.hasMoved = false;


	}
}


class settingsPull {
	constructor(dom, callback, shouldCheck = false) {
		this.dom = dom;
		this.shouldCheck = shouldCheck;
		let self = this;
		this.callback = callback;
		this.iniX = 0;
		this.lastX = 0;
		this.sensitivity = 50;
		this.iniTop = 0;
		this.dom.addEventListener("touchstart", function (event) {
			self.touchStart(event, self);
		}, { passive: true });

		this.dom.addEventListener("touchmove", function (event) {
			self.touchMove(event, self);
		}, { passive: true });

		this.dom.addEventListener("touchend", function (event) {
			self.touchEnd(self);
		});

		this.dom.addEventListener("touchcancel", function (event) {
			self.touchEnd(self);
		});

		self.shouldStart = false;
		self.hasMoved = false;
		self.settingCon = document.querySelector(".menuCon");
	}

	touchStart(event, self) {
		
		if(self.shouldCheck){
			self.scrollCon = self.dom.querySelector(".sceneCon.active");
		}

		if (self.shouldCheck && self.scrollCon.scrollTop !== 0) {
			return;
		}

		const targetTouches = event.targetTouches;
		let x = targetTouches[0].screenY;
		self.iniX = x;
		self.shouldStart = true;
		self.iniTop = self.settingCon.offsetTop;
		self.settingCon.style.transitionDuration = "0ms";

	}

	touchMove(event, self) {
		
		if ((self.shouldCheck && self.scrollCon.scrollTop > 0) || self.shouldStart === false) {
			self.shouldStart = false;
			return;
		}
		
		const targetTouches = event.targetTouches;
		let x = targetTouches[0].screenY;

		let translate = -(-x + self.iniX);
		if(translate > 0){

			console.log(`translateY(${-(-x + self.iniX)}px)`, self.settingCon.style.transform);
			self.settingCon.style.transform = `translateY(${-(-x + self.iniX)}px)`;
			self.lastX = -x + self.iniX;
		}
	}

	touchEnd(self) {
		// if(self.hasMoved){
		// 	self.callback();
		// }else{
		// 	self.dom.style.opacity = "1";
		// 	self.dom.style.transform = `translateX(0px)`;
		// }

		console.log(self.shouldStart);

		if (self.shouldStart === false) {
			self.settingCon.style.transform = `translateY(0)`;
			return;
		}

		if (self.lastX < -75) {
			self.callback();
		} else {
			self.settingCon.style.transform = `translateY(0)`;
		}

		self.settingCon.style.transitionDuration = "200ms";


		self.iniTop = 0;
		self.iniX = 0;
		self.lastX = 0;
		self.shouldStart = false;
		self.hasMoved = false;


	}
}
