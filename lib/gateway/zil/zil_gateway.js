const Connection = require("../../connection/connection");
const {GATEWAY_PATH, CONFIRM_THRESHOLD} = require("../../common/constant");


class ZilGateway extends Connection {
    constructor(options) {
        super(options);
    }


    async getBalance(address) {
        return await this.post(GATEWAY_PATH.BALANCE, {
            address,
        });
    }

    async createLockTx({amount, settlementId, hvalue, lockTime, receiverPubKey, senderPubKey}) {
        return await this.post(GATEWAY_PATH.CREATE_LOCK_TX, {
            amount,
            settlementId,
            hvalue,
            lockTime,
            receiverPubKey,
            senderPubKey
        });
    }

    async sendLockTx({settlementId, signedRawTransaction, lockId, confirmThreshold = CONFIRM_THRESHOLD.ZIL}) {
        return await this.post(GATEWAY_PATH.SEND_LOCK_TX, {
            settlementId,
            signedRawTransaction,
            lockId,
            confirmThreshold
        });
    }

    async createWithdrawTx({settlementId, senderPubKey, lockId, preimage}) {
        return await this.post(GATEWAY_PATH.CREATE_WITHDRAW_TX, {
            settlementId,
            senderPubKey,
            lockId,
            preimage
        });
    }

    async sendWithdrawTx({settlementId, signedRawTransaction, confirmThreshold = CONFIRM_THRESHOLD.ZIL}) {
        return await this.post(GATEWAY_PATH.SEND_WITHDRAW_TX, {
            signedRawTransaction,
            settlementId,
            confirmThreshold
        });
    }

    async createRefundTx({settlementId, lockId, senderPubKey}) {
        return await this.post(GATEWAY_PATH.CREATE_REFUND_TX, {
            settlementId,
            lockId,
            senderPubKey
        });
    }

    async sendRefundTx({settlementId, signedRawTransaction, confirmThreshold = CONFIRM_THRESHOLD.ZIL}) {
        return await this.post(GATEWAY_PATH.SEND_REFUND_TX, {
            signedRawTransaction,
            settlementId,
            confirmThreshold
        });

    }

}

module.exports = ZilGateway;