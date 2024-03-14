import Phaser from 'phaser';
import store from "../../../../store";

class Tile extends Phaser.GameObjects.Sprite {

	constructor(scene, x, y, type, position_string, city, street, targetPos) {
		if (type == 0) {
			if(position_string == targetPos)
				var tileType = 'ground-1';
			else
				var tileType = 'ground-0';
		}
		else if (type >= 1 && type <= 11)
			var tileType = 'road-' + (type + 11);

		super(scene, x, y, tileType);

		this.setScale(0.5);
		this.ground_count = 1;
		this.road_count = 11;
		this.building_count = 21;
		this.object_count = 10;

		this.game = scene;
		this.type = type;
		this.currentBuildingType = type;
		this.position_string = position_string;
		this.city = city;
		this.street = street;
		this.chatClicked = 0;

		this.initialize();
	}
	initialize() {
		this.add();
	}
	add() {
		this.game.add.existing(this);
		this.game.tilesGroup.add(this);

		this.game.tilesArr.push(this);
		this.game.posArr.push({ x: this.x, y: this.y });

		this.isEmpty = true;

		let shape = new Phaser.Geom.Polygon([
			0, 73,
			128, 146,
			256, 73,
			128, 0
		]);

		this.setInteractive(shape, Phaser.Geom.Polygon.Contains);

		//		var shape = new Phaser.Geom.Ellipse(this.width / 2, this.height / 2, this.width - 50, this.height - 20);
		//		if (this.game.mode == 'construction') {
		//			this.setInteractive(shape, Phaser.Geom.Ellipse.Contains);

		this.on('pointermove', (pointer) => {
			if (pointer.isDown) {
				this.game.tilePointedFlag = 1;
			}
		}, this);
		this.on('pointerup', this.onTileClick, this);
		this.on('pointerover', this.onTileOver, this);

	}

	judgment(sizex, sizey, sno) {
		for (let i = 0;i < sizey;i++) {
			for (let j = 0;j < sizex;j++) {
				let ID = this.convertID(sno - j - this.game.mapsizey*i);
				if(this.game['tile_' + ID].currentBuildingType != 0 || this.game['tile_' + ID].type != 0)
					return false;
			}
		}
		return true;
	}

	canBuild(sno) {
		if (this.alpha != 0.9)
			return false;
		if (this.game.currentBuilding.type == 'ground')
			var buildingType = parseInt(this.game.currentBuilding.buildingType, 10);
		else if (this.game.currentBuilding.type == 'road')
			var buildingType = this.ground_count + parseInt(this.game.currentBuilding.buildingType, 10) - 1;
		else if (this.game.currentBuilding.type == 'building')
			var buildingType = this.ground_count + this.road_count + parseInt(this.game.currentBuilding.buildingType, 10) - 1;
		else if (this.game.currentBuilding.type == 'object')
			var buildingType = this.ground_count + this.road_count + this.building_count + parseInt(this.game.currentBuilding.buildingType, 10) - 1;

		if (sno > this.game.mapsizey && sno % this.game.mapsizey != 0) {
			let splited = this.game.buildingInfo[buildingType].size.split('*');
			let sizex = parseInt(splited[0], 10);
			let sizey = parseInt(splited[1], 10);

			let flag = this.judgment(sizex, sizey, sno);
			return flag;
		}
		else
			return false;
	}

	convertID(sno) {
		var ID = "";
		var i = Math.floor(sno / this.game.mapsizey);
		var j = sno % this.game.mapsizey;
		if (i >= 0 && i < 10)
			ID = '0' + i.toString();
		else
			ID = i.toString();
		if (j >= 0 && j < 10)
			ID += '0' + j.toString();
		else
			ID += j.toString();
		return ID;
	}

	onTileOver() {
		if (this.game.isBuildingSelected == true) {
			// view mode
			if (this.game.mode == 'view')
				if (this.m == this.game.player.m2 && this.n == this.game.player.n2) { return; }

			var buildflag = this.canBuild(this.sno);
			if (buildflag == true) {
				this.game.currentBuilding.clearTint();
				this.game.currentBuilding.canBuild = true;
			}
			else {
				this.game.currentBuilding.setTint(0x2d2d2d);
				this.game.currentBuilding.canBuild = false;
			}
		}
	}

