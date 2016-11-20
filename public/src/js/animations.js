//Datascroll v 1.1.0 Author: Timothy Morris
/*

SYNTAX:

<div class="panel" data-panel-twin=".panelTwin">
<div class="animated" data-animation="{property = time:value, time:value, time:value}, {property = time:value, time:value}"  data-animation-easing="ease" data-animation-round="false" data-animation-target="#target">
	CONTENT
</div>
</div>

*/

//TODO
// - panel defaults to self unless specified

//Array extension to remove blank values
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};


var Animation = function(panel, el, target, start, end, duration, animationString, easing, round, callbacks) {

	//The panel of the element
	this.panel = panel;

	//The element with the animation
	this.el = el;

	//The element to animate
	this.target = target;

	//The start of the animation (based on Y)
	this.start = start;

	//The end of the animation
	this.end = end;

	//The duration of the animation 
	this.duration = duration;

	if(animationString != '') {

		//Clean up the animation string
		var cleanAnimation = animationString.replace(/ /g,'').replace(/\)/g,') ').replace(/ \//g, '/').replace(/\s+$/, '');

		//The style attribute to animate
		this.animationAttribute = cleanAnimation.split('=').shift();

		//if(this.animationAttribute == 'transform') {
		//	this.target.style.willChange = 'transform';
		//}

		//Define the value type
		if(cleanAnimation.indexOf('(') !== -1) {
			this.animationValueType = 'function';
		} else {
			this.animationValueType = 'value';
		}

		//The JSON animation itself
		var keyframeArray = cleanAnimation.split('=').pop().split(/,+(?![^\(]*\))/g);
		var output = '';
		for(var i = 0; i < keyframeArray.length; i++) {
			var data = keyframeArray[i].split(':');

			if(this.animationValueType == 'value') {
				output += '{"time":"' + data[0] + '","value":"' + data[1] + '"}';
			} else {
				var values = '[';
				var functions = data[1].split(/ /g).clean('');
				for(var f = 0; f < functions.length; f++) {

					//function name
					values += '{"functionName":"';
					values += functions[f].match(/([a-zA-Z0-9])+/g)[0];

					//function values
					values += '","values":[';

					//make array of values
					var funcVals = functions[f].match(/\((.*?)\)/g)[0].replace(/[\(\)]/g, '').split(/,/g).clean('');
					for(var v = 0; v < funcVals.length; v++) {
						values += '"' + funcVals[v] + '"';
						if(v < funcVals.length - 1) {
							values += ',';
						}
					}
					values += ']}';
					if(f < functions.length - 1) {
						values += ',';
					}
				}
				values += ']';
				output += '{"time":"' + data[0] + '","values":' + values + ',"staticValue":"' + data[1] + '"}';
			}

			if(i < keyframeArray.length-1) {
				output += ',';
			}
		}
		this.animation = JSON.parse('{"keyframes":[' + output + ']}');

		//The animation easing function
		this.easing = easing;

		//Whether or not to round the values
		this.round = round;

		//Callbacks
		if(callbacks) {
			this.onBefore = callbacks.onBefore || null;
			this.onDuring = callbacks.onDuring || null;
			this.onAfter = callbacks.onAfter || null;
		}
	}

	//Whether we are before, during, or after the animation
	this.animationStatus = 'during';
	

	if(this.debug) {
		console.log(this);
	}
};




Animation.prototype.getUnits = function(searchString) {
	//cycle through all units possible
	var units = ['px', 'em', '%', 'deg', 'turn', 'vw', 'vh', 'vmin', 'vmax'];
	for(var u = 0; u < units.length; u++) {
		if(searchString.indexOf(units[u]) !== -1) {
			return units[u];
		}
	}
	
	//Apparently, there are no units
	return '';
};




