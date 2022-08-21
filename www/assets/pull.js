class pullToRefresh {
  constructor(dom) {
    if(!dom){
      return;
    }
    this.dom = dom;
    let self = this;
    this.flag = true;
    this.pullNum = 0;
    this.threshold = 200;
    this.sensitivity = 50;
    this.scrollTopZero = false;
    this.iniY;
    this.dom.addEventListener("touchstart", function (event) {
      self.touchStart(event, self);
    }, { passive: true });

    this.dom.addEventListener("touchmove", function (event) {
      self.touchMove(event, self);
    });

    this.dom.addEventListener("touchend", function (event) {
      self.touchEnd(self);
    });

    this.dom.addEventListener("touchcancel", function (event) {
      self.touchEnd(self);
    });
  }

  touchStart(event, self) {
    const targetTouches = event.targetTouches;
    if(self.dom.scrollTop <= 0){
      self.scrollTopZero = true;
      self.flag = true;
      self.iniY = targetTouches[0].screenY;
    }
  }

  touchMove(event, self) {
    const targetTouches = event.targetTouches;
    let y = targetTouches[0].screenY;

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

  pullstart(self){
    document.getElementById("pullTab").style.opacity = "1";
    document.getElementById("pullTab").style.transitionDuration = "0ms";
  }

  pullmove(self){
    let thisPullNum = self.pullNum;
    let opacity = 0.8;
    if(self.pullNum > self.threshold){
      thisPullNum = self.threshold;
      opacity = 1;
    }
    document.getElementById("pullTab").style.top = thisPullNum/1.3 + "px";
    document.getElementById("pullTab").style.opacity = opacity;
    document.getElementById("pullTab").style.transform = `rotate(${parseInt(thisPullNum)}deg)`;    
  }

  pullend(){
    document.getElementById("pullTab").style.transitionDuration = "200ms";
    window.requestAnimationFrame(function(){
        document.getElementById("pullTab").style.opacity = "0";
        document.getElementById("pullTab").style.top = "0px";
        document.getElementById("pullTab").style.transform = `rotate(${0}deg)`;
    });
  }

  pullrefresh(){
    window.location.reload();    
  }
  touchEnd(self) {
    if (self.flag) {
      return;
    }
    self.flag = true;
    self.pullend(self);
    if(self.pullNum > self.threshold){
      self.pullrefresh();
    }

    self.pullNum = 0;
    self.scrollTopZero = false;

  }

}