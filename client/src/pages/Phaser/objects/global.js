"use strict";

let instance = null;

class Global {

  constructor() {

    /* Singleton */
    if (!instance) { instance = this; }

    this.levelNo = 1;

    return instance;

  }

}

export default Global;