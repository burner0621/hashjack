const express = require('express');
const router = express.Router();

const Control = require("./control");

router.use("/control", Control);

module.exports = router;
