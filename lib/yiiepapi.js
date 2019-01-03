'use strict;'
var JWT = require('jsonwebtoken');
var Promise = require('bluebird');
var rp = require('request-promise');

class YiiepApi {

    /**
     * Constructor 
     * 
     * @param {String} apiId | Webseller api ID
     * @param {String} apiKey | Webseller api key
     * @param {String} apiMode | ['test', 'real'] - Default is Test mode
     */
    constructor(apiId, apiKey, apiMode) {
        this.id = apiId;
        this.key = apiKey;
        this.mode = apiMode || 'test';
    }

    /****** API Functions  ******/

    /**
     * Setup bill on Yiiep plateform
     * 
     * @param {String} billId 
     * @param {Float} billAmount 
     * @param {String} currency - ISO CODE
     * @returns {Promise}
     */
    presetBill(billId, billAmount, currency) {
        var self = this;
        var data = {
            bill: billId + '',
            value: parseFloat(billAmount + 0),
            crcy: currency + ''
        };

        return self.send('preset', data);
    }


    /**
     * Cancel Bill on Yiiep plateform
     * 
     * @param {String} billHash | Got from preset
     * @returns {Promise}
     */
    unsetBill(billHash) {
        var self = this;
        var data = {
            hash: billHash + ''
        };

        return self.send('unset', data);
    }

    /**
     * Pay Bill
     * 
     * @param {String} billHash | Got from preset
     * @param {String} payCode | Mobile money transfert code
     * @returns {Promise}
     */
    payBill(billHash, payCode) {
        var self = this;
        var data = {
            hash: billHash + '',
            paycode: payCode + ''
        };

        return self.send('pay', data);
    }

    /**
     * Get bill state
     * 
     * @param {String} billHash | Got from preset
     * @returns {Promise}
     */
    checkBill(billHash) {
        var self = this;
        var data = {
            hash: billHash + ''
        };

        return self.send('bstate', data);
    }

    /**
     * Refund paid bill
     * @returns {Promise}
     * 
     * @param {String} billHash | Got from preset
     */
    refundBill(billHash) {
        var self = this;
        var data = {
            hash: billHash + ''
        };

        return self.send('refund', data);
    }

    /**
     * Get web seller account state
     * @returns {Promise}
     */
    accountState() {
        var self = this;
        var data = {};

        return self.send('astate', data);
    }

    /****** Utility Functions  ******/

    /**
     * Send data to Yiiep
     * 
     * @param {String} path | Yiiep API request path
     * @param {Oject} data  | Api Request params
     * @returns {Promise}
     */
    send(path, data) {
        var self = this;

        data.identity = self.id; //Web seller ID
        data.mode = self.mode; //API operation mode
        data.rseed = randomGuid(); //Just to make each call unique

        var signedData = JWT.sign(data, self.key, {
            expiresIn: 5 //5 minute
        });

        var request = {
            method: 'POST',
            uri: 'https://yiiep.com//webapi/v2/' + path,
            body: {
                identity: self.id,
                data: signedData
            },
            json: true // Automatically stringifies the body to JSON
        };

        return rp(request).then(function (response) {
            if(response.success === true){
                return Promise.resolve(response.data);
            }else{
                return Promise.reject(response.message);
            }
        }).catch(function (err) {
            return Promise.reject('Request Failed : ' + err.message);
        });

    }

    /**
     * Generate rangom GUID like string
     * @returns {String}
     */
    randomGuid() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

}

module.exports = YiiepApi;