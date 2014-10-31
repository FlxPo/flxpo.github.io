var app = app || {};

app.PulseView = Backbone.View.extend({

	className: "pulse",

	initialize: function(options) {
		this.parent = options.parent;
		this.parms = _.pick(this.parent.model.attributes, "col", "sw");
	},

	// Render functions
	render: function() {
		this.renderPulse();
		return this;
	},

	renderPulse: function() {

		// TO DO : path to points function
		var path = this.parent.path,
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
		//////

		// var d = this.content.flowVolume.o4;
		var d = this.parms.sw;
		var offset = -Math.round(d/2);
		this.$el.css( {width:d,
							height:d,
							"margin-top":offset,
							"margin-left":offset,
							"background-color":this.parms.col
						} );

		// TO DO : animation function of the pulse

		function restart() {
			$.Velocity.RunSequence(seq);
		}

		var seq = [
			{ elements:this.$el, properties:{ top:pupath[0].y, left:pupath[0].x }, options:{ duration:0 } },
			{ elements:this.$el, properties:{ top:pupath[Math.floor((pupath.length-1)/4)].y, left:pupath[Math.floor((pupath.length-1)/4)].x }, options:{ duration:1000, easing:"linear" } },
			{ elements:this.$el, properties:{ top:pupath[Math.floor((pupath.length-1)/2)].y, left:pupath[Math.floor((pupath.length-1)/2)].x }, options:{ duration:1000, easing:"linear" } },
			{ elements:this.$el, properties:{ top:pupath[Math.floor(3*(pupath.length-1)/4)].y, left:pupath[Math.floor(3*(pupath.length-1)/4)].x }, options:{ duration:1000, easing:"linear" } },
			{ elements:this.$el, properties:{ top:pupath[pupath.length-1].y, left:pupath[pupath.length-1].x }, options:{ duration:1000, easing:"linear", complete:restart } },
		];

		$.Velocity.RunSequence(seq);

		return this;
	}

});