function CTextButton(iXPos,iYPos,oSprite,szText,szFont,szColor,iFontSize,oParentContainer){
    var _bDisable;
    var _iCurScale;
    var _iWidth;
    var _iHeight;
    var _aCbCompleted;
    var _aCbOwner;
    var _oListenerDown;
    var _oListenerUp;
    var _oParams;
    
    var _oButton;

    var _oText;
    var _oButtonBg;
    var _oParentContainer = oParentContainer;
    
    this._init = function(iXPos,iYPos,oSprite,szText,szFont,szColor,iFontSize){
        _bDisable = false;
        _iCurScale = 1;
        _aCbCompleted=new Array();
        _aCbOwner =new Array();

        _oButtonBg = createBitmap( oSprite);
	_iWidth = oSprite.width;
        _iHeight = oSprite.height;

        

        _oButton = new createjs.Container();
        _oButton.x = iXPos;
        _oButton.y = iYPos;
        _oButton.regX = oSprite.width/2;
        _oButton.regY = oSprite.height/2;
	if (!s_bMobile){
            _oButton.cursor = "pointer";
	}
        _oButton.addChild(_oButtonBg,_oText);

        _oParentContainer.addChild(_oButton);
        
        _oText = new CTLText(_oButton, 
                    10, 6, oSprite.width-20, oSprite.height-10, 
                    iFontSize, "center", szColor, szFont, 1,
                    0, 0,
                    szText,
                    true, true, false,
                    false );
                    
        this._initListener();
    };
    
    this.unload = function(){
       _oButton.off("mousedown", _oListenerDown);
       _oButton.off("pressup" , _oListenerUp); 
       
       _oParentContainer.removeChild(_oButton);
    };
    
    this.setVisible = function(bVisible){
        _oButton.visible = bVisible;
    };
    
    this.setAlign = function(szAlign){
        _oText.textAlign = szAlign;
    };
    
    this.setTextX = function(iX){
        _oText.x = iX;
    };
    
    this.setScale = function(iScale){
        _oButton.scaleX = _oButton.scaleY = iScale;
        _iCurScale = iScale;
    };
    
    this.enable = function(){
        _bDisable = false;
        
        _oButton.filters = [];

        _oButton.cache(0,0,_iWidth,_iHeight);
    };
    
    
    this.disable = function(){
        _bDisable = true;
        
        var matrix = new createjs.ColorMatrix().adjustSaturation(-100);
        _oButton.filters = [
                 new createjs.ColorMatrixFilter(matrix)
        ];
        _oButton.cache(0,0,_iWidth,_iHeight);
    };
    
    this._initListener = function(){
       _oListenerDown = _oButton.on("mousedown", this.buttonDown);
       _oListenerUp = _oButton.on("pressup" , this.buttonRelease);      
    };
    
    this.addEventListener = function( iEvent,cbCompleted, cbOwner ){
        _aCbCompleted[iEvent]=cbCompleted;
        _aCbOwner[iEvent] = cbOwner; 
    };
    
    this.addEventListenerWithParams = function(iEvent,cbCompleted, cbOwner,oParams){
        _aCbCompleted[iEvent]=cbCompleted;
        _aCbOwner[iEvent] = cbOwner;
        
        _oParams = oParams;
    };
    
    this.buttonRelease = function(){
        if(_bDisable){
            return;
        }
        
        playSound("press_but",1,false);
        
        _oButton.scaleX = _iCurScale;
        _oButton.scaleY = _iCurScale;

        if(_aCbCompleted[ON_MOUSE_UP]){
            _aCbCompleted[ON_MOUSE_UP].call(_aCbOwner[ON_MOUSE_UP],_oParams);
        }
    };
    
    this.buttonDown = function(){
        if(_bDisable){
            return;
        }
        _oButton.scaleX = _iCurScale*0.9;
        _oButton.scaleY = _iCurScale*0.9;

       if(_aCbCompleted[ON_MOUSE_DOWN]){
           _aCbCompleted[ON_MOUSE_DOWN].call(_aCbOwner[ON_MOUSE_DOWN]);
       }
    };
    
    this.setPosition = function(iXPos,iYPos){
         _oButton.x = iXPos;
         _oButton.y = iYPos;
    };
    
    this.tweenPosition = function(iXPos,iYPos,iTime,iDelay,oEase,oCallback,oCallOwner){
        createjs.Tween.get(_oButton).wait(iDelay).to({x:iXPos,y:iYPos}, iTime,oEase).call(function(){
            if(oCallback !== undefined){
                oCallback.call(oCallOwner);
            }
        }); 
    };
    
    this.changeText = function(szText){
        _oText.refreshText(szText);
    };
    
    this.setX = function(iXPos){
         _oButton.x = iXPos;
    };
    
    this.setY = function(iYPos){
         _oButton.y = iYPos;
    };
    
    this.getButtonImage = function(){
        return _oButton;
    };

    this.getX = function(){
        return _oButton.x;
    };
    
    this.getY = function(){
        return _oButton.y;
    };
    
    this.getSprite = function(){
        return _oButton;
    };
    
    this.getScale = function(){
        return _oButton.scaleX;
    };

    this._init(iXPos,iYPos,oSprite,szText,szFont,szColor,iFontSize);
}