/*
 * server.js
 * 
 * A NodeJS/Restify backend server for imguess.com
 * 
 * Denny Kunker
 */

var request = require('request');
var restify = require('restify');
var uuid = require('node-uuid');
var config = require('./../config.js');

var pairQueue = [];
var alive = {};

console.log('Config loaded -- baseUrl: ' + config.baseUrl);

var chatTimeout = 15000; // 15000ms or 15s timeout when sending chat messages.
var heartbeatTimeout = 5000;

var accessHeaders = {
	'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.baseUrl
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/*
 * Blocks client until it can get the unique id.
 */
function request_pair(req, res, next) {
    console.log('PAIR REQUEST INCOMING...');
    console.log('Number of active users: ' + Object.size(alive) * 2);

	/*
	* Find the available client that has been waiting the longest,
	* generate a new key, and return it to the 2 clients.
	*/
	var untrusted_key = req.params.key;
	if(untrusted_key !== "reqPair") {
		return next(new restify.InvalidArgumentError('Invalid data supplied.'));
	}

	// Temporary variable used to pack data to API readable format before returning data.
	var ids;

    req.on("close", function() {
        // request closed unexpectedly


        if(ids !== undefined) {
            pairQueue[alive[ids.uid].queuePosition].res.writeHead(200, accessHeaders);
//            console.log('start sending alive:0 (request_pair)');
            pairQueue[alive[ids.uid].queuePosition].res.end(JSON.stringify([{cid: pairQueue[alive[ids.uid].queuePosition].c2, alive: '0'}]));
            _sendMessage(ids.uid, pairQueue[alive[ids.uid].queuePosition].c1, {alive:'0'});
//            console.log('finished sending alive:0 (request_pair)');
            pairQueue.splice(alive[ids.uid].queuePosition, 1);
            alive[ids.uid] = null;
            delete alive[ids.uid];
        }
    });

    req.on("end", function() {
        // request ended normally
//        console.log('request_pairs: end');
    });

	// another client is waiting to connect
	if(pairQueue.length > 0) {
        var stored_uid = pairQueue[0].uid;

        // inform the clients of the pair
        var ids1 = {uid: stored_uid, cid: alive[stored_uid].c1};
        var ids2 = {uid: stored_uid, cid: alive[stored_uid].c2};
        alive[stored_uid].lastConnection1 = Date.now();
        alive[stored_uid].lastConnection2 = Date.now();

        pairQueue[0].res.writeHead(200, accessHeaders);
        pairQueue[0].res.end(JSON.stringify(ids1));

        res.writeHead(200, accessHeaders);
        res.end(JSON.stringify(ids2));

        // remove the other client from the pairQueue
        pairQueue.splice(0,1);

        requestImage(stored_uid, alive[stored_uid].c1);
	} else {
		ids = {uid: uuid.v4().toString()};

		// no other clients in the queue so join and wait
		pairQueue.push({'uid': ids.uid, 'req': req, 'res': res});

		// Create unique GUIDs for each of the clients, so chats can't be spoofed, etc.
        // queuePosition is used for deletion later if necessary.
		alive[ids.uid] = {c1: uuid.v4().toString(), c2: uuid.v4().toString(), queuePosition: pairQueue.length - 1};
	}

	return next();
}

function request_message(req, res, next) {
	// Client must provide the UID (shared between both clients in the session) and CID (unique client identifier)
	//var untrusted_uid = url.parse(req.url, true).query.uid || "uid"; // GET
	//var untrusted_cid = url.parse(req.url, true).query.cid || "cid";
	var untrusted_uid = req.params.uid;
	var untrusted_cid = req.params.cid;

	if(
		untrusted_uid === undefined || untrusted_uid === null ||
		untrusted_cid === undefined || untrusted_cid === null
		) {
		return next(new restify.InvalidArgumentError('Arguments cid and uid must be supplied.'));
	}
	
	if(alive[untrusted_uid] === undefined || alive[untrusted_uid] === null) {
		return next(new restify.InvalidArgumentError('Invalid data supplied.'));
	}
	
	// First make sure the request is valid.
	if(
		alive[untrusted_uid].c1 !== untrusted_cid &&
		alive[untrusted_uid].c2 !== untrusted_cid
		) {
			return next(new restify.InvalidArgumentError('Invalid data supplied.'));
		}

    // Make sure 2 clients are not already connected.
    if(alive[untrusted_uid].c1 === untrusted_cid) {
        if(alive[untrusted_uid].res1 !== undefined && alive[untrusted_uid].res1 !== null) {
            res.writeHead(200, accessHeaders);
            res.end(JSON.stringify([{inUse: '1'}]));
            return next();
        }
    } else if(alive[untrusted_uid].c2 === untrusted_cid) {
        if(alive[untrusted_uid].res2 !== undefined && alive[untrusted_uid].res2 !== null) {
            res.writeHead(200, accessHeaders);
            res.end(JSON.stringify([{inUse: '1'}]));
            return next();
        }
    }

//    console.log('Connection1 lastTime: ' + Date.now() - alive[untrusted_uid].lastConnection1);
//    console.log('Connection2 lastTime: ' + Date.now() - alive[untrusted_uid].lastConnection2);

    if(Date.now() - alive[untrusted_uid].lastConnection1 > chatTimeout ||
        Date.now() - alive[untrusted_uid].lastConnection2 > chatTimeout) {

        res.writeHead(200, accessHeaders);
        res.end(JSON.stringify([{cid: untrusted_cid, alive:'0'}]));
        _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {cid: alive[untrusted_uid].c2, alive:'0'});
        _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {cid: alive[untrusted_uid].c1, alive:'0'});
        alive[untrusted_uid].c1 = null;
        delete alive[untrusted_uid].c1;
        alive[untrusted_uid].c2 = null;
        delete alive[untrusted_uid].c2;
        alive[untrusted_uid] = null;
        delete alive[untrusted_uid];

        return next();
    }


    req.on("close", function() {
        // request closed unexpectedly
//        console.log('request_message: close');
//        console.log('start sending alive:0 (request_message -- close)');
        _sendMessage(untrusted_uid, untrusted_cid, {alive:'0'});
//        console.log('finished sending alive:0 (request_message -- close)');
        alive[untrusted_uid] = null;
        delete alive[untrusted_uid];
    });

    req.on("end", function() {
//        console.log('request_message: end');
        // request ended normally
        //_sendMessage(untrusted_uid, untrusted_cid, {alive:'1'});
    });
	
	// Look in the chatQueue to see if a message is waiting from the other client.
	if(alive[untrusted_uid].c1 === untrusted_cid) {
        alive[untrusted_uid].lastConnection1 = Date.now();

        var heartbeat = function() {
            if(alive[untrusted_uid] !== undefined && alive[untrusted_uid] !== null) {
                _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {cid: alive[untrusted_uid].c2, alive:'1'});
                _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {cid: alive[untrusted_uid].c1, alive:'1'});
                alive[untrusted_uid].heartbeatRefresh = setTimeout(heartbeat, heartbeatTimeout);
            } else {
                _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {cid: alive[untrusted_uid].c2, alive:'0'});
                _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {cid: alive[untrusted_uid].c1, alive:'0'});
            }
        }

        if(alive[untrusted_uid].heartbeat === undefined || alive[untrusted_uid].heartbeat === null) {
            alive[untrusted_uid].heartbeatRefresh = setTimeout(heartbeat, heartbeatTimeout); // Other client has heartbeatTimeout ms to provide heartbeat.
            alive[untrusted_uid].heartbeat = heartbeat;
        }


