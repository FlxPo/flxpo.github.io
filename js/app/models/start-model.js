var app = app || {};

app.Start = Backbone.Model.extend({

  defaults: {
    warningText:  "Ce site est compatible avec Firefox, Chrome et Internet Explorer 9+",
    startTitle: "Métabolisme Urbain de Paris",
    startText: "Visualisez les flux de matières, d’énergies ou d’eaux et découvrez des projets innovants pour mieux comprendre les interactions de la ville avec son environnement.",
  	z:10,
  	ui_elements:[]
  }

});