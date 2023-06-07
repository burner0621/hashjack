import Phaser from 'phaser';

import store from "../../store";

import LevelTotalMap from './objects/level-totalmap';
import * as env from "../../env";
import axios from 'axios';
import { getRequest, postRequest } from "../../assets/api/apiRequests";

//actions
import { setSceneName, setBuildingImages, setLoading } from '../../actions/scene';
import { selectNFT, setWalletNftList } from '../../actions/nft';
import { setBuildingState, setVisitPlace } from '../../actions/playerinfo';
import { getPlaceInfo, setPlaceInfo, handlePlaceDetailDialog, setTeleportData } from '../../actions/placeinfo';
import { moveToFriend } from '../../actions/friends';
import { setMusicChanged, setVolumeChanged } from "../../actions/music";
import music from 'reducers/music';

class Map extends Phaser.Scene {

  constructor() {
    super({ key: "map" });
  }

  init(data) {
    this.socket = this.game.config.mysocket;
    this.playerInfo = data.playerInfo;
    this.beforeGroundNumber = "";
    this.mapsizex = 40;
    this.mapsizey = 45;

    //zoom flag
    this.grandflag = 0;
    this.bigflag = 0;
    this.mediumflag = 0;
    this.smallflag = 0;

    this.levelTotalMap = new LevelTotalMap();
    //search flag
    this.searchflag = 0;
    //scene flag
    this.sceneflag = 1;
    //pointer flag
    this.pointerflag = 0;
    this.successGetNftFlag = 0;

    //pos
    this.pos = [];
    this.posInfo = [];

    //sound
    this.sfx = undefined;

    this.grand_created = 0;
    this.big_created = 0;
    this.medium_created = 0;
    this.small_created = 0;

    this.selectedAddress = '';
    this.selectedPos = '';
  }

  async _setNFTData(accountId, walletNftList) {
    await postRequest(env.SERVER_URL + "/api/nft/add_nft_list", { accountId: btoa(accountId), nftData: btoa(JSON.stringify(walletNftList)) });
  }

  async _getNFTData() {
    let res = await axios.get(env.SERVER_URL + "/api/nft/get_nftData");
    this.NFTData = res.data.data;
    console.log("---------------NftData--------------", this.NFTData);
  }

  preload() {
    this.load.spritesheet('avatar', require('../../assets/imgs/spritesheets/avatar-action.png'), { frameWidth: 32, frameHeight: 64 });
    this.load.image('game_bg', require("../../assets/imgs/sky.jpg"));
    this.load.image('map', process.env.PUBLIC_URL + "imgs/map-img-temp.png");
    this.load.image('pos_background', process.env.PUBLIC_URL + "imgs/avatars/grey-panel.png");
    this.load.image('pos_red', require('../../assets/imgs/pos_red.png'));
    this.load.image('pos_blue', require('../../assets/imgs/pos_blue.png'));
    this.load.image('pos_green', require('../../assets/imgs/pos_green.png'));
    this.load.image('land-back', process.env.PUBLIC_URL + "imgs/ground.png");

    this.load.audio('ES_Change-AGST', process.env.PUBLIC_URL + '/musics/ES_Change-AGST.mp3');
    this.load.audio('ES_Leveled-AGST', process.env.PUBLIC_URL + '/musics/ES_Leveled-AGST.mp3');
    this.load.audio('ES_PressXTwice-Lexica', process.env.PUBLIC_URL + '/musics/ES_PressXTwice-Lexica.mp3');
    this.load.audio('ES_Riversides-Tape-Machines', process.env.PUBLIC_URL + '/musics/ES_Riversides-Tape-Machines.mp3');
    this.load.audio('ES_Furious-Squiid', process.env.PUBLIC_URL + '/musics/ES_Furious-Squiid.mp3');
    this.load.audio('ES_Hype', process.env.PUBLIC_URL + '/musics/ES_Hype.mp3');
    this.load.audio('ES_nevermind-dreem', process.env.PUBLIC_URL + '/musics/ES_nevermind-dreem.mp3');
    this.load.audio('ES_NightBus-Focality', process.env.PUBLIC_URL + '/musics/ES_NightBus-Focality.mp3');
    this.load.audio('ES_O.T.T-Ruzer', process.env.PUBLIC_URL + '/musics/ES_O.T.T-Ruzer.mp3');
    this.load.audio('ES_This Is How I Feel Inside - Ruzer', process.env.PUBLIC_URL + '/musics/ES_This Is How I Feel Inside - Ruzer.mp3');
  }

