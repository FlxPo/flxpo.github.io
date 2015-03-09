var app = app || {};

app.ProjectsView = Backbone.View.extend({

	template: _.template( $('#project-template').html() ),

	events: {
		"keyup .form-control": "textSearch"
	},

	initialize:function(options) {

		this.items_views = options.items_views.views_collection;

		// Collection of pins (for the map on the right)
		var PopProjectsViewsCollection = Backbone.Collection.extend( {model:app.PopProjectView} );
		this.ppv_collection = new PopProjectsViewsCollection();

		// Collection of items (for the list on the left)
		var ItemProjectsViewsCollection = Backbone.Collection.extend( {model:app.ItemProjectView} );
		this.ipv_collection = new ItemProjectsViewsCollection();

		// Collection of categories
		var CategoriesViewsCollection = Backbone.Collection.extend( {model:app.CategoryView} );
		this.cat_collection = new CategoriesViewsCollection();

		// Listen for events of pins and items
		this.listenTo(Backbone, "projects:focus", this.focusProject);
		this.listenTo(Backbone, "projects:unfocus", this.unfocusProject);

		// Listen for events of category buttons
		this.listenTo(Backbone, "categories:focus", this.focusCategory);
		this.listenTo(Backbone, "categories:unfocus", this.unfocusCategory);
		this.listenTo(Backbone, "categories:clk", this.clkCategory);

		// Store name of projects for text search
		this.user_input = "";
		this.projects_ids = [];
		this.projects_names = [];
		this.collection.each(function(project, index) {
			this.projects_ids[index] = project.get("id");
			this.projects_names[index] = utils.formatString( project.get("name") );
		}, this);

		this.cat_matchs = _.clone(this.projects_ids);
		this.search_matchs = _.clone(this.projects_ids);
		this.clicked_cat_id = 0;
		this.clicked_cat = "Tous les projets";

		// Keep the panel hidden ?
		this.showpanel = options.showpanel;

	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			.renderCategories()
			.renderPops()
			.renderItems()
			.slidePanel();
		return this;
	},

	slidePanel:function() {
		this.showpanel && this.$leftpanel.velocity({opacity:1}, {duration:300, delay:1000, easing:"easeOut"})
	},

	exitPanel:function() {
		this.showpanel && this.$leftpanel.velocity("fadeOut", {duration:300})
	},

	renderContent:function() {
		this.$el.append( this.template() );
		return this;
	},

	cacheComponents:function() {
		this.$leftpanel = this.$el.find("#leftpanel");
		this.$list = this.$leftpanel.find("#itemlist");
		this.$input = this.$leftpanel.find(".form-control");
		this.$categorylist = this.$leftpanel.find("#categorylist ul");
		this.$categoryname = this.$leftpanel.find("#categoryname p");
		this.$rightpanel = this.$el.find("#rightpanel");
		this.$search_info = this.$el.find("#search_info");
		return this;
	},

	renderPops:function() {
		this.collection.each(function(project, index) {
			if (project.get("render")) {
				var ppv = this.ppv_collection.add( {id:project.get("id"), model:project, item:this.items_views.get(project.get("territory"))} );
				this.$rightpanel.append( ppv.render().el );
				_.defer(ppv.renderClean);
			}
		}, this);
		return this;
	},

	renderCategories:function() {

		var categoriesData = [
			{"icon": "icon-tous", "color":"#9e9e9", "label": "Tous les projets"},
			{"icon": "icon-nouveauxmodels", "color":"#b4b3b3", "label": "Nouveaux modèles économiques"},
			{"icon": "icon-eau", "color":"#99d2e9", "label": "Gestion durable de l'eau"},
			{"icon": "icon-energies", "color":"#fcea27", "label": "Récupération et valorisation énergétique"},
			{"icon": "icon-matieres", "color":"#cbbc9f", "label": "Réemploi et réutilisation matières"},
			{"icon": "icon-dechetsverts", "color":"#cbbc9f", "label": "Valorisation bio-déchets et agriculture urbaine"},
			{"icon": "icon-chantier", "color":"#9cc876", "label": "Recyclage et valorisation des déchets de chantier"}
		];

		_.each(categoriesData, function(category, index) {
			var clk = index == 0 ? true : false;
			var cv = this.cat_collection.add( {id:index, model:category, clicked:clk} );
			this.$categorylist.append( cv.render().el );
		}, this);

		return this;
	},

	renderItems:function() {

		this.collection.each(function(project, index) {
			if (project.get("id") !== "p0" && project.get("id") !== "px") {
				var ipv = this.ipv_collection.add( {id:project.get("id"), model:project} );
				this.$list.append( ipv.render().el );
			}
		}, this);

		return this;
	},

	showProject:function(project) {
		var pin = this.ppv_collection.get(project.model.attributes["id"]);
		!project.rendered && project.show();
		pin && !pin.rendered && pin.show();
	},

	hideProject:function(project) {
		var pin = this.ppv_collection.get(project.model.attributes["id"]);
		project.rendered && project.hide();
		pin && pin.rendered && pin.hide();
	},

	filterItemsByCat:function(cat_id) {

		// Loop through projects
		this.ipv_collection.each(function(project) {

			// If a category is clicked
			if (cat_id !== 0) {
				// Hide the projects that do not match the clicked category, show all the others
				if (_.indexOf(project.model.attributes["category"], cat_id) == -1) { this.hideProject(project); }
				else { this.showProject(project); }																	
			}
			// If no category is clicked, show all projects				
			else { this.showProject(project); }

		}, this);

	},

	filterItemsById:function() {

		var cat_id = this.clicked_cat_id;

		var ids_to_show = _.intersection(this.search_matchs, this.cat_matchs);
		var ids_to_hide = _.difference(this.projects_ids, ids_to_show);

		var projects_to_hide = _.select(this.ipv_collection.models, function(project) {
			return (_.indexOf(ids_to_hide, project.id) > -1);
		});

		var projects_to_show = _.select(this.ipv_collection.models, function(project) {
			return (_.indexOf(ids_to_show, project.id) > -1);
		});


		// Write search info box
		if (this.user_input.length > 2) {
			if (this.user_input !== "") {
				this.$search_info.html("<b>" + projects_to_show.length + "</b> résultats pour : <b>" + this.user_input.split(/[\s,]+/).join("</b> + <b>") + "</b>");
			}
		} else {
			this.$search_info.html("");
		}

		_.each(projects_to_hide, function(project) { this.hideProject(project) }, this);
		_.each(projects_to_show, function(project) { this.showProject(project) }, this);

	},

	textSearch:function(event) {

		// Format and split user input
		var user_input = this.$input.val();
		var user_input_clean = utils.formatString(user_input).split(/[\s,]+/);

		this.user_input = user_input;

		var index = [];
		var k = 0;

		// Search for occurences of each word
		_.each(user_input_clean, function(word) {

			// Find all projects names matching
			var matches = _.filter(this.projects_names, function(s) {
				return s.indexOf(word) !== -1;
			})

			var ids = [];
			var i = 0;

			// Find all index of matching names
			_.each(matches, function(match) {
				ids[i] = _.indexOf(this.projects_names, match);
				i++;
			}, this);

			index[k] = ids;
			k++;

		}, this);

		// Return the intersection of matches
		var pos = _.intersection.apply(_, index);
		var ids = [];
		k = 0;

		_.each(pos, function(id) {
			ids[k] = this.projects_ids[id];
			k++;
		}, this);

		this.search_matchs = ids;
		this.filterItemsById();

	},

	focusCategory:function(args) {
		this.$categoryname.html(args.label);
	},

	unfocusCategory:function(args) {
		this.$categoryname.html( this.clicked_cat );
	},

	clkCategory:function(args) {

		if (!args.options.silent) {

			this.cat_collection.each(function(cat) {
				cat.model.label != args.label && cat.unclk();
			})

			this.clicked_cat = args.label;
			this.clicked_cat_id = args.id;

			// Loop through projects
			this.cat_matchs = [];
			var k = 0;
			this.ipv_collection.each(function(project) {
				if (_.indexOf(project.model.attributes["category"], args.id) > -1) { this.cat_matchs[k] = project.id; k++; }
			}, this);

			this.filterItemsById();

		}

	},

	focusProject:function(args) {

		if (args.id !== "p0" && args.id !== "px") {

			var ipv = this.ipv_collection.get(args.id);

			// Unfocus previously focused element
			this.focused_pop && this.focused_pop.unfocus();
			this.focused_item && this.focused_item.unfocus();

			if (ipv.model.get("type") !== "global") {
				// Focus the target element and store that element
				this.focused_id = args.id;
				if (!args.freezePop) this.focused_pop = this.ppv_collection.get(args.id).focus();
			} else {
				// Focus the floating global element
				this.focused_id = "p0";
				if (!args.freezePop) this.focused_pop = this.ppv_collection.get("p0").focus();
			}

			this.focused_item = ipv.focus();
			if (args.freezePop) this.focused_item.$el.velocity( "scroll", {container:this.$list, duration:1000, offset:-64, "easing":"easeInOut"});
		}

		else if (args.id === "p0") {

			var projects_to_focus = _.select(this.ipv_collection.models, function(project) {
				return (project.model.get("type") === "global");
			});

			this.focused_items = {};
			var first = true;

			_.each(projects_to_focus, function(project) {
				this.focused_items[project.model.get("id")] = project;
				project.focus();
				if (first) { project.$el.velocity( "scroll", {container:this.$list, duration:1000, offset:-64, "easing":"easeInOut"}); first = !first; }
			}, this)

		}
	},

	unfocusProject:function(args) {

		if (args.id !== "p0") {
			// Unfocus previously focused element
			this.focused_pop && this.focused_pop.unfocus();
			this.focused_item && this.focused_item.unfocus();
			this.focused_item && this.focused_item.$el.velocity("stop");
		} else {
			_.each(this.focused_items, function(focused_item) {
				focused_item.unfocus();
			})
		}
	},

	close:function() {

		this.$leftpanel.velocity("stop");
		this.focused_item && this.focused_item.$el.velocity("stop");
		this.focused_pop && this.focused_pop.$el.velocity("stop");

		_.each(this.ppv_collection.models, function(ppv) {
			ppv.close();
			ppv.remove();
		});
		_.each(this.ipv_collection.models, function(ipv) {
			ipv.close();
			ipv.remove();
		});
		this.stopListening();
	}

});