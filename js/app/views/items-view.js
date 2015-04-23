var app = app || {};

app.ItemsView = Backbone.View.extend({

	initialize:function(options) {
		this.parent = options.parent;

		var ViewsCollection = Backbone.Collection.extend( {model:app.ItemView} );
		this.views_collection = new ViewsCollection();

		this.listenTo(Backbone, "items:animate", this.animate);
	},

	render: function(options) {

		var len = this.collection.length;
		this.collection.each(function(item, index) {

			var complete = function() {Backbone.trigger("item:loaded")};
			this.views_collection.add({ id:item.get("id"), model:item, parent:this, complete:complete} );

		}, this);

	    return this;
	},

	close:function() {
		_.each(this.views_collection.models, function(view) {
			view.close();
			view.remove();
		})
		this.stopListening();
	},

	animate:function(args) {
		var iv = this.views_collection.get(args.target);
		iv && iv[args.action](args.parms, args.time);
	}

});