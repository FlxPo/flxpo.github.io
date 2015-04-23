var app = app || {};

app.ItemView = Backbone.View.extend({

	className:"item",
	template: _.template( $('#item-template').html() ),

	initialize:function(options) {

		this.parent = options.parent;

		var flow_collection = Backbone.Collection.extend( {model:app.Flow} );
		this.input = new flow_collection();
		this.output = new flow_collection();
		this.recyclage = new flow_collection();
		this.extraction = new flow_collection();
		this.waste = new flow_collection();

		var self = this;
		var geom_url = this.model.get("geom");
		if (geom_url) {

			$.ajax({

				url:geom_url,
      			data: { get_param: 'value' },
      			dataType: 'json',

				success:function(data) {
					self.model.set(data);
					_.bind(self.createCanvas, self)(data);
					self.parent.parent.$itemcontainer.prepend( self.render().el );
				},

				complete:function() {
					options.complete();
				}

			});

		} else {

			self.parent.parent.$itemcontainer.prepend( self.render().el );
			options.complete();

		}
	},

	createCanvas:function(data) {

		//Create the raphael canvas to draw on according to current window size
		var ws = utils.getWindowSize();
		var w = ws.w, h = ws.h;

		//Compute necessary transformations to reach target size and location
		var scw = Math.sqrt(w/data.width*this.model.get("scale"));
		var sch = Math.sqrt(h/data.height*this.model.get("scale"));

		var scaling = this.model.get("force_w_scale") ? scw : Math.min(scw, sch);

		var w_mod = data.width*scaling*scaling ;
		var h_mod = data.height*scaling*scaling ;

		// Create the canvas
		this.r = Raphael(this.$el[0], w_mod+5, h_mod+5);
		$("svg", this.$el).css({position:"absolute"});

		this.scaling = scaling;
		this.w = w_mod * parseFloat(this.model.get("iw"));
		this.h = h_mod * parseFloat(this.model.get("ih"));

		this.model.set("w_mod", w_mod);
		this.model.set("h_mod", h_mod);

	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			.renderGeometry()
			.renderSolution()
			.renderTip();
		return this;
	},

	renderContent:function() {
		this.$el.css("z-index", this.model.get("z"));
		this.$el.append( this.template() );
		return this;
	},

	cacheComponents:function() {
		this.$label = this.$el.find(".label");
		return this;
	},

	renderGeometry:function() {

		var r = this.r;
		var m = this.model;
		var scaling = this.scaling;

		if (m.get("geometry")) {

			// Load the geometry in a set
			r.setStart();
			r.add(m.get("geometry"));
			var polys = r.setFinish();

			// Scale
			var sgn = this.model.get("label") === "Plateforme Web" ? -1 : 1
			polys.transform(["t", - sgn*this.model.get("dx"), -sgn*this.model.get("dy")]);
			polys.transform(["...S", scaling, scaling, 0, 0]);
			this.polys = polys;

		}

		// Translate
		var ws = utils.getWindowSize();
		var w = ws.w, h = ws.h;
		var xw = eval(m.get("x")) - (m.get("width")/2 * scaling * scaling || 0);
		var yh = eval(m.get("y")) - (m.get("height")/2 * scaling * scaling || 0);

		this.$el.css({left:xw, top:yh});

		this.X = eval(m.get("x"));
		this.Y = eval(m.get("y"));

		this.fax = this.X+ (m.get("fax")*m.get("w_mod") || 0);
		this.fay = this.Y+ (m.get("fay")*m.get("h_mod") || 0);

		return this;

	},

	renderSolution:function() {
	// Create the solution effect
	if (this.model.get("solution")) {
		var s = Raphael(this.el, this.w*1.3, this.h*1.5);
		$("svg", this.$el).css({position:"absolute"})
		this.$el.children().first().css({top: -this.h*0.25, left:-this.w*0.15, opacity:0})

		var a = this.w*1/2, b = this.h*1/2, dx = this.w*1.3/2, dy = this.h*1.5/2;

		function drawStick(t) {
			t = t*3.14/180;
			var dl = a*0.2;
			var X = dx + a*1.1 * Math.cos(t), Y = dy - b*1.1 * Math.sin(t);
			var XX = dx + (a+dl)* Math.cos(t), YY = dy - (b+dl) * Math.sin(t);
			s.path(["M",X,Y, "L",XX, YY]).attr({"stroke-width":3, stroke:"#FFC633"})
		}

		drawStick(30);
		drawStick(60);
		drawStick(90);
		drawStick(120);
		drawStick(150);

		this.$solution = this.$el.children().first();
		this.$solution.velocity({opacity:1}, {loop:true})

	}

	return this;
	},

	renderTip:function() {

		if (this.model.get("label")) {

			this.$label.addClass("show_v");

			var r = Raphael(this.el, 40, 30);
			$("svg", this.$el).css({position:"absolute"})
			this.$el.children().first().css({top:0.95*this.model.get("h_mod"),left:this.w/2 - 40, "z-index":1})

			var e = 15;
			var xoff = 40;

			var pp = r.path(["M", 40 - xoff, 0 + e,
				"L", 40, 0,
				"L", 40 - xoff/2, 0 + e,
				"Z"]);
			pp.attr({"stroke-width":0, fill:"#D8D8D9"})

			// var container = $(target_slide + " #middle #"+ this.id);
			this.$label.html(this.model.get("label"));
			this.$label.css({top:0.95*this.model.get("h_mod")+15,left:this.w/2 - 40})
		}

		return this;
	},

	close:function() {
		this.$solution && this.$solution.velocity("stop");
		this.stopListening();
	},

	appear:function(args, delay) {
		if (!this.onScreen) {
			this.$el.velocity("fadeIn", {duration:parseInt(args.time), delay:delay, queue:false, display:"block"});
			this.onScreen = true;
		}
	},

	disappear:function(args, delay) {
		this.$el.velocity("fadeOut", {duration:parseInt(args.time), delay:delay, queue:false})
		this.onScreen = false;
	},

	translate:function(args, delay) {
		var ws = utils.getWindowSize();
		var w = ws.w, h = ws.h;

		var m = this.model;
		var scaling = this.scaling;

		var xw = eval(args.x) - (m.get("width")/2 * scaling * scaling || 0);
		var yh = eval(args.y) - (m.get("height")/2 * scaling * scaling || 0);

		this.X = eval(args.x);
		this.Y = eval(args.y);

		this.fax = this.X + (m.get("fax")*m.get("w_mod") || 0);
		this.fay = this.Y + (m.get("fay")*m.get("h_mod") || 0);

		this.$el.velocity({left:xw, top:yh}, {duration:parseInt(args.time), delay:delay, queue:false});
	},

	hideGround:function() {
		for (var i = 0; i < this.polys.length; i++) {
			if (this.polys[i].attr('fill') === "#89807D") {
				this.polys[i].hide();
			}
		}
	},

	showGround:function() {
		for (var i = 0; i < this.polys.length; i++) {
			if (this.polys[i].attr('fill') === "#89807D") {
				this.polys[i].show();
			}
		}
	}

});
