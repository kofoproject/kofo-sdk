const Oracle = require('../../oracle');
const {NOTICE_TYPE} = require('../../../common/constant');
const {cacheKeysMapping} = require('../../../mapping/mapping');


/**
 * Provides BTC with Hash lock, Withdraw, Refund, Approve signature callback handler
 */
class BtcOracle extends Oracle {
    constructor() {
        let args = Array.prototype.slice.apply(arguments);
        super(...args);
    }

    /**
     * @description  Maker and Taker receive hash lock message and submit hash lock transaction handler
     * @param message Mqtt send message
     * @returns {Promise<*>}
     */
    async submitHashLockTxHandler(message) {
        const {settlementId, roleEnum} = message;
        const _self = this;
        const {hValueKey, lockTxHashKey, submitHashLockTxKey, submitHashLockTxLockerKey, settlementInfoKey, hashLockTxSignKey} = cacheKeysMapping(settlementId, roleEnum);
        let settlementInfo = await _self.readData(settlementInfoKey);
        let lockTxHash = await _self.readData(lockTxHashKey);
        let lockTx = await _self.readData(submitHashLockTxKey);
        let hValue = await _self.readData(hValueKey);
        let hasLockTx = !!lockTx;
        let hasLockTxHash = !!lockTxHash;
        if (!settlementInfo) {
            throw new TypeError(`Not read cache data ${message.chain}|${message.currency} ${roleEnum} settlement info flow ${settlementInfoKey}`);
        }
        const {chain, currency, amount, pubKey, lockTime, oppositeCounterChainPubKey, oppositeFee: fee, adminPubKey} = _self.formatSettlement(roleEnum, settlementInfo);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, amount, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        const locker = await _self.readData(submitHashLockTxLockerKey);
        const hasLocker = !!locker;
        if (!hasLocker) {
            try {
                await _self.insertData(submitHashLockTxLockerKey, false);
                const gatewayProvider = _self.getGatewayProvider(chain, currency);
                if (!hasLockTx) {
                    const senderPubKey = _self.publicToAddress(chain, currency, pubKey);
                    const receiverPubKey = _self.publicToAddress(chain, currency, oppositeCounterChainPubKey);
                    lockTx = await gatewayProvider.createLockTx({
                        amount,
                        fee,
                        settlementId,
                        hValue,
                        lockTime,
                        senderPubKey,
                        receiverPubKey,
                        adminPubKey
                    });
                    await _self.insertData(submitHashLockTxKey, lockTx);

                    //pre submit hash lock message notify
                    _statusNotice_(NOTICE_TYPE.PRE_HASH_LOCK, {lockTx})
                }
                const {lockId, signHashList, rawTransaction, nLockNum} = lockTx;
                if (!hasLockTxHash) {
                    //hash lock transaction sign notify
                    return _self.signatureNotice({
                        type: hashLockTxSignKey,
                        chain,
                        currency,
                        publicKey: pubKey,
                        settlementId,
                        rawTransaction: signHashList
                    });
                }
                const {transactionId: txHash} = lockTxHash;
                //submitted hash lock message notify
                _statusNotice_(NOTICE_TYPE.SUBMIT_HASH_LOCK, {lockTxHash: txHash});
                await _self.settlementProvider.submitHashLockCallback(chain, roleEnum, settlementId, lockId, rawTransaction, txHash, nLockNum, null);

                //success hash lock message notify
                _statusNotice_(NOTICE_TYPE.SUCCESS_HASH_LOCK, {lockTx, lockTxHash: txHash});
                await _self.insertData(submitHashLockTxLockerKey, true);
            } catch (err) {
                await _self.insertData(submitHashLockTxLockerKey, false);
                //failed hash lock message notify
                _statusNotice_(NOTICE_TYPE.FAIL_HASH_LOCK, {
                    lockTx,
                    lockTxHash: lockTxHash ? lockTxHash.transactionId : null
                });
                throw  err;
            }
        } else {
            _statusNotice_(NOTICE_TYPE.SUBMIT_HASH_LOCK, {
                lockTx: lockTx,
                lockTxHash: lockTxHash ? lockTxHash.transactionId : null
            });
        }
    }

