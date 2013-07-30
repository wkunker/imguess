var createChatLine = function(user, msg) {
    if(user === 'Me') {
        return  createLineBreak() + "<span class='identifierTextMe'>" + user + ": </span><span>: " + msg + "</span>";
    } else {
        return  createLineBreak() + "<span class='identifierTextThem'>" + user + ": </span><span>: " + msg + "</span>";
    }
}

var createLineBreak = function() {
    return "<br>";
}

var submitChat = function() {
    var chatOutput = $('#chatOutput');
    var inputTextVal = $('#input_text').val();
    var chatLog = $('#chatLog');

    $('#input_text').val('');

    if(inputTextVal === "") {
        return;
    }

    sendMessage(inputTextVal);
    chatOutput.html(chatOutput.html() + createChatLine('Me', inputTextVal));

    chatLog.scrollTop(chatLog[0].scrollHeight);
}

// From other client.
var receiveChat = function(msg) {
    var chatOutput = $('#chatOutput');
    var chatLog = $('#chatLog');

    chatOutput.html(chatOutput.html() + createChatLine('Them', msg));
    chatLog.scrollTop(chatLog[0].scrollHeight);
}
