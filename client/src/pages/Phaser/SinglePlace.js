import Phaser from 'phaser';

import LevelData from "./objects/level-data";
import Methods from "./objects/methods";
import TilesManager from "./objects/tiles-manager";
import Anim from "./objects/anims";
import Building from "./objects/sprites/building";

import store from "../../store";

//action
import { setSceneName } from '../../actions/scene';
import { setBuilding, setRoad, setGround, setObject, setHouseInfo } from '../../actions/construction';
import { getPlaceInfo, updatePlaceInfo, setTeleportData } from '../../actions/placeinfo';
import { calculateLevel } from '../../actions/playerinfo';
import { moveToFriend } from '../../actions/friends';
import { setMusicChanged, setVolumeChanged } from "../../actions/music";
import { clearAds } from "../../actions/buildinginfo";

import * as env from "../../env";

class SinglePlace extends Phaser.Scene {

  constructor() {
    super({ key: "construction" });
  }
  init(data) {
    this.mapsizex = 18;
    this.mapsizey = 20;
    this.defaultWidth = 1770;
    this.defaultHeight = 969;
    this.targetPos = data.pos;
    this.Address = data.Address;
    this.socket = data.socket;
    this.buildingInfo = data.buildingInfo;
    this.NFTData = data.NFTData;
    this.sfx = data.sfx;

    this.buildingArray = [];

    this.cX = this.game.config.width * 0.5;
    this.cY = this.game.config.height * 0.5;
    this.gW = this.game.config.width;
    this.gH = this.game.config.height;

    this.zoomX = this.cX;
    this.zoomY = this.cY;

    this.tileWidth = 128;
    this.tileHeight = 73;

    this.levelData = new LevelData();
    this.methods = new Methods(this);
    //    this.landsMngr = new LandsManager(this);
    new Anim(this);

    this.tilesArr = [];
    this.posArr = [];
    this.buildingsArr = [];
    this.pointerflag = false;

    this.zoomValue = 1;

    this.isBuildingSelected = false;
    this.isGroundSelected = false;
    this.isRoadSelected = false;
    this.isObjectSelected = false;

    this.currentRoad = undefined;
    this.currentGround = undefined;
    this.currentTile = undefined;

    this.mapTweenFlag = false;


    this.screenDragged = false;
    this.yArr = [80, 240, 440];
    this.beforeGroundNumber = "";

    this.tilesGroup = this.add.group();
    this.buildingGroup = this.add.group();
    this.timeLabelGroup = this.add.group();

    //mesh data
    this.meshData = undefined;
    this.buildingData = [];

    //flag
    this.swalflag = 0;
    this.tilePointedFlag = 0;
    this.openswal = true;
    this.clickedpanel = false;
    this.clickedcontrol = false;

    // building count
    this.groundcount = 0;
    this.roadcount = 0;
    this.buildingcount = 0;
    this.objectcount = 0;

    this.isdouble = false;

    //game mode
    this.mode = 'construction';

    this.tileInfo = [
      [6, 6],
      [3, 15],
      [8, 15],
      [15, 3],
      [15, 7],
      [15, 11],
      [13, 14],
      [13, 18],
      [16, 14],
      [16, 18]
    ];

    this.tilesMngr = new TilesManager(this, this.targetPos);
  }
  preload() {
    this.load.image('ads_add', process.env.PUBLIC_URL + "imgs/control/add.png");
    this.load.image('destroy', process.env.PUBLIC_URL + "imgs/control/destroy.png");
    this.load.image('enter', process.env.PUBLIC_URL + "imgs/control/enter.png");
    this.load.image('ground-0', process.env.PUBLIC_URL + "imgs/ground/g(0).png");
    this.load.image('ground-1', process.env.PUBLIC_URL + "imgs/ground/g(1).png");
    this.load.image('advertisement-background', process.env.PUBLIC_URL + "imgs/building/billizard-default.png");
    for (var i = 1; i <= 21; i++)
      this.load.image('building-' + i, process.env.PUBLIC_URL + "imgs/building/b (" + i + ").png");
    for (var i = 1; i <= 22; i++)
      this.load.image('road-' + i, process.env.PUBLIC_URL + "imgs/road/r (" + i + ").png");
    for (var i = 1; i <= 10; i++)
      this.load.image('object-' + i, process.env.PUBLIC_URL + "imgs/object/object" + i + ".png");
  }

  createControlBtn() {
    this.adsAddBtn = this.add.sprite(0, 0, 'ads_add').setScale(0.3).setOrigin(0.5, 0);
    this.destroyBtn = this.add.sprite(0, 0, 'destroy').setScale(0.3).setOrigin(0.5, 0);
    this.linkBtn = this.add.sprite(0, 0, 'ads_add').setScale(0.3).setOrigin(0.5, 0);
    this.counterBtn = this.add.sprite(0, 0, 'destroy').setScale(0.3).setOrigin(0.5, 0);
    this.enterBtn = this.add.sprite(0, 0, 'enter').setScale(0.3).setOrigin(0.5, 0);
    this.adsAddBtn.visible = false;
    this.destroyBtn.visible = false;
    this.linkBtn.visible = false;
    this.counterBtn.visible = false;
    this.enterBtn.visible = false;
  }

  setMaskSetting() {
    this.shape = this.make.graphics().fillStyle(0xffffff).fillRect(0, 0, 200, 200);
    const mask = this.shape.createGeometryMask();
    this.adsAddBtn.setMask(mask);
  }

  _getStartTileID(posx, posy) {
    if (posx < 10)
      posx = '0' + posx;
    if (posy < 10)
      posy = '0' + posy;
    let tileID = 'tile_' + posx + posy;
    return tileID;
  }

