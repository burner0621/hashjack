import Phaser from 'phaser';

import LevelData from "./objects/level-data";
import Methods from "./objects/methods";
import TilesManager from "./objects/tiles-manager";
import Anim from "./objects/anims";
import Player from "./objects/sprites/player";
import Building from "./objects/sprites/building";

import store from "../../store";

import axios from 'axios';
import * as env from "../../env";

//action
import { setSceneName } from '../../actions/scene';
import { moveToFriend } from '../../actions/friends';
import { getPlaceInfo, setPlaceInfo, setCustomer, updatePlaceInfo, handlePlaceDetailDialog, setTeleportData } from '../../actions/placeinfo';
import { addChatHistory, setChatContent, setEmoji } from '../../actions/chat';
import { calculateLevel } from '../../actions/playerinfo';
import { setEntered } from '../../actions/buildinginfo';
import { setMusicChanged, setVolumeChanged } from "../../actions/music";

class GameView extends Phaser.Scene {

  constructor() {
    super({ key: "view" });
  }
  init(data) {
    this.mapsizex = 18;
    this.mapsizey = 20;
    this.defaultWidth = 1770;
    this.defaultHeight = 969;

    this.targetPos = data.pos;
    this.Address = data.Address;
    this.socket = data.socket;
    this.NFTData = data.NFTData;
    this.buildingInfo = data.buildingInfo;
    this.sfx = data.sfx;
    // issue socket double call
    this.mapInitId = data.mapInitId;
    this.dancingId = undefined;
    this.stopDancingId = undefined;

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

    this.mapTweenFlag = false;

    this.screenDragged = false;
    this.yArr = [80, 240, 440];
    this.beforeGroundNumber = "";

    //timer
    this.timer = 0;

    //bubble
    this.chatValue = "";

    //player group
    this.otherPlayers = this.add.group();

    //player state
    this.playerCreated = 0;

    //player animation
    this.animsStr = "";

    //mesh data
    this.meshData = undefined;
    this.buildingData = [];

    this.chatMessages = [];

    this.tilesGroup = this.add.group();
    this.buildingGroup = this.add.group();
    this.timeLabelGroup = this.add.group();

    this.swalflag = 0;
    this.tilePointedFlag = 0;
    this.openswal = true;
    this.clickedpanel = false;
    this.clickedcontrol = false;

    this.tileInfo = [
      [0, 0],
      [0, 12],
      [6, 12],
      [12, 0],
      [12, 4],
      [12, 8],
      [12, 12],
      [12, 16],
      [15, 12],
      [15, 16]
    ];

    //game mode
    this.mode = 'view';
    this.enterFlag = false;

    this.isdouble = false;

    // building count
    this.groundcount = 0;
    this.roadcount = 0;
    this.buildingcount = 0;
    this.objectcount = 0;

    this.playerInfo = store.getState().playerinfo.data;

    this.tilesMngr = new TilesManager(this, this.targetPos);
  }
  preload() {
    //    store.dispatch(setgameScene("view"));
    this.load.image('ads_add', process.env.PUBLIC_URL + "imgs/control/add.png");
    this.load.image('enter', process.env.PUBLIC_URL + "imgs/control/enter.png");
    this.load.image('destroy', process.env.PUBLIC_URL + "imgs/control/destroy.png");
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

  setMaskSetting() {
    this.shape = this.make.graphics().fillStyle(0xffffff).fillRect(0, 0, 200, 200);
    const mask = this.shape.createGeometryMask();
  }

  createControlBtn() {
    this.adsBtn = this.add.sprite(0, 0, 'ads_add').setScale(0.3);
    this.adsBtn.visible = false;
    this.enterBtn = this.add.sprite(0, 0, 'enter').setScale(0.3).setOrigin(0.5, 0);
    this.enterBtn.visible = false;
  }

  _getStartTileID(posx, posy) {
    if (posx < 10)
      posx = '0' + posx;
    if (posy < 10)
      posy = '0' + posy;
    let tileID = 'tile_' + posx + posy;
    return tileID;
  }

  create() {
    this.input.mouse.disableContextMenu();
    this.createControlBtn();
    this.setCamera();
    this.tilesMngr.addTiles(this.Address);
    this.setKey();
    this.setScreen();
    this.setEasyStar();
    this.setMaskSetting();
    this.addEvents();

    let tileID = this._getStartTileID(this.tileInfo[this.targetPos - 1][0], this.tileInfo[this.targetPos - 1][1]);

    let n = this.tileInfo[this.targetPos - 1][0];
    let m = this.tileInfo[this.targetPos - 1][1];

    this.socket.emit("join", 'view', this.Address, this.targetPos, this[tileID].x, this[tileID].y - 25, n, m, this.playerInfo.accountId);

    this.socket.on("mapInit", async (buildingList, placeId) => {
      if (this.groundcount == 0 && this.mapInitId != placeId) {
        this.mapInitId = placeId;
        // Update place info and player level
        await this._updateInfo();
        await this._setDepth(buildingList);
        await this._buildingPlacement(buildingList);
      }
    });

    this.socket.on("currentPlayers", async (players) => {
      if (this.playerCreated == 0) {
        Object.keys(players).forEach((id, index) => {
          if (players[id].address == this.Address && players[id].accountId == this.playerInfo.accountId) {
            this.setPlayer(players[id]);
            this.playerCreated = 1;
          }
          else if (players[id].address == this.Address && players[id].accountId != this.playerInfo.accountId) {
            // Update place info and player level
            //            this._updateInfo();
            this._addOtherPlayer(players[id]);
          }
        });
      }
    });

    this.socket.on("newPlayer", async (playerInfo) => {
      if (this.enterFlag == false) {
        // Update place info and player level
        this._updateInfo();
        this._addNewPlayer(playerInfo);
      }
    });

    this.socket.on("playerMoved", async (playerInfo, tilem, tilen) => {
      if (this.enterFlag == false) {
        this.otherPlayers.getChildren().forEach((otherPlayer) => {
          if (playerInfo.accountId == otherPlayer.playerInfo.accountId)
            this.getPath(tilem, tilen, otherPlayer);
        });
      }
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
     * Chating
     */
    this.socket.on("chating", (chatContent, playerInfo) => {
      if (this.enterFlag == false) {
        for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
          if (playerInfo.playerId == this.otherPlayers.children.entries[i].playerInfo.playerId) {
            const chatItem = {
              playerId: playerInfo.playerId,
              avatarUrl: env.SERVER_URL + playerInfo.avatarUrl,
              chatStr: chatContent
            }
            store.dispatch(addChatHistory(chatItem));
            this.createBubble(chatContent, this.otherPlayers.children.entries[i]);
          }
        }
      }
    });

    /**
     * Emojing
     */
    this.socket.on("emojing", (emoji, playerId) => {
      if (this.enterFlag == false) {
        for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
          if (playerId == this.otherPlayers.children.entries[i].playerInfo.playerId)
            this.createEmoji(emoji, this.otherPlayers.children.entries[i]);
        }
      }
    });

    /**
     * building entered
     */
    this.socket.on("entered", (player) => {
      if (this.enterFlag == false) {
        this._updateInfo();
        if (this.otherPlayers.children != undefined) {
          for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
            if (player.accountId == this.otherPlayers.children.entries[i].playerInfo.accountId) {
              if (this.otherPlayers.children.entries[i].emojiContent != undefined)
                this.otherPlayers.children.entries[i].emojiContent.destroy();
              if (this.otherPlayers.children.entries[i].bubble != undefined || this.otherPlayers.children.entries[i].chatContent != undefined) {
                this.otherPlayers.children.entries[i].bubble.destroy();
                this.otherPlayers.children.entries[i].chatContent.destroy();
              }
              this.otherPlayers.children.entries[i].nameLabel.destroy();
              this.otherPlayers.children.entries[i].destroy();
            }
          }
        }
      }
    });

    /**
     * Dancing
     */
    this.socket.on("playerDancing", (_accountId, _hashStr) => {
      if (this.dancingId != _hashStr) {
        this.dancingId = _hashStr;
        if (this.enterFlag == false) {
          for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
            if (_accountId == this.otherPlayers.children.entries[i].playerInfo.accountId)
              this.playerDancing(this.otherPlayers.children.entries[i]);
          }
        }
      }
    });

