const Identifier = require('../../identifier/identifier');
const _ = require('lodash');

const oracles = {
    BTC: require('./btc/btc_oracle'),
    ETH: require('./eth/eth_oracle'),
    HPB: require('./hpb/hpb_oracle'),
    TRX: require('./trx/trx_oracle'),
    ZIL: require('./zil/zil_oracle'),
    EOS: require('./eos/eos_oracle'),
    BOS: require('./bos/bos_oracle'),
    MEETONE: require('./meetone/meetone_oracle')
};

function MessageProvider() {
}

module.exports = MessageProvider;

MessageProvider.init = function (chain, currency, event, config, cacheMap) {
    let identifier = new Identifier(chain, currency);
    let _instance = oracles[identifier.chain.toUpperCase()];
    if (!_instance) {
        throw new Error(`Invalid oracle instance with oracles.${_.toUpper(identifier.chain)}`)
    }
    return new _instance(event, config, cacheMap);
};