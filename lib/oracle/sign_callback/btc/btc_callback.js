const Oracle = require('../../oracle');
const {NOTICE_TYPE} = require('../../../common/constant');
const {cacheKeysMapping} = require('../../../mapping/mapping');

/**
 * Provides BTC with Hash lock, Withdraw, Refund, Approve signature callback handler
 */
class BtcSignatureCallback extends Oracle {

    constructor() {
        let args = Array.prototype.slice.apply(arguments);
        super(...args);
    }

    /**
     * @description  Maker and Taker submit hash lock transaction signature callback handler
     * @param roleEnum MAKER | TAKER
     * @param settlementId Settlement order Id
     * @param signedRawTransaction Transaction signed returned hash
     * @returns {Promise<void | never>}
     */
    async hashLockTxSignCallback(roleEnum, settlementId, signedRawTransaction) {
        const _self = this;
        const {lockTxHashKey, submitHashLockTxKey, settlementInfoKey, submitHashLockTxLockerKey} = cacheKeysMapping(settlementId, roleEnum);
        let settlementInfo = await _self.readData(settlementInfoKey);
        if (!settlementInfo) {
            throw new TypeError(`Not read cache data  ${roleEnum} settlement info flow ${settlementInfoKey}`);
        }
        const {chain, currency, amount, pubKey, confirmThreshold} = _self.formatSettlement(roleEnum, settlementInfo);
        let lockTx = await _self.readData(submitHashLockTxKey);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, amount, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        let lockTxHash;
        try {
            const {lockId, rawTransaction, nLockNum} = lockTx;
            const gatewayProvider = _self.getGatewayProvider(chain, currency);
            lockTxHash = await gatewayProvider.sendLockTx({
                rawTransaction,
                scriptHash: lockId,
                senderPubKey: pubKey,
                senderAmount: amount,
                matureConfirms: confirmThreshold,
                settlementId,
                signList: signedRawTransaction
            });

            const {transactionId: txHash} = lockTxHash;
            //Submitted hash lock message notify
            _statusNotice_(NOTICE_TYPE.SUBMIT_HASH_LOCK, {lockTx, lockTxHash: txHash});

            await _self.insertData(lockTxHashKey, lockTxHash);
            await _self.settlementProvider.submitHashLockCallback(chain, roleEnum, settlementId, lockId, rawTransaction, txHash, nLockNum, null);

            //Success hash lock message notify
            _statusNotice_(NOTICE_TYPE.SUCCESS_HASH_LOCK, {lockTx, lockTxHash: txHash});
            await _self.insertData(submitHashLockTxLockerKey, true);
        } catch (err) {
            await _self.insertData(submitHashLockTxLockerKey, false);

            //Failed hash lock message notify
            _statusNotice_(NOTICE_TYPE.FAIL_HASH_LOCK, {
                lockTx,
                lockTxHash: lockTxHash ? lockTxHash.transactionId : null
            });

            //clear hash lock tx
            await _self.insertData(submitHashLockTxKey, null);
            throw  err;
        }

    }

