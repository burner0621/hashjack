require('dotenv').config('../../../env');
const {
  Client,
  AccountId,
  PrivateKey,
  TokenId,
  TransactionId,
  TransferTransaction,
  TokenAssociateTransaction,
  Hbar,
  NftId,
  AccountAllowanceApproveTransaction,
} = require('@hashgraph/sdk');

const axios = require('axios');
const Admin = require('../models/Admin');

const HBAR_DECIMAL = 100000000;
const PAL_TOKEN_ID = '0.0.1182820'
const palDecimals = 8;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

exports.receiveAllowanceHbar = async (sender, hbarAmount) => {console.log (sender, hbarAmount)
  const doc = await Admin.findOne({ username: ADMIN_USERNAME })
  const operatorId = AccountId.fromString(doc.treasury_id.trim());
  const operatorKey = PrivateKey.fromString(doc.treasury_prv_key.trim());
  let client;
  if (doc.nettype == "testnet")
    client = Client.forTestnet().setOperator(operatorId, operatorKey);
  else
    client = Client.forMainnet().setOperator(operatorId, operatorKey);
  try {
    const sendHbarBal = new Hbar(hbarAmount); // Spender must generate the TX ID or be the client

    const nftSendTx = new TransferTransaction()
      .addApprovedHbarTransfer(AccountId.fromString(sender), sendHbarBal.negated())
      .addHbarTransfer(operatorId, sendHbarBal);

    nftSendTx.setTransactionId(TransactionId.generate(operatorId)).freezeWith(client);
    const nftSendSign = await nftSendTx.sign(operatorKey);
    const nftSendSubmit = await nftSendSign.execute(client);
    const nftSendRx = await nftSendSubmit.getReceipt(client);
    if (nftSendRx.status._code != 22)
      return false;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

exports.sendHbar = async (receiverId, amount) => {
  const doc = await Admin.findOne({ username: ADMIN_USERNAME })
  const operatorId = AccountId.fromString(doc.treasury_id);
  const operatorKey = PrivateKey.fromString(doc.treasury_prv_key);
  let client;
  if (doc.nettype == "testnet")
    client = Client.forTestnet().setOperator(operatorId, operatorKey);
  else
    client = Client.forMainnet().setOperator(operatorId, operatorKey);
  const sendHbarBal = new Hbar(amount);

  try {
    const transferTx = await new TransferTransaction()
      .addHbarTransfer(operatorId, sendHbarBal.negated())
      .addHbarTransfer(AccountId.fromString(receiverId), sendHbarBal)
      .freezeWith(client)
      .sign(operatorKey);
    const transferSubmit = await transferTx.execute(client);
    const transferRx = await transferSubmit.getReceipt(client);

    if (transferRx.status._code !== 22)
      return false;

    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
}


exports.sendFeeToPartnerAccount = async (feeAmount) => {
  const doc = await Admin.findOne({ username: ADMIN_USERNAME })
  const operatorId = AccountId.fromString(doc.treasury_id);
  const operatorKey = PrivateKey.fromString(doc.treasury_prv_key);
  const partnerAccountId = AccountId.fromString(doc.treasury_fee_id);
  let client;
  if (doc.nettype == "testnet")
    client = Client.forTestnet().setOperator(operatorId, operatorKey);
  else
    client = Client.forMainnet().setOperator(operatorId, operatorKey);
  const amount = new Hbar(feeAmount);

  try {
    const transferTx = await new TransferTransaction()
      .addHbarTransfer(operatorId, amount.negated())
      .addHbarTransfer(partnerAccountId, amount)
      .freezeWith(client)
      .sign(operatorKey);
    const transferSubmit = await transferTx.execute(client);
    const transferRx = await transferSubmit.getReceipt(client);

    if (transferRx.status._code !== 22)
      return false;

    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
}
