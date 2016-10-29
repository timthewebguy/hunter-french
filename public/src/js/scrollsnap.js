
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
	$$('.snap-point').forEach(function(s) {
		snapPoints.push(new SnapPoint(s));
	});

	console.log(snapPoints);

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
