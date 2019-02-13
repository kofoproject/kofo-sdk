const Oracle = require('../../oracle');
const {SIGN_CALLBACK_TYPE, KOFO_EVENT_TYPE} = require('../../../common/constant');

class Erc20Oracle extends Oracle {
    constructor() {
        let args = Array.prototype.slice.apply(arguments);
        super(...args);
    }

    async makerSubmitHashLockTx(message) {
        this.print('erc20 makerSubmitHashLockTx....................................');
        const {settlementId} = message;
        const {keyMakerHValue, keyMakerLockTxHash, keyMakerSubmitHashLockTx, keyMakerSubmitHashLockTxLocker, keyMakerCreateRefundTxAndH} = this.makerKeysMapping(settlementId);
        let makerCreateRefundTxAndH = this.readMakerData(keyMakerCreateRefundTxAndH);
        let lockTxHash = this.readMakerData(keyMakerLockTxHash);
        let lockTx = this.readMakerData(keyMakerSubmitHashLockTx);
        let hValue = this.readMakerData(keyMakerHValue);
        let hasLockTx = !!lockTx;
        let hasLockTxHash = !!lockTxHash;
        if (!makerCreateRefundTxAndH) {
            this.logger.info(`operation=return||flow=${keyMakerSubmitHashLockTxLocker}`);
            return;
        }
        const {makerChain, makerCurrency, makerPubKey, takerCounterChainPubKey, makerLocktime: lockTime, makerAmount: amount} = makerCreateRefundTxAndH;


        let locker = this.readMakerData(keyMakerSubmitHashLockTxLocker);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertMakerData(keyMakerSubmitHashLockTxLocker, true);
                let gatewayProvider = this.getGatewayProvider(makerChain, makerCurrency);
                if (!hasLockTx) {
                    let sender = this.publicToAddress(makerChain, makerChain, makerPubKey, this.network);
                    let receiver = this.publicToAddress(makerChain, makerChain, takerCounterChainPubKey, this.network);
                    lockTx = await gatewayProvider.createLockTx({
                        settlementId,
                        sender,
                        receiver,
                        hValue,
                        lockTime,
                        amount
                    });
                    await this.insertMakerData(keyMakerSubmitHashLockTx, lockTx);
                }

                if (!hasLockTxHash) {
                    return this.event.emit(KOFO_EVENT_TYPE.signature, {
                        type: SIGN_CALLBACK_TYPE.makerHashLockTxSign,
                        chain: makerChain,
                        currency: makerCurrency,
                        publicKey: makerPubKey,
                        settlementId,
                        waitSign: lockTx.rawTransaction
                    });

                }
                await this.settlementProvider.makerSubmitHashLockCallback(message.chain, lockTx.rawTransaction, lockTxHash.txHash, lockTx.lockId, settlementId);
                this.insertMakerData(keyMakerSubmitHashLockTxLocker, false);
                this.emit(message.type, message);
            } catch (err) {
                this.insertMakerData(keyMakerSubmitHashLockTxLocker, false);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyMakerSubmitHashLockTxLocker}`);
        }
    }

    async takerSubmitHashLockTx(message) {
        this.print('erc20 takerSubmitHashLockTx....................................');
        const {settlementId} = message;
        let {keyTakerLockTxHash, keyTakerSubmitHashLockTx, keyTakerSubmitHashLockTxLocker, keyTakerReceiveHAndCreateRefundTx} = this.takerKeysMapping(settlementId);

        let lockTxHash = this.readData(keyTakerLockTxHash);
        let lockTx = this.readData(keyTakerSubmitHashLockTx);
        let takerReceiveHAndCreateRefundTx = this.readData(keyTakerReceiveHAndCreateRefundTx);
        let hasLockTx = !!lockTx;
        let hasLockTxHash = !!lockTxHash;

        if (!takerReceiveHAndCreateRefundTx) {
            this.logger.info(`operation=return||not read cache data takerReceiveHAndCreateRefundTx ${keyTakerReceiveHAndCreateRefundTx}`);
            return;
        }
        const {takerChain, takerCurrency, hValue, makerCounterChainPubKey: receiverPubKey, takerPubKey: senderPubKey, takerLocktime: lockTime, takerAmount: amount} = takerReceiveHAndCreateRefundTx;

        let locker = this.readData(keyTakerSubmitHashLockTxLocker);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertData(keyTakerSubmitHashLockTxLocker, true);
                let gatewayProvider = this.getGatewayProvider(takerChain, takerCurrency);
                if (!hasLockTx) {
                    let sender = this.publicToAddress(takerChain, takerCurrency, senderPubKey, this.network);
                    let receiver = this.publicToAddress(takerChain, takerCurrency, receiverPubKey, this.network);
                    lockTx = await gatewayProvider.createLockTx({
                        settlementId,
                        sender,
                        receiver,
                        hValue,
                        lockTime,
                        amount

                    });
                    await this.insertData(keyTakerSubmitHashLockTx, lockTx);
                }
                if (!hasLockTxHash) {
                    return this.event.emit(KOFO_EVENT_TYPE.signature, {
                        type: SIGN_CALLBACK_TYPE.takerHashLockTxSign,
                        chain: takerChain,
                        currency: takerCurrency,
                        publicKey: senderPubKey,
                        settlementId,
                        waitSign: lockTx.rawTransaction
                    });
                }
                await this.settlementProvider.takerSubmitHashLockCallback(message.chain, lockTx.rawTransaction, lockTxHash.txHash, lockTxHash.lockId, settlementId);
                this.insertData(keyTakerSubmitHashLockTxLocker, false);
                this.emit(message.type, message);
            } catch (err) {
                this.insertData(keyTakerSubmitHashLockTxLocker, false);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyTakerSubmitHashLockTxLocker}`);
        }
    }

    async makerSubmitWithdrawTx(message) {
        this.print('erc20 makerSubmitWithdrawTx....................................');
        const {settlementId, takerHashLockTransactionId: txId, index: lockOutputIndex, takerLockId: lockId} = message;
        const {keyMakerPreImage, keyMakerWithdrawTxHash, keyMakerSubmitHashLockTx, keyMakerSubmitWithdrawTx, keyMakerCreateRefundTxAndH, keyMakerSubmitWithdrawTxLocker} = this.makerKeysMapping(settlementId);

        let makerWithdrawTxHash = this.readMakerData(keyMakerWithdrawTxHash);
        let withdrawTx = this.readMakerData(keyMakerSubmitWithdrawTx);
        const preimage = this.readMakerData(keyMakerPreImage);
        let lockTx = this.readMakerData(keyMakerSubmitHashLockTx);
        let makerCreateRefundTxAndH = this.readMakerData(keyMakerCreateRefundTxAndH);
        let hasWithdrawTx = !!withdrawTx;
        let hasMakerWithdrawTxHash = !!makerWithdrawTxHash;

        if (!lockTx || !makerCreateRefundTxAndH) {
            this.logger.info(`operation=return||hasErrorFlow1=${!lockTx}||hasErrorFlow2=${!makerCreateRefundTxAndH}||flow=${keyMakerSubmitWithdrawTxLocker}`);
            return;
        }
        const {takerChain, takerCurrency, makerCounterChainPubKey: withdrawPubKey} = makerCreateRefundTxAndH;
        let locker = this.readMakerData(keyMakerSubmitWithdrawTxLocker);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertMakerData(keyMakerSubmitWithdrawTxLocker, true);
                let gatewayProvider = this.getGatewayProvider(takerChain, takerCurrency);
                let sender = this.publicToAddress(takerChain, takerCurrency, withdrawPubKey);
                if (!hasWithdrawTx) {
                    withdrawTx = await gatewayProvider.createWithdrawTx({
                        settlementId,
                        sender,
                        lockId,
                        preimage
                    });
                    await this.insertMakerData(keyMakerSubmitWithdrawTx, withdrawTx);
                }
                if (!hasMakerWithdrawTxHash) {
                    const {rawTransaction} = withdrawTx;
                    return this.event.emit(KOFO_EVENT_TYPE.signature, {
                        type: SIGN_CALLBACK_TYPE.makerWithdrawTxSign,
                        chain: takerChain,
                        currency: takerCurrency,
                        publicKey: withdrawPubKey,
                        settlementId,
                        waitSign: rawTransaction
                    });
                }
                await this.settlementProvider.makerSubmitWithdrawCallback(message.chain, makerWithdrawTxHash.txHash, settlementId);
                this.insertMakerData(keyMakerSubmitWithdrawTxLocker, false);
                this.event.emit(message.type, message);
            } catch (err) {
                this.insertMakerData(keyMakerSubmitWithdrawTxLocker, false);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyMakerSubmitWithdrawTxLocker}`);
        }
    }

    async takerSubmitWithdrawTx(message) {
        this.print('erc20 takerSubmitWithdrawTx....................................');
        const {settlementId, preimage, makerLockId: lockId} = message;
        const {keyTakerWithdrawTxHash, keyTakerSubmitWithdrawTx, keyTakerSubmitHashLockTx, keyTakerSubmitWithdrawTxLocker, keyTakerReceiveHAndCreateRefundTx} = this.takerKeysMapping(settlementId);

        let takerWithdrawTxHash = this.readData(keyTakerWithdrawTxHash);
        let withdrawTx = this.readData(keyTakerSubmitWithdrawTx);
        const takerSubmitHashLockTx = this.readData(keyTakerSubmitHashLockTx);
        const takerReceiveHAndCreateRefundTx = this.readData(keyTakerReceiveHAndCreateRefundTx);
        let hasWithdrawTx = !!withdrawTx;
        let hasTakerWithdrawTxHash = !!takerWithdrawTxHash;

        if (!takerSubmitHashLockTx || !takerReceiveHAndCreateRefundTx) {
            this.logger.info(`operation=return||hasErrorFlow1=${!takerSubmitHashLockTx}||hasErrorFlow2=${!takerReceiveHAndCreateRefundTx}||flow=${keyTakerSubmitWithdrawTxLocker}`);
            return;
        }
        const {makerChain, makerCurrency, takerCounterChainPubKey} = takerReceiveHAndCreateRefundTx;
        let locker = this.readData(keyTakerSubmitWithdrawTxLocker);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertData(keyTakerSubmitWithdrawTxLocker, true);
                let gatewayProvider = this.getGatewayProvider(makerChain, makerCurrency);

                if (!hasWithdrawTx) {
                    let sender = this.publicToAddress(makerChain, makerCurrency, takerCounterChainPubKey);
                    withdrawTx = await gatewayProvider.createWithdrawTx({
                        settlementId,
                        sender,
                        lockId,
                        preimage,
                    });
                    this.print('Erc20 taker submit withdraw tx: ', withdrawTx);

                    await this.insertData(keyTakerSubmitWithdrawTx, withdrawTx);
                }
                if (!hasTakerWithdrawTxHash) {
                    const {rawTransaction} = withdrawTx;
                    return this.event.emit(KOFO_EVENT_TYPE.signature, {
                        type: SIGN_CALLBACK_TYPE.takerWithdrawTxSign,
                        chain: makerChain,
                        currency: makerCurrency,
                        publicKey: takerCounterChainPubKey,
                        settlementId,
                        waitSign: rawTransaction
                    });
                }
                await this.settlementProvider.takerSubmitWithdrawCallback(makerChain, takerWithdrawTxHash.txHash, settlementId);
                this.insertData(keyTakerSubmitWithdrawTxLocker, false);
                this.event.emit(message.type, message);
            } catch (err) {
                this.insertData(keyTakerSubmitWithdrawTxLocker, false);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyTakerSubmitWithdrawTxLocker}`);
        }
    }

    async makerSubmitRefundTx(message) {
        this.print('Erc20 makerSubmitRefundTx....................................');
        const {settlementId} = message;
        const {keyMakerCreateRefundTxAndH, keyMakerRefundTxHash, keyMakerSubmitHashLockTx, keyMakerSubmitRefundTx, keyMakerSubmitRefundTxLocker} = this.makerKeysMapping(settlementId);

        let makerRefundTxHash = this.readMakerData(keyMakerRefundTxHash);
        let refundTx = this.readMakerData(keyMakerSubmitRefundTx);
        let makerCreateRefundTxAndH = this.readMakerData(keyMakerCreateRefundTxAndH);
        let makerHashLockTx = this.readMakerData(keyMakerSubmitHashLockTx);

        let hashRefundTx = !!refundTx;
        let hasRefundTxHash = !!makerRefundTxHash;

        if (!makerHashLockTx || !makerCreateRefundTxAndH) {
            this.logger.info(`operation=return||hasErrorFlow1=${!makerHashLockTx}||hasErrorFlow2=${!makerCreateRefundTxAndH}||flow=${keyMakerSubmitRefundTxLocker}`);
            return;
        }

        const {takerChain, takerCurrency, makerCounterChainPubKey} = makerCreateRefundTxAndH;

        let locker = this.readMakerData(keyMakerSubmitRefundTxLocker);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertMakerData(keyMakerSubmitRefundTxLocker, true);
                let gatewayProvider = this.getGatewayProvider(takerChain, takerCurrency);
                let sender = this.publicToAddress(takerChain, takerCurrency, makerCounterChainPubKey);
                if (!hashRefundTx) {
                    refundTx = await gatewayProvider.createRefundTx({
                        settlementId,
                        sender,
                        lockId: makerHashLockTx.lockId,
                    });
                    await this.insertMakerData(keyMakerSubmitRefundTx, refundTx);
                }
                if (!hasRefundTxHash) {
                    const {rawTransaction} = refundTx;
                    return this.event.emit(KOFO_EVENT_TYPE.signature, {
                        type: SIGN_CALLBACK_TYPE.makerRefundTxSign,
                        chain: takerChain,
                        currency: takerCurrency,
                        publicKey: makerCounterChainPubKey,
                        settlementId,
                        waitSign: rawTransaction
                    });
                }
                await this.settlementProvider.makerSubmitRefundCallback(message.chain, settlementId, makerRefundTxHash.txHash);
                this.insertMakerData(keyMakerSubmitRefundTxLocker, false);
                this.event.emit(message.type, message);
            } catch (err) {
                this.insertMakerData(keyMakerSubmitRefundTxLocker, false);
                throw  err;
            }

        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyMakerSubmitRefundTxLocker}`);
        }


    }

    async takerSubmitRefundTx(message) {
        this.print('Erc20 takerSubmitRefundTx....................................');
        const {settlementId} = message;
        const {keyTakerReceiveHAndCreateRefundTx, keyTakerRefundTxHash, keyTakerSubmitHashLockTx, keyTakerSubmitRefundTx, keyTakerSubmitRefundTxLocker} = this.takerKeysMapping(settlementId);

        let takerRefundTxHash = this.readData(keyTakerRefundTxHash);
        let refundTx = this.readData(keyTakerSubmitRefundTx);
        let takerReceiveHAndCreateRefundTx = this.readData(keyTakerReceiveHAndCreateRefundTx);
        let takerHashLockTx = this.readData(keyTakerSubmitHashLockTx);

        let hashRefundTx = !!refundTx;
        let hasRefundTxHash = !!takerRefundTxHash;

        if (!takerHashLockTx || !takerReceiveHAndCreateRefundTx) {
            this.logger.info(`operation=return||hasErrorFlow1=${!takerHashLockTx}||hasErrorFlow2=${!takerReceiveHAndCreateRefundTx}||flow=${keyTakerSubmitRefundTxLocker}`);
            return;
        }

        const {makerChain, makerCurrency, takerCounterChainPubKey} = takerReceiveHAndCreateRefundTx;

        let locker = this.readData(keyTakerSubmitRefundTxLocker);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertData(keyTakerSubmitRefundTxLocker, true);
                let gatewayProvider = this.getGatewayProvider(makerChain, makerCurrency);
                let sender = this.publicToAddress(makerChain, makerCurrency, takerCounterChainPubKey);
                if (!hashRefundTx) {
                    refundTx = await gatewayProvider.createRefundTx({
                        settlementId,
                        sender,
                        lockId: takerHashLockTx.lockId,
                    });
                    await this.insertData(keyTakerSubmitRefundTx, refundTx);
                }
                if (!hasRefundTxHash) {
                    const {rawTransaction} = refundTx;
                    return this.event.emit(KOFO_EVENT_TYPE.signature, {
                        type: SIGN_CALLBACK_TYPE.takerRefundTxSign,
                        chain: makerChain,
                        currency: makerCurrency,
                        publicKey: takerCounterChainPubKey,
                        settlementId,
                        waitSign: rawTransaction
                    });
                }
                await this.settlementProvider.takerSubmitRefundCallback(message.chain, settlementId, takerRefundTxHash.txHash);
                this.insertData(keyTakerSubmitRefundTxLocker, false);
                this.event.emit(message.type, message);
            } catch (err) {
                this.insertData(keyTakerSubmitRefundTxLocker, false);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyTakerSubmitRefundTxLocker}`);
        }
    }

    async makerSubmitApproveTx(message) {
        this.print('Erc20 makerSubmitApproveTx....................................');
        const {settlementId} = message;
        const {keyMakerCreateRefundTxAndH, keyMakerApproveTxHash, keyMakerSubmitApproveTx, keyMakerSubmitApproveTxLocker} = this.makerKeysMapping(settlementId);
        let makerCreateRefundTxAndH = this.readMakerData(keyMakerCreateRefundTxAndH);
        let approveTxHash = this.readMakerData(keyMakerApproveTxHash);
        let approveTx = this.readMakerData(keyMakerSubmitApproveTx);
        let hasApproveTx = !!approveTx;
        let hasApproveTxHash = !!approveTxHash;
        if (!makerCreateRefundTxAndH) {
            this.logger.info(`operation=return||flow=${keyMakerSubmitApproveTxLocker}`);
            return;
        }

        const {makerChain, makerCurrency, makerPubKey, makerAmount: amount} = makerCreateRefundTxAndH;


        let locker = this.readMakerData(keyMakerSubmitApproveTxLocker);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertMakerData(keyMakerSubmitApproveTxLocker, true);
                let gatewayProvider = this.getGatewayProvider(makerChain, makerCurrency);

                if (!hasApproveTx) {
                    let sender = this.publicToAddress(makerChain, makerCurrency, makerPubKey, this.network);
                    approveTx = await gatewayProvider.createApproveTx({
                        settlementId,
                        sender,
                        amount
                    });
                    await this.insertMakerData(keyMakerSubmitApproveTx, approveTx);
                }

                if (!hasApproveTxHash) {
                    const {rawTransaction} = approveTx;
                    return this.event.emit(KOFO_EVENT_TYPE.signature, {
                        type: SIGN_CALLBACK_TYPE.makerApproveTxSign,
                        chain: makerChain,
                        currency: makerCurrency,
                        publicKey: makerPubKey,
                        settlementId,
                        waitSign: rawTransaction
                    });

                }
                await this.settlementProvider.makerSubmitApproveCallback(makerChain, settlementId, approveTxHash.txHash);
                this.insertMakerData(keyMakerSubmitApproveTxLocker, false);
                this.emit(message.type, message);
            } catch (err) {
                this.insertMakerData(keyMakerSubmitApproveTxLocker, false);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyMakerSubmitApproveTxLocker}`);
        }

    }

    async takerSubmitApproveTx(message) {
        this.print('Erc20 takerSubmitApproveTx....................................');
        const {settlementId} = message;
        const {keyTakerReceiveHAndCreateRefundTx, keyTakerApproveTxHash, keyTakerSubmitApproveTx, keyTakerSubmitApproveTxLocker} = this.takerKeysMapping(settlementId);
        let takerReceiveHAndCreateRefundTx = this.readData(keyTakerReceiveHAndCreateRefundTx);
        let approveTxHash = this.readData(keyTakerApproveTxHash);
        let approveTx = this.readData(keyTakerSubmitApproveTx);
        let hasApproveTx = !!approveTx;
        let hasApproveTxHash = !!approveTxHash;
        if (!takerReceiveHAndCreateRefundTx) {
            this.logger.info(`operation=return||flow=${keyTakerSubmitApproveTxLocker}`);
            return;
        }

        const {takerChain, takerCurrency, takerPubKey, takerAmount: amount} = takerReceiveHAndCreateRefundTx;


        let locker = this.readData(keyTakerSubmitApproveTxLocker);
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertData(keyTakerSubmitApproveTxLocker, true);
                let gatewayProvider = this.getGatewayProvider(takerChain, takerCurrency);
                if (!hasApproveTx) {
                    let sender = this.publicToAddress(takerChain, takerCurrency, takerPubKey, this.network);
                    approveTx = await gatewayProvider.createApproveTx({
                        settlementId,
                        sender,
                        amount
                    });
                    await this.insertData(keyTakerSubmitApproveTx, approveTx);
                }

                if (!hasApproveTxHash) {
                    const {rawTransaction} = approveTx;
                    return this.event.emit(KOFO_EVENT_TYPE.signature, {
                        type: SIGN_CALLBACK_TYPE.takerApproveTxSign,
                        chain: takerChain,
                        currency: takerCurrency,
                        publicKey: takerPubKey,
                        settlementId,
                        waitSign: rawTransaction
                    });
                }
                await this.settlementProvider.takerSubmitApproveCallback(takerChain, settlementId, approveTxHash.txHash);
                this.insertData(keyTakerSubmitApproveTxLocker, false);
                this.emit(message.type, message);
            } catch (err) {
                this.insertData(keyTakerSubmitApproveTxLocker, false);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyTakerSubmitApproveTxLocker}`);
        }
    }
}

module.exports = Erc20Oracle;