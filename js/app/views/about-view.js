var app = app || {};

app.AboutView = Backbone.View.extend({

	id:"about",

	template: _.template( $('#about-template').html() ),

	events: {
		"click #launch": "intro",
		"click #demo": "demo",
		"mouseover #info_content": "addCircle"
	},

	initialize:function() {
		$("body").addClass("scrollable");

		// To store the circles
		var ViewsCollection = Backbone.Collection.extend( {model:app.CircleView} );
		this.views_collection = new ViewsCollection();
	},

	render: function(options) {

		this.$el.html( this.template() );
		this.$el.addClass("middle");

		this.renderRaphael();

		return this;
	},

	renderRaphael:function() {
		var r_div = this.$el.find("#info_back");
		var ws = utils.getWindowSize(), w = ws.w, h = ws.h;
		var r = Raphael(r_div[0], w, h);
		this.paper = r;

		this.xleft = 0.15*w;
		this.xright = 0.85*w;
		this.h = h;

		// Adds a circle randomly
		var t1 = Math.floor(500+Math.random()*500);
		var t2 = Math.floor(250+Math.random()*500);
		var self = this;
		this.clockAddCircle = setInterval(function() {self.addCircle();}, t1);
		this.clockKillCircle = setInterval(function() {self.killCircle();}, t2);
	},

	addCircle:function() {
		if (this.views_collection.models.length < 12) {
			var x = Math.random() > 0.5 ? this.xleft : this.xright;
			var c = new app.Circle( {cx:x, cy:this.h*(Math.random()*0.75+0.1)} );
			var cv = this.views_collection.add( {model:c, paper:this.paper, circles:this.circles} );
			cv.render();
		}
	},

	killCircle:function() {
		if (this.views_collection.models.length > 0) {
			var n = Math.floor(this.views_collection.models.length*Math.random());
			var c = this.views_collection.at(n).close();
			this.views_collection.remove(c);
		}
	},

	// Removes all elements of the view
	close:function() {
		this.stopListening();

		clearInterval(this.clockAddCircle);
		clearInterval(this.clockKillCircle);

		_.each(this.views_collection.models, function(circle) {
			circle.close();
			circle.remove();
		})

		this.paper.remove();

		this.remove();
	},

	transitionIn:function(options) {

		var self = this;
		// var callback = function() {$("#appcontainer").addClass("scrollable"); self.$el.addClass("scrollable"); };

		this.$el.velocity( "fadeIn", {duration:300, complete:callback} );
	},

	transitionOut:function(options) {
		
		var callback = function() {};
		if (options.callback) {
			calbback = _.bind(this[options.callback], this)
		}

		this.$el.velocity( "fadeOut", {duration:300, complete:callback} );
	},

	// Interaction functions
	intro:function() {
		console.log("intro")
		app.instance.ui.unloadAbout();
		app.instance.router.reload(true);
	},

	demo:function() {
		console.log("demo")
	}

});
