const Identifier = require('../../identifier/identifier');
const _ = require('lodash');

const callbacks = {
    BTC: require('./btc/btc_callback'),
    ETH: require('./eth/eth_callback'),
    HPB: require('./hpb/hpb_callback'),
    TRX: require('./trx/trx_callback'),
    ZIL: require('./zil/zil_callback'),
    EOS: require('./eos/eos_callback'),
    BOS: require('./bos/bos_callback'),
    MEETONE: require('./meetone/meetone_callback')
};

function CallbackProvider() {
}

module.exports = CallbackProvider;

CallbackProvider.init = function (chain, currency, event, config, cacheMap) {
    let identifier = new Identifier(chain, currency);
    let _instance = callbacks[identifier.chain.toUpperCase()];
    if (!_instance) {
        throw new Error(`Invalid callback instance with callbacks.${_.toUpper(identifier.chain)}`)
    }
    return new _instance(event, config, cacheMap);
};