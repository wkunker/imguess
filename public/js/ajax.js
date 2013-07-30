var baseUrl = $('#baseUrl').html();

var image_orig;

var connected = false;

var chatHistory = [];

var reconnectCooldownTime = 0; // Time in ms that must be waited until another pair request can be made.
var reconnectCooldownInProgress = false; // True when pair request has been made too recently.

// Write over the DOM image with the loading animation.
var loadingAnimation = function(show) {
    if(show) {
		$('#image').css({'display': 'inline'});
        $('#image').attr('src', 'img/loading.png')
        $('#image').addClass('loading');
    } else {
        $('#image').removeClass('loading')
    }
}

var progressiveUnblur_finish = function() {
    //$('#image').remove();
    //$('#imgwrapper').append(image_orig);
    //$('#image').css({'visibility': 'visible'});
    //imgBlur.setup('image', 'imgcanvas', 'innerImgWrapper');
    //imgBlur.setBlur('image', 'imgcanvas', 'innerImgWrapper', 0);
    //$('#image').css({'display': 'inline'});
    //$('#imgcanvas').css({'display': 'none'});
}

var timer;

var progressiveUnblur = {
	start: function(amt) {
		timer = setTimeout(function() {
			if(amt <= 0) {
				progressiveUnblur_finish();
				resize();
				imgBlur.setBlur('image', 'imgcanvas', 'innerImgWrapper', 0);
				$('#imgcanvas').css({'display': 'inline'});
				$('#image').css({'display': 'none'});
				resize();
				return;
			}
			
			resize();
			imgBlur.setBlur('image', 'imgcanvas', 'innerImgWrapper', amt);
			$('#imgcanvas').css({'display': 'inline'});
			$('#image').css({'display': 'none'});
			resize();
            if(amt > 6) {
                progressiveUnblur.start(amt - 6 + Math.ceil((1 / amt) * 10));
            } else {
                progressiveUnblur.start(0);
            }

		}, 1000);
	},
	abort: function() {
		if(timer !== undefined) {
			clearTimeout(timer);
		}
	}
}

// `ids` is set by the callback of a pair request (see requestPair function).
// Nothing should use `ids` before a pair has successfully been established.
var ids;

var sendMessage = function(message) {
    $.ajax({
        url: baseUrl + "/s",
        type: "POST",
        success: function(json_data) {
            //alert(json_data);
        },
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({uid: ids.uid, cid: ids.cid, msg: message})
    });
}

var msgReq;

var requestMessage = function() {
    if(connected && (msgReq === undefined || msgReq === null)) {
        msgReq = $.ajax({
            url: baseUrl + "/m",
            type: "POST",
            mimeType: "text/plain",
            success: function (response) {
                var robj = response; // robj is an array of messages.

                for(var i=0; i < robj.length; i++) {
                    //robj = JSON.parse(robj);
                    if(robj[i].alive === "0") {
                        // Connection with client has been lost.
                        // This occurs on a dropped connection or a disconnect.
                        // Clear the chat and start over.


                        // If this condition isn't met then the previous
                        // connection is already terminated on this client.
                        
                        if(msgReq !== undefined && msgReq !== null) {
                            //msgReq.abort();
                            msgReq = null;
                            delete msgReq;
                        }
                        reconnectCooldownInProgress = false;
                        disconnect();
                    }

                    if(robj[i].msg !== undefined && robj[i].msg !== null) { // Message sent in data.
                        receiveChat(robj[i].msg);
                        robj[i].msg = null;
                        delete robj[i].msg;
                        //msgReq.abort();
                        msgReq = null;
                        delete msgReq;
                        requestMessage();
                    }

                    if(robj[i].img !== undefined && robj[i].img !== null) { // Image URL sent in data.
						$('#image').css({'display': 'none'});
                        $('#connectingNotification').css({'display': 'none'});
                        $('#connectedNotification').css({'display': 'inline'});
                        $('#input_text').removeAttr('disabled');

                        setTimeout(function(){$('#connectingNotification').css({'display': 'none'});
                            $('#connectedNotification').css({'display': 'inline'});$('#input_text').removeAttr('disabled');}, 500);

                        $("#image").load( function () {
			    loadingAnimation(false);
                            $("#image").unbind();
			    progressiveUnblur.start(140);
                            resize();
                            setTimeout(resize, 2000)
                        }).error( function (){
                                $("#image").unbind();
                                disconnect();
                            });
                        $('#image').attr('src', robj[i].img);
                        //msgReq.abort();
                        msgReq = null;
                        delete msgReq;
                        requestMessage();
                    } else if(robj[i].inUse === "1") {
                        // Message request already in use. If this block executes
                        // then there's probably a client-side bug.
                    } else if(robj[i].alive === "1") {
                        // Message timeout has occured. This is normal behavior.
                        // Client needs to reconnect before the chat session times out.
                        //msgReq.abort();
                        msgReq = null;
                        delete msgReq;
                        requestMessage();
                    }
                }
            },
            error: function (response) {
                //msgReq = null;
                //delete msgReq;
                disconnect();
                //alert("error");
                //alert('error');
                //setTimeout(requestMessage, 1000); // Try again.
            },
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({uid: ids.uid, cid: ids.cid})
        });
    }
}

