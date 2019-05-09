const Identifier = require('../identifier/identifier');
const _ = require('lodash');

const gateways = {
    BTC: require('./btc/btc_gateway'),
    ETH: require('./eth/eth_gateway'),
    TRX: require('./trx/trx_gateway'),
    ZIL: require('./zil/zil_gateway'),
    EOS: require('./eos/eos_gateway'),
    BOS: require('./bos/bos_gateway'),
    MEETONE: require('./meetone/meetone_gateway'),
};

function GatewayProvider() {
}

module.exports = GatewayProvider;

GatewayProvider.init = function ({chain, currency, url}) {
    let identifier = new Identifier(chain, currency);
    let _instance = gateways[identifier.chain.toUpperCase()];
    if (!_instance) {
        throw new Error(`Invalid gateway instance with gateways.${_.toUpper(identifier.chain)}`)
    }
    return new _instance({
        identifier,
        url,
        label: "gateway"
    });
};
