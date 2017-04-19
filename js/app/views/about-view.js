var app = app || {};

app.AboutView = Backbone.View.extend({

	id:"about",

	template: _.template('\
		<div id = "info_back"></div>\
  		<div>\
			<div id = "info_content">\
				<ul id = "info_header">\
        			<li><h2>Informations sur cette visualisation</h2></li>\
        			<li id = "launch"><p>Intro</p></li>\
        			<li id = "demo"><p>Démo</p></li>\
      			</ul>\
      			<ul id = "info_main">\
      				<li>Les données sur les flux d’énergies et d’eaux sont celles de la Ville de Paris.</li>\
      				<br>\
      				<li>La nomenclature des flux et les données utilisées pour cette infographie sont adaptées du rapport de Sabine Barles, professeure d’urbanisme à l’université Paris 1 Panthéon-Sorbonne (UMR Géographie-Cités) : <a href = "data/pdf/Barles-EI-Paris.pdf" target = "_blank">« Mesurer la performance écologique des villes et des territoires : le métabolisme de Paris et de l’Île-de-France »</a></li>\
      				<br>\
      				<li>Les tendances relatives à l’évolution des flux de matières ont été évaluées avec l’aide de Laurent Georgeault doctorant de l’université Paris 1 et chargé de mission à l’Institut de l’économie circulaire.</li>\
    			</ul>\
    			<p>Pour plus d’information, voir aussi :</p>\
    			<ul>\
      				<li class = "refs">BARLES, S. <a href = "http://www.developpementdurable.revues.org/10090" target = "_blank">« L’écologie territoriale et les enjeux de la dématérialisation des sociétés : l’apport de l’analyse des flux de matières »</a>, Développement durable des territoires 5(1), 2014.</li>\
      				<br>\
      				<li class = "refs">REPELLIN, P., DURET, B., BARLES, S. <a href = "http://www.statistiques.developpement-durable.gouv.fr/publications/p/2101/1161/comptabilite-flux-matieres-regions-departements-guide.html" target = "_blank">Comptabilité des flux de matières dans les régions et les départements.</a> Guide méthodologique. La Défense : Ministère de l’Écologie, du Développement durable et de l’Énergie – CGDD (coll. « Repères »), 2014.</li>\
    			</ul>\
    			<ul id = "credits">\
      				<li>\
        				<h3>Maîtrise d’ouvrage :</h3>\
        				<p>Agence d’écologie urbaine – Mairie de Paris<br>(contact : <a href ="mailto:entreprisesresponsables@paris.fr">entreprisesresponsables@paris.fr</a>)<br></p>\
        				<a href ="http://www.paris.fr/" target = "_blank"><img src = "./data/graphics/logo-mdp.gif"/></a>\
      				</li>\
      				<li>\
        				<h3>Conception :</h3>\
        				<p>Elioth<br>(contact : <a href ="mailto:elioth@elioth.fr">elioth@elioth.fr</a>)</p><a href ="http://elioth.com/" target = "_blank"><img src = "./data/graphics/logo-elioth.png"/></a>\
      				</li>\
      			</ul>\
  			</div>\
 		</div>\
	'),

	events: {
		"click #launch": "intro",
		"click #demo": "demo",
		"mouseover #info_content": "addCircle"
	},

	initialize:function() {
		$("body").addClass("scrollable");

		// To store the circles
		var ViewsCollection = Backbone.Collection.extend( {model:app.CircleView} );
		this.views_collection = new ViewsCollection();
	},

	render: function(options) {

		this.$el.html( this.template() );
		this.$el.addClass("middle");

		this.renderRaphael();

		return this;
	},

	renderRaphael:function() {
		var r_div = this.$el.find("#info_back");
		var ws = utils.getWindowSize(), w = ws.w, h = ws.h;
		var r = Raphael(r_div[0], w, h);
		this.paper = r;

		this.xleft = 0.15*w;
		this.xright = 0.85*w;
		this.h = h;

		// Adds a circle randomly
		var t1 = Math.floor(500+Math.random()*500);
		var t2 = Math.floor(250+Math.random()*500);
		var self = this;
		this.clockAddCircle = setInterval(function() {self.addCircle();}, t1);
		this.clockKillCircle = setInterval(function() {self.killCircle();}, t2);
	},

	addCircle:function() {
		if (this.views_collection.models.length < 12) {
			var x = Math.random() > 0.5 ? this.xleft : this.xright;
			var c = new app.Circle( {cx:x, cy:this.h*(Math.random()*0.75+0.1)} );
			var cv = this.views_collection.add( {model:c, paper:this.paper, circles:this.circles} );
			cv.render();
		}
	},

	killCircle:function() {
		if (this.views_collection.models.length > 0) {
			var n = Math.floor(this.views_collection.models.length*Math.random());
			var c = this.views_collection.at(n).close();
			this.views_collection.remove(c);
		}
	},

	// Removes all elements of the view
	close:function() {

		this.stopListening();

		clearInterval(this.clockAddCircle);
		clearInterval(this.clockKillCircle);

		_.each(this.views_collection.models, function(circle) {
			circle.close();
			circle.remove();
		})

		this.paper.remove();

		this.remove();
	},

	transitionIn:function(options) {

		var self = this;
		// var callback = function() {$("#appcontainer").addClass("scrollable"); self.$el.addClass("scrollable"); };

		this.$el.velocity( "fadeIn", {duration:300, complete:callback} );
	},

	transitionOut:function(options) {
		
		var callback = function() {};
		if (options.callback) {
			calbback = _.bind(this[options.callback], this)
		}

		this.$el.velocity( "fadeOut", {duration:300, complete:callback} );
	},

	// Interaction functions
	intro:function() {
		app.instance.ui.unloadAbout();
		var r = app.instance.router;
		if (r.state.rootState != "t") {
			app.instance.router.force_intro = true;
			app.instance.router.go("t/paris/matter/1");
		} else {
			app.instance.router.reload(true);
		}
	},

	demo:function() {
		Backbone.trigger("ui:demo");
	}

});