  async create() {
    this.input.mouse.disableContextMenu();
    console.log(this.sound, this.sfx);
    this.setDefaultMusic();
    this.socket.emit("getBuildingInfo");

    this.socket.on("setBuildingInfo", async (buildingInfo) => {
      this.buildingInfo = buildingInfo;
      store.dispatch(setBuildingImages(buildingInfo));
    });

    store.subscribe(async () => {
      if (this.sceneflag == 1) {
        const state = store.getState();

        // When click NFT
        if (state.nft.name != "") {
          let groundNumber = state.nft.name;
          this.cameraControl(groundNumber);
          store.dispatch(selectNFT(""));
        }

        if (state.nft.walletNftList !== null && state.playerinfo.data != null && this.successGetNftFlag == 0) {
          this.successGetNftFlag = 1;
          await this._setNFTData(state.playerinfo.data.accountId, state.nft.walletNftList);
          await this._getNFTData();
          await this.createPos();
          store.dispatch(setWalletNftList(null));
          store.dispatch(setLoading(true));
        }

        // View mode
        if (state.scene.scenename == 'view') {
          this.sceneflag = 0;
          this.scene.start('view', { Address: this.selectedAddress, pos: this.selectedPos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx, mapInitId: undefined });
        }

        // Construction mode
        else if (state.scene.scenename == 'construction') {
          this.sceneflag = 0;
          await store.dispatch(setBuildingState(btoa(this.selectedAddress), btoa(this.selectedPos), btoa(state.playerinfo.data.accountId)));
          this.scene.start('construction', { Address: this.selectedAddress, pos: this.selectedPos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx });
        }

        // Move to friend
        if (state.friends.moveToFriend != null) {
          let friendInfo = state.friends.moveToFriend;
          this.sceneflag = 0;

          store.dispatch(moveToFriend(null));
          store.dispatch(setSceneName("view"));

          let NFTID;
          for (let i = 0; i < this.NFTData.length; i++) {
            let nftdata = this.NFTData[i];
            var posID = 'pos_' + nftdata.name + '-' + nftdata.serial_number;
            let address = this.pos[posID].getData('address');
            let targetPos = this.pos[posID].getData('targetPos');
            if (address == friendInfo.address && targetPos == friendInfo.targetPos) {
              NFTID = i;
              break;
            }
          }

          store.dispatch(setTeleportData(this.NFTData[NFTID]));
          this.scene.start('view', { Address: friendInfo.address, pos: friendInfo.targetPos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx, mapInitId: undefined });
        }

        if (state.music.musicChanged == true) {
          let musicName = state.music.name;
          let mute = state.music.mute;
          let volume = state.music.volume;
          this.setMusic(musicName, mute, volume / 4000);
          localStorage.setItem('degenlandMusicName', musicName);
          store.dispatch(setMusicChanged(false));
        }

        if (state.music.volumeChanged == true) {
          let mute = state.music.mute;
          let volume = state.music.volume;
          console.log(mute, volume);
          this.setVolume(mute, volume / 4000);
          localStorage.setItem('degenlandMusicMute', mute);
          localStorage.setItem('degenlandMusicVolume', volume);
          store.dispatch(setVolumeChanged(false));
        }

        // Visit place
        if (state.scene.scenename != 'visit' && state.playerinfo.visitPlace != null) {
          store.dispatch(setSceneName("visit"));
          const _splitedData = state.playerinfo.visitPlace.split(':');

          const _address = _splitedData[0];
          const _pos = _splitedData[1];
          this.sceneflag = 0;

          let NFTID;
          for (let i = 0; i < this.NFTData.length; i++) {
            let nftdata = this.NFTData[i];
            var posID = 'pos_' + nftdata.name + '-' + nftdata.serial_number;
            let address = this.pos[posID].getData('address');
            let targetPos = this.pos[posID].getData('targetPos');
            if (address == _address && targetPos == _pos) {
              NFTID = i;
              break;
            }
          }

          store.dispatch(getPlaceInfo(this.NFTData[NFTID]));
          store.dispatch(setTeleportData(this.NFTData[NFTID]));
          this.scene.start('view', { Address: _address, pos: _pos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx, mapInitId: undefined });
        }
      }
    });
    this.cameras.main.setBounds(-15000, -1600, 32000, 21000);
    this.cameras.main.setZoom(0.1);
    this.cameras.main.centerOn(1500, 3000);

    this.setScreen();
    this.addEvents();
  }

