var app = app || {};

app.UIView = Backbone.View.extend({

	el: "#ui",

  events:{
    "click #share":"popShare",
    "click #expand":"expandFlows",
    "click #contract":"contractFlows",
    "click #about_b":"toggleX"
  },

  initialize:function(options) {

    this.buttons = {};

    this.b_collection = new app.ButtonCollection();
    this.listenTo(this.b_collection, 'add', this.addButton);
    this.b_collection.add(options.init);

    this.listenTo(Backbone, "ui:route", this.updateButtons);
    this.listenTo(Backbone, "ui:clickRadio", this.clickRadio);
    this.listenTo(Backbone, "ui:scale", this.updateScale);

    this.renderScale();
    
  },

  renderScale:function() {
      var paper = Raphael($("#fs_container div")[0], 100, 200);
      var scale_icon = paper.path();
      this.Rscale = scale_icon;
  },

  updateScale:function(args) {

      // Adapt the legend
      var vscale = Math.round(0.0001 * 80/args.scale) / 0.0001;
      var hscale = vscale*args.scale;


    if (hscale < 2) {

      $("#fs_container").hide();

    } else if (!args.virtual) {

      $("#fs_container").show();
      $("#fs_container div").css({height:hscale + 10})
      this.Rscale.attr({path:["M",30,hscale+5,"H",25,"V",5,"H",30], "stroke-width":3, "stroke":"#ccc"});
      $("#legend #fs_text p").html(formatVolume(vscale, " ") + " " + args.unit);
  
    }

  },

  addButton:function(button) {
    if ($(button.get("el")).length > 0) {
      this.buttons[button.get("id")] = new app.ButtonView( {model:button, el:$(button.get("el"))} );
    }
  },

  showButtons:function(args, delay) {

    var d = delay || 0;

    _.each(this.buttons, function(value) {
      var sc = value.model.get("show_class");
       value.$el.velocity("fadeOut", {duration:200})
    })

    var len = args.length;
    while(len--) {
      var bv = this.buttons[args[len]];
      var sc = bv.model.get("show_class");
      this.buttons[args[len]].$el.velocity("fadeIn", {display:sc, duration:200, delay:d})
      // this.buttons[args[len]].$el.addClass(sc);
    }
  },

  clickRadio:function(args) {
    var radio = this.buttons[args.id].model.get("radio"), len = radio.length;
    while(len--) {
      var id = radio[len];
      this.buttons[id].unclick();
    }
  },

  updateButtons:function(args) {
    var state = args.state;
    state.rootState === "p" && this.buttons[state.rootState].clk({silent:true});
    state.territoryState !== null && state.rootState !== "p" && this.buttons[state.territoryState].clk({silent:true});
    state.typeState !== null && this.buttons[state.typeState].clk({silent:true});
    state.timeState !== null && this.toggleTime(state);
  },

  popShare:function() {
      var w = window.screen.availWidth;
      var h = window.screen.availHeight;
      window.open("html/share.html",'popUpWindow',"height=100,width=400,left="+ w/2 +",top="+ h/2 +",resizable=no,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no,status=no")
  },

  toggleTime:function(state) {

    var $el = this.buttons["time"].$el;
    var $toggle = $el.find(".toggle");
    var $label = $el.find(".toggle span");

    // Target state : 2012/Tendances ?
    if (state.timeState === "2") {

      // Move toggle on the right
      $toggle.addClass("toggle-right");

      // Change span content and display legend if needed
      if (state.typeState === "matter") {
        $label.html("Tendances");
        $("#trend_legend").addClass("show_h");
      } else if (state.typeState === "energy") {
        $label.html("2009");
        $("#trend_legend").removeClass("show_h");
      } else {
        $label.html("2012");
        $("#trend_legend").removeClass("show_h");
      }

    // Else move toggle on the left and hide legend
    } else {
      $toggle.removeClass("toggle-right");

      // Change span content and display legend if needed
      if (state.typeState === "matter") {
        $label.html("2003");
        $("#trend_legend").removeClass("show_h");
      } else if (state.typeState === "energy") {
        $label.html("2004");
        $("#trend_legend").removeClass("show_h");
      } else {
        $label.html("2004");
        $("#trend_legend").removeClass("show_h");
      }
    }

  },

  toggleX:function() {
    var about_b = this.buttons["about"];
    var $span = about_b.$el.find("span");
    if (!this.about_clicked) {
      this.about_clicked = true;
      $span.html("x");
      $span.removeClass("i-info");
      $span.addClass("x-info");
    } else {
      this.about_clicked = false;
      $span.html("i");
      $span.addClass("i-info");
      $span.removeClass("x-info");
    }
  },

  expandFlows:function() {
    // Broadcast a expand event for the flows view to catch
    Backbone.trigger("flows:expand");
  },

  contractFlows:function() {
    // Broadcast a contract event for the flows view to catch
    Backbone.trigger("flows:contract");
  }

});