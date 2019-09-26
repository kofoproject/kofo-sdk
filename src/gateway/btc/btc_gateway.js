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

    async createLockTx({settlementId, amount, sender, receiver, hvalue, lockTime, admin, fee}) {
        return await this.post(GATEWAY_PATH.CREATE_LOCK_TX, {
            settlementId,
            amount,
            sender,
            receiver,
            hValue: hvalue,
            lockTime,
            admin,
            fee
        });
    }

    async sendLockTx({rawTransaction, lockId, pubKey, settlementId, amount, signedRawTransaction}) {
        return await this.post(GATEWAY_PATH.SEND_LOCK_TX, {
            settlementId,
            scriptHash: lockId,
            rawTransaction,
            signList: signedRawTransaction,
            senderPubKey: pubKey,
            senderAmount: amount
        });
    }

    async createWithdrawTx({lockId, sender, admin, isAdmin, settlementId, fee, bizFee}) {
        return await this.post(GATEWAY_PATH.CREATE_WITHDRAW_TX, {
            settlementId,
            scriptHash: lockId,
            receiver: sender,
            admin,
            isAdmin,
            fee,
            bizFee
        });
    }

    async sendWithdrawTx({rawTransaction, preimage, pubKey, settlementId, signedRawTransaction}) {
        return await this.post(GATEWAY_PATH.SEND_WITHDRAW_TX, {
            settlementId,
            rawTransaction,
            signList: signedRawTransaction,
            preimage,
            pubKey
        });
    }

    async createRefundTx({lockId, sender, admin, isAdmin, settlementId, fee}) {
        return await this.post(GATEWAY_PATH.CREATE_REFUND_TX, {
            scriptHash: lockId,
            sender,
            admin,
            isAdmin,
            settlementId,
            fee
        });
    }

    async sendRefundTx({rawTransaction, pubKey, settlementId, signedRawTransaction}) {
        return await this.post(GATEWAY_PATH.SEND_REFUND_TX, {
            settlementId,
            rawTransaction,
            signList: signedRawTransaction,
            pubKey
        });
    }
}

module.exports = BtcGateway;