  setDefaultMusic() {
    let musicName = "";
    let volume = 0;
    let mute = false;
    if (!localStorage.getItem('degenlandMusicName')) {
      musicName = "ES_nevermind-dreem";
      volume = 0.025;
      mute = false;
      localStorage.setItem('degenlandMusicName', musicName);
      localStorage.setItem('degenlandMusicMute', mute);
      localStorage.setItem('degenlandMusicVolume', volume * 4000);
    }
    else {
      musicName = localStorage.getItem('degenlandMusicName');
      volume = JSON.parse(localStorage.getItem('degenlandMusicVolume')) / 4000;
      mute = JSON.parse(localStorage.getItem('degenlandMusicMute'));
    }
    this.sfx = this.sound.add(musicName, { loop: true });
    this.sound.mute = mute;
    this.sound.volume = volume;
    this.sound.pauseOnBlur = false;
    this.sfx.play();
  }

  setMusic(musicName, mute, volume) {
    this.sfx.stop();
    this.sfx = this.sound.add(musicName, { loop: true });
    this.sound.mute = JSON.parse(mute);
    this.sound.volume = volume;
    this.sfx.play();
  }

  setVolume(mute, volume) {
    this.sound.mute = JSON.parse(mute);
    this.sound.volume = volume;
  }

  cameraControl(groundNumber) {
    this.cameras.main.pan(this.pos['pos_' + groundNumber].x, this.pos['pos_' + groundNumber].y, 1000);

    if (this.beforeGroundNumber != "") {
      this.pos['pos_' + this.beforeGroundNumber].setScale(0.1);
      this['avatar_' + this.beforeGroundNumber].setScale(this['avatar_' + this.beforeGroundNumber].getData('scalex'), this['avatar_' + this.beforeGroundNumber].getData('scaley'));
      this['avatar_' + this.beforeGroundNumber].y += 22.5;
      this['background_' + this.beforeGroundNumber].setScale(this['background_' + this.beforeGroundNumber].getData('scalex'), this['background_' + this.beforeGroundNumber].getData('scaley'));
      this['background_' + this.beforeGroundNumber].y += 22.5;
    }

    this.pos['pos_' + groundNumber].setScale(0.2);
    this['avatar_' + groundNumber].setScale(this['avatar_' + groundNumber].getData('scalex') * 2, this['avatar_' + groundNumber].getData('scaley') * 2);
    this['avatar_' + groundNumber].y -= 22.5;
    this['background_' + groundNumber].setScale(this['background_' + groundNumber].getData('scalex') * 2, this['background_' + groundNumber].getData('scaley') * 2);
    this['background_' + groundNumber].y -= 22.5;
    this.pos['pos_' + groundNumber].visible = true;
    this['avatar_' + groundNumber].visible = true;
    this['background_' + groundNumber].visible = true;
    this.beforeGroundNumber = groundNumber;
    this.cameras.main.zoomTo(0.8, 500);
  }

