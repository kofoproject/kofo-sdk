class Identifier {
    constructor(chain, currency) {
        if (!chain || !currency) {
            throw new TypeError(`Invalid params chain: ${chain}, currency: ${currency}`)
        }
        this.chain = chain.toLowerCase();
        this.currency = currency.toLowerCase();
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