var app = app || {};

app.AboutView = Backbone.View.extend({

	id:"about",

	template: _.template( $('#about-template').html() ),

	events: {
		"click #intro": "intro",
		"click #demo": "demo"
	},

	// Render functions
	render: function(options) {

		this.$el.html( this.template( this.model.attributes ) );

		options = options || {};
		this.$el.addClass("middle");

		return this;
	},

	// Removes all elements of the view
	close:function() {
		this.remove();
	},

	transitionIn:function(options) {

		var self = this;
		var callback = function() {$("#appcontainer").addClass("scrollable"); self.$el.addClass("scrollable"); };
		// if (options.callback) {
		// 	calbback = _.bind(this[options.callback], this)
		// }

		this.$el.velocity( "fadeIn", {duration:200, complete:callback} );
	},

	transitionOut:function(options) {
		
		var callback = function() {};
		if (options.callback) {
			calbback = _.bind(this[options.callback], this)
		}

		this.$el.velocity( "fadeOut", {duration:200, complete:callback} );
	},

	// Interaction functions
	intro:function() {
		console.log("intro")
		// Backbone.trigger("route:go", "t/paris/matter/1");
	},

	demo:function() {
		console.log("demo")
	}

});
