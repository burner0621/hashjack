function CGameOver(){
    var _oTextTitle;
    var _oButRecharge;
    var _oButExit;
    var _oContainer;
    
    this._init = function(){
        _oContainer = new createjs.Container();
        s_oStage.addChild(_oContainer);
    	_oContainer.on("click",function(){});

        var oBg = createBitmap(s_oSpriteLibrary.getSprite('msg_box'));
        _oContainer.addChild(oBg);
        
        _oTextTitle = new CTLText(_oContainer, 
                    CANVAS_WIDTH/2-190, 290, 360, 100, 
                    32, "center", "#fff", FONT_GAME_1, 1,
                    0, 0,
                    TEXT_NO_MONEY,
                    true, true, true,
                    false );
                    

        _oTextTitle.setShadow("#000000", 2, 2, 2);
        
        _oButExit = new CTextButton(CANVAS_WIDTH/2,450,s_oSpriteLibrary.getSprite('but_game_bg'),TEXT_OK,FONT_GAME_1,"#fff",14,_oContainer);
        _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);
        
        this.hide();
    };
	
	this.unload = function(){
//		_oButRecharge.unload();
		_oButExit.unload();
		_oContainer.off("click",function(){});
	};
    
    this.show = function(){
        _oContainer.visible = true;
    };
    
    this.hide = function(){
        _oContainer.visible = false;
    };
    
    this._onRecharge = function(){
        _oContainer.visible = false;
        $(s_oMain).trigger("recharge");

    };
    
    this._onExit = function(){
        _oContainer.visible = false;
        // s_oInterface.enableBetFiches();
        s_oInterface.enableControlBtns();
        // s_oInterface.enable(true,false,false,false,false);
    };
    
    this._init();
}