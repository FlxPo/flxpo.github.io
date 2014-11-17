var app = app || {};

app.DemoView = Backbone.View.extend({

	id:"video_container",

	template: _.template( $('#demo-template').html() ),

	events: {
		"click #close_demo": "UIclose"
	},

	initialize:function() {
	},

	render: function(options) {
		this.$el.html( this.template() );
		this.$el.addClass("middle");
		return this;
	},

	// Removes all elements of the view
	close:function() {
		this.stopListening();
	},

	UIclose:function() {
		Backbone.trigger("ui:closeDemo");
	}

});
