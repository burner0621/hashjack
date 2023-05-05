function CInterface(iMoney) {
    var _aFiches;
    var _pStartPosAudio;
    var _pStartPosExit;
    var _pStartPosFullscreen;

    var _oButExit;
    var _oClearBetBut;
    var _oRebetBut;
    var _oDepositBut;
    var _oWithdrawBut;
    var _oDealBut;
    var _oHitBut;
    var _oStandBut;
    var _oDoubleBut;
    var _oSplitBut;
    var _oAudioToggle;
    var _oMoneyText;
    var _oCurDealerCardValueText;
    var _oDisplayText1;
    var _oDisplayText2;
    var _oInsurancePanel;
    var _oButFullscreen;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;

    this._init = function (iMoney) {
        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
        _pStartPosExit = { x: CANVAS_WIDTH - (oSprite.width / 2) - 2, y: (oSprite.height / 2) + 2 };
        _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite, true);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);

        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _pStartPosAudio = { x: _oButExit.getX() - oSprite.width, y: (oSprite.height / 2) + 2 };
            _oAudioToggle = new CToggle(_pStartPosAudio.x, _pStartPosAudio.y, s_oSpriteLibrary.getSprite('audio_icon'), s_bAudioActive, s_oStage);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
            _pStartPosFullscreen = { x: _pStartPosAudio.x - oSprite.width - 2, y: _pStartPosAudio.y };
        } else {
            _pStartPosFullscreen = { x: _oButExit.getX() - oSprite.width, y: (oSprite.height / 2) + 2 };
        }

        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (ENABLE_FULLSCREEN === false) {
            _fRequestFullScreen = false;
        }

        if (_fRequestFullScreen && screenfull.isEnabled) {
            oSprite = s_oSpriteLibrary.getSprite('but_fullscreen');


            _oButFullscreen = new CToggle(_pStartPosFullscreen.x, _pStartPosFullscreen.y, oSprite, s_bFullscreen, s_oStage);
            _oButFullscreen.addEventListener(ON_MOUSE_UP, this._onFullscreenRelease, this);
        }

        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
        _pStartPosExit = { x: CANVAS_WIDTH - (oSprite.width / 2) - 2, y: (oSprite.height / 2) + 2 };
        _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite, true);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);

        var oDisplayBg = createBitmap(s_oSpriteLibrary.getSprite('display_bg'));
        oDisplayBg.x = 280;
        oDisplayBg.y = 6;
        s_oStage.addChild(oDisplayBg);

        var oSprite = s_oSpriteLibrary.getSprite('bet_bg');
        var oBetBg = createBitmap(oSprite);
        oBetBg.x = 340;
        oBetBg.y = CANVAS_HEIGHT - oSprite.height + 4;
        s_oStage.addChild(oBetBg);

        var oSprite = s_oSpriteLibrary.getSprite('but_game_small_bg');
        _oClearBetBut = new CTextButton(444, CANVAS_HEIGHT - 30, oSprite, TEXT_CLEAR, FONT_GAME_1, "#ffffff", 14, s_oStage);
        _oClearBetBut.addEventListener(ON_MOUSE_UP, this._onButClearRelease, this);

        _oRebetBut = new CTextButton(632, CANVAS_HEIGHT - 30, oSprite, TEXT_REBET, FONT_GAME_1, "#ffffff", 14, s_oStage);
        _oRebetBut.addEventListener(ON_MOUSE_UP, this._onButRebetRelease, this);

        _oDisplayText1 = new CTLText(s_oStage,
            400, 18, 190, 40,
            24, "left", "#ffde00", FONT_GAME_2, 1,
            0, 0,
            " ",
            true, true, true,
            false);



        _oDisplayText2 = new CTLText(s_oStage,
            400, 60, 190, 40,
            18, "left", "#ffde00", FONT_GAME_2, 1,
            0, 0,
            " ",
            true, true, true,
            false);


        _oCurDealerCardValueText = new createjs.Text("", "20px " + FONT_GAME_1, "#fff");
        _oCurDealerCardValueText.shadow = new createjs.Shadow("#000000", 2, 2, 1);
        _oCurDealerCardValueText.x = 758;
        _oCurDealerCardValueText.y = 180;
        _oCurDealerCardValueText.textAlign = "right";
        s_oStage.addChild(_oCurDealerCardValueText);

        var oMoneyBg = createBitmap(s_oSpriteLibrary.getSprite('money_bg'));
        oMoneyBg.x = 1127;
        oMoneyBg.y = CANVAS_HEIGHT - 100;
        s_oStage.addChild(oMoneyBg);

        _oMoneyText = new CTLText(s_oStage,
            1130, CANVAS_HEIGHT - 95, 224, 29,
            29, "center", "#ffde00", FONT_GAME_2, 1,
            0, 0,
            $("#money").val() + TEXT_CURRENCY,
            true, true, true,
            false);

        oSprite = s_oSpriteLibrary.getSprite('but_game_bg');
        _oDepositBut = new CTextButton(908, CANVAS_HEIGHT - 90, oSprite, TEXT_DEPOSIT, FONT_GAME_1, "#ffffff", 20, s_oStage);
        _oDepositBut.addEventListener(ON_MOUSE_UP, this._onButDepositRelease, this);

        _oWithdrawBut = new CTextButton(1008, CANVAS_HEIGHT - 90, oSprite, TEXT_WITHDRAW, FONT_GAME_1, "#ffffff", 20, s_oStage);
        _oWithdrawBut.addEventListener(ON_MOUSE_UP, this._onButWithdrawRelease, this);

        _oDealBut = new CTextButton(908, CANVAS_HEIGHT - 30, oSprite, TEXT_DEAL, FONT_GAME_1, "#ffffff", 20, s_oStage);
        _oDealBut.addEventListener(ON_MOUSE_UP, this._onButDealRelease, this);

        _oHitBut = new CTextButton(1008, CANVAS_HEIGHT - 30, oSprite, TEXT_HIT, FONT_GAME_1, "#ffffff", 20, s_oStage);
        _oHitBut.addEventListener(ON_MOUSE_UP, this._onButHitRelease, this);

        _oStandBut = new CTextButton(1108, CANVAS_HEIGHT - 30, oSprite, TEXT_STAND, FONT_GAME_1, "#ffffff", 20, s_oStage);
        _oStandBut.addEventListener(ON_MOUSE_UP, this._onButStandRelease, this);

        _oDoubleBut = new CTextButton(1208, CANVAS_HEIGHT - 30, oSprite, TEXT_DOUBLE, FONT_GAME_1, "#ffffff", 20, s_oStage);
        _oDoubleBut.addEventListener(ON_MOUSE_UP, this._onButDoubleRelease, this);

        _oSplitBut = new CTextButton(1308, CANVAS_HEIGHT - 30, oSprite, TEXT_SPLIT, FONT_GAME_1, "#ffffff", 20, s_oStage);
        _oSplitBut.addEventListener(ON_MOUSE_UP, this._onButSplitRelease, this);

        //SET FICHES BUTTON
        var aPos = [{ x: 357, y: 666 }, { x: 417, y: 666 }, { x: 477, y: 666 }, { x: 537, y: 666 }, { x: 597, y: 666 }, { x: 657, y: 666 }];
        _aFiches = new Array();

        var aFichesValues = s_oGameSettings.getFichesValues();
        for (var i = 0; i < NUM_FICHES; i++) {
            _aFiches[i] = new CFiche(aPos[i].x, aPos[i].y, i, aFichesValues[i], true, s_oStage);
            _aFiches[i].setScale(1.25);
            _aFiches[i].addEventListenerWithParams(ON_MOUSE_UP, this._onFicheClicked, this, [aFichesValues[i], i]);
        }

        _oInsurancePanel = new CInsurancePanel();


        this.disableButtons();

        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
    };

    this.unload = function () {
        _oButExit.unload();
        _oButExit = null;

        if (DISABLE_SOUND_MOBILE === false) {
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }

        if (_fRequestFullScreen && screenfull.isEnabled) {
            _oButFullscreen.unload();
        }


        s_oInterface = null;
    };

    this.refreshButtonPos = function (iNewX, iNewY) {
        _oButExit.setPosition(_pStartPosExit.x - iNewX, iNewY + _pStartPosExit.y);
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.setPosition(_pStartPosAudio.x - iNewX, iNewY + _pStartPosAudio.y);
        }
        if (_fRequestFullScreen && screenfull.isEnabled) {
            _oButFullscreen.setPosition(_pStartPosFullscreen.x - iNewX, _pStartPosFullscreen.y + iNewY);
        }
    };

    this.reset = function () {
        this.disableButtons();
    };

    this.enableBetFiches = function () {
        for (var i = 0; i < NUM_FICHES; i++) {
            _aFiches[i].enable();
        }
        _oClearBetBut.enable();
        _oRebetBut.enable();
    };

    this.disableBetFiches = function () {
        for (var i = 0; i < NUM_FICHES; i++) {
            _aFiches[i].disable();
        }
        _oClearBetBut.disable();
        _oRebetBut.disable();
    };

    this.enableControlBtns = function () {
        _oDepositBut.enable();
        _oWithdrawBut.enable();
    };

    this.disableControlBtns = function () {
        _oDepositBut.disable();
        _oWithdrawBut.disable();
    };

    this.disableRebet = function () {
        _oRebetBut.disable();
    };

    this.disableButtons = function () {
        _oDealBut.disable();
        _oHitBut.disable();
        _oStandBut.disable();
        _oDoubleBut.disable();
        _oSplitBut.disable();
    };

    this.enable = function (bDealBut, bHit, bStand, bDouble, bSplit) {
        if (bDealBut) {
            _oDealBut.enable();
        } else {
            _oDealBut.disable();
        }

        if (bHit) {
            _oHitBut.enable();
        } else {
            _oHitBut.disable();
        }

        if (bStand) {
            _oStandBut.enable();
        } else {
            _oStandBut.disable();
        }

        if (bDouble) {
            _oDoubleBut.enable();
        } else {
            _oDoubleBut.disable();
        }

        if (bSplit) {
            _oSplitBut.enable();
        } else {
            _oSplitBut.disable();
        }
    };

    this.refreshCredit = function (iMoney) {
        _oMoneyText.refreshText(iMoney + TEXT_CURRENCY);
    };

    this.refreshDealerCardValue = function (iDealerValue) {
        _oCurDealerCardValueText.text = "" + iDealerValue;
    };

    this.displayMsg = function (szMsg, szMsgBig) {
        _oDisplayText1.refreshText(szMsg);
        if (szMsgBig !== undefined) {
            _oDisplayText2.refreshText(szMsgBig);
        }
    };

    this.showInsurancePanel = function () {
        _oInsurancePanel.show(TEXT_INSURANCE);
    };

    this.clearDealerText = function () {
        _oCurDealerCardValueText.text = "";
    };

    this._onFicheClicked = function (aParams) {
        s_oGame.onFicheSelected(aParams[1], aParams[0]);
    };

    this._onButClearRelease = function () {
        s_oGame.clearBets();
    };

    this._onButRebetRelease = function () {
        s_oGame.rebet();
    };

    this._onButDepositRelease = function () {
        document.getElementById("deposit").value = 1;
        document.getElementById("deposit").click();
    };

    this._onButWithdrawRelease = function () {
        document.getElementById("withdraw").value = s_oGame.getCurrentCredit();
        document.getElementById("withdraw").click();
    };

    this._onButDealRelease = function () {
        this.disableBetFiches();
        this.disableControlBtns();
        this.disableButtons();
        $("#money").val(s_oGame.getCurrentCredit())
        $("#dealbtn").click()
        s_oGame.onDeal();
    };

    this._onButHitRelease = function () {
        this.disableButtons();
        s_oGame.onHit();
    };

    this._onButStandRelease = function () {
        this.disableButtons();
        s_oGame.onStand();
    };

    this._onButDoubleRelease = function () {
        this.disableButtons();
        s_oGame.onDouble();
    };

    this._onButSplitRelease = function () {
        this.disableButtons();
        s_oGame.onSplit();
    };

    this._onExit = function () {
        document.getElementById("gameexit").click();
        s_oGame.onExit();
    };

    this._onAudioToggle = function () {
        Howler.mute(s_bAudioActive);
        s_bAudioActive = !s_bAudioActive;
    };

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

    s_oInterface = this;

    this._init(iMoney);

    return this;
}

var s_oInterface = null;