  _setInteractive(target, bulType) {
    let shape;
    if (this.buildingInfo[bulType].type == 'building') {
      if (this.buildingInfo[bulType].size == '9*11')
        shape = new Phaser.Geom.Polygon([
          335, 535,
          330, 1035,
          970, 1400,
          1335, 1410,
          2240, 890,
          2230, 880,
          1585, 0,
          1255, 0
        ]);

      else if (this.buildingInfo[bulType].size == '7*8')
        shape = new Phaser.Geom.Polygon([
          145, 290,
          140, 865,
          865, 1285,
          1755, 770,
          1755, 565,
          945, 100,
          885, 130,
          670, 0
        ]);
      else if (this.buildingInfo[bulType].size == '7*7') {
        if (this.buildingInfo[bulType].name == 'Night Club')
          shape = new Phaser.Geom.Polygon([
            75, 485,
            70, 1000,
            890, 1470,
            1695, 1005,
            1695, 475,
            880, 0
          ]);
        else if (this.buildingInfo[bulType].name == 'Casino')
          shape = new Phaser.Geom.Polygon([
            890, 0,
            155, 880,
            900, 1310,
            1640, 870
          ]);
      }
      else if (this.buildingInfo[bulType].size == '4*4') {
        if (this.buildingInfo[bulType].index == 22)
          shape = new Phaser.Geom.Polygon([
            175, 395,
            175, 1085,
            510, 1275,
            840, 1075,
            840, 375,
            510, 170
          ]);
        else if (this.buildingInfo[bulType].index == 23)
          shape = new Phaser.Geom.Polygon([
            180, 370,
            210, 490,
            115, 475,
            120, 790,
            500, 1030,
            815, 850,
            900, 440,
            485, 195
          ]);
        else if (this.buildingInfo[bulType].index == 25)
          shape = new Phaser.Geom.Polygon([
            300, 170,
            295, 380,
            195, 415,
            190, 710,
            105, 765,
            100, 1600,
            505, 1830,
            910, 1595,
            930, 745,
            820, 675,
            825, 430,
            710, 385,
            715, 175,
            510, 75
          ]);
        // Mansion
        else if (this.buildingInfo[bulType].index == 29) {
          shape = new Phaser.Geom.Polygon([
            450, 0,
            65, 240,
            65, 395,
            150, 465,
            365, 585,
            640, 620,
            900, 470,
            920, 395,
            920, 240
          ]);
        }
      }
      // Medium house
      else if (this.buildingInfo[bulType].size == '3*3') {
        shape = new Phaser.Geom.Polygon([
          530, 0,
          395, 60,
          80, 240,
          100, 310,
          410, 485,
          690, 330,
          705, 275
        ]);
      }
      else if (this.buildingInfo[bulType].size == '2*2') {
        if (this.buildingInfo[bulType].index == 14)
          shape = new Phaser.Geom.Polygon([
            145, 75,
            145, 215,
            135, 246,
            135, 535,
            186, 558,
            240, 540,
            297, 568,
            423, 495,
            423, 85,
            270, 0
          ]);
        else if (this.buildingInfo[bulType].index == 15)
          shape = new Phaser.Geom.Polygon([
            145, 75,
            145, 215,
            135, 246,
            135, 535,
            186, 558,
            240, 540,
            297, 568,
            423, 495,
            423, 85,
            270, 0
          ]);
        else if (this.buildingInfo[bulType].index == 16)
          shape = new Phaser.Geom.Polygon([
            172, 87,
            172, 240,
            100, 280,
            100, 520,
            270, 620,
            415, 535,
            415, 120,
            440, 105,
            440, 70,
            320, 0
          ]);
        else if (this.buildingInfo[bulType].index == 17)
          shape = new Phaser.Geom.Polygon([
            95, 115,
            95, 200,
            72, 210,
            72, 265,
            95, 280,
            95, 410,
            285, 510,
            410, 440,
            410, 75,
            280, 0
          ]);
        else if (this.buildingInfo[bulType].index == 18)
          shape = new Phaser.Geom.Polygon([
            65, 55,
            65, 785,
            255, 885,
            425, 785,
            425, 155,
            375, 85,
            225, 0,
            155, 0
          ]);
        // Coffee
        else if (this.buildingInfo[bulType].index == 19)
          shape = new Phaser.Geom.Polygon([
            150, 70,
            10, 310,
            30, 390,
            95, 470,
            30, 510,
            35, 560,
            90, 590,
            90, 710,
            265, 810,
            460, 695,
            455, 415,
            500, 385,
            455, 240,
            475, 135,
            405, 25,
            260, 0
          ]);
        // Small house
        else if (this.buildingInfo[bulType].index == 20)
          shape = new Phaser.Geom.Polygon([
            92, 82,
            92, 206,
            151, 242,
            293, 157,
            293, 35,
            232, 0
          ]);
      }
      else if (this.buildingInfo[bulType].size == '2*1') {
        shape = new Phaser.Geom.Polygon([
          94, 35,
          94, 157,
          233, 241,
          292, 206,
          292, 82,
          153, 0
        ]);
      }
      else if (this.buildingInfo[bulType].size == '1*2') {
        if (this.buildingInfo[bulType].name == 'Billboard') {
          shape = new Phaser.Geom.Polygon([
            355, 0,
            5, 175,
            5, 380,
            175, 310,
            175, 430,
            95, 475,
            150, 515,
            285, 450,
            220, 410,
            200, 420,
            200, 290,
            370, 210,
            370, 5
          ]);
        }
        else if (this.buildingInfo[bulType].index == 12) {
          shape = new Phaser.Geom.Polygon([
            92, 82,
            92, 206,
            151, 242,
            293, 157,
            293, 35,
            232, 0
          ]);
        }
      }
      else if (this.buildingInfo[bulType].size == '1*1') {
        shape = new Phaser.Geom.Polygon([
          0, 73,
          128, 146,
          256, 73,
          128, 0
        ]);
      }
    }
    else if (this.buildingInfo[bulType].type == 'object') {
      if (this.buildingInfo[bulType].index == 31) {
        shape = new Phaser.Geom.Polygon([
          65, 30,
          75, 135,
          175, 130,
          200, 50,
          135, 0
        ]);
      }

      else if (this.buildingInfo[bulType].index == 32) {
        shape = new Phaser.Geom.Polygon([
          65, 0,
          10, 105,
          100, 180,
          110, 285,
          165, 385,
          185, 375,
          120, 225,
          210, 160,
          250, 80
        ]);
      }

      else if (this.buildingInfo[bulType].index == 33) {
        shape = new Phaser.Geom.Polygon([
          125, 0,
          20, 60,
          10, 130,
          20, 215,
          100, 280,
          130, 280,
          120, 180,
          240, 150,
          245, 55,
          220, 20
        ]);
      }

      else if (this.buildingInfo[bulType].index == 34) {
        shape = new Phaser.Geom.Polygon([
          120, 0,
          10, 105,
          105, 215,
          110, 330,
          150, 330,
          150, 220,
          235, 110
        ]);
      }

      else if (this.buildingInfo[bulType].index == 35) {
        shape = new Phaser.Geom.Polygon([
          55, 65,
          55, 155,
          95, 175,
          210, 110,
          205, 55,
          175, 40,
          170, 0
        ]);
      }

      else if (this.buildingInfo[bulType].index == 36) {
        shape = new Phaser.Geom.Polygon([
          90, 0,
          85, 35,
          45, 60,
          50, 110,
          160, 180,
          200, 155,
          200, 60
        ]);
      }

      else if (this.buildingInfo[bulType].index == 37) {
        shape = new Phaser.Geom.Polygon([
          55, 65,
          55, 155,
          95, 175,
          210, 110,
          205, 55,
          175, 40,
          170, 0
        ]);
      }

      else if (this.buildingInfo[bulType].index == 38) {
        shape = new Phaser.Geom.Polygon([
          90, 0,
          85, 35,
          45, 60,
          50, 110,
          160, 180,
          200, 155,
          200, 60
        ]);
      }

      else if (this.buildingInfo[bulType].index == 39) {
        shape = new Phaser.Geom.Polygon([
          200, 75,
          65, 225,
          105, 250,
          325, 130,
          295, 30,
          220, 0
        ]);
      }

      else if (this.buildingInfo[bulType].index == 40) {
        shape = new Phaser.Geom.Polygon([
          155, 0,
          80, 45,
          60, 130,
          280, 250,
          315, 225,
          265, 65
        ]);
      }
    }

    if (this.mode == 'construction')
      target.setInteractive(shape, Phaser.Geom.Polygon.Contains);
  }

