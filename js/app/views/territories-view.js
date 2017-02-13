var app = app || {};

app.TerritoriesView = Backbone.View.extend({

  initialize:function(options) {
    this.territories = new Backbone.Collection();

    // Filter out hidden projects
    // var init = _.filter(options.init, function(i) {
    //   return i.hidden !== true;
    // });

    this.territories.add(options.init);
    this.currentView = null;
  },

  addTerritoryView:function(args) {
  	// this.view && this.view.close();
    var previous = this.CurrentView;
	  var next = new app.TerritoryView( {model:this.territories.get(args.id), time:args.time, type:args.type, mt:args.mt, goto:_.bind(app.instance.goto, app.instance)} )
  },

  close:function() {
  	 this.previousView.close();
  	 this.previousView.remove();
  }

});
