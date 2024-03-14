function CGame(oData) {
    var _bUpdate = false;
    var _bPlayerTurn;
    var _bSplitActive;
    var _bDoubleForPlayer;
    var _bDealerLoseInCurHand = false;
    var _bNaturalBj;
    var _iInsuranceBet;
    var _iTimeElaps;
    var _iMaxBet;
    var _iMinBet;
    var _iState;
    var _iCardIndexToDeal;
    var _iDealerValueCard;
    var _iCardDealedToDealer;
    var _iAcesForDealer;
    var _iCurFichesToWait;
    var _iNextCardForPlayer;
    var _iNextCardForDealer;
    var _iGameCash;
    var _iAdsCounter;

    var _aCardsDealing;
    var _aCardsInCurHandForDealer;
    var _aDealerCards;
    var _aCardDeck;
    var _aCardsInCurHandForPlayer;
    var _aCurActiveCardOffset;
    var _aCardOut;
    var _aCurDealerPattern;

    var _oStartingCardOffset;
    var _oDealerCardOffset;
    var _oReceiveWinOffset;
    var _oFichesDealerOffset;
    var _oRemoveCardsOffset;
    var _oCardContainer;

    var _oBg;
    var _oLogo;
    var _oInterface;
    var _oSeat;
    var _oGameOverPanel;
    var _oMsgBox;

    var depositedAmount = 0;

    this._init = function () {
        _iMaxBet = MAX_BET;
        _iMinBet = MIN_BET;
        _iState = -1;
        _iTimeElaps = 0;
        _iAdsCounter = 0;

        s_oTweenController = new CTweenController();

        var iRandBg = Math.floor(Math.random() * 4) + 1;
        _oBg = createBitmap(s_oSpriteLibrary.getSprite("bg_game_" + iRandBg));
        s_oStage.addChild(_oBg);
        var _logoSprite = s_oSpriteLibrary.getSprite("logo1");
        _oLogo = createBitmap(_logoSprite);
        _oLogo.regX = _oLogo.width * 2;
        _oLogo.regY = _oLogo.height * 2;
        _oLogo.x = CANVAS_WIDTH / 2 - _logoSprite.width / 2 - 20;
        _oLogo.y = CANVAS_HEIGHT / 2 - _logoSprite.height + 5;
        s_oStage.addChild(_oLogo);

        _oSeat = new CSeat();
        _oSeat.setCredit(Number($("#money").val()));
        _oSeat.addEventListener(SIT_DOWN, this._onSitDown, this);
        _oSeat.addEventListener(RESTORE_ACTION, this._onSetPlayerActions);
        _oSeat.addEventListener(PASS_TURN, this._passTurnToDealer);
        _oSeat.addEventListener(END_HAND, this._onEndHand);
        _oSeat.addEventListener(PLAYER_LOSE, this._playerLose);

        $("#money").click((e) => {
            _oInterface.refreshCredit(e.target.value);
            _oSeat.setCredit(e.target.value);
        });

        _oCardContainer = new createjs.Container();
        s_oStage.addChild(_oCardContainer);

        _oInterface = new CInterface(TOTAL_MONEY);
        _oInterface.displayMsg(TEXT_DISPLAY_MSG_SIT_DOWN);

        this.reset(true);

        _oStartingCardOffset = new CVector2();
        _oStartingCardOffset.set(1214, 228);

        _oDealerCardOffset = new CVector2();
        _oDealerCardOffset.set(788, 180);

        _oReceiveWinOffset = new CVector2();
        _oReceiveWinOffset.set(418, 820);

        _oFichesDealerOffset = new CVector2();
        _oFichesDealerOffset.set(CANVAS_WIDTH / 2, -100);

        _oRemoveCardsOffset = new CVector2(408, 208);

        _aCurActiveCardOffset = new Array(
            _oSeat.getCardOffset(),
            _oDealerCardOffset
        );

        _oInterface.disableBetFiches();
        _oInterface.disableControlBtns();
        _oGameOverPanel = new CGameOver();

        _oMsgBox = new CMsgBox();
        _bUpdate = true;

        window.addEventListener('focus', function () {
            _oInterface.refreshCredit(localStorage.getItem("money"));
            _oSeat.setCredit(localStorage.getItem("money"));

            // _oSeat.setVisibleSitDownButton(false);
            _oSeat.setCredit(Number(localStorage.getItem("money")));
            _oInterface.refreshCredit(localStorage.getItem("money"));

        });

        $("#judgeDealbtn").click((e) => {
            // _oSeat.setVisibleSitDownButton(false);
            _oSeat.setCredit(Number(document.getElementById("money").value));
            _oInterface.refreshCredit(document.getElementById("money").value);
        });
    };

    this.unload = function () {
        _bUpdate = false;

        for (var i = 0; i < _aCardsDealing.length; i++) {
            _aCardsDealing[i].unload();
        }

        var aCards = _oSeat.getPlayerCards();
        for (var k = 0; k < aCards.length; k++) {
            aCards[k].unload();
        }

        _oInterface.unload();
        _oGameOverPanel.unload();
        _oMsgBox.unload();
        s_oStage.removeAllChildren();
    };

    this.reset = function (bFirstPlay) {
        _bPlayerTurn = true;
        _bSplitActive = false;
        _bDoubleForPlayer = false;
        _bNaturalBj = false;
        _iInsuranceBet = 0;
        _iTimeElaps = 0;
        _iCardIndexToDeal = 0;

        _iDealerValueCard = 0;
        _iCardDealedToDealer = 0;
        _iAcesForDealer = 0;
        _iCurFichesToWait = 0;
        _oSeat.reset();

        _aCardsDealing = new Array();
        _aCardsDealing.splice(0);

        _aDealerCards = new Array();
        _aDealerCards.splice(0);

        _oInterface.reset();
        _oInterface.enableBetFiches();
        _oInterface.enableControlBtns();

        if (bFirstPlay) {
            this.shuffleCard();
        } else if (
            _iNextCardForPlayer > _aCardsInCurHandForPlayer.length / 2 ||
            _iNextCardForDealer > _aCardsInCurHandForDealer.length / 2
        ) {
            this.shuffleCard();
        }
    };

    this.setMoney = function (iMoney) {
        _oSeat.setVisibleSitDownButton(false);
        _oSeat.setCredit(Number($("#money").val()));
        _oInterface.refreshCredit(iMoney);

        s_oInterface.enableBetFiches();
        s_oInterface.enableControlBtns();
        s_oInterface.enable(true, false, false, false, false);

        _bUpdate = true;
    };

    this.shuffleCard = function () {
        _aCardDeck = new Array();
        _aCardDeck = s_oGameSettings.getShuffledCardDeck();

        _aCardsInCurHandForPlayer = new Array();
        _aCardsInCurHandForDealer = new Array();
        for (var k = 0; k < _aCardDeck.length; k++) {
            if (k % 2 === 0) {
                _aCardsInCurHandForPlayer.push(_aCardDeck[k]);
            } else {
                _aCardsInCurHandForDealer.push(_aCardDeck[k]);
            }
        }

        _iNextCardForPlayer = 0;
        _iNextCardForDealer = 0;

        _aCardOut = new Array();
        for (var k = 0; k < _aCardDeck.length; k++) {
            _aCardOut[k] = 0;
        }
    };

    this.changeState = function (iState) {
        _iState = iState;

        switch (_iState) {
            case STATE_GAME_DEALING: {
                //CHECK IF THERE IS AVAILABLE GAME CASH
                var iRand;

                if (_iGameCash < _oSeat.getCurBet() * 2) {
                    //USER MUST LOSE
                    iRand = WIN_OCCURRENCE;
                } else {
                    //DECIDE IF DEALER MUST LOSE
                    iRand = Math.random() * 100;
                }

                if (iRand < WIN_OCCURRENCE) {
                    _bDealerLoseInCurHand = true;

                    do {
                        var aTmpDealerPattern = s_oGameSettings.getRandDealerPattern();
                    } while (
                        this._checkIfDealerPatternCanBeUsed(aTmpDealerPattern) === false
                    );

                    _aCurDealerPattern = new Array();
                    for (var i = 0; i < aTmpDealerPattern.length; i++) {
                        _aCurDealerPattern[i] = aTmpDealerPattern[i];
                    }
                } else {
                    _bDealerLoseInCurHand = false;
                }

                _oInterface.disableButtons();
                _oInterface.displayMsg(TEXT_DISPLAY_MSG_DEALING);
                this._dealing();
                break;
            }
        }
    };

    this._checkIfDealerPatternCanBeUsed = function (aTmpDealerPattern) {
        for (var i = 0; i < aTmpDealerPattern.length; i++) {
            if (_aCardOut[aTmpDealerPattern[i]] > 1) {
                return false;
            }
        }

        return true;
    };

    this.attachCardToDeal = function (
        pStartingPoint,
        pEndingPoint,
        bDealer,
        iCardCount
    ) {
        var oCard = new CCard(
            _oStartingCardOffset.getX(),
            _oStartingCardOffset.getY(),
            _oCardContainer
        );
        var iCard;
        if (bDealer) {
            //DEALER CARDS
            if (_bDealerLoseInCurHand) {
                iCard = _aCurDealerPattern.shift();
                _iNextCardForDealer++;
            } else {
                do {
                    iCard = _aCardsInCurHandForDealer[_iNextCardForDealer];
                    _iNextCardForDealer++;
                    if (_iNextCardForDealer > _aCardsInCurHandForDealer.length / 2) {
                        this.shuffleCard();
                        _iNextCardForDealer = 0;
                    }

                    var iValue = s_oGameSettings.getCardValue(iCard);
                    if (iValue === 11 && _iDealerValueCard + iValue > 21) {
                        iValue = 1;
                    }
                } while (
                    _iDealerValueCard + iValue > 21 ||
                    (_iDealerValueCard + iValue > 16 &&
                        _iDealerValueCard + iValue < _oSeat.getHandValue(0) &&
                        _oSeat.getHandValue(0) < 21)
                );
            }
            oCard.setInfo(
                pStartingPoint,
                pEndingPoint,
                iCard,
                s_oGameSettings.getCardValue(iCard),
                bDealer,
                iCardCount
            );

            _aCardOut[iCard] += 1;
        } else {
            //PLAYER CARDS
            if (_bDealerLoseInCurHand) {
                do {
                    iCard = _aCardsInCurHandForPlayer[_iNextCardForPlayer];
                    _iNextCardForPlayer++;
                    if (_iNextCardForPlayer > _aCardsInCurHandForPlayer.length / 2) {
                        this.shuffleCard();
                        _iNextCardForPlayer = 0;
                    }

                    var iValue = s_oGameSettings.getCardValue(iCard);
                    if (iValue === 11 && _oSeat.getHandValue(0) + iValue > 21) {
                        iValue = 1;
                    }
                } while (_oSeat.getHandValue(0) + iValue > 21);
            } else {
                do {
                    iCard = _aCardsInCurHandForPlayer[_iNextCardForPlayer];
                    _iNextCardForPlayer++;
                    if (_iNextCardForPlayer > _aCardsInCurHandForPlayer.length / 2) {
                        this.shuffleCard();
                        _iNextCardForPlayer = 0;
                    }

                    var iValue = s_oGameSettings.getCardValue(iCard);
                    if (iValue === 11 && _oSeat.getHandValue(0) + iValue > 21) {
                        iValue = 1;
                    }
                } while (
                    _oSeat.getHandValue(0) + iValue > 16 &&
                    _oSeat.getHandValue(0) + iValue < 22
                );
            }
            oCard.setInfo(
                pStartingPoint,
                pEndingPoint,
                iCard,
                s_oGameSettings.getCardValue(iCard),
                bDealer,
                iCardCount
            );

            _aCardOut[iCard] += 1;
        }

        oCard.addEventListener(
            ON_CARD_ANIMATION_ENDING,
            this.cardFromDealerArrived
        );

        _aCardsDealing.push(oCard);

        playSound("card", 1, false);
    };

    this.cardFromDealerArrived = function (oCard, bDealerCard, iCount) {
        for (var i = 0; i < _aCardsDealing.length; i++) {
            if (_aCardsDealing[i] === oCard) {
                _aCardsDealing.splice(i, 1);
                break;
            }
        }

        if (bDealerCard === false) {
            _oSeat.addCardToHand(oCard);
            _oSeat.increaseHandValue(oCard.getValue());
            if (iCount > 2) {
                _oSeat.refreshCardValue();
            }
        } else {
            _iDealerValueCard += oCard.getValue();
            if (_iCardDealedToDealer > 2) {
                _oInterface.refreshDealerCardValue(_iDealerValueCard);
            }
            if (oCard.getValue() === 11) {
                _iAcesForDealer++;
            }

            _aDealerCards.push(oCard);
        }

        if (iCount < 3) {
            s_oGame._dealing();
        } else {
            s_oGame._checkHand();
            if (bDealerCard === false && _bDoubleForPlayer) {
                _bDoubleForPlayer = false;
                s_oGame._onStandPlayer();
            }
        }
    };

    this._onStandPlayer = function () {
        _oSeat.stand();
    };

    this._checkHand = function () {
        var i;

        if (_bPlayerTurn) {
            _oSeat.checkHand();
        } else {
            _oInterface.refreshDealerCardValue(_iDealerValueCard);

            if (_bNaturalBj) {
                if (_iDealerValueCard === 21) {
                    this.playerStandOff(0);
                } else {
                    this._playerWin(0);
                }
            } else if (_iDealerValueCard === 21 && _aDealerCards.length === 2) {
                if (_iInsuranceBet > 0 && _aDealerCards.length === 2) {
                    _oSeat.increaseCredit(_iInsuranceBet * 2 + _iInsuranceBet);
                    _iGameCash -= _iInsuranceBet * 2;

                    _oInterface.refreshCredit(_oSeat.getCredit());

                    for (i = 0; i < _oSeat.getNumHands(); i++) {
                        this._playerLose(i);
                    }
                } else {
                    for (i = 0; i < _oSeat.getNumHands(); i++) {
                        this._playerLose(i);
                    }
                }
            } else if (_iDealerValueCard > 21) {
                if (_iAcesForDealer > 0) {
                    _iAcesForDealer--;
                    _iDealerValueCard -= 10;
                    _oInterface.refreshDealerCardValue(_iDealerValueCard);
                    if (_iDealerValueCard < 17) {
                        this.hitDealer();
                    } else {
                        this._checkWinner();
                    }
                } else {
                    this._checkWinner();
                }
            } else if (_iDealerValueCard < 17) {
                this.hitDealer();
            } else {
                this._checkWinner();
            }
        }
    };

    this._playerWin = function (iHand) {
        var iMult = 1;
        if (
            _oSeat.getHandValue(iHand) === 21 &&
            _oSeat.getNumCardsForHand(iHand) === 2
        ) {
            iMult = BLACKJACK_PAYOUT;
        }

        var iTotalWin = parseFloat(
            _oSeat.getBetForHand(iHand) +
            parseFloat((_oSeat.getBetForHand(iHand) * iMult).toFixed(3))
        );

        // decrease fee
        var roundFee = Number.parseFloat((iTotalWin * 0.035).toFixed(3));
        iTotalWin = iTotalWin - roundFee;

        _oSeat.increaseCredit(iTotalWin);
        _iGameCash -= iTotalWin;

        _oSeat.showWinner(iHand, TEXT_SHOW_WIN_PLAYER, iTotalWin, roundFee);
        _oInterface.displayMsg(TEXT_DISPLAY_MSG_PLAYER_WIN);

        _oSeat.initMovement(
            iHand,
            _oReceiveWinOffset.getX(),
            _oReceiveWinOffset.getY()
        );

        if (_iDealerValueCard === 21) {
            _oSeat.initInsuranceMov(
                _oReceiveWinOffset.getX(),
                _oReceiveWinOffset.getY()
            );
        } else {
            _oSeat.initInsuranceMov(
                _oFichesDealerOffset.getX(),
                _oFichesDealerOffset.getY()
            );
        }
    };

    this._playerLose = function (iHand) {
        _oSeat.showWinner(iHand, TEXT_SHOW_LOSE_PLAYER, 0, 0);
        _oInterface.displayMsg(TEXT_DISPLAY_MSG_PLAYER_LOSE);

        _oSeat.initMovement(
            iHand,
            _oFichesDealerOffset.getX(),
            _oFichesDealerOffset.getY()
        );

        if (_iDealerValueCard === 21) {
            _oSeat.initInsuranceMov(
                _oReceiveWinOffset.getX(),
                _oReceiveWinOffset.getY()
            );
        } else {
            _oSeat.initInsuranceMov(
                _oFichesDealerOffset.getX(),
                _oFichesDealerOffset.getY()
            );
        }
    };

    this.playerStandOff = function (iHand) {
        _oSeat.increaseCredit(_oSeat.getBetForHand(iHand));
        _iGameCash -= _oSeat.getBetForHand(iHand);

        _oSeat.showWinner(iHand, TEXT_SHOW_STANDOFF, 0, 0);
        _oInterface.displayMsg(TEXT_DISPLAY_MSG_PLAYER_STANDOFF);

        _oSeat.initMovement(
            iHand,
            _oReceiveWinOffset.getX(),
            _oReceiveWinOffset.getY()
        );

        if (_iDealerValueCard === 21) {
            _oSeat.initInsuranceMov(
                _oReceiveWinOffset.getX(),
                _oReceiveWinOffset.getY()
            );
        } else {
            _oSeat.initInsuranceMov(
                _oFichesDealerOffset.getX(),
                _oFichesDealerOffset.getY()
            );
        }
    };

    this._dealing = function () {
        if (_iCardIndexToDeal < _aCurActiveCardOffset.length * 2) {
            var oCard = new CCard(
                _oStartingCardOffset.getX(),
                _oStartingCardOffset.getY(),
                _oCardContainer
            );

            var pStartingPoint = new CVector2(
                _oStartingCardOffset.getX(),
                _oStartingCardOffset.getY()
            );
            var pEndingPoint;

            //THIS CARD IS FOR THE DEALER
            if (_iCardIndexToDeal % _aCurActiveCardOffset.length === 1) {
                _iCardDealedToDealer++;
                pEndingPoint = new CVector2(
                    _oDealerCardOffset.getX() +
                    (CARD_WIDTH + 2) * (_iCardIndexToDeal > 1 ? 1 : 0),
                    _oDealerCardOffset.getY()
                );

                var iCard;
                if (_bDealerLoseInCurHand) {
                    iCard = _aCurDealerPattern.shift();
                } else {
                    iCard = _aCardsInCurHandForDealer[_iNextCardForDealer];
                }

                oCard.setInfo(
                    pStartingPoint,
                    pEndingPoint,
                    iCard,
                    s_oGameSettings.getCardValue(iCard),
                    true,
                    _iCardDealedToDealer
                );

                _aCardOut[iCard] += 1;
                _iNextCardForDealer++;
                if (_iCardDealedToDealer === 2) {
                    oCard.addEventListener(ON_CARD_SHOWN, this._onCardShown);
                }
            } else {
                if (
                    !_bDealerLoseInCurHand &&
                    _iNextCardForPlayer === 1 &&
                    s_oGameSettings.getCardValue(
                        _aCardsInCurHandForPlayer[_iNextCardForPlayer]
                    ) +
                    s_oGameSettings.getCardValue(
                        _aCardsInCurHandForPlayer[_iNextCardForPlayer - 1]
                    ) >
                    18
                ) {
                    var iFirstValue = s_oGameSettings.getCardValue(
                        _aCardsInCurHandForPlayer[_iNextCardForPlayer - 1]
                    );

                    do {
                        _aCardsInCurHandForPlayer.shift();
                    } while (
                        iFirstValue +
                        s_oGameSettings.getCardValue(
                            _aCardsInCurHandForPlayer[_iNextCardForPlayer]
                        ) ===
                        21
                    );
                }

                oCard.setInfo(
                    pStartingPoint,
                    _oSeat.getAttachCardOffset(),
                    _aCardsInCurHandForPlayer[_iNextCardForPlayer],
                    s_oGameSettings.getCardValue(
                        _aCardsInCurHandForPlayer[_iNextCardForPlayer]
                    ),
                    false,
                    _oSeat.newCardDealed()
                );

                _aCardOut[_aCardsInCurHandForPlayer[_iNextCardForPlayer]] += 1;
                _iNextCardForPlayer++;
            }

            _aCardsDealing.push(oCard);
            _iCardIndexToDeal++;

            oCard.addEventListener(
                ON_CARD_ANIMATION_ENDING,
                this.cardFromDealerArrived
            );
            oCard.addEventListener(ON_CARD_TO_REMOVE, this._onRemoveCard);

            playSound("card", 1, false);
        } else {
            this._checkAvailableActionForPlayer();
        }
    };

    this.hitDealer = function () {
        var pStartingPoint = new CVector2(
            _oStartingCardOffset.getX(),
            _oStartingCardOffset.getY()
        );
        var pEndingPoint = new CVector2(
            _oDealerCardOffset.getX() + (CARD_WIDTH + 3) * _iCardDealedToDealer,
            _oDealerCardOffset.getY()
        );
        _iCardDealedToDealer++;

        this.attachCardToDeal(
            pStartingPoint,
            pEndingPoint,
            true,
            _iCardDealedToDealer
        );

        this.changeState(STATE_GAME_HITTING);

        playSound("card", 1, false);
    };

    this._checkWinner = function () {
        for (var i = 0; i < _oSeat.getNumHands(); i++) {
            if (_oSeat.getHandValue(i) > 21) {
                this._playerLose(i);
            } else if (_iDealerValueCard > 21) {
                this._playerWin(i);
            } else if (
                _oSeat.getHandValue(i) < 22 &&
                _oSeat.getHandValue(i) > _iDealerValueCard
            ) {
                this._playerWin(i);
            } else if (_oSeat.getHandValue(i) === _iDealerValueCard) {
                this.playerStandOff(i);
            } else {
                this._playerLose(i);
            }
        }
    };

    this._onEndHand = function () {
        var pRemoveOffset = new CVector2(
            _oRemoveCardsOffset.getX(),
            _oRemoveCardsOffset.getY()
        );

        for (var i = 0; i < _aDealerCards.length; i++) {
            _aDealerCards[i].initRemoving(pRemoveOffset);
            _aDealerCards[i].hideCard();
        }

        var aCards = _oSeat.getPlayerCards();
        for (var k = 0; k < aCards.length; k++) {
            aCards[k].initRemoving(pRemoveOffset);
            aCards[k].hideCard();
        }

        _oSeat.clearText();
        _oInterface.clearDealerText();
        _iTimeElaps = 0;
        s_oGame.changeState(STATE_GAME_SHOW_WINNER);

        playSound("fiche_collect", 1, false);

        _iAdsCounter++;
        if (_iAdsCounter === AD_SHOW_COUNTER) {
            _iAdsCounter = 0;
            $(s_oMain).trigger("show_interlevel_ad");
        }
    };

    this.getCurrentCredit = function () {
        return _oSeat.getCredit();
    };

    this.ficheSelected = function (iFicheValue, iFicheIndex) {
        var iCurBet = _oSeat.getCurBet();

        if (iFicheValue > _oSeat.getCredit()) {
            _oMsgBox.show(TEXT_NO_MONEY);
        } else if (iCurBet + iFicheValue > _iMaxBet) {
            _oMsgBox.show(TEXT_ERROR_MAX_BET);
        } else {
            iCurBet += iFicheValue;
            iCurBet = Number(iCurBet.toFixed(1));

            _oSeat.decreaseCredit(iFicheValue);
            _iGameCash += iFicheValue;

            _oSeat.changeBet(iCurBet);
            _oSeat.refreshFiches(iFicheValue, iFicheIndex, 0, 0);

            _oSeat.bet(iCurBet, false);
            _oInterface.enableControlBtns();
            _oInterface.enable(true, false, false, false, false);
            _oInterface.refreshCredit(_oSeat.getCredit());
        }
    };

    this._checkAvailableActionForPlayer = function () {
        this.changeState(-1);

        var iPlayerValueCard = _oSeat.getHandValue(0);
        //PLAYER HAVE 21 WITH FIRST 2 CARDS
        if (iPlayerValueCard === 21) {
            _bNaturalBj = true;
            _oSeat.refreshCardValue();

            //SHOW INSURANCE PANEL
            if (
                _aDealerCards[0].getValue() === 11 &&
                _oSeat.getCredit() >= _oSeat.getCurBet() / 2
            ) {
                _iInsuranceBet = _oSeat.getCurBet() / 2;
                _oInterface.showInsurancePanel();
            } else {
                this._passTurnToDealer();
            }
            return;
        } else if (iPlayerValueCard > 21) {
            _oSeat.removeAce();
        }

        _oSeat.refreshCardValue();
        var bActivateSplit = false;

        if (
            _oSeat.isSplitAvailable() &&
            _oSeat.getCredit() >= _oSeat.getCurBet() * 1.5
        ) {
            bActivateSplit = true;
        }
        _oInterface.displayMsg(TEXT_DISPLAY_MSG_YOUR_ACTION);

        var bActivateDouble = false;
        if (
            _oSeat.getNumCardsForHand(0) === 2 &&
            _oSeat.getHandValue(0) > 8 &&
            _oSeat.getHandValue(0) < 16 &&
            _oSeat.getCredit() >= _oSeat.getCurBet() &&
            !_bSplitActive
        ) {
            bActivateDouble = true;
        }
        _oInterface.disableControlBtns();
        _oInterface.enable(false, true, true, bActivateDouble, bActivateSplit);

        //SHOW INSURANCE PANEL
        if (
            _aDealerCards[0].getValue() === 11 &&
            _oSeat.getCredit() >= _oSeat.getCurBet() / 2
        ) {
            _oInterface.showInsurancePanel();
        }
    };

    this._passTurnToDealer = function () {
        if (!_bPlayerTurn) {
            return;
        }
        _bPlayerTurn = false;
        _oInterface.disableButtons();
        _aDealerCards[1].showCard();
        playSound("card", 1, false);

        _oInterface.displayMsg(TEXT_DISPLAY_MSG_DEALER_TURN);
    };

    this._gameOver = function () {
        this.clearBets();
        _oGameOverPanel.show();
    };

    this.onFicheSelected = function (iFicheIndex, iFicheValue) {
        this.ficheSelected(iFicheValue, iFicheIndex);
    };

    this._onSetPlayerActions = function (bDeal, bHit, bStand, bDouble, bSplit) {
        _oInterface.enable(bDeal, bHit, bStand, bDouble, bSplit);
        _oSeat.refreshCardValue();
    };

    this._onSitDown = function () {
        this.changeState(STATE_GAME_WAITING_FOR_BET);
        _oInterface.enableBetFiches();
        _oInterface.enableControlBtns();
    };

    this.onDeal = function () {
        if (
            parseFloat(_oSeat.getCredit()) + parseFloat(_oSeat.getCurBet()) <
            _iMinBet
        ) {
            this._gameOver();

            return;
        }

        if (_iMinBet > _oSeat.getCurBet()) {
            _oMsgBox.show(TEXT_ERROR_MIN_BET);
            s_oInterface.enableBetFiches();
            s_oInterface.enableControlBtns();
            s_oInterface.enable(true, false, false, false, false);
            return;
        }

        this.changeState(STATE_GAME_DEALING);

        $(s_oMain).trigger("bet_placed", _oSeat.getCurBet());
    };

    this.onHit = function () {
        var pStartingPoint = new CVector2(
            _oStartingCardOffset.getX(),
            _oStartingCardOffset.getY()
        );

        var pEndingPoint = new CVector2(
            _oSeat.getAttachCardOffset().getX(),
            _oSeat.getAttachCardOffset().getY()
        );

        this.attachCardToDeal(
            pStartingPoint,
            pEndingPoint,
            false,
            _oSeat.newCardDealed()
        );

        this.changeState(STATE_GAME_HITTING);
    };

    this.onStand = function () {
        _oSeat.stand();
    };

    this.onDouble = function () {
        var iDoubleBet = _oSeat.getCurBet();

        var iCurBet = iDoubleBet;
        iCurBet += iDoubleBet;

        _oSeat.doubleAction(iCurBet);
        _oSeat.changeBet(iCurBet);
        _oSeat.decreaseCredit(iDoubleBet);
        _iGameCash += iDoubleBet;
        if (_iGameCash < iCurBet * 2) {
            _bDealerLoseInCurHand = false;
        }

        _oSeat.bet(iCurBet);
        _oInterface.refreshCredit(_oSeat.getCredit());
        this.onHit();

        _bDoubleForPlayer = true;
        $(s_oMain).trigger("bet_placed", iDoubleBet);
    };

    this.onSplit = function () {
        if (_iGameCash < _oSeat.getCurBet() * 4) {
            _bDealerLoseInCurHand = false;
        }
        _oSeat.split();

        this.changeState(STATE_GAME_SPLIT);
    };

    this._onSplitCardEndAnim = function () {
        var iCurBet = _oSeat.getCurBet();
        var iSplitBet = iCurBet;
        iCurBet += iSplitBet;
        _oSeat.bet(iCurBet, true);

        _bSplitActive = true;

        _oInterface.disableControlBtns();
        _oInterface.enable(false, true, true, false, false);

        _oSeat.setSplitHand();
        _oSeat.refreshCardValue();

        _oSeat.changeBet(iCurBet - iSplitBet);
        _oSeat.decreaseCredit(iSplitBet);
        _iGameCash += iSplitBet;

        _oInterface.refreshCredit(_oSeat.getCredit());

        $(s_oMain).trigger("bet_placed", iSplitBet);
    };

    this.clearBets = function () {
        var iCurBet = _oSeat.getStartingBet();

        if (iCurBet > 0) {
            _oSeat.clearBet();
            _oSeat.increaseCredit(iCurBet);
            _iGameCash -= iCurBet;
            _oInterface.refreshCredit(_oSeat.getCredit());
        }
    };

    this.rebet = function () {
        this.clearBets();

        var iValue = _oSeat.rebet();
        if (iValue > 0) {
            _oInterface.enableControlBtns();
            _oInterface.enable(true, false, false, false, false);
            _iGameCash += iValue;

            _oInterface.refreshCredit(_oSeat.getCredit());
            _iTimeElaps = BET_TIME;
        } else {
            _oInterface.disableRebet();
        }
    };

    this.onBuyInsurance = function () {
        _iInsuranceBet = _oSeat.getCurBet() / 2;
        var iCurBet = _oSeat.getCurBet();
        iCurBet += _iInsuranceBet;
        _oSeat.insurance(iCurBet, -_iInsuranceBet, _iInsuranceBet);

        _oInterface.refreshCredit(_oSeat.getCredit());

        if (_bNaturalBj) {
            this._passTurnToDealer();
        }
    };

    this.onNotBuyInsurance = function () {
        if (_bNaturalBj) {
            this._passTurnToDealer();
        }
    };

    this._onCardShown = function () {
        s_oGame._checkHand();
    };

    this._onRemoveCard = function (oCard) {
        oCard.unload();
    };

    this.onExit = function () {
        this.unload();
        $(s_oMain).trigger("save_score", [_oSeat.getCredit()]);
        $(s_oMain).trigger("end_session");
        $(s_oMain).trigger("share_event", _oSeat.getCredit());
        s_oMain.gotoMenu();
    };

    this.getState = function () {
        return _iState;
    };

    this._updateWaitingBet = function () {
        _iTimeElaps += s_iTimeElaps;
        if (_iTimeElaps > BET_TIME) {
            _iTimeElaps = 0;

            if (_oSeat.getCurBet() < _iMinBet) {
                return;
            }
            _oInterface.disableBetFiches();
            _oInterface.disableControlBtns();
            _oInterface.enable(true, false, false, false, false);
            this.changeState(STATE_GAME_DEALING);

            $(s_oMain).trigger("bet_placed", _oSeat.getCurBet());
        } else {
            // var iCountDown = Math.floor((BET_TIME - _iTimeElaps) / 1000);
            _oInterface.displayMsg(
                TEXT_MIN_BET + ":" + _iMinBet + "\n" + TEXT_MAX_BET + ":" + _iMaxBet,
                TEXT_DISPLAY_MSG_WAITING_BET
            );
        }
    };

    this._updateDealing = function () {
        for (var i = 0; i < _aCardsDealing.length; i++) {
            _aCardsDealing[i].update();
        }
    };

    this._updateHitting = function () {
        for (var i = 0; i < _aCardsDealing.length; i++) {
            _aCardsDealing[i].update();
        }
    };

    this._updateSplit = function () {
        _oSeat.updateSplit();
    };

    this._updateShowWinner = function () {
        _oSeat.updateFichesController(s_iTimeElaps);

        var aCards = _oSeat.getPlayerCards();
        for (var k = 0; k < aCards.length; k++) {
            aCards[k].update();
        }

        for (var j = 0; j < _aDealerCards.length; j++) {
            _aDealerCards[j].update();
        }

        _iTimeElaps += s_iTimeElaps;
        if (_iTimeElaps > TIME_END_HAND) {
            _iTimeElaps = 0;
            this.reset(false);
            _oInterface.reset();

            if (_oSeat.getCredit() < _iMinBet) {
                this._gameOver();
                this.changeState(-1);
            } else {
                this.changeState(STATE_GAME_WAITING_FOR_BET);
            }

            _oInterface.refreshCredit(_oSeat.getCredit());
        }
    };

    this.update = function () {
        if (_bUpdate === false) {
            return;
        }

        switch (_iState) {
            case STATE_GAME_WAITING_FOR_BET: {
                this._updateWaitingBet();
                break;
            }
            case STATE_GAME_DEALING: {
                this._updateDealing();
                break;
            }
            case STATE_GAME_HITTING: {
                this._updateHitting();
                break;
            }
            case STATE_GAME_SPLIT: {
                this._updateSplit();
                break;
            }
            case STATE_GAME_SHOW_WINNER: {
                this._updateShowWinner();
                break;
            }
        }
    };

    s_oGame = this;

    TOTAL_MONEY = oData.money;
    MIN_BET = oData.min_bet;
    MAX_BET = oData.max_bet;
    BET_TIME = oData.bet_time;
    BLACKJACK_PAYOUT = oData.blackjack_payout;
    WIN_OCCURRENCE = oData.win_occurrence;
    _iGameCash = oData.game_cash;

    AD_SHOW_COUNTER = oData.ad_show_counter;

    this._init();
}

var s_oGame;
var s_oTweenController;