  create() {
    this.input.mouse.disableContextMenu();
    // Get building count
    this._getBuildingCount();

    this.createControlBtn();
    this.setCamera();
    this.tilesMngr.addTiles(this.Address);
    this.setKey();
    this.setScreen();
    this.setMaskSetting();
    this.addEvents();

    let tileID = this._getStartTileID(this.tileInfo[this.targetPos - 1][0], this.tileInfo[this.targetPos - 1][1]);

    this.socket.emit("join", 'construction', this.Address, this.targetPos, this[tileID].x, this[tileID].y - 25);

    this.socket.on("mapInit", async (buildingList) => {
      await this._setDepth(buildingList, "init");
      await this._buildingPlacement(buildingList);
    });

    this.socket.on("changeMap", async (newBuilding) => {
      await this._setDepth(newBuilding, "new");
      this._changeMap(newBuilding);
    });

    /**
     * Get construction time in 1 second intervals
     */
    this.socket.on("in-buildingTime", async (building) => {
      //Time remaining in seconds
      var timeRemaining = building.remaintime;
      //Convert seconds into minutes and seconds
      var minutes = Math.floor(timeRemaining / 60);
      var seconds = Math.floor(timeRemaining) - (60 * minutes);
      //Display minutes, add a 0 to the start if less than 10
      var result = (minutes < 10) ? "0" + minutes : minutes;
      //Display seconds, add a 0 to the start if less than 10
      result += (seconds < 10) ? ":0" + seconds : ":" + seconds;
      for (let i = 0; i < this.timeLabelGroup.children.entries.length; i++) {
        if (building.sno == this.timeLabelGroup.children.entries[i].getData('sno'))
          this.timeLabelGroup.children.entries[i].text = result;
      }
    });

    /**
     * building Completion
     */
    this.socket.on("in-buildingCompletion", (building) => {
      for (let i = 0; i < this.timeLabelGroup.children.entries.length; i++) {
        if (building.sno == this.timeLabelGroup.children.entries[i].getData('sno'))
          this.timeLabelGroup.children.entries[i].destroy();
      }

      for (let i = 0; i < this.buildingGroup.children.entries.length; i++) {
        if (building.sno == this.buildingGroup.children.entries[i].sno)
          this.buildingGroup.children.entries[i].alpha = 1;
      }
    });

    /**
     * Complete building
     */
    this.socket.on("buildingCompletion", (building) => {
      for (let i = 0; i < this.timeLabelGroup.children.entries.length; i++) {
        if (building.sno == this.timeLabelGroup.children.entries[i].getData('sno'))
          this.timeLabelGroup.children.entries[i].destroy();
      }

      for (let i = 0; i < this.buildingGroup.children.entries.length; i++) {
        if (building.sno == this.buildingGroup.children.entries[i].sno) {
          //          this.counterBtn.visible = false;
          this.buildingGroup.children.entries[i].alpha = 1;
          this.buildingGroup.children.entries[i].sno = building.sno;
          this.buildingGroup.children.entries[i].id = building._id;
          this.buildingGroup.children.entries[i].sizex = building.sizex;
          this.buildingGroup.children.entries[i].sizey = building.sizey;
          this.buildingGroup.children.entries[i].name = building.name;
          this._setInteractive(this.buildingGroup.children.entries[i], this.buildingGroup.children.entries[i].buildingType);
        }
      }
    });

    /**
     * Complete building
     */
    this.socket.on("updateInfo", () => {
      // Update place info
      this._updateInfo();
    });

    /**
     * Destroy building
     */
    this.socket.on("building_destroy", (sno) => {
      for (let i = 0; i < this.buildingGroup.children.entries.length; i++) {
        if (this.buildingGroup.children.entries[i].sno == sno) {
          if (this.adsAddBtn.sno == sno && this.destroyBtn.sno == sno) {
            this.adsAddBtn.visible = false;
            this.destroyBtn.visible = false;
            this.enterBtn.visible = false;
          }
          this._setGrid(this.buildingGroup.children.entries[i], this.buildingGroup.children.entries[i].buildingType);
          this.buildingGroup.children.entries[i].destroy();
        }
      }
    });

    store.subscribe(() => {
      if (this.scene.key == "construction") {
        const state = store.getState();

        if (state.construction.road != -1) {
          if (this.currentBuilding != undefined)
            this.currentBuilding.destroy();
          this.clickedpanel = true;
          var roadBuilding = state.construction.road;

          var roadBtn = this.add.sprite(0, 0, 'road-' + roadBuilding);

          roadBtn.type = 'road';
          roadBtn.buildingType = roadBuilding;
          roadBtn.name = '';
          roadBtn.alpha = 0.5;

          this.addBuilding(roadBtn);
          roadBtn.destroy();
          for (let i = 0; i < this.buildingGroup.children.entries.length; i++)
            this.buildingGroup.children.entries[i].disableInteractive();
          store.dispatch(setRoad(-1));
        }

        if (state.construction.ground != -1) {
          if (this.currentBuilding != undefined)
            this.currentBuilding.destroy();
          this.clickedpanel = true;
          var selected_ground = state.construction.ground;
          var groundBtn = this.add.sprite(0, 0, 'ground-' + selected_ground);

          groundBtn.type = 'ground';
          groundBtn.buildingType = selected_ground;
          groundBtn.name = '';
          groundBtn.alpha = 0.5;

          this.addBuilding(groundBtn);
          groundBtn.destroy();
          for (let i = 0; i < this.buildingGroup.children.entries.length; i++)
            this.buildingGroup.children.entries[i].disableInteractive();
          store.dispatch(setGround(-1));
        }

        if (state.construction.building != -1) {
          if (this.currentBuilding != undefined)
            this.currentBuilding.destroy();
          this.clickedpanel = true;
          var selected_building = state.construction.building;

          var buildingBtn = this.add.sprite(0, 0, 'building-' + selected_building);

          buildingBtn.type = 'building';
          buildingBtn.buildingType = selected_building;
          buildingBtn.name = this.buildingInfo[this.groundcount + this.roadcount + selected_building - 1].name;
          buildingBtn.alpha = 0.5;

          this.addBuilding(buildingBtn);
          buildingBtn.destroy();
          for (let i = 0; i < this.buildingGroup.children.entries.length; i++)
            this.buildingGroup.children.entries[i].disableInteractive();
          store.dispatch(setBuilding(-1));
        }

        if (state.construction.object != -1) {
          if (this.currentBuilding != undefined)
            this.currentBuilding.destroy();
          this.clickedpanel = true;
          var selected_building = state.construction.object;

          var buildingBtn = this.add.sprite(0, 0, 'object-' + selected_building);

          buildingBtn.type = 'object';
          buildingBtn.buildingType = selected_building;
          buildingBtn.name = '';
          buildingBtn.alpha = 0.5;

          this.addBuilding(buildingBtn);
          buildingBtn.destroy();
          for (let i = 0; i < this.buildingGroup.children.entries.length; i++)
            this.buildingGroup.children.entries[i].disableInteractive();
          store.dispatch(setObject(-1));
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
          this.setVolume(mute, volume / 4000);
          localStorage.setItem('degenlandMusicMute', mute);
          localStorage.setItem('degenlandMusicVolume', volume);
          store.dispatch(setVolumeChanged(false));
        }

        // Move to friend
        if (state.friends.moveToFriend != null) {
          let friendInfo = state.friends.moveToFriend;
          store.dispatch(moveToFriend(null));
          store.dispatch(setSceneName("view"));

          let NFTID;
          this.parentScene = this.scene.get('map');
          const posInfo = this.parentScene.posInfo;
          for (let i = 0; i < this.NFTData.length; i++) {
            let nftdata = this.NFTData[i];
            var posID = 'pos_' + nftdata.name + '-' + nftdata.serial_number;
            let address;
            let targetPos;
            for (let j = 0; j < posInfo.length; j++) {
              if (posInfo[j].posID == posID) {
                address = posInfo[j].address;
                targetPos = posInfo[j].targetPos;
              }
            }
            if (address == friendInfo.address && targetPos == friendInfo.targetPos) {
              NFTID = i;
              break;
            }
          }
          store.dispatch(setTeleportData(this.NFTData[NFTID]));
          this.scene.start('view', { Address: friendInfo.address, pos: friendInfo.targetPos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx, mapInitId: undefined });
        }

        // Visit place
        if (state.playerinfo.visitPlace != null) {
          const _splitedData = state.playerinfo.visitPlace.split(':');

          const _address = _splitedData[0];
          const _pos = _splitedData[1];
          this.sceneflag = 0;

          let NFTID;
          this.parentScene = this.scene.get('map');
          const posInfo = this.parentScene.posInfo;
          for (let i = 0; i < this.NFTData.length; i++) {
            let nftdata = this.NFTData[i];
            var posID = 'pos_' + nftdata.name + '-' + nftdata.serial_number;
            let address;
            let targetPos;
            for (let j = 0; j < posInfo.length; j++) {
              if (posInfo[j].posID == posID) {
                address = posInfo[j].address;
                targetPos = posInfo[j].targetPos;
              }
            }
            if (address == _address && targetPos == _pos) {
              NFTID = i;
              break;
            }
          }

          store.dispatch(setTeleportData(this.NFTData[NFTID]));
          this.scene.start('view', { Address: _address, pos: _pos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx, mapInitId: undefined });
        }

        // Visit place
        if (state.buildinginfo.ads != null) {
          store.dispatch(clearAds());
          this.meshData = state.buildinginfo.ads;

          if (this.meshData.mimetype.includes('video')) {
            this.load.on('filecomplete-video-advertisement_' + this.meshData.id, this.loadAdvertisement, this);
            this.load.video('advertisement_' + this.meshData.id, env.SERVER_URL + this.meshData.name, 'loadeddata', false, true);
          }
          else if (this.meshData.mimetype.includes('image')) {
            this.load.on('filecomplete-image-advertisement_' + this.meshData.id, this.loadAdvertisement, this);
            this.load.image('advertisement_' + this.meshData.id, env.SERVER_URL + this.meshData.name);
          }
          this.load.start();
        }
      }
    })
  }

