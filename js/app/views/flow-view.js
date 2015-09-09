var app = app || {};

app.FlowView = Backbone.View.extend({

	className:"flow",

	template: _.template( '<div class = "pulse"></div></div>' ),

	initialize: function(options) {

		_.bindAll(this, "close");

		// Storing the origin and destination items
		this.ito = options.ito;
		this.ifrom = options.ifrom;
		this.parent = options.parent;

		this.$popcontainer = this.parent.$popcontainer;
		this.$flowcontainer = this.parent.$flowcontainer;

		// Create the tip
		this.flowtip = new app.FlowTip();
	    this.flowtipview = new app.FlowTipView( {model:this.flowtip, parent:this} );

	    this.rendered = false;
  	},

	cacheComponents:function() {
		this.$pulse = this.$el.find(".pulse");
		return this;
	},

	close:function() {
		this.$pulse.velocity("stop", true);
		this.flowtipview.close();
		this.flowtipview.remove();

		// Stack removal
		this.stack.flows = _.filter(this.stack.flows, function(flow) {
			return (flow.id !== this.id)
		}, this);

		var self = this;
		this.path.animate( {"stroke-width":0}, 200, self.path.remove )

		this.stopListening();
	},

	render:function(args) {

	    this.renderContent()
	    	.cacheComponents()
	    	.renderPath()
	    	.animatePath(args.animate)
	    	.renderPulse()
	    	.findRealMid()
	    	.renderFlowTip(args.year, args.mt)

	    return this;
	},

	updateRender:function(args) {

		this.renderPath()
			.animatePath(args.animate)
			.renderPulse()
			.findRealMid()
			.renderFlowTip(args.year, args.mt);

		return this;
	},

	renderContent:function() {
  		this.$el.html( this.template() );
  		var w = $(window).width(), h = $(window).height()
	    this.paper = Raphael(this.$el[0], w, h);
  		return this;
  	},

	renderPath: function() {

		var type = this.model.get("type");

		// Store items
		var ifrom = this.ifrom,
			ito = this.ito;

		// Get items positions
		var xf = ifrom.fax,
			yf = ifrom.fay,
			xt = ito.fax,
			yt = ito.fay;

		// Get items dimensions
		var wf = ifrom.w || 0,
			hf = ifrom.h || 0,
			wt = ito.w || 0,
			ht = ito.h || 0;

		// Get offset
		var offsetto = this.model.get("offsetto") || 0;
		var offsetfrom = this.model.get("offsetfrom") || 0;
		var offsetextr = this.model.get("offsetextr") || 0;
		var offsetwast = this.model.get("offsetwast") || 0;

		// Get origin and destination coordinates
		var xfrom = xf + wf/2;
			yfrom = yf + offsetfrom,
			xto = xt - wt/2,
			yto = yt + offsetto;

		this.xfrom = xfrom;
		this.xto = xto;
		this.yfrom = yfrom;
		this.yto = yto;

		// Get necessary bending of the bezier curves to keep them from overlapping
		var dxfrom = Math.abs(xto - xfrom)/2 + Math.sign(yf - yt)*offsetfrom;	// Origin bezier x offset (to approximate parallel paths when origin = destination)
		var dxto = Math.abs(xto - xfrom)/2 - Math.sign(yf - yt)*offsetto;		// Destination bezier x offset

		// Get distance metrics between the origin and destination
		var deltaX = Math.abs(xto - xfrom);
		var deltaY = Math.abs(yto - yfrom);
		var midX = (xfrom + xto)/2;
		var midY = (yfrom + yto)/2;

		this.midX = midX;
		this.midY = midY;

		// Build the path
		var flowpath = [];

		// Exit origin
		if (type === "extraction") {
			flowpath.push(['M', xf - ifrom.w*0.15 + offsetextr, yf]);
		} else {
			flowpath.push(['M', xf, yfrom]);
			flowpath.push(['L', xfrom, yfrom]);
		}

		// Bend the curve
		if (type === "input" || type === "output") {

			// If the origin is on the left of the destination
			if (xfrom < xto*0.9) {

				var cp1 = { x:xfrom + dxfrom, y:yfrom },
				cp2 = { x:xto - dxto, y:yto };

				var p = ["C", cp1.x, cp1.y,
				cp2.x, cp2.y,
				xto, yto];

				flowpath.push(p);

			} else {

				var corry = 0 
				var flat_mid = 0
				if (xto < xfrom) {
					corry = (deltaX + deltaY)/6;
					flat_mid = 1;
				}

				var cp1 = { x:xfrom + (deltaX + deltaY)/wf*30, y:yfrom };
				var cp2 = { x:midX + deltaX/2, y:midY + deltaY/2 + corry };
				var mp = { x:midX, y:midY + flat_mid*deltaY/2 + corry};
				var cp3 = { x:midX - deltaX/2, y:midY + deltaY/2 + corry};
				var cp4 = { x:xto - (deltaX + deltaY)/wf*30, y:yto };

				var pA = ["C", cp1.x, cp1.y,
					cp2.x, cp2.y,
					mp.x, mp.y];

				var pB = ["C", cp3.x, cp3.y,
					cp4.x, cp4.y,
					xto, yto];

				flowpath.push(pA, pB);

			}

		} else if (type === "recyclage") {

			this.offsetrecy = -this.model.get("offsetrecy");

			var cpd1 = wf/4 + this.offsetrecy * 2 + 100;
			cpd1 = cpd1 > 100 ? 100 + 3*this.offsetrecy : cpd1 - this.offsetrecy;
			var cpd2 = + wf/2 + this.offsetrecy * 5 +100;
			cpd2 = cpd2 > 300 ? 300 + 3*this.offsetrecy : cpd2 - this.offsetrecy;

			flowpath.push(['C', xfrom + cpd1, yfrom,
				xf + cpd2, yf + hf/1 + this.offsetrecy * 1.25,
				xf, yf + hf/1 + this.offsetrecy * 1.25]);

			flowpath.push(['C', xf - cpd2, yf + hf/1 + this.offsetrecy * 1.25,
				xto - cpd1, yto,
				xto, yto]);

		} else if (type === "extraction") {

			var off = this.model.get("offsetextr");

			flowpath.push(['C', xf + off, yf - hf*1.5 - off*4,
								xto - wf/4 - off *4, yto,
								xto, yto]);

		} else {

			var off = this.model.get("offsetwast");

			flowpath.push(['C', xfrom + (hf+wf)/4 + off *4, yfrom,
								xf + ifrom.w*0.15, yto - (hf+wf)/2 - off*5,
								xf + ifrom.w*0.15 - off, yto]);


		}

		// Enter destination
		flowpath.push(['L', xt, yto]);

		var geometry = _.extend( this.model.attributes.geometry, {"path":flowpath, "stroke":this.model.get("n_color")} );
		var g = [];
		g.push(geometry);

		this.flowpath = this.paper.path(flowpath).hide();
		if (!this.path) { this.path = this.paper.add(g).items[0]; }

		return this;
	},


	findRealMid:function() {

	// Find the real midpoint for inputs and outputs
	if (this.model.get("type") === "input" || this.model.get("type") === "output") {
		var target_x = (this.xfrom + this.xto)/2;
		var target_y = this.midY;

		var k = Math.floor(this.pulsePath.length/3);
		var d1 = 2000;
		var d2 = 1000;
		
		while (d2 < d1) {
			k++;
			d1 = d2;
			var dpx = target_x - this.pulsePath[k].x;
			var dpy = target_y - this.pulsePath[k].y;
			d2 = Math.sqrt(dpx*dpx + dpy*dpy);
		}

		this.mid = k;
		this.midX = this.pulsePath[k].x;
		this.midY = this.pulsePath[k].y;

	} else {

		this.mid = Math.floor(this.pulsePath.length/2);
		this.midX = this.pulsePath[this.mid].x;
		this.midY = this.pulsePath[this.mid].y;

	}

	return this;

	},

	animatePath:function(animate, callback) {
		var sw = this.model.get("volume");
		if (animate === "appear") {
			this.path.attr({'stroke-width':0});
			this.path.animate({'stroke-width':sw}, 500, "backOut");
		} else {
			this.path.animate( {path:this.flowpath.attr("path")}, 200 );
			this.path.animate({'stroke-width':sw}, 200, "linear", callback);
		}
		return this;
	},

	renderPulse: function() {

		// TO DO : path to points function
		var path = this.flowpath,
			pupath = [],
			step = 5,
			len = path.getTotalLength(),
			l = 0;

		while(l < path.getTotalLength()) {
			var pos = path.getPointAtLength(l);
			pupath.push( {x:pos.x, y:pos.y} );
			l += step;
		}

		this.pulsePath = pupath;
		this.flowpath.remove();
		//////

		var d = this.model.get("volume");
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

		var seq = sequenceGenerator( {element:this.$pulse, path:pupath, duration:pupath.length*20, increment:5, complete:restart} );
		$.Velocity.RunSequence(seq);

		this.pulsing = true;

		return this;
	},

	renderFlowTip: function(y, mt) {
		
		if (!this.flowtipview.rendered) {this.$popcontainer.append( this.flowtipview.render( {year:y, mt:mt} ).el ); }
		else { this.flowtipview.updateRender( {year:y, mt:mt} ) }

		return this;
	},

	renderClean: function() {
		this.flowtipview.attachButtons();
		this.flowtipview.correctPosition();
		return this;
	},

	over:function() {
		this.path.attr( {stroke:this.model.get("a_color")} );
	},

	out:function() {
		this.path.attr( {stroke:this.model.get("n_color")} );
	},

	changeYear:function(args) {
		// this.year = this.year === "o4" ? "o9" : "o4";
		// this.path.animate( {"stroke-width":this.model.get("flowVolume")[this.year]}, 200, "easeOut" )
	}

});