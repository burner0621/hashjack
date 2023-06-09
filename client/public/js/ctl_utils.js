var s_iScaleFactor = 1;
var s_iOffsetX;
var s_iOffsetY;
var s_bIsRetina;
var s_bFocus = true;

/**
 * jQuery.browser.mobile (http://detectmobilebrowser.com/)
 * jQuery.browser.mobile will be true if the browser is a mobile device
 **/
(function (a) { (jQuery.browser = jQuery.browser || {}).mobile = /android|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(ad|hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|tablet|treo|up\.(browser|link)|vodafone|wap|webos|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)) })(navigator.userAgent || navigator.vendor || window.opera);

$(window).resize(function () {
    sizeHandler();
});

function trace(szMsg) {
    console.log(szMsg);
}

function getSize(Name) {
    var size;
    var name = Name.toLowerCase();
    var document = window.document;
    var documentElement = document.documentElement;
    if (window["inner" + Name] === undefined) {
        // IE6 & IE7 don't have window.innerWidth or innerHeight
        size = documentElement["client" + Name];
    }
    else if (window["inner" + Name] != documentElement["client" + Name]) {
        // WebKit doesn't include scrollbars while calculating viewport size so we have to get fancy

        // Insert markup to test if a media query will match document.doumentElement["client" + Name]
        var bodyElement = document.createElement("body");
        bodyElement.id = "vpw-test-b";
        bodyElement.style.cssText = "overflow:scroll";
        var divElement = document.createElement("div");
        divElement.id = "vpw-test-d";
        divElement.style.cssText = "position:absolute;top:-1000px";
        // Getting specific on the CSS selector so it won't get overridden easily
        divElement.innerHTML = "<style>@media(" + name + ":" + documentElement["client" + Name] + "px){body#vpw-test-b div#vpw-test-d{" + name + ":7px!important}}</style>";
        bodyElement.appendChild(divElement);
        documentElement.insertBefore(bodyElement, document.head);

        if (divElement["offset" + Name] == 7) {
            // Media query matches document.documentElement["client" + Name]
            size = documentElement["client" + Name];
        }
        else {
            // Media query didn't match, use window["inner" + Name]
            size = window["inner" + Name];
        }
        // Cleanup
        documentElement.removeChild(bodyElement);
    }
    else {
        // Default to use window["inner" + Name]
        size = window["inner" + Name];
    }
    return size;
};

window.addEventListener("orientationchange", onOrientationChange);

function onOrientationChange() {
    if (window.matchMedia("(orientation: portrait)").matches) {
        // you're in PORTRAIT mode	   
        sizeHandler();
    }

    if (window.matchMedia("(orientation: landscape)").matches) {
        // you're in LANDSCAPE mode   
        sizeHandler();
    }

}

function isIpad() {
    var isIpad = navigator.userAgent.toLowerCase().indexOf('ipad') !== -1;

    if (!isIpad && navigator.userAgent.match(/Mac/) && navigator.maxTouchPoints && navigator.maxTouchPoints > 2) {
        return true;
    }

    return isIpad;
}

function isMobile() {
    if (isIpad()) {
        return true;
    }

    return jQuery.browser.mobile;
}


function isIOS() {
    isRetina();

    var iDevices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ];

    while (iDevices.length) {
        if (navigator.platform === iDevices.pop()) {
            s_bIsIphone = true;
            return true;
        }
    }
    s_bIsIphone = false;


    return false;
}

function isRetina() {
    var query = "(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)";

    if (matchMedia(query).matches) {
        s_bIsRetina = true;
    } else {
        s_bIsRetina = false;
    }
};

function getIOSWindowHeight() {
    // Get zoom level of mobile Safari
    // Note, that such zoom detection might not work correctly in other browsers
    // We use width, instead of height, because there are no vertical toolbars :)
    var zoomLevel = document.documentElement.clientWidth / window.innerWidth;

    // window.innerHeight returns height of the visible area. 
    // We multiply it by zoom and get out real height.
    return window.innerHeight * zoomLevel;
};

