var app = app || {};

app.ProjectsView = Backbone.View.extend({

	template: _.template( $('#project-template').html() ),

	initialize:function(options) {

		this.items_views = options.items_views.views_collection;

		// Collection of pins (for the map on the right)
		var PopProjectsViewsCollection = Backbone.Collection.extend( {model:app.PopProjectView} );
		this.ppv_collection = new PopProjectsViewsCollection();

		// Collection of items (for the list on the left)
		var ItemProjectsViewsCollection = Backbone.Collection.extend( {model:app.ItemProjectView} );
		this.ipv_collection = new ItemProjectsViewsCollection();

		// Listen for events of pins and items
		this.listenTo(Backbone, "projects:focus", this.focusProject);
		this.listenTo(Backbone, "projects:unfocus", this.unfocusProject);

		// Keep the panel hidden ?
		this.showpanel = options.showpanel;

	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			.renderPops()
			.renderItems()
			.slidePanel();
		return this;
	},

	slidePanel:function() {
		this.showpanel && this.$leftpanel.velocity({left:0}, {duration:1000, delay:1000, easing:"easeOut"})
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
		this.$list = this.$leftpanel.find("ul");
		this.$rightpanel = this.$el.find("#rightpanel");
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

	renderItems:function() {
		this.collection.each(function(project, index) {
			if (project.get("id") !== "p0" && project.get("id") !== "px") {
				var ipv = this.ipv_collection.add( {id:project.get("id"), model:project} );
				this.$list.append( ipv.render().el );
			}
		}, this);
		return this;
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
	},

	unfocusProject:function(args) {
		// Unfocus previously focused element
		this.focused_pop && this.focused_pop.unfocus();
		this.focused_item && this.focused_item.unfocus();
		this.focused_item && this.focused_item.$el.velocity("stop");
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