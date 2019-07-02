# KOFO SDK
KOFO cross chain atomic exchange，Currently supporting **`USDT`** **`ETH/ERC20`** **`HPB`**  **`TRON`** **`ZILLIQA`** **`EOS`** **`BOS`** **`MEETONE`**
## Install and import

```bash
npm install kofo-sdk --save
```
```js
const {Kofo, Utils} = require('kofo-sdk');

import {Kofo, Utils} from 'kofo-sdk';
```

## Include
* Html script tag useage demo
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
</head>
<body>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
<script src="https://pre.kofo.io/kofo/kofosdk.js"></script>
<script src="https://pre.kofo.io/kofo/kofowallet.js"></script>
<script>
    //Kofo is a global object. Contains Utils and Sdk, e.g: Kofo.Utils.createKofoId() and Kofo.Sdk.init(options).
    //Documentation at https://github.com/kofoproject/kofo-sdk/blob/master/docs/API.md
    const FIELDS = ['deviceId', 'kofoId', 'nonce', 'overwrite', 'timestamp'];
    const OPT = {
        privateKey: {
            EOS: '5Jh1n436LqN2XcXScqo22pg7X66CLrMeM6HxCRVGqoheQEnMeYh', //Test network
            BOS: '5Jh1n436LqN2XcXScqo22pg7X66CLrMeM6HxCRVGqoheQEnMeYh', //Test network
            MEETONE: '5Jh1n436LqN2XcXScqo22pg7X66CLrMeM6HxCRVGqoheQEnMeYh' //Test network
        },
        secret: '3794ff84216d866b8e5f3e890f7dcc2ae3bfe3f3e05809f1c050ab16b93bd491', //KOFO ID = KOFO2BHsbzE6ktUGD9a9xSQjChvQzR7B8eeDkN57wznNSL936
        deviceId: '07FED02BDB20EFE52',
        nonce: 1,
        overwrite: 0
    };
    let cacheMap = new Map();
    let kofo;

    let readData = (key) => {
        return cacheMap.get(key);
    };

    let insertData = (key, value) => {
        return cacheMap.set(key, value);
    };

    let createMqOptions = (options) => {
        options = _.cloneDeep(options);
        if (!options.hasOwnProperty('timestamp')) {
            options.timestamp = new Date().getTime();
        }
        if (!options.hasOwnProperty('kofoId')) {
            options.kofoId = Kofo.Utils.createKofoIdBySecret(options.secret);
        }
        let secret = options.secret;
        options = _.pick(options, FIELDS);

        let usernameArrays = _.map(FIELDS.sort(), (key) => {
            return `${key}=${options[key]}`;
        });
        let username = usernameArrays.join('&');
        let password = Kofo.Utils.sign(secret, username);
        return {username, password, kofoId: options.kofoId};

    };

    let resetMqOptions = () => {
        return createMqOptions(OPT);
    };

    let createMsgEel = (data) => {
        let el = document.createElement("div");
        el.innerHTML = `<div class="panel panel-default"><div class="panel-heading"><h5 class="panel-title">${_.toUpper(data.type)}</h5></div><div class="panel-body">${data.type === 'init_mqtt' ? data.message : JSON.stringify(data)}</div></div>`;
        document.getElementById('content').append(el);
    };

    let listener = (data) => {
        createMsgEel(data);
    };

    let signatureTxHandler = async (data) => {
        createMsgEel(data);
        let {type, chain, currency, rawTransaction, settlementId} = data;
        let {privateKey} = OPT;
        let wallet = KofoWallet.importPrivateWallet({
            chain: chain.toUpperCase(),
            currency: currency.toUpperCase(),
            privateKey: privateKey[chain.toUpperCase()]
        });
        let signedRawTransaction = await wallet.sign(rawTransaction);
        kofo.signatureCallback(type, chain, currency, settlementId, signedRawTransaction);
    };

    let initSdk = () => {
        //Contact us for specific “mqUrl” “gateway” “settlement” if testing is required
        let options = {
            mqUrl: 'ws://localhost:8083/mqtt',
            gateway: 'http://localhost:8080/gateway',
            settlement: 'http://localhost:8080/settlement-server',
            insertData,
            readData,
            resetMqOptions,
            mqOptions: createMqOptions(OPT),
            cacheEncrypt: false
        };
        if (kofo)
            return alert('Kofo sdk has been initialized!');

        kofo = Kofo.Sdk.init(options);
        kofo.subscribe('kofo_status_notice', listener);
        kofo.subscribe('kofo_tx_signature', signatureTxHandler);
    };

    let stop = () => {
        if (!kofo)
            return alert('Kofo is not initialized!');
        kofo.stop();
        kofo = null;
    };

    let printCache = () => {
        let cache = {};
        cacheMap.forEach((value, key) => {
            cache[key] = value;
        });
        console.log(JSON.stringify(cache));
    };
</script>
<div>
    <div class="button-div">
        <button class="btn btn-primary" onclick="initSdk()">init sdk</button>
        <button class="btn btn-danger" onclick="stop()">stop connect</button>
        <button class="btn btn-default" onclick="printCache()">print cache</button>
    </div>
    <div id="content"></div>
</div>
</body>
</html>
<style>
    .button-div {
        padding: 5px;
        width: 100%;
        height: 100%;
        text-align: center;
    }
    #content {
        width: 100%;
        padding-left: 20px;
        padding-right: 20px;
        padding-top: 8px;
    }
    .panel {
        margin-bottom: 5px;
    }
    .panel-body {
        word-break: break-word;
    }
</style>
```


#### [sdk demo](https://github.com/kofoproject/kofo-sdk-demo)


#### [documentation](https://github.com/kofoproject/kofo-sdk/blob/master/docs/API.md)


#### [kofo website](https://kofo.io/#/en)