/*
 * Minimalistic latch system to simplify writing synchronous chains of requests.
 */
var latchNum = 0;
var latchCallback = undefined;

// num: How many unlatch() calls need to be made before callback is executed
// callback: Called when all required unlatch() calls have been made.
exports.set = function(num, callback) {
    latchNum = num;
    latchCallback = callback;
}

// Called when a latch operation has completed.
exports.done = function() {
    latchNum--;
    if(latchNum <= 0) {
        latchNum = 0;

        if(latchCallback === undefined) {
            throw new Exception("Latch callback was not defined.");
        } else {
            latchCallback();
        }
    }
}

// Reset to default state (BEFORE set() was ever called)
exports.reset = function() {
    latchNum = 0;
    latchCallback = undefined;
}