  async createPos() {
    const rate = [
      [1 / 5, 8 / 5],
      [9 / 10, 9 / 5],
      [1 / 2, 11 / 5],
      [-(3 / 5), 19 / 10],
      [-(9 / 20), 21 / 10],
      [-(1 / 4), 23 / 10],
      [1 / 10, 47 / 20],
      [3 / 10, 13 / 5],
      [-(1 / 8), 13 / 5],
      [1 / 10, 14 / 5]
    ];

    let placeData = [];

    for (let i = 0; i < this.NFTData.length; i++) {
      if (this.NFTData[i].token_id == env.DEGENLAND_NFT_ID) {
        let grandnum = 0;
        for (var j = 0; j < this.mapsizex; j++) {
          for (var k = 0; k < this.mapsizey; k++) {
            if (this.levelTotalMap.levelArr[j][k] == 0) {
              grandnum++;
              if (grandnum == this.NFTData[i].serial_number) {
                const postData = {
                  address: (j + 1) + '-' + (k + 1),
                  pos: '1',
                  nftInfo: this.NFTData[i]
                };
                placeData.push(postData);
                this.setPos('pos_red', rate[0][0], rate[0][1], '1', j, k, this.NFTData[i]);
              }
            }
          }
        }
      }
      else if (this.NFTData[i].token_id == env.TYCOON_NFT_ID) {
        let bignum = 0;
        for (var j = 0; j < this.mapsizex; j++) {
          for (var k = 0; k < this.mapsizey; k++) {
            if (this.levelTotalMap.levelArr[j][k] == 0) {
              bignum += 2;
              if (bignum == this.NFTData[i].serial_number || bignum - 1 == this.NFTData[i].serial_number) {
                if (this.NFTData[i].serial_number % 2 == 1) {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '2',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_green', rate[1][0], rate[1][1], '2', j, k, this.NFTData[i]);
                }
                else {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '3',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_green', rate[2][0], rate[2][1], '3', j, k, this.NFTData[i]);
                }
              }
            }
          }
        }
      }
      else if (this.NFTData[i].token_id == env.MOGUL_NFT_ID) {
        let mediumnum = 0;
        for (var j = 0; j < this.mapsizex; j++) {
          for (var k = 0; k < this.mapsizey; k++) {
            if (this.levelTotalMap.levelArr[j][k] == 0) {
              mediumnum += 3;
              if (mediumnum == this.NFTData[i].serial_number || mediumnum - 1 == this.NFTData[i].serial_number || mediumnum - 2 == this.NFTData[i].serial_number) {
                if (this.NFTData[i].serial_number % 3 == 1) {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '4',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_blue', rate[3][0], rate[3][1], '4', j, k, this.NFTData[i]);
                }
                else if (this.NFTData[i].serial_number % 3 == 2) {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '5',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_blue', rate[4][0], rate[4][1], '5', j, k, this.NFTData[i]);
                }
                else {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '6',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_blue', rate[5][0], rate[5][1], '6', j, k, this.NFTData[i]);
                }
              }
            }
          }
        }
      }
      else if (this.NFTData[i].token_id == env.INVESTOR_NFT_ID) {
        let smallnum = 0;
        for (var j = 0; j < this.mapsizex; j++) {
          for (var k = 0; k < this.mapsizey; k++) {
            if (this.levelTotalMap.levelArr[j][k] == 0) {
              smallnum += 4;
              if (smallnum == this.NFTData[i].serial_number || smallnum - 1 == this.NFTData[i].serial_number || smallnum - 2 == this.NFTData[i].serial_number || smallnum - 3 == this.NFTData[i].serial_number) {
                if (this.NFTData[i].serial_number % 4 == 1) {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '7',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_red', rate[6][0], rate[6][1], '7', j, k, this.NFTData[i]);
                }
                else if (this.NFTData[i].serial_number % 4 == 2) {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '8',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_red', rate[7][0], rate[7][1], '8', j, k, this.NFTData[i]);
                }
                else if (this.NFTData[i].serial_number % 4 == 3) {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '9',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_red', rate[8][0], rate[8][1], '9', j, k, this.NFTData[i]);
                }
                else {
                  const postData = {
                    address: (j + 1) + '-' + (k + 1),
                    pos: '10',
                    nftInfo: this.NFTData[i]
                  };
                  placeData.push(postData);
                  this.setPos('pos_red', rate[9][0], rate[9][1], '10', j, k, this.NFTData[i]);
                }
              }
            }
          }
        }
      }
    }
    for (let i = 0; i < placeData.length; i++) {
      let address = placeData[i].address.split('-');
      let j = address[0] - 1;
      let k = address[1] - 1;

      let mapID;
      if (j >= 0 && j < 10)
        mapID = 'map_' + '0' + j;
      else
        mapID = 'map_' + j;
      if (k >= 0 && k < 10)
        mapID += '0' + k;
      else
        mapID += k;
      this[mapID].alpha = 1;
    }

    await axios.post(env.SERVER_URL + "/api/place/set_place_info", { placeData: placeData });
  }

  setScreen() {
    var x;
    var y;
    var hx = 350;
    var hy = 292;

    var startX = 1000 + 133; //sidebar_width plus
    var startY = 100;
    var angle = 30 * Math.PI / 180;

    this.add.image(-15000, -1600, 'game_bg').setOrigin(0).setScale(25);
    this.add.image(-13100, -2000, 'land-back').setOrigin(0).setScale(4.1).rotation = -0.045;

    //set map
    for (var j = 0; j < this.mapsizex; j++) {
      if (j > 0) {
        startX = startX - hx * Math.cos(angle);
        startY = startY + hx / 2;
      }
      for (var i = 0; i < this.mapsizey; i++) {
        if (this.levelTotalMap.levelArr[j][i] == 0) {
          var mapID;
          x = startX + i * hy * Math.cos(angle);
          y = startY + i * hy * Math.sin(angle);

          if (j >= 0 && j < 10)
            mapID = 'map_' + '0' + j;
          else
            mapID = 'map_' + j;
          if (i >= 0 && i < 10)
            mapID += '0' + i;
          else
            mapID += i;
          this[mapID] = this.add.image(x, y, 'map').setOrigin(0);
          this[mapID].address = (j + 1) + '-' + (i + 1);
          this[mapID].alpha = 0.5;
        }
      }
    }
  }