  loadAdvertisement(key) {
    let vid = undefined;
    let vTex = undefined;

    if (this.meshData.mimetype.includes('video')) {
      vid = this.make.video({
        add: false,
        key: key
      });
      vTex = vid.texture;
    }
    else if (this.meshData.mimetype.includes('image')) {
      vid = this.make.image({
        add: false,
        key: key
      });
      vTex = vid.texture;
    }

    const vertices = [
      -0.5, -0.5,
      0.29, 0.29,
      -0.5, -1.3,
      0.29, -0.6
    ];

    const uvs = [
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ];

    const indicies = [
      0, 2,
      1, 2,
      3, 1
    ];

    // get position
    for (let i = 0; i < this.buildingGroup.children.entries.length; i++) {
      if (this.buildingGroup.children.entries[i].sno == this.meshData.billboardInfo.sno) {
        let posx = Math.floor(this.meshData.billboardInfo.sno / this.mapsizey);
        let posy = this.meshData.billboardInfo.sno % this.mapsizey;
        let tileID = this._getTileID(posx, posy);

        for (let j = 0; j < this.buildingArray.length; j++) {
          if (this.buildingArray[j].buildingInfo.sno == this.buildingGroup.children.entries[i].sno)
            this.buildingGroup.children.entries[i].depthValue = this.buildingArray[j].depth;
        }
        //advertisement background
        this.buildingGroup.children.entries[i].advertisement_background = this.add.mesh(this[tileID].x + this.tileWidth / 2 - 5, this[tileID].y - 3 * this.tileHeight - 5, 'advertisement-background').setDepth(this.buildingGroup.children.entries[i].depthValue - 1);
        this.buildingGroup.children.entries[i].advertisement_background.setScale(this.defaultWidth / this.game.config.width, this.defaultHeight / this.game.config.height);
        this.buildingGroup.children.entries[i].advertisement_background.setPerspective(1, 1, 100);
        this.buildingGroup.children.entries[i].advertisement_background.addVertices(vertices, uvs, indicies);
        this.buildingGroup.children.entries[i].advertisement_background.panZ(7);

        //advertisement
        this.buildingGroup.children.entries[i].advertisement = this.add.mesh(this[tileID].x + this.tileWidth / 2 - 5, this[tileID].y - 3 * this.tileHeight - 5, vTex).setDepth(this.buildingGroup.children.entries[i].depthValue - 1);
        this.buildingGroup.children.entries[i].advertisement.setScale(this.defaultWidth / this.game.config.width, this.defaultHeight / this.game.config.height);
        this.buildingGroup.children.entries[i].advertisement.setPerspective(1, 1, 100);
        this.buildingGroup.children.entries[i].advertisement.addVertices(vertices, uvs, indicies);
        this.buildingGroup.children.entries[i].advertisement.panZ(7);

        if (this.meshData.mimetype.includes('video'))
          vid.play(true);
        this.UICam.ignore(this.buildingGroup.children.entries[i].advertisement);
      }
    }
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

  _updateInfo() {
    // Update place info
    store.dispatch(updatePlaceInfo(this.Address, this.targetPos));
    // Calculate player level
    store.dispatch(calculateLevel(store.getState().playerinfo.data.accountId));
  }

  _convertID(sno) {
    var ID = "tile_";
    var i = Math.floor(sno / this.mapsizey);
    var j = sno % this.mapsizey;
    if (i >= 0 && i < 10)
      ID += '0' + i.toString();
    else
      ID += i.toString();
    if (j >= 0 && j < 10)
      ID += '0' + j.toString();
    else
      ID += j.toString();
    return ID;
  }

  /**
   * Set Grid when building destroyed
   * Otherplayer
   */
  _setGrid(building, bulType) {
    let ID1 = this._convertID(building.sno);
    // Set tile's isempty attribute
    this[ID1].isEmpty = true;
    this[ID1].currentBuildingType = 0;
    this[ID1].type = 0;
    if (this.buildingInfo[bulType].size == '2*2') {
      let ID2 = this._convertID(building.sno - 1);
      let ID3 = this._convertID(building.sno - this.mapsizey);
      let ID4 = this._convertID(building.sno - this.mapsizey - 1);

      this[ID2].currentBuildingType = 0;
      this[ID2].type = 0;
      this[ID3].currentBuildingType = 0;
      this[ID3].type = 0;
      this[ID4].currentBuildingType = 0;
      this[ID4].type = 0;
    }
  }

  async _changeMap(newBuilding) {
    let type = newBuilding.type + 1;
    let splited = this.buildingInfo[type - 1].size.split('*');
    let sizex = parseInt(splited[0], 10);
    let sizey = parseInt(splited[1], 10);

    await this.buildingSetting(sizex, sizey, type, newBuilding);

    if (this.buildingInfo[type - 1].type == 'building' || this.buildingInfo[type - 1].type == 'object') {
      for (let i = 0; i < this.buildingArray.length; i++) {
        for (let j = 0; j < this.buildingGroup.children.entries.length; j++) {
          if (this.buildingGroup.children.entries[j].sno == this.buildingArray[i].buildingInfo.sno)
            this.buildingGroup.children.entries[j].setDepth(this.buildingArray[i].depth);
          else
            this.buildingGroup.children.entries[j].setDepth(0);
        }
      }
    }
  }

  _getTileID(i, j) {
    var tileID;
    if (i >= 0 && i < 10)
      tileID = 'tile_' + '0' + i;
    else
      tileID = 'tile_' + i;
    if (j >= 0 && j < 10)
      tileID += '0' + j;
    else
      tileID += j;
    return tileID;
  }

  _getBuildingCount() {
    for (let j = 0; j < this.buildingInfo.length; j++) {
      if (this.buildingInfo[j].type == 'ground')
        this.groundcount++;
      else if (this.buildingInfo[j].type == 'road')
        this.roadcount++;
      else if (this.buildingInfo[j].type == 'building')
        this.buildingcount++;
      else if (this.buildingInfo[j].type == 'object')
        this.objectcount++;
    }
  }

  async loadImages() {
    for (let i = 0; i < this.buildingData.length; i++) {
      if (this.buildingData[i].mimetype.includes('video')) {
        await this.load.on('filecomplete-video-advertisement_' + this.buildingData[i]._id, this.showAdvertisement, this);
        this.load.video('advertisement_' + this.buildingData[i]._id, env.SERVER_URL + this.buildingData[i].ads, 'loadeddata', false, true);
      }
      else if (this.buildingData[i].mimetype.includes('image')) {
        await this.load.on('filecomplete-image-advertisement_' + this.buildingData[i]._id, this.showAdvertisement, this);
        this.load.image('advertisement_' + this.buildingData[i]._id, env.SERVER_URL + this.buildingData[i].ads);
      }
      await this.load.start();
    }
  }

  async showAdvertisement(key) {
    let buildingInfo = undefined;
    for (let i = 0; i < this.buildingData.length; i++) {
      if (key.replace('advertisement_', '') == this.buildingData[i]._id)
        buildingInfo = this.buildingData[i];
    }
    let vid = undefined;
    let vTex = undefined;

    if (buildingInfo.mimetype.includes('video')) {
      vid = this.make.video({
        add: false,
        key: key
      });
      vTex = vid.texture;
    }
    else if (buildingInfo.mimetype.includes('image')) {
      vid = this.make.image({
        add: false,
        key: key
      });
      vTex = vid.texture;
    }

    const vertices = [
      -0.5, -0.5,
      0.29, 0.29,
      -0.5, -1.3,
      0.29, -0.6
    ];

    const uvs = [
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ];

    const indicies = [
      0, 2,
      1, 2,
      3, 1
    ];

    // get position
    for (let i = 0; i < this.buildingGroup.children.entries.length; i++) {
      if (this.buildingGroup.children.entries[i].sno == buildingInfo.sno) {
        let posx = Math.floor(buildingInfo.sno / this.mapsizey);
        let posy = buildingInfo.sno % this.mapsizey;
        let tileID = this._getTileID(posx, posy);

        for (let j = 0; j < this.buildingArray.length; j++) {
          if (this.buildingArray[j].buildingInfo.sno == this.buildingGroup.children.entries[i].sno)
            this.buildingGroup.children.entries[i].depthValue = this.buildingArray[j].depth;
        }
        //advertisement background
        this.buildingGroup.children.entries[i].advertisement_background = this.add.mesh(this[tileID].x + this.tileWidth / 2 - 5, this[tileID].y - 3 * this.tileHeight - 5, 'advertisement-background').setDepth(this.buildingGroup.children.entries[i].depthValue - 1);
        this.buildingGroup.children.entries[i].advertisement_background.setScale(this.defaultWidth / this.game.config.width, this.defaultHeight / this.game.config.height);
        this.buildingGroup.children.entries[i].advertisement_background.setPerspective(1, 1, 100);
        this.buildingGroup.children.entries[i].advertisement_background.addVertices(vertices, uvs, indicies);
        this.buildingGroup.children.entries[i].advertisement_background.panZ(7);

        //advertisement
        this.buildingGroup.children.entries[i].advertisement = this.add.mesh(this[tileID].x + this.tileWidth / 2 - 5, this[tileID].y - 3 * this.tileHeight - 5, vTex).setDepth(this.buildingGroup.children.entries[i].depthValue - 1);
        this.buildingGroup.children.entries[i].advertisement.setScale(this.defaultWidth / this.game.config.width, this.defaultHeight / this.game.config.height);
        this.buildingGroup.children.entries[i].advertisement.setPerspective(1, 1, 100);
        this.buildingGroup.children.entries[i].advertisement.addVertices(vertices, uvs, indicies);
        this.buildingGroup.children.entries[i].advertisement.panZ(7);
        this.debug = this.add.graphics();
        this.buildingGroup.children.entries[i].advertisement.setDebug(this.debug);
        if (buildingInfo.mimetype.includes('video'))
          vid.play(true);
        this.UICam.ignore(this.buildingGroup.children.entries[i].advertisement);
      }
    }
  }

  async buildingSetting(sizex, sizey, type, building) {
    let posx = Math.floor(building.sno / this.mapsizey);
    let posy = building.sno % this.mapsizey;
    let name = building.name;

    let buildingType = this.buildingInfo[type - 1].type;
    let serial_number;

    if (this.buildingInfo[type - 1].type == 'ground')
      serial_number = type - 1;
    else if (this.buildingInfo[type - 1].type == 'road')
      serial_number = type - this.groundcount;
    else if (this.buildingInfo[type - 1].type == 'building')
      serial_number = type - this.groundcount - this.roadcount;
    else if (this.buildingInfo[type - 1].type == 'object')
      serial_number = type - this.groundcount - this.roadcount - this.buildingcount;

    for (let i = 0; i < sizey; i++) {
      for (let j = 0; j < sizex; j++) {
        this.levelData.levelArr_2_2[posx - i][posy - j] = parseInt(type, 10);
        let tileID = this._getTileID(posx - i, posy - j);
        this[tileID].currentBuildingType = type;
      }
    }

    let tileID = this._getTileID(posx, posy);
    let bud;
    if (this.buildingInfo[type - 1].size == '9*11')
      bud = this.add.sprite(this[tileID].x + 64, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
    else if (this.buildingInfo[type - 1].size == '7*8')
      bud = this.add.sprite(this[tileID].x + 35, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
    else if (this.buildingInfo[type - 1].size == '4*5')
      bud = this.add.sprite(this[tileID].x + 35, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
    else if (this.buildingInfo[type - 1].size == '1*2')
      bud = this.add.sprite(this[tileID].x + 73 / 2, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
    else if (this.buildingInfo[type - 1].size == '2*1')
      bud = this.add.sprite(this[tileID].x - this.tileWidth / 4, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
    else
      bud = this.add.sprite(this[tileID].x, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
    bud.type = buildingType;
    bud.buildingType = serial_number;
    bud.pos = building.pos;
    bud.sno = building.sno;
    bud.id = building._id;
    bud.sizex = building.sizex;
    bud.sizey = building.sizey;
    if (building.built == false) {
      bud.alpha = 0.5;
      bud.built = false;

      let timeLabel = this.add.text(this[tileID].x, this[tileID].y, "00:" + building.remaintime, { font: "20px Arial", fill: "#fff" });
      timeLabel.setPosition(this[tileID].x - timeLabel.width / 2, this[tileID].y);
      timeLabel.align = 'center';
      timeLabel.setData('sno', building.sno);
      this.timeLabelGroup.add(timeLabel);

      this.socket.emit("inConstruction", building);
    }
    else
      bud.built = true;
    bud.setOrigin(0.5, 1);

    let newBuilding = new Building(this, bud, "placement", tileID, type - 1, name);
    this.buildingGroup.add(newBuilding);
    bud.destroy();
  }

  _sort(buildingArray) {
    let budArray = [];
    for (let i = 0; i < buildingArray.length; i++) {
      budArray[i] = buildingArray[i];
    }

    for (let i = 0; i < budArray.length; i++) {
      for (let j = i + 1; j < budArray.length; j++) {
        if (budArray[i].x == budArray[j].x && budArray[i].y > budArray[j].y) {
          let temp = budArray[j];
          budArray[j] = budArray[i];
          budArray[i] = temp;
        }
        else if (budArray[i].y == budArray[j].y && budArray[i].x > budArray[j].x) {
          let temp = budArray[j];
          budArray[j] = budArray[i];
          budArray[i] = temp;
        }
        else if (budArray[i].y < budArray[j].y && budArray[i].y >= (budArray[j].y - budArray[j].sizex) && (budArray[i].x - budArray[i].sizey) >= budArray[j].x) {
          let temp = budArray[j];
          budArray[j] = budArray[i];
          budArray[i] = temp;
        }
        else if (budArray[i].y > budArray[j].y) {
          if (budArray[i].x > budArray[j].x) {
            let temp = budArray[j];
            budArray[j] = budArray[i];
            budArray[i] = temp;
          }
          else if ((budArray[i].x + budArray[j].sizey) > budArray[j].x) {
            let temp = budArray[j];
            budArray[j] = budArray[i];
            budArray[i] = temp;
          }
        }
      }
    }
    return budArray;
  }

  _setDepth(buildingList, state) {
    if (state == "init") {
      for (let i = 0; i < buildingList.length; i++) {
        let _x = Math.floor(buildingList[i].sno / this.mapsizey);
        let _y = buildingList[i].sno % this.mapsizey;

        let type = buildingList[i].type + 1;
        let splited = this.buildingInfo[type - 1].size.split('*');
        let sizex = parseInt(splited[0], 10);
        let sizey = parseInt(splited[1], 10);

        let buildingPos = {
          x: _x,
          y: _y,
          sizex: sizex,
          sizey: sizey,
          buildingInfo: buildingList[i],
          depth: 0
        }
        this.buildingArray.push(buildingPos);
      }
    }
    else {
      let _x = Math.floor(buildingList.sno / this.mapsizey);
      let _y = buildingList.sno % this.mapsizey;

      let type = buildingList.type + 1;
      let splited = this.buildingInfo[type - 1].size.split('*');
      let sizex = parseInt(splited[0], 10);
      let sizey = parseInt(splited[1], 10);

      let buildingPos = {
        x: _x,
        y: _y,
        sizex: sizex,
        sizey: sizey,
        buildingInfo: buildingList,
        depth: 0
      }
      this.buildingArray.push(buildingPos);
    }
    let sortedByYArray = this._sort(this.buildingArray);

    let depth = 1;
    for (let i = 0; i < sortedByYArray.length; i++) {
      sortedByYArray[i].depth = depth;
      depth += 2;
    }
    this.buildingArray = sortedByYArray;
  }

  async _buildingPlacement(buildingList) {
    for (let i = 0; i < buildingList.length; i++) {
      if (buildingList[i].name == 'Billboard' && buildingList[i].ads != '')
        this.buildingData.push(buildingList[i]);
    }
    this.loadImages();
    for (let i = 0; i < buildingList.length; i++) {
      let type = buildingList[i].type + 1;
      let splited = this.buildingInfo[type - 1].size.split('*');
      let sizex = parseInt(splited[0], 10);
      let sizey = parseInt(splited[1], 10);

      await this.buildingSetting(sizex, sizey, type, buildingList[i]);
    }
  }

  clearGroundAlpha(groundNumber) {
    for (var i = 0; i < this.mapsizex; i++) {
      for (var j = 0; j < this.mapsizey; j++) {
        var tileID;
        if (i >= 0 && i < 10)
          tileID = 'tile_' + '0' + i;
        else
          tileID = 'tile_' + i;
        if (j >= 0 && j < 10)
          tileID += '0' + j;
        else
          tileID += j;
        if (this[tileID].position_string == groundNumber)
          this[tileID].alpha = 1;
      }
    }
  }

  setGroundAlpha(groundNumber) {
    for (var i = 0; i < this.mapsizex; i++) {
      for (var j = 0; j < this.mapsizey; j++) {
        var tileID;
        if (i >= 0 && i < 10)
          tileID = 'tile_' + '0' + i;
        else
          tileID = 'tile_' + i;
        if (j >= 0 && j < 10)
          tileID += '0' + j;
        else
          tileID += j;
        if (this[tileID].position_string == groundNumber && this[tileID].type == 0) {
          this[tileID].alpha = 0.9;
        }
      }
    }
  }

  update() {
    if (this.currentBuilding != undefined)
      this.currentBuilding.followMouse();
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Button Key setting
   */
  setKey() {
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    /**
     * Cancel selected building
     */
    this.escKey.on("down", event => {
      this.clearBuilding();
    });
  }

  setCamera() {
    this.myCamera = this.cameras.main;
    this.myCamera.setBounds(-200, 1200, 3200, 2000);
    this.myCamera.setZoom(1);
    //    this.myCamera.centerOn(1920,1080);

    //    this.UICam = this.cameras.add(0, 0, 133, 1080);
    this.UICam = this.cameras.add(0, 0, 1920, 1080);
  }

  setScreen() {
    let tileID = this._getStartTileID(this.tileInfo[this.targetPos - 1][0], this.tileInfo[this.targetPos - 1][1]);
    var n = this.tileInfo[this.targetPos - 1][0];
    var m = this.tileInfo[this.targetPos - 1][1];

    this.setGroundAlpha(this.targetPos);
    this.myCamera.centerOn(this[tileID].x, this[tileID].y);

    this.UICam.ignore(this.tilesGroup);
  }
  addBuilding(buildingBtn) {
    var building = new Building(this, buildingBtn, "add");
    this.currentBuilding = building;
    this.currentBuilding.visible = false;
  }

  addEvents() {
    this.input.on('wheel', this.onWheelMove, this);

    this.input.on('pointerup', (pointer) => {
      this.screenDragged = false;
    }, this);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown())
        this.clearBuilding();
    }, this);

    this.input.on('pointermove', (pointer) => {
      if (this.currentBuilding != undefined)
        this.currentBuilding.visible = true;
      if (!pointer.isDown) return;

      this.screenDragged = true;

      this.myCamera.scrollX -= (pointer.x - pointer.prevPosition.x) / this.myCamera.zoom;
      this.myCamera.scrollY -= (pointer.y - pointer.prevPosition.y) / this.myCamera.zoom;
    }, this);
  }

  clearBuilding() {
    if (this.clickedpanel == true) {
      this.currentBuilding.destroy();
      this.currentBuilding = undefined;
      this.clickedpanel = false;
      if (this.isBuildingSelected == true)
        this.isBuildingSelected = false;
      else if (this.isGroundSelected == true)
        this.isGroundSelected = false;
      else if (this.isRoadSelected == true)
        this.isRoadSelected = false;
      else if (this.isObjectSelected == true)
        this.isObjectSelected = false;

      for (let i = 0; i < this.buildingGroup.children.entries.length; i++)
        this.buildingGroup.children.entries[i].setInteractive();
    }
  }

  onWheelMove(pointer, gameObjects, deltaX, deltaY, deltaZ) {
    if (deltaY > 0) {
      var newZoom = this.myCamera.zoom - 0.1;
      if (newZoom > 0.5) {
        this.myCamera.zoom = newZoom;

      }
    }

    if (deltaY < 0) {

      var newZoom = this.myCamera.zoom + 0.1;
      if (newZoom < 2.5) { this.myCamera.zoom = newZoom; }
    }
  }
}/*class*/

export default SinglePlace;