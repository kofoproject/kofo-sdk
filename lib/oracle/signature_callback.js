const BaseOracle = require('./base');
const {NOTICE_TYPE} = require('../common/constant');
const {cacheKeysMapping} = require('../mapping/mapping');

/**
 * Provides BTC with Hash lock, Withdraw, Refund, Approve signature callback handler
 */
class BtcSignatureCallback extends BaseOracle {

    constructor() {
        let args = Array.prototype.slice.apply(arguments);
        super(...args);
    }

    /**
     * @description  Maker and Taker submit hash lock transaction signature callback handler
     * @param roleEnum MAKER | TAKER
     * @param settlementId Settlement order Id
     * @param signedRawTransaction Transaction signed returned hash
     * @param pubKey Transaction sign public,  BTC required
     * @returns {Promise<void | never>}
     */
    async hashLockTxSignCallback(roleEnum, settlementId, signedRawTransaction, pubKey = '') {
        const _self = this;
        const {lockTxHashKey, submitHashLockTxKey, settlementInfoKey, submitHashLockTxLockerKey} = cacheKeysMapping(settlementId, roleEnum);
        let settlementInfo = await _self.readData(settlementInfoKey);
        let lockTx = await _self.readData(submitHashLockTxKey);
        if (!settlementInfo || !lockTx) {
            await _self.insertData(submitHashLockTxLockerKey, false);
            throw new TypeError(`${roleEnum} ${settlementInfo.chain} send hash lock transaction error, not read cache data settlementInfo=${!!settlementInfo} lockTx=${!!lockTx} flow settlementInfoKey=${settlementInfoKey}`);
        }
        const {chain, currency, amount, confirmThreshold} = _self.formatSettlement(roleEnum, settlementInfo);
        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, amount, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };
        let lockTxHash;
        try {
            const {lockId, rawTransaction, nLockNum = null, nlockDate = null} = lockTx;
            const gatewayProvider = _self.getGatewayProvider(chain, currency);
            let sendLockTx = {
                settlementId,
                lockId,
                rawTransaction,
                signedRawTransaction,
                confirmThreshold,
                amount,
                pubKey   //only btc need, value is public key.
            };
            _statusNotice_(NOTICE_TYPE.SUBMIT_HASH_LOCK, {sendLockTx});
            lockTxHash = await gatewayProvider.sendLockTx(sendLockTx);
            const {transactionId, txHash} = lockTxHash;
            await _self.insertData(lockTxHashKey, lockTxHash);
            await _self.settlementProvider.submitHashLockCallback(chain, roleEnum, settlementId, lockId, rawTransaction, txHash || transactionId, nLockNum, nlockDate);
            _statusNotice_(NOTICE_TYPE.SUCCESS_HASH_LOCK, {lockTx, lockTxHash: txHash || transactionId});
            await _self.insertData(submitHashLockTxLockerKey, true);
        } catch (err) {
            await _self.insertData(submitHashLockTxLockerKey, false);
            await _self.insertData(submitHashLockTxKey, null);
            _statusNotice_(NOTICE_TYPE.FAIL_HASH_LOCK, {
                lockTx,
                lockTxHash: lockTxHash ? (lockTxHash.transactionId || lockTxHash.txHash) : null
            });
            throw  err;
        }
    }

    /**
     * @description  Maker and Taker submit withdraw transaction signature callback handler
     * @param roleEnum MAKER | TAKER
     * @param settlementId Settlement order Id
     * @param signedRawTransaction Transaction signed returned hash
     * @param pubKey Transaction sign public,  BTC required
     * @returns {Promise<void | never>}
     */
    async withdrawTxSignCallback(roleEnum, settlementId, signedRawTransaction, pubKey = '') {
        const _self = this;
        const {withdrawTxHashKey, settlementInfoKey, submitWithdrawTxKey, submitWithdrawTxLockerKey, submitHashLockTxKey, preImageKey} = cacheKeysMapping(settlementId, roleEnum);
        const settlementInfo = await _self.readData(settlementInfoKey);
        const {lockId} = await _self.readData(submitHashLockTxKey);
        const withdrawTx = await _self.readData(submitWithdrawTxKey);
        const preimage = await _self.readData(preImageKey);

        if (!settlementInfo || !withdrawTx) {
            await _self.insertData(submitWithdrawTxLockerKey, false);
            throw new TypeError(`${roleEnum} ${settlementInfo.chain} send withdraw transaction error, not read cache data settlementInfo=${!!settlementInfo} withdrawTx=${!!withdrawTx} flow settlementInfoKey=${settlementInfoKey}`);
        }
        const {oppositeChain: chain, oppositeCurrency: currency, oppositeConfirmThreshold: confirmThreshold} = _self.formatSettlement(roleEnum, settlementInfo);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, lockId, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        let withdrawTxHash;
        try {
            let {rawTransaction} = withdrawTx;
            const gatewayProvider = _self.getGatewayProvider(chain, currency);
            let sendWithdrawTx = {
                settlementId,
                rawTransaction,
                signedRawTransaction,
                confirmThreshold,
                preimage,   //only btc need
                pubKey      //only btc need, value is public key.
            };
            _statusNotice_(NOTICE_TYPE.SUBMIT_WITHDRAW, {sendWithdrawTx});

            withdrawTxHash = await gatewayProvider.sendWithdrawTx(sendWithdrawTx);
            await _self.insertData(withdrawTxHashKey, withdrawTxHash);
            let txHash = withdrawTxHash.transactionId ? withdrawTxHash.transactionId : withdrawTxHash.txHash;
            await _self.settlementProvider.submitWithdrawCallback(chain, roleEnum, txHash, settlementId);
            _statusNotice_(NOTICE_TYPE.SUCCESS_WITHDRAW, {withdrawTx, withdrawTxHash: txHash});
            await _self.insertData(submitWithdrawTxLockerKey, true);
        } catch (err) {
            await _self.insertData(submitWithdrawTxLockerKey, false);
            await _self.insertData(submitWithdrawTxKey, null);

            _statusNotice_(NOTICE_TYPE.FAIL_WITHDRAW, {
                withdrawTx,
                withdrawTxHash: withdrawTxHash ? (withdrawTxHash.transactionId || withdrawTxHash.txHash) : null
            });
            throw  err;
        }
    }

    /**
     * @description  Maker and Taker submit refund transaction signature callback handler
     * @param roleEnum MAKER | TAKER
     * @param settlementId Settlement order Id
     * @param signedRawTransaction Transaction signed returned hash
     * @param pubKey Transaction sign public, BTC required
     * @returns {Promise<void | never>}
     */
    async refundTxSignCallback(roleEnum, settlementId, signedRawTransaction, pubKey = '') {
        const _self = this;
        const {settlementInfoKey, refundTxHashKey, submitRefundTxKey, submitRefundTxLockerKey, submitHashLockTxKey} = cacheKeysMapping(settlementId, roleEnum);
        const settlementInfo = await _self.readData(settlementInfoKey);
        const {lockId} = await _self.readData(submitHashLockTxKey);
        const refundTx = await _self.readData(submitRefundTxKey);

        if (!settlementInfo || !refundTx) {
            await _self.insertData(submitRefundTxLockerKey, false);
            throw new TypeError(`${roleEnum} ${settlementInfo.chain} send refund transaction error, not read cache data settlementInfo=${!!settlementInfo} refundTx=${!!refundTx} flow settlementInfoKey=${settlementInfoKey}`);
        }
        const {chain, currency, confirmThreshold} = _self.formatSettlement(roleEnum, settlementInfo);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, lockId, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };
        let refundTxHash;
        try {
            const gatewayProvider = _self.getGatewayProvider(chain, currency);
            let {rawTransaction} = refundTx;

            let sendRefundTx = {
                settlementId,
                rawTransaction,
                signedRawTransaction,
                confirmThreshold,
                pubKey
            };
            _statusNotice_(NOTICE_TYPE.SUBMIT_REFUND, {sendRefundTx});
            refundTxHash = await gatewayProvider.sendRefundTx(sendRefundTx);
            await _self.insertData(refundTxHashKey, refundTxHash);
            let txHash = refundTxHash.transactionId || refundTxHash.txHash;
            await _self.settlementProvider.submitRefundCallback(chain, roleEnum, settlementId, txHash);
            _statusNotice_(NOTICE_TYPE.SUCCESS_REFUND, {refundTx, refundTxHash: txHash});
            await _self.insertData(submitRefundTxLockerKey, true);
        } catch (err) {
            await _self.insertData(submitRefundTxLockerKey, false);
            await _self.insertData(submitRefundTxKey, null);
            _statusNotice_(NOTICE_TYPE.FAIL_REFUND, {
                refundTx,
                refundTxHash: refundTxHash ? (refundTxHash.transactionId || refundTxHash.txHash) : null
            });
            throw  err;
        }
    }

    /**
     * @description  Maker and Taker submit approve transaction signature callback handler
     * @param roleEnum MAKER | TAKER
     * @param settlementId Settlement order Id
     * @param signedRawTransaction Transaction signed returned hash
     * @returns {Promise<void | never>}
     */
    async approveTxSignCallback(roleEnum, settlementId, signedRawTransaction) {
        const _self = this;
        const {settlementInfoKey, approveTxHashKey, submitApproveTxKey, submitApproveTxLockerKey} = cacheKeysMapping(settlementId, roleEnum);
        const settlementInfo = await _self.readData(settlementInfoKey);
        const approveTx = await _self.readData(submitApproveTxKey);

        if (!settlementInfo || !approveTx) {
            await _self.insertData(submitApproveTxLockerKey, false);
            throw new TypeError(`${roleEnum} ${settlementInfo.chain} send approve transaction error, not read cache data settlementInfo=${!!settlementInfo} approveTx=${!!approveTx} flow settlementInfoKey=${settlementInfoKey}`);
        }
        const {chain, currency, pubKey, confirmThreshold} = _self.formatSettlement(roleEnum, settlementInfo);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        let approveTxHash;
        try {
            const gatewayProvider = _self.getGatewayProvider(chain, currency);
            let sendApproveTx = {
                settlementId,
                signedRawTransaction,
                confirmThreshold
            };
            _statusNotice_(NOTICE_TYPE.SUBMIT_APPROVE, {sendApproveTx});
            approveTxHash = await gatewayProvider.sendApproveTx(sendApproveTx);
            await _self.insertData(approveTxHashKey, approveTxHash);
            const {txHash} = approveTxHash;
            await _self.settlementProvider.submitApproveCallback(chain, roleEnum, settlementId, txHash);
            _statusNotice_(NOTICE_TYPE.SUCCESS_APPROVE, {approveTx, approveTxHash: txHash});
            await _self.insertData(submitApproveTxLockerKey, true);
        } catch (err) {
            await _self.insertData(submitApproveTxLockerKey, false);
            await _self.insertData(submitApproveTxKey, null);
            _statusNotice_(NOTICE_TYPE.FAIL_APPROVE, {
                approveTx,
                approveTxHash: approveTxHash ? approveTxHash.txHash : null
            });
            throw  err;
        }
    }
}

module.exports = BtcSignatureCallback;