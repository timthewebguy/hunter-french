
//requestAnimationFrame shim/polyfill
window.requestAnimationFrame = ( function() {
 return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function( callback ) {
     window.setTimeout( callback, 1000 / 60 );
    };
})();

//Application Master Functions
;(function() {

	// Page Load Function
	function load() {
		initAnimations();
		initScrollSnap();

		requestAnimationFrame(update);
	}
	window.addEventListener('load', load, false);


	// Page Update Function 
	function update() {
		updateAnimations();
		updateScrollSnap();

		requestAnimationFrame(update);
	}

	// Page Resize Function 
	function resize() {
		resizeAnimations();
		resizeScrollSnap();
	}
	window.addEventListener('resize', resize, false);

	//Page Scroll Function
	function scroll() {
		scrollAnimations();
		scrollScrollSnap();
	}
	window.addEventListener('scroll', scroll, false);


})();
