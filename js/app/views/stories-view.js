var app = app || {};

app.StoriesView = Backbone.View.extend({

	id:"footer",

	template: _.template('\
		<div id = "nav"><ul></ul></div>\
    	<div id = "title"><h2></h2><p></p></div>\
    	<div id = "story">\
      		<ul>\
        		<li id = "previous" class = "s_button"><span>Info précédente</span></li>\
        		<li id = "next" class = "s_button"><span>Plus d‘infos</span></li>\
        		<li id = "tcontainer"><p id = "s_text"></p></li>\
      		</ul>\
    	</div>\
	'),

	events: {
		"click #previous":"previous",
		"click #next":"next"
	},

	initialize: function(options) {

		this.listenTo(Backbone, "stories:go", this.go);

		var NavsViewsCollection = Backbone.Collection.extend( {model:app.NavView} );
		this.nv_collection = new NavsViewsCollection();

		this.i = -1;
		this.s = 0;

		//$('body').keyup(_.bind(utils.debounce(this.arrowKeyPressed, 150), this));

	},

	cacheComponents:function() {
		this.$title = this.$el.find("#title h2");
		this.$subtitle = this.$el.find("#title p");
		this.$text = this.$el.find("#s_text");
		this.$previous = this.$el.find("#previous");
		this.$next = this.$el.find("#next");
		this.$nav = this.$el.find("#nav ul");
		return this;
	},

	render:function() {

		this.renderContent()
		.cacheComponents()
		.renderNav()

		var self = this;
		_.defer(function() {self.attachButtons();});
		
		return this;
	},

	renderContent:function() {
		this.$el.html( this.template() );
		return this;
	},

	renderNav:function() {

		this.collection.each(function(story, index) {

			var nm = new Backbone.Model({id:index, title:story.get("title"), display_dot:story.get("display_dot")});
			var nv = this.nv_collection.add( {id:index, model:nm} );
			this.$nav.append( nv.render().el );
			_.defer(nv.renderClean)

		}, this);

		return this;
	},

	close:function() {
		_.each(this.nv_collection.models, function(nav) {nav.stopListening();nav.remove();})
		this.previous_b.remove();
		this.next_b.remove();
	},

	go:function(args) {
		var id = args.id === "last" ?  this.collection.models.length-1 : args.id;
		// Get the view list of the first story
		if (this.collection.models[id]) {
			var steps = this.collection.models[id].get("steps");
			steps.length > 1 && this.showNext();
			// Load the story
			this.injectContent(id, 0, 1);
			// Change the style of the nav button
			this.nv_collection.get(id).clk( {silent:true} );
		}
	},

nextStep:function(args) {

	var dir = args.dir;
	var steps = this.collection.models[this.i].get("steps");

		// Checks
		if ((this.s === 0 && dir === -1) ||
			(this.s === steps.length-1 && dir === 1))
			{return;}

		// Increment
		this.s = this.s + dir;
		var s = this.s;

		// Update buttons
		if (s === 0) {
			this.$previous.css( {display:"none"} );
			this.$next.css( {display:"inline-block"} );
		} else if (s > 0 && s < steps.length-1) {
			this.$previous.css( {display:"inline-block"} );
			this.$next.css( {display:"inline-block"} );
		} else {
			this.$next.css( {display:"none"} );
			this.$previous.css( {display:"inline-block"} );
		}

		this.injectContent(this.i, s, dir);

	},

	injectContent:function(i, s, dir) {

		// Inject content
		var self = this;
		this.i = i;
		var story = self.collection.models[i];
		var steps = dir === 1 ? story.get("steps") : story.get("b_steps");

		function inject() {
			return function() {
				self.$title.html(steps[s].subtitle);
				self.$text.html(steps[s].text.content);
			}
		}

		var disappear_title = {elements:this.$title, properties:{ opacity:0 }, options:{duration:200, complete:inject()} };
		var disappear_text = {elements:this.$text, properties:{ opacity:0 }, options:{duration:200, sequenceQueue:false} };
		var appear_title = {elements:this.$title, properties:{ opacity:1 }, options:{duration:200} };
		var appear_text = {elements:this.$text, properties:{ opacity:1 }, options:{duration:200, sequenceQueue:false} };

		$.Velocity.RunSequence([disappear_title, disappear_text, appear_title, appear_text]);

		// Animate the flows
		var step = steps[s], fs = step.flows, flen = fs.length;
		if (flen !== 0) {
			while (flen--) {
				(function(flen) {
					setTimeout(function() {

						var flows = fs[flen],
						type = flows.type,
						vl = flows.vl,
						hl = flows.hl,
						popups = flows.popups,
						year = flows.year === "o4" ? 1 : 2;
						scaling = flows.scaling,
						mt = flows.mt;

						Backbone.trigger("flows:nav", {vl:vl, hl:hl, popups:popups, time:year, scaling:scaling, mt:mt});
						Backbone.trigger("route:forceState", {state:{typeState:type, timeState:String(year)}});

					}, parseInt(fs[flen].time));})(flen)
				}
			}


		// Animate the items
		var step = steps[s], ts = step.territories, tlen = ts.length;
		if (tlen !== 0) {
			while (tlen--) {
				Backbone.trigger("items:animate", ts[tlen]);
			}
		}
	},

	attachButtons:function() {
		this.previous_b = new app.ButtonView( {model:app.instance.ui.b_collection.get("previous"), el:this.$previous} );
		this.next_b = new app.ButtonView( {model:app.instance.ui.b_collection.get("next"), el:this.$next} );
	},

	showNext:function() {
		this.$next.css( {display:"inline-block"} );
	},

	previous:function() {
		this.nextStep( {dir:-1} );
	},

	next:function() {
		this.nextStep( {dir:1} );
	},

	arrowKeyPressed:function(e) {
		var code = e.keyCode;
		if (code == 39 && $("#next").css("display") !== "none") {
			this.next();
		} else if (code == 37 && $("#previous").css("display") !== "none") {
			this.previous();
		}
	}

});