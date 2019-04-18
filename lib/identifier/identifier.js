const {IDENTIFIERS} = require('../common/constant');
const _ = require('lodash');


class Identifier {
    constructor(chain, currency) {
        chain = _.toUpper(chain);
        currency = _.toUpper(currency);
        if (!_.includes(_.keys(IDENTIFIERS), _.toUpper(chain))) {
            throw new TypeError(`Invalid chain "${chain}"`);
        }

        if(!_.includes(IDENTIFIERS[chain], currency)){
            throw new TypeError(`Invalid currency "${currency}"`);
        }
        this.chain = chain ? chain.toLowerCase() : chain;
        this.currency = currency ? currency.toLowerCase() : currency;
    }

    toString() {
        return this.isToken ? `${this.chain}|TOKEN` : this.toStringChainCurrency();
    }

    toStringChainCurrency() {
        return `${this.chain}|${this.currency}`;
    }

    get isToken() {
        return Boolean(this.chain !== this.currency);
    }


    headers() {
        return {
            chain: this.chain,
            currency: this.currency,
        };
    }

    export() {
        return {
            chain: this.chain,
            currency: this.currency,
            isToken: this.isToken,
        };
    }
}

module.exports = Identifier;