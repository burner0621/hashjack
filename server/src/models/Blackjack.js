const mongoose = require('mongoose');
const BlackjackSchema = new mongoose.Schema({
  accountId: { type: String, default: "" },
  chain: { type: String, default: "Hedera" },
  depositedAmount: { type: Number, default: 0 },
  allDepositedAmount: { type: Number, default: 0 },
  earningAmount: { type: Number, default: 0 },
  fee: { type: Number, default: 0 },
  win_count: { type: Number, default: 0 },
  lose_count: { type: Number, default: 0 },
  standoff_count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = Blackjack = mongoose.model('Blackjack', BlackjackSchema);
