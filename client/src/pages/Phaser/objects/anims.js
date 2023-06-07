"use strict";

class Anim {

  constructor(scene)
  {
    this.game = scene;

    this.init();
  }

  init()
  {
    // 0,4,8,12

    this.addAnim_2('dance',[8,9]);
    this.addAnim_2('left',[3,2,1,0]);
    this.addAnim_2('right',[4,5,6,7]);
    
    this.addAnim_2('front',[13,12,11,10]); //down
    this.addAnim_2('back',[14,15,16,17]);  //up
  }

  addAnim(str,start=0,end=1,frameRate = 8,repeat=0) {

    var spriteSheet = 'avatar';

    var frames = this.game.anims.generateFrameNumbers(spriteSheet,{start:start,end:end});

    var anim_config = {
      key:str,
      frames:frames,
      frameRate:frameRate,
      repeat: repeat,
      skipMissedFrames: true
    };

    this.game.anims.create(anim_config);

  }

  addAnim_2(str,framesArr,frameRate = 8,repeat = 0)
  {
    var spriteSheet = 'avatar';

    var frames = this.game.anims.generateFrameNumbers(spriteSheet, { frames: framesArr });

    var anim_config = {
      key:str,
      frames:frames,
      frameRate:frameRate,
      repeat: repeat,
      skipMissedFrames: true
    };

    this.game.anims.create(anim_config);
  }

};

export default Anim;