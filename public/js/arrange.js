var resize = function () {
    // Force the chat log to scroll to the bottom.
    var chatlog = $('#chatLog');
    chatlog.css({'position': 'relative'});
    chatlog.scrollTop(chatlog[0].scrollHeight);

    // Border offsets in pixels (integer)
    var imageVerticalOffset = 20;
    var inputTopGap = 0;
    var centerSpacing = 10;

    var chatLog = $('#chatLog');
    var imgwrapper = $('#imgwrapper');
    var input_text = $('#input_text');
    var input_submit = $('#input_submit');
    var inputSection = $('#inputSection');
    var title = $('#title');
    var innerImgWrapper = $('#innerImgWrapper');
    var image = $('#image');
    var imagecanvas = $('#imgcanvas');
    var chatLog_inner = $('#chatLog_inner');
    var aspectRatio = imgwrapper.width() / imgwrapper.height();

    //
    // Define the chat log dimensions
    //
    // This happens after all operations have been performed
    // on elements related to inputSection / chatLog
    if($(window).width() > $(window).height()) {
		chatLog.css({'max-height': (inputSection.position().top - title.height() - inputTopGap) + 'px'});
		chatLog.css({'min-height': (inputSection.position().top - title.height() - inputTopGap) + 'px'});
		chatLog.css({'height': (inputSection.position().top - title.height() - inputTopGap) + 'px'});
		imgwrapper.css({'max-height': (inputSection.position().top - title.height() - inputTopGap) + 'px'});
		imgwrapper.css({'min-height': (inputSection.position().top - title.height() - inputTopGap) + 'px'});
		imgwrapper.css({'height': (inputSection.position().top - title.height() - inputTopGap) + 'px'});
		input_text.css({'width': (input_submit.position().left - input_submit.css('margin-right').split('px')[0] - input_text.css('margin-left').split('px')[0]) + 'px'});

		var imgHeight = $(window).height() - (inputSection.height() + imageVerticalOffset + title.height());

		innerImgWrapper.css({'width': '99%'});
		innerImgWrapper.css({'height': 'auto'});

		image.css({'width': '99%'});
		image.css({'height': 'auto'});
		
		if(image.height() > imgHeight || imagecanvas.height() > imgHeight) { // Image height is being cut off by the window.
			innerImgWrapper.css({'height': imgHeight + 'px'});
			image.css({'height': imgHeight + 'px', 'width': 'auto'});
			imagecanvas.css({'height': imgHeight + 'px', 'width': 'auto'});
		}
		
		// If the image width has exceeded the half the screen width minus the three vertical column widths...
	        if(imagecanvas.width() > $(window).width() / 2 - centerSpacing * 3) {
		    imagecanvas.css({"width": ($(window).width() / 2 - centerSpacing * 3) + "px", "height": "auto"});
		    imgwrapper.css({"width": imagecanvas.css("width") + "px", "height": "auto"});
		}

	        chatLog.css({'position': 'static'});
		chatLog.css({'width': (imgwrapper.position().left - centerSpacing) + 'px'});
    } else {


		input_text.css({'width': (input_submit.position().left - input_submit.css('margin-right').split('px')[0] - input_text.css('margin-left').split('px')[0]) + 'px'});

		var imgHeight = $(window).height() - (inputSection.height() + 5 + title.height());

		chatLog.css({'width': '100%'});

		innerImgWrapper.css({'width': 'auto'});
		innerImgWrapper.css({'height': (imgHeight / 2) + 'px'});

		image.css({'width': 'auto'});
		image.css({'height': (imgHeight / 2) + 'px'});
		imagecanvas.css({'width': 'auto'});
		imagecanvas.css({'height': (imgHeight / 2) + 'px'});
		imgwrapper.css({'height': (imgHeight / 2) + 'px'});
		imgwrapper.css({'min-height': (imgHeight / 2) + 'px'});
		imgwrapper.css({'max-height': (imgHeight / 2) + 'px'});

		if(image.width() > $(window).width()) { // Image is being cut off by the window.
			innerImgWrapper.css({'width': $(window).width() + 'px'});
			innerImgWrapper.css({'height': 'auto'});
			image.css({'width': $(window).width() + 'px'});
			image.css({'height': 'auto'});
			imagecanvas.css({'width': $(window).width() + 'px'});
			imagecanvas.css({'height': 'auto'});
		}

		chatLog.css({'position': 'absolute'});
		chatLog.css({'top': innerImgWrapper.height() + title.height()});

        chatLog.css({'max-height': (inputSection.position().top - imgwrapper.height() - title.height()) + 'px'});
        chatLog.css({'min-height': (inputSection.position().top - imgwrapper.height() - title.height()) + 'px'});
        chatLog.css({'height': (inputSection.position().top - imgwrapper.height() - title.height()) + 'px'});
        chatLog_inner.css({'max-height': (inputSection.position().top - imgwrapper.height() - title.height()) + 'px'});
        chatLog_inner.css({'min-height': (inputSection.position().top - imgwrapper.height() - title.height()) + 'px'});
        chatLog_inner.css({'height': (inputSection.position().top - imgwrapper.height() - title.height()) + 'px'});
	}
	//imagecanvas.width(innerImgWrapper.width());
	//imagecanvas.height(innerImgWrapper.height());
        input_text.focus();
};

$(window).resize(resize);

$(function() {resize()});