// You can also get height of the toolbars that are currently displayed
function getHeightOfIOSToolbars() {
    var tH = (window.orientation === 0 ? screen.height : screen.width) - getIOSWindowHeight();
    return tH > 1 ? tH : 0;
};

//THIS FUNCTION MANAGES THE CANVAS SCALING TO FIT PROPORTIONALLY THE GAME TO THE CURRENT DEVICE RESOLUTION

function sizeHandler() {
    window.scrollTo(0, 1);

    if (!$("#canvas")) {
        return;
    }

    var h;
    if (platform.name !== null && platform.name.toLowerCase() === "safari") {
        h = getIOSWindowHeight();
    } else {
        h = getSize("Height");
    }

    var w = getSize("Width");

    if (s_bFocus) {
        _checkOrientation(w, h);
    }

    var multiplier = Math.min((h / CANVAS_HEIGHT), (w / CANVAS_WIDTH));

    var destW = Math.round(CANVAS_WIDTH * multiplier);
    var destH = Math.round(CANVAS_HEIGHT * multiplier);

    var iAdd = 0;
    if (destH < h) {
        iAdd = h - destH;
        destH += iAdd;
        destW += iAdd * (CANVAS_WIDTH / CANVAS_HEIGHT);
    } else if (destW < w) {
        iAdd = w - destW;
        destW += iAdd;
        destH += iAdd * (CANVAS_HEIGHT / CANVAS_WIDTH);
    }

    var fOffsetY = ((h / 2) - (destH / 2));
    var fOffsetX = ((w / 2) - (destW / 2));
    var fGameInverseScaling = (CANVAS_WIDTH / destW);

    if (fOffsetX * fGameInverseScaling < -EDGEBOARD_X ||
        fOffsetY * fGameInverseScaling < -EDGEBOARD_Y) {
        multiplier = Math.min(h / (CANVAS_HEIGHT - (EDGEBOARD_Y * 2)), w / (CANVAS_WIDTH - (EDGEBOARD_X * 2)));
        destW = CANVAS_WIDTH * multiplier;
        destH = CANVAS_HEIGHT * multiplier;
        fOffsetY = (h - destH) / 2;
        fOffsetX = (w - destW) / 2;

        fGameInverseScaling = (CANVAS_WIDTH / destW);
    }

    s_iOffsetX = (-1 * fOffsetX * fGameInverseScaling);
    s_iOffsetY = (-1 * fOffsetY * fGameInverseScaling);

    if (fOffsetY >= 0) {
        s_iOffsetY = 0;
    }

    if (fOffsetX >= 0) {
        s_iOffsetX = 0;
    }

    if (s_oInterface !== null) {
        s_oInterface.refreshButtonPos(s_iOffsetX, s_iOffsetY);
    }
    if (s_oMenu !== null) {
        s_oMenu.refreshButtonPos(s_iOffsetX, s_iOffsetY);
    }


    if (s_bIsRetina && s_oStage) {
        canvas = document.getElementById('canvas');
        s_oStage.canvas.width = destW * 2;
        s_oStage.canvas.height = destH * 2;
        canvas.style.width = destW + "px";
        canvas.style.height = destH + "px";
        var iScale = Math.min(destW / CANVAS_WIDTH, destH / CANVAS_HEIGHT);
        s_iScaleFactor = iScale * 2;
        s_oStage.scaleX = s_oStage.scaleY = iScale * 2;
    } else if (s_bMobile) {
        $("#canvas").css("width", destW + "px");
        $("#canvas").css("height", destH + "px");
    } else if (s_oStage) {
        s_oStage.canvas.width = destW;
        s_oStage.canvas.height = destH;

        s_iScaleFactor = Math.min(destW / CANVAS_WIDTH, destH / CANVAS_HEIGHT);
        s_oStage.scaleX = s_oStage.scaleY = s_iScaleFactor;
    }

    if (fOffsetY < 0) {
        $("#canvas").css("top", fOffsetY + "px");
    } else {
        // centered game
        fOffsetY = (h - destH) / 2;
        $("#canvas").css("top", fOffsetY + "px");
    }

    $("#canvas").css("left", fOffsetX + "px");

    fullscreenHandler();
};

