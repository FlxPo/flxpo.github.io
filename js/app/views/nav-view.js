var app = app || {};

app.NavView = Backbone.View.extend({

	tagName:"li",
	className:"n_button",

	events:{
		"click":"clk"
	},

	template: _.template( $('#nav-template').html() ),

	initialize:function() {
		_.bindAll(this, "renderClean")
	},

	render:function() {
		this.$el.html( this.template(this.model.attributes) );
		!this.model.get("display_dot") && this.$el.addClass("hidden")
		return this;
	},

	renderClean:function() {
		var w = this.$el.find(".tip").width(), h = this.$el.find(".tip").height();
		this.$el.find(".tip").css({left:-w*0.5 - 7.5/2, top:-h - 25});
	},

	clk:function(args) {

		// Unclick other buttons
		this.$el.parent().children().each(function() {$(this).removeClass("n-clicked");});
		this.$el.addClass("n-clicked");

		// Load story
		!args.silent && Backbone.trigger("stories:go", {id:this.id});

	}

});