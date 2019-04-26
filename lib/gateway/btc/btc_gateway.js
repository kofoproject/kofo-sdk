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

    async createLockTx({amount, fee, settlementId, hValue, lockTime, receiverPubKey, senderPubKey, adminPubKey}) {
        return await this.post(GATEWAY_PATH.CREATE_LOCK_TX, {
            amount,
            settlementId,
            hValue,
            lockTime,
            receiverPubKey,
            senderPubKey,
            adminPubKey
        });
    }

    async sendLockTx({rawTransaction, scriptHash, senderPubKey, settlementId, senderAmount, signList, matureConfirms = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_LOCK_TX, {
            rawTransaction,
            scriptHash,
            senderPubKey,
            senderAmount,
            matureConfirms,
            settlementId,
            signList
        });
    }

    async createWithdrawTx({scriptHash, receiverPubKey, adminPubKey, isAdmin, settlementId, fee}) {
        return await this.post(GATEWAY_PATH.CREATE_WITHDRAW_TX, {
            scriptHash,
            receiverPubKey,
            adminPubKey,
            isAdmin,
            settlementId,
            fee
        });
    }

    async sendWithdrawTx({rawTransaction, preimage, receiverPubKey, adminPubKey, isAdmin, settlementId, signList, matureConfirms = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_WITHDRAW_TX, {
            rawTransaction,
            preimage,
            receiverPubKey,
            adminPubKey,
            isAdmin,
            settlementId,
            signList,
            matureConfirms
        });
    }

    async createRefundTx({scriptHash, senderPubKey, adminPubKey, isAdmin, settlementId, fee}) {
        return await this.post(GATEWAY_PATH.CREATE_REFUND_TX, {
            scriptHash,
            senderPubKey,
            adminPubKey,
            isAdmin,
            settlementId,
            fee
        });
    }

    async sendRefundTx({rawTransaction, senderPubKey, adminPubKey, isAdmin, settlementId, signList, matureConfirms = CONFIRM_THRESHOLD.BTC}) {
        return await this.post(GATEWAY_PATH.SEND_REFUND_TX, {
            rawTransaction,
            senderPubKey,
            adminPubKey,
            isAdmin,
            settlementId,
            signList,
            matureConfirms
        });
    }
}

module.exports = BtcGateway;