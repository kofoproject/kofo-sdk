const Logger = require('../logger/logger');
const {MQ_MESSAGE_TYPE, CONNECTION, LOGGER} = require('../common/constant');
const Utils = require('../utils/utils');
const GatewayProvider = require('../gateway/provider');
const ChainProvider = require('../blockchain/provider');
const Settlement = require('../settlement/settlement');
const _ = require('lodash');

class Oracle {

    constructor(event, config, label) {
        this.event = event;
        this.insertData = config.insertData;
        this.readData = config.readData;
        this.logger = Logger.getLogger();
        this.gateway = config.gateway;
        this.settlement = config.settlement;
        this.debug = config.debug;
        this.label = label;
        this.network = config.network;
        this.settlementProvider = Settlement.provider({
            url: this.settlement,
            timeout: CONNECTION.TIMEOUT,
            level: LOGGER.LEVEL,
            label: "Settlement",
            debug: this.debug
        })
    }


    print(desc, obj, up = false) {
        let str = desc;
        if (!this.debug) {
            return;
        }
        desc = '【' + _.toUpper(this.label) + '】' + desc;
        if (up) {
            console.log(_.toUpper(desc));
        } else {
            console.log(desc);
        }
        if (obj && !_.isEmpty(obj)) {
            console.table([obj]);
        }
        console.log('\n');
        Utils.writeLog(this.label, str, obj, up);
    }


    makerKeysMapping(settlementId) {
        return {
            keyMakerCreateRefundTxAndH: [settlementId, MQ_MESSAGE_TYPE.makerCreateRefundTxAndH].join('_'),
            keyMakerCreateRefundTxAndHLocker: [settlementId, MQ_MESSAGE_TYPE.makerCreateRefundTxAndH, MQ_MESSAGE_TYPE.locker].join('_'),
            keyMakerPreImage: [settlementId, MQ_MESSAGE_TYPE.makerPreImage].join('_'),
            keyMakerHValue: [settlementId, MQ_MESSAGE_TYPE.makerHValue].join('_'),

            keyMakerLockTxHash: [settlementId, MQ_MESSAGE_TYPE.makerLockTxHash].join('_'),
            keyMakerSubmitHashLockTx: [settlementId, MQ_MESSAGE_TYPE.makerSubmitHashLockTx].join('_'),
            keyMakerSubmitHashLockTxLocker: [settlementId, MQ_MESSAGE_TYPE.makerSubmitHashLockTx, MQ_MESSAGE_TYPE.locker].join('_'),

            keyMakerWithdrawTxHash: [settlementId, MQ_MESSAGE_TYPE.makerWithdrawTxHash].join('_'),
            keyMakerSubmitWithdrawTx: [settlementId, MQ_MESSAGE_TYPE.makerSubmitWithdrawTx].join('_'),
            keyMakerSubmitWithdrawTxLocker: [settlementId, MQ_MESSAGE_TYPE.makerSubmitWithdrawTx, MQ_MESSAGE_TYPE.locker].join('_'),

            keyMakerRefundTxHash: [settlementId, MQ_MESSAGE_TYPE.makerRefundTxHash].join('_'),
            keyMakerSubmitRefundTx: [settlementId, MQ_MESSAGE_TYPE.makerSubmitRefundTx].join('_'),
            keyMakerSubmitRefundTxLocker: [settlementId, MQ_MESSAGE_TYPE.makerSubmitRefundTx, MQ_MESSAGE_TYPE.locker].join('_'),

            keyMakerApproveTxHash: [settlementId, MQ_MESSAGE_TYPE.makerApproveTxHash].join('_'),
            keyMakerSubmitApproveTx: [settlementId, MQ_MESSAGE_TYPE.makerSubmitApproveTx],
            keyMakerSubmitApproveTxLocker: [settlementId, MQ_MESSAGE_TYPE.makerSubmitApproveTx, MQ_MESSAGE_TYPE.locker].join('_'),

        };
    }

