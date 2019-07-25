const _ = require('lodash');
const KofoUtils = require('kofo-utils');
const {KOFO_EVENT_TYPE} = require('../common/constant');
const GatewayProvider = require('../gateway/provider');
const Settlement = require('../settlement/settlement');

class BaseOracle {
    constructor(event, config, cacheMap) {
        config = _.pick(config, ['insertData', 'readData', 'gateway', 'settlement', 'network', 'mqOptions', 'cacheEncrypt']);
        if (!config.hasOwnProperty('cacheEncrypt')) {
            config.cacheEncrypt = true;
        }
        this.kofoId = KofoUtils.sha256(config.mqOptions.kofoId).toString('hex');
        this.config = config;
        this.event = event;
        this.cacheMap = cacheMap;
        this.settlementProvider = Settlement.provider({url: config.settlement})
    }

    /**
     * @description Maker and Taker transaction each status notification unified handling
     * @param type Event status type
     * @param message Notification message
     */
    statusNotice(type, message) {
        this.event.emit(KOFO_EVENT_TYPE.STATUS_NOTICE, _.assign(message, {type}))
    }

    /**
     * @description  Maker and Taker before sending the transaction, the notification client signature will be processed uniformly

     */
    signatureNotice(type, chain, currency, publicKey, settlementId, tx) {
        let rawTransaction = tx.hasOwnProperty('signHashList') && ['btc', 'eos', 'bos', 'meetone'].indexOf(chain) >= 0 ? tx.signHashList : tx.rawTransaction;
        this.event.emit(KOFO_EVENT_TYPE.SIGNATURE_NOTICE, {
            type,
            chain,
            currency,
            publicKey,
            settlementId,
            rawTransaction
        })
    }

    /**
     * @description Gateway provider
     * @param chain Block chain name
     * @param currency Transaction currency
     */
    getGatewayProvider(chain, currency) {
        const {gateway: url} = this.config;
        return GatewayProvider.init({chain, currency, url});
    }

    /**
     * @description Read client storage data by key
     * @param key
     * @returns {*}
     */
    async readData(key) {
        const self = this;
        let data = self.cacheMap.get(key) || await this.config.readData(key);
        if (data === undefined || _.isBoolean(data) || data === null) {
            return data;
        }
        if (self.config.cacheEncrypt) {
            data = KofoUtils.decrypt(data, KofoUtils.sha256Twice([key, self.kofoId].join('_')).toString('hex'));
            try {
                data = JSON.parse(data);
            } catch (e) {
                return data;
            }
            return data;
        } else {
            return data;
        }
    }

    /**
     * @description Storage data to client
     * @param key
     * @param value
     * @returns {*|void}
     */
    async insertData(key, value) {
        const self = this;
        let data;
        if (!self.config.cacheEncrypt || _.isBoolean(value) || value === null || value === undefined) {
            data = value;
        } else {
            data = KofoUtils.encrypt(value, KofoUtils.sha256Twice([key, self.kofoId].join('_')).toString('hex'));
        }
        self.cacheMap.set(key, data);
        await self.config.insertData(key, data);
    }

    /**
     * @description Format cache settlement order data by roleEnum
     * @param roleEnum
     * @param settlementData
     */
    formatSettlement(roleEnum, settlementData) {
        roleEnum = roleEnum.toLowerCase();
        let opposite = roleEnum === 'maker' ? 'taker' : 'maker';
        const fields = ['Amount', 'Chain', 'CounterChainPubKey', 'Currency', 'Locktime', 'LockId', 'PubKey', 'ConfirmThreshold', 'Fee', 'AdminPubKey', 'AddressType', 'CounterChainAddressType'];

        let docs = {};
        fields.forEach((key) => {
            docs[_.lowerFirst(key)] = settlementData[roleEnum + key];
        });
        docs.lockTime = docs.locktime;

        fields.forEach((key) => {
            docs['opposite' + key] = settlementData[opposite + key];
        });
        docs.oppositeLockTime = docs.oppositeLocktime;
        return _.omit(docs, 'locktime', 'oppositeLocktime');
    }
}

module.exports = BaseOracle;