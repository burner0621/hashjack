

function CMenu() {
    var _pStartPosAudio;
    var _pStartPosFullscreen;
    var _pStartPosCredits;

    var _oBg;
    var _oButPlay;
    var _oAudioToggle;
    var _oFade;
    var _oButFullscreen;
    var _oCreditsPanel = null;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;

    var _oGameOverPanel;

    var walletConnectBtn;
    var accountId = '';
    var leaderboardBtn;
    var statBtn;

    this._init = function () {
        _oBg = createBitmap(s_oSpriteLibrary.getSprite('bg_menu'));
        s_oStage.addChild(_oBg);

        var oSprite = s_oSpriteLibrary.getSprite('but_menu_bg');
        
        _pStartPosWalletConnect = { x: CANVAS_WIDTH - oSprite.width / 2 - 10, y: oSprite.height / 2 + 10 };
        if ($("#walletId").val() == "") {
            accountId = '';
            walletConnectBtn = new CTextButton(CANVAS_WIDTH - oSprite.width / 2 - 10, oSprite.height / 2 + 10, oSprite, TEXT_CONNECT_WALLET, FONT_GAME_1, "#ffffff", 25, s_oStage);
        }
        else {
            accountId = $("#walletId").val();
            walletConnectBtn = new CTextButton(CANVAS_WIDTH - oSprite.width / 2 - 10, oSprite.height / 2 + 10, oSprite, $("#walletId").val() + "\nDisconnect", FONT_GAME_1, "#ffffff", 25, s_oStage);
        }
        walletConnectBtn.addEventListener(ON_MOUSE_UP, this._onConnectWallet, this);

        $("#walletId").click((e) => {
            accountId = e.target.value;
            if (e.target.value == '')
                walletConnectBtn.changeText(TEXT_CONNECT_WALLET);
            else
                walletConnectBtn.changeText(e.target.value + "\nDisconnect");
        })

        $("#disconnectWallet").click((e) => {
            walletConnectBtn.changeText("Connect Wallet");
        })

        var oSprite = s_oSpriteLibrary.getSprite('but_menu_bg');
        _oButPlay = new CTextButton((CANVAS_WIDTH / 2), CANVAS_HEIGHT - 464, oSprite, TEXT_PLAY, FONT_GAME_1, "#ffffff", 40, s_oStage);
        _oButPlay.addEventListener(ON_MOUSE_UP, this._onButPlayRelease, this);

        var oSprite = s_oSpriteLibrary.getSprite('but_menu_bg');
        leaderboardBtn = new CTextButton((CANVAS_WIDTH / 2), CANVAS_HEIGHT - 364, oSprite, TEXT_LEADER_BOARD, FONT_GAME_1, "#ffffff", 25, s_oStage);
        leaderboardBtn.addEventListener(ON_MOUSE_UP, this._onGoToLeaderBoard, this);

        var oSprite = s_oSpriteLibrary.getSprite('but_menu_bg');
        statsBtn = new CTextButton((CANVAS_WIDTH / 2), CANVAS_HEIGHT - 264, oSprite, TEXT_STATS, FONT_GAME_1, "#ffffff", 25, s_oStage);
        statsBtn.addEventListener(ON_MOUSE_UP, this._onGoToStats, this);
       
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            _pStartPosAudio = { x: oSprite.width / 4 + 10, y: oSprite.height * 2 - 20 };
            _oAudioToggle = new CToggle(_pStartPosAudio.x, _pStartPosAudio.y, oSprite, s_bAudioActive, s_oStage);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
        }

        var oSpriteCredits = s_oSpriteLibrary.getSprite('but_credits');

        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (ENABLE_FULLSCREEN === false) {
            _fRequestFullScreen = false;
        }

        if (_fRequestFullScreen && screenfull.isEnabled) {
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');
            _pStartPosFullscreen = { x: oSprite.width / 4 + 10, y: oSprite.height / 2 + 10 };

            _oButFullscreen = new CToggle(_pStartPosFullscreen.x, _pStartPosFullscreen.y, oSprite, s_bFullscreen, s_oStage);
            _oButFullscreen.addEventListener(ON_MOUSE_UP, this._onFullscreenRelease, this);

            _pStartPosCredits = { x: _pStartPosFullscreen.x + 10 + oSprite.width / 2, y: (oSprite.height / 2) + 10 };
        } else {
            _pStartPosCredits = { x: 10 + oSpriteCredits.width / 2, y: (oSpriteCredits.height / 2) + 10 };
        }

        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        s_oStage.addChild(_oFade);

        createjs.Tween.get(_oFade).to({ alpha: 0 }, 400).call(function () { _oFade.visible = false; });

        _oGameOverPanel = new CConnectWallet();

        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
    };

    this.refreshButtonPos = function (iNewX, iNewY) {
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.setPosition(_pStartPosFullscreen.x + iNewX, iNewY + _pStartPosAudio.y);
            //            leaderboardBtn.setPosition(_pStartPosFullscreen.x + iNewX, iNewY + _pStartPosAudio.y*2);
        }
        if (_fRequestFullScreen && screenfull.isEnabled) {
            _oButFullscreen.setPosition(_pStartPosFullscreen.x + iNewX, _pStartPosFullscreen.y + iNewY);
        }
        walletConnectBtn.setPosition(_pStartPosWalletConnect.x - iNewX, iNewY + _pStartPosWalletConnect.y);
    };

    this.unload = function () {
        _oButPlay.unload();
        _oButPlay = null;
        _oGameOverPanel.unload();

        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }

        if (_fRequestFullScreen && screenfull.isEnabled) {
            _oButFullscreen.unload();
        }

        s_oStage.removeAllChildren();
        s_oMenu = null;
    };

    this._onButPlayRelease = function () {
        if (accountId == '')
            _oGameOverPanel.show();
        else {
            this.unload();
            s_oMain.gotoGame();

            $(s_oMain).trigger("start_session");
        }
    };

    this._onConnectWallet = function () {
        accountId = '';
        document.getElementById("connectWallet").click();
    }

    this._onAudioToggle = function () {
        Howler.mute(s_bAudioActive);
        s_bAudioActive = !s_bAudioActive;
    };

    this._onGoToLeaderBoard = function () {
        document.getElementById("leaderBoard").click();
    };

    this._onGoToStats = function () {
        document.getElementById("stats").click();
    }

    this._onGoToSetting = function () {
        document.getElementById("setting").click();
    }

    this.resetFullscreenBut = function () {
        if (_fRequestFullScreen && screenfull.isEnabled) {
            _oButFullscreen.setActive(s_bFullscreen);
        }
    };

    this._onFullscreenRelease = function () {
        if (s_bFullscreen) {
            _fCancelFullScreen.call(window.document);
        } else {
            _fRequestFullScreen.call(window.document.documentElement);
        }

        sizeHandler();
    };

    this._onCredits = function () {
        _oCreditsPanel = new CCreditsPanel();
    };

    s_oMenu = this;

    this._init();
}

var s_oMenu = null;