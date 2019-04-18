const Identifier = require('../identifier/identifier');
const _ = require('lodash');

const gateways = {
    TRX: require('./trx/trx_gateway'),
    BOS: require('./bos/bos_gateway'),
    EOS: require('./eos/eos_gateway'),
    ETH: require('./eth/eth_gateway'),
    ZIL: require('./zil/zil_gateway')
};

function GatewayProvider() {
}

module.exports = GatewayProvider;

GatewayProvider.init = function ({chain, currency, url}) {
    let identifier = new Identifier(chain, currency);
    let _instance = gateways[_.toUpper(identifier.chain)];
    if (!_instance) {
        throw new Error(`Invalid gateway instance with gateways.${_.toUpper(identifier.chain)}`)
    }
    return new _instance({
        identifier,
        url,
        label: "gateway"
    });
};