//        console.log("Client1 msg request... " + Date.now().toString());
		if(alive[untrusted_uid].m2 === undefined || alive[untrusted_uid].m2 === null) { // Other client message will be on m2.
			alive[untrusted_uid].req1 = req;
			alive[untrusted_uid].res1 = res;
		} else {
			res.writeHead(200, accessHeaders);
			res.end(JSON.stringify(alive[untrusted_uid].m2));
            alive[untrusted_uid].m2 = null;
            delete alive[untrusted_uid].m2;
		}
	} else if(alive[untrusted_uid].c2 === untrusted_cid) {
        alive[untrusted_uid].lastConnection2 = Date.now();
        var heartbeat = function(){
            if(alive[untrusted_uid] !== undefined && alive[untrusted_uid] !== null) {
                _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {cid: alive[untrusted_uid].c2, alive:'1'});
                _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {cid: alive[untrusted_uid].c1, alive:'1'});
                alive[untrusted_uid].heartbeatRefresh = setTimeout(heartbeat, heartbeatTimeout);
            } else {
                _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {cid: alive[untrusted_uid].c2, alive:'0'});
                _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {cid: alive[untrusted_uid].c1, alive:'0'});
            }
        }

        if(alive[untrusted_uid].heartbeat === undefined || alive[untrusted_uid].heartbeat === null) {
            alive[untrusted_uid].heartbeatRefresh = setTimeout(heartbeat, heartbeatTimeout); // Other client has heartbeatTimeout to provide heartbeat.
            alive[untrusted_uid].heartbeat = heartbeat;
        }

		if(alive[untrusted_uid].m1 === undefined || alive[untrusted_uid].m1 === null) { // Other client message will be on m1.
//            console.log("Client2 msg request... " + Date.now().toString());
			alive[untrusted_uid].req2 = req;
			alive[untrusted_uid].res2 = res;
		} else {
			res.writeHead(200, accessHeaders);
			res.end(JSON.stringify(alive[untrusted_uid].m1));
            alive[untrusted_uid].m1 = null;
            delete alive[untrusted_uid].m1;
		}
	} else {
  //      console.log('Unknown data...')
    }

    return next();
}

