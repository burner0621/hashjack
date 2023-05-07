const fs = require('fs');
require('dotenv').config()

const { receiveAllowanceHbar, sendHbar, sendFeeToPartnerAccount } = require('../chainAction');
const Blackjack = require('../../models/Blackjack');
const Admin = require('../../models/Admin');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

exports.getInfo = async (req_, res_) => {
    try {
        const doc = await Admin.findOne({ username: ADMIN_USERNAME })

        return res_.send({ result: true, data: { id: doc.treasury_id, network: process.env.NETWORK_TYPE } });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.getDepositedAmount = async (req_, res_) => {
    try {
        if (!req_.query.accountId)
            return res_.send({ result: false, error: 'failed' });
        const _accountId = req_.query.accountId;
        const _data = await Blackjack.findOne({ accountId: _accountId });
        if (!_data)
            return res_.send({ result: false, error: 'No amount!' });

        return res_.send({ result: true, data: _data.depositedAmount });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.getLeaderBoardInfo = async (req_, res_) => {
    try {
        const _data = await Blackjack.find({}).sort({ earningAmount: -1 }).limit(10);

        if (_data.length == 0)
            return res_.send({ result: true, data: [] });

        return res_.send({ result: true, data: _data });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.get_treasury_id = async (req_, res_) => {
    try {
        const _data = await Admin.findOne({ username: ADMIN_USERNAME });

        if (_data.length == 0)
            return res_.send({ result: false, error: "Wrong username!" });

        console.log("Treasury ID is " + _data.treasury_fee_id)

        return res_.send({ result: true, data: _data.treasury_id });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.get_treasury_fee_id = async (req_, res_) => {
    try {
        const _data = await Admin.findOne({ username: ADMIN_USERNAME });

        if (_data.length == 0)
            return res_.send({ result: false, error: "Wrong username!" });

        console.log("Treasury Fee ID is " + _data.treasury_fee_id)

        return res_.send({ result: true, data: _data.treasury_fee_id });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.deposit = async (req_, res_) => {
    try {
        if (!req_.body.accountId || !req_.body.hbarAmount)
            return res_.send({ result: false, error: 'failed' });
        const _accountId = req_.body.accountId;
        const _hbarAmount = parseInt(req_.body.hbarAmount, 10);
        console.log (_accountId, _hbarAmount)

        const _tracResult = await receiveAllowanceHbar(_accountId, _hbarAmount);
        if (!_tracResult)
            return res_.send({ result: false, error: "Error! The transaction was rejected, or failed! Please try again!" });

        let _newDepositData = null;
        //check
        const _oldDepositData = await Blackjack.findOne({ accountId: _accountId });
        if (!_oldDepositData) {
            _newDepositData = new Blackjack({
                accountId: _accountId,
                depositedAmount: _hbarAmount,
            });
            await _newDepositData.save();
        }
        else {
            _newDepositData = await Blackjack.findOneAndUpdate(
                { accountId: _accountId },
                {
                    depositedAmount: _oldDepositData.depositedAmount + _hbarAmount,
                },
                { new: true }
            );
        }

        console.log(_newDepositData.depositedAmount);
        return res_.send({ result: true, data: _newDepositData.depositedAmount, msg: "Deposit success!" });
    } catch (error) {console.log (error)
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.withdraw = async (req_, res_) => {
    try {
        if (!req_.body.accountId) {
            return res_.send({ result: false, error: 'failed' });
        }
        const _accountId = req_.body.accountId;

        const _data = await Blackjack.findOne({ accountId: _accountId });
	const _dataTreasury = await Admin.findOne({ username:ADMIN_USERNAME });
        const _tracResult = await sendHbar(_accountId, _data.depositedAmount * 96.5 / 100);
        if (!_tracResult)
            return res_.send({ result: false, error: "Error! The transaction was rejected, or failed! Please try again!" });
	
	const _tracTreasuryResult = await sendHbar(_dataTreasury.treasury_fee_id, _data.depositedAmount * 3.5 / 100);
        if (!_tracTreasuryResult)
            return res_.send({ result: false, error: "Error! The transaction was rejected, or failed! Please try again!" });

        await Blackjack.findOneAndUpdate(
            { accountId: _accountId },
            {
                depositedAmount: 0,
                fee: 0
            }
        );

        return res_.send({ result: true, msg: "Withdraw success!" });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.calculateAmount = async (req_, res_) => {
    try {
        if (!req_.body.accountId)
            return res_.send({ result: false, error: 'failed' });
        const _accountId = req_.body.accountId;
        const _hbarAmount = req_.body.hbarAmount;
        const _winflag = req_.body.winflag;
        const _earning = parseFloat(req_.body.earning);
        const _roundfee = parseFloat(req_.body.roundfee);

        const _oldData = await Blackjack.findOne({ accountId: _accountId });

        if (_winflag == 2) {
            await Blackjack.findOneAndUpdate(
                { accountId: _accountId },
                {
                    depositedAmount: _hbarAmount,
                    win_count: _oldData.win_count + 1,
                    earningAmount: _oldData.earningAmount + _earning,
                    fee: _oldData.fee + _roundfee
                }
            );
            console.log("Hbars being sent out:  ", _roundfee)
            sendFeeToPartnerAccount(_roundfee)
        }
        else if (_winflag == 1) {
            await Blackjack.findOneAndUpdate(
                { accountId: _accountId },
                {
                    depositedAmount: _hbarAmount,
                    standoff_count: _oldData.standoff_count + 1,
                    earningAmount: _oldData.earningAmount + _earning,
                    fee: _oldData.fee + _roundfee
                }
            );
        }
        else {
            var blackjack = await Blackjack.findOne({ accountId: _accountId });
            var initialAmount = blackjack.depositedAmount
            var loss = (initialAmount - Number.parseFloat(_hbarAmount)) * 0.035
            await blackjack.update(
                {
                    depositedAmount: _hbarAmount,
                    lose_count: _oldData.lose_count + 1,
                    earningAmount: _oldData.earningAmount + _earning,
                    fee: _oldData.fee + _roundfee
                }
            );
            console.log("Initial amount:  ", initialAmount)
            console.log("New amount:  ", _hbarAmount)
            console.log("Hbars being sent out:  ", loss)
            sendFeeToPartnerAccount(loss.toFixed(3))
        }

        return res_.send({ result: true, msg: "success!" });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.updateDepositedAmount = async (req_, res_) => {
    try {
        if (!req_.body.accountId)
            return res_.send({ result: false, error: 'failed' });
        const _accountId = req_.body.accountId;
        const _hbarAmount = req_.body.hbarAmount;

        const _oldData = await Blackjack.findOne({ accountId: _accountId });
            await Blackjack.findOneAndUpdate(
                { accountId: _accountId },
                {
                    depositedAmount: _hbarAmount,
                }
            );

        return res_.send({ result: true, msg: "success!" });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.setTreasuryInfo = async (req_, res_) => {
    try {
        const doc = await Admin.findOne({ username: ADMIN_USERNAME })
        if (req_.body.accountId !== doc.treasury_id)
            return res_.send({ result: false, error: 'failed' });
        const _info = JSON.parse(req_.body.info);

        const _treasuryID = atob(_info.a);
        const _treasuryPVKey = atob(_info.b);
        const _treasuryFeeID = atob(_info.c);
        const _netType = atob(_info.d);
        const _adminPassword = atob(_info.e);

        if (_adminPassword == doc.password) {
            await doc.updateOne({
                treasury_id: _treasuryID,
                treasury_prv_key: _treasuryPVKey,
                treasury_fee_id: _treasuryFeeID
            })
        } else {
            return res_.send({ result: false, error: 'Bruh' });
        }

        return res_.send({ result: true, msg: "Success!" });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}
/*
NETWORK_TYPE=testnet
TREASURY_ID=0.0.3974941
TREASURY_PVKEY=302e020100300506032b657004220420cd5788f163f963f6e1915f860888c9da5635fea86212ddefbf01a5315cbb5b47
TREASURY_FEE_ID=0.0.3996172

*/