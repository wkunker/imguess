/*
 * A fork of imgrelay customized for imguess.
 */

var restify = require('restify');
var request = require('request');
var $ = require('jquery');
var exec = require('child_process').exec;
var fs = require('fs');
var config = require('./../../config.js');

var urls = [];
var accessHeaders = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '127.0.0.1'};
var iterator = 0; // Keep track of which URLs in the array have been read.

function local(req, res, next) {
	/*var net = require('net');
	var socket = net.connect({port:4321}, function () {
		socket.end('{search:"' + req.params.keywords + '"}');
	});
	
	socket.on('data', function(data) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(data);
	});*/


    if(urls.length > 0) {
        if(iterator < urls.length - 1) {
            iterator++;
        } else {
            iterator = 0;
        }

        res.writeHead(200, accessHeaders);
        res.end(urls[iterator]);

    } else {
        genUrl(function(result, error) {
            if(error === undefined) {
                res.writeHead(200, accessHeaders);
                res.end(result);
            } else {
                return next('FATAL ERROR');
            }
        });
    }



    return next();
}

var server = restify.createServer();

server.get('/', local);
server.head('/', local);

server.listen(8081, function() {
    console.log('%s listening at %s', server.name, server.url);

    console.log('config.js relayDataLocation: ' + config.relayDataLocation);

    urls = JSON.parse(fs.readFileSync(config.relayDataLocation + '/data.json'));
});
