
//requestAnimationFrame shim/polyfill
window.requestAnimationFrame = ( function() {
 return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function( callback ) {
     window.setTimeout( callback, 1000 / 60 );
    };
})();

//Selector Functions
function $$(selector, context) {
	context = context || document;
	var elements = context.querySelectorAll(selector);
	return Array.prototype.slice.call(elements);
}

function $(selector, context) {
	context = context || document;
	return context.querySelector(selector);
}

//Element Prototypes
Element.prototype.hasClass = function(c) {
	return this.className.indexOf(c) !== -1;
}
Element.prototype.addClass = function(_class) {
	if(this.classList) {//ClassList Support
		this.classList.add(_class);
		return this;
	} else {//Fallback to regex
		var classes = this.className.split(' ');
		if(classes.indexOf(classToAdd) === -1) {
			this.className = this.className + (classes.length > 0 ? ' ' : '') + classToAdd;
		}
		return this;
	}
};
Element.prototype.removeClass = function(_class) {
	if(this.classList) {
		this.classList.remove(_class);
		return this;
	} else {
		var finalClassName = '';
		this.className.split(' ').forEach(function(cl) {
			if(cl != _class) { finalClassName += cl + ' ' }
		});
		this.className = finalClassName.replace(/[ /t]+$/, '');
		return this;	
	}
};

//Application Master Functions
;(function() {

	var vh, ct,
			vh_height = [['.titleTrigger', 100], ['.descriptionTrigger', 100], ['.taglineTrigger', 100]];

	// Page Load Function
	function load() {

		vh = Modernizr.cssvhunit;
		if(!vh) {
			for(var i = 0; i < vh_height.length; i++) {
				var h = window.innerHeight * (vh_height[i][1] * 0.01);
				$(vh_height[i][0]).style.height = h + 'px';
			}
		}

		ct = Modernizr.csstransforms;

		if(ct) {
			initAnimations();
			initScrollSnap();

			requestAnimationFrame(update);
		}


		document.getElementById('navigation__menuToggle').addEventListener('click', function() {
			var body = document.body;
			if(body.className == 'js-show-nav') {
				body.className ='js-hide-nav';
			} else {
				body.className = 'js-show-nav';
			}
		});
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
		if(ct) {
			resizeAnimations();
			resizeScrollSnap();
		}

		if(!vh) {
			for(var i = 0; i < vh_height.length; i++) {
				var h = window.innerHeight * (vh_height[i][1] * 0.01);
				$(vh_height[i][0]).style.height = h + 'px';
			}
		}
	}
	window.addEventListener('resize', resize, false);

	//Page Scroll Function
	function scroll() {
		if(ct) {
			scrollAnimations();
			scrollScrollSnap();
		}
	}
	window.addEventListener('scroll', scroll, false);


})();