  addEvents() {
    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {

      if (deltaY > 0) {
        var newZoom = this.cameras.main.zoom - 0.05;
        if (newZoom >= 0.09) {
          this.cameras.main.zoom = newZoom;
        }
      }

      if (deltaY < 0) {
        var newZoom = this.cameras.main.zoom + 0.05;
        if (newZoom < 1.3) {
          this.cameras.main.zoom = newZoom;
        }
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;

      this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
      this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
    });
  }

  setPos(pos_type, ratex, ratey, pos_size, j, i, nftdata) {
    var h = 292;
    var angle = 30 * Math.PI / 180;

    var mapID;

    if (j >= 0 && j < 10)
      mapID = 'map_' + '0' + j;
    else
      mapID = 'map_' + j;
    if (i >= 0 && i < 10)
      mapID += '0' + i;
    else
      mapID += i;

    //set pos
    var unitx = h * Math.cos(angle);
    var unity = h * Math.sin(angle);
    var defaultx = this[mapID].x + this[mapID].width / 2 - 50;
    var defaulty = this[mapID].y - this[mapID].height / 2 + 50;

    //avatar
    var avatarID = 'avatar_' + nftdata.name + '-' + nftdata.serial_number;
    var backgroundID = 'background_' + nftdata.name + '-' + nftdata.serial_number;

    this[backgroundID] = this.add.image(defaultx + unitx * ratex, defaulty + unity * ratey - 25, 'pos_background').setOrigin(0.5, 1);
    this[avatarID] = this.add.image(defaultx + unitx * ratex, defaulty + unity * ratey - 25, 'avatar_' + nftdata.owner).setOrigin(0.5, 1);

    //avatar background scale controll
    let scalex = 22.5 / this[backgroundID].width;
    let scaley = 22.5 / this[backgroundID].height;

    this[backgroundID].setScale(scalex, scaley);
    this[backgroundID].setData('scalex', scalex);
    this[backgroundID].setData('scaley', scaley);
    this[backgroundID].visible = false;

    //avatar scale controll
    scalex = 22.5 / this[avatarID].width;
    scaley = 22.5 / this[avatarID].height;

    this[avatarID].setScale(scalex, scaley);
    this[avatarID].setData('scalex', scalex);
    this[avatarID].setData('scaley', scaley);
    this[avatarID].visible = false;

    //pos
    var posID = 'pos_' + nftdata.name + '-' + nftdata.serial_number;
    this.pos[posID] = this.add.image(defaultx + unitx * ratex, defaulty + unity * ratey, pos_type).setOrigin(0.5, 1).setScale(0.1);
    this.pos[posID].visible = false;
    this.pos[posID].setInteractive({ useHandCursor: true });
    this.pos[posID].setData('address', (j + 1) + '-' + (i + 1));
    this.pos[posID].setData('targetPos', pos_size);

    let posDetail = {
      posID: 'pos_' + nftdata.name + '-' + nftdata.serial_number,
      address: (j + 1) + '-' + (i + 1),
      targetPos: pos_size
    };

    this.posInfo.push(posDetail);

    var pointedflag = 0;
    this.pos[posID].on('pointermove', (pointer) => {
      if (pointer.isDown) {
        pointedflag = 1;
      }
    }, this);

    this.pos[posID].on('pointerup', async (pointer) => {
      if (pointedflag != 1) {
        pointedflag = 0;

        this.cameraControl(nftdata.name + "-" + nftdata.serial_number);

        this.selectedAddress = (j + 1) + '-' + (i + 1);
        this.selectedPos = pos_size;

        let NFTData = {
          token_id: nftdata.token_id,
          serial_number: nftdata.serial_number,
          owner: nftdata.owner
        }

        store.dispatch(getPlaceInfo(NFTData));
        store.dispatch(handlePlaceDetailDialog(true));
      }
      pointedflag = 0;
    }, this);
  }

