const MqttService = require('./mqtt/serivce');
const EventEmitter = require("events");
const {messageHandlerMapping, signatureCallbackMapping} = require('./mapping/mapping');
const MessageOracle = require('./oracle/message_oracle');
const SignatureCallback = require('./oracle/signature_callback');

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
        let messageOracle = new MessageOracle(_self._event, _self._config, _self._cacheMap);
        let messageHandler = messageHandlerMapping(message.type, messageOracle);
        if (!messageHandler) {
            throw new Error(`Massage provider mappings does not support ${message.type}, flow settlementId=${message.settlementId}`);
        }
        messageHandler.call(messageOracle, message)
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
        let signatureCallback = new SignatureCallback(_self._event, _self._config, _self._cacheMap);
        let signatureHandler = signatureCallbackMapping(signCallType, signatureCallback);
        if (!signatureHandler) {
            throw new Error(`Signature callback provider mappings does not support ${signCallType}, flow settlementId=${settlementId}, chain=${chain}, currency=${currency}, type=${type}`);
        }
        signatureHandler.call(signatureCallback, roleEnum, settlementId, signedRawTransaction);
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
 * Close mqtt client, accepts the following options.  More info at https://www.npmjs.com/package/mqtt#end
 * @param force Passing it to true will close the client right away, without waiting for the in-flight messages to be acked. This parameter is optional.
 * @param options Options of disconnect.
 *        reasonCode: Disconnect Reason Code number
 *        properties: object
 *        cb: will be called when the client is closed. This parameter is optional.
 * @param cb Will be called when the client is closed. This parameter is optional.
 */
Kofo.prototype.stop = function (force, options, cb) {
    this._mqService.stop(force, options, cb);
};

/**
 * @description: Call the method init Kofo SDK
 * @returns {Kofo}
 */
Kofo.init = function () {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return new Kofo(config);
};
