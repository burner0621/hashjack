import Phaser from 'phaser';

import LevelData from "./objects/level-data";
import Methods from "./objects/methods";
import BuildingInsideTiles from "./objects/building-inside-tiles";
import Anim from "./objects/anims";
import Player from "./objects/sprites/player";
import Building from "./objects/sprites/building";

import store from "../../store";

import axios from 'axios';
import * as env from "../../env";

//action
import { setSceneName } from '../../actions/scene';
import { updatePlaceInfo, setTeleportData } from '../../actions/placeinfo';
import { addChatHistory, setChatContent, setEmoji } from '../../actions/chat';
import { calculateLevel } from '../../actions/playerinfo';
import { setGoOut } from '../../actions/buildinginfo';
import { setMusicChanged, setVolumeChanged } from "../../actions/music";

class HouseInside extends Phaser.Scene {
    constructor() {
        super({ key: "HouseInside" });
    }
    init(data) {
        this.mapsizex = data.sizex;
        this.mapsizey = data.sizey;
        this.Address = data.Address;
        this.targetPos = data.targetPos;
        this.socket = data.socket;
        this.buildingId = data.buildingId;
        this.NFTData = data.NFTData;
        this.buildingInfo = data.buildingInfo;
        this.startposx = data.startposx;
        this.startposy = data.startposy;
        this.sfx = data.sfx;
        this.buildingType = data.buildingType;

        this.tileWidth = 128;
        this.tileHeight = 73;
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

        this.hashStr = undefined;

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

        //game mode
        this.mode = 'HouseInside';
        this.playerInfo = store.getState().playerinfo.data;
        this.tilesMngr = new BuildingInsideTiles(this);
    }
    preload() {
        this.load.image('ground-0', process.env.PUBLIC_URL + "imgs/ground/g(0).png");
        this.load.image('ground-1', process.env.PUBLIC_URL + "imgs/ground/g(1).png");
        this.load.image('small-inside', process.env.PUBLIC_URL + "imgs/building/inside/small-inside.png");
        this.load.image('medium-inside', process.env.PUBLIC_URL + "imgs/building/inside/medium-inside.png");
        this.load.image('mansion-inside', process.env.PUBLIC_URL + "imgs/building/inside/mansion-inside.png");
        for (var i = 1; i <= 5; i++)
            this.load.image('furniture-' + i, process.env.PUBLIC_URL + "imgs/building/furniture/furniture" + i + ".png");
    }

    _getStartTileID(posx, posy) {
        if (posx < 10)
            posx = '0' + posx;
        if (posy < 10)
            posy = '0' + posy;
        let tileID = 'tile_' + posx + posy;
        return tileID;
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

    create() {
        this.input.mouse.disableContextMenu();
        // Get building count
        this._getBuildingCount();

        this.tilesMngr.addTiles();
        this.setCamera();
        this.setScreen();
        this.setEasyStar();
        this.addEvents();

        let tileID = this._getStartTileID(this.startposx, this.startposy);
        var n = this.startposx;
        var m = this.startposy;

        this.socket.emit("joinHouseInside", this.Address, this.targetPos, this[tileID].x, this[tileID].y - this.tileHeight / 2, n, m, this.playerInfo.accountId, this.buildingId);

        this.socket.on("houseMapInit", async (furnitureList) => {
            await this._setDepth(furnitureList, "init");
            await this._buildingPlacement(furnitureList);
        });

        this.socket.on("currentPlayersInsideHouse", async (players, _hashStr) => {
            if (this.hashStr != _hashStr) {
                this.hashStr = _hashStr;
                if (this.playerCreated == 0) {
                    Object.keys(players).forEach((id, index) => {
                        if (players[id].accountId == this.playerInfo.accountId) {
                            this.setPlayer(players[id]);
                            this.playerCreated = 1;
                        }
                        else
                            this._addOtherPlayer(players[id]);
                    });
                }
            }
        });

        this.socket.on("newPlayerInsideHouse", async (playerInfo, _hashStr) => {
            console.log(this.hashStr, _hashStr);
            if (this.hashStr != _hashStr) {
                this.hashStr = _hashStr;
                this._addNewPlayer(playerInfo);
            }
        });

        this.socket.on("playerMovedInside", async (playerInfo, tilem, tilen, _hashStr) => {
            if (this.hashStr != _hashStr) {
                this.hashStr = _hashStr;
                this.otherPlayers.getChildren().forEach((otherPlayer) => {
                    if (playerInfo.accountId == otherPlayer.playerInfo.accountId) {
                        this.getPath(tilem, tilen, otherPlayer);
                    }
                });
            }
        });

        /**
         * Chating
         */
        this.socket.on("chating", (chatContent, playerInfo) => {
            console.log(chatContent, playerInfo);
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
        });

        /**
         * Emojing
         */
        this.socket.on("emojing", (emoji, playerId) => {
            for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
                if (playerId == this.otherPlayers.children.entries[i].playerInfo.playerId)
                    this.createEmoji(emoji, this.otherPlayers.children.entries[i]);
            }
        });

        /**
         * Dancing
         */
        this.socket.on("houseInsidePlayerDancing", (_accountId, _hashStr) => {
            if (this.hashStr != _hashStr) {
                this.hashStr = _hashStr;
                for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
                    if (_accountId == this.otherPlayers.children.entries[i].playerInfo.accountId)
                        this.playerDancing(this.otherPlayers.children.entries[i]);
                }
            }
        });

