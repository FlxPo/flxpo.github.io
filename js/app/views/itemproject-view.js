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
		this.rendered = true;
		this.hasLogo = true;
		if (this.model.get("logo") == "amu") { this.model.set("logourl", "data/graphics/logoamusmall.png"); }
		else if (this.model.get("logo") == "adpd") { this.model.set("logourl", "data/graphics/adpd.png"); }
		else { this.model.set("logourl", ""); this.hasLogo = false }
	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			return this;
	},

	cacheComponents:function() {
		this.$logocontainer = this.$el.find(".logocontainer");
		// this.$logo = this.$el.find(".logocontainer");
		return this;
	},

	renderContent:function() {
		this.$el.html( this.template(this.model.attributes) );
		return this;
	},

	over:function() {
		Backbone.trigger("projects:focus", {id:this.model.get("id")})
	},

	hide:function() {
		this.$el.velocity("fadeOut", {duration:0});
		this.$el.addClass("item-hidden");
		this.rendered = false;
	},

	show:function() {
		this.$el.velocity("fadeIn", {duration:0, display:"inline-block"});
		this.rendered = true;
	},

	out:function() {
		Backbone.trigger("projects:unfocus", {id:this.model.get("id")})
	},

	focus:function() {
		this.$el.addClass("item-focused");
		this.hasLogo && this.$logocontainer.show();
		return this;
	},

	unfocus:function() {
		this.$el.removeClass("item-focused");
		this.hasLogo && this.$logocontainer.hide();
	},

	clk:function() {
		var id = this.model.get("id");
		id !== "p0" && Backbone.trigger("route:buildGo", {change:"project", id:id});
	},

	close:function() {
		this.stopListening();
	}

});