// _sendMessage(untrusted_uid, untrusted_cid, untrusted_msg)
//
// Given the chat id, client id, and message to send, find
// the other client and ensure they receive untrusted_msg.
//
// untrusted_msg: message to be sent, normally as a string of JSON data
// untrusted_uid: id of the chat session
// untrusted_cid: id of the client sending the message.
function _sendMessage(untrusted_uid, untrusted_cid, untrusted_msg) {
//    console.log('_sendMessage... ' + JSON.stringify(untrusted_msg));
    untrusted_msg.cid = alive[untrusted_uid].c2;
    if(alive[untrusted_uid].c1 === untrusted_cid) { // Untrusted cid matched the first cid found on record, so grab the second set of data.
        if(alive[untrusted_uid].res2 !== undefined) {

            alive[untrusted_uid].res2.end(JSON.stringify([untrusted_msg])); // Direct pass through - no need to queue the data.
            alive[untrusted_uid].res2 = null;
            alive[untrusted_uid].req2 = null;
            delete alive[untrusted_uid].res2;
            delete alive[untrusted_uid].req2;
        } else { // Other client is not currently requesting - queue the data.
            if(alive[untrusted_uid].m1 === undefined || alive[untrusted_uid].m1 === null) {
                // This is the first message to hit the queue, so add it to a new array.
                alive[untrusted_uid].m1 = [untrusted_msg];
            } else {
                // This is not the first message to hit the queue, so add it to the existing array.
                alive[untrusted_uid].m1.push(untrusted_msg);
            }

            // If the other client can't retrieve the data within
            // chatTimeout seconds, the chat session will terminate.
            setTimeout(function() {
                if(Date.now() - alive[untrusted_uid].lastConnection2 > chatTimeout) {
//                    console.log('start sending alive:0 (sendMessage -- sendmessage timeout [1])');
                    _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {cid: alive[untrusted_uid].c2, alive:'0'});
                    _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {cid: alive[untrusted_uid].c1, alive:'0'});
  //                  console.log('finished sending alive:0 (sendMessage -- sendmessage timeout [1])');
                    if(alive[untrusted_uid].heartbeat !== undefined && alive[untrusted_uid].heartbeat !== null) {
                        alive[untrusted_uid].heartbeat = function(){} // Set to an empty function.
                        clearTimeout(alive[untrusted_uid].heartbeatRefresh);
                    }

                    alive[untrusted_uid] = null;
                    delete alive[untrusted_uid];
                }
            }, chatTimeout);
        }
    } else { // Untrusted cid matched the second cid found on record, so grab the first set of data.
        untrusted_msg.cid = alive[untrusted_uid].c1;
        if(alive[untrusted_uid].res1 !== undefined) {
            alive[untrusted_uid].res1.end(JSON.stringify([untrusted_msg])); // Direct pass through - no need to queue the data.
            alive[untrusted_uid].res1 = null;
            alive[untrusted_uid].req1 = null;
            delete alive[untrusted_uid].res1;
            delete alive[untrusted_uid].req1;
        } else { // Other client is not currently requesting - queue the data.
            if(alive[untrusted_uid].m2 === undefined || alive[untrusted_uid].m2 === null) {
                // This is the first message to hit the queue, so add it to a new array.
                alive[untrusted_uid].m2 = [untrusted_msg];
            } else {
                // This is not the first message to hit the queue, so add it to the existing array.
                alive[untrusted_uid].m2.push(untrusted_msg);
            }

            // If the other client can't retrieve the data within
            // chatTimeout seconds, the chat session will terminate.
            setTimeout(function() {
                if(Date.now() - alive[untrusted_uid].lastConnection1 > chatTimeout) {
//                    console.log('start sending alive:0 (sendMessage -- sendmessage timeout [2])');
                    _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {alive:'0'});
                    _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {alive:'0'});
  //                  console.log('finished sending alive:0 (sendMessage -- sendmessage timeout [2])');

                    if(alive[untrusted_uid].heartbeat !== undefined && alive[untrusted_uid].heartbeat !== null) {
                        alive[untrusted_uid].heartbeat = function(){} // Set to an empty function.
                        clearTimeout(alive[untrusted_uid].heartbeatRefresh);
                    }

                    alive[untrusted_uid] = null;
                    delete alive[untrusted_uid];
                }
            }, chatTimeout);
        }
    }
}

