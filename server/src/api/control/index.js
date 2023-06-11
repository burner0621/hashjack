const express = require('express');
const router = express.Router();
const Blackjack = require("./controller");

router.get('/get_deposited_amount', Blackjack.getDepositedAmount);
router.get('/get_leaderboard_info', Blackjack.getLeaderBoardInfo);
router.get('/get_info', Blackjack.getInfo);
router.get('/get_treasury_id', Blackjack.get_treasury_id);
router.get('/get_treasury_fee_id', Blackjack.get_treasury_fee_id);
router.get('/update_device_number', Blackjack.updateDeviceNumber);

router.post('/deposit', Blackjack.deposit);
router.post('/withdraw', Blackjack.withdraw);
router.post('/end_round', Blackjack.calculateAmount);
router.post('/update', Blackjack.updateDepositedAmount);
router.post('/set', Blackjack.setTreasuryInfo);
router.post('/sitDown', Blackjack.sitDown);
router.post('/exitBtn', Blackjack.exitBtn);

module.exports = router;