	onTileClick() {
		if (this.game.tilePointedFlag != 1) {
			if (this.game.mapTweenFlag == true) { return; }

			console.log(this.game.currentBuilding);
			if (this.game.isRoadSelected == true && this.game.currentBuilding.canBuild == true) {
				// view mode
				if (this.game.mode == 'view')
					if (this.m == this.game.player.m2 && this.n == this.game.player.n2) { return; }

				this.isEmpty = false;
				var roadType = this.ground_count + parseInt(this.game.currentBuilding.buildingType, 10);
				this.addBuilding(roadType);
			}

			if (this.game.isBuildingSelected == true && this.game.currentBuilding.canBuild == true) {
				// view mode
				if (this.game.mode == 'view')
					if (this.m == this.game.player.m2 && this.n == this.game.player.n2) { return; }

				this.isEmpty = false;
				if (this.game.currentBuilding.type == 'ground')
					var buildingType = parseInt(this.game.currentBuilding.buildingType, 10);
				else if (this.game.currentBuilding.type == 'road')
					var buildingType = this.ground_count + parseInt(this.game.currentBuilding.buildingType, 10) - 1;
				else if (this.game.currentBuilding.type == 'building')
					var buildingType = this.ground_count + this.road_count + parseInt(this.game.currentBuilding.buildingType, 10) - 1;
				else if (this.game.currentBuilding.type == 'object')
					var buildingType = this.ground_count + this.road_count + this.building_count + parseInt(this.game.currentBuilding.buildingType, 10) - 1;
		
				this.addBuilding(buildingType);
			}

			if (this.game.isGroundSelected == true && this.game.currentBuilding.canBuild == true) {
				// view mode
				if (this.game.mode == 'view')
					if (this.m == this.game.player.m2 && this.n == this.game.player.n2) { return; }

				this.isEmpty = false;
				var groundType = parseInt(this.game.currentBuilding.buildingType, 10) + 1;
				console.log("addBuilding", parseInt(this.game.currentBuilding.buildingType, 10), groundType);
				this.addBuilding(groundType);
			}

			// view mode
			if (this.game.mode == 'view') {
				console.log(this.game.playerCreated, this.game.player.isSelected);
				if (this.game.playerCreated == 1 && this.game.player.isSelected == true) {
					if (this.city == 2 && this.street == 2) {
						if (this.isEmpty == false) { return; }
						if (this.game.buildingInfo[this.type].type == 'building') { return; }

						let target = {
							tilem: this.m,
							tilen: this.n
						};

						this.game.socket.emit("playerMovement", target, this.game.playerInfo.accountId, this.game.Address);
						this.game.getPath(this.m, this.n, this.game.player);
					}
				}
			}
			//construction mode
			else if (this.game.mode == 'construction') {
				if (this.game.swalflag == 0 && this.game.clickedcontrol == false) {
					this.game.adsAddBtn.visible = false;
					this.game.enterBtn.visible = false;
					this.game.destroyBtn.visible = false;
					this.game.linkBtn.visible = false;
					this.game.prevControlBtn = undefined;
				}
			}
			this.game.currentTile = this;
		}
		this.game.tilePointedFlag = 0;
	}

	_setLevelData(sno, building_type) {
		var i = Math.floor(sno / this.game.mapsizey);
		var j = sno % this.game.mapsizey;

		this.game.levelData.levelArr_2_2[i][j] = building_type;
		// view mode
		if (this.game.mode == 'view')
			this.game.levelArr[i][j] = building_type;
	}

	buildingSetting(sizex, sizey, building_type, sno) {
		for (let i = 0;i < sizey;i++) {
			for (let j = 0;j < sizex;j++) {
				let ID = this.convertID(sno - j - this.game.mapsizey*i);
				this._setLevelData(this.sno - j - this.game.mapsizey*i, building_type + 1);
				this.game['tile_' + ID].currentBuildingType = building_type + 1;
			}
		}
		this.game.currentBuilding.buildingType = building_type;
		this.game.currentBuilding.bulType = building_type;
		this.game.buildingGroup.add(this.game.currentBuilding);
		this.game.currentBuilding.placeOnTile(this.x, this.y, this.sno);
	}


	addBuilding(building_type) {
		let posx = Math.floor(this.sno / this.game.mapsizey);
		let posy = this.sno % this.game.mapsizey;

		this.game.currentBuilding.tileID = this.game._getTileID(posx, posy);

		let splited = this.game.buildingInfo[building_type].size.split('*');
		let sizex = parseInt(splited[0], 10);
		let sizey = parseInt(splited[1], 10);

		this.buildingSetting(sizex, sizey, building_type, this.sno);
	}
}/*class*/

export default Tile;