    /**
     * Stop Dancing
     */
    this.socket.on("stopPlayerDancing", (_accountId, _hashStr) => {
      if (this.stopDancingId != _hashStr) {
        this.stopDancingId = _hashStr;
        if (this.enterFlag == false) {
          for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
            if (_accountId == this.otherPlayers.children.entries[i].playerInfo.accountId)
              this.stopPlayerDancing(this.otherPlayers.children.entries[i]);
          }
        }
      }
    });

    /**
     * Disconnected
     */
    this.socket.on("disconnected", (_accountId) => {
      if (this.enterFlag == false) {
        this._updateInfo();
        for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
          if (_accountId == this.otherPlayers.children.entries[i].playerInfo.accountId) {
            if (this.otherPlayers.children.entries[i].emojiContent != undefined)
              this.otherPlayers.children.entries[i].emojiContent.destroy();
            if (this.otherPlayers.children.entries[i].bubble != undefined || this.otherPlayers.children.entries[i].chatContent != undefined) {
              this.otherPlayers.children.entries[i].bubble.destroy();
              this.otherPlayers.children.entries[i].chatContent.destroy();
            }
            this.otherPlayers.children.entries[i].nameLabel.destroy();
            this.otherPlayers.children.entries[i].destroy();
          }
        }
      }
    });

    /**
     * Delete player that visit other place
     */
    this.socket.on("deletePlayerInViewMode", (_accountId) => {
      if (this.enterFlag == false) {
        this._updateInfo();
        for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
          if (_accountId == this.otherPlayers.children.entries[i].playerInfo.accountId) {
            if (this.otherPlayers.children.entries[i].emojiContent != undefined)
              this.otherPlayers.children.entries[i].emojiContent.destroy();
            if (this.otherPlayers.children.entries[i].bubble != undefined || this.otherPlayers.children.entries[i].chatContent != undefined) {
              this.otherPlayers.children.entries[i].bubble.destroy();
              this.otherPlayers.children.entries[i].chatContent.destroy();
            }
            this.otherPlayers.children.entries[i].nameLabel.destroy();
            this.otherPlayers.children.entries[i].destroy();
          }
        }
      }
    });

    // When store value was changed
    store.subscribe(() => {
      if (this.scene.key == "view") {
        if (this.enterFlag == false) {
          const state = store.getState();

          if (state.chat.content != "") {
            this.chatValue = state.chat.content;
            store.dispatch(setChatContent(''));
            this.socket.emit("chating", this.chatValue, this.player.playerInfo.accountId, this.player.playerInfo.playerId, this.Address);
            this.createBubble(this.chatValue, this.player);
          }

          if (state.chat.emoji != "") {
            this.player.emoji = state.chat.emoji;
            store.dispatch(setEmoji(''));
            this.socket.emit("emojing", this.player.emoji, this.player.playerInfo.playerId, this.Address);
            this.createEmoji(this.player.emoji, this.player);
          }

          if (state.buildinginfo.entered == true) {
            store.dispatch(setEntered(false));
            const _buildingId = state.buildinginfo.buildingId;
            const _buildingSize = state.buildinginfo.buildingInfo.size;
            let splited = _buildingSize.split('*');
            let _sizex = parseInt(splited[0], 10);
            let _sizey = parseInt(splited[1], 10);
            this.enterFlag = true;
            this.scene.start('buildingInside', { Address: this.Address, targetPos: this.targetPos, socket: this.socket, buildingId: _buildingId, sizex: _sizex, sizey: _sizey, startposx: 1, startposy: 3, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx });
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

          if (state.playerinfo.isdancing == true) {
            if (this.player?.isdancing == false) {
              this.playerDancing(this.player);
              this.socket.emit("dancing", this.Address, this.player.playerInfo.accountId);
            }
          }

          else if (state.playerinfo.isdancing == false) {
            if (this.player?.isdancing == true) {
              this.stopPlayerDancing(this.player);
              this.socket.emit("stopDancing", this.Address, this.player.playerInfo.accountId);
            }
          }

          // Move to friend
          if (state.friends.moveToFriend != null) {
            let friendInfo = state.friends.moveToFriend;
            if (state.playerinfo.data.address != friendInfo.address) {
              store.dispatch(moveToFriend(null));

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
              this.socket.emit("teleportInViewMode", this.Address, this.playerInfo.accountId);
              this.scene.start('view', { Address: friendInfo.address, pos: friendInfo.targetPos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx, mapInitId: undefined });
            }
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
            this.socket.emit("visitPlaceInViewMode", this.Address, this.playerInfo.accountId);
            this.scene.start('view', { Address: _address, pos: _pos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx, mapInitId: undefined });
          }
        }
      }
    })
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

  onDancing(player) {
    if (player.rightdancing == true) {
      player.rightdancing = false;
      player.leftdancing = true;
      player.setFrame(9);
    }
    else {
      player.rightdancing = true;
      player.leftdancing = false;
      player.setFrame(8);
    }
  }

  playerDancing(player) {
    player.isdancing = true;
    player.rightdancing = true;
    player.setFrame(8);
    player.dancingTimer = this.time.addEvent({ delay: 500, callback: this.onDancing, callbackScope: this, args: [player], loop: true });
  }

  stopPlayerDancing(player) {
    player.dancingTimer.destroy();
    player.isdancing = false;
    player.leftdancing = false;
    player.rightdancing = false;
    player.setFrame(10);
  }

  _updateInfo() {
    // Update place info
    //    store.dispatch(updatePlaceInfo(this.Address, this.targetPos));
    // Calculate player level
    store.dispatch(calculateLevel(store.getState().playerinfo.data.accountId));
  }

  createEmoji(emoji, player) {
    if (player.emojicreated == 0) {
      var content = this.add.text(player.x - player.width / 2 + 3, player.y - player.height + 10, emoji, { fontFamily: 'Arial', fontSize: 18, align: 'center' });
      this.UICam.ignore(content);
      player.emojiContent = content;
      player.emojicreated = 1;

      //set timer
      player.emojiFirstTimer = this.time.addEvent({ delay: 10000, callback: this.onEmojiEvent, callbackScope: this, args: [player], loop: false });
    }
    else {
      player.emojiContent.destroy();

      var content = this.add.text(player.x - player.width / 2 + 3, player.y - player.height + 10, emoji, { fontFamily: 'Arial', fontSize: 18, align: 'center' });
      this.UICam.ignore(content);
      player.emojiContent = content;

      if (player.emojiFirstTimer != undefined)
        player.emojiFirstTimer.destroy();
      if (player.emojiSecondTimer != undefined)
        player.emojiSecondTimer.destroy();

      //set timer
      player.emojiSecondTimer = this.time.addEvent({ delay: 10000, callback: this.onEmojiEvent, callbackScope: this, args: [player], loop: false });
    }
    player.emojiContent.setDepth(1000);
  }

  onEmojiEvent(player) {
    player.emojiContent.destroy();
    player.emojicreated = 0;
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
    let posx = Math.floor(building.sno / this.mapsizey);
    let posy = building.sno % this.mapsizey;

    let ID1 = this._convertID(building.sno);
    // Set tile's isempty attribute
    this[ID1].isEmpty = true;
    this[ID1].currentBuildingType = 0;
    this[ID1].type = 0;

    this.levelArr[posx][posy] = 0;
    if (this.buildingInfo[bulType].size == '2*2') {
      let ID2 = this._convertID(building.sno - 1);
      let ID3 = this._convertID(building.sno - 50);
      let ID4 = this._convertID(building.sno - 51);

      this[ID2].currentBuildingType = 0;
      this[ID2].type = 0;
      this[ID3].currentBuildingType = 0;
      this[ID3].type = 0;
      this[ID4].currentBuildingType = 0;
      this[ID4].type = 0;

      this.levelArr[posx][posy - 1] = 0;
      this.levelArr[posx - 1][posy] = 0;
      this.levelArr[posx - 1][posy - 1] = 0;
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

  buildingSetting(sizex, sizey, type, building) {
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

      //      this.socket.emit("inConstruction", building);
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

  _setDepth(buildingList) {
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
    let sortedByYArray = this._sort(this.buildingArray);
    let depth = 1;
    for (let i = 0; i < sortedByYArray.length; i++) {
      sortedByYArray[i].depth = depth;
      depth += 2;
    }
    this.buildingArray = sortedByYArray;
  }

  async _buildingPlacement(buildingList) {
    // Get count
    this._getBuildingCount();

    for (let i = 0; i < buildingList.length; i++) {
      if (buildingList[i].name == 'Billboard' && buildingList[i].ads != '')
        this.buildingData.push(buildingList[i]);
    }
    await this.loadImages();

    for (let i = 0; i < buildingList.length; i++) {
      let type = buildingList[i].type + 1;
      let splited = this.buildingInfo[type - 1].size.split('*');
      let sizex = parseInt(splited[0], 10);
      let sizey = parseInt(splited[1], 10);

      this.buildingSetting(sizex, sizey, type, buildingList[i]);
    }

    this.levelArr = new Array(this.mapsizex);
    for (let i = 0; i < this.mapsizex; i++) {
      this.levelArr[i] = new Array(this.mapsizey);
      for (let j = 0; j < this.mapsizey; j++) {
        if (this.levelData.levelArr_2_2[i][j] != 0) {
          if (this.buildingInfo[this.levelData.levelArr_2_2[i][j] - 1].type == 'building' || this.buildingInfo[this.levelData.levelArr_2_2[i][j] - 1].type == 'object')
            this.levelArr[i][j] = 1;
          else
            this.levelArr[i][j] = 0;
        }
        else
          this.levelArr[i][j] = 0;
      }
    }
    this.easystar.setGrid(this.levelArr);
  }

  async loadImages() {
    for (let i = 0;i < this.buildingData.length;i++) {
      if (this.buildingData[i].mimetype.includes('video')) {
        this.load.on('filecomplete-video-advertisement_' + this.buildingData[i]._id, this.showAdvertisement, this);
        this.load.video('advertisement_' + this.buildingData[i]._id, env.SERVER_URL + this.buildingData[i].ads, 'loadeddata', false, true);
      }
      else if (this.buildingData[i].mimetype.includes('image')) {
        this.load.on('filecomplete-image-advertisement_' + this.buildingData[i]._id, this.showAdvertisement, this);
        this.load.image('advertisement_' + this.buildingData[i]._id, env.SERVER_URL + this.buildingData[i].ads);
      }
      this.load.start();
    }
  }

  async showAdvertisement(key) {
    let buildingInfo = undefined;
    for (let i = 0;i < this.buildingData.length;i++) {
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
        this.buildingGroup.children.entries[i].advertisement_background.setScale(this.defaultWidth/this.game.config.width, this.defaultHeight/this.game.config.height);
        this.buildingGroup.children.entries[i].advertisement_background.setPerspective(1, 1, 100);
        this.buildingGroup.children.entries[i].advertisement_background.addVertices(vertices, uvs, indicies);
        this.buildingGroup.children.entries[i].advertisement_background.panZ(7);

        //advertisement
        this.buildingGroup.children.entries[i].advertisement = this.add.mesh(this[tileID].x + this.tileWidth / 2 - 5, this[tileID].y - 3 * this.tileHeight - 5, vTex).setDepth(this.buildingGroup.children.entries[i].depthValue - 1);
        this.buildingGroup.children.entries[i].advertisement.setScale(this.defaultWidth/this.game.config.width, this.defaultHeight/this.game.config.height);
        this.buildingGroup.children.entries[i].advertisement.setPerspective(1, 1, 100);
        this.buildingGroup.children.entries[i].advertisement.addVertices(vertices, uvs, indicies);
        this.buildingGroup.children.entries[i].advertisement.panZ(7);
        if (buildingInfo.mimetype.includes('video'))
          vid.play(true);
        this.UICam.ignore(this.buildingGroup.children.entries[i].advertisement);
      }
    }
  }

  setPlayerDepth(player, _x, _y) {
    let depthValue = 0;
    for (let i = 0; i < this.buildingArray.length; i++) {
      if (_x >= (this.buildingArray[i].x - this.buildingArray[i].sizey + 1) && _x <= (this.buildingArray[i].x + 1) && _y >= (this.buildingArray[i].y - this.buildingArray[i].sizex + 1) && _y <= (this.buildingArray[i].y + 1))
        depthValue = this.buildingArray[i].depth + 1;
      else if (_x >= (this.buildingArray[i].x - this.buildingArray[i].sizey) && _x < this.buildingArray[i].x && _y >= (this.buildingArray[i].y - this.buildingArray[i].sizex) && _y <= this.buildingArray[i].y)
        depthValue = this.buildingArray[i].depth - 1;
    }
    player.setDepth(depthValue);
  }

  setPlayer(playerInfo) {
    let tileID = this._getStartTileID(this.tileInfo[this.targetPos - 1][0], this.tileInfo[this.targetPos - 1][1]);
    var n = this.tileInfo[this.targetPos - 1][0];
    var m = this.tileInfo[this.targetPos - 1][1];

    this.setGroundAlpha(this.targetPos);
    this.myCamera.centerOn(this[tileID].x, this[tileID].y);
    this.player = new Player(this, playerInfo, tileID, n, m, "view");
    let nameLabel = this.add.text(this.player.x, this.player.y, playerInfo.playerId, { font: "20px Arial", fill: "#1976d2" });
    nameLabel.setPosition(this.player.x - nameLabel.width / 2, this.player.y + this.tileHeight / 2);
    this.player.nameLabel = nameLabel;
    this.player.nameLabel.setDepth(1000);

    // set player depth
    let _x = playerInfo.n;
    let _y = playerInfo.m;
    this.setPlayerDepth(this.player, _x, _y);
    this.playerGroup.add(this.player);
  }

  _addOtherPlayer(playerInfo) {
    var pos = parseInt(playerInfo.targetPos, 10);
    let tileID = this._getStartTileID(this.tileInfo[pos - 1][0], this.tileInfo[pos - 1][1]);

    var player = new Player(this, playerInfo, tileID, playerInfo.n, playerInfo.m, "view");
    let nameLabel = this.add.text(player.x, player.y, playerInfo.playerId, { font: "20px Arial", fill: "#1976d2" });
    nameLabel.setPosition(player.x - nameLabel.width / 2, player.y + this.tileHeight / 2);
    player.nameLabel = nameLabel;
    player.nameLabel.setDepth(1000);

    // set player depth
    let _x = playerInfo.n;
    let _y = playerInfo.m;
    this.setPlayerDepth(player, _x, _y);
    if (player.isdancing == true)
      this.playerDancing(player);
    this.otherPlayers.add(player);
  }

  _addNewPlayer(playerInfo) {
    var pos = parseInt(playerInfo.targetPos, 10);
    let tileID = this._getStartTileID(this.tileInfo[pos - 1][0], this.tileInfo[pos - 1][1]);

    var n = this.tileInfo[pos - 1][0];
    var m = this.tileInfo[pos - 1][1];

    var player = new Player(this, playerInfo, tileID, n, m, "view");
    let nameLabel = this.add.text(player.x, player.y, playerInfo.playerId, { font: "20px Arial", fill: "#1976d2" });
    nameLabel.setPosition(player.x - nameLabel.width / 2, player.y + this.tileHeight / 2);
    player.nameLabel = nameLabel;
    player.nameLabel.setDepth(1000);

    // set player depth
    let _x = playerInfo.n;
    let _y = playerInfo.m;
    this.setPlayerDepth(player, _x, _y);
    this.otherPlayers.add(player);
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
    if (this.playerCreated == 1) {
      this.player.nameLabel.x = this.player.x - this.player.nameLabel.width / 2;
      this.player.nameLabel.y = this.player.y + this.tileHeight / 2;
      if (this.player.bubble != undefined) {
        this.player.bubble.x = this.player.x;
        this.player.bubble.y = this.player.y - this.player.bubbleHeight - 50;

        var b = this.player.chatContent.getBounds();
        this.player.chatContent.x = this.player.bubble.x + (this.player.bubbleWidth / 2) - (b.width / 2);
        this.player.chatContent.y = this.player.bubble.y + (this.player.bubbleHeight / 2) - (b.height / 2);
      }

      if (this.player.emojiContent != undefined) {
        this.player.emojiContent.x = this.player.x - this.player.width / 2 + 3;
        this.player.emojiContent.y = this.player.y - this.player.height + 10;
      }

      for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
        this.otherPlayers.children.entries[i].nameLabel.x = this.otherPlayers.children.entries[i].x - this.otherPlayers.children.entries[i].nameLabel.width / 2;
        this.otherPlayers.children.entries[i].nameLabel.y = this.otherPlayers.children.entries[i].y + this.tileHeight / 2;
        if (this.otherPlayers.children.entries[i].bubble != undefined) {
          this.otherPlayers.children.entries[i].bubble.x = this.otherPlayers.children.entries[i].x;
          this.otherPlayers.children.entries[i].bubble.y = this.otherPlayers.children.entries[i].y - this.otherPlayers.children.entries[i].bubbleHeight - 50;

          var b = this.otherPlayers.children.entries[i].chatContent.getBounds();
          this.otherPlayers.children.entries[i].chatContent.x = this.otherPlayers.children.entries[i].bubble.x + (this.otherPlayers.children.entries[i].bubbleWidth / 2) - (b.width / 2);
          this.otherPlayers.children.entries[i].chatContent.y = this.otherPlayers.children.entries[i].bubble.y + (this.otherPlayers.children.entries[i].bubbleHeight / 2) - (b.height / 2);
        }
        if (this.otherPlayers.children.entries[i].emojiContent != undefined) {
          this.otherPlayers.children.entries[i].emojiContent.x = this.otherPlayers.children.entries[i].x - this.otherPlayers.children.entries[i].width / 2 + 3;
          this.otherPlayers.children.entries[i].emojiContent.y = this.otherPlayers.children.entries[i].y - this.otherPlayers.children.entries[i].height + 10;
        }
      }
    }

    if (this.currentBuilding != undefined) {
      this.currentBuilding.followMouse();
    }

    if (this.easystar) {
      this.easystar.calculate();
    }
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Button Key setting
   */
  setKey() {
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  createBubble(chatContent, player) {
    if (player.bubblecreated == 0) {
      this.createSpeechBubble(player, chatContent);
      player.bubblecreated = 1;

      //set timer
      player.bubbleFirstTimer = this.time.addEvent({ delay: 10000, callback: this.onEvent, callbackScope: this, args: [player], loop: false });
    }
    else {
      player.chatContent.text = chatContent;
      player.bubble.destroy();
      player.chatContent.destroy();
      this.createSpeechBubble(player, chatContent);

      if (player.bubbleFirstTimer != undefined)
        player.bubbleFirstTimer.destroy();
      if (player.bubbleSecondTimer != undefined)
        player.bubbleSecondTimer.destroy();

      //set timer
      player.bubbleSecondTimer = this.time.addEvent({ delay: 10000, callback: this.onEvent, callbackScope: this, args: [player], loop: false });
    }
    player.bubble.setDepth(1000);
    player.chatContent.setDepth(1000);
  }

  onEvent(player) {
    player.bubble.destroy();
    player.chatContent.destroy();
    player.bubblecreated = 0;
  }

  createSpeechBubble(player, quote) {
    var bubblePadding = 10;
    var arrowHeight = player.bubbleHeight / 4;

    var bubble = this.add.graphics({ x: player.x + 100, y: player.y - player.bubbleHeight - 80 });
    this.UICam.ignore(bubble);
    this.physics.world.enable(bubble);
    var content = this.add.text(0, 0, quote, { fontFamily: 'Arial', fontSize: 20, color: '#000000', align: 'center', wordWrap: { width: 150 - (bubblePadding * 2), useAdvancedWrap: true } });

    player.bubbleWidth = content.width + 50;
    player.bubbleHeight = content.height + 30;
    //  Bubble color
    bubble.fillStyle(0xffffff, 1);

    //  Bubble outline line style
    bubble.lineStyle(4, 0x565656, 1);

    //  Bubble shape and outline
    bubble.strokeRoundedRect(0, 0, player.bubbleWidth, player.bubbleHeight, 16);
    bubble.fillRoundedRect(0, 0, player.bubbleWidth, player.bubbleHeight, 16);

    //  Calculate arrow coordinates
    var point1X = Math.floor(player.bubbleWidth / 7);
    var point1Y = player.bubbleHeight;
    var point2X = Math.floor((player.bubbleWidth / 7) * 2);
    var point2Y = player.bubbleHeight;
    var point3X = Math.floor(player.bubbleWidth / 7);
    var point3Y = Math.floor(player.bubbleHeight + arrowHeight);

    //  Bubble arrow fill
    bubble.fillTriangle(point1X, point1Y, point2X, point2Y, point3X, point3Y);
    bubble.lineStyle(2, 0x565656, 1);
    bubble.lineBetween(point2X, point2Y, point3X, point3Y);
    bubble.lineBetween(point1X, point1Y, point3X, point3Y);

    var b = content.getBounds();

    content.setPosition(bubble.x + (player.bubbleWidth / 2) - (b.width / 2), bubble.y + (player.bubbleHeight / 2) - (b.height / 2));
    this.UICam.ignore(content);
    player.bubble = bubble;
    player.chatContent = content;
  }

  setCamera() {
    this.myCamera = this.cameras.main;
    this.myCamera.setBounds(-200, 1200, 3200, 2000);
    this.myCamera.setZoom(1);

    //    this.UICam = this.cameras.add(0, 0, 133, 1080);
    this.UICam = this.cameras.add(0, 0, 1920, 1080);
  }

  setScreen() {
    this.playerGroup = this.add.group();
    this.UICam.ignore(this.tilesGroup);
    this.UICam.ignore(this.playerGroup);
  }

  addEvents() {

    this.input.on('wheel', this.onWheelMove, this);

    this.input.on('pointerdown', (pointer) => {
      if (this.playerCreated == 1)
        this.pointerflag = true;
    }, this);

    this.input.on('pointerup', (pointer) => {
      if (this.playerCreated == 1) {
        this.player.isSelected = true;
        this.screenDragged = false;
        this.pointerflag = false;
      }
    }, this);

    this.input.on('pointermove', (pointer) => {
      if (this.playerCreated == 1) {
        if (this.pointerflag == true)
          this.player.isSelected = false;

        if (!pointer.isDown) return;

        this.screenDragged = true;

        this.myCamera.scrollX -= (pointer.x - pointer.prevPosition.x) / this.myCamera.zoom;
        this.myCamera.scrollY -= (pointer.y - pointer.prevPosition.y) / this.myCamera.zoom;
      }
    }, this);
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


    //      this.myCamera.centerOn(pointer.x, pointer.y);
    //this.myCamera.pan(pointer.x, pointer.y, 5000, "Linear")

  }

  /*------------------------------Path Finding ------------------------------------------*/

  getPath(m2, n2, player) {
    if (player.walkFlag === true) { return; }
    if (player.m === m2 && player.n === n2) { return; }

    player.walkFlag = true;
    player.movingFlag = true;

    var m1 = player.m;
    var n1 = player.n;

    player.m2 = m2;
    player.n2 = n2;

    this.easystar.findPath(m1, n1, m2, n2, (path) => {
      if (path === null) {
        player.walkFlag = false;
        return;
      }

      var startX = 960 + 69 / 2 - 20 * this.tileWidth / 2;
      var startY = 0;
      var w = this.tileWidth;

      if (this.tilesMngr.isoMetric === true) {
        startX = 600;
        startY = -400;
      }

      for (var i = 0; i < path.length; i++) {
        var m = path[i].x;
        var n = path[i].y;
        var tileId;

        //       var tileId = n.toString() + m.toString();

        if (n >= 0 && n < 10)
          tileId = '0' + n.toString();
        else
          tileId = n.toString();
        if (m >= 0 & m < 10)
          tileId += '0' + m.toString();
        else
          tileId += m.toString();

        var tile = this['tile_' + tileId];

        player.pathXY.push({ x: tile.x, y: tile.y, m: m, n: n, sno: tile.sno });

      }

      var k = 1;
      var m = 0;
      var n = 0;

      var tConfig = {
        targets: player,
        alpha: 0.99,
        duration: 500,
        ease: Phaser.Math.Easing.Linear,
        callbackScope: this,
        loop: player.pathXY.length - 1,
        onLoop: () => { this.movePlayer(k, player); k++; },
        onComplete: function () {

          //player.isSelected = false;
          player.m = player.m2;
          player.n = player.n2;
          player.walkFlag = false;
          player.movingFlag = false;
          player.pathXY = [];

          let posInfo = {
            x: player.x,
            y: player.y
          };
          player.setFrame(10);
          this.socket.emit("playerPosition", posInfo, player.n, player.m, player.playerInfo.accountId);
        }
      };
      this.tweens.add(tConfig);
    });
  }

  movePlayer(k, player) {
    //      var prev_tileId = 'tile_' + this.player.n.toString()+this.player.m.toString();
    if (player.anims != undefined) {
      var prev_tileId;

      if (player.n >= 0 && player.n < 10)
        prev_tileId = '0' + player.n.toString();
      else
        prev_tileId = player.n.toString();
      if (player.m >= 0 && player.m < 10)
        prev_tileId += '0' + player.m.toString();
      else
        prev_tileId += player.m.toString();

      var px = this['tile_' + prev_tileId].x;
      var py = this['tile_' + prev_tileId].y;

      var x = player.pathXY[k].x;
      var y = player.pathXY[k].y - 25;

      var a = Math.atan2(y - py, x - px);
      a = Math.round(a * 180 / Math.PI);

      var str = '';
      var speed = 500;

      if (a === -136) { player.setFrame(0); str = 'left'; } //left
      else if (a === 10) { player.setFrame(4); str = 'right'; } // right
      else if (a === 170) { player.setFrame(0); str = 'left'; } //down
      else if (a === -44) { player.setFrame(4); str = 'right' } //up

      else if (a === -169) {
        player.setFrame(0); str = 'left'
        //        speed = 1000;
      } //diagnol
      else if (a === -11) {
        player.setFrame(4); str = 'right'
        //        speed = 1000;
      } //diagnol

      else if (a === -90) { player.setFrame(12); str = 'back' } //diagnol
      else if (a === 91) { player.setFrame(11); str = 'front' } //diagnol

      if (str !== '') {
        this.animsStr = str;
        player.anims.play(str);
      }

      var Config = {
        targets: player,
        x: x,
        y: y,
        duration: speed,
        ease: Phaser.Math.Easing.Linear,
        callbackScope: this,
        onComplete: function () { },
      };

      this.tweens.add(Config);

      player.m = player.pathXY[k].m;
      player.n = player.pathXY[k].n;

      // reset player depth
      let _x = Math.floor(player.pathXY[k].sno / this.mapsizey);
      let _y = player.pathXY[k].sno % this.mapsizey;
      this.setPlayerDepth(player, _x, _y);
    }
  }

  setEasyStar() {
    const EasyStar = require('easystarjs');
    this.easystar = new EasyStar.js();

    //    this.easystar.setGrid(this.levelData.levelArr_2_2);
    this.easystar.setAcceptableTiles([0]);

    //    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();
    this.easystar.setIterationsPerCalculation(1000);
  }
}/*class*/

export default GameView;