var app = app || {};

app.IntroView = Backbone.View.extend({

	id:"intro",

	events:{
		"click":"close"
	},

	template: _.template( $('#intro-template').html() ),

	initialize:function() {

		_.bindAll(this, "resizeBack");

		this.content = {topleft:"Trois types de flux : matières, énergies, eaux",
						topright1:"Accès aux projets innovants",
						topright2:"<br>Trois échelles : Paris, Ile-de-France, Petite Couronne<br><br> ",
						topright3:"Les tendances d'évolution",
						bottom:"Les informations complémentaires sur les flux"};

	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			.attachResize();
		return this;
	},

	// Render functions
	renderContent: function(options) {
		this.$el.html( this.template(this.content) );
		return this;
	},

	cacheComponents:function() {
		this.$back = this.$el.find("#intro_back");
		this.$bottom = this.$el.find("#bottom");
		return this;
	},

	resizeBack:function() {
		var win = $(window), w = win.innerWidth(), h = win.innerHeight();
		this.$back.css({ width:w*0.97+'px', height:h*0.95+'px', top:0.025*h, left:0.015*w })
	},

	attachResize:function() {

		var win = $(window), w = win.innerWidth(), h = win.innerHeight();
			this.$back.css({ width:w*0.97+'px', height:h*0.95+'px', top:0.025*h, left:0.015*w })
		
		$(window).on("resize", this.resizeBack);
		return this;
	},

	// Removes all elements of the view
	close:function() {
		this.stopListening();
		$(window).off("resize", this.resizeBack);
		this.remove();
	}

});
