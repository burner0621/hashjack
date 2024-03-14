import BuildingTile from "./sprites/buildingTile";

class BuildingInsideTiles {

  constructor(game) {

    this.game = game;
    this.initialize();
  }
  initialize() {
    this.tilesCount = 0;
    this.isoMetric = true;
  }

  addTiles() {
    var type;
    var x;
    var y;

    var w = this.game.tileWidth; // 128
    var h = this.game.tileHeight; // 73

    var startX;
    var startY;
    var mapsizex;
    var angle = 30 * Math.PI / 180;
    
    if (this.game.mode == 'buildingInside') {
      startX = 500 + w/2;
      startY = 1080 - h/2;
      mapsizex = this.game.mapsizex + 1;
    }
    else if (this.game.mode == 'buildingConstruct') {
      if (this.game.buildingType == 'Small house')
        startY = 1085 + h/2;
      else if (this.game.buildingType == 'Medium house')
        startY = 1080 + h/4;
      else if (this.game.buildingType == 'Mansion')
        startY = 1080;
      startX = 500;
      mapsizex = this.game.mapsizex;
    }
    else if (this.game.mode == 'HouseInside') {
      if (this.game.buildingType == 'Small house')
        startY = 1085;
      else if (this.game.buildingType == 'Medium house')
        startY = 1080 - h/4;
      else if (this.game.buildingType == 'Mansion')
        startY = 1080 - h/2;
      startX = 502 + w/2;

      mapsizex = this.game.mapsizex + 1;
    }

    for (var j = 0; j < mapsizex; j++) {
      if (j > 0) {
        startX = startX - w/2;
        startY = startY + h/2;
      }
      for (var i = 0; i < this.game.mapsizey; i++) {
        x = startX + i * h * Math.cos(angle);
        y = startY + i * h * Math.sin(angle);
        if (this.game.mode == 'buildingInside')
          type = this.game.levelData.levelArr_building_inside[j][i];
        else if (this.game.mode == 'buildingConstruct') {
          if (this.game.buildingType == 'Small house')
            type = this.game.levelData.levelArr_small_house_construct[j][i];
          else if (this.game.buildingType == 'Medium house')
            type = this.game.levelData.levelArr_medium_house_construct[j][i];
          else if (this.game.buildingType == 'Mansion')
            type = this.game.levelData.levelArr_mansion_construct[j][i];
        }
        else if (this.game.mode == 'HouseInside') {
          if (this.game.buildingType == 'Small house')
            type = this.game.levelData.levelArr_small_house_view[j][i];
          else if (this.game.buildingType == 'Medium house')
            type = this.game.levelData.levelArr_medium_house_view[j][i];
          else if (this.game.buildingType == 'Mansion')
            type = this.game.levelData.levelArr_mansion_view[j][i];
        }
        this.addTile(x, y, type, i, j);
      }
    }
  }/* addTiles */

  addTile(x, y, type, i, j) {
    var tile = new BuildingTile(this.game, x, y, type);

    tile.m = i;
    tile.n = j;
    var tileId;

    tile.sno = this.tilesCount;
    this.tilesCount++;

    if (tile.n >= 0 && tile.n < 10)
      tileId = '0' + tile.n.toString();
    else
      tileId = tile.n.toString();
    if (tile.m >= 0 && tile.m < 10)
      tileId += '0' + tile.m.toString();
    else
      tileId += tile.m.toString();
    this.game['tile_' + tileId] = tile;
    if (j == 0 && i == this.game.mapsizey - 1)
      this.game['tile_' + tileId].visible = false;
  }
} /*class*/

export default BuildingInsideTiles;