    takerKeysMapping(settlementId) {
        return {
            keyTakerReceiveHAndCreateRefundTx: [settlementId, MQ_MESSAGE_TYPE.takerReceiveHAndCreateRefundTx].join('_'),
            keyTakerReceiveHAndCreateRefundTxLocker: [settlementId, MQ_MESSAGE_TYPE.takerReceiveHAndCreateRefundTx, MQ_MESSAGE_TYPE.locker].join('_'),
            keyTakerHValue: [settlementId, MQ_MESSAGE_TYPE.takerHValue].join('_'),

            keyTakerLockTxHash: [settlementId, MQ_MESSAGE_TYPE.takerLockTxHash].join('_'),
            keyTakerSubmitHashLockTx: [settlementId, MQ_MESSAGE_TYPE.takerSubmitHashLockTx].join('_'),
            keyTakerSubmitHashLockTxLocker: [settlementId, MQ_MESSAGE_TYPE.takerSubmitHashLockTx, MQ_MESSAGE_TYPE.locker].join('_'),

            keyTakerWithdrawTxHash: [settlementId, MQ_MESSAGE_TYPE.takerWithdrawTxHash].join('_'),
            keyTakerSubmitWithdrawTx: [settlementId, MQ_MESSAGE_TYPE.takerSubmitWithdrawTx].join('_'),
            keyTakerSubmitWithdrawTxLocker: [settlementId, MQ_MESSAGE_TYPE.takerSubmitWithdrawTx, MQ_MESSAGE_TYPE.locker].join('_'),

            keyTakerRefundTxHash: [settlementId, MQ_MESSAGE_TYPE.takerRefundTxHash].join('_'),
            keyTakerSubmitRefundTx: [settlementId, MQ_MESSAGE_TYPE.takerSubmitRefundTx].join('_'),
            keyTakerSubmitRefundTxLocker: [settlementId, MQ_MESSAGE_TYPE.takerSubmitRefundTx, MQ_MESSAGE_TYPE.locker].join('_'),

            keyTakerApproveTxHash: [settlementId, MQ_MESSAGE_TYPE.takerApproveTxHash].join('_'),
            keyTakerSubmitApproveTx: [settlementId, MQ_MESSAGE_TYPE.takerSubmitApproveTx],
            keyTakerSubmitApproveTxLocker: [settlementId, MQ_MESSAGE_TYPE.takerSubmitApproveTx, MQ_MESSAGE_TYPE.locker].join('_')
        };
    }

    async makerCreateRefund(message) {
        const {settlementId} = message;
        const {keyMakerCreateRefundTxAndH, keyMakerCreateRefundTxAndHLocker, keyMakerPreImage, keyMakerHValue} = this.makerKeysMapping(settlementId);


        let hValue = this.readData(keyMakerHValue, true);
        let locker = this.readData(keyMakerCreateRefundTxAndHLocker, true);
        let hasHValue = !!hValue;
        let hasLocker = !!locker;
        if (!hasLocker) {
            try {
                this.insertData(keyMakerCreateRefundTxAndHLocker, true, true);
                if (!hasHValue) {
                    let preImage = Utils.createPreImage();
                    hValue = Utils.sha256Twice(preImage);
                    this.print('hValue: ', {hValue}, true);
                    this.insertData(keyMakerCreateRefundTxAndH, message, true);
                    this.insertData(keyMakerPreImage, preImage, true);
                    this.insertData(keyMakerHValue, hValue, true);
                }
                await this.settlementProvider.createRefundTxAndHCallback(message.chain, hValue, settlementId);
                this.insertData(keyMakerCreateRefundTxAndHLocker, false, true);
                this.event.emit(MQ_MESSAGE_TYPE.makerCreateRefundTxAndH, message);
            } catch (err) {
                this.insertData(keyMakerCreateRefundTxAndHLocker, false, true);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyMakerCreateRefundTxAndHLocker}`);
        }
    }

    async takerCreateRefund(message) {
        let data = message;
        const {settlementId, hValue} = data;
        const {keyTakerReceiveHAndCreateRefundTx, keyTakerReceiveHAndCreateRefundTxLocker, keyTakerHValue} = this.takerKeysMapping(settlementId);


        let hasHValue = !!this.readData(keyTakerHValue);
        let hasLocker = !!this.readData(keyTakerReceiveHAndCreateRefundTxLocker);
        if (!hasLocker) {
            try {
                this.insertData(keyTakerReceiveHAndCreateRefundTxLocker, true);
                if (!hasHValue) {
                    await this.insertData(keyTakerReceiveHAndCreateRefundTx, data);
                    await this.insertData(keyTakerHValue, hValue);
                }
                await this.settlementProvider.receiveHAndCreateRefundCallback(message.chain, settlementId);
                this.insertData(keyTakerReceiveHAndCreateRefundTxLocker, false);
                this.event.emit(MQ_MESSAGE_TYPE.takerReceiveHAndCreateRefundTx, message);
            } catch (err) {
                this.insertData(keyTakerReceiveHAndCreateRefundTxLocker, false);
                throw  err;
            }
        } else {
            this.logger.info(`operation=return||hasLocker=${hasLocker}||flow=${keyTakerReceiveHAndCreateRefundTxLocker}`);
        }
    }

    getGatewayProvider(chain, currency) {
        return GatewayProvider.init(chain, currency, this.debug, this.gateway, CONNECTION.TIMEOUT, LOGGER.LEVEL);
    }

    publicToAddress(chain, currency, publicKey, newWork) {
        let provider = ChainProvider.init(chain, currency);
        return provider.publicToAddress(publicKey, newWork);
    }

    readMakerData(key) {
        return this.readData(key, true);
    }

    insertMakerData(key, value) {
        return this.insertData(key, value, true);
    }

}

module.exports = Oracle;