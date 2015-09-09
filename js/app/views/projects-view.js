var app = app || {};

app.ProjectsView = Backbone.View.extend({

	template: _.template('\
  		<div id = "leftpanel">\
			<div id = "header">\
      			<div class="form-group">\
        			<input type="text" class="form-control" placeholder="Recherche..."/>\
      			</div>\
            	<i class="icon-search form-control-feedback"></i>\
      			<div id = "categorylist">\
        			<ul></ul>\
      			</div>\
      			<div id = "categoryname">\
        			<p></p>\
      			</div>\
      			<p id = "search_info"></p>\
    		</div>\
    		<div id = "content">\
      			<ul id = "itemlist"></ul>\
    		</div>\
  		</div>\
  		<div id = "rightpanel"></div>\
	'),

	events: {
		"keyup .form-control": "textSearch"
	},

	initialize:function(options) {

		this.parent = options.parent;

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
		this.listenTo(Backbone, "projects:updatePositions", this.updateProjectsPositions);

		// Listen for events of category buttons
		this.listenTo(Backbone, "categories:focus", this.focusCategory);
		this.listenTo(Backbone, "categories:unfocus", this.unfocusCategory);
		this.listenTo(Backbone, "categories:clk", this.clkCategory);

		// Listen for panzoom events
		this.listenTo(Backbone, "map:pan", this.panMap);

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
		this.allow_pan = true;

	},

	render:function() {
		this.renderContent()
		.cacheComponents()
		.renderCategories()
		.renderPops()
		.renderItems()
		.attachPan()
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

	attachPan:function() {

      	// Set up panzoom
      	// var pz = this.parent.$itemcontainer.panzoom();
      	this.parent.$itemcontainer.panzoom( "option", "increment", 0.2 );
      	this.pan_limits = [-0.5,0.5,-0.75,0.75];
      	this.parent.$itemcontainer.panzoom( "option", "limits", this.pan_limits );

      	// When the user pans the map, move the projects pins container
      	this.parent.$itemcontainer.on("panzoomstart", _.bind(this.storeTransform, this));
      	this.parent.$itemcontainer.on("panzoompan", _.bind(this.panMap, this));
      	this.parent.$itemcontainer.on("panzoomend", _.bind(this.endPan, this));
      	this.parent.$itemcontainer.on("panzoomzoom", _.bind(this.panMapAfterZoom, this));
      	// this.parent.$el.on("mousewheel.focal", _.bind(this.wheelZoom, this));

      	this.offsetX = 0;
      	this.offsetY = 0;

      	this.startX = 0;
      	this.startY = 0;

      	this.previous_zoom = 1;
      	this.next_zoom = 1;

      	return this;
      },

      panMap:function(e, pz, x, y) {

		// Gets and sets the offset
		function panPanel($el, pz, x, y) {

			var w = $("#itemcontainer").width(),
				h = $("#itemcontainer").height();

			var xl = this.pan_limits[0]*w,
				xr = this.pan_limits[1]*w,
				yt = this.pan_limits[2]*h,
				yb = this.pan_limits[3]*h;


			if (y < yt) {
				$el.css("top", yt);
			} else if (y > yb) {
				$el.css("top", yb);
			} else {
				$el.css("top", y + 1*(this.startY - this.offsetY));
			}

			if (x < xl) {
				$el.css("left", xl);
			} else if (x > xr) {
				$el.css("left", xr);
			} else {
				$el.css("left", x + 1*(this.startX - this.offsetX));
			}
		}

		function disablePan() {
			this.allow_pan = false;
		}

		// If the mouse points inside the map container, move it
		// if (this.allow_pan) {

			// Set the listeners to catch the moment when the mouse leaves the map container
			// this.$leftpanel.one("mouseover", _.bind(disablePan, this));
			// $("#territory").one("mouseleave", _.bind(disablePan, this));
			_.bind(panPanel, this)(this.$rightpanel, pz, x, y);
			// _.bind(this.endPan,this)(pz);

		// } else {

		// 	_.bind(panPanel,this)(this.$rightpanel, pz, x, y);
		// 	_.bind(this.endPan,this)(pz);
		// 	this.allow_pan = true;
		// 	return;
		// }

	},

	endPan:function(e, pz) {
		// this.$leftpanel.off("mouseover");
		// $("#territory").off("mouseleave");
		this.offsetX = parseFloat(this.$rightpanel.css("left"));
		this.offsetY = parseFloat(this.$rightpanel.css("top"));
	},

	storeTransform:function(e, pz) {
		var z = pz.getMatrix()[0]
		this.previous_zoom = z;
		this.offsetX = pz.getMatrix()[4];
		this.offsetY = pz.getMatrix()[5];
		this.startX = parseFloat(this.$rightpanel.css("left"));
		this.startY = parseFloat(this.$rightpanel.css("top"));
	},

	panMapAfterZoom:function(e, pz, x, y) {
		var z = parseFloat(pz.getMatrix()[0]);
		this.previous_zoom = this.next_zoom;
		if (Math.abs(z - this.previous_zoom) > 0.001) {this.next_zoom = z;}
	},

	updateProjectsPositions:function() {
		this.renderPops();
		Backbone.trigger("territory:updateProjects");
	},

	wheelZoom:function(e) {

		e.preventDefault();
		var delta = e.deltaY || e.originalEvent.wheelDelta;
		var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;

		var next_zoom = this.previous_zoom + delta/100*2;
		$("#zoom").find(".zoom-range").val(next_zoom*100-50);

		this.parent.$itemcontainer.panzoom("zoom", zoomOut, {
			increment:Math.abs(delta)/100*2,
			animate:false,
			focal:e
		});

		mat = this.parent.$itemcontainer.panzoom("getMatrix").input;
		var ws = {clientX:e.clientX, clientY:e.clientY};

		var pz = this.parent.$itemcontainer.panzoom("instance");

		_.bind(this.reloadPins(e, pz, mat, ws, zoomOut), this)();


	},

	reloadPins:function(e, pz, mat, ws, zoomOut) {
		var self = this;
		var doit;
		return function() {
			clearTimeout(self.doit);
			console.log("clear and reset timer")

			self.panMapAfterZoom(e, pz);
			self.doit = setTimeout(function() {
				console.log("reload")
				Backbone.trigger("items:updatePositions", {mat:mat, ws:ws, z:zoomOut});
				Backbone.trigger("projects:updatePositions", {mat:mat, ws:ws, z:zoomOut});
			}, 200);
		};
	},

	renderPops:function() {

		// Render each project pin
		this.collection.each(function(project, index) {
			if (project.get("render")) {
				var ppv = this.ppv_collection.add( {id:project.get("id"), model:project, item:this.items_views.get(project.get("territory"))} );
				this.$rightpanel.append( ppv.render().el );
				_.defer(ppv.renderClean);
			}
		}, this);

		// Stack them from front to bottom to avoid unwanted overlap
		var self = this;
		_.defer(function() {

			function ySort(a, b) {
				var a_type = a.model.get("type"),
					b_type = b.model.get("type");

				if (a_type === b_type) {
					return (a.y - b.y)
				} else if (b_type == "global") {
					return -1
				} else {
					return 1
				}
			}

			var fs = self.ppv_collection.models;
			fs.sort(ySort);
			var len = fs.length;
			while(len--) {
				self.ppv_collection.get(fs[len].id).zOrder(len);
			}

		})

		return this;
	},

	renderCategories:function() {

		var categoriesData = [
		{"icon": "icon-tous", "color":"#9e9e9", "label": "Tous les projets"},
		{"icon": "icon-nouveauxmodels", "color":"#b4b3b3", "label": "Nouveaux modèles économiques"},
		{"icon": "icon-eau", "color":"#99d2e9", "label": "Gestion durable de l'eau"},
		{"icon": "icon-energies", "color":"#fcea27", "label": "Récupération et valorisation énergétique"},
		{"icon": "icon-matieres", "color":"#cbbc9f", "label": "Réemploi et réutilisation matières"},
		{"icon": "icon-dechetsverts", "color":"#cbbc9f", "label": "Valorisation biodéchets et agriculture urbaine"},
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

		var global_ids = ["paris", "grandparis", "valdemarne", "px"];

		this.collection.each(function(project, index) {
			var ipv = this.ipv_collection.add( {id:project.get("id"), model:project} );
			if (global_ids.indexOf(project.get("id")) < 0) {
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

		var global_ids = ["paris", "grandparis", "valdemarne", "px"];

		if (global_ids.indexOf(args.id) < 0) {

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
				var coverage = ipv.model.get("coverage")
				this.focused_id = coverage;
				if (!args.freezePop) this.focused_pop = this.ppv_collection.get(coverage).focus();
			}

			this.focused_item = ipv.focus();
			if (args.freezePop) this.focused_item.$el.velocity( "scroll", {container:this.$list, duration:1000, offset:-64, "easing":"easeInOut"});
		}

		else if (args.id !== "px") {

			var projects_to_focus = _.select(this.ipv_collection.models, function(project) {
				return (project.model.get("type") === "global" && project.model.get("coverage") === args.id);
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

		var global_ids = ["paris", "grandparis", "valdemarne", "px"];

		if (global_ids.indexOf(args.id) < 0) {
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
	},

	updatePops:function() {
		this.$leftpanel.velocity("stop");
		this.focused_item && this.focused_item.$el.velocity("stop");
		this.focused_pop && this.focused_pop.$el.velocity("stop");

		_.each(this.ppv_collection.models, function(ppv) {
			ppv.close();
			ppv.remove();
		});
	}

});