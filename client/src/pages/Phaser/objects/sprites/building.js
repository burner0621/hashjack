import store from "../../../../store";

import Phaser from 'phaser';
import Swal from 'sweetalert2';
import axios from 'axios';

//action
import { setSceneName } from '../../../../actions/scene';
import { setHouseInfo } from '../../../../actions/construction';
import { setBuildingCounter, showCounter } from '../../../../actions/buildingcounter';
import { showAdvertisement } from '../../../../actions/construction';
import { loadBuildingInfo, setEntered } from '../../../../actions/buildinginfo';

import * as env from "../../../../env";

class Building extends Phaser.GameObjects.Sprite {

	constructor(scene, buildingBtn, buildingType, tileID = undefined, bulType = undefined, name = undefined) {
		var type = buildingBtn.type + '-' + buildingBtn.buildingType;
		//		var x = scene.input.mousePointer.x;
		//    var y = scene.input.mousePointer.y;

		super(scene, buildingBtn.x, buildingBtn.y, type);

		this.game = scene;
		if (buildingType == "placement") {
			this.sno = buildingBtn.sno;
			this.name = name;
		}
		else
			this.name = buildingBtn.name;

		this.buildingType = buildingBtn.buildingType;
		this.bulType = bulType;
		this.tileID = tileID;
		this.pos = buildingBtn.pos;
		this.alpha = buildingBtn.alpha;
		this.type = buildingBtn.type;
		this.id = buildingBtn.id;
		this.sizex = buildingBtn.sizex;
		this.sizey = buildingBtn.sizey;

		this.canBuild = false;
		this.advertisement = undefined;
		this.advertisement_background = undefined;
		this.depthValue = 0;
		this.setScale(0.5);

		this.initialize(buildingType, bulType);
	}
	initialize(buildingType, bulType) {
		if (buildingType == "add")
			this.add();
		else if (buildingType == "placement")
			this.placement(bulType);
	}

	_showControlButton(mode, type) {
		let posx = this.game[this.tileID].x;
		let posy = this.game[this.tileID].y + this.game[this.tileID].height / 4;
		if (mode == 'construction') {
			if (this.game.buildingInfo[type].name == 'Small house' || this.game.buildingInfo[type].name == 'Medium house' || this.game.buildingInfo[type].name == 'Mansion') {
				this.game.enterBtn.setPosition(posx, posy).setInteractive({ useHandCursor: true });
				this.game.enterBtn.setDepth(1000);
				this.game.enterBtn.sno = this.sno;
				this.game.enterBtn.id = this.id;
				this.game.enterBtn.sizex = this.sizex;
				this.game.enterBtn.sizey = this.sizey;
				this.game.enterBtn.name = this.name;
				this.game.enterBtn.visible = true;

				this.game.tweens.add({
					targets: [this.game.enterBtn],
					y: posy - this.game.enterBtn.height / 3 - 50,
					ease: 'Sine.easeInOut',
					yoyo: false,
					repeat: 0,
					duration: 300
				});

				this.game.destroyBtn.setPosition(posx, posy).setInteractive({ useHandCursor: true });
				this.game.destroyBtn.setDepth(1000);
				this.game.destroyBtn.sno = this.sno;
				this.game.destroyBtn.visible = true;

				this.game.shape.setPosition(posx - 100, posy - 200);

				this.game.tweens.add({
					targets: [this.game.destroyBtn],
					y: posy - 50,
					ease: 'Sine.easeInOut',
					yoyo: false,
					repeat: 0,
					duration: 300
				});
			}
			else {
				this.game.destroyBtn.setPosition(posx, posy).setInteractive({ useHandCursor: true });
				this.game.destroyBtn.setDepth(1000);
				this.game.destroyBtn.sno = this.sno;
				this.game.destroyBtn.visible = true;
				this.game.enterBtn.visible = false;

				this.game.shape.setPosition(posx - 100, posy - 200);

				this.game.tweens.add({
					targets: [this.game.destroyBtn],
					y: posy - 50,
					ease: 'Sine.easeInOut',
					yoyo: false,
					repeat: 0,
					duration: 300
				});
			}
		}
		else if (mode == 'buildingConstruct') {
			this.game.destroyBtn.setPosition(posx, posy).setInteractive({ useHandCursor: true });
			this.game.destroyBtn.setDepth(1000);
			this.game.destroyBtn.sno = this.sno;
			this.game.destroyBtn.visible = true;

			this.game.shape.setPosition(posx - 100, posy - 200);

			this.game.tweens.add({
				targets: [this.game.destroyBtn],
				y: posy - 50,
				ease: 'Sine.easeInOut',
				yoyo: false,
				repeat: 0,
				duration: 300
			});
		}
		else if (mode == 'view') {
			this.game.enterBtn.setPosition(posx, posy).setInteractive({ useHandCursor: true });
			this.game.enterBtn.setDepth(1000);
			this.game.enterBtn.sno = this.sno;
			this.game.enterBtn.id = this.id;
			this.game.enterBtn.sizex = this.sizex;
			this.game.enterBtn.sizey = this.sizey;
			this.game.enterBtn.name = this.name;
			this.game.enterBtn.visible = true;

			this.game.shape.setPosition(posx - 100, posy - 200);

			this.game.tweens.add({
				targets: [this.game.enterBtn],
				y: posy - 50,
				ease: 'Sine.easeInOut',
				yoyo: false,
				repeat: 0,
				duration: 300
			});
		}
	}

