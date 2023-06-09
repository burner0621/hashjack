import Phaser from 'phaser';

//store
import store from "../../../../store";
//action
import { showFriendInfoDlg, getInviteState } from '../../../../actions/friendinfo';

class Player extends Phaser.GameObjects.Sprite {

	constructor(scene, playerInfo, tileId, n, m, mode) {
		let x = 0;
		let y = 0;
		if (mode == "view") {
			x = playerInfo.x;
			y = playerInfo.y;
		}
		else if (mode == "buildingInside" || mode == "HouseInside") {
			x = playerInfo.buildingInsideInfo.x;
			y = playerInfo.buildingInsideInfo.y;
		}
		super(scene, x, y, 'avatar', 10);

		this.game = scene;
		this.playerInfo = playerInfo;
		this.tileId = tileId;
		if (mode == "view") {
			this.x = playerInfo.x;
			this.y = playerInfo.y;
		}
		else if (mode == "buildingInside") {
			this.x = playerInfo.buildingInsideInfo.x;
			this.y = playerInfo.buildingInsideInfo.y;
		}

		this.m = m;
		this.n = n;
		this.bubblecreated = 0;
		this.emojicreated = 0;
		//timer
		this.bubbleFirstTimer = undefined;
		this.bubbleSecondTimer = undefined;
		this.emojiFirstTimer = undefined;
		this.emojiSecondTimer = undefined;
		this.dancingTimer = undefined;
		this.bubbleWidth = 150;
		this.bubbleHeight = 70;

		this.emoji = '';
		this.emojiContent = undefined;

		this.walkFlag = false;
		this.isdancing = playerInfo.isdancing;
		this.leftdancing = false;
		this.rightdancing = false;
		this.movingFlag = false;
		this.pathXY = [];

		this.initialize();
	}
	initialize() {
		this.add();
		this.addEvents();
	}
	add() {
		this.game.add.existing(this);
		this.isSelected = true;

		this.bubble = undefined;
		this.chatContent = undefined;
	}

	addEvents() {
		this.setInteractive({ useHandCursor: true });
		this.on('pointerup', this.onPlayerClick, this);
	}
	onPlayerClick() {
		store.dispatch(showFriendInfoDlg(this.playerInfo.accountId));
		store.dispatch(getInviteState(this.game.player.playerInfo.accountId, this.playerInfo.accountId));
		if (this.game.isBuildingSelected === true) { return; }
		if (this.game.mapTweenFlag === true) { return; }

		this.isSelected = true;
	}
}

export default Player;