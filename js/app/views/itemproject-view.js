var app = app || {};

app.ItemProjectView = Backbone.View.extend({

	tagName:"li",
	className:"itemproject",

	events: function() {

		var events_hash = {};
		if (this.to_render) {
			_.extend(events_hash, {"mouseenter":"over",
									"mouseleave":"out",
									"click":"clk"});
		}
		return events_hash;
	},

	template: _.template('\
		<div class = "content">\
      		<div class = "gcontainer"><img class = "graphics" src=<%=imgurl%>></div>\
      		<div class = "logocontainer hidden">\
        	<div class = "mask"></div>\
        		<img src=<%=logourl%>>\
      		</div>\
      		<div class = "text">\
        		<h3 class = "name"><%=name%></h3>\
      		<div>\
    	</div>\
	'),

	initialize:function() {
		this.rendered = true;
		this.hasLogo = true;
		if (this.model.get("logo") == "amu") { this.model.set("logourl", "data/graphics/logoamusmall.png"); }
		else if (this.model.get("logo") == "adpd") { this.model.set("logourl", "data/graphics/adpd.png"); }
		else { this.model.set("logourl", ""); this.hasLogo = false }

		var global_ids = ["paris", "grandparis", "valdemarne", "px"];
		this.to_render = true;
		if(global_ids.indexOf(this.model.get("id")) > -1) {
			this.to_render = false;
		}
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
		this.to_render && this.hasLogo && this.$logocontainer.show();
		return this;
	},

	unfocus:function() {
		this.$el.removeClass("item-focused");
		this.to_render && this.hasLogo && this.$logocontainer.hide();
	},

	clk:function() {
		var id = this.model.get("id");
		var global_ids = ["paris", "grandparis", "valdemarne", "px"];
		(global_ids.indexOf(this.model.get("id")) < 0)  && Backbone.trigger("route:buildGo", {change:"project", id:id});
	},

	close:function() {
		this.stopListening();
	}

});