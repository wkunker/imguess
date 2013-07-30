var imgBlur = {
	setup: function(imgId, canvasId, imgWrapperId) {
		canvas = document.getElementById(canvasId);
		var img = $('#' + imgId);
		var innerImgWrapper = $('#' + imgWrapperId);
		canvas.className		= 'bx-canvas';
		canvas.width 			= img.width();
		canvas.height 			= img.height();
		canvas.style.width  	= img.width() + 'px';
		canvas.style.height 	= img.height() + 'px';
		canvas.style.left		= img.position().left + 'px';
		canvas.style.top		= img.position().top + 'px';
		//canvas.style.visibility = 'hidden';
		canvas.setAttribute('data-pos', img.data('pos'));
	},
	setBlur: function(imgId, canvasId, imgWrapperId, blurRadius) {
		canvas = document.getElementById(canvasId);
		var img = $('#' + imgId);
		var innerImgWrapper = $('#' + imgWrapperId);
		canvas.className		= 'bx-canvas';
		canvas.width 			= img.width();
		canvas.height 			= img.height();
		canvas.style.width  	= img.width() + 'px';
		canvas.style.height 	= img.height() + 'px';
		canvas.style.left		= img.position().left + 'px';
		canvas.style.top		= img.position().top + 'px';
		//canvas.style.visibility = 'hidden';
		canvas.setAttribute('data-pos', img.data('pos'))
		try {
			stackBlurImage(imgId, canvasId, blurRadius, false);
		} catch(e) {
			setTimeout(function() {stackBlurImage(imgId, canvasId, blurRadius, false);}, 100);
		}
	}
}
