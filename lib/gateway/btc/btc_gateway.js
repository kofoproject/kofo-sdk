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

    async createLockTx({amount, fee, settlementId, hValue, lockTime, receiverPubKey, senderPubKey, adminPubKey, isSegWitAddress = false}) {
        return await this.post(GATEWAY_PATH.CREATE_LOCK_TX, {
            amount,
            settlementId,
            hValue,
            lockTime,
            receiverPubKey,
            senderPubKey,
            adminPubKey,
            isSegWitAddress
        });
    }

    async sendLockTx({rawTransaction, scriptHash, senderPubKey, settlementId, senderAmount, signList, isSegWitAddress = false, matureConfirms = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_LOCK_TX, {
            rawTransaction,
            scriptHash,
            senderPubKey,
            senderAmount,
            matureConfirms,
            settlementId,
            signList,
            isSegWitAddress
        });
    }

    async createWithdrawTx({scriptHash, receiverPubKey, adminPubKey, isAdmin, settlementId, fee, bizFee, isSegWitAddress = false}) {
        return await this.post(GATEWAY_PATH.CREATE_WITHDRAW_TX, {
            scriptHash,
            receiverPubKey,
            adminPubKey,
            isAdmin,
            settlementId,
            fee,
            bizFee,
            isSegWitAddress
        });
    }

    async sendWithdrawTx({rawTransaction, preimage, receiverPubKey, adminPubKey, isAdmin, settlementId, signList, isSegWitAddress = false, matureConfirms = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_WITHDRAW_TX, {
            rawTransaction,
            preimage,
            receiverPubKey,
            adminPubKey,
            isAdmin,
            settlementId,
            signList,
            matureConfirms,
            isSegWitAddress
        });
    }

    async createRefundTx({scriptHash, senderPubKey, adminPubKey, isAdmin, settlementId, fee, isSegWitAddress = false}) {
        return await this.post(GATEWAY_PATH.CREATE_REFUND_TX, {
            scriptHash,
            senderPubKey,
            adminPubKey,
            isAdmin,
            settlementId,
            fee,
            isSegWitAddress
        });
    }

    async sendRefundTx({rawTransaction, senderPubKey, adminPubKey, isAdmin, settlementId, signList, isSegWitAddress = false, matureConfirms = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_REFUND_TX, {
            rawTransaction,
            senderPubKey,
            adminPubKey,
            isAdmin,
            settlementId,
            signList,
            matureConfirms,
            isSegWitAddress
        });
    }
}

module.exports = BtcGateway;