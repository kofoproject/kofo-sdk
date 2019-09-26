const Mqtt = require('mqtt');
const EventEmitter = require("events");
const _ = require('lodash');
const {KOFO_EVENT_TYPE, NOTICE_TYPE, MQTT_CONNECT_STATUS} = require('../common/constant');

/**
 * MQTT service
 */
class MqttService {
    constructor({mqUrl, mqOptions, resetMqOptions}, event) {
        this.statusEvent = event;
        this.mqUrl = mqUrl;
        this.mqOptions = mqOptions;
        this.resetMqOptions = resetMqOptions;
        this.event = new EventEmitter();
        this.MESSAGE_TYPE = 'mqtt_message_sub';
        this.init();
    }

    /**
     * Init mqtt client
     */
    init() {
        let {username, password, kofoId: clientId} = this.mqOptions;
        this.mqtt = Mqtt.connect(this.mqUrl, {username, password, clientId});
        this.connect();
        this.kofoId = this.mqOptions.kofoId;
    }

    connect() {
        this.mqtt.on("error", this.onError.bind(this));
        this.mqtt.on("close", this.onClose.bind(this));
        this.mqtt.on("connect", this.onConnect.bind(this));
        this.mqtt.on("message", this.onMessage.bind(this));
        this.mqtt.on("reconnect", this.onReconnect.bind(this));
    }

    /**
     * @description Connection error
     * @param error
     */
    async onError(error) {
        this.statusNotice(MQTT_CONNECT_STATUS.ERROR, error.message);
        this.mqtt.end(true);
        if (!this.resetMqOptions || !_.isFunction(this.resetMqOptions)) {
            return;
        }
        let mqOptions = await this.resetMqOptions();
        if (!mqOptions || !mqOptions.hasOwnProperty('username')) {
            return this.statusNotice(MQTT_CONNECT_STATUS.ERROR, `reset mq options no hash property 'username', kofoId=${this.kofoId}`);
        }
        this.mqOptions = mqOptions;
        this.init();
        console.log(`kofoId=${this.kofoId}, re-sign username and password.`);
    }

    /**
     * @description MQTT connected event
     */
    onConnect() {
        this.mqtt.subscribe(this.kofoId, (err) => {
            if (err) {
                return this.statusNotice(MQTT_CONNECT_STATUS.ERROR, `subscribe kofoId: ${this.kofoId} error, message=${err.message}`);
            }
            this.statusNotice(MQTT_CONNECT_STATUS.CONNECTED, `Init sdk success and connected mqtt server. kofoId=${this.kofoId}`);
        });
    }

    /**
     * @description MQTT close event
     */
    onClose() {
        this.statusNotice(MQTT_CONNECT_STATUS.CLOSED, `mqtt server closed. kofoId=${this.kofoId}`);
    }

    /**
     * @description MQTT reconnect event
     */
    onReconnect() {
        this.statusNotice(MQTT_CONNECT_STATUS.RECONNECT, `mqtt server reconnect. kofoId=${this.kofoId}`);
    }

    /**
     * @description MQTT success subscribe clintId and receive message handler
     * @param topic
     * @param mqObj
     */
    onMessage(topic, mqObj) {
        try {
            let messageObject = JSON.parse(mqObj.toString());
            if (!messageObject || !messageObject.body || !messageObject.body.type) {
                throw new Error(`kofoId=${this.kofoId} subscription message invalid. message=${messageObject.toString()}`)
            }
            let {body: message} = messageObject;
            this.event.emit(this.MESSAGE_TYPE, _.assign(_.omit(message.data, '@type'), _.pick(message, ['chain', 'currency', 'type'])));
        } catch (error) {
            console.log(error);
        }

    };

    /**
     * @description Init sdk notice client mqtt status
     * @param status
     * @param message
     */
    statusNotice(status, message) {
        this.statusEvent.emit(KOFO_EVENT_TYPE.STATUS_NOTICE, {type: NOTICE_TYPE.INIT_SDK, status, message})
    }


    /**
     * @description Provide kofo message handler and event emitter
     * @param listener
     */
    subscribe(listener) {
        this.event.addListener(this.MESSAGE_TYPE, listener);
    }

    /**
     * Close the client, accepts the following options. More info https://www.npmjs.com/package/mqtt#end
     * @param force Passing it to true will close the client right away, without waiting for the in-flight messages to be acked. This parameter is optional.
     * @param options Options of disconnect.
     *        reasonCode: Disconnect Reason Code number
     *        properties: object
     *        cb: will be called when the client is closed. This parameter is optional.
     * @param cb Will be called when the client is closed. This parameter is optional.
     */
    stop(force, options, cb){
        this.statusNotice(MQTT_CONNECT_STATUS.END, `Mqtt client end. kofoId=${this.kofoId}`);
        this.mqtt.end(force, options, cb);
    }

}

module.exports = MqttService;