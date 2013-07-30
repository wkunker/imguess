/*
 * Test of a pair request between 2 API clients.
 */

var request = require('request');
var latch = require('./dep/latch.js')

var bod1;

var pairRequestFinished = function() {
    request({method: 'POST', uri: 'http://192.168.0.16/x', json: bod1}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('KILL MSG: ' + JSON.stringify(body))
        } else {
            console.log('KILL ERROR: ' + response.statusCode);
        }
    });
}

latch.set(2, pairRequestFinished);

request({method: 'POST', uri: 'http://192.168.0.16/p', json: {key: 'reqPair'}}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log('RESPONSE1: ' + JSON.stringify(body));
        bod1 = body;
        latch.done();
    } else {
        console.log('RESPONSE1 ERROR: ' + response.statusCode);
    }
});

request({method: 'POST', uri: 'http://192.168.0.16/p', json: {key: 'reqPair'}}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log('RESPONSE2: ' + JSON.stringify(body));
        latch.done();
    } else {
        console.log('RESPONSE2 ERROR: ' + response.statusCode);
    }
});