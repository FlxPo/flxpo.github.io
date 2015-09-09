var app = app || {};

app.CircleView = Backbone.View.extend({

	template: _.template( '<div class = "pulse"></div></div>' ),

	initialize:function(options) {
		this.paper = options.paper;
	},

	cacheComponents:function() {
		this.$pulse = this.$el.find(".pulse");
		return this;
	},

	// Render functions
	render: function(options) {

		// this.$el.html( this.template() );
		// this.cacheComponents();

		// Load the attributes of the circle and append the circle to the canvas
		var m = this.model.toJSON();
		var path = this.paper.path();
		path.attr({path:["M", m.x, m.y-m.rad, "A", m.rad, m.rad, 0,1,1,m.x-0.1, m.y-m.rad, "Z"], stroke:m.col, 'stroke-width':m.sw, opacity:m.op});
		path.toBack();
		this.path = path;
		this.transitionIn();

		// var pupath = this.paper.path();
		// pupath.attr({path:["M", m.x, m.y-4*m.rad, "A", 4*m.rad, 4*m.rad, 0,1,1,m.x-0.1, m.y-4*m.rad, "Z"]}).hide();
		// this.pupath = pupath;

		// this.renderPulse();

	},

	transitionIn:function() {
		var m = this.model.toJSON();
		this.path.animate({transform:["s",4,4, m.x, m.y], 'stroke-width': m.sw}, 400 + Math.round(Math.random()*400), "elastic");
	},

	transitionOut:function() {

	},

	close:function() {

		var closeOnComplete = function() {
			this.path.remove();
			this.stopListening();
		}

		var m = this.model.toJSON();
		var t = 500 + Math.floor(Math.random()*500);
		this.path.animate( {transform:["s",0.5,0.5, m.x, m.y]}, t, "ease-in", _.bind(closeOnComplete, this));
	
		return this;


	},

	renderPulse: function() {

		// TO DO : path to points function
		var path = this.pupath,
			pupath = [],
			step = 10,
			len = path.getTotalLength(),
			l = 0;

		while(l < path.getTotalLength()) {
			var pos = path.getPointAtLength(l);
			pupath.push( {x:pos.x, y:pos.y} );
			l += step;
		}

		this.pulsePath = pupath;
		this.pupath.remove();
		//////

		var d = this.model.get("sw");
		offset = -Math.round(d/2);
		this.$pulse.css( {width:d,
							height:d,
							"margin-top":offset,
							"margin-left":offset,
							"background-color":"#fff",
							opacity:0.2
						} );

		function restart() {
			$.Velocity.RunSequence(seq);
		}

		function sequenceGenerator(args) {

			var el = args.element
			var path = args.path;
			var seq = [];
			var incr = args.increment;
			var n = path.length;
			var dt = args.duration/n*incr;

			for (var i = 0; i < n; i+=incr) {

				var t = Math.round(path[i].y*10)/10;
				var l = Math.round(path[i].x*10)/10;
				var o = { duration:dt, easing:"linear" };

				if (i === 0) {
					o = { duration:0, easing:"linear" };
				} else if (i > n - incr - 1) {
					o = { duration:dt, easing:"linear", complete:args.complete };
				}

				var step = {elements:el, properties:{ top:t,left:l }, options:o };
				seq.push(step);
			}

			return seq;
		}

		if (this.pulsing) {
			this.$pulse.velocity( "stop", true )
		}

		var seq = sequenceGenerator( {element:this.$pulse, path:pupath, duration:pupath.length*40, increment:5, complete:restart} );
		$.Velocity.RunSequence(seq);

		this.pulsing = true;

		return this;
	}

});
