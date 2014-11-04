var app = app || {};

app.AppView = Backbone.View.extend({

	el: "#appcontainer",

  initialize:function() {

    this.router = new app.Router();

    console.log(window.location.pathname)

    var self = this;
    // Load init resource data
    $.ajax({

      url:"data/init.json",
      data: { get_param: 'value' },
      dataType: 'json',

      success:function(data) {
        // Loads UI
        self.ui = new app.UIView({init:data.ui});
        // Loads territories
        self.territories = new app.TerritoriesView({init:data.navigation});
        // Loads router
        Backbone.history.start();
      }

    });

  },

  goto: function (view) {

      // Store the previous (if existing) / current view for processing
      var previous = this.currentPage || null;
      var next = view;

      // Unbind all listeners of previous view to avoid collisions with the next
      previous && previous.stopAllListening();

      // Get the direction of the transition upward / downward / still
      var dz = previous
               && !_.isUndefined(previous.model.get("z"))
               && !_.isUndefined(next.model.get("z")) ?
               previous.model.get("z") - next.model.get("z") : 0;

      // Render the view in memory, positioned offscreen upward or downward
      next.render( {dz:dz} );

      // Append the next view
      this.$el.append( next.$el );
      this.currentPage = next;

      function destroyPrevious(view) {
        return function() {
          view.close();
          view.remove();
          delete view;
        }
      }

      // Transition the previous and next views
      if (previous) {
        _.delay(function() {
          previous.transitionOut( {dz:dz, callback:destroyPrevious(previous)} );
          next.transitionIn( {dz:dz});
        }, 500);
      }

      // Load/unload ui elements
      var d = previous === null ? 300 : 1250;
      this.ui.showButtons(next.model.get("ui_elements"), 1250);

	},

  stopListeningPrevious:function() {
    if (this.currentPage) {
        this.currentPage.stopListening();

        if (this.currentPage.items_views) {
          this.currentPage.items_views.stopListening();
          this.currentPage.flows_views.stopListening();
          this.currentPage.stories_views.stopListening();
        }

        if (this.projects_views) {
          this.currentPage.projects_views.stopListening();
        }
    }
  }

});