var app = app || {};

app.Router = Backbone.Router.extend({
  
  routes: {
    "": "start",
    "about": "about",
    "p": "projects",
    "p/:id": "project",
    "t/:id/:type/:time": "territory",
    "p/:id" : "project"
  },

  initialize:function() {

    this.listenTo(Backbone, "route:go", this.go);
    this.listenTo(Backbone, "route:forceState", this.forceState);
    this.listenTo(Backbone, "route:buildGo", this.buildGo);

    this.state = {
      rootState:null,
      territoryState:null,
      typeState:null,
      timeState:null
    }

    this.previous_state = _.clone(this.state);

    $(window).on("resize", _.bind(this.reloadView(), this));
    _.bindAll(this, "reload")

  },

  reloadView:function() {
    var self = this;
    var doit;
    return function() {
      clearTimeout(doit);
      doit = setTimeout(function() {
        self.reload();
      }, 500);
    }
  },

  forceState:function(args) {
    if (this.state.rootState !== null && this.state.rootState !== "p") {

      if(args.state.rootState) this.state.rootState = args.state.rootState;
      if(args.state.territoryState) this.state.territoryState = args.state.territoryState;
      if(args.state.typeState) this.state.typeState = args.state.typeState;
      if(args.state.timeState) this.state.timeState = args.state.timeState;

      Backbone.trigger("ui:route", {state:this.state});
      this.navigate(this.stateToRoute(this.state));

    }
  },

  go:function(route) {
    // Go to route
    this.navigate(route, {trigger:true});
  },

  reload:function(intro) {
    if (intro) this.intro = false;
    Backbone.history.loadUrl(Backbone.history.fragment);
  },

  stateToRoute:function(args) {
    a = [];
    _.each(args, function(value) {value !== null && a.push(value)});
    return a.join("/");
  },

  buildGo:function(target_state) {

    var self = this;

    var routeBuilders = {
      root:function(args) {
        if (args.state.rootState !== "about") {
          args.state.rootState = args.id;
          args.state.territoryState = null;
          args.state.typeState = null;
          args.state.timeState = null;
        } else {
          args.state = _.clone(args.previous_state);
        }
        return(self.stateToRoute(args.state));
      },
      territory:function(args) {
        args.state.rootState = "t";
        args.state.territoryState = args.id;

        if (args.id === "paris") {
          args.state.typeState = args.state.typeState || "matter";
        } else {
          args.state.typeState = "matter";
        }

        args.state.timeState = args.state.timeState || 1;
        return(self.stateToRoute(args.state));
      },
      type:function(args) {
        args.state.rootState = args.state.rootState || "t";
        args.state.territoryState = args.state.territoryState || "paris";
        args.state.typeState = args.id;
        args.state.timeState = args.state.timeState || 1;
        return(self.stateToRoute(args.state));
      },
      project:function(args) {
        args.state.rootState = "p";
        args.state.territoryState = args.id;
        args.state.typeState = null;
        args.state.timeState = null;
        return(self.stateToRoute(args.state));
      },
      time:function(args) {
        args.state.rootState = args.state.rootState || "t";
        args.state.territoryState = args.state.territoryState || "paris";
        args.state.typeState = args.state.typeState || "matter";
        args.state.timeState = args.state.timeState === "1" ? "2" : "1";
        return(self.stateToRoute(args.state));
      }
    };

    var s = _.clone(this.state);

    // Build the route and update the state
    var route = routeBuilders[target_state.change]( {state:this.state, previous_state:this.previous_state, id:target_state.id} );
    this.previous_state = s;
    
    this.go(route);
  },

  loadView: function(view, args) {

    var self = this;

    // Functions to load the different views of the application
    var view_loaders = {
      start:function(args) {
        var sv = new app.StartView( {model:new app.Start()} );
        app.instance.goto(sv);
        self.state.rootState = "start";
        self.state.territoryState = null;
        self.state.typeState = null;
        self.state.timeState = null;
      },
      about:function(args) {
        var av = new app.AboutView( {model:new app.About()} );
        app.instance.goto(av);
      },
      projects:function(args) {
        var pv = new app.TerritoryView( {model:app.instance.territories.territories.get(projects), time:"1", type:"matter", goto:_.bind(app.instance.goto, app.instance)} )
        self.state.rootState = "p";
        self.state.territoryState = null;
        self.state.typeState = null;
        self.state.timeState = null;
      },
      territory:function(args) {
        app.instance.stopListeningPrevious();
        console.log(app.instance.territories.territories)
        var tv = new app.TerritoryView( {model:app.instance.territories.territories.get(args.id), time:args.time, type:args.type, mt:args.mt, intro:args.intro, goto:_.bind(app.instance.goto, app.instance)} )
        self.state.rootState = "t";
        self.state.territoryState = args.id;
        self.state.typeState = args.type;
        self.state.timeState = args.time;
      },
      project:function(args) {
        app.instance.stopListeningPrevious();
        var tv = new app.TerritoryView( {model:app.instance.territories.territories.get(args.id), time:1, type:"matter", goto:_.bind(app.instance.goto, app.instance)} )
        // TerritoryView( {id:args.id, time:1, type:"matter"} )
      }
    }

    view_loaders[view](args);

    // Broadcast to UI to click/unclick the proper buttons
    Backbone.trigger("ui:route", {state:this.state});

  },

  validateRoute:function(view, args) {

    // Validate territories route parameters
    if (view === "territory") {

      valid_territories = ["paris", "pc", "idf"];
      valid_types = ["matter", "energy", "water"];
      valid_times = ["1","2"];

      return _.indexOf(valid_territories, args.id) !== -1 &&
             _.indexOf(valid_types, args.type) !== -1 &&
             _.indexOf(valid_times, args.time) !== -1;

    // Validate projects route parameters
    } else if (view === "project") {

      valid_projects = ["p1","p2","p3", "p4", "p5", "p6", "p7","p8","p9","p10","p11","p12","p13","p14","p15","p16"];
      return _.indexOf(valid_projects, args.id) !==-1;

    }

  },

  start: function() {
    this.loadView("start");
  },

  about: function() {
    this.loadView("about");
  },

  projects: function() {
    this.loadView("projects");
  },

  territory: function(id, type, time) {
    var args = {id:id, type:type, time:time};
    var p_state = this.previous_state;

    var fired = false;

    console.log(this.intro)

    // Catch a first_pass on Paris for intro
    var intro = false;
    // if (!this.intro && id === "paris" && type === "matter" && time === "1") {
    if (this.previous_state.rootState === "start" || !this.intro) {
      this.intro = true;
      intro = true;
    }

    console.log(intro)
    
    // Catch a time change route
    if (p_state && p_state.rootState !== null) {
      var diff_args = {d_id: args.id === p_state.territoryState,
        d_type: args.type === p_state.typeState,
        d_t: parseInt(args.time) - parseInt(p_state.timeState)};

        if (diff_args.d_id && diff_args.d_type && (Math.abs(diff_args.d_t) === 1)) {

          // Catch a 2012/matter route
          this.state.timeState = args.time;
          var mt = (this.state.timeState === "2" && this.state.typeState === "matter")

          if (mt) {
            Backbone.trigger("stories:go", {id:"last"});
            Backbone.trigger("ui:route", {state:this.state});
            fired = true;
          } else {
            Backbone.trigger("flows:changeYear", {time:args.time, mt:mt});
            Backbone.trigger("ui:route", {state:this.state});
            fired = true;
          }


        }

      }

      if (!fired) {
        var mt = (time === "2" && type === "matter");
        var mod_args = _.extend(args, {mt:mt, intro:intro});
        this.validateRoute("territory", args) && this.loadView("territory", args); // TODO : handle false
        console.log(args)
        this.state.territoryState = id;
        this.state.typeState = type;
        this.state.timeState = time;

        // Backbone.trigger("ui:route", {state:_.clone(this.state)});
      }
  },

  project:function(id) {
    var args = {id:id};
    this.validateRoute("project", args) && this.loadView("project", args); // TODO : handle false
  }

});