Animation.prototype.render = function(y, src) {

	//Temporary State variable
	var s = 'during';
	if(y >= this.start + this.animation.keyframes[this.animation.keyframes.length - 1].time * this.duration) {
		s = 'after';
	} else if(y <= this.start + this.animation.keyframes[0].time * this.duration) {
		s = 'before';
	}

	//Either this is the first animation to render from init(), 
	//or we are rendering from update().
	if((src == 'init' && this.target.style[this.animationAttribute] == '') || src == 'update') {
		//If we've changed to before or after
		if(this.animationStatus != s && (s == 'before' || s == 'after')) {

				if(s == 'after') {

					//OnAfter
					if(this.animationValueType == 'value') {
						this.target.style[this.animationAttribute] = this.animation.keyframes[this.animation.keyframes.length - 1].value;
					} else {
						this.target.style[this.animationAttribute] = this.animation.keyframes[this.animation.keyframes.length - 1].staticValue;
					}

					if(this.onAfter) {
						this.onAfter(this);
					}

				} else {

					//OnBefore
					if(this.animationValueType == 'value') {
						this.target.style[this.animationAttribute] = this.animation.keyframes[0].value;
					} else {
						this.target.style[this.animationAttribute] = this.animation.keyframes[0].staticValue;
					}

					if(this.onBefore) {
						this.onBefore(this);
					}

				}

		} else {

			if(s != this.animationStatus) {
				if(this.onDuring) {
					this.onDuring(this);
				}
				
			}


			//Relative progress of the animation
			var progress = (y - this.start) / this.duration,
					before = this.animation.keyframes[0],
					after = this.animation.keyframes[this.animation.keyframes.length - 1];


			for(var i = 0; i < this.animation.keyframes.length; i++) {
				var keyframe = this.animation.keyframes[i];

				if(keyframe.time == progress) {		//We're at the exact time of the keyframe

					//Set the value to the keyframes value, end the function.
					if(this.animationValueType == 'value') {
						this.el.style[this.animationAttribute] = keyframe.value;
					} else {
						this.el.style[this.animationAttribute] = keyframe.staticValue;
					}
					return;

				} else { //We're not at the exact time of the keyframe
					if(keyframe.time < progress) {//We're before the keyframe
						if(parseFloat(keyframe.time) > parseFloat(before.time)) {
								before = keyframe;
							}
					} else {//We're after the keyframe
						if(parseFloat(keyframe.time) < parseFloat(after.time)) {
							after = keyframe;
						}
					}
				}
			}

			//There was no exact match, interpolate
			var keyframeProgress = (progress - before.time) / (after.time - before.time), val;
			//Adjust kp based on easing
			switch (this.easing) {
				case 'easeIn':
					keyframeProgress = Math.pow(keyframeProgress, 2);
					break;
				case 'easeOut':
					keyframeProgress = -(Math.pow((keyframeProgress-1), 2) -1);
					break;
				case 'ease':
					if ((keyframeProgress /= 0.5) < 1) { 
						keyframeProgress = 0.5*Math.pow(keyframeProgress,2); 
					} else {
						keyframeProgress = -0.5 * ((keyframeProgress-=2)*keyframeProgress - 2);
					}	
					break;
			}

			var val = '';

			if(this.animationValueType == 'function') {

				//Loop through functions
				for(var v = 0; v < before.values.length; v++) {

					var bValue = before.values[v],
							aValue = after.values[v];

					//Add function name
					val += bValue.functionName + '(';

					

					//interpolate all values
					for(var w = 0; w < bValue.values.length; w++) {
						//calculate lerp value
						var tval = (parseFloat(bValue.values[w]) * (1 - keyframeProgress) + parseFloat(aValue.values[w]) * keyframeProgress);

						//round
						if(this.round) {
							tval = Math.round(tval);
						}

						//append to output with units
						val += tval + this.getUnits(bValue.values[w]);

						//if there are more values, add a comma
						if(w < bValue.values.length - 1) {
							val += ',';
						}
					}

					//close function
					val += ')';

					//if there are more functions, add a space
					if(v < before.values.length - 1) {
						val += ' ';
					}
				}
			} else {
				//Set the value to the interpolation between before and after
				val = (parseFloat(before.value) * (1 - keyframeProgress) + parseFloat(after.value) * keyframeProgress) + this.getUnits(before.value);
			}

			//Finally, set the value
			this.target.style[this.animationAttribute] = val;
		}
	}


	this.animationStatus = s;
};







var DataScroll = function(root, options) {

	//Make it so we can be lazy :-)
	this.root = root || document.body;
	options = options || {};

	//Initial Setup
	this.debug = options.debug || false;
	this.ease = options.ease || 'ease';
	this.round = options.round || false;

	this.height = this.calcHeight();
	if(this.debug) {
		console.log('Page Height:', this.height);
	}
	//Set the scroll ratio to ensure top of page is 0% and bottom is 100%
	this.scrollRatio = this.height / ( this.height - this.calcContainerHeight());
	if(this.debug) {
		console.log('Scroll Ratio:', this.scrollRatio);
	}



	//Store the current y for the page in %
	this.currentY = this.scrollY() / this.height * this.scrollRatio;

	this.animations = new Array();

	//Generate the animation objects that have panels
	var ds = this;
	$('.panel').loop(function(p) {
		$('.animated', p).loop(function(a) { 
			ds.addDataAnimation(p,a);
		});
	});

	//Render the animations from the correct pageY value
	//inside init() to avoid FOUC
	this.animations.forEach(function(a) {
		a.render(this.currentY, 'update');
	});


	//Attach the resize event listener
	window.addEventListener('resize', this.resize.bind(this), false);

	//And away we go...
	requestAnimationFrame(this.update.bind(this));
};




DataScroll.prototype.calcHeight = function() {
	//Returns the height of the container (window.innerHeight or the client height of the root)
	return this.root == document.body ? Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight ) : this.root.scrollHeight;
};




