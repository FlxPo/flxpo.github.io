var app = app || {};

app.CategoryView = Backbone.View.extend({

	tagName:"li",
	className: "categorybutton",

	events:{
		"mouseenter":"over",
		"mouseleave":"out",
		"click":"clk"
	},

	template: _.template( '<span></span>' ),

	initialize:function(options) {
		if (options.clicked) {
			 this.over();
			 this.clk({silent:true});
		}
	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			return this;
	},

	cacheComponents:function() {
		// this.$logocontainer = this.$el.find(".logocontainer");
		// this.$logo = this.$el.find(".logocontainer");
		return this;
	},

	renderContent:function() {
		var self = this;
		this.$el.html( this.template(this.model.attributes) );
		this.$el.css({"border-bottom-color": this.model["color"]});
		this.$el.find("span").addClass(self.model["icon"]);
		return this;
	},

	over:function() {
		this.$el.addClass("category-over");
		Backbone.trigger("categories:focus", {label:this.model["label"]});
	},

	out:function() {
		!this.clicked && this.$el.removeClass("category-over");
		Backbone.trigger("categories:unfocus");
	},

	clk:function(options) {
		this.clicked = true;
		Backbone.trigger("categories:clk", {id:this.id, label:this.model["label"],  state: this.model["state"], options:options});
	},

	unclk:function() {
		this.clicked = false;
		this.$el.removeClass("category-over");
	},

	close:function() {
		this.stopListening();
	}

});