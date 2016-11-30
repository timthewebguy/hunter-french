
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