    /**
     * @description  Maker and Taker receive withdraw message and submit withdraw transaction handler
     * @param message Mqtt send message
     * @returns {Promise<*>}
     */
    async submitWithdrawTxHandler(message) {
        const _self = this;
        let {settlementId, preimage, roleEnum, chain, currency} = message;
        const {preImageKey, withdrawTxHashKey, submitWithdrawTxKey, submitHashLockTxKey, settlementInfoKey, submitWithdrawTxLockerKey, withdrawTxSignKey} = cacheKeysMapping(settlementId, roleEnum);
        const lockId = message[`${roleEnum === 'MAKER' ? 'taker' : 'maker'}LockId`];
        const withdrawTxHash = await _self.readData(withdrawTxHashKey);
        let withdrawTx = await _self.readData(submitWithdrawTxKey);
        const lockTx = await _self.readData(submitHashLockTxKey);
        const settlementInfo = await _self.readData(settlementInfoKey);
        const hasWithdrawTx = !!withdrawTx;
        const hasWithdrawTxHash = !!withdrawTxHash;

        if (!lockTx || !settlementInfo) {
            throw new TypeError(`Not read cache data EOS ${roleEnum} lockTx=${!!lockTx} settlementInfo=${!!settlementInfo} flow submitHashLockTxKey=${submitHashLockTxKey} and settlementInfoKey=${settlementInfoKey}`);
        }
        const {counterChainPubKey: pubKey, oppositeFee: fee, adminPubKey} = _self.formatSettlement(roleEnum, settlementInfo);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, lockId, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        let locker = await _self.readData(submitWithdrawTxLockerKey);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                await _self.insertData(submitWithdrawTxLockerKey, false);
                let gatewayProvider = _self.getGatewayProvider(chain, currency);
                if (!hasWithdrawTx) {
                    if (roleEnum === 'TAKER') {
                        await _self.insertData(preImageKey, preimage);
                    }
                    withdrawTx = await gatewayProvider.createWithdrawTx({
                        scriptHash: lockId,
                        receiverPubKey: pubKey,
                        adminPubKey,
                        isAdmin: false,
                        settlementId,
                        fee
                    });
                    await _self.insertData(submitWithdrawTxKey, withdrawTx);

                    //pre withdraw tx message notify
                    _statusNotice_(NOTICE_TYPE.PRE_WITHDRAW, {withdrawTx})
                }
                if (!hasWithdrawTxHash) {
                    const {signHashList} = withdrawTx;
                    return _self.signatureNotice({
                        type: withdrawTxSignKey,
                        chain,
                        currency,
                        publicKey: pubKey,
                        settlementId,
                        rawTransaction: signHashList
                    });
                }
                const {transactionId: txHash} = withdrawTxHash;
                //submitted withdraw tx message notify
                _statusNotice_(NOTICE_TYPE.SUBMIT_WITHDRAW, {withdrawTx, withdrawTxHash: txHash});

                await _self.settlementProvider.submitWithdrawCallback(chain, roleEnum, txHash, settlementId);

                //success withdraw tx message notify
                _statusNotice_(NOTICE_TYPE.SUCCESS_WITHDRAW, {withdrawTx, withdrawTxHash: txHash});
                await _self.insertData(submitWithdrawTxLockerKey, true);
            } catch (err) {
                await _self.insertData(submitWithdrawTxLockerKey, false);

                //failed withdraw tx message notify
                _statusNotice_(NOTICE_TYPE.FAIL_WITHDRAW, {
                    withdrawTx,
                    withdrawTxHash: withdrawTxHash ? withdrawTxHash.transactionId : null
                });
                throw  err;
            }
        } else {
            //failed withdraw tx message notify
            _statusNotice_(NOTICE_TYPE.FAIL_WITHDRAW, {
                withdrawTx,
                withdrawTxHash: withdrawTxHash ? withdrawTxHash.transactionId : null
            });
        }
    }

    /**
     * @description  Maker and Taker receive refund message and submit refund transaction handler
     * @param message Mqtt send message
     * @returns {Promise<*>}
     */
    async submitRefundTxHandler(message) {
        const _self = this;
        let {settlementId, roleEnum} = message;
        const {settlementInfoKey, refundTxHashKey, submitRefundTxKey, submitRefundTxLockerKey, refundTxSignKey} = cacheKeysMapping(settlementId, roleEnum);
        const refundTxHash = await _self.readData(refundTxHashKey);
        let refundTx = await _self.readData(submitRefundTxKey);
        const settlementInfo = await _self.readData(settlementInfoKey);
        const lockId = message[`${roleEnum.toLowerCase()}LockId`];

        const hashRefundTx = !!refundTx;
        const hasRefundTxHash = !!refundTxHash;

        if (!settlementInfo) {
            throw new TypeError(`Not read cache data EOS ${roleEnum} settlement info flow ${settlementInfoKey}`);
        }

        const {chain, currency, pubKey, adminPubKey, fee} = _self.formatSettlement(roleEnum, settlementInfo);
        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, lockId, pubKey};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        let locker = await _self.readData(submitRefundTxLockerKey);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                await _self.insertData(submitRefundTxLockerKey, false);
                const gatewayProvider = _self.getGatewayProvider(chain, currency);
                if (!hashRefundTx) {
                    refundTx = await gatewayProvider.createRefundTx({
                        scriptHash: lockId,
                        senderPubKey: pubKey,
                        adminPubKey,
                        isAdmin: false,
                        settlementId,
                        fee
                    });
                    await _self.insertData(submitRefundTxKey, refundTx);

                    //pre refund tx message notify
                    _statusNotice_(NOTICE_TYPE.PRE_REFUND, {refundTx})
                }
                if (!hasRefundTxHash) {
                    const {signHashList} = refundTx;
                    return _self.signatureNotice({
                        type: refundTxSignKey,
                        chain,
                        currency,
                        publicKey: pubKey,
                        settlementId,
                        rawTransaction: signHashList
                    });
                }
                const {transactionId: txHash} = refundTxHash;
                //submitted refund tx message notify
                _statusNotice_(NOTICE_TYPE.SUBMIT_REFUND, {refundTx, refundTxHash: txHash});

                await _self.settlementProvider.submitRefundCallback(chain, roleEnum, settlementId, txHash);

                //success refund tx message notify
                _statusNotice_(NOTICE_TYPE.SUCCESS_REFUND, {refundTx, refundTxHash: txHash});
                await _self.insertData(submitRefundTxLockerKey, true);
            } catch (err) {
                await _self.insertData(submitRefundTxLockerKey, false);

                //failed refund tx message notify
                _statusNotice_(NOTICE_TYPE.FAIL_REFUND, {
                    refundTx,
                    refundTxHash: refundTxHash ? refundTxHash.transactionId : null
                });
                throw  err;
            }

        } else {
            //failed refund tx message notify
            _statusNotice_(NOTICE_TYPE.FAIL_REFUND, {
                refundTx,
                refundTxHash: refundTxHash ? refundTxHash.transactionId : null
            });
        }
    }
}

module.exports = BtcOracle;