var app = app || {};

app.TerritoryView = Backbone.View.extend({

	id:"territory",

	template: _.template( $('#territory-template').html() ),

	initialize:function(options) {

		// Load intro if needed
		this.intro = options.intro;

		// Load core data of the view
		var data_url = this.model.get("data_url");
		var self = this;

		this.init_time = options.time;

		$.ajax({

			url:data_url,
      		data: { get_param: 'value' },
      		dataType: 'json',

      		success:function(data) {

				// Load Items
				var items = new Backbone.Collection(data.items);
				self.items_views = new app.ItemsView( {parent:self, collection:items} );

				// Load flows
				var flows = new Backbone.Collection(data.flows, {model:app.Flow});
				self.flows_views = new app.FlowsView( {parent:self, collection:flows, items_views:self.items_views} );

				// Load projects
				if (data.projects) {
					var projects = new Backbone.Collection(data.projects);//app.ProjectCollection(data.projects);
					var showpanel = (self.model.get("id") === "projects");
					self.projects_views = new app.ProjectsView( {parent:self, collection:projects, items_views:self.items_views, showpanel:showpanel} );
				}

				// Load stories
				var stories = new Backbone.Collection(data.stories[options.type]);//new app.StoryCollection(data.stories[options.type]);
				self.stories_views = new app.StoriesView( {collection:stories} );

				// Load view
				options.goto(self);

			}

		})

		// When rendering, Wait for items to be loaded before computing flow paths
		this.listenTo(Backbone, "items:loaded", function() {

			var self = this;

			_.defer(function() {

				_.delay(function() {

					self.projects_views && self.$projectcontainer.append( self.projects_views.render().el );
					Backbone.trigger("stories:go", {id:0});

					if (self.intro) {
						var iv = new app.IntroView();
						$("body").append( iv.render().el );
						iv.$back.velocity({opacity:0.6}, {duration:300, delay:750});
						self.iv = iv;
					}

					self.$storycontainer.velocity("fadeIn", {duration:300, delay:250});
					self.$flowcontainer.velocity("fadeIn", {duration:300, delay:250});
					self.$popcontainer.velocity("fadeIn", {duration:300, delay:250});
					$("#flowscale").velocity("fadeIn", {duration:300, delay:250});

				}, 50);

			})

		});

	},

	// Render functions
	render: function(options) {

		options = options || {};
		this.adjustVertically(options);

		this.$el.html( this.template() );
		this.$itemcontainer = this.$el.find("#itemcontainer");
		this.$flowcontainer = this.$el.find("#flowcontainer");
		this.$projectcontainer = this.$el.find("#projectcontainer");
		this.$storycontainer = this.$el.find("#storycontainer");
		this.$popcontainer = this.$el.find("#popcontainer");

		this.items_views.render();
		this.$storycontainer.append( this.stories_views.render().el );



		return this;
	},

	adjustVertically:function(options) {
		var dz = options.dz || 0;
		if (dz < 0) {
			this.$el.addClass("up")
		} else if (dz > 0) {
			this.$el.addClass("down")
		} else {
			this.$el.addClass("middle")
		}
		return this;
	},

	stopAllListening:function() {
		// items:loaded listener
		this.stopListening();

		// items:animate listener
		this.items_views.stopListening();

		// flows:children flows:parent flows:changeYear flows:nav listeners
		this.flows_views.stopListening();

		// stories:go listener
		this.stories_views.stopListening();

		// project:focus projetc:unfocus listener
		this.projects_views && this.projects_views.stopListening();

		this.iv && this.iv.stopListening();
	},

	// Removes all elements of the view
	close:function() {

		this.items_views.close();
		this.flows_views.close();
		this.stories_views.close();
		
		this.items_views.remove();
		this.flows_views.remove();
		this.stories_views.remove();

		if (this.projects_views) {
			this.projects_views.close();
			this.projects_views.remove();
		}

		this.iv && this.iv.close();

		this.stopListening();
	},

	transitionIn:function(options) {

		var self = this;
		var callback = function() {
			// self.$storycontainer.velocity("fadeIn", {duration:300});
			// self.$flowcontainer.velocity("fadeIn", {duration:300});
		}

		this.$el.velocity( {top:"0%"}, {duration:1000, complete:callback} );
	},

	transitionOut:function(options) {

		this.$storycontainer.velocity("fadeOut", {duration:300});
		this.$flowcontainer.velocity("fadeOut", {duration:300});
		this.$popcontainer.velocity("fadeOut", {duration:300});

		if (this.projects_views) {
			this.projects_views.exitPanel();
		}

		var dz = options.dz || 0, t = "0%";
		if (dz === 0) {
			options.callback();
			return;
		} else if (dz > 0) {
			t = "-100%";
		} else if (dz < 0) {
			t = "100%";
		}
		this.$el.velocity( {top:t}, {duration:1000, complete:options.callback} );

	}

});