DataScroll.prototype.calcContainerHeight = function() {
	//Returns the height of the content within the container (document values or the scrollheight of the root)
	return this.root == document.body ? window.innerHeight : this.root.getBoundingClientRect().height;
};




DataScroll.prototype.scrollY = function() {
	//Returns the Scroll Y of the container (pageYOffset or scrollTop of the root)
	return this.root == document.body ? window.pageYOffset : this.root.scrollTop;
};




DataScroll.prototype.transformAnimation = function(p,a) {

	//Rect of the panel in question
	var r = p.getBoundingClientRect();

	//Start of the panel (when the top border comes in to the bottom of the screen)
	var t = ((r.top + window.pageYOffset) - window.innerHeight) / this.height * this.scrollRatio;

	//End of the panel (when the bottom border leaves the top of the screen)
	var b = (r.bottom + window.pageYOffset) / this.height * this.scrollRatio;

	//How tall the panel is in % of page height
	var h = b - t;

	//Set the start and duration of the animation object
	a.start = t;
	a.end = b;
	a.duration = h;
};




DataScroll.prototype.addDataAnimation = function(panel, el) {

	//If there is a twin specified, switch to that panel
	var t = panel.getAttribute('data-panel-twin');
	if(t) {
		panel = $(t);
	}

	//If there is a animation target specified, set it. Otherwise, default to the element.
	var target = el;
	if(el.getAttribute('data-animation-target')) {
		switch(el.getAttribute('data-animation-target')) {
			case 'next':
				target = el.nextElementSibling;
				break;
			case 'prev':
				target = el.previousElementSibling;
				break;
			case 'parent':
				target = el.parentElement;
				break;
			default: 
				target = $(el.getAttribute('data-animation-target'));
				break;
		}
	}

	//Split the animations into an array
	var elAnimations = el.getAttribute('data-animation') ? el.getAttribute('data-animation').split(/,+(?![^\{]*\})/g) : '';

	//Create a unique animation object for each property to be animated, and add it to the array
	for(var i = 0; i < elAnimations.length; i++) {
		var animStr = elAnimations[i].replace('{','').replace('}','');
		var anim = new Animation(
			panel, //panel
			el, //element
			target, //target
			0, //start
			1, //end
			1, //duration
			animStr, //string of the animation 
			el.getAttribute('data-animation-easing') || 'ease', //easing
			el.getAttribute('data-animation-round') || false	//round
		);

		//Transform the animation into global page space
		this.transformAnimation(panel, anim);

		//Render the animation from the top of the page 
		//to ensure correct initialization
		anim.render(0, 'init');

		//Add animation to the array
		this.animations.push(anim);
	}

	//If not in debug mode, remove all of the animation attributes/class
	if(!this.debug) {
		el.removeAttribute('data-animation');
		el.removeAttribute('data-animation-easing');
		el.removeAttribute('data-animation-round');
		el.removeAttribute('data-animation-target');
		el.className = el.className.replace('animated', '');
	}
};




DataScroll.prototype.addAnimation = function(panel, el, target, animationString, args, callbacks) {

	//make args optional
	args = args || {};

	//Split the animations into an array
	var elAnimations = animationString.split(/,+(?![^\{]*\})/g);

	//Create a unique animation object for each property to be animated, and add it to the array
	for(var i = 0; i < elAnimations.length; i++) {

		//Sanitize the animation string
		var animStr = elAnimations[i].replace('{','').replace('}','');

		//Create the animation object
		var anim = new Animation(
			panel,
			el,
			target,
			args.start || 0,
			args.end || 1,
			args.duration || 1,
			animStr,
			args.ease || this.ease,
			args.round || this.round,
			callbacks || {}
		);
		//Transform the animation into global page space
		this.transformAnimation(panel, anim);

		//Render the animation from the top of the page 
		//to ensure correct initialization
		anim.render(0, 'init');

		//Add animation to the array
		this.animations.push(anim);

		//Avoid FOUC
		anim.render(this.currentY, 'update');
	}
};




DataScroll.prototype.update = function() {

	//Store the current y for the page in %
	this.currentY = this.scrollY() / this.height * this.scrollRatio;

	//Execute all animations
	for(var i = 0; i < this.animations.length; i++) {
		this.animations[i].render(this.currentY, 'update');
	}

	requestAnimationFrame(this.update.bind(this));
};




DataScroll.prototype.resize = function() {

	//Store the height of the page based on the new height
	this.height = this.calcHeight();

	//recalculate the scroll ratio
	this.scrollRatio = this.height / ( this.height - this.calcContainerHeight());

	var reference = this;

	//recalculate animation start and duration values
	this.animations.forEach(function(a) {
		reference.transformAnimation(a.panel, a);
	});
};

//requestAnimationFrame shim/polyfill
window.requestAnimationFrame = ( function() {
return window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function( callback ) {
   window.setTimeout( callback, 1000 / 60 );
  };
})();