	_setInteractive(bulType) {
		let shape;
		if (this.game.buildingInfo[bulType].type == 'building') {
			if (this.game.buildingInfo[bulType].size == '9*11')
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

			else if (this.game.buildingInfo[bulType].size == '7*8')
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
			else if (this.game.buildingInfo[bulType].size == '7*7') {
				if (this.game.buildingInfo[bulType].name == 'Night Club')
					shape = new Phaser.Geom.Polygon([
						75, 485,
						70, 1000,
						890, 1470,
						1695, 1005,
						1695, 475,
						880, 0
					]);
				else if (this.game.buildingInfo[bulType].name == 'Casino')
					shape = new Phaser.Geom.Polygon([
						890, 0,
						155, 880,
						900, 1310,
						1640, 870
					]);
			}
			else if (this.game.buildingInfo[bulType].size == '4*4') {
				if (this.game.buildingInfo[bulType].index == 22)
					shape = new Phaser.Geom.Polygon([
						175, 395,
						175, 1085,
						510, 1275,
						840, 1075,
						840, 375,
						510, 170
					]);
				else if (this.game.buildingInfo[bulType].index == 23)
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
				else if (this.game.buildingInfo[bulType].index == 25)
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
				else if (this.game.buildingInfo[bulType].index == 29) {
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
			else if (this.game.buildingInfo[bulType].size == '3*3') {
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
			else if (this.game.buildingInfo[bulType].size == '2*2') {
				if (this.game.buildingInfo[bulType].index == 14)
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
				else if (this.game.buildingInfo[bulType].index == 15)
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
				else if (this.game.buildingInfo[bulType].index == 16)
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
				else if (this.game.buildingInfo[bulType].index == 17)
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
				else if (this.game.buildingInfo[bulType].index == 18)
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
				else if (this.game.buildingInfo[bulType].index == 19)
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
				else if (this.game.buildingInfo[bulType].index == 20)
					shape = new Phaser.Geom.Polygon([
						92, 82,
						92, 206,
						151, 242,
						293, 157,
						293, 35,
						232, 0
					]);
			}
			else if (this.game.buildingInfo[bulType].size == '2*1') {
				shape = new Phaser.Geom.Polygon([
					94, 35,
					94, 157,
					233, 241,
					292, 206,
					292, 82,
					153, 0
				]);
			}
			else if (this.game.buildingInfo[bulType].size == '1*2') {
				if (this.game.buildingInfo[bulType].name == 'Billboard') {
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
				else if (this.game.buildingInfo[bulType].index == 12) {
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
		}
		else if (this.game.buildingInfo[bulType].type == 'object') {
			if (this.game.buildingInfo[bulType].index == 31) {
				shape = new Phaser.Geom.Polygon([
					65, 30,
					75, 135,
					175, 130,
					200, 50,
					135, 0
				]);
			}

			else if (this.game.buildingInfo[bulType].index == 32) {
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

			else if (this.game.buildingInfo[bulType].index == 33) {
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

			else if (this.game.buildingInfo[bulType].index == 34) {
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

			else if (this.game.buildingInfo[bulType].index == 35) {
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

			else if (this.game.buildingInfo[bulType].index == 36) {
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

			else if (this.game.buildingInfo[bulType].index == 37) {
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

			else if (this.game.buildingInfo[bulType].index == 38) {
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

			else if (this.game.buildingInfo[bulType].index == 39) {
				shape = new Phaser.Geom.Polygon([
					200, 75,
					65, 225,
					105, 250,
					325, 130,
					295, 30,
					220, 0
				]);
			}

			else if (this.game.buildingInfo[bulType].index == 40) {
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
		else if (this.game.buildingInfo[bulType].type == 'road' || this.game.buildingInfo[bulType].type == 'ground') {
			shape = new Phaser.Geom.Polygon([
				0, 73,
				128, 146,
				256, 73,
				128, 0
			]);
		}
		else if (this.game.buildingInfo[bulType].type == 'furniture') {
			if (this.game.buildingInfo[bulType].name == 'Table')
				shape = new Phaser.Geom.Polygon([
					160, 0,
					40, 75,
					35, 145,
					105, 180,
					225, 115,
					225, 40
				]);
			else if (this.game.buildingInfo[bulType].name == 'TV')
				shape = new Phaser.Geom.Polygon([
					50, 100,
					50, 195,
					125, 190,
					190, 155,
					220, 100,
					220, 0
				]);
			else if (this.game.buildingInfo[bulType].name == 'Cloud')
				shape = new Phaser.Geom.Polygon([
					210, 0,
					135, 5,
					55, 55,
					75, 130,
					265, 235,
					330, 200
				]);
			else if (this.game.buildingInfo[bulType].name == 'Bed')
				shape = new Phaser.Geom.Polygon([
					255, 0,
					70, 105,
					70, 170,
					245, 270,
					435, 160,
					430, 100
				]);
			else if (this.game.buildingInfo[bulType].name == 'Rug')
				shape = new Phaser.Geom.Polygon([
					520, 15,
					100, 260,
					380, 420,
					800, 180
				]);
		}

		this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
//		this.game.input.enableDebug(this, 0xff00ff);
	}

	placement(bulType) {
		this.game.add.existing(this);
		this.game.UICam.ignore(this);
		this.setOrigin(0.5, 1);

		if (this.game.buildingInfo[bulType].type == 'building' || this.game.buildingInfo[bulType].type == 'object' || this.game.buildingInfo[bulType].type == 'furniture') {
			for (let i = 0; i < this.game.buildingArray.length; i++) {
				if (this.sno == this.game.buildingArray[i].buildingInfo.sno) {
					this.setDepth(this.game.buildingArray[i].depth);
					if (this.advertisement != undefined) {
						this.advertisement_background.setDepth(this.game.buildingArray[i].depth - 1);
						this.advertisement.setDepth(this.game.buildingArray[i].depth - 1);
					}
					this.depthValue = this.game.buildingArray[i].depth;
				}
			}
		}
		else {
			this.depthValue = 0;
			this.setDepth(0);
		}

		if (this.game.mode == 'view') {
			if (this.game.buildingInfo[bulType].type == 'building') {
				if (this.game.buildingInfo[bulType].name == 'Night Club') {
					const shape = new Phaser.Geom.Polygon([
						75, 485,
						70, 1000,
						890, 1470,
						1695, 1005,
						1695, 475,
						880, 0
					]);
					this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
				}
				if (this.game.buildingInfo[bulType].name == 'Billboard') {
					const shape = new Phaser.Geom.Polygon([
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
					this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
				}
				else if (this.game.buildingInfo[bulType].name == 'Small house') {
					const shape = new Phaser.Geom.Polygon([
						92, 82,
						92, 206,
						151, 242,
						293, 157,
						293, 35,
						232, 0
					]);
					this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
				}
				else if (this.game.buildingInfo[bulType].name == 'Medium house') {
					const shape = new Phaser.Geom.Polygon([
						530, 0,
						395, 60,
						80, 240,
						100, 310,
						410, 485,
						690, 330,
						705, 275
					]);
					this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
				}
				else if (this.game.buildingInfo[bulType].name == 'Mansion') {
					const shape = new Phaser.Geom.Polygon([
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
					this.setInteractive(shape, Phaser.Geom.Polygon.Contains);
				}
//				this.game.input.enableDebug(this, 0xff00ff);
			}
		}
		else if (this.game.mode == 'construction')
			this._setInteractive(bulType);
		else if (this.game.mode == 'buildingConstruct')
			this._setInteractive(bulType);

		let pointedflag = 0;

		this.on('pointermove', (pointer) => {
			if (this.game.isBuildingSelected == true) {
				this.game.currentBuilding.setTint(0x2d2d2d);
				this.game.currentBuilding.canBuild = false;
			}
			if (pointer.isDown) {
				pointedflag = 1;
			}
		}, this);

		this.on('pointerup', async (pointer) => {
			if (this.game.mode == 'construction') {
				if (this.pos == this.game.targetPos) {
					if (pointedflag == 0 && this.game.clickedpanel == true && this.game.currentBuilding.canBuild == true) {
						var buildingType = this.game.groundcount + this.game.roadcount + parseInt(this.game.currentBuilding.buildingType, 10) - 1;
						this.addBuilding(buildingType);
					}

					else if (pointedflag != 1 && this.game.clickedpanel == false && this.alpha == 1) {
						this.game.buildingSelected = true;
						pointedflag = 0;

						if (this.game.prevControlBtn == this.sno)
							this.game.controlBtnState = false;
						else
							this.game.controlBtnState = true;

						if (this.game.controlBtnState == true) {
							this._showControlButton(this.game.mode, bulType);
							this.game.prevControlBtn = this.sno;
						}

						this.game.adsAddBtn.on('pointerup', (pointer) => {
							store.dispatch(showAdvertisement());
						}, this);

						this.game.enterBtn.on('pointerup', (pointer) => {
							if (this.game.isdouble == false) {
								this.game.isdouble = true;
								store.dispatch(setSceneName("buildingConstruct"));

								let _buildingId = this.game.enterBtn.id;
								let _sizex = this.game.enterBtn.sizex;
								let _sizey = this.game.enterBtn.sizey;
								let _buildingType = this.game.enterBtn.name;
								let _startposx;
								let _startposy;
								if (_buildingType == 'Small house') {
									_startposx = 0;
									_startposy = 3;
								}
								else if (_buildingType == 'Medium house') {
									_startposx = 0;
									_startposy = 3;
								}
								else if (_buildingType == 'Mansion') {
									_startposx = 0;
									_startposy = 4;
								}
								this.game.scene.start('buildingConstruct', {
									Address: this.game.Address,
									targetPos: this.game.targetPos,
									socket: this.game.socket,
									buildingId: _buildingId,
									sizex: _sizex,
									sizey: _sizey,
									startposx: _startposx,
									startposy: _startposy,
									buildingInfo: this.game.buildingInfo,
									NFTData: this.game.NFTData,
									sfx: this.game.sfx,
									buildingType: _buildingType
								});
							}
						}, this);

						this.game.destroyBtn.on('pointerup', (pointer) => {
							for (let i = 0; i < this.game.buildingGroup.children.entries.length; i++) {
								if (this.game.buildingGroup.children.entries[i].sno == this.game.destroyBtn.sno) {
									this.game.adsAddBtn.visible = false;
									this.game.destroyBtn.visible = false;
									this.game.linkBtn.visible = false;
									this.game.enterBtn.visible = false;
									this._setGrid(this.game.buildingGroup.children.entries[i], this.game.buildingGroup.children.entries[i].bulType);
									if (this.game.buildingGroup.children.entries[i].name == 'Billboard' && this.game.buildingGroup.children.entries[i].advertisement != undefined)
										this.game.buildingGroup.children.entries[i].advertisement.destroy();
									if (this.game.buildingGroup.children.entries[i].advertisement_background != undefined)
										this.game.buildingGroup.children.entries[i].advertisement_background.destroy();
									this.game.buildingGroup.children.entries[i].destroy();
									this.game.socket.emit('building_destroy', this.game.destroyBtn.sno, this.game.Address);
								}
							}
							this.game.clickedcontrol = false;
						}, this);
					}
					pointedflag = 0;
				}
			}
			else if (this.game.mode == 'buildingConstruct') {
				if (this.pos == this.game.targetPos) {
					if (pointedflag == 0 && this.game.clickedpanel == true && this.game.currentBuilding.canBuild == true) {
						var buildingType = this.game.groundcount + this.game.roadcount + parseInt(this.game.currentBuilding.buildingType, 10) - 1;
						this.addBuilding(buildingType);
					}

					else if (pointedflag != 1 && this.game.clickedpanel == false && this.alpha == 1) {
						this.game.buildingSelected = true;
						pointedflag = 0;

						if (this.game.prevControlBtn == this.sno)
							this.game.controlBtnState = false;
						else
							this.game.controlBtnState = true;

						if (this.game.controlBtnState == true) {
							this._showControlButton(this.game.mode, bulType);
							this.game.prevControlBtn = this.sno;
						}

						this.game.destroyBtn.on('pointerup', (pointer) => {
							for (let i = 0; i < this.game.buildingGroup.children.entries.length; i++) {
								if (this.game.buildingGroup.children.entries[i].sno == this.game.destroyBtn.sno) {
									this.game.destroyBtn.visible = false;
									this._setGrid(this.game.buildingGroup.children.entries[i], this.game.buildingGroup.children.entries[i].bulType);
									this.game.buildingGroup.children.entries[i].destroy();
									this.game.socket.emit('furniture_destroy', this.game.buildingId, this.game.destroyBtn.sno);
								}
							}
							this.game.clickedcontrol = false;
						}, this);
					}
					pointedflag = 0;
				}
			}
			else if (this.game.mode == 'view') {
				if (pointedflag != 1) {
					for (let i = 0; i < this.game.buildingGroup.children.entries.length; i++) {
						if (this.game.buildingGroup.children.entries[i].sno == this.sno) {
							if (this.name == 'Night Club') {
								const _address = this.game.Address;
								const _pos = this.game.buildingGroup.children.entries[i].pos;
								const _sno = this.sno;
								store.dispatch(loadBuildingInfo(_address, _pos, bulType, _sno));
							}
							else if (this.name == 'Billboard') {
								const res = await axios.get(env.SERVER_URL + '/api/placement/get_url?address=' + this.game.Address + '&pos=' + this.game.buildingGroup.children.entries[i].pos + '&sno=' + this.sno);
								if (res || res.data.result) {
									const url = res.data.data;
									if (url != '')
										window.open(url, '_blank');
								}
							}
							else if(this.name == 'Small house' || this.name == 'Medium house' || this.name == 'Mansion') {
								this._showControlButton(this.game.mode, bulType);
								this.game.prevControlBtn = this.sno;
							}
						}
					}

					this.game.enterBtn.on('pointerup', (pointer) => {
						if (this.game.isdouble == false) {
							this.game.isdouble = true;
							this.game.enterFlag = true;

							let _buildingId = this.game.enterBtn.id;
							let _sizex = this.game.enterBtn.sizex;
							let _sizey = this.game.enterBtn.sizey;
							let _buildingType = this.game.enterBtn.name;
							let _startposx;
							let _startposy;
							if (_buildingType == 'Small house') {
								_startposx = 1;
								_startposy = 2;
							}
							else if (_buildingType == 'Medium house') {
								_startposx = 1;
								_startposy = 2;
							}
							else if (_buildingType == 'Mansion') {
								_startposx = 1;
								_startposy = 3;
							}
							this.game.socket.emit("buildingEntered", this.game.playerInfo.accountId, this.game.Address);
							this.game.scene.start('HouseInside', {
								Address: this.game.Address,
								targetPos: this.game.targetPos,
								socket: this.game.socket,
								buildingId: _buildingId,
								sizex: _sizex,
								sizey: _sizey,
								startposx: _startposx,
								startposy: _startposy,
								buildingInfo: this.game.buildingInfo,
								NFTData: this.game.NFTData,
								sfx: this.game.sfx,
								buildingType: _buildingType
							});
						}
					}, this);
				}
				pointedflag = 0;
			}
		}, this);
	}

	_convertID(sno) {
		var ID = "tile_";
		var i = Math.floor(sno / this.game.mapsizey);
		var j = sno % this.game.mapsizey;
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

	/**
	 * Set grid
	 */
	_setGrid(building, bulType) {
		let splited = this.game.buildingInfo[bulType].size.split('*');
		let sizex = parseInt(splited[0], 10);
		let sizey = parseInt(splited[1], 10);

		let posx = Math.floor(building.sno / this.game.mapsizey);
		let posy = building.sno % this.game.mapsizey;

		for (let i = 0; i < sizey; i++) {
			for (let j = 0; j < sizex; j++) {
				let tileID = this._getTileID(posx - i, posy - j);
				this.game[tileID].isEmpty = true;
				this.game[tileID].currentBuildingType = 0;
				this.game[tileID].type = 0;
			}
		}

		// delete element of building depth array
		for (let i = 0; i < this.game.buildingArray.length; i++) {
			if (this.game.buildingArray[i].buildingInfo.sno == building.sno)
				this.game.buildingArray.splice(i, 1);
		}

		let depthValue = 1;
		for (let i = 0; i < this.game.buildingArray.length; i++) {
			this.game.buildingArray[i].depth = depthValue;
			depthValue += 2;
		}
	}

	add() {
		this.game.add.existing(this);
		this.game.UICam.ignore(this);
		this.setOrigin(0.5, 1);
		this.alpha = 0.5;
		this.setDepth(1000);
		this.game.isBuildingSelected = true;

		let pointedflag = 0;
		this.on('pointermove', (pointer) => {
			if (this.game.isBuildingSelected == true) {
				this.game.currentBuilding.setTint(0x2d2d2d);
				this.game.currentBuilding.canBuild = false;
			}
			if (pointer.isDown) {
				pointedflag = 1;
			}
		}, this);

		this.on('pointerup', (pointer) => {
			if (this.game.mode == 'construction') {
				if (pointedflag == 0 && this.game.clickedpanel == true && this.game.currentBuilding.canBuild == true) {
					var buildingType = parseInt(this.game.currentBuilding.buildingType, 10);
					this.addBuilding(buildingType);
				}
				else if (pointedflag != 1 && this.game.clickedpanel == false && this.alpha == 1) {
					this.game.buildingSelected = true;
					pointedflag = 0;

					if (this.game.prevControlBtn == this.sno)
						this.game.controlBtnState = false;
					else
						this.game.controlBtnState = true;

					if (this.game.controlBtnState == true) {
						this._showControlButton(this.game.mode, this.buildingType);
						this.game.prevControlBtn = this.sno;
					}

					this.game.enterBtn.on('pointerup', (pointer) => {
						if (this.game.isdouble == false) {
							this.game.isdouble = true;

							store.dispatch(setSceneName("buildingConstruct"));

							let _buildingId = this.game.enterBtn.id;
							let _sizex = this.game.enterBtn.sizex;
							let _sizey = this.game.enterBtn.sizey;
							let _buildingType = this.game.enterBtn.name;
							let _startposx;
							let _startposy;
							if (_buildingType == 'Small house') {
								_startposx = 0;
								_startposy = 3;
							}
							else if (_buildingType == 'Medium house') {
								_startposx = 0;
								_startposy = 3;
							}
							else if (_buildingType == 'Mansion') {
								_startposx = 0;
								_startposy = 4;
							}
							this.game.scene.start('buildingConstruct', {
								Address: this.game.Address,
								targetPos: this.game.targetPos,
								socket: this.game.socket,
								buildingId: _buildingId,
								sizex: _sizex,
								sizey: _sizey,
								startposx: _startposx,
								startposy: _startposy,
								buildingInfo: this.game.buildingInfo,
								NFTData: this.game.NFTData,
								sfx: this.game.sfx,
								buildingType: _buildingType
							});
						}
					}, this);

					this.game.destroyBtn.on('pointerup', (pointer) => {
						for (let i = 0; i < this.game.buildingGroup.children.entries.length; i++) {
							if (this.game.buildingGroup.children.entries[i].sno == this.game.destroyBtn.sno) {
								this.game.adsAddBtn.visible = false;
								this.game.destroyBtn.visible = false;
								this.game.enterBtn.visible = false;
								this._setGrid(this.game.buildingGroup.children.entries[i], this.game.buildingGroup.children.entries[i].buildingType);
								if (this.game.buildingGroup.children.entries[i].name == 'Billboard' && this.game.buildingGroup.children.entries[i].advertisement != undefined)
									this.game.buildingGroup.children.entries[i].advertisement.destroy();
								if (this.game.buildingGroup.children.entries[i].advertisement_background != undefined)
									this.game.buildingGroup.children.entries[i].advertisement_background.destroy();
								this.game.buildingGroup.children.entries[i].destroy();
								this.game.socket.emit('building_destroy', this.game.destroyBtn.sno, this.game.Address);
							}
						}
						this.game.clickedcontrol = false;
					}, this);
				}
				pointedflag = 0;
			}
			else if (this.game.mode == 'buildingConstruct') {
				if (pointedflag == 0 && this.game.clickedpanel == true && this.game.currentBuilding.canBuild == true) {
					var buildingType = parseInt(this.game.currentBuilding.buildingType, 10);
					this.addBuilding(buildingType);
				}
				else if (pointedflag != 1 && this.game.clickedpanel == false && this.alpha == 1) {
					this.game.buildingSelected = true;
					pointedflag = 0;

					if (this.game.prevControlBtn == this.sno)
						this.game.controlBtnState = false;
					else
						this.game.controlBtnState = true;

					if (this.game.controlBtnState == true) {
						this._showControlButton(this.game.mode, this.buildingType);
						this.game.prevControlBtn = this.sno;
					}

					this.game.destroyBtn.on('pointerup', (pointer) => {
						for (let i = 0; i < this.game.buildingGroup.children.entries.length; i++) {
							if (this.game.buildingGroup.children.entries[i].sno == this.game.destroyBtn.sno) {
								this.game.destroyBtn.visible = false;
								this._setGrid(this.game.buildingGroup.children.entries[i], this.game.buildingGroup.children.entries[i].bulType);
								this.game.buildingGroup.children.entries[i].destroy();
								this.game.socket.emit('furniture_destroy', this.game.buildingId, this.game.destroyBtn.sno);
							}
						}
						this.game.clickedcontrol = false;
					}, this);
				}
				pointedflag = 0;
			}
		}, this);
	}

	_setLevelData(sno, building_type) {
		var i = Math.floor(sno / this.game.mapsizey);
		var j = sno % this.game.mapsizey;

		this.game.levelData.levelArr_2_2[i][j] = building_type;
		// view mode
		if (this.game.mode == 'view')
			this.game.levelArr[i][j] = building_type;
	}

	addBuilding(building_type) {
		this.game.clickedpanel = false;

		let posx = Math.floor(this.sno / this.game.mapsizey);
		let posy = this.sno % this.game.mapsizey;

		this.game.currentBuilding.tileID = this.game._getTileID(posx, posy);

		if (this.game.buildingInfo[building_type].size == '2*2') {
			var ID1 = this.convertID(this.sno);
			var ID2 = this.convertID(this.sno - 1);
			var ID3 = this.convertID(this.sno - this.game.mapsizey);
			var ID4 = this.convertID(this.sno - this.game.mapsizey - 1);
			this._setLevelData(this.sno, building_type);
			this._setLevelData(this.sno - 1, building_type);
			this._setLevelData(this.sno - this.game.mapsizey, building_type);
			this._setLevelData(this.sno - this.game.mapsizey - 1, building_type);
			this.game['tile_' + ID1].currentBuildingType = building_type;
			this.game['tile_' + ID2].currentBuildingType = building_type;
			this.game['tile_' + ID3].currentBuildingType = building_type;
			this.game['tile_' + ID4].currentBuildingType = building_type;

			this.game.currentBuilding.buildingType = building_type;
			this.game.buildingGroup.add(this.game.currentBuilding);
			this.game.currentBuilding.placeOnGround(this.x, this.y - this.game.tileHeight / 2, this.sno);
		}
		else {
			this._setLevelData(this.sno, building_type);
			this.currentBuildingType = building_type;
			this.game.currentBuilding.buildingType = building_type;
			this.game.buildingGroup.add(this.game.currentBuilding);
			this.game.currentBuilding.placeOnGround(this.x, this.y - this.game.tileHeight / 2, this.sno);
		}
	}

	followMouse() {
		this.game.children.bringToTop(this);
		if (this.type == 'building') {
			if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount - 1].size == '9*11') {
				this.x = this.game.input.mousePointer.worldX + 64;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount - 1].size == '7*8') {
				this.x = this.game.input.mousePointer.worldX + 40;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount - 1].size == '4*5') {
				this.x = this.game.input.mousePointer.worldX + 40;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount - 1].size == '1*2') {
				this.x = this.game.input.mousePointer.worldX + 73 / 2;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount - 1].size == '2*1') {
				this.x = this.game.input.mousePointer.worldX - this.game.tileWidth / 4;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else {
				this.x = this.game.input.mousePointer.worldX;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
		}
		else if (this.type == 'object') {
			if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount + this.game.buildingcount - 1].size == '1*2') {
				this.x = this.game.input.mousePointer.worldX + 73 / 2;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount + this.game.buildingcount - 1].size == '2*1') {
				this.x = this.game.input.mousePointer.worldX - this.game.tileWidth / 4;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else {
				this.x = this.game.input.mousePointer.worldX;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
		}
		else if (this.type == 'furniture') {
			if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount + this.game.buildingcount + this.game.objectcount - 1].size == '9*11') {
				this.x = this.game.input.mousePointer.worldX + 64;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount + this.game.buildingcount + this.game.objectcount - 1].size == '7*8') {
				this.x = this.game.input.mousePointer.worldX + 40;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount + this.game.buildingcount + this.game.objectcount - 1].size == '1*2') {
				this.x = this.game.input.mousePointer.worldX + 73 / 2;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else if (this.game.buildingInfo[this.buildingType + this.game.roadcount + this.game.groundcount + this.game.buildingcount + this.game.objectcount - 1].size == '2*1') {
				this.x = this.game.input.mousePointer.worldX - this.game.tileWidth / 4;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
			else {
				this.x = this.game.input.mousePointer.worldX;
				this.y = this.game.input.mousePointer.worldY + 40;
			}
		}
		else {
			this.x = this.game.input.mousePointer.worldX;
			this.y = this.game.input.mousePointer.worldY + 40;
		}
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

	async _setDepth() {
		let _x = Math.floor(this.sno / this.game.mapsizey);
		let _y = this.sno % this.game.mapsizey;

		let splited = this.game.buildingInfo[this.buildingType].size.split('*');
		let sizex = parseInt(splited[0], 10);
		let sizey = parseInt(splited[1], 10);

		let buildingPos = {
			x: _x,
			y: _y,
			sizex: sizex,
			sizey: sizey,
			buildingInfo: this,
			depth: 0
		}
		this.game.buildingArray.push(buildingPos);

		let sortedByYArray = this._sort(this.game.buildingArray);

		let depth = 1;
		for (let i = 0; i < sortedByYArray.length; i++) {
			sortedByYArray[i].depth = depth;
			depth += 2;
		}
		this.game.buildingArray = sortedByYArray;
	}

	async placeOnTile(x, y, sno) {
		this.game.clickedpanel = false;

		if (this.game.buildingInfo[this.buildingType].size == '1*2') {
			this.x = x + this.game.tileHeight / 2;
			this.y = y + this.game.tileHeight / 2;
		}
		else if (this.game.buildingInfo[this.buildingType].size == '2*1') {
			this.x = x - this.game.tileWidth / 4;
			this.y = y + this.game.tileHeight / 2;
		}
		else if (this.game.buildingInfo[this.buildingType].size == '2*2') {
			this.x = x;
			this.y = y + this.game.tileHeight / 2;
		}
		else if (this.game.buildingInfo[this.buildingType].size == '9*11') {
			this.x = x + 64;
			this.y = y + this.game.tileHeight / 2;
		}
		else if (this.game.buildingInfo[this.buildingType].size == '7*8') {
			this.x = x + 35;
			this.y = y + this.game.tileHeight / 2;
		}
		else if (this.game.buildingInfo[this.buildingType].size == '4*5') {
			this.x = x + 35;
			this.y = y + this.game.tileHeight / 2;
		}
		else {
			this.x = x;
			this.y = y + this.game.tileHeight / 2;
		}

		this.game.currentBuilding = undefined;
		this.game.isBuildingSelected = false;
		this.sno = sno;

		await this._setDepth();

		if (this.game.buildingInfo[this.buildingType].type == 'building' || this.game.buildingInfo[this.buildingType].type == 'object' || this.game.buildingInfo[this.buildingType].type == 'furniture') {
			for (let i = 0; i < this.game.buildingArray.length; i++) {
				for (let j = 0; j < this.game.buildingGroup.children.entries.length; j++) {
					if (this.game.buildingGroup.children.entries[j].sno == this.game.buildingArray[i].buildingInfo.sno) {
						this.game.buildingGroup.children.entries[j].setDepth(this.game.buildingArray[i].depth);
						if (this.game.buildingGroup.children.entries[j].advertisement != undefined) {
							this.game.buildingGroup.children.entries[j].advertisement_background.setDepth(this.game.buildingArray[i].depth - 1);
							this.game.buildingGroup.children.entries[j].advertisement.setDepth(this.game.buildingArray[i].depth - 1);
						}
						this.depthValue = this.game.buildingArray[i].depth;
					}
				}
			}
		}
		else {
			this.setDepth(0);
			this.depthValue = 0;
		}

		if (this.game.buildingInfo[this.buildingType].type == "building") {
			this._setInteractive(this.buildingType);
			this._setBuilding();
		}
		else if (this.game.buildingInfo[this.buildingType].type == "furniture") {
			this._setInteractive(this.buildingType);
			this._setHouse();
		}
		else {
			this.alpha = 1;
			this._setInteractive(this.buildingType);
			this._setRoad();
		}
		for (let i = 0; i < this.game.buildingGroup.children.entries.length; i++)
			this.game.buildingGroup.children.entries[i].setInteractive();
	}

	placeOnGround(x, y, sno) {
		this.x = x;
		this.y = y + this.game.tileHeight / 2;

		this.sno = sno;

		if (this.game.buildingInfo[this.buildingType].size == '2*2')
			this.setDepth((this.sno / this.game.mapsizey + this.sno % this.game.mapsizey) + 1);
		else
			this.setDepth((this.sno / this.game.mapsizey + this.sno % this.game.mapsizey) + 2);

		var shape = new Phaser.Geom.Ellipse(this.width / 2, this.height / 2, this.width - 50, this.height - 20);

		this._setBuilding();
		this.game.currentBuilding = undefined;
		this.game.isBuildingSelected = false;
	}

	_setRoad() {
		let building = {
			address: this.game.Address,
			pos: this.game.targetPos,
			sno: this.sno,
			type: this.buildingType,
			built: true,
			remaintime: 0,
			ads: ''
		}
		this.game.socket.emit("setRoad", building);
	}

	_setBuilding() {
		let built;
		if (store.getState().scene.buildingimages[this.buildingType].buildtime == 0)
			built = true;
		else
			built = false;
		let building = {
			address: this.game.Address,
			pos: this.game.targetPos,
			sno: this.sno,
			type: this.buildingType,
			built: built,
			remaintime: store.getState().scene.buildingimages[this.buildingType].buildtime,
			ads: ''
			//			owner: this.game.walletid
		}
		this.game.socket.emit("setBuilding", building);
		if (store.getState().scene.buildingimages[this.buildingType].buildtime != 0) {
			this._createTimeText(building);

			this.game.socket.on("buildingTime", async (building) => {
				//Time remaining in seconds
				var timeRemaining = building.remaintime;
				//Convert seconds into minutes and seconds
				var minutes = Math.floor(timeRemaining / 60);
				var seconds = Math.floor(timeRemaining) - (60 * minutes);
				//Display minutes, add a 0 to the start if less than 10
				var result = (minutes < 10) ? "0" + minutes : minutes;
				//Display seconds, add a 0 to the start if less than 10
				result += (seconds < 10) ? ":0" + seconds : ":" + seconds;
				for (let i = 0; i < this.game.timeLabelGroup.children.entries.length; i++) {
					if (building.sno == this.game.timeLabelGroup.children.entries[i].getData('sno'))
						this.game.timeLabelGroup.children.entries[i].text = result;
				}
			});
		}
	}

	_setHouse() {
		let building = {
			buildingId: this.game.buildingId,
			address: this.game.Address,
			pos: this.game.targetPos,
			sno: this.sno,
			type: this.buildingType,
			built: true
		}

		this.game.socket.emit("setHouse", building);
	}

	_createTimeText(building) {
		let timeLabel = this.game.add.text(this.x, this.y - this.game.tileHeight / 2, "00:" + building.remaintime, { font: "20px Arial", fill: "#fff" });
		timeLabel.setPosition(this.x - timeLabel.width / 2, this.y - this.game.tileHeight / 2);
		timeLabel.align = 'center';
		timeLabel.setData('sno', building.sno);
		this.game.timeLabelGroup.add(timeLabel);
	}
} /*class*/

export default Building;