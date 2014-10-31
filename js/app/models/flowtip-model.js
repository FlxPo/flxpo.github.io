var app = app || {};

app.FlowTip = Backbone.Model.extend({

  defaults: {
    flowLabel:  "Name of the flow",
    flowVolume: "X unit",
    children: 	true,
    parent:     true
  }

});