function _checkOrientation(iWidth, iHeight) {
    if (s_bMobile && ENABLE_CHECK_ORIENTATION) {
        if (iWidth > iHeight) {
            if ($(".orientation-msg-container").attr("data-orientation") === "landscape") {
                $(".orientation-msg-container").css("display", "none");
                s_oMain.startUpdate();
            } else {
                $(".orientation-msg-container").css("display", "block");
                s_oMain.stopUpdate();
            }
        } else {
            if ($(".orientation-msg-container").attr("data-orientation") === "portrait") {
                $(".orientation-msg-container").css("display", "none");
                s_oMain.startUpdate();
            } else {
                $(".orientation-msg-container").css("display", "block");
                s_oMain.stopUpdate();
            }
        }
    }
}

(function () {
    var hidden = "hidden";

    // Standards:
    if (hidden in document)
        document.addEventListener("visibilitychange", onchange);
    else if ((hidden = "mozHidden") in document)
        document.addEventListener("mozvisibilitychange", onchange);
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener("webkitvisibilitychange", onchange);
    else if ((hidden = "msHidden") in document)
        document.addEventListener("msvisibilitychange", onchange);
    // IE 9 and lower:
    else if ('onfocusin' in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide
            = window.onfocus = window.onblur = onchange;

    function onchange(evt) {
        var v = 'visible', h = 'hidden',
            evtMap = {
                focus: v, focusin: v, pageshow: v, blur: h, focusout: h, pagehide: h
            };

        evt = evt || window.event;

        if (evt.type in evtMap) {
            document.body.className = evtMap[evt.type];
        } else {
            document.body.className = this[hidden] ? "hidden" : "visible";

            if (document.body.className === "hidden") {
                s_oMain.stopUpdate();
                s_bFocus = false;
            } else {
                s_oMain.startUpdate();
                s_bFocus = true;
            }
        }



    }
})();

function createBitmap(oSprite, iWidth, iHeight) {
    var oBmp = new createjs.Bitmap(oSprite);
    var hitObject = new createjs.Shape();

    if (iWidth && iHeight) {
        hitObject.graphics.beginFill("#fff").drawRect(0, 0, iWidth, iHeight);
    } else {
        hitObject.graphics.beginFill("#ff0").drawRect(0, 0, oSprite.width, oSprite.height);
    }

    oBmp.hitArea = hitObject;

    return oBmp;
}

function createSprite(oSpriteSheet, szState, iRegX, iRegY, iWidth, iHeight) {
    if (szState !== null) {
        var oRetSprite = new createjs.Sprite(oSpriteSheet, szState);
    } else {
        var oRetSprite = new createjs.Sprite(oSpriteSheet);
    }

    var hitObject = new createjs.Shape();
    hitObject.graphics.beginFill("#000000").drawRect(-iRegX, -iRegY, iWidth, iHeight);

    oRetSprite.hitArea = hitObject;

    return oRetSprite;
}

function randomFloatBetween(minValue, maxValue, precision) {
    if (typeof (precision) === 'undefined') {
        precision = 2;
    }
    return parseFloat(Math.min(minValue + (Math.random() * (maxValue - minValue)), maxValue).toFixed(precision));
}

function shuffle(array) {
    var currentIndex = array.length
        , temporaryValue
        , randomIndex
        ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function formatTime(iTime) {
    iTime /= 1000;
    var iMins = Math.floor(iTime / 60);
    var iSecs = iTime - (iMins * 60);
    iSecs = parseFloat(iSecs).toFixed(1)

    var szRet = "";

    if (iMins < 10) {
        szRet += "0" + iMins + ":";
    } else {
        szRet += iMins + ":";
    }

    if (iSecs < 10) {
        szRet += "0" + iSecs;
    } else {
        szRet += iSecs;
    }

    return szRet;
}

Array.prototype.sortOn = function () {
    var dup = this.slice();
    if (!arguments.length) return dup.sort();
    var args = Array.prototype.slice.call(arguments);
    return dup.sort(function (a, b) {
        var props = args.slice();
        var prop = props.shift();
        while (a[prop] == b[prop] && props.length) prop = props.shift();
        return a[prop] == b[prop] ? 0 : a[prop] > b[prop] ? 1 : -1;
    });
}

function roundDecimal(num, precision) {
    var decimal = Math.pow(10, precision);
    return Math.round(decimal * num) / decimal;
}

function tweenVectors(vStart, vEnd, iLerp, vOut) {
    vOut.set(vStart.getX() + iLerp * (vEnd.getX() - vStart.getX()), vStart.getY() + iLerp * (vEnd.getY() - vStart.getY()));
    return vOut;
}

function NoClickDelay(el) {
    this.element = el;
    if (window.Touch) this.element.addEventListener('touchstart', this, false);
}

NoClickDelay.prototype = {
    handleEvent: function (e) {
        switch (e.type) {
            case 'touchstart': this.onTouchStart(e); break;
            case 'touchmove': this.onTouchMove(e); break;
            case 'touchend': this.onTouchEnd(e); break;
        }
    },

    onTouchStart: function (e) {
        e.preventDefault();
        this.moved = false;

        this.element.addEventListener('touchmove', this, false);
        this.element.addEventListener('touchend', this, false);
    },

    onTouchMove: function (e) {
        this.moved = true;
    },

    onTouchEnd: function (e) {
        this.element.removeEventListener('touchmove', this, false);
        this.element.removeEventListener('touchend', this, false);

        if (!this.moved) {
            var theTarget = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            if (theTarget.nodeType === 3) theTarget = theTarget.parentNode;

            var theEvent = document.createEvent('MouseEvents');
            theEvent.initEvent('click', true, true);
            theTarget.dispatchEvent(theEvent);
        }
    }

};

function playSound(szSound, iVolume, bLoop) {
    if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {

        s_aSounds[szSound].play();
        s_aSounds[szSound].volume(iVolume);

        s_aSounds[szSound].loop(bLoop);

        return s_aSounds[szSound];
    }
    return null;
}

function stopSound(szSound) {
    if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
        s_aSounds[szSound].stop();
    }
}

function setVolume(szSound, iVolume) {
    if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
        s_aSounds[szSound].volume(iVolume);
    }
}

