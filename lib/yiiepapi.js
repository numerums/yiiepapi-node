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
        this.version = 'v2';
        this.id = apiId;
        this.key = apiKey;
        this.mode = apiMode || 'test';
        if (this.mode === 'real') {
            this.host = 'https://yiiep.com'
        } else {
            this.host = 'https://sandbox.yiiep.com'
        }

        this.baseUrl = this.host + '/webapi/v2/';

    }

    /****** API Functions  ******/

    /**
     * Setup bill on Yiiep plateform
     * 
     * @param {String} billId 
     * @param {Float} billAmount 
     * @param {String} currency - ISO CODE
     * @return promise - Success Data contains : {bill, billhash, billstate, billQRStr,, billcrcy}
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

    /**
     * Transfert money to a Yiiep Account
     * 
     * @param {*} ammount 
     * @param {*} currency 
     * @param {*} receiver 
     * @return {Promise} - Success Data contains : [uref,tif,ftid,xofamount,xoffees,xofbalance,currency,rate,amount,fees,balance,date]
     */
    transfer(amount, currency, receiver) {
        var self = this;
        var data = {
            value: parseFloat(amount + 0),
            crcy: currency + '',
            to: receiver
        };

        return self.send('transfer', data);
    }

    /**
     * Transfert money to a Yiiep Account
     * 
     * @param {*} ammount 
     * @param {*} currency 
     * @param {*} receiver 
     * @return {Promise} - Success Data contains : [xofamount,xoffees,xofbalance,currency,rate,amount,fees,balance,date]
     */
    evaluate(amount, currency, receiver) {
        var self = this;
        var data = {
            value: parseFloat(amount + 0),
            crcy: currency + '',
            to: receiver
        };

        return self.send('evaluate', data);

    }

    /**
     * Build Yiiep pay link for a bill
     * 
     * @param {String} billHash  | Got from preset 
     * @param {String} classes | css classes for formating
     */
    payLink(billHash, classes) {
        var self = this;
        var payUri = self.payUri(billHash);
        return `<a class="${classes}" target="_blank" href="${payUri}">YiiepPay</a>`;
    }

    /**
     * Build Yiiep QR Code tag for a bill
     * 
     * @param {String} billHash | Got from billPreset
     * @param {String} qrStr  | Get from billPreset
     * @param {String} classes | Custom classes to personalise the link
     */
    payQR(billHash, classes) {
        var self = this;
        var qrSrc = self.qrSource(billHash);
        var payUri = self.appLinkUri(billHash);
        return `<a target="_blank" href="${payUri}" ><img src="${qrSrc}" class="${classes}"></a>`;
    }

    /**
     * Build Yiiep pay link to load Yiiep Mobile APP instead off scan
     * 
     * @param {String} billHash  | Get from billPreset
     * @param {String} qrStr  | Get from billPreset
     */
    appLinkUri(billHash) {
        var self = this;
        return this.host + `/webpay/?hash=${billHash}&vervion=` + this.version;
    }

    /**
     * Build Yiiep QR Code Image link for a bill
     * 
     * @param {String} billHash  | Got from preset 
     */
    qrSource(billHash) {
        var self = this;
        return self.baseUrl + 'qrcode/' + billHash;
    }

    /**
     * Build Yiiep QR Code link for a bill
     * 
     * @param {String} billHash  | Got from preset 
     */
    payUri(billHash) {
        var self = this;
        return self.baseUrl + 'pay/' + billHash;
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
        data.rseed = self.randomGuid(); //Just to make each call unique

        var signedData = JWT.sign({
            apicall: data
        }, self.key, {
            subject: path,
            issuer: 'Yiiep WebAPI'
        });

        var url = self.baseUrl + path;
        console.log('Yiiep Api Call -->> ', url);

        var request = {
            method: 'POST',
            uri: self.baseUrl + path,
            body: {
                identity: self.id,
                data: signedData
            },
            json: true // Automatically stringifies the body to JSON
        };

        return rp(request).then(function (response) {
            if (response.sdata) { //Signed data
                try {
                    var decoded = JWT.verify(response.sdata, self.key);
                    response = decoded.yiiepdata;
                } catch (err) {
                    return Promise.reject('Decode fail : ' + err.message);
                }
            }
            if (response.success === true) {
                return Promise.resolve(response.data);
            } else {
                return Promise.reject(response.message);
            }
        }).catch(function (err) {
            return Promise.reject('Request Failed : ' + (err.message || err));
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