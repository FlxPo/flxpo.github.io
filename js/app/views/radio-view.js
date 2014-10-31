var app = app || {};

app.RadioView = Backbone.View.extend({

  initialize:function() {
  	this.buttonsViews = [];
  	this.$buttons = this.$el.children().first().children();
    _.each(this.$buttons, this.addButton, this);
  },

  addButton:function(value) {
  	var bm = new app.Button( {change:"root", id:"about"} );
  	this.buttonsViews.push(new app.ButtonView( {model:bm, el:value} ));
  }

});