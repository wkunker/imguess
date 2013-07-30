/*
 * Test of connecting 2 clients together then one sending a message to the other.
 */

var request = require('request');
var latch = require('./dep/latch.js');

var prbody1 = undefined;
var prbody2 = undefined;

var pairRequest = function() {
    request({method: 'POST', uri: 'http://192.168.0.16/p', json: {key: 'reqPair'}}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            prbody1 = body;
            latch.done();
        } else {
            console.log('pairRequest RESPONSE1 ERROR: ' + response.statusCode);
        }
    });

    request({method: 'POST', uri: 'http://192.168.0.16/p', json: {key: 'reqPair'}}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            prbody2 = body;
            latch.done();
        } else {
            console.log('pairRequest RESPONSE2 ERROR: ' + response.statusCode);
        }
    });
}

var msgRequest = function() {
    if(prbody1 === undefined || prbody2 === undefined) {
        throw new Exception("ABORTING: Message request failed.");
    } else {
        request({method: 'POST', uri: 'http://192.168.0.16/m', json: {uid: prbody2.uid, cid: prbody2.cid}}, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Client2 msg response: " + JSON.stringify(body));
            } else {
                console.log('msgRequest RESPONSE1 ERROR: ' + response.statusCode);
            }
        });
    }
}

var msgSend = function() {
    request({method: 'POST', uri: 'http://192.168.0.16/s', json: {uid: prbody1.uid, cid: prbody1.cid, msg: 'test'}}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Client1 msg SEND response: " + JSON.stringify(body));
        } else {
            console.log('msgSend RESPONSE1 ERROR: ' + response.statusCode);
        }
    });
}

var pairRequestFinished = function() {
    latch.reset();
    msgRequest();

    setTimeout(msgSend, 2000); // Give the server time to process the message requests before sending.
}

// Effectively make msgRequest wait until pairRequest is finished to begin execution.
latch.set(2, pairRequestFinished);
pairRequest();
