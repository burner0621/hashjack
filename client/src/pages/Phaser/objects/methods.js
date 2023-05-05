"use strict";

class Methods {

  constructor(game) {

    this.game = game;
  }

  cartesianToIsometric(cart) {

    var tPoint = {};
    tPoint.x = cart.x - cart.y;
    tPoint.y = (cart.x + cart.y)/2;
    return tPoint;
 }

 isometricToCartesian(iso) {

    var tPoint = {};
    tPoint.x = (2*iso.y + iso.x)/2;
    tPoint.y = (2*iso.y - iso.x)/2;
    return tPoint;
 }
 
 onHit(x1,y1,x2,y2)
 {
   var dx = x2-x1;
   var dy = y2-y1;
   var dist = Math.sqrt(dx * dx + dy * dy);

   return (dist <= 70);
 }

} /*class*/

export default Methods;