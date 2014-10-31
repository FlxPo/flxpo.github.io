var app = app || {};

app.FlowTipView = Backbone.View.extend({

	className: "flowtip",

	template: _.template( $('#flowtip-template').html() ),

	events: {
		"mouseover": "over",
		"mouseout": "out",
		"click": "clickDot",
		"click #group": "group",
		"click #ungroup": "ungroup"
	},

	initialize: function(options) {
		this.parent = options.parent;
		this.content = _.pick( this.parent.model.attributes, "name", "volume", "unit", "children", "parent" );
		this.focus_color = darkenColor(this.parent.model.get("a_color"), 0.55);
		this.rendered = false;

		this.pos = {"is_zero":this.parent.model.get("is_zero")};
	},

	close:function() {
		// Close buttons
		this.group_b && this.group_b.remove();
		this.ungroup_b && this.ungroup_b.remove();
		this.$trend && this.$trend.velocity("stop")
		this.stopListening();
	},

	cacheComponents:function() {
		this.$tip = this.$el.find(".tip");
		this.$dot = this.$el.find(".dot");
		this.$group = this.$el.find("#group");
		this.$ungroup = this.$el.find("#ungroup");
		this.$labels = this.$el.find("span");
		this.$volume = this.$el.find(".volume");
		this.$unit = this.$el.find(".unit");
		this.$label = this.$el.find(".label");
		return this;
	},

	// Render functions
	render: function(args) {

		this.renderContent()
			.cacheComponents()
			.renderVolume(args.year)
			.renderUnit()
			.styleComponents()
			.renderPosition()
			.renderBase()
			.renderTrend(args.mt)

		this.rendered = true;

		return this;
	},

	updateRender:function(args) {

		this.renderContent()
			.renderVolume(args.year)
			.renderBase()
			.correctPosition()
			.renderTrend(args.mt);

		return this;

	},

	renderPosition: function() {

		var mid = this.parent.mid;
		var noise_intensity = (this.parent.model.get("type") === "extraction" || this.parent.model.get("type") === "waste") ? 15 : 5;
		var noise = Math.floor(noise_intensity*(Math.random()-0.5))

		// noise = constrainNumber(noise-mid, Math.floor(this.parent.pulsePath.length)*0.25, Math.floor(this.parent.pulsePath.length)*0.75);

		var path = this.parent.pulsePath;
			len = path.length,
			mid = mid+noise,
			x = path[mid + noise].x,
			y = path[mid + noise].y;
		
		var vol = this.parent.model.get("volume");
		var vol_c = constrainNumber(vol, 20, 60)*0.6;
		this.vol_c = vol_c;

		// Store parms for auto layout		
		this.pos["anchor"] = mid;
		this.pos["x"] = x;
		this.pos["y"] = y;
		this.pos["hc"] = vol_c/2;

		this.$el.css({ top: y-vol_c/2, left: x-vol_c/2 });
		return this;
	},


	renderContent: function() {

		// Check if first render or update render
		if (!this.rendered) {

			this.$el.html( this.template( this.content ) );

			// Append the trends icons if needed
			if (this.parent.model.get("nature") === "matter") {
				var trend = parseInt(this.parent.model.get("trend"));
				var html = ""
				if (trend === 0) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend flat\"></div></div>"
				} else if (trend === 1) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend plus\"></div></div>"
				} else if (trend === 2) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend plus\"></div>" + "<div id = \"tr2\" class = \"trend plus\"></div></div>"
				} else if (trend === - 1) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend minus\"></div></div>"
				} else {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend minus\"></div>" + "<div id = \"tr2\" class = \"trend minus\"></div></div>"
				}
				this.$trend = $(html).appendTo(this.$el);
      		}

		}
		return this;
	},

	renderVolume:function(year) {
		var y = String(year) === "1" ? "volume_o4" : "volume_o9";
		if (!this.parent.model.get("virtual") && this.parent.model.get(y) !== -1) {
			var vol = formatVolume(this.parent.model.get(y), " ");
			this.$volume.html(vol);
		} else {
			this.$volume.addClass("hidden")
		}
		return this;
	},

	renderUnit:function() {
		if (this.parent.model.get("virtual") && this.parent.model.get("volume") !== -1) {
			this.$label.addClass("hidden");
		}
		return this;
	},

	attachButtons:function() {

		if (this.content.parent) {
			this.group_b = new app.ButtonView( {model:app.instance.ui.b_collection.get("group"), el:this.$group} );
		}

		if (this.content.children) {
			this.ungroup_b = new app.ButtonView( {model:app.instance.ui.b_collection.get("ungroup"), el:this.$ungroup} );
		}

		!this.content.parent && this.$group.css( {display:"none"} );
		!this.content.children && this.$ungroup.css( {display:"none"} );
	},

	renderBase: function() {
		var vol_c = this.vol_c;
		
		// Adapt the size of the button to the flow
		if (!this.rendered) {this.$el.css( {width:vol_c, height:vol_c} );}
		else {this.$el.velocity( {width:vol_c, height:vol_c}, {duration:200} )}

		// Hide button if the flow is zero
		if (this.parent.model.get("is_zero")) {
			this.$el.css( {display:"none"} )
		} else {
			this.$el.css( {display:"inline-block"} )
		}
		
		return this;
	},

	correctPosition: function() {
		var w = this.$tip.width(), h = this.$tip.height();
		var vol = this.vol_c;
		this.$tip.css({ top: -h  + vol*0.25 - 25, left: -w*0.5 + vol/2 -10 });
		this.$dot.css({ top: vol/2-4, left: vol/2-4 });
		this.$labels.css({"margin-top":-h-5});

		this.$trend && this.$trend.css({ top: vol/2-10, left: vol/2-4 + 10 })

		this.pos["w"] = w;
		this.pos["h"] = h;

		return this;
	},

	styleComponents:function() {
		this.$el.css( {"background-color":this.parent.model.get("a_color")} );
		!this.parent.model.get("children") && this.$dot.css( {"background-color":this.parent.model.get("n_color")} );
		return this;
	},

	renderTrend:function(mt) {
		if (this.$trend) {

			var self = this;
			var trend = this.$trend;
			var label = this.$label;
			var seq = [];

			if (mt) {

				// Show the trend icons and animate them
				seq.push({ elements: this.$el, properties: { opacity: 0 }, options: { duration: 100, complete:function() {label.addClass("hidden"); self.correctPosition();} } });
				seq.push({ elements: this.$el, properties: { opacity: 1 }, options: { duration: 100, complete:function() {trend.addClass("show_v")} } });
				seq.push({ elements: this.$trend, properties: { "top":"+=10" }, options: { loop:true} });

			} else {

				// Hide the trend icons and stop the animation
				seq.push({ elements: this.$el, properties: { opacity: 0 }, options: { duration: 100, complete:function() {trend.velocity("stop").velocity("reverse"); trend.removeClass("show_v"); label.removeClass("hidden"); self.correctPosition();} } });
				seq.push({ elements: this.$el, properties: { opacity: 1 }, options: { duration: 100 } });

			}

			$.Velocity.RunSequence(seq);
		}
	},

	zOrder:function(z) {
		this.$el.css({"z-index":z});
	},

	// Mouse events
	over:function() {
		this.$el.css( {"background-color":this.focus_color} );
		this.$tip.addClass("tip-displayed");
		this.parent.over();
	},
	
	out:function() {
		this.$el.css( {"background-color":this.parent.model.get("a_color")} );
		this.$tip.removeClass("tip-displayed");
		this.parent.out();
	},

	clickDot: function() {
		if (!this.clicked) {
			this.$el.off("mouseover mouseout");
			this.clicked = true;
		} else {
			this.delegateEvents();
			this.clicked = false;
		}
	},

	group:function() {
		Backbone.trigger("flows:parent", {parentid:this.parent.model.get("parent")})
	},

	ungroup:function() {
		Backbone.trigger("flows:children", {ids:this.parent.model.get("children"), parentid:this.parent.model.get("id")})
	}


});