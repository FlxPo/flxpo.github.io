var app = app || {};

app.PopProjectView = Backbone.View.extend({

	className:"popproject",

	events:{
		"click":"clk",
		"mouseenter":"over",
		"mouseleave":"out"
	},

	template: _.template('\
		<div class="tip border-tip">\
			<div id = "mousebox"></div>\
			<p><%=name%></p>\
			<b class="border-notch notch"></b>\
			<b class="notch"></b>\
		</div>\
		<div id = "pin"></div>\
	'),

	initialize:function(options) {
		_.bindAll(this, "renderClean")
		this.item = options.item;
		this.id = this.model.get("id");
		this.rendered = true;
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

		var type = this.model.get("type") === "local" ? "local" : "global";
		var b_id = "pin" + type;
		this.pin_b = new app.ButtonView( {model:app.instance.ui.b_collection.get(b_id), el:this.$pin} );

		return this;
	},

	correctPosition:function() {
		var xt = this.item.X;
		var yt = this.item.Y;
		var wt = this.item.w;
		var ht = this.item.h;
		var wb = this.item.wBase;
		var hb = this.item.hBase;
		var s = this.item.scaling;

		var is_gp = this.item.model.get("geom");

		if (is_gp == "data/graphics/geom_grandparis.json") {
			var x = xt - wt/2 + 1*1069 * (parseFloat(this.model.get("x"))) * s*s * wt/wb + 344*s*s * wt/wb;
			var y = yt - ht/2 + 1*393 * (parseFloat(this.model.get("y"))) * s*s * ht/hb + 389*s*s * wt/wb;
		} else {
			var x = xt + wt*(parseFloat(this.model.get("x")) - 0.5);
			var y = yt + ht*(parseFloat(this.model.get("y")) - 0.5);
		}


		this.y = y;
		this.x = x;
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
		var id = this.id;
		if (id === "px") {
			Backbone.trigger("route:buildGo", {change:"root", id:"p"});
		} else if (id !== "p0") {
			Backbone.trigger("route:buildGo", {change:"project", id:id});
		}
	},

	show:function() {
		this.$el.velocity("fadeIn", {duration:200, display:"block"});
		this.rendered = true;
	},

	hide:function() {
		this.$el.velocity("fadeOut", {duration:200});
		this.rendered = false;
	},

	over:function() {
		Backbone.trigger("projects:focus", {id:this.id, freezePop:true});
		(this.id.length > 3 || this.id === "px") && this.$tip.addClass("show_h");
	},

	out:function() {
		Backbone.trigger("projects:unfocus", {id:this.id});
		(this.id.length > 3 || this.id === "px") && this.$tip.removeClass("show_h");
	},

	focus:function() {
		this.$el.velocity( {top:"-=10"}, {duration:300, loop:true} );
		return this;
	},

	unfocus:function() {
		this.$el.velocity("stop", true).velocity({top:this.y});
	},

	close:function() {
		this.stopListening();
		this.pin_b && this.pin_b.remove();
	},

	zOrder:function(z) {
		this.$el.css({"z-index":z});
	}

});