        /**
         * Stop Dancing
         */
        this.socket.on("houseInsideStopPlayerDancing", (_accountId, _hashStr) => {
            if (this.hashStr != _hashStr) {
                this.hashStr = _hashStr;
                for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
                    if (_accountId == this.otherPlayers.children.entries[i].playerInfo.accountId)
                        this.stopPlayerDancing(this.otherPlayers.children.entries[i]);
                }
            }
        });

        /**
         * Disconnected
         */
        this.socket.on("disconnected", (_accountId) => {
            console.log("disconnected");
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
        });

        /**
         * Complete building
         */
        this.socket.on("updateInfo", () => {
            // Update place info
            this._updateInfo();
        });

        store.subscribe(() => {
            if (this.scene.key == "HouseInside") {
                const state = store.getState();

                if (state.chat.content != "") {
                    this.chatValue = state.chat.content;
                    store.dispatch(setChatContent(''));
                    this.socket.emit("chating", this.chatValue, this.player.playerInfo.accountId, this.player.playerInfo.playerId, this.buildingId);
                    this.createBubble(this.chatValue, this.player);
                }

                if (state.chat.emoji != "") {
                    this.player.emoji = state.chat.emoji;
                    store.dispatch(setEmoji(''));
                    this.socket.emit("emojing", this.player.emoji, this.player.playerInfo.playerId, this.buildingId);
                    this.createEmoji(this.player.emoji, this.player);
                }

                if (state.buildinginfo.goout == true) {
                    store.dispatch(setGoOut(false));
                    store.dispatch(setSceneName("view"));
                    this.scene.start('view', { Address: this.Address, pos: this.targetPos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData });
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
                    if (this.player.isdancing == false) {
                        this.playerDancing(this.player);
                        this.socket.emit("houseInsideDancing", this.buildingId, this.player.playerInfo.accountId);
                    }
                }

                else if (state.playerinfo.isdancing == false) {
                    if (this.player.isdancing == true) {
                        this.stopPlayerDancing(this.player);
                        this.socket.emit("houseInsideStopDancing", this.buildingId, this.player.playerInfo.accountId);
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

    setPlayer(playerInfo) {
        let tileID = this._getStartTileID(this.startposx, this.startposy);
        var n = this.startposx;
        var m = this.startposy;

        //    this.myCamera.centerOn(this[tileID].x, this[tileID].y);
        this.player = new Player(this, playerInfo, tileID, n, m, this.mode);
        let nameLabel;
        if (this.buildingType == 'Small house')
            nameLabel = this.add.text(this.player.x, this.player.y, playerInfo.playerId, { font: "20px Arial", fill: "#858" });
        else
            nameLabel = this.add.text(this.player.x, this.player.y, playerInfo.playerId, { font: "20px Arial", fill: "#fff" });
        nameLabel.setPosition(this.player.x - nameLabel.width / 2, this.player.y + this.tileHeight / 2);
        this.player.nameLabel = nameLabel;
        this.player.nameLabel.setDepth(1000);

        this.player.setDepth(0);
        if (this.player.isdancing == true)
            this.playerDancing(this.player);
        this.playerGroup.add(this.player);
    }

    _addOtherPlayer(playerInfo) {
        let tileID = this._getStartTileID(this.startposx, this.startposy);

        var player = new Player(this, playerInfo, tileID, playerInfo.buildingInsideInfo.n, playerInfo.buildingInsideInfo.m, this.mode);
        let nameLabel;
        if (this.buildingType == 'Small house')
            nameLabel = this.add.text(player.x, player.y, playerInfo.playerId, { font: "20px Arial", fill: "#858" });
        else
            nameLabel = this.add.text(player.x, player.y, playerInfo.playerId, { font: "20px Arial", fill: "#fff" });
        nameLabel.setPosition(player.x - nameLabel.width / 2, player.y + this.tileHeight / 2);
        player.nameLabel = nameLabel;
        player.nameLabel.setDepth(1000);

        player.setDepth(0);
        if (player.isdancing == true)
            this.playerDancing(player);
        this.otherPlayers.add(player);
    }

    _addNewPlayer(playerInfo) {
        let tileID = this._getStartTileID(this.startposx, this.startposy);
        var n = this.startposx;
        var m = this.startposy;

        var player = new Player(this, playerInfo, tileID, n, m, this.mode);
        let nameLabel;
        if (this.buildingType == 'Small house')
            nameLabel = this.add.text(player.x, player.y, playerInfo.playerId, { font: "20px Arial", fill: "#858" });
        else
            nameLabel = this.add.text(player.x, player.y, playerInfo.playerId, { font: "20px Arial", fill: "#fff" });
        nameLabel.setPosition(player.x - nameLabel.width / 2, player.y + this.tileHeight / 2);
        player.nameLabel = nameLabel;
        player.nameLabel.setDepth(1000);

        player.setDepth(0);
        if (player.isdancing == true)
            this.playerDancing(player);
        this.otherPlayers.add(player);
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

    _updateInfo() {
        // Update place info
        store.dispatch(updatePlaceInfo(this.Address, this.targetPos));
        // Calculate player level
        store.dispatch(calculateLevel(store.getState().playerinfo.data.accountId));
    }

    buildingSetting(sizex, sizey, type, building) {
        let posx = Math.floor(building.sno / this.mapsizey) + 1;
        let posy = building.sno % this.mapsizey;
        let name = building.name;

        let buildingType = this.buildingInfo[type - 1].type;
        let serial_number = type - this.groundcount - this.roadcount - this.buildingcount - this.objectcount;

        for (let i = 0; i < sizey; i++) {
            for (let j = 0; j < sizex; j++) {
                if (this.buildingType == 'Small house')
                    this.levelData.levelArr_small_house_view[posx - i][posy - j] = parseInt(type, 10);
                else if (this.buildingType == 'Medium house')
                    this.levelData.levelArr_medium_house_view[posx - i][posy - j] = parseInt(type, 10);
                else if (this.buildingType == 'Mansion')
                    this.levelData.levelArr_mansion_view[posx - i][posy - j] = parseInt(type, 10);
                let tileID = this._getTileID(posx - i, posy - j);
                this[tileID].currentBuildingType = type;
            }
        }

        let tileID = this._getTileID(posx, posy);
        let bud;
        if (this.buildingInfo[type - 1].size == '1*2')
            bud = this.add.sprite(this[tileID].x + 73 / 2, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
        else if (this.buildingInfo[type - 1].size == '2*1')
            bud = this.add.sprite(this[tileID].x - this.tileWidth / 4, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
        else
            bud = this.add.sprite(this[tileID].x, this[tileID].y + this.tileHeight / 2, buildingType + '-' + serial_number);
        bud.type = buildingType;
        bud.buildingType = serial_number;
        bud.pos = building.pos;
        bud.sno = building.sno;
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

    _buildingPlacement(buildingList) {
        for (let i = 0; i < buildingList.length; i++) {
            let type = buildingList[i].type + 1;
            let splited = this.buildingInfo[type - 1].size.split('*');
            let sizex = parseInt(splited[0], 10);
            let sizey = parseInt(splited[1], 10);

            this.buildingSetting(sizex, sizey, type, buildingList[i]);
        }

        this.levelArr = new Array(this.mapsizex);
        for (let i = 0; i < this.mapsizex + 1; i++) {
            this.levelArr[i] = new Array(this.mapsizey);
            for (let j = 0; j < this.mapsizey; j++) {
                let _levelData;
                if (this.buildingType == 'Small house')
                    _levelData = this.levelData.levelArr_small_house_view[i][j];
                else if (this.buildingType == 'Medium house')
                    _levelData = this.levelData.levelArr_medium_house_view[i][j];
                else if (this.buildingType == 'Mansion')
                    _levelData = this.levelData.levelArr_mansion_view[i][j];

                if (i == 0) 
                    this.levelArr[i][j] = _levelData;
                else {
                    if (_levelData != 0) {
                        if (this.buildingInfo[_levelData - 1].type == 'furniture')
                            this.levelArr[i][j] = 1;
                        else
                            this.levelArr[i][j] = 0;
                    }
                    else
                        this.levelArr[i][j] = 0;
                }
            }
        }
        console.log(this.levelArr);
        this.easystar.setGrid(this.levelArr);
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

        if (this.easystar) {
            this.easystar.calculate();
        }
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
        let building;
        if (this.buildingType == 'Small house')
            building = this.add.image(500, 1200, 'small-inside').setOrigin(0.5).setScale(0.5);
        else if (this.buildingType == 'Medium house')
            building = this.add.image(500, 1200, 'medium-inside').setOrigin(0.5).setScale(0.5);
        else if (this.buildingType == 'Mansion')
            building = this.add.image(500, 1200, 'mansion-inside').setOrigin(0.5).setScale(0.5);

        this.myCamera = this.cameras.main;
        this.myCamera.setBounds(-300, 750, 1500, 850);
        this.myCamera.setZoom(1);
        this.myCamera.centerOn(500, 1200);
        this.UICam = this.cameras.add(0, 0, 1920, 1080);
        this.UICam.ignore(building);
    }

    setScreen() {
        this.playerGroup = this.add.group();
        this.UICam.ignore(this.tilesGroup);
        this.UICam.ignore(this.playerGroup);
    }

    addEvents() {
        this.input.on('pointerdown', (pointer) => {
            if (this.playerCreated == 1)
                this.pointerflag = true;
        }, this);

        this.input.on('pointerup', (pointer) => {
            if (this.playerCreated == 1) {
                //        this.player.isSelected = true;
                this.screenDragged = false;
                this.pointerflag = false;
            }
        }, this);

        this.input.on('pointermove', (pointer) => {
            if (this.playerCreated == 1) {
                //        if (this.pointerflag == true)
                //          this.player.isSelected = false;

                if (!pointer.isDown) return;

                this.screenDragged = true;
            }
        }, this);
    }

    async goToView() {
        await axios.post(env.SERVER_URL + "/api/account/goto_view", { accountId: this.playerInfo.accountId });

        store.dispatch(setSceneName("view"));
        this.scene.start('view', { Address: this.Address, pos: this.targetPos, socket: this.socket, buildingInfo: this.buildingInfo, NFTData: this.NFTData, sfx: this.sfx, mapInitId: undefined });
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
        console.log(m1, n1, m2, n2);

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
                    // if (player.pathXY[player.pathXY.length - 1].sno < this.mapsizey) {
                    //   this.goToView();
                    // }

                    if (player.pathXY[player.pathXY.length - 1].sno >= this.mapsizey) {
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
                        this.socket.emit("playerPositionInside", this.buildingId, posInfo, player.n, player.m, player.playerInfo.accountId);
                    }
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

            if (player.pathXY[k].sno < this.mapsizey) {
                if (player.playerInfo.accountId == this.playerInfo.accountId)
                    this.goToView();
                else {
                    this._updateInfo();
                    for (let i = 0; i < this.otherPlayers.children.entries.length; i++) {
                        if (player.playerInfo.accountId == this.otherPlayers.children.entries[i].playerInfo.accountId) {
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
        }
    }

    setEasyStar() {
        const EasyStar = require('easystarjs');
        this.easystar = new EasyStar.js();

        this.easystar.setGrid(this.levelData.levelArr_building_inside);
        this.easystar.setAcceptableTiles([0]);

        //    this.easystar.enableDiagonals();
        this.easystar.disableCornerCutting();
        this.easystar.setIterationsPerCalculation(1000);
    }
}/*class*/

export default HouseInside;