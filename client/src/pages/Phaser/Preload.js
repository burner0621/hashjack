import Phaser from 'phaser';
import axios from 'axios';
import * as env from "../../env";

class Preload extends Phaser.Scene {

  constructor()
  {
		super({key:"preload"});
  }
  init()
  {

  }
  async preload()
  {
    const res_player = await axios.get(env.SERVER_URL + "/api/account/get_allplayer");
    this.playerInfo = res_player.data.data;

    this.load.once('complete', this.loadComplete, this);
    
    for(let i = 0;i < this.playerInfo.length;i++) {
      this.load.image('avatar_' + this.playerInfo[i].accountId, env.SERVER_URL + this.playerInfo[i].phaserAvatarUrl);
    }

    this.load.start();
  }

  loadComplete() {
    this.scene.start('map', {playerInfo: this.playerInfo});
  }
}

export default Preload;