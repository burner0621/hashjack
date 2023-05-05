const mongoose = require('mongoose');
const LeaderBoardSchema = new mongoose.Schema({
  accountId: { type: String, default: "" },
  chain: { type: String, default: "Hedera" },
  earningHbar: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = LeaderBoard = mongoose.model('LeaderBoard', LeaderBoardSchema);
