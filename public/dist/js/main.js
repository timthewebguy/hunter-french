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

	this.enabled = options.enabled || true;

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
	if (!this.enabled) {
		return;
	}
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

DataScroll.prototype.enable = function() {
	this.enabled = true;
	this.animations.forEach(function(a) {
		a.render(0, 'init');
		a.render(this.currentY, 'update');
	});
	requestAnimationFrame(this.update.bind(this));
};

DataScroll.prototype.disable = function() {
	this.enabled = false;

	this.animations.forEach(function(a) {
		a.target.style[a.animationAttribute] = '';
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


//Application Master Functions
;(function() {
	var ds;

	// Page Load Function
	function load() {

		var index = 999;
		ds = new DataScroll(document.body);

		var lastAngle = 0;

		$('.tile').loop(function(tile) {

			//Adjust the zindex property of the tiles
			tile.style.zIndex = index;
			index--;

			//Calculate the random x and y coordinates of the tile along the circle
			var radius = 25, angle = lastAngle;
			while(Math.abs(lastAngle - angle) <= 1) {
				angle = Math.random()*Math.PI*2;
			}
			var x = Math.cos(angle) * radius + (Math.random() * 10 - 5) - radius * 0.5;
			var y = Math.sin(angle) * radius + (Math.random() * 10 - 5) - radius * 0.5;
			$('.tile__inner', tile).style.transform = 'translate(' + x + 'vmin, ' + y + 'vmin)';

			//Create a new trigger
			var trigger = document.createElement('div'),
					trigger__inner = document.createElement('div');
			trigger.className = 'tile__trigger';
			trigger__inner.className = 'tile__trigger-inner';
			trigger.appendChild(trigger__inner);
			$('.tiles__triggers').appendChild(trigger);

			//Create the animation
			ds.addAnimation(trigger, trigger__inner, tile, 
				['{transform=0:translateZ(-100px),1:translateZ(200px)}',
				'{opacity=0:0,0.2:1,0.8:1,1:0}'].join(','), 
				{
					ease:'linear'
				}, 
				{
					onBefore: function(t) {
						t.target.style.pointerEvents = 'none';
					},
					onDuring: function(t) {
						t.target.style.pointerEvents = 'all';
					},
					onAfter: function(t) {
						t.target.style.pointerEvents = 'none';
					}
				}
			);
		});

		$('.tile__img').addEventListener('mousemove', function(e) {
			var r = this.getBoundingClientRect();
			//console.log((r.top + r.height * 0.5) + e.clientX, (r.left + r.width * 0.5) + e.clientY);
		});

		ds.resize();

	}
	window.addEventListener('load', load, false);

function resize() {
		if(window.innerWidth <= 768 && ds.enabled == true) {
			ds.disable();
		}
		if(window.innerWidth > 768 && ds.enabled == false) {
			ds.enable();
		}
	}

	window.addEventListener('resize', resize, false);


})();

/*! modernizr 3.3.1 (Custom Build) | MIT *
 * https://modernizr.com/download/?-csstransforms-csstransforms3d-cssvhunit-preserve3d-setclasses !*/
!function(e,t,n){function r(e,t){return typeof e===t}function s(){var e,t,n,s,i,o,a;for(var l in C)if(C.hasOwnProperty(l)){if(e=[],t=C[l],t.name&&(e.push(t.name.toLowerCase()),t.options&&t.options.aliases&&t.options.aliases.length))for(n=0;n<t.options.aliases.length;n++)e.push(t.options.aliases[n].toLowerCase());for(s=r(t.fn,"function")?t.fn():t.fn,i=0;i<e.length;i++)o=e[i],a=o.split("."),1===a.length?Modernizr[a[0]]=s:(!Modernizr[a[0]]||Modernizr[a[0]]instanceof Boolean||(Modernizr[a[0]]=new Boolean(Modernizr[a[0]])),Modernizr[a[0]][a[1]]=s),y.push((s?"":"no-")+a.join("-"))}}function i(e){var t=S.className,n=Modernizr._config.classPrefix||"";if(x&&(t=t.baseVal),Modernizr._config.enableJSClass){var r=new RegExp("(^|\\s)"+n+"no-js(\\s|$)");t=t.replace(r,"$1"+n+"js$2")}Modernizr._config.enableClasses&&(t+=" "+n+e.join(" "+n),x?S.className.baseVal=t:S.className=t)}function o(){return"function"!=typeof t.createElement?t.createElement(arguments[0]):x?t.createElementNS.call(t,"http://www.w3.org/2000/svg",arguments[0]):t.createElement.apply(t,arguments)}function a(){var e=t.body;return e||(e=o(x?"svg":"body"),e.fake=!0),e}function l(e,n,r,s){var i,l,f,d,u="modernizr",p=o("div"),c=a();if(parseInt(r,10))for(;r--;)f=o("div"),f.id=s?s[r]:u+(r+1),p.appendChild(f);return i=o("style"),i.type="text/css",i.id="s"+u,(c.fake?c:p).appendChild(i),c.appendChild(p),i.styleSheet?i.styleSheet.cssText=e:i.appendChild(t.createTextNode(e)),p.id=u,c.fake&&(c.style.background="",c.style.overflow="hidden",d=S.style.overflow,S.style.overflow="hidden",S.appendChild(c)),l=n(p,e),c.fake?(c.parentNode.removeChild(c),S.style.overflow=d,S.offsetHeight):p.parentNode.removeChild(p),!!l}function f(e,t){return!!~(""+e).indexOf(t)}function d(e){return e.replace(/([a-z])-([a-z])/g,function(e,t,n){return t+n.toUpperCase()}).replace(/^-/,"")}function u(e,t){return function(){return e.apply(t,arguments)}}function p(e,t,n){var s;for(var i in e)if(e[i]in t)return n===!1?e[i]:(s=t[e[i]],r(s,"function")?u(s,n||t):s);return!1}function c(e){return e.replace(/([A-Z])/g,function(e,t){return"-"+t.toLowerCase()}).replace(/^ms-/,"-ms-")}function m(t,r){var s=t.length;if("CSS"in e&&"supports"in e.CSS){for(;s--;)if(e.CSS.supports(c(t[s]),r))return!0;return!1}if("CSSSupportsRule"in e){for(var i=[];s--;)i.push("("+c(t[s])+":"+r+")");return i=i.join(" or "),l("@supports ("+i+") { #modernizr { position: absolute; } }",function(e){return"absolute"==getComputedStyle(e,null).position})}return n}function h(e,t,s,i){function a(){u&&(delete N.style,delete N.modElem)}if(i=r(i,"undefined")?!1:i,!r(s,"undefined")){var l=m(e,s);if(!r(l,"undefined"))return l}for(var u,p,c,h,g,v=["modernizr","tspan","samp"];!N.style&&v.length;)u=!0,N.modElem=o(v.shift()),N.style=N.modElem.style;for(c=e.length,p=0;c>p;p++)if(h=e[p],g=N.style[h],f(h,"-")&&(h=d(h)),N.style[h]!==n){if(i||r(s,"undefined"))return a(),"pfx"==t?h:!0;try{N.style[h]=s}catch(y){}if(N.style[h]!=g)return a(),"pfx"==t?h:!0}return a(),!1}function g(e,t,n,s,i){var o=e.charAt(0).toUpperCase()+e.slice(1),a=(e+" "+P.join(o+" ")+o).split(" ");return r(t,"string")||r(t,"undefined")?h(a,t,s,i):(a=(e+" "+k.join(o+" ")+o).split(" "),p(a,t,n))}function v(e,t,r){return g(e,n,n,t,r)}var y=[],C=[],w={_version:"3.3.1",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,t){var n=this;setTimeout(function(){t(n[e])},0)},addTest:function(e,t,n){C.push({name:e,fn:t,options:n})},addAsyncTest:function(e){C.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=w,Modernizr=new Modernizr;var S=t.documentElement,x="svg"===S.nodeName.toLowerCase(),_="CSS"in e&&"supports"in e.CSS,b="supportsCSS"in e;Modernizr.addTest("supports",_||b),Modernizr.addTest("preserve3d",function(){var e=o("a"),t=o("a");e.style.cssText="display: block; transform-style: preserve-3d; transform-origin: right; transform: rotateY(40deg);",t.style.cssText="display: block; width: 9px; height: 1px; background: #000; transform-origin: right; transform: rotateY(40deg);",e.appendChild(t),S.appendChild(e);var n=t.getBoundingClientRect();return S.removeChild(e),n.width&&n.width<4});var T=w.testStyles=l;T("#modernizr { height: 50vh; }",function(t){var n=parseInt(e.innerHeight/2,10),r=parseInt((e.getComputedStyle?getComputedStyle(t,null):t.currentStyle).height,10);Modernizr.addTest("cssvhunit",r==n)});var z="Moz O ms Webkit",P=w._config.usePrefixes?z.split(" "):[];w._cssomPrefixes=P;var k=w._config.usePrefixes?z.toLowerCase().split(" "):[];w._domPrefixes=k;var E={elem:o("modernizr")};Modernizr._q.push(function(){delete E.elem});var N={style:E.elem.style};Modernizr._q.unshift(function(){delete N.style}),w.testAllProps=g,w.testAllProps=v,Modernizr.addTest("csstransforms",function(){return-1===navigator.userAgent.indexOf("Android 2.")&&v("transform","scale(1)",!0)}),Modernizr.addTest("csstransforms3d",function(){var e=!!v("perspective","1px",!0),t=Modernizr._config.usePrefixes;if(e&&(!t||"webkitPerspective"in S.style)){var n,r="#modernizr{width:0;height:0}";Modernizr.supports?n="@supports (perspective: 1px)":(n="@media (transform-3d)",t&&(n+=",(-webkit-transform-3d)")),n+="{#modernizr{width:7px;height:18px;margin:0;padding:0;border:0}}",T(r+n,function(t){e=7===t.offsetWidth&&18===t.offsetHeight})}return e}),s(),i(y),delete w.addTest,delete w.addAsyncTest;for(var A=0;A<Modernizr._q.length;A++)Modernizr._q[A]();e.Modernizr=Modernizr}(window,document);

/*
	SYNTAX:		
		<div class="snap-point" data-snap-target="top" data-snap-margin="30">
			CONTENT
		</div>
*/

var snapPoints = new Array();
var target = null;
var targetDist;
var animationProgress = 0;
var animationState = 1; //1 = idle, 2 = pending, 3 = animating, 4 = done

var disableWidth = 400;
var disabled = false;

var snapDelay = 500;

var lDate;
var deltaTime;

var scrolling = false;
var scrollTimer;


var SnapPoint = function(el) {

	//The element
	this.el = el;

	//margin for snapping
	this.snapMargin = parseFloat(this.el.getAttribute('data-snap-margin'));

	//Point on the screen to track
	var rect = this.el.getBoundingClientRect();
	switch(this.el.getAttribute('data-snap-target')) {
		case 'top':
			this.snapTarget = window.pageYOffset + rect.top;
			break;
		case 'middle': 
			this.snapTarget = window.pageYOffset + rect.top + window.innerHeight * 0.5;
			break;
		case 'bottom':
			this.snapTarget = window.pageYOffset + rect.top + window.innerHeight;
			break;
	}
	
}


function initScrollSnap() {

	//Grab the height
	resizeScrollSnap();

	//setup for deltatime
	lDate = Date.now();

	//create the snapPoint objects
	$('.snap-point').forEach(function(s) {
		snapPoints.push(new SnapPoint(s));
	});
}

function updateScrollSnap() {

	//calculate deltaTime
	deltaTime = (Date.now() - lDate) / 1000;

	if(target == null) {
		if(!scrolling) {
			//find a new target in the array
			for(var i = 0; i < snapPoints.length; i++) {
				var p = snapPoints[i];
				if(Math.abs(p.snapTarget - window.pageYOffset) < p.snapMargin) {
					target = p;
				}
			}
		}
	} else {
		//target acquired!
		if(animationState == 1) {
			if(!scrolling) {
				//set state to 2 (pending)
				setTimeout(function() {
					if(!scrolling) {

						//set state to 3 (ready!)
						animationState = 3;

						//set the inital target distance
						targetDist = target.snapTarget - window.pageYOffset;
					} else {
						//abort, go back to searching
						animationState = 1;
						target = null;
					}
				}, snapDelay);
				//pending
				animationState = 2;
			} else {
				target = null;
			}
		}

		//ready to animate
		if(animationState == 3) {

			//increase animation progress
			animationProgress += deltaTime * 3;

			//apply easing
			var ap = animationProgress;
			ap = (Math.pow((ap-1), 3) +1);

			//scroll
			window.scrollTo(0, target.snapTarget - targetDist * (1 - ap));

			if(animationProgress >= 1) {//animation finished

				//lock to the endpoint just in case the math was a bit off
				window.scrollTo(0, target.snapTarget);

				//finished
				animationState = 4;

				onSnap();
			}
		}
	}

	//for deltatime
	lDate = Date.now();

}

//event to fire when snap finishes
function onSnap() {
	//history.pushState(null, null, '/' + target.el.getAttribute('id'));
}


function resizeScrollSnap() {

	//update the target points of all of the snap points
	snapPoints.forEach(function(p) {
		
		//client rect of the element
		var rect = p.el.getBoundingClientRect();		

		//Point on the screen to track
		switch(p.el.getAttribute('data-snap-target')) {
			case 'top':
				p.snapTarget = window.pageYOffset + rect.top;
				break;
			case 'middle': 
				p.snapTarget = window.pageYOffset + rect.top + window.innerHeight * 0.5;
				break;
			case 'bottom':
				p.snapTarget = window.pageYOffset + rect.top + window.innerHeight;
				break;
		}
	});


}

function scrollScrollSnap() {

	if(animationState == 4) {//the animation is finished

		//set back to idle
		animationState = 1;

		//reset other parameters
		animationProgress = 0;
		target = null;
	}

	//we are indeed scrolling
	scrolling = true;

	//reset timer to check when we're not scrolling
	clearTimeout(scrollTimer);
	scrollTimer = setTimeout(function() { scrolling = false }, 100);
}


function $(sel, ctx) {
	var context = ctx || document;
	var query = context.querySelectorAll(sel);
	if(query.length == 1) {
		return query.item(0);
	} else {
		return query;
	}
}

Element.prototype.nodeNumber = function() {
	var el = this, node=0;
	while( (el = el.previousElementSibling) != null) {
		node++;
	}
	return node;
};

Element.prototype.isBefore = function(el) {
	if(this.parentNode != el.parentNode) {
		console.log('not the same parent');
		return false;
	}
	if(this.nodeNumber() > el.nodeNumber()) {
		return false;
	}
	return true;
};

Element.prototype.addClass = function(_class) {
	if(this.classList) {
		this.classList.add(_class);
		return this;
	} else {
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

Element.prototype.hasClass = function(_class) {
	if(this.classList) {
		return this.classList.contains(_class);
	} else {
		return this.className.split(' ').indexOf(_class) != -1;
	}
};

Element.prototype.loop = function(func) {
	func(this);
};

NodeList.prototype.addEventListener = function(event, callback, capture) {
	this.loop(function (n) {
		n.addEventListener(event, callback, capture || false);
	});
};
NodeList.prototype.removeEventListener = function(event, callback, capture) {
	this.loop(function (n) {
		n.removeEventListener(event, callback, capture || false);
	});
};
NodeList.prototype.loop = function(func) {
	for(var i = 0; i < this.length; i++) {
		func(this.item(i));
	}
};

