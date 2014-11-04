var app = app || {};

app.StartView = Backbone.View.extend({

	id:"start",

	template: _.template( $('#start-template').html() ),

	events: {
		"click #launch": "launch",
		"click #demo": "demo",
		"mouseover #tstart": "addCircle"
	},

	initialize:function(options) {
		var ViewsCollection = Backbone.Collection.extend( {model:app.CircleView} );
		this.views_collection = new ViewsCollection();
	},

	// Render functions
	render: function(options) {
		this.$el.html( this.template( this.model.attributes ) );
		options = options || {};
		this.adjustVertically(options);
		this.renderRaphael();
		return this;
	},

	adjustVertically:function(options) {
		var dz = options.dz || 0;
		if (dz < 0) {
			this.$el.addClass("up")
		} else if (dz > 0) {
			this.$el.addClass("down")
		} else {
			this.$el.addClass("middle")
		}
		return this;
	},

	renderRaphael:function() {
		var r_div = this.$el.find("#rstart");
		var r = Raphael(r_div[0], 800, 800);
		this.paper = r; 
		this.cx = 400, this.cy = 400;

		// Adds a circle randomly
		var t1 = Math.floor(500+Math.random()*500);
		var t2 = Math.floor(250+Math.random()*500);
		var self = this;
		this.clockAddCircle = setInterval(function() {self.addCircle();}, t1);
		this.clockKillCircle = setInterval(function() {self.killCircle();}, t2);
	},

	addCircle:function() {
		if (this.views_collection.models.length < 12) {
			var c = new app.Circle( {cx:this.cx, cy:this.cy} );
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

	stopAllListening:function() {
		this.stopListening();
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

	},

	transitionIn:function(options) {
		var callback = options.callback ? _.bind(this[options.callback], this) : function() {};
		this.$el.velocity( {top:"0%"}, {duration:1000, complete:callback} );
		$("#foot_logos").velocity("fadeIn", {duration:200});
	},

	transitionOut:function(options) {

		console.log(typeof options.callback)

		var dz = options.dz || 0, t = "0%";
		if (dz === 0) {
			options.callback();
			return;
		} else if (dz > 0) {
			t = "-100%";
		} else if (dz < 0) {
			t = "100%";
		}
		this.$el.velocity( {top:t}, {duration:1000, complete:options.callback} );
		$("#foot_logos").velocity("fadeOut", {duration:200});
	},

	// Interaction functions
	launch:function() {
		Backbone.trigger("route:buildGo", {change:"territory", id:"paris"});
	},

	demo:function() {
		// console.log("demo")
	}

});