var pairReq;

var requestPair = function() {
    if(!reconnectCooldownInProgress && (pairReq === undefined || pairReq === null)) {
	        //alert($('#chatOutput').html().length);
	        if($('#chatOutput').html().length > 0) {
		    chatHistory.push({"dctime": Date.now(), "body": $('#chatOutput').html()});

/*			  for(var i = 0; i < chatHistory.length; i++) {
			      alert("chat: <p>d/c time: " + chatHistory[i].dctime + "</p>" +
				  "<p>body: " + chatHistory[i].body + "</p>");
			  }
*/
		}
	        $('#chatOutput').html('');
		$('#imgcanvas').css({'display': 'none'});
		$('#image').css({'display': 'inline'});
		imgBlur.setup('image', 'imgcanvas', 'innerImgWrapper');
		imgBlur.setBlur('image', 'imgcanvas', 'innerImgWrapper', 0);
		loadingAnimation(true);
		progressiveUnblur.abort();
        pairReq = $.ajax({
            url: baseUrl + "/p",
            type: "POST",
            success: function(json_data) {
                ids = json_data;
                connected = true;
                pairReq = null;
                delete pairReq;
                requestMessage();
            },
            error: function() {
		pairReq = null;
                setTimeout(requestPair, 5000);
            },
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({key: 'reqPair'})
        });

        // Set the cooldown so multiple pairs can't be opened too rapidly.
        reconnectCooldownInProgress = true;
        setTimeout(function() {
            reconnectCooldownInProgress = false;
        }, reconnectCooldownTime)
    }
}

var disconnect = function() {
    if(!reconnectCooldownInProgress) {
        loadingAnimation(true);
        connected = false;
        
        if(msgReq !== undefined && msgReq !== null) {
            msgReq.abort();
            msgReq = null;
            delete msgReq;
            $('#connectingNotification').css({'display': 'inline'});
            $('#connectedNotification').css({'display': 'none'});
            $('#input_text').attr('disabled', 'disabled');
            requestPair();
        } else {
            $.ajax({
                url: baseUrl + "/x",
                type: "POST",
                complete: function() {
                    if(pairReq !== undefined && pairReq !== null) {
                        pairReq.abort();
                        pairReq = null;
                        delete pairReq;
                    }

                    $('#connectingNotification').css({'display': 'inline'});
                    $('#connectedNotification').css({'display': 'none'});
                    requestPair();
                },
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({uid: ids.uid, cid: ids.cid})
            });
        }
    }
}

$(function() {
    resize();
    //image_orig = $("#image").clone();
    $('#image').css({'visibility': 'visible'});


    // Press enter to submit a chat message.
    $('#input_text').keypress(function(e){
        if(e.keyCode == 13) {
            submitChat();
        }
    });

    requestPair();
});