function send_message(req, res, next) {
	// Client must provide the UID (shared between both clients in the session) and CID (unique client identifier)
	//var untrusted_uid = url.parse(req.url, true).query.uid || "uid";
	//var untrusted_cid = url.parse(req.url, true).query.cid || "cid";
	var untrusted_uid = req.params.uid;
	var untrusted_cid = req.params.cid;
	var untrusted_msg = req.params.msg;

    if(untrusted_msg === "") {

        res.writeHead(200, accessHeaders);
        res.end(JSON.stringify({error: 'Message must contain something.'}));

        return next();
    }

	if(
		untrusted_uid === undefined || untrusted_uid === null ||
		untrusted_cid === undefined || untrusted_cid === null ||
		untrusted_msg === undefined || untrusted_msg === null
		) {
		return next(new restify.InvalidArgumentError('Arguments cid and uid must be supplied.'));
	}

    if(alive[untrusted_uid] === undefined || alive[untrusted_uid] === null) {
        return next(new restify.InvalidArgumentError('Correct arguments, but invalid data supplied.'));
    }
	
	// First make sure the request is valid.
	if(
		alive[untrusted_uid].c1 !== untrusted_cid &&
		alive[untrusted_uid].c2 !== untrusted_cid
		) {
			return next(new restify.InvalidArgumentError('Correct arguments, but invalid data supplied.'));
	}

    console.log('preparing to send message...');
	_sendMessage(untrusted_uid, untrusted_cid, {msg: untrusted_msg});
	
	res.writeHead(200, accessHeaders);
	res.end("ok");

    return next();
}

