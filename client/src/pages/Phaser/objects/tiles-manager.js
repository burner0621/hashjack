import Tile from "./sprites/tile";

class TilesManager {

  constructor(game, pos) {

    this.game = game;
    this.targetPos = pos;
    this.initialize();
  }
  initialize()
  {
    this.tilesCount = 0;
    this.isoMetric = true;
  }

  addTiles(Address)
  {
/*    var ads = Address.split("-");
    var city = ads[0].split("_")[1];
    var street = ads[1];
    var port = ads[2];*/

    var type;
    var x;
    var y;

    var w = this.game.tileWidth; // 128
    var h = this.game.tileHeight; // 73
    var levelArr = this.game.levelData.levelArr;

    var startX = 1000 + 133; //sidebar_width plus
    var startY = 100;
    var angle = 30*Math.PI/180;
    var originx = startX;
    var originy = startY;

    for(var l = 1;l <= 3;l++) {
      startX = originx + 64;
      startY = originy - h/2;
      for (var k = 1;k <= 3;k++) {
        startX = startX - 64;
        startY = startY + h/2;
        for (var j = 0; j < this.game.mapsizex; j++)
        {
          if(k == 1 && j == 1 && i == this.game.mapsizey) {
            originx = startX + this.game.mapsizey * h * Math.cos(angle);
            originy = startY + this.game.mapsizey * h * Math.sin(angle);
          }
          if(j > 0)
          {
            startX = startX - 64;
            startY = startY + h/2;
          }
          for (var i = 0; i < this.game.mapsizey; i++) {
            x = startX + i * h * Math.cos(angle);
            y = startY + i * h * Math.sin(angle);
            type = this.game.levelData.levelArr_2_2[j][i];
            if(i < 12 && j < 12)  //Grand Land
              this.addTile(x,y,type,i,j,'1', l, k);
            else if(i >= 12 && j < 6) //Big Land
              this.addTile(x,y,type,i,j,'2', l, k);
            else if(i >= 12 && j < 12) //Big Land
              this.addTile(x,y,type,i,j,'3', l, k);
            else if(i < 4 && j >= 12) //Medium Land
              this.addTile(x,y,type,i,j,'4', l, k);
            else if(i >= 4 && i < 8 && j >= 12) //Medium Land
              this.addTile(x,y,type,i,j,'5', l, k);
            else if(i >= 8 && i < 12 && j >= 12) //Medium Land
              this.addTile(x,y,type,i,j,'6', l, k);
            else if(i >= 12 && i < 16 && j >= 12 && j < 15) //Small Land
              this.addTile(x,y,type,i,j,'7', l, k);
            else if(i >= 16 && j >= 12 && j < 15) //Small Land
              this.addTile(x,y,type,i,j,'8', l, k);
            else if(i >= 12 && i < 16 && j >= 15) //Small Land
              this.addTile(x,y,type,i,j,'9', l, k);
            else if(i >= 16 && j >= 15) //Small Land
              this.addTile(x,y,type,i,j,'10', l, k);
          }
        }
      }
    }

  }/* addTiles */

  addTile(x,y,type,i,j, position_string, l, k)
  {
    var tile = new Tile(this.game,x,y,type,position_string, l, k, this.targetPos);

    tile.m = i;
    tile.n = j;

//      var tileId = tile.n.toString() + tile.m.toString();
    if(l == 2 && k == 2) {
      var tileId;

      tile.sno = this.tilesCount;
      this.tilesCount++;

      if(tile.n >= 0 && tile.n < 10)
        tileId = '0' + tile.n.toString();
      else
        tileId = tile.n.toString();
      if(tile.m >= 0 && tile.m < 10)
        tileId += '0' + tile.m.toString();
      else
        tileId += tile.m.toString();
//      tile.alpha = 0.9;
      this.game['tile_'+tileId] = tile;
    }
    else {
      tile.setTint(0x2d2d2d);
    }
  }
} /*class*/

export default TilesManager;