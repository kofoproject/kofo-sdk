const Connection = require("../../connection/connection");
const {GATEWAY_PATH, CONFIRM_THRESHOLD} = require("../../common/constant");

class HPBGateway extends Connection {
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
            amount,
            settlementId,
            hvalue,
            lockTime,
            receiver,
            sender
        });
    }

    async sendLockTx({settlementId, signedRawTransaction, lockId, confirmThreshold = CONFIRM_THRESHOLD.HPB}) {
        return await this.post(GATEWAY_PATH.SEND_LOCK_TX, {
            settlementId,
            signedRawTransaction,
            lockId,
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

    async sendWithdrawTx({settlementId, signedRawTransaction, confirmThreshold = CONFIRM_THRESHOLD.HPB}) {
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

    async sendRefundTx({settlementId, signedRawTransaction, confirmThreshold = CONFIRM_THRESHOLD.HPB}) {
        return await this.post(GATEWAY_PATH.SEND_REFUND_TX, {
            signedRawTransaction,
            settlementId,
            confirmThreshold
        });
    }

    async createApproveTx({sender, amount, settlementId}) {
        return await this.post(GATEWAY_PATH.CREATE_APPROVE_TX, {
            sender,
            amount,
            settlementId
        });
    }

    async sendApproveTx({settlementId, signedRawTransaction, confirmThreshold = CONFIRM_THRESHOLD.HPB}) {
        return await this.post(GATEWAY_PATH.SEND_APPROVE_TX, {
            settlementId,
            signedRawTransaction,
            confirmThreshold
        });
    }

}

module.exports = HPBGateway;