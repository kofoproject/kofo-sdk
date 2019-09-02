const _ = require('lodash');
const KofoUtils = require('kofo-utils');
const {NOTICE_TYPE} = require('../common/constant');
const {cacheKeysMapping} = require('../mapping/mapping');
const BaseOracle = require('./base');

/**
 * Provides receive mqtt message and handler
 * Provides transaction signature callback handler
 * Provides gateway proxy
 * provides status server proxy
 * Provides at different chain  public key convert to address proxy
 */
class Oracle extends BaseOracle {

    /**
     * @description Message handler and transaction signed callback constructor
     */
    constructor() {
        let args = Array.prototype.slice.apply(arguments);
        super(...args);
    }

    /**
     * @description Receive Mqtt push settlement order info and Taker or Maker storage message and create or save h value
     * @param message Taker or Maker settlement order message
     * @returns {Promise<void>}
     */
    async createRefundHandler(message) {
        let {settlementId, hValue, roleEnum} = message;
        const _self = this;
        const {settlementInfoKey, createRefundTxAndHLockerKey, preImageKey, hValueKey} = cacheKeysMapping(settlementId, roleEnum);
        let hasLocker = !!await _self.readData(createRefundTxAndHLockerKey);
        let settlementInfo = await _self.readData(settlementInfoKey);
        let hasHValue = !!hValue;
        if (!hasLocker) {
            try {
                await _self.insertData(createRefundTxAndHLockerKey, true);
                if (!hasHValue) {
                    if (roleEnum === 'MAKER') {
                        let preImage = KofoUtils.createPreImage();
                        hValue = KofoUtils.createHValue(preImage);
                        await _self.insertData(preImageKey, preImage);
                    }
                    await _self.insertData(hValueKey, hValue);
                }
                roleEnum === 'TAKER' && await _self.insertData(hValueKey, hValue);
                !settlementInfo && await _self.insertData(settlementInfoKey, message);

                if (roleEnum === 'MAKER') {
                    await _self.settlementProvider.createRefundTxAndHCallback(message.chain, hValue, settlementId);
                } else {
                    await _self.settlementProvider.receiveHAndCreateRefundCallback(message.chain, settlementId);
                }
                _self.statusNotice(NOTICE_TYPE.SETTLEMENT_INFO, message);
            } catch (err) {
                await _self.insertData(createRefundTxAndHLockerKey, false);
                throw  err;
            }
        }
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
        let hvalue = await _self.readData(hValueKey);
        let hasLockTx = !!lockTx;
        let hasLockTxHash = !!lockTxHash;
        settlementInfo = Object.assign(settlementInfo || {}, _.omit(message, ['type', 'hValue', 'makerLockId']));

        if(!hvalue){
            hvalue =  message.hValue;
            await _self.insertData(hValueKey, hvalue);
        }


        const {chain, currency, amount, pubKey: sender, lockTime, oppositeCounterChainPubKey: receiver, oppositeFee: fee, adminPubKey: admin} = this.formatSettlement(roleEnum, settlementInfo);
        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, amount, sender};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        const locker = await _self.readData(submitHashLockTxLockerKey);
        const hasLocker = !!locker;
        if (!hasLocker) {
            try {
                await _self.insertData(settlementInfoKey, settlementInfo);
                await _self.insertData(submitHashLockTxLockerKey, true);
                if (!hasLockTx) {
                    const gatewayProvider = this.getGatewayProvider(chain, currency);
                    lockTx = await gatewayProvider.createLockTx({
                        settlementId,
                        amount,
                        sender,
                        receiver,
                        lockTime,
                        hvalue,
                        admin,
                        fee: ''
                    });
                    await _self.insertData(submitHashLockTxKey, lockTx);
                    _statusNotice_(NOTICE_TYPE.PRE_HASH_LOCK, {lockTx})
                }
                let {lockId, rawTransaction, nLockNum = null, nlockDate = null} = lockTx;
                if (!hasLockTxHash) {
                    return _self.signatureNotice(hashLockTxSignKey, chain, currency, sender, settlementId, lockTx);
                }

                let txHash = lockTxHash.transactionId ? lockTxHash.transactionId : lockTxHash.txHash;


                _statusNotice_(NOTICE_TYPE.SUBMIT_HASH_LOCK, {lockTxHash: txHash});
                await _self.settlementProvider.submitHashLockCallback(chain, roleEnum, settlementId, lockId, rawTransaction, txHash, nLockNum, nlockDate);

                _statusNotice_(NOTICE_TYPE.SUCCESS_HASH_LOCK, {lockTx, lockTxHash: txHash});
                await _self.insertData(submitHashLockTxLockerKey, true);
            } catch (err) {
                await _self.insertData(submitHashLockTxLockerKey, false);
                _statusNotice_(NOTICE_TYPE.FAIL_HASH_LOCK, {
                    lockTx,
                    lockTxHash: lockTxHash ? (lockTxHash.transactionId || lockTxHash.txHash) : null
                });
                throw  err;
            }
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
        const withdrawTxHash = await _self.readData(withdrawTxHashKey);
        let withdrawTx = await _self.readData(submitWithdrawTxKey);
        const lockTx = await _self.readData(submitHashLockTxKey);
        let settlementInfo = await _self.readData(settlementInfoKey);
        const hasWithdrawTx = !!withdrawTx;
        const hasWithdrawTxHash = !!withdrawTxHash;

        if (!settlementInfo) {
            throw new TypeError(`${roleEnum} ${chain} submit withdraw transaction error, not read cache data lockTx=${!!lockTx} settlementInfo=${!!settlementInfo} flow submitHashLockTxKey=${submitHashLockTxKey} and settlementInfoKey=${settlementInfoKey}`);
        }
        settlementInfo = Object.assign(settlementInfo, _.pick(message, ['takerAdminPubKey', 'makerCounterChainAddressType', 'makerAdminPubKey', 'takerCounterChainAddressType']));

        let {counterChainPubKey: sender, oppositeLockId: lockId, fee, oppositeAdminPubKey: admin} = _self.formatSettlement(roleEnum, message);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, lockId, sender};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        let locker = await _self.readData(submitWithdrawTxLockerKey);
        let hasLocker = !!locker;