    /**
     * @description  Maker and Taker submit withdraw transaction signature callback handler
     * @param roleEnum MAKER | TAKER
     * @param settlementId Settlement order Id
     * @param signedRawTransaction Transaction signed returned hash
     * @returns {Promise<void | never>}
     */
    async withdrawTxSignCallback(roleEnum, settlementId, signedRawTransaction) {
        const _self = this;

        const {withdrawTxHashKey, settlementInfoKey, submitWithdrawTxKey, submitWithdrawTxLockerKey, submitHashLockTxKey, preImageKey} = cacheKeysMapping(settlementId, roleEnum);
        const settlementInfo = await _self.readData(settlementInfoKey);
        const {lockId} = await _self.readData(submitHashLockTxKey);
        const withdrawTx = await _self.readData(submitWithdrawTxKey);
        const preimage = await _self.readData(preImageKey);

        if (!settlementInfo) {
            throw new TypeError(`Not read cache data  ${roleEnum} settlement info flow ${settlementInfoKey}`);
        }
        const {oppositeChain: chain, oppositeCurrency: currency, counterChainPubKey: pubKey, oppositeConfirmThreshold: confirmThreshold, oppositeAdminPubKey: adminPubKey} = _self.formatSettlement(roleEnum, settlementInfo);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, lockId, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        let withdrawTxHash;
        try {
            let {rawTransaction} = withdrawTx;
            const gatewayProvider = _self.getGatewayProvider(chain, currency);
            withdrawTxHash = await gatewayProvider.sendWithdrawTx({
                rawTransaction,
                preimage,
                receiverPubKey: pubKey,
                adminPubKey,
                isAdmin: false,
                settlementId,
                matureConfirms: confirmThreshold,
                signList: signedRawTransaction
            });
            await _self.insertData(withdrawTxHashKey, withdrawTxHash);

            const {transactionId: txHash} = withdrawTxHash;
            //Submitted withdraw tx message notify
            _statusNotice_(NOTICE_TYPE.SUBMIT_WITHDRAW, {withdrawTx, withdrawTxHash: txHash});


            await _self.settlementProvider.submitWithdrawCallback(chain, roleEnum, txHash, settlementId);

            //Success withdraw tx message notify
            _statusNotice_(NOTICE_TYPE.SUCCESS_WITHDRAW, {withdrawTx, withdrawTxHash: txHash});
            await _self.insertData(submitWithdrawTxLockerKey, true);
        } catch (err) {
            await _self.insertData(submitWithdrawTxLockerKey, false);

            //failed withdraw tx message notify
            _statusNotice_(NOTICE_TYPE.FAIL_WITHDRAW, {
                withdrawTx,
                withdrawTxHash: withdrawTxHash ? withdrawTxHash.transactionId : null
            });
            await _self.insertData(submitWithdrawTxKey, null);
            throw  err;
        }
    }

    /**
     * @description  Maker and Taker submit refund transaction signature callback handler
     * @param roleEnum MAKER | TAKER
     * @param settlementId Settlement order Id
     * @param signedRawTransaction Transaction signed returned hash
     * @returns {Promise<void | never>}
     */
    async refundTxSignCallback(roleEnum, settlementId, signedRawTransaction) {
        const _self = this;
        const {settlementInfoKey, refundTxHashKey, submitRefundTxKey, submitRefundTxLockerKey, submitHashLockTxKey} = cacheKeysMapping(settlementId, roleEnum);
        const settlementInfo = await _self.readData(settlementInfoKey);
        const {lockId} = await _self.readData(submitHashLockTxKey);
        const refundTx = await _self.readData(submitRefundTxKey);

        if (!settlementInfo) {
            throw new TypeError(`Not read cache data ETH ${roleEnum} settlement info flow ${settlementInfoKey}`);
        }
        const {chain, currency, pubKey, confirmThreshold, adminPubKey} = _self.formatSettlement(roleEnum, settlementInfo);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, lockId, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };
        let refundTxHash;
        try {
            const gatewayProvider = _self.getGatewayProvider(chain, currency);
            let {rawTransaction} = refundTx;
            refundTxHash = await gatewayProvider.sendRefundTx({
                rawTransaction,
                senderPubKey: pubKey,
                adminPubKey,
                isAdmin: false,
                settlementId,
                matureConfirms: confirmThreshold,
                signList: signedRawTransaction
            });
            await _self.insertData(refundTxHashKey, refundTxHash);

            const {txHash} = refundTxHash;
            //submitted refund tx message notify
            _statusNotice_(NOTICE_TYPE.SUBMIT_REFUND, {refundTx, refundTxHash: txHash});

            await _self.settlementProvider.submitRefundCallback(chain, roleEnum, settlementId, txHash);

            //success refund tx message notify
            _statusNotice_(NOTICE_TYPE.SUCCESS_REFUND, {refundTx, refundTxHash: txHash});
            await _self.insertData(submitRefundTxLockerKey, true);
        } catch (err) {
            await _self.insertData(submitRefundTxLockerKey, false);

            //success refund tx message notify
            _statusNotice_(NOTICE_TYPE.FAIL_REFUND, {
                refundTx,
                refundTxHash: refundTxHash ? refundTxHash.txHash : null
            });

            await _self.insertData(submitRefundTxKey, null);
            throw  err;
        }
    }
}

module.exports = BtcSignatureCallback;