const Identifier = require('../../identifier/identifier');
const _ = require('lodash');

const callbacks = {
    TRX: require('./trx/trx_callback'),
    BOS: require('./bos/bos_callback'),
    EOS: require('./eos/eos_callback'),
    ETH: require('./eth/eth_callback'),
    ZIL: require('./zil/zil_callback')
};

function CallbackProvider() {
}

module.exports = CallbackProvider;

CallbackProvider.init = function (chain, currency, event, config, cacheMap) {
    let identifier = new Identifier(chain, currency);
    let _instance = callbacks[_.toUpper(identifier.chain)];
    if (!_instance) {
        throw new Error(`Invalid callback instance with callbacks.${_.toUpper(identifier.chain)}`)
    }
    return new _instance(event, config, cacheMap);
};