function setMute(szSound, bMute) {
    if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
        s_aSounds[szSound].mute(bMute);
    }
}

function ctlArcadeResume() {
    if (s_oMain !== null) {
        s_oMain.startUpdate();
    }
}

function ctlArcadePause() {
    if (s_oMain !== null) {
        s_oMain.stopUpdate();
    }
}


function getParamValue(paramName) {
    var url = window.location.search.substring(1);
    var qArray = url.split('&');
    for (var i = 0; i < qArray.length; i++) {
        var pArr = qArray[i].split('=');
        if (pArr[0] == paramName)
            return pArr[1];
    }
}



function fullscreenHandler() {
    if (!ENABLE_FULLSCREEN || screenfull.isEnabled === false) {
        return;
    }

    s_bFullscreen = screenfull.isFullscreen;

    if (s_oInterface !== null) {
        s_oInterface.resetFullscreenBut();
    }

    if (s_oMenu !== null) {
        s_oMenu.resetFullscreenBut();
    }
}


if (screenfull.isEnabled) {
    screenfull.on('change', function () {
        s_bFullscreen = screenfull.isFullscreen;

        if (s_oInterface !== null) {
            s_oInterface.resetFullscreenBut();
        }

        if (s_oMenu !== null) {
            s_oMenu.resetFullscreenBut();
        }
    });
}