  update() {
    //grandpos
    if (this.cameras.main.zoom > 0.28 && this.cameras.main.zoom <= 0.38 && this.grandflag == 0) {
      for (let i = 0; i < this.NFTData.length; i++) {
        if (this.NFTData[i].token_id == env.DEGENLAND_NFT_ID) {
          this.pos['pos_Degen-' + this.NFTData[i].serial_number].visible = true;
          this['avatar_Degen-' + this.NFTData[i].serial_number].visible = true;
          this['background_Degen-' + this.NFTData[i].serial_number].visible = true;
        }
      }
      this.grandflag = 1;
    }
    else if (this.cameras.main.zoom <= 0.28 && this.grandflag == 1) {
      for (let i = 0; i < this.NFTData.length; i++) {
        if (this.NFTData[i].token_id == env.DEGENLAND_NFT_ID) {
          this.pos['pos_Degen-' + this.NFTData[i].serial_number].visible = false;
          this['avatar_Degen-' + this.NFTData[i].serial_number].visible = false;
          this['background_Degen-' + this.NFTData[i].serial_number].visible = false;
        }
      }
      this.grandflag = 0;
    }

    //bigpos
    if (this.cameras.main.zoom > 0.38 && this.cameras.main.zoom <= 0.48 && this.bigflag == 0) {
      for (let i = 0; i < this.NFTData.length; i++) {
        if (this.NFTData[i].token_id == env.TYCOON_NFT_ID) {
          this.pos['pos_Tycoon-' + this.NFTData[i].serial_number].visible = true;
          this['avatar_Tycoon-' + this.NFTData[i].serial_number].visible = true;
          this['background_Tycoon-' + this.NFTData[i].serial_number].visible = true;
        }
      }
      this.bigflag = 1;
    }
    else if (this.cameras.main.zoom <= 0.38 && this.bigflag == 1) {
      for (let i = 0; i < this.NFTData.length; i++) {
        if (this.NFTData[i].token_id == env.TYCOON_NFT_ID) {
          this.pos['pos_Tycoon-' + this.NFTData[i].serial_number].visible = false;
          this['avatar_Tycoon-' + this.NFTData[i].serial_number].visible = false;
          this['background_Tycoon-' + this.NFTData[i].serial_number].visible = false;
        }
      }
      this.bigflag = 0;
    }

    //mediumpos
    if (this.cameras.main.zoom > 0.48 && this.cameras.main.zoom <= 0.58 && this.mediumflag == 0) {
      for (let i = 0; i < this.NFTData.length; i++) {
        if (this.NFTData[i].token_id == env.MOGUL_NFT_ID) {
          this.pos['pos_Mogul-' + this.NFTData[i].serial_number].visible = true;
          this['avatar_Mogul-' + this.NFTData[i].serial_number].visible = true;
          this['background_Mogul-' + this.NFTData[i].serial_number].visible = true;
        }
      }
      this.mediumflag = 1;
    }
    else if (this.cameras.main.zoom <= 0.48 && this.mediumflag == 1) {
      for (let i = 0; i < this.NFTData.length; i++) {
        if (this.NFTData[i].token_id == env.MOGUL_NFT_ID) {
          this.pos['pos_Mogul-' + this.NFTData[i].serial_number].visible = false;
          this['avatar_Mogul-' + this.NFTData[i].serial_number].visible = false;
          this['background_Mogul-' + this.NFTData[i].serial_number].visible = false;
        }
      }
      this.mediumflag = 0;
    }

    //smallpos
    if (this.cameras.main.zoom > 0.68 && this.cameras.main.zoom <= 0.78 && this.smallflag == 0) {
      for (let i = 0; i < this.NFTData.length; i++) {
        if (this.NFTData[i].token_id == env.INVESTOR_NFT_ID) {
          this.pos['pos_Investor-' + this.NFTData[i].serial_number].visible = true;
          this['avatar_Investor-' + this.NFTData[i].serial_number].visible = true;
          this['background_Investor-' + this.NFTData[i].serial_number].visible = true;
        }
      }
      this.smallflag = 1;
    }
    else if (this.cameras.main.zoom <= 0.68 && this.smallflag == 1) {
      for (let i = 0; i < this.NFTData.length; i++) {
        if (this.NFTData[i].token_id == env.INVESTOR_NFT_ID) {
          this.pos['pos_Investor-' + this.NFTData[i].serial_number].visible = false;
          this['avatar_Investor-' + this.NFTData[i].serial_number].visible = false;
          this['background_Investor-' + this.NFTData[i].serial_number].visible = false;
        }
      }
      this.smallflag = 0;
    }
  }
}/*class*/

export default Map;