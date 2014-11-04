var app = app || {};

app.ItemProjectView = Backbone.View.extend({

	tagName:"li",
	className:"itemproject",

	events:{
		"mouseenter":"over",
		"mouseleave":"out",
		"click":"clk"
	},

	template: _.template( $('#itemproject-template').html() ),

	initialize:function() {
	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			return this;
	},

	cacheComponents:function() {
		this.$subtitle = this.$el.find(".subtitle");
		return this;
	},

	renderContent:function() {
		this.$el.html( this.template(this.model.attributes) );
		return this;
	},

	over:function() {
		Backbone.trigger("projects:focus", {id:this.model.get("id")})
	},

	out:function() {
		Backbone.trigger("projects:unfocus", {id:this.model.get("id")})
	},

	focus:function() {
		this.$el.addClass("item-focused");
		this.$subtitle.velocity("fadeIn", {duration:100});
		return this;
	},

	unfocus:function() {
		this.$el.removeClass("item-focused");
		this.$subtitle.velocity("fadeOut", {duration:100});
	},

	clk:function() {
		var id = this.model.get("id");
		id !== "p0" && Backbone.trigger("route:buildGo", {change:"project", id:id});
	},

	close:function() {
		this.stopListening();
	}

});