const Connection = require("../../connection/connection");
const {GATEWAY_PATH, CONFIRM_THRESHOLD} = require("../../common/constant");

class BtcGateway extends Connection {
    constructor(options) {
        super(options);
    }

    async getBalance(address) {
        return await this.post(GATEWAY_PATH.BALANCE, {
            address,
        });
    }

    async createLockTx({settlementId, amount, sender, receiver, hvalue, lockTime, adminPubKey, fee, isSegWitAddress = false}) {
        return await this.post(GATEWAY_PATH.CREATE_LOCK_TX, {
            settlementId,
            amount,
            senderPubKey: sender,
            receiverPubKey: receiver,
            hValue: hvalue,
            lockTime,
            adminPubKey,
            fee,
            isSegWitAddress
        });
    }

    async sendLockTx({rawTransaction, lockId, sender, settlementId, amount, signedRawTransaction, isSegWitAddress = false, confirmThreshold = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_LOCK_TX, {
            settlementId,
            scriptHash: lockId,
            rawTransaction,
            signList: signedRawTransaction,
            senderPubKey: sender,
            senderAmount: amount,
            matureConfirms: confirmThreshold,
            isSegWitAddress
        });
    }

    async createWithdrawTx({lockId, sender, adminPubKey, isAdmin, settlementId, fee, bizFee, isSegWitAddress = false}) {
        return await this.post(GATEWAY_PATH.CREATE_WITHDRAW_TX, {
            settlementId,
            scriptHash: lockId,
            receiverPubKey: sender,
            adminPubKey,
            isAdmin,
            fee,
            bizFee,
            isSegWitAddress
        });
    }

    async sendWithdrawTx({rawTransaction, preimage, receiver, adminPubKey, isAdmin, settlementId, signedRawTransaction, isSegWitAddress = false, confirmThreshold = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_WITHDRAW_TX, {
            settlementId,
            rawTransaction,
            signList: signedRawTransaction,
            preimage,
            receiverPubKey: receiver,
            adminPubKey,
            isAdmin,
            matureConfirms: confirmThreshold,
            isSegWitAddress
        });
    }

    async createRefundTx({lockId, sender, adminPubKey, isAdmin, settlementId, fee, isSegWitAddress = false}) {
        return await this.post(GATEWAY_PATH.CREATE_REFUND_TX, {
            scriptHash: lockId,
            senderPubKey: sender,
            adminPubKey,
            isAdmin,
            settlementId,
            fee,
            isSegWitAddress
        });
    }

    async sendRefundTx({rawTransaction, sender, adminPubKey, isAdmin, settlementId, signedRawTransaction, isSegWitAddress = false, confirmThreshold = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_REFUND_TX, {
            settlementId,
            rawTransaction,
            signList: signedRawTransaction,
            senderPubKey: sender,
            adminPubKey,
            isAdmin,
            matureConfirms: confirmThreshold,
            isSegWitAddress
        });
    }
}

module.exports = BtcGateway;