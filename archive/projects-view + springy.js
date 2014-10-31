var app = app || {};

app.ProjectsView = Backbone.View.extend({

	template: _.template( $('#project-template').html() ),

	initialize:function(options) {

		this.items_views = options.items_views.views;

		var PopProjectsViewsCollection = Backbone.Collection.extend( {model:app.PopProjectView} );
		this.ppv_collection = new PopProjectsViewsCollection();

		var ItemProjectsViewsCollection = Backbone.Collection.extend( {model:app.ItemProjectView} );
		this.ipv_collection = new ItemProjectsViewsCollection();

	},

	render:function() {
		this.renderContent();
		return this;
	},

	renderContent:function() {

		this.collection.each(function(project, index) {
			var pv = this.ppv_collection.add( {id:project.get("id"), model:project, item:this.items_views[project.get("territory")]} );
			this.$el.append( pv.render().el );
			_.defer(pv.renderClean);
		}, this);

		return this;
	}

});