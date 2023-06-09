import Phaser from 'phaser';

import LevelData from "./objects/level-data";
import Methods from "./objects/methods";
import BuildingInsideTiles from "./objects/building-inside-tiles";
import Anim from "./objects/anims";
import Building from "./objects/sprites/building";

import store from "../../store";

import axios from 'axios';
import * as env from "../../env";

//action
import { setHouse } from '../../actions/construction';
import { updatePlaceInfo } from '../../actions/placeinfo';
import { calculateLevel } from '../../actions/playerinfo';
import { setMusicChanged, setVolumeChanged } from "../../actions/music";

class BuildingConstruct extends Phaser.Scene {
    constructor() {
        super({ key: "buildingConstruct" });
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
        this.hashStr = undefined;

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
        this.mode = 'buildingConstruct';
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

    createControlBtn() {
        this.destroyBtn = this.add.sprite(0, 0, 'destroy').setScale(0.3).setOrigin(0.5, 0);
        this.destroyBtn.visible = false;
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

    setMaskSetting() {
        this.shape = this.make.graphics().fillStyle(0xffffff).fillRect(0, 0, 200, 200);
        const mask = this.shape.createGeometryMask();
        //        this.adsAddBtn.setMask(mask);
    }

    create() {
        this.input.mouse.disableContextMenu();
        // Get building count
        this._getBuildingCount();

        this.createControlBtn();
        this.tilesMngr.addTiles();
        this.setCamera();
        this.setKey();
        this.setScreen();
        this.setMaskSetting();
        this.addEvents();

        this.socket.emit("joinHouseConstruction", this.buildingId);

        this.socket.on("houseMapInit", async (buildingList) => {
            await this._setDepth(buildingList, "init");
            await this._buildingPlacement(buildingList);
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
                    if (this.destroyBtn.sno == sno)
                        this.destroyBtn.visible = false;
                    this._setGrid(this.buildingGroup.children.entries[i], this.buildingGroup.children.entries[i].buildingType);
                    this.buildingGroup.children.entries[i].destroy();
                }
            }
        });

        store.subscribe(() => {
            if (this.scene.key == "buildingConstruct") {
                const state = store.getState();

                if (state.construction.house != -1) {
                    if (this.currentBuilding != undefined)
                        this.currentBuilding.destroy();
                    this.clickedpanel = true;
                    var houseBuilding = state.construction.house;

                    var houseBtn = this.add.sprite(0, 0, 'furniture-' + houseBuilding);

                    houseBtn.type = 'furniture';
                    houseBtn.buildingType = houseBuilding;
                    houseBtn.name = '';
                    houseBtn.alpha = 0.5;

                    this.addBuilding(houseBtn);
                    houseBtn.destroy();
                    for (let i = 0; i < this.buildingGroup.children.entries.length; i++)
                        this.buildingGroup.children.entries[i].disableInteractive();
                    store.dispatch(setHouse(-1));
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
        let posx = Math.floor(building.sno / this.mapsizey);
        let posy = building.sno % this.mapsizey;
        let name = building.name;

        let buildingType = this.buildingInfo[type - 1].type;
        let serial_number = type - this.groundcount - this.roadcount - this.buildingcount - this.objectcount;

        for (let i = 0; i < sizey; i++) {
            for (let j = 0; j < sizex; j++) {
                if (this.buildingType == 'Small house')
                    this.levelData.levelArr_small_house_construct[posx - i][posy - j] = parseInt(type, 10);
                else if (this.buildingType == 'Medium house')
                    this.levelData.levelArr_medium_house_construct[posx - i][posy - j] = parseInt(type, 10);
                else if (this.buildingType == 'Mansion')
                    this.levelData.levelArr_mansion_construct[posx - i][posy - j] = parseInt(type, 10);
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

    addBuilding(buildingBtn) {
        var building = new Building(this, buildingBtn, "add");
        this.currentBuilding = building;
        this.currentBuilding.visible = false;
    }

    addEvents() {
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
}/*class*/

export default BuildingConstruct;