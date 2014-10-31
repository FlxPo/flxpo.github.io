
  var app = app || {};

  var FlowTipList = Backbone.Collection.extend({

    model: app.FlowTip,
    localStorage: new Backbone.LocalStorage('flowtips-backbone'),

  });

  app.FlowTips = new FlowTipList();