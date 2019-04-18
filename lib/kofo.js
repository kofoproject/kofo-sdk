const MqttService = require('./mqtt/serivce');
const EventEmitter = require("events");
const {messageHandlerMapping, signatureCallbackMapping} = require('./mapping/mapping');
const {CallbackProvider, MessageProvider} = require('./oracle/provider');

function Kofo() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this._event = new EventEmitter();
    this._config = config;
    this._cacheMap = new Map();
    this._mqService = new MqttService(config, this._event);
    this._mqService.subscribe(this._messageSchedule.bind(this));
}

module.exports = Kofo;

Kofo.prototype._messageSchedule = function (message) {
    const _self = this;
    try {
        let messageProvider = MessageProvider.init(message.chain, message.currency, _self._event, _self._config, _self._cacheMap);
        if (!messageProvider) {
            throw new Error(`Massage provider is undefined, flow settlementId=${message.settlementId}`);
        }
        let messageHandler = messageHandlerMapping(message.type, messageProvider);
        if (!messageHandler) {
            throw new Error(`Massage provider mappings does not support ${message.type}, flow settlementId=${message.settlementId}`);
        }
        messageHandler.call(messageProvider, message)
    } catch (error) {
        console.log(error);
    }
};

/**
 * @description Client receives message then signed callback
 * @param type Signature message type (required)
 * @param chain Blockchain corresponding to the signature (required)
 * @param currency Currency of the transaction (required)
 * @param settlementId  settlement order id (required)
 * @param signedRawTransaction Signed object (required)
 */
Kofo.prototype.signatureCallback = function (type, chain, currency, settlementId, signedRawTransaction) {
    try {
        let roleEnum = type.split('_').slice(0, 1).toString().toUpperCase(),
            signCallType = type.split('_').slice(1).join('_');
        const _self = this;
        let callbackProvider = CallbackProvider.init(chain, currency, _self._event, _self._config, _self._cacheMap);
        if (!callbackProvider) {
            throw new Error(`Signature callback provider is undefined, flow settlementId=${settlementId}, chain=${chain}, currency=${currency}, type=${type}`);
        }
        let signatureHandler = signatureCallbackMapping(signCallType, callbackProvider);
        if (!signatureHandler) {
            throw new Error(`Signature callback provider mappings does not support ${signCallType}, flow settlementId=${settlementId}, chain=${chain}, currency=${currency}, type=${type}`);
        }
        signatureHandler.call(callbackProvider, roleEnum, settlementId, signedRawTransaction);
    } catch (error) {
        console.log(error)
    }

};

/**
 * @description Client call the method， receive transaction sign message and status message
 * @param type Values: kofo_tx_signature || kofo_status_notice
 * @param listener Message  handler method
 */
Kofo.prototype.subscribe = function (type, listener) {
    this._event.addListener(type, listener)
};

/**
 * @description: Call the method init Kofo SDK
 * @returns {Kofo}
 */
Kofo.init = function () {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return new Kofo(config);
};