var app = app || {};

app.Flow = Backbone.Model.extend({

   defaults: {
    flowLabel:  "Name of the flow",
    flowVolume: {"o4":35, "o9":55},
    unit: "X/an",
    geometry: {type: "path", "stroke":"#000"},
    pulse: {type: "circle", "fill":"#f0f", "stroke":"none"}
  },

  initialize: function() {

    // Create the 2 colors for the active (hovered/clicked) and normal states
    var c = this.get("color")
    this.set( {"n_color":utils.darkenColor(c, 0.7)} );
    this.set( {"a_color":utils.darkenColor(c, 0.6)} );

    // Store the ids of the family
    var ch = this.get("children");
    var pa = this.get("parent");
    var si = this.get("siblings");
    ch && this.set("children", ch === "" ? undefined : ch.split(";"));
    pa && this.set("parent", pa === "" ? undefined : pa);
    si && this.set("siblings", si === "" ? undefined : si.split(";").concat(this.get("id")));

    // Validate volumes
    var vo4 = this.get("volume_o4");
    var vo9 = this.get("volume_o9");
    vo4 = vo4 === "NA" ? -1 : parseInt(vo4.replace(/\s+/g, ''));
    vo9 = vo9 === "NA" ? -1 : parseInt(vo9.replace(/\s+/g, ''));
    this.set("volume_o4", vo4);
    this.set("volume_o9", vo9);

    // Leaf, root booleans
    var root = this.get("root") == "true";
    var leaf = this.get("leaf") == "true";
    this.set("root", root);
    this.set("leaf", leaf);

  }

});