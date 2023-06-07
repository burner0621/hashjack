function CToggle(iXPos,iYPos,oSprite,bActive,oParentContainer){
    var _bActive;
    var _aCbCompleted;
    var _aCbOwner;
    var _oButton;
    var _oParentContainer;
    
    this._init = function(iXPos,iYPos,oSprite,bActive){
        _aCbCompleted=new Array();
        _aCbOwner =new Array();
        
        var oData = {   
                        images: [oSprite], 
                        // width, height & registration point of each sprite
                        frames: {width: oSprite.width/2, height: oSprite.height, regX: (oSprite.width/2)/2, regY: oSprite.height/2}, 
                        animations: {state_true:[0],state_false:[1]}
                   };
                   
        var oSpriteSheet = new createjs.SpriteSheet(oData);
         
        _bActive = bActive;
	_oButton = createSprite(oSpriteSheet, "state_"+_bActive,(oSprite.width/2)/2,oSprite.height/2,oSprite.width/2,oSprite.height);
         
        _oButton.x = iXPos;
        _oButton.y = iYPos; 
        _oButton.stop();
        
        _oParentContainer.addChild(_oButton);
        
        this._initListener();
    };
    
    this.unload = function(){
       _oButton.off("mousedown", this.buttonDown);
       _oButton.off("pressup" , this.buttonRelease);
	   
       if(!s_bMobile){
           _oButton.off("mouseover", this.buttonOver);
       }    
           
       _oParentContainer.removeChild(_oButton);
    };
    
    this._initListener = function(){
       _oButton.on("mousedown", this.buttonDown);
       _oButton.on("pressup" , this.buttonRelease);      
       
       if(!s_bMobile){
           _oButton.on("mouseover", this.buttonOver);
       }
    };
    
    this.addEventListener = function( iEvent,cbCompleted, cbOwner ){
        _aCbCompleted[iEvent]=cbCompleted;
        _aCbOwner[iEvent] = cbOwner; 
    };
    
    this.setActive = function(bActive){
        _bActive = bActive;
        _oButton.gotoAndStop("state_"+_bActive);
    };
    
    this.buttonRelease = function(){
        _oButton.scaleX = 1;
        _oButton.scaleY = 1;
        
        playSound("press_but",1,0);
        
        _bActive = !_bActive;
        _oButton.gotoAndStop("state_"+_bActive);

        if(_aCbCompleted[ON_MOUSE_UP]){
            _aCbCompleted[ON_MOUSE_UP].call(_aCbOwner[ON_MOUSE_UP],_bActive);
        }
    };
    
    this.buttonDown = function(){
        _oButton.scaleX = 0.9;
        _oButton.scaleY = 0.9;

       if(_aCbCompleted[ON_MOUSE_DOWN]){
           _aCbCompleted[ON_MOUSE_DOWN].call(_aCbOwner[ON_MOUSE_DOWN]);
       }
    };
    
    this.buttonOver = function(evt){
        if(!s_bMobile){
            evt.target.cursor = "pointer";
        }  
    };
    
    this.setPosition = function(iXPos,iYPos){
         _oButton.x = iXPos;
         _oButton.y = iYPos;
    };
    
    _oParentContainer = oParentContainer;
    this._init(iXPos,iYPos,oSprite,bActive);
}