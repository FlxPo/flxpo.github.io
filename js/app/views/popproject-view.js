var app = app || {};

app.PopProjectView = Backbone.View.extend({

	className:"popproject",

	events:{
		"click":"clk",
		"mouseenter":"over",
		"mouseleave":"out"
	},

	template: _.template( $('#popproject-template').html() ),

	initialize:function(options) {
		_.bindAll(this, "renderClean")
		this.item = options.item;
		this.id = this.model.get("id");
	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			return this;
	},

	cacheComponents:function() {
		this.$pin = this.$el.find("#pin");
		this.$tip = this.$el.find(".tip");
		this.$pin.addClass(this.model.get("type"))
		return this;
	},

	renderContent:function() {
		this.$el.html( this.template(this.model.attributes) );
		return this;
	},

	renderGeometry:function() {
		var b_id = "pin" + this.model.get("type");
		if (this.model.get("id") === "p0") {
			this.pin_b = new app.ButtonView( {model:app.instance.ui.b_collection.get(b_id), el:this.$pin} );
		} else if (this.model.get("type") === "local") {
			this.pin_b = new app.ButtonView( {model:app.instance.ui.b_collection.get(b_id), el:this.$pin} );
		}
		return this;
	},

	correctPosition:function() {
		var xt = this.item.X;
		var yt = this.item.Y;
		var wt = this.item.w;
		var ht = this.item.h;
		var x = xt + wt * (parseFloat(this.model.get("x")) - 0.5);
		var y = yt + ht * (parseFloat(this.model.get("y")) - 0.5);
		this.y = y;
		this.$el.css( {top:y, left:x} );
	},

	renderClean:function() {

		this.renderGeometry()
			.correctPosition();

		var w = this.$tip.width(), h = this.$tip.height();
		var offy = this.model.get("type") === "local" ? 60 : 40;
		var offx = this.model.get("type") === "local" ? 10 : 15;
		this.$tip.css( {left:-w*0.5 - offx, top:-h - offy} );
	},

	clk:function() {
		if (this.id === "px") {
			Backbone.trigger("route:buildGo", {change:"root", id:"p"});
		} else if (this.id !== "p0") {
			Backbone.trigger("route:buildGo", {change:"project", id:id});
		}
	},

	over:function() {
		Backbone.trigger("projects:focus", {id:this.id, freezePop:true});
		(this.id === "p0" || this.id === "px") && this.$tip.addClass("show_h");
	},

	out:function() {
		Backbone.trigger("projects:unfocus", {id:this.id});
		(this.id === "p0" || this.id === "px") && this.$tip.removeClass("show_h");
	},

	focus:function() {
		this.$el.velocity( {top:"+=10"}, {duration:300, loop:true} );
		return this;
	},

	unfocus:function() {
		this.$el.velocity("stop", true).velocity({top:this.y});
	},

	close:function() {
		this.stopListening();
		this.pin_b && this.pin_b.remove();
	}

});