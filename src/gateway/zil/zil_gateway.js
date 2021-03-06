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

    async createLockTx({amount, settlementId, hvalue, lockTime, receiver, sender}) {
        return await this.post(GATEWAY_PATH.CREATE_LOCK_TX, {
            settlementId,
            amount,
            hvalue,
            lockTime,
            receiver,
            sender
        });
    }

    async sendLockTx({settlementId, signedRawTransaction, lockId, confirmThreshold = CONFIRM_THRESHOLD.ZIL}) {
        return await this.post(GATEWAY_PATH.SEND_LOCK_TX, {
            settlementId,
            lockId,
            signedRawTransaction,
            confirmThreshold
        });
    }

    async createWithdrawTx({settlementId, sender, lockId, preimage}) {
        return await this.post(GATEWAY_PATH.CREATE_WITHDRAW_TX, {
            settlementId,
            sender,
            lockId,
            preimage
        });
    }

    async sendWithdrawTx({settlementId, signedRawTransaction, confirmThreshold = CONFIRM_THRESHOLD.ZIL}) {
        return await this.post(GATEWAY_PATH.SEND_WITHDRAW_TX, {
            settlementId,
            signedRawTransaction,
            confirmThreshold
        });
    }

    async createRefundTx({settlementId, lockId, sender}) {
        return await this.post(GATEWAY_PATH.CREATE_REFUND_TX, {
            settlementId,
            lockId,
            sender
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