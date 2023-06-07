import React, { Component } from 'react';
import Phaser from 'phaser';
import Preload from "./Preload";
import Map from "./Map";
import SinglePlace from "./SinglePlace";
import GameView from "./GameView";
import BuildingInside from './BuildingInside';
import BuildingConstruct from './BuildingConstruct';
import HouseInside from './HouseInside';

class Game extends Component {
  // Build the Game class
  componentDidMount() {
    const config = {
      type: Phaser.WEBGL,
      parent: 'render-game',
      scale: {
        mode: Phaser.Scale.RESIZE
      },
      physics: {
        default: 'arcade',
        arcade:
        {
          debug: false,
          gravity: { y: 0 },
        },

      },
      fps: {
        target: 60,
      },
      dom: {
        createContainer: false
      },
      render: {
        imageSmoothingEnabled: false,
        transparent: false,
      },
      loader: {
        crossOrigin: "anonymous"
      },
      autoFocus: true,
      width: window.innerWidth,
      height: window.innerHeight,
      setting: this.props.gamename,
      scene: [Preload, Map, SinglePlace, GameView, BuildingInside, BuildingConstruct, HouseInside],
      mysocket: this.props.socket
    };

    this.game = new Phaser.Game(config);
    this.game.config.mysocket = this.props.socket;
  };

  render() {
    return <div id='render-game' />
  };
};

export default Game;