function client_disconnect(req, res, next) {
    // Client must provide the UID (shared between both clients in the session) and CID (unique client identifier)
    //var untrusted_uid = url.parse(req.url, true).query.uid || "uid";
    //var untrusted_cid = url.parse(req.url, true).query.cid || "cid";
    var untrusted_uid = req.params.uid;
    var untrusted_cid = req.params.cid;

    if(
        untrusted_uid === undefined || untrusted_uid === null ||
            untrusted_cid === undefined || untrusted_cid === null
        ) {
        return next(new restify.InvalidArgumentError('Arguments cid and uid must be supplied.'));
    }

    if(alive[untrusted_uid] === undefined || alive[untrusted_uid] === null) {
        return next(new restify.InvalidArgumentError('Correct arguments, but invalid data supplied.'));
    }

    if(alive[untrusted_uid].c1 === undefined || alive[untrusted_uid].c1 === null ||
        alive[untrusted_uid].c2 === undefined || alive[untrusted_uid].c2 === null) {

        // Chat session has already been terminated, but the client isn't aware.
        // Inform the client it's OK, since the client's goal has been accomplished.

        res.writeHead(200, accessHeaders);
        res.end("ok");

        return next();
    }

    // First make sure the request is valid.
    if(
        alive[untrusted_uid].c1 !== untrusted_cid &&
            alive[untrusted_uid].c2 !== untrusted_cid
        ) {
        return next(new restify.InvalidArgumentError('Correct arguments, but invalid data supplied.'));
    }

    // Inform the other client of disconnect.
//    console.log('start sending alive:0 (disconnect)');
    _sendMessage(untrusted_uid, untrusted_cid, {alive:'0'});
//    console.log('finished sending alive:0 (disconnect)');

    alive[untrusted_uid] = null;
    delete alive[untrusted_uid];

    res.writeHead(200, accessHeaders);
    res.end("ok");

    return next();
}

// "call and forget" -- no callback needed. Clients will be notified through the messaging system when image is ready.
var requestImage = function(untrusted_uid, untrusted_cid) {
    var getImgUrl = function(callback) {
        request({method: 'GET', uri: 'http://127.0.0.1:8081'}, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(body);
            } else {
                callback(body, true);
                console.log('RESPONSE ERROR: ' + response.statusCode);
                err = true;
            }
        });
    }

    if(
        untrusted_uid === undefined || untrusted_uid === null ||
            untrusted_cid === undefined || untrusted_cid === null
        ) {
        console.log('Arguments cid and uid must be supplied.');
        return;
    }

    if(alive[untrusted_uid] === undefined || alive[untrusted_uid] === null) {
        console.log('Invalid data supplied.');
        return;
    }

    // First make sure the request is valid.
    if(
        alive[untrusted_uid].c1 !== untrusted_cid &&
            alive[untrusted_uid].c2 !== untrusted_cid
        ) {
        console.log('Correct arguments, but invalid data supplied.');
        return;
    }

    // Make sure the image is not already existent, or that it's not currently being generated (image_gen).
    if(alive[untrusted_uid].image_gen === undefined || alive[untrusted_uid].image_gen === null) {
        // Generate image.
        alive[untrusted_uid].image_gen = true;

        getImgUrl(function(data, err) {
            if(err) {
                console.log("Error trying to get image url (imgrelay scrape server down?)")
            }
            alive[untrusted_uid].img = data;

            _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {img:alive[untrusted_uid].img});
            _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {img:alive[untrusted_uid].img});
        });
    } else if(alive[untrusted_uid].img === undefined || alive[untrusted_uid].img === null) {
        // Image is being generated, but isn't ready yet. Do nothing since we are still waiting.
    } else {
        // Image already exists, so simply relay the message to the clients.
        _sendMessage(untrusted_uid, alive[untrusted_uid].c1, {img:alive[untrusted_uid].img});
        _sendMessage(untrusted_uid, alive[untrusted_uid].c2, {img:alive[untrusted_uid].img});
    }
}

var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());

/*
 * Called when client is requesting a pair.
 * Returns a unique key for the chat session, and the system
 * then waits for input from either side.
 */
server.post('/p', request_pair);
server.head('/p', request_pair);

/*
 * Wait for a chat message to come in.
 */
server.post('/m', request_message);
server.head('/m', request_message);

/*
 * Send a message to the server.
 */
server.post('/s', send_message);
server.head('/s', send_message);

server.post('/x', client_disconnect);
server.head('/x', client_disconnect);

server.listen(8080, function() {
	console.log('%s listening at %s', server.name, server.url);
});