        if (!hasLocker) {
            try {
                await _self.insertData(settlementInfoKey, settlementInfo);
                await _self.insertData(submitWithdrawTxLockerKey, true);
                let gatewayProvider = _self.getGatewayProvider(chain, currency);
                if (!hasWithdrawTx) {

                    //BTC send withdraw need preimage, so need save the preimage
                    if (roleEnum === 'TAKER') {
                        await _self.insertData(preImageKey, preimage);
                    }

                    if (roleEnum === 'MAKER') {
                        preimage = await _self.readData(preImageKey);
                    }
                    withdrawTx = await gatewayProvider.createWithdrawTx({
                        settlementId,
                        lockId,
                        preimage,
                        sender,
                        admin,
                        isAdmin: false,
                        bizFee: fee,
                        fee: '',
                    });
                    await _self.insertData(submitWithdrawTxKey, withdrawTx);
                    _statusNotice_(NOTICE_TYPE.PRE_WITHDRAW, {withdrawTx})
                }
                if (!hasWithdrawTxHash) {
                    return _self.signatureNotice(withdrawTxSignKey, chain, currency, sender, settlementId, withdrawTx);
                }

                let txHash = withdrawTxHash.transactionId ? withdrawTxHash.transactionId : withdrawTxHash.txHash;
                _statusNotice_(NOTICE_TYPE.SUBMIT_WITHDRAW, {withdrawTx, withdrawTxHash: txHash});
                await _self.settlementProvider.submitWithdrawCallback(chain, roleEnum, txHash, settlementId);
                _statusNotice_(NOTICE_TYPE.SUCCESS_WITHDRAW, {withdrawTx, withdrawTxHash: txHash});
                await _self.insertData(submitWithdrawTxLockerKey, true);
            } catch (err) {
                await _self.insertData(submitWithdrawTxLockerKey, false);
                _statusNotice_(NOTICE_TYPE.FAIL_WITHDRAW, {
                    withdrawTx,
                    withdrawTxHash: withdrawTxHash ? (withdrawTxHash.transactionId || withdrawTxHash.txHash) : null
                });
                throw  err;
            }
        }
    }

    /**
     * @description  Maker and Taker receive refund message and submit refund transaction handler
     * @param message Mqtt send message
     * @returns {Promise<*>}
     */
    async submitRefundTxHandler(message) {
        const _self = this;
        let {settlementId, roleEnum, chain, currency} = message;
        const {settlementInfoKey, refundTxHashKey, submitRefundTxKey, submitRefundTxLockerKey, refundTxSignKey} = cacheKeysMapping(settlementId, roleEnum);
        const refundTxHash = await _self.readData(refundTxHashKey);
        let refundTx = await _self.readData(submitRefundTxKey);
        const settlementInfo = await _self.readData(settlementInfoKey);
        const lockId = message[`${roleEnum.toLowerCase()}LockId`];

        const hashRefundTx = !!refundTx;
        const hasRefundTxHash = !!refundTxHash;

        if (!settlementInfo) {
            throw new TypeError(`${roleEnum} ${chain} submit refund transaction error, not read cache data settlementInfo=${!!settlementInfo} flow settlementInfoKey=${settlementInfoKey}`);
        }

        const {pubKey: sender, adminPubKey: admin, fee} = _self.formatSettlement(roleEnum, settlementInfo);
        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, lockId, sender};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        let locker = await _self.readData(submitRefundTxLockerKey);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                await _self.insertData(submitRefundTxLockerKey, true);
                const gatewayProvider = _self.getGatewayProvider(chain, currency);
                if (!hashRefundTx) {
                    refundTx = await gatewayProvider.createRefundTx({
                        settlementId,
                        lockId,
                        sender,
                        admin,
                        isAdmin: false,
                        fee,
                    });
                    await _self.insertData(submitRefundTxKey, refundTx);
                    _statusNotice_(NOTICE_TYPE.PRE_REFUND, {refundTx})
                }
                if (!hasRefundTxHash) {
                    return _self.signatureNotice(refundTxSignKey, chain, currency, sender, settlementId, refundTx);
                }

                let txHash = refundTxHash.transactionId || refundTx.txHash;
                _statusNotice_(NOTICE_TYPE.SUBMIT_REFUND, {refundTx, refundTxHash: txHash});
                await _self.settlementProvider.submitRefundCallback(chain, roleEnum, settlementId, txHash);
                _statusNotice_(NOTICE_TYPE.SUCCESS_REFUND, {refundTx, refundTxHash: txHash});
            } catch (err) {
                await _self.insertData(submitRefundTxLockerKey, false);
                _statusNotice_(NOTICE_TYPE.FAIL_REFUND, {
                    refundTx,
                    refundTxHash: refundTxHash ? (refundTxHash.transactionId || refundTx.txHash) : null
                });
                throw  err;
            }

        }
    }

    /**
     * @description  Maker and Taker receive approve message and submit approve transaction handler
     * @param message Mqtt send message
     * @returns {Promise<*>}
     */
    async submitApproveTxHandler(message) {
        const {settlementId, roleEnum, chain, currency} = message;
        const _self = this;

        const {settlementInfoKey, approveTxHashKey, submitApproveTxKey, submitApproveTxLockerKey, approveTxSignKey} = cacheKeysMapping(settlementId, roleEnum);
        let settlementInfo = await _self.readData(settlementInfoKey);
        const approveTxHash = await _self.readData(approveTxHashKey);
        let approveTx = await _self.readData(submitApproveTxKey);
        const hasApproveTx = !!approveTx;
        const hasApproveTxHash = !!approveTxHash;
        if (!settlementInfo) {
            throw new TypeError(`${roleEnum} ${chain} submit approve transaction error, not read cache data settlementInfo=${!!settlementInfo} flow settlementInfoKey=${settlementInfoKey}`);
        }
        settlementInfo = Object.assign(settlementInfo, _.omit(message, ['type', 'hValue', 'makerLockId']));

        const {pubKey: sender, amount} = _self.formatSettlement(roleEnum, settlementInfo);

        const _statusNotice_ = function (type, extra) {
            let msg = {settlementId, roleEnum, chain, currency, sender};
            _self.statusNotice(type, Object.assign(msg, extra));
        };

        const locker = await _self.readData(submitApproveTxLockerKey);
        const hasLocker = !!locker;
        if (!hasLocker) {
            try {
                await _self.insertData(settlementInfoKey, settlementInfo);
                await _self.insertData(submitApproveTxLockerKey, true);
                const gatewayProvider = _self.getGatewayProvider(chain, currency);
                if (!hasApproveTx) {
                    approveTx = await gatewayProvider.createApproveTx({
                        settlementId,
                        sender,
                        amount
                    });
                    await _self.insertData(submitApproveTxKey, approveTx);
                    _statusNotice_(NOTICE_TYPE.PRE_APPROVE, {approveTx})
                }

                if (!hasApproveTxHash) {
                    return _self.signatureNotice(approveTxSignKey, chain, currency, sender, settlementId, approveTx);
                }
                const {txHash} = approveTxHash;

                _statusNotice_(NOTICE_TYPE.SUBMIT_APPROVE, {approveTx, approveTxHash: txHash});

                await _self.settlementProvider.submitApproveCallback(chain, roleEnum, settlementId, txHash);

                _statusNotice_(NOTICE_TYPE.SUCCESS_APPROVE, {approveTx, approveTxHash: txHash});
                await _self.insertData(submitApproveTxLockerKey, true);
            } catch (err) {
                await _self.insertData(submitApproveTxLockerKey, false);
                _statusNotice_(NOTICE_TYPE.FAIL_APPROVE, {
                    approveTx,
                    approveTxHash: approveTxHash ? approveTxHash.txHash : null
                });
                throw  err;
            }
        }
    }

    /**
     * @description Taker and Maker transaction final message handler
     * @param message settlement order message
     * @returns {Promise<void>}
     */
    async finalStatusHandler(message) {
        const _self = this;
        const {settlementId, roleEnum, chain, currency} = message;
        const {txCompleteKey} = cacheKeysMapping(settlementId, roleEnum);
        await this.settlementProvider.finalStatusCallback(chain, roleEnum, settlementId);
        await _self.insertData(txCompleteKey, true);
        _self.statusNotice(NOTICE_TYPE.COMPLETE, {settlementId, roleEnum, chain, currency});
        _self.cacheMap.clear();
    }
}

module.exports = Oracle;