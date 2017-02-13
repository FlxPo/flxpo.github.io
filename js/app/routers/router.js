var app = app || {};

app.Router = Backbone.Router.extend({

  routes: {
    "": "start",
    "about": "about",
    "t/:id/:type/:time": "territory",
    "p" : "projects",
    "p/:category" : "projects",
    "p/:category/:id": "project"
  },

  initialize:function(options) {

    this.listenTo(Backbone, "route:go", this.go);
    this.listenTo(Backbone, "route:forceState", this.forceState);
    this.listenTo(Backbone, "route:buildGo", this.buildGo);
    this.listenTo(Backbone, "categories:clk", this.updateCategoryState);

    this.state = {
      rootState:null,
      categoryState:null,
      territoryState:null,
      typeState:null,
      timeState:null,
      next:null
    }

    this.categoriesData = [
    {"icon": "icon-tous", "color":"#9e9e9", "label": "Tous les projets", "state":"tous_projets"},
    {"icon": "icon-nouveauxmodels", "color":"#b4b3b3", "label": "Nouveaux modèles économiques", "state":"nouveaux_modeles_economiques"},
    {"icon": "icon-eau", "color":"#99d2e9", "label": "Gestion durable de l'eau", "state":"gestion_durable_eau"},
    {"icon": "icon-energies", "color":"#fcea27", "label": "Récupération et valorisation énergétique", "state":"recuperation_valorisation_energetique"},
    {"icon": "icon-matieres", "color":"#cbbc9f", "label": "Réemploi et réutilisation matières", "state": "reemploi_reutilisation_matieres"},
    {"icon": "icon-dechetsverts", "color":"#cbbc9f", "label": "Valorisation biodéchets et agriculture urbaine", "state":"valorisation_biodechets_agriculture_urbaine"},
    {"icon": "icon-chantier", "color":"#9cc876", "label": "Recyclage et valorisation des déchets de chantier", "state": "recyclage_valorisation_dechets_chantier"}
    ];

    var cat_dict = {};
    _.each(this.categoriesData, function(c) {cat_dict[c.state] = []})

    _.each(options.init, function(project) {
      var id = project.id;
      if (["paris", "pc", "projects", "idf"].indexOf(id) == -1) {
        var cat_index = project.category;
        var states = [];
        _.each(cat_index, function(index) {
          states.push(this.categoriesData[index].state);
        }, this)
        _.each(states, function(state) {
          cat_dict[state].push(id)
        });
      }
    }, this)

    this.cat_dict = cat_dict;

    this.previous_state = _.clone(this.state);

    $(window).on("resize", _.bind(this.reloadView(), this));
    _.bindAll(this, "reload");

  },


  reloadView:function() {
    var self = this;
    var doit;
    return function() {
      clearTimeout(doit);
      doit = setTimeout(function() {
        self.reload();
      }, 200);
    }
  },

  forceState:function(args) {
    if (this.state.rootState !== null && this.state.rootState !== "p") {

      if(args.state.rootState) this.state.rootState = args.state.rootState;
      if(args.state.categoryState) this.state.categoryState = null;
      if(args.state.territoryState) this.state.territoryState = args.state.territoryState;
      if(args.state.typeState) this.state.typeState = args.state.typeState;
      if(args.state.timeState) this.state.timeState = args.state.timeState;

      this.state.categoryState = null;

      Backbone.trigger("ui:route", {state:this.state});
      this.navigate(this.stateToRoute(this.state));

    }
  },

  updateCategoryState:function(args) {
    this.state.categoryState = args.state;
    this.navigate(this.stateToRoute(this.state));
  },

  go:function(route) {
    // Go to route
    this.navigate(route, {trigger:true});
  },

  reload:function(intro) {
    if (intro) this.force_intro = true;
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
        args.state.categoryState = null;
        args.state.timeState = args.state.timeState || 1;
        //console.log(args.state)
        return(self.stateToRoute(args.state));
      },
      type:function(args) {
        args.state.rootState = args.state.rootState || "t";
        args.state.territoryState = args.state.territoryState || "paris";
        args.state.categoryState = null;
        args.state.typeState = args.id;
        args.state.timeState = args.state.timeState || 1;
        return(self.stateToRoute(args.state));
      },
      project:function(args) {
        args.state.rootState = "p";
        args.state.territoryState = args.id;

        if (args.next) {

          var c = args.previous_state.categoryState;
          var ts = args.previous_state.territoryState;
          var i = self.cat_dict[c].indexOf(ts);

          if (args.next == 1) {
            if (i == self.cat_dict[c].length -1) {args.state.territoryState = self.cat_dict[c][0];}
            else {args.state.territoryState = self.cat_dict[c][i+1];}
          } else {
            if (i == 0) {args.state.territoryState = self.cat_dict[c][self.cat_dict[c].length-1];}
            else {args.state.territoryState = self.cat_dict[c][i-1];}
          }
        }
        args.state.typeState = null;
        args.state.timeState = null;

        return(self.stateToRoute(args.state));
      },
      time:function(args) {
        args.state.rootState = args.state.rootState || "t";
        args.state.categoryState = null;
        args.state.territoryState = args.state.territoryState || "paris";
        args.state.typeState = args.state.typeState || "matter";
        args.state.timeState = args.state.timeState === "1" ? "2" : "1";
        return(self.stateToRoute(args.state));
      }
    };

    var s = _.clone(this.state);
    this.previous_state = s;

    // Build the route and update the state
    var route = routeBuilders[target_state.change]( {state:this.state, previous_state:this.previous_state, id:target_state.id, next:target_state.next} );

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
        var pv = new app.TerritoryView( {model:app.instance.territories.territories.get(projects), time:"1", type:"matter", goto:_.bind(app.instance.goto, app.instance), focus_on_project: self.state.territoryState, categoryState:self.state.categoryState} )
        self.state.rootState = "p";
        self.state.categoryState = args.categoryState;
        self.state.territoryState = null;
        self.state.typeState = null;
        self.state.timeState = null;
      },
      territory:function(args) {
        app.instance.stopListeningPrevious();
        var tv = new app.TerritoryView( {model:app.instance.territories.territories.get(args.id), time:args.time, type:args.type, mt:args.mt, intro:args.intro, goto:_.bind(app.instance.goto, app.instance)} )
        self.state.rootState = "t";
        self.state.territoryState = args.id;
        self.state.typeState = args.type;
        self.state.timeState = args.time;
        self.state.categoryState = null;
        //console.log(self.state)
      },
      project:function(args) {
        app.instance.stopListeningPrevious();
        var tv = new app.TerritoryView( {model:app.instance.territories.territories.get(args.id), time:1, type:"matter", goto:_.bind(app.instance.goto, app.instance)} )
        self.state.rootState = "p";
        self.state.categoryState = args.categoryState;
        self.state.territoryState = args.id;
        self.state.typeState = null;
        self.state.timeState = null;
      }
    }

    view_loaders[view](args);

    // Broadcast to UI to click/unclick the proper buttons
    Backbone.trigger("ui:route", {state:this.state});

  },

  validateRoute:function(view, args) {

    // Validate territories route parameters
    if (view === "territory") {

      var valid_territories = ["paris", "pc", "idf"];
      var valid_types = ["matter", "energy", "water"];
      var valid_times = ["1","2"];

      return _.indexOf(valid_territories, args.id) !== -1 &&
      _.indexOf(valid_types, args.type) !== -1 &&
      _.indexOf(valid_times, args.time) !== -1;

    // Validate projects route parameters
  } else if (view === "project") {

    var max_id = 55;
    var ids = [];
    var hidden_projects = [0, 7, 9, 11, 14]

    for (var i = 0; i<max_id; i++) {
      if (_.indexOf(hidden_projects, i) == -1) {
        ids.push(i);        
      }
    }

    var valid_ids = ids.map(function(id) {return "p"+id})

    this.project_ids = valid_ids;
    // this.project_ids.splice(14, 1);
    // this.project_ids.splice(0, 1);

    // if (args.id == "p14") return false;

    console.log(valid_ids)

    return _.indexOf(valid_ids, args.id) !== -1;

  }

},

start: function() {
  this.loadView("start");
},

about: function() {
  this.loadView("about");
},

projects: function(category) {
  //console.log(category)
  if (category === null) {category = "tous_projets"}
  args = {categoryState:category}
  this.loadView("projects", args);
},

category:function(category) {

},

territory: function(id, type, time) {

  var args = {id:id, type:type, time:time};
  var p_state = this.previous_state;

  //console.log(args)

  var fired = false;

    // Catch a first_pass on Paris for intro
    var intro = false;
    // if (!this.intro && id === "paris" && type === "matter" && time === "1") {
      if (this.previous_state.rootState === "start" || this.force_intro) {
        this.intro = true;
        this.force_intro = false;
        intro = true;
      }

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
        this.state.territoryState = id;
        this.state.typeState = type;
        this.state.timeState = time;

        // Backbone.trigger("ui:route", {state:_.clone(this.state)});
      }
    },

    project:function(category, id) {
      var args = {categoryState:category, id:id};
      if (this.validateRoute("project", args)) {
        this.loadView("project", args);
      } else {
        //console.log("go")
        this.go("#p/tous_projets");
      }
    }

  });

