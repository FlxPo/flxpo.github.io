var app = app || {};

app.FlowCollection = Backbone.Collection.extend({
  model: app.Flow
});
var app = app || {};

app.Circle = Backbone.Model.extend({

  initialize:function(options) {
  	var alfa = Math.random()*2*Math.PI;
  	var rad = Math.floor(25 + Math.random()*40)/2;
  	var center = Math.floor(175+ rad*(1.5*Math.random() - 1));
  	var sw = Math.floor(5 + 20*Math.random());
  	var x = Math.floor(options.cx + center * Math.cos(alfa));
  	var y = Math.floor(options.cy + center * Math.sin(alfa));
  	var op = Math.floor((0.4 + Math.random()/3)*100)/100;
  	var h = 0.36 + 0.2*Math.random()
  	var col =  Raphael.hsl(h, 1, 0.4);

  	this.set({  
  				x:x,
  				y:y,
  				rad:rad,
  				col:col,
  				op:op,
  				sw:sw,
  			});
  }

});
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

    // Level
    this.set("level", parseInt(this.get("level")));

  }

});
var app = app || {};

app.FlowTip = Backbone.Model.extend({

  defaults: {
    flowLabel:  "Name of the flow",
    flowVolume: "X unit",
    children: 	true,
    parent:     true
  }

});
var app = app || {};

app.Item = Backbone.Model.extend({

	defaults:function() {
		return {
			input:[],
			extraction:[],
			recycling:[],
			waste:[],
			output:[]
		}
	}

});
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
  if (category === null) {category = "tous_projets"}
    args = {categoryState:category}
  this.loadView("projects", args);
},

category:function(category) {

},

territory: function(id, type, time) {

  var args = {id:id, type:type, time:time};
  var p_state = this.previous_state;

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
      }
    },

    project:function(category, id) {
      var args = {categoryState:category, id:id};
      if (this.validateRoute("project", args)) {
        this.loadView("project", args);
      } else {
        this.go("#p/tous_projets");
      }
    }

  });


var app = app || {};

app.Stacks = function() {

	// To store all stacks
	this.list = [];

	// To compute the flowtipview positions
	this.unmessify = function(flows) {

		var list = this.list, len = list.length;
		while(len--) {
			var stack = list[len];
			if (stack.dirty) {
				stack.unmessify();
			}
		}

	}

	this.dirtify = function() {

		var list = this.list, len = list.length;
		while(len--) {
			var stack = list[len];
			stack.dirty = true;
		}


	}
}

app.Stack = function(stack) {

	// Standard/extraction/waste/recycling flows
	this.type = stack.type;

	// Territories linked by the flow
	this.t1 = stack.t1;
	this.t2 = stack.t2;

	// Collection of flows
	this.flows = [];

	// To add a flow to the stack
	this.addToStack = function(flow) {
		this.flows.push(flow);
		this.dirty = true;
	}

	this.dirty = true;

}

app.Stack.prototype.unmessify = function() {

	this.dirty = false;
		
		var a_inflows = this.flows;

		// var t = 0;
		var steps = 10;
		while (steps--) {

			// t++;

			// setTimeout(function() {

		// For each flow label
		var i = a_inflows.length;
		while(i-- && !a_inflows[i].flowtipview.pos.is_zero) {

			function checkBounds(flow, position, width) {
				var check = false;
				var xfrom = flow.xfrom, xto = flow.xto, yfrom = flow.yfrom, yto = flow.yto;
				var type = flow.model.get("type");
				if ( type === "input" || type === "output" ) {
					if ( (position.x - 0.75*width > xfrom) && (position.x + 0.75*width < xto) ) { check = true; }
				} else if ( type === "waste" ) {
					if ( (position.x - width/2 > xfrom) && (position.y < yto) ) { check = true; }
				} else if ( type === "extraction" ) {
					if ( (position.x - width/2 < xto) && (position.y < yfrom) ) { check = true; }
				} else {
					if ( (position.x - width/2 < xfrom) && (position.x - width/2 > xto) ) { check = true; }
				}
				return check;
			}

			var f1 = a_inflows[i].flowtipview.pos;
			var DX = 0, DY = 0, s = 0;
			var mid = a_inflows[i].mid;

			//---------------------------------------------------------
			// Look for overlap with other flow labels
			var j = a_inflows.length;
			while(j--) {
				//-----------------------------------------------------
				if (i !== j && !a_inflows[j].flowtipview.pos.is_zero) {
					var f2 = a_inflows[j].flowtipview.pos;
					// Test overlap
					var dx = (f1.w+f2.w + 25)/2 - Math.abs(f1.x - f2.x);
					var dy = (f1.h+f2.h + 50)/2 - Math.abs(f1.y - f2.y);
					
					var overlap = (dx > 0 && dy > 0);
					// Add dx, dy to displacement vector
					if (overlap) {
						var dirx = Math.sign(f1.x - f2.x);
						var diry = Math.sign(f1.y - f2.y);
						s = 2
						DX = DX + dirx * dx/s;
						DY = DY + diry * dy/s;
					}
				}//-----------------------------------------------------
			} //--------------------------------------------------------
		
			var k = a_inflows[i].flowtipview.pos.anchor;

			if (DX !== 0 || DY !== 0) {

			// Resulting unconstrained position
			var X = a_inflows[i].flowtipview.pos.x + DX/s;
			var Y = a_inflows[i].flowtipview.pos.y + DY/s;

			// Look for the nearest flow pulsePath anchor
			var dir = 0;
			var type = a_inflows[i].model.get("type");
			if (type === "input" || type === "output") {
				dir = Math.sign(DX);
			} else if (type) {
				dir = -Math.sign(DX);
			}

			var d1 = 2000;
			var d2 = 1000;

			while (d2 < d1 && checkBounds(a_inflows[i], {x:a_inflows[i].pulsePath[k].x, y:a_inflows[i].pulsePath[k].x}, a_inflows[i].flowtipview.pos.w) ) {
				k = k + dir;
				d1 = d2;
				var dpx = X - a_inflows[i].pulsePath[k].x;
				var dpy = Y - a_inflows[i].pulsePath[k].y;
				d2 = Math.sqrt(dpx*dpx + dpy*dpy);
			}

			a_inflows[i].flowtipview.pos.anchor = k;
			a_inflows[i].flowtipview.pos.x = a_inflows[i].pulsePath[k].x - a_inflows[i].flowtipview.pos.hc;
			a_inflows[i].flowtipview.pos.y = a_inflows[i].pulsePath[k].y - a_inflows[i].flowtipview.pos.hc;

			mid = k;

			}

			// Store results when last step is reached and update positioning
			if (steps === 0) {

				a_inflows[i].mid = mid;

				a_inflows[i].flowtipview.$el.css({top:a_inflows[i].pulsePath[k].y - a_inflows[i].flowtipview.pos.hc, left:a_inflows[i].pulsePath[k].x - a_inflows[i].flowtipview.pos.hc});
				// a_inflows[i].flowtipview.trend.css({top:a_inflows[i].pulsePath[k].y - a_inflows[i].flowtipview.pos.hc, left:a_inflows[i].pulsePath[k].x + a_inflows[i].flowtipview.pos.hc});

				a_inflows[i].midX = a_inflows[i].flowtipview.pos.x;
				a_inflows[i].midY = a_inflows[i].flowtipview.pos.y;
			}

		}

		// },t*1000); 

		}
	}
var utils = (function() {

  function getWindowSize() {
    var width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) -10;
    return {w:width, h:height};
  }

  function darkenColor(color, ratio) {
    var col_rgb = Raphael.getRGB(color);
    var col_hsl = Raphael.rgb2hsl(col_rgb.r, col_rgb.g, col_rgb.b);
    var col = Raphael.hsl(col_hsl.h, Math.min(col_hsl.s*0.9, 0.8), ratio);
    return col;
  }

  function formatVolume(n, sep) {

    // Parse
    if (typeof n == 'string' || n instanceof String) {
      n = parseInt(n.replace(/\s+/g, ''));
    }

    // Round
    var round = n;
    if (round > 99) { round = Math.round(n/10)*10; }

    // Separate thousands
    var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})'),
    sValue = round + '';
    if(sep === undefined)
    {
      sep = ',';
    }
    while(sRegExp.test(sValue))
    {
      sValue = sValue.replace(sRegExp, '$1' + sep + '$2');
    }
    return sValue;

  }

  function constrainNumber(number, min, max) {
    if (number > max) {return max;}
    else if (number < min) {return min;}
    else {return number;}
  }

  function mergeSort(arr, compareFn) {
    if (arr == null) {
      return [];
    } else if (arr.length < 2) {
      return arr;
    }

    if (compareFn == null) {
      compareFn = defaultCompare;
    }

    var mid, left, right;

    mid   = ~~(arr.length / 2);
    left  = mergeSort( arr.slice(0, mid), compareFn );
    right = mergeSort( arr.slice(mid, arr.length), compareFn );

    return merge(left, right, compareFn);
  }

  function defaultCompare(a, b) {
    return a < b ? -1 : (a > b? 1 : 0);
  }

  function merge(left, right, compareFn) {
    var result = [];

    while (left.length && right.length) {
      if (compareFn(left[0], right[0]) <= 0) {
        result.push(left.shift());
      } else {
        result.push(right.shift());
      }
    }

    if (left.length) {
      result.push.apply(result, left);
    }

    if (right.length) {
      result.push.apply(result, right);
    }

    return result;
  }

  function formatString(s) {
    return s.toLowerCase()
            .replace(/[èéêë]/g, "e")
            .replace(/[ç]/g, "c")
            .replace(/[àâä]/g, "a")
            .replace(/[ïî]/g, "i")
            .replace(/[ûùü]/g, "u")
            .replace(/[ôöó]/g, "o");
  }

  function debounce(func, interval) {
    var lastCall = -1;
    return function() {
        clearTimeout(lastCall);
        var args = arguments;
        var self = this;
        lastCall = setTimeout(function() {
            func.apply(self, args);
        }, interval);
    };
  }

  return {getWindowSize:getWindowSize,
          darkenColor:darkenColor,
          formatVolume:formatVolume,
          constrainNumber:constrainNumber,
          mergeSort:mergeSort,
          formatString:formatString,
          debounce:debounce}

})()


  Math.sign = Math.sign || function sign(x) {
    if(isNaN(x)) {
      return NaN;
    } else if(x === 0) {
      return x;
    } else {
      return (x > 0 ? 1 : -1);
    }
  }
var app = app || {};

app.AboutView = Backbone.View.extend({

	id:"about",

	template: _.template('\
		<div id = "info_back"></div>\
  		<div>\
			<div id = "info_content">\
				<ul id = "info_header">\
        			<li><h2>Informations sur cette visualisation</h2></li>\
        			<li id = "launch"><p>Intro</p></li>\
        			<li id = "demo"><p>Démo</p></li>\
      			</ul>\
      			<ul id = "info_main">\
      				<li>Les données sur les flux d’énergies et d’eaux sont celles de la Ville de Paris.</li>\
      				<br>\
      				<li>La nomenclature des flux et les données utilisées pour cette infographie sont adaptées du rapport de Sabine Barles, professeure d’urbanisme à l’université Paris 1 Panthéon-Sorbonne (UMR Géographie-Cités) : <a href = "data/pdf/Barles-EI-Paris.pdf" target = "_blank">« Mesurer la performance écologique des villes et des territoires : le métabolisme de Paris et de l’Île-de-France »</a></li>\
      				<br>\
      				<li>Les tendances relatives à l’évolution des flux de matières ont été évaluées avec l’aide de Laurent Georgeault doctorant de l’université Paris 1 et chargé de mission à l’Institut de l’économie circulaire.</li>\
    			</ul>\
    			<p>Pour plus d’information, voir aussi :</p>\
    			<ul>\
      				<li class = "refs">BARLES, S. <a href = "http://www.developpementdurable.revues.org/10090" target = "_blank">« L’écologie territoriale et les enjeux de la dématérialisation des sociétés : l’apport de l’analyse des flux de matières »</a>, Développement durable des territoires 5(1), 2014.</li>\
      				<br>\
      				<li class = "refs">REPELLIN, P., DURET, B., BARLES, S. <a href = "http://www.statistiques.developpement-durable.gouv.fr/publications/p/2101/1161/comptabilite-flux-matieres-regions-departements-guide.html" target = "_blank">Comptabilité des flux de matières dans les régions et les départements.</a> Guide méthodologique. La Défense : Ministère de l’Écologie, du Développement durable et de l’Énergie – CGDD (coll. « Repères »), 2014.</li>\
    			</ul>\
    			<ul id = "credits">\
      				<li>\
        				<h3>Maîtrise d’ouvrage :</h3>\
        				<p>Agence d’écologie urbaine – Mairie de Paris<br>(contact : <a href ="mailto:economie.circulaire@paris.fr">economie.circulaire@paris.fr</a>)<br></p>\
        				<a href ="http://www.paris.fr/" target = "_blank"><img src = "./data/graphics/logo-mdp.gif"/></a>\
      				</li>\
      				<li>\
        				<h3>Conception :</h3>\
        				<p>Elioth<br>(contact : <a href ="mailto:elioth@elioth.fr">elioth@elioth.fr</a>)</p><a href ="http://elioth.com/" target = "_blank"><img src = "./data/graphics/logo-elioth.png"/></a>\
      				</li>\
      			</ul>\
  			</div>\
 		</div>\
	'),

	events: {
		"click #launch": "intro",
		"click #demo": "demo",
		"mouseover #info_content": "addCircle"
	},

	initialize:function() {
		$("body").addClass("scrollable");

		// To store the circles
		var ViewsCollection = Backbone.Collection.extend( {model:app.CircleView} );
		this.views_collection = new ViewsCollection();
	},

	render: function(options) {

		this.$el.html( this.template() );
		this.$el.addClass("middle");

		this.renderRaphael();

		return this;
	},

	renderRaphael:function() {
		var r_div = this.$el.find("#info_back");
		var ws = utils.getWindowSize(), w = ws.w, h = ws.h;
		var r = Raphael(r_div[0], w, h);
		this.paper = r;

		this.xleft = 0.15*w;
		this.xright = 0.85*w;
		this.h = h;

		// Adds a circle randomly
		var t1 = Math.floor(500+Math.random()*500);
		var t2 = Math.floor(250+Math.random()*500);
		var self = this;
		this.clockAddCircle = setInterval(function() {self.addCircle();}, t1);
		this.clockKillCircle = setInterval(function() {self.killCircle();}, t2);
	},

	addCircle:function() {
		if (this.views_collection.models.length < 12) {
			var x = Math.random() > 0.5 ? this.xleft : this.xright;
			var c = new app.Circle( {cx:x, cy:this.h*(Math.random()*0.75+0.1)} );
			var cv = this.views_collection.add( {model:c, paper:this.paper, circles:this.circles} );
			cv.render();
		}
	},

	killCircle:function() {
		if (this.views_collection.models.length > 0) {
			var n = Math.floor(this.views_collection.models.length*Math.random());
			var c = this.views_collection.at(n).close();
			this.views_collection.remove(c);
		}
	},

	// Removes all elements of the view
	close:function() {

		this.stopListening();

		clearInterval(this.clockAddCircle);
		clearInterval(this.clockKillCircle);

		_.each(this.views_collection.models, function(circle) {
			circle.close();
			circle.remove();
		})

		this.paper.remove();

		this.remove();
	},

	transitionIn:function(options) {

		var self = this;
		// var callback = function() {$("#appcontainer").addClass("scrollable"); self.$el.addClass("scrollable"); };

		this.$el.velocity( "fadeIn", {duration:300, complete:callback} );
	},

	transitionOut:function(options) {
		
		var callback = function() {};
		if (options.callback) {
			calbback = _.bind(this[options.callback], this)
		}

		this.$el.velocity( "fadeOut", {duration:300, complete:callback} );
	},

	// Interaction functions
	intro:function() {
		app.instance.ui.unloadAbout();
		var r = app.instance.router;
		if (r.state.rootState != "t") {
			app.instance.router.force_intro = true;
			app.instance.router.go("t/paris/matter/1");
		} else {
			app.instance.router.reload(true);
		}
	},

	demo:function() {
		Backbone.trigger("ui:demo");
	}

});

var app = app || {};

app.AppView = Backbone.View.extend({

	el: "#appcontainer",

  initialize:function() {

    
    this.startZoom = 0;

    var self = this;
    // Load init resource data
    $.ajax({

      url:"data/init.json",
      data: { get_param: 'value' },
      dataType: 'json',

      success:function(data) {
        // Loads UI
        self.ui = new app.UIView(self, {init:data.ui});
        // Loads territories
        self.territories = new app.TerritoriesView({init:data.navigation});
        // Loads router
        self.router = new app.Router({init:data.navigation});
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
        }, 400);
      } else {
        _.delay(function() {
          next.transitionIn( {dz:dz});
        }, 400);
      }

      // Load/unload ui elements
      var d = previous === null ? 200 : 800;
      this.ui.showButtons(next, 800);

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
var app = app || {};

app.ButtonView = Backbone.View.extend({

	events : {
		"click":"clk",
		"mouseover":"over",
		"mouseout":"out"
	},

	initialize:function() {

		var m = this.model.toJSON();

		// Type of button (bang/toggle)
		this.bang = m.bang;
		this.grey = m.grey;
		this.clicked = false;
		this.radio = m.radio ? true : false;

		// Color of the button
		this.$el.css( {"background-color":m["bg-col-n"]} );

		// Geometry of the button if existing
		if (m.geometry) {
			var w = this.$el.width(), h = this.$el.height();
			var r = Raphael(this.el, w, h);
			var b = r.add( m.geometry );
			var scale = Math.min(w/m.width, w/m.height)*m.scale;
			b.transform(["...T", w/2 - m.width/2, w/2 - m.height/2])
			b.transform(["...S", scale, scale, w/2, w/2])
			this.grey && this.storeGreys(b);
		}

	},

	close:function() {

	},

	clk:function(options) {

		// Change color if toggle button
		if (!this.bang) {

			// Store the state of the button
			this.clicked = true;

			// Change the style
			this.$el.css( {"background-color":this.model.get("bg-col-a")} );
			this.$el.addClass("button-clicked");

			// Recolor if needed
			if (this.grey) {
				var len = this.items.length;
				while(len--) {
					this.items[len].attr({"fill":this.e_colors[len]});
					this.items[len].attr({"stroke":this.strokes[len]});
				}
			}

			// Broadcast a click event for the master UI view, to "unclick" other buttons
			this.radio && Backbone.trigger("ui:clickRadio", {id:this.model.get("id")});
		}

		// Trigger the event attached to the button
		(!options.silent && this.model.get("change")) && Backbone.trigger("route:buildGo", {change:this.model.get("change"), id:this.model.get("id"), next:this.model.get("next")});

	},

	unclick:function() {

		// Store the state
		this.clicked = false;

		// Change the style
		this.$el.css( {"background-color":this.model.get("bg-col-n")} );
		this.$el.removeClass("button-clicked");

		// Recolor if needed
		if (this.grey) {
			var len = this.items.length;
			while(len--) {
				this.items[len].attr({"fill":this.grey_colors[len]});
				this.items[len].attr({"stroke":this.grey_strokes[len]});
			}
		}

	},

	over:function() {
		this.$el.css( {"background-color":this.model.get("bg-col-a")} );
	},

	out:function() {
		!this.clicked && this.$el.css( {"background-color":this.model.get("bg-col-n")} );
	},

	storeGreys:function(b) {

		function desaturateColor(color, ratio) {
			var col_rgb = Raphael.getRGB(color);
			var col_hsl = Raphael.rgb2hsl(col_rgb.r, col_rgb.g, col_rgb.b);
			var col = Raphael.hsl(col_hsl.h, col_hsl.s*ratio, col_hsl.l);
			return col;
		}

		this.items = b.items;

		var e_colors = [], grey_colors = [], strokes = [], grey_strokes = [], items = b.items, len = items.length;
		for(var i = 0; i < len; i++) {

			var color = items[i].attr("fill");
			var stroke = items[i].attr("stroke");

			e_colors.push(color);
			strokes.push(stroke);

			grey_colors.push(desaturateColor(color, 0));
			grey_strokes.push(desaturateColor(stroke, 0));

			items[i].attr({"fill":desaturateColor(color, 0)});
			items[i].attr({"stroke":desaturateColor(stroke, 0)});
		}

		this.e_colors = e_colors;
		this.strokes = strokes;

		this.grey_colors = grey_colors;
		this.grey_strokes = grey_strokes;
	}

});
var app = app || {};

app.CategoryView = Backbone.View.extend({

	tagName:"li",
	className: "categorybutton",

	events:{
		"mouseenter":"over",
		"mouseleave":"out",
		"click":"clk"
	},

	template: _.template( '<span></span>' ),

	initialize:function(options) {
		if (options.clicked) {
			 this.over();
			 this.clk({silent:true});
		}
	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			return this;
	},

	cacheComponents:function() {
		// this.$logocontainer = this.$el.find(".logocontainer");
		// this.$logo = this.$el.find(".logocontainer");
		return this;
	},

	renderContent:function() {
		var self = this;
		this.$el.html( this.template(this.model.attributes) );
		this.$el.css({"border-bottom-color": this.model["color"]});
		this.$el.find("span").addClass(self.model["icon"]);
		return this;
	},

	over:function() {
		this.$el.addClass("category-over");
		Backbone.trigger("categories:focus", {label:this.model["label"]});
	},

	out:function() {
		!this.clicked && this.$el.removeClass("category-over");
		Backbone.trigger("categories:unfocus");
	},

	clk:function(options) {
		this.clicked = true;
		Backbone.trigger("categories:clk", {id:this.id, label:this.model["label"],  state: this.model["state"], options:options});
	},

	unclk:function() {
		this.clicked = false;
		this.$el.removeClass("category-over");
	},

	close:function() {
		this.stopListening();
	}

});
var app = app || {};

app.CircleView = Backbone.View.extend({

	template: _.template( '<div class = "pulse"></div></div>' ),

	initialize:function(options) {
		this.paper = options.paper;
	},

	cacheComponents:function() {
		this.$pulse = this.$el.find(".pulse");
		return this;
	},

	// Render functions
	render: function(options) {

		// this.$el.html( this.template() );
		// this.cacheComponents();

		// Load the attributes of the circle and append the circle to the canvas
		var m = this.model.toJSON();
		var path = this.paper.path();
		path.attr({path:["M", m.x, m.y-m.rad, "A", m.rad, m.rad, 0,1,1,m.x-0.1, m.y-m.rad, "Z"], stroke:m.col, 'stroke-width':m.sw, opacity:m.op});
		path.toBack();
		this.path = path;
		this.transitionIn();

		// var pupath = this.paper.path();
		// pupath.attr({path:["M", m.x, m.y-4*m.rad, "A", 4*m.rad, 4*m.rad, 0,1,1,m.x-0.1, m.y-4*m.rad, "Z"]}).hide();
		// this.pupath = pupath;

		// this.renderPulse();

	},

	transitionIn:function() {
		var m = this.model.toJSON();
		this.path.animate({transform:["s",4,4, m.x, m.y], 'stroke-width': m.sw}, 400 + Math.round(Math.random()*400), "elastic");
	},

	transitionOut:function() {

	},

	close:function() {

		var closeOnComplete = function() {
			this.path.remove();
			this.stopListening();
		}

		var m = this.model.toJSON();
		var t = 500 + Math.floor(Math.random()*500);
		this.path.animate( {transform:["s",0.5,0.5, m.x, m.y]}, t, "ease-in", _.bind(closeOnComplete, this));
	
		return this;


	},

	renderPulse: function() {

		// TO DO : path to points function
		var path = this.pupath,
			pupath = [],
			step = 10,
			len = path.getTotalLength(),
			l = 0;

		while(l < path.getTotalLength()) {
			var pos = path.getPointAtLength(l);
			pupath.push( {x:pos.x, y:pos.y} );
			l += step;
		}

		this.pulsePath = pupath;
		this.pupath.remove();
		//////

		var d = this.model.get("sw");
		offset = -Math.round(d/2);
		this.$pulse.css( {width:d,
							height:d,
							"margin-top":offset,
							"margin-left":offset,
							"background-color":"#fff",
							opacity:0.2
						} );

		function restart() {
			$.Velocity.RunSequence(seq);
		}

		function sequenceGenerator(args) {

			var el = args.element
			var path = args.path;
			var seq = [];
			var incr = args.increment;
			var n = path.length;
			var dt = args.duration/n*incr;

			for (var i = 0; i < n; i+=incr) {

				var t = Math.round(path[i].y*10)/10;
				var l = Math.round(path[i].x*10)/10;
				var o = { duration:dt, easing:"linear" };

				if (i === 0) {
					o = { duration:0, easing:"linear" };
				} else if (i > n - incr - 1) {
					o = { duration:dt, easing:"linear", complete:args.complete };
				}

				var step = {elements:el, properties:{ top:t,left:l }, options:o };
				seq.push(step);
			}

			return seq;
		}

		if (this.pulsing) {
			this.$pulse.velocity( "stop", true )
		}

		var seq = sequenceGenerator( {element:this.$pulse, path:pupath, duration:pupath.length*40, increment:5, complete:restart} );
		$.Velocity.RunSequence(seq);

		this.pulsing = true;

		return this;
	}

});

var app = app || {};

app.DemoView = Backbone.View.extend({

	id:"video_container",

	template: _.template('\
		<div id="close_demo">\
    		<span>X</span>\
  		</div>\
  		<div class="wrapper hidden">\
    		<video controls id="offline_video">\
      			<source src="data/video/demo.mp4"></source>\
   			</video>\
  		</div>\
  		<iframe id = "video"\
          class = ""\
          src="//www.youtube.com/embed/35oqKJgJbaE"\
          frameborder="0"\
          allowfullscreen>\
  		</iframe>\
	'),

	events: {
		"click #close_demo": "UIclose"
	},

	initialize:function() {
	},

	render: function(options) {
		this.$el.html( this.template() );
		this.$el.addClass("middle");
		return this;
	},

	// Removes all elements of the view
	close:function() {
		this.stopListening();
	},

	UIclose:function() {
		Backbone.trigger("ui:closeDemo");
	}

});

var app = app || {};

app.FlowView = Backbone.View.extend({

	className:"flow",

	template: _.template( '<div class = "pulse"></div></div>' ),

	initialize: function(options) {

		_.bindAll(this, "close");

		// Storing the origin and destination items
		this.ito = options.ito;
		this.ifrom = options.ifrom;
		this.parent = options.parent;

		this.$popcontainer = this.parent.$popcontainer;
		this.$flowcontainer = this.parent.$flowcontainer;

		// Create the tip
		this.flowtip = new app.FlowTip();
	    this.flowtipview = new app.FlowTipView( {model:this.flowtip, parent:this} );

	    this.rendered = false;
  	},

	cacheComponents:function() {
		this.$pulse = this.$el.find(".pulse");
		return this;
	},

	close:function() {
		this.$pulse.velocity("stop", true);
		this.flowtipview.close();
		this.flowtipview.remove();

		// Stack removal
		this.stack.flows = _.filter(this.stack.flows, function(flow) {
			return (flow.id !== this.id)
		}, this);

		var self = this;
		this.path.animate( {"stroke-width":0}, 200, self.path.remove )

		this.stopListening();
	},

	render:function(args) {

	    this.renderContent()
	    	.cacheComponents()
	    	.renderPath()
	    	.animatePath(args.animate)
	    	.renderPulse()
	    	.findRealMid()
	    	.renderFlowTip(args.year, args.mt)

	    return this;
	},

	updateRender:function(args) {

		this.renderPath()
			.animatePath(args.animate)
			.renderPulse()
			.findRealMid()
			.renderFlowTip(args.year, args.mt);

		return this;
	},

	renderContent:function() {
  		this.$el.html( this.template() );
  		var w = $(window).width(), h = $(window).height()
	    this.paper = Raphael(this.$el[0], w, h);
  		return this;
  	},

	renderPath: function() {

		var type = this.model.get("type");

		// Store items
		var ifrom = this.ifrom,
			ito = this.ito;

		// Get items positions
		var xf = ifrom.fax,
			yf = ifrom.fay,
			xt = ito.fax,
			yt = ito.fay;

		// Get items dimensions
		var wf = ifrom.w || 0,
			hf = ifrom.h || 0,
			wt = ito.w || 0,
			ht = ito.h || 0;

		// Get offset
		var offsetto = this.model.get("offsetto") || 0;
		var offsetfrom = this.model.get("offsetfrom") || 0;
		var offsetextr = this.model.get("offsetextr") || 0;
		var offsetwast = this.model.get("offsetwast") || 0;

		// Get origin and destination coordinates
		var xfrom = xf + wf/2;
			yfrom = yf + offsetfrom,
			xto = xt - wt/2,
			yto = yt + offsetto;

		this.xfrom = xfrom;
		this.xto = xto;
		this.yfrom = yfrom;
		this.yto = yto;

		// Get necessary bending of the bezier curves to keep them from overlapping
		var dxfrom = Math.abs(xto - xfrom)/2 + Math.sign(yf - yt)*offsetfrom;	// Origin bezier x offset (to approximate parallel paths when origin = destination)
		var dxto = Math.abs(xto - xfrom)/2 - Math.sign(yf - yt)*offsetto;		// Destination bezier x offset

		// Get distance metrics between the origin and destination
		var deltaX = Math.abs(xto - xfrom);
		var deltaY = Math.abs(yto - yfrom);
		var midX = (xfrom + xto)/2;
		var midY = (yfrom + yto)/2;

		this.midX = midX;
		this.midY = midY;

		// Build the path
		var flowpath = [];

		// Exit origin
		if (type === "extraction") {
			flowpath.push(['M', xf - ifrom.w*0.15 + offsetextr, yf]);
		} else {
			flowpath.push(['M', xf, yfrom]);
			flowpath.push(['L', xfrom, yfrom]);
		}

		// Bend the curve
		if (type === "input" || type === "output") {

			// If the origin is on the left of the destination
			if (xfrom < xto*0.9) {

				var cp1 = { x:xfrom + dxfrom, y:yfrom },
				cp2 = { x:xto - dxto, y:yto };

				var p = ["C", cp1.x, cp1.y,
				cp2.x, cp2.y,
				xto, yto];

				flowpath.push(p);

			} else {

				var corry = 0 
				var flat_mid = 0
				if (xto < xfrom) {
					corry = (deltaX + deltaY)/6;
					flat_mid = 1;
				}

				var cp1 = { x:xfrom + (deltaX + deltaY)/wf*30, y:yfrom };
				var cp2 = { x:midX + deltaX/2, y:midY + deltaY/2 + corry };
				var mp = { x:midX, y:midY + flat_mid*deltaY/2 + corry};
				var cp3 = { x:midX - deltaX/2, y:midY + deltaY/2 + corry};
				var cp4 = { x:xto - (deltaX + deltaY)/wf*30, y:yto };

				var pA = ["C", cp1.x, cp1.y,
					cp2.x, cp2.y,
					mp.x, mp.y];

				var pB = ["C", cp3.x, cp3.y,
					cp4.x, cp4.y,
					xto, yto];

				flowpath.push(pA, pB);

			}

		} else if (type === "recyclage") {

			this.offsetrecy = -this.model.get("offsetrecy");

			var cpd1 = wf/4 + this.offsetrecy * 2 + 100;
			cpd1 = cpd1 > 100 ? 100 + 3*this.offsetrecy : cpd1 - this.offsetrecy;
			var cpd2 = + wf/2 + this.offsetrecy * 5 +100;
			cpd2 = cpd2 > 300 ? 300 + 3*this.offsetrecy : cpd2 - this.offsetrecy;

			flowpath.push(['C', xfrom + cpd1, yfrom,
				xf + cpd2, yf + hf/1 + this.offsetrecy * 1.25,
				xf, yf + hf/1 + this.offsetrecy * 1.25]);

			flowpath.push(['C', xf - cpd2, yf + hf/1 + this.offsetrecy * 1.25,
				xto - cpd1, yto,
				xto, yto]);

		} else if (type === "extraction") {

			var off = this.model.get("offsetextr");

			flowpath.push(['C', xf + off, yf - hf*1.5 - off*4,
								xto - wf/4 - off *4, yto,
								xto, yto]);

		} else {

			var off = this.model.get("offsetwast");

			flowpath.push(['C', xfrom + (hf+wf)/4 + off *4, yfrom,
								xf + ifrom.w*0.15, yto - (hf+wf)/2 - off*5,
								xf + ifrom.w*0.15 - off, yto]);


		}

		// Enter destination
		flowpath.push(['L', xt, yto]);

		var geometry = _.extend( this.model.attributes.geometry, {"path":flowpath, "stroke":this.model.get("n_color")} );
		var g = [];
		g.push(geometry);

		this.flowpath = this.paper.path(flowpath).hide();
		if (!this.path) { this.path = this.paper.add(g).items[0]; }

		return this;
	},


	findRealMid:function() {

	// Find the real midpoint for inputs and outputs
	if (this.model.get("type") === "input" || this.model.get("type") === "output") {
		var target_x = (this.xfrom + this.xto)/2;
		var target_y = this.midY;

		var k = Math.floor(this.pulsePath.length/3);
		var d1 = 2000;
		var d2 = 1000;
		
		while (d2 < d1) {
			k++;
			d1 = d2;
			var dpx = target_x - this.pulsePath[k].x;
			var dpy = target_y - this.pulsePath[k].y;
			d2 = Math.sqrt(dpx*dpx + dpy*dpy);
		}

		this.mid = k;
		this.midX = this.pulsePath[k].x;
		this.midY = this.pulsePath[k].y;

	} else {

		this.mid = Math.floor(this.pulsePath.length/2);
		this.midX = this.pulsePath[this.mid].x;
		this.midY = this.pulsePath[this.mid].y;

	}

	return this;

	},

	animatePath:function(animate, callback) {
		var sw = this.model.get("volume");
		if (animate === "appear") {
			this.path.attr({'stroke-width':0});
			this.path.animate({'stroke-width':sw}, 500, "backOut");
		} else {
			this.path.animate( {path:this.flowpath.attr("path")}, 200 );
			this.path.animate({'stroke-width':sw}, 200, "linear", callback);
		}
		return this;
	},

	renderPulse: function() {

		// TO DO : path to points function
		var path = this.flowpath,
			pupath = [],
			step = 5,
			len = path.getTotalLength(),
			l = 0;

		while(l < path.getTotalLength()) {
			var pos = path.getPointAtLength(l);
			pupath.push( {x:pos.x, y:pos.y} );
			l += step;
		}

		this.pulsePath = pupath;
		this.flowpath.remove();
		//////

		var d = this.model.get("volume");
		offset = -Math.round(d/2);
		this.$pulse.css( {width:d,
							height:d,
							"margin-top":offset,
							"margin-left":offset,
							"background-color":"#fff",
							opacity:0.2
						} );

		function restart() {
			$.Velocity.RunSequence(seq);
		}

		function sequenceGenerator(args) {

			var el = args.element
			var path = args.path;
			var seq = [];
			var incr = args.increment;
			var n = path.length;
			var dt = args.duration/n*incr;

			for (var i = 0; i < n; i+=incr) {

				var t = Math.round(path[i].y*10)/10;
				var l = Math.round(path[i].x*10)/10;
				var o = { duration:dt, easing:"linear" };

				if (i === 0) {
					o = { duration:0, easing:"linear" };
				} else if (i > n - incr - 1) {
					o = { duration:dt, easing:"linear", complete:args.complete };
				}

				var step = {elements:el, properties:{ top:t,left:l }, options:o };
				seq.push(step);
			}

			return seq;
		}

		if (this.pulsing) {
			this.$pulse.velocity( "stop", true )
		}

		var seq = sequenceGenerator( {element:this.$pulse, path:pupath, duration:pupath.length*20, increment:5, complete:restart} );
		$.Velocity.RunSequence(seq);

		this.pulsing = true;

		return this;
	},

	renderFlowTip: function(y, mt) {
		
		if (!this.flowtipview.rendered) {this.$popcontainer.append( this.flowtipview.render( {year:y, mt:mt} ).el ); }
		else { this.flowtipview.updateRender( {year:y, mt:mt} ) }

		return this;
	},

	renderClean: function() {
		this.flowtipview.attachButtons();
		this.flowtipview.correctPosition();
		return this;
	},

	over:function() {
		this.path.attr( {stroke:this.model.get("a_color")} );
	},

	out:function() {
		this.path.attr( {stroke:this.model.get("n_color")} );
	},

	changeYear:function(args) {
		// this.year = this.year === "o4" ? "o9" : "o4";
		// this.path.animate( {"stroke-width":this.model.get("flowVolume")[this.year]}, 200, "easeOut" )
	}

});
var app = app || {};

app.FlowsView = Backbone.View.extend({

	initialize:function(options) {
		this.parent = options.parent;
		this.items_views = options.items_views;

		var ViewsCollection = Backbone.Collection.extend( {model:app.FlowView} );
		this.views_collection = new ViewsCollection();

		this.stacks = new app.Stacks();

		this.listenTo(Backbone, "flows:children", this.loadChildren);
		this.listenTo(Backbone, "flows:parent", this.loadParent);
	    this.listenTo(Backbone, "flows:changeYear", this.changeYear);
	    this.listenTo(Backbone, "flows:nav", this.nav);
	    this.listenTo(Backbone, "flows:expand", this.expand);
	    this.listenTo(Backbone, "flows:contract", this.contract);

	},

	render: function(args) {

		var t = args.time === "same" ? this.time : args.time;
		this.time = t;

		var items_views = this.items_views.views_collection;

		// Filter by id
		var vl_models = _.filter(this.collection.models, function(model) {return (_.indexOf(args.view_list, model.id) > -1)});
		
		var hl_models = [];
		if (args.hide_list === "all") {
			var vs = this.views_collection.models;
			_.each(vs, function(flow) {hl_models.push(flow.model)})
		} else {
			hl_models = _.filter(this.collection.models, function(model) {return (_.indexOf(args.hide_list, model.id) > -1)});
		}

		this.unloadFlows(hl_models);
		this.loadFlows(vl_models);

		// Scale the flows
		var model_unit = vl_models[0] || hl_models[0];
		var scaling = !args.scaling ? false : true;
		this.scale = scaling ? this.findScale( {unit:(model_unit && model_unit.get("unit")) || "", virtual:(model_unit && model_unit.get("virtual")) || false}) : this.scale;
		this.scaleFlows( {time:t, target_flows:vl_models, scale:this.scale} );

		// Offset the flows
		this.offsetFlows( {target_flows:vl_models,
							ref_from:args.ref_from,
							ref_to:args.ref_to,
							ref_recy:args.ref_recy,
							ref_extr:args.ref_extr,
							ref_wast:args.ref_wast} );

		// Create each flow path
		_.each(vl_models, function(flow) {

			if (!this.views_collection.get(flow.get("id"))) {

				var ifrom_id = flow.get("from"), ito_id = flow.get("to");


				// Create the view and append it
				var fv = this.views_collection.add( {model:flow, id:flow.get("id"), ifrom:items_views.get(ifrom_id), ito:items_views.get(ito_id), parent:this.parent}  );

				// Feed stacks
				// Feed or create stacks
				var stacks = this.stacks.list, len = stacks.length;

				// If zero stack exists
				if (len === 0) {

					// Create the first stack
					var stack = new app.Stack({type:flow.get("type"), t1:ifrom_id, t2:ito_id});
					stack.addToStack(fv);
					this.stacks.list.push(stack);
					fv.stack = stack;

				} else {

					while(len--) {

						// If one stack with same type and linked territories exists
						if ( stacks[len].type === flow.get("type")
							&& (stacks[len].t1 === ifrom_id || stacks[len].t2 === ifrom_id)
							&& (stacks[len].t1 === ito_id || stacks[len].t2 === ito_id) ) {

							// Add the flow to the stack
							stacks[len].addToStack(fv);
							fv.stack = stacks[len];
							break;

						// Otherwise, create a stack and add the flow to it
						}  else if (len === 0) {

							var stack = new app.Stack( {type:flow.get("type"), t1:ifrom_id, t2:ito_id} );
							stack.addToStack(fv);
							this.stacks.list.push(stack);
							fv.stack = stack;

						}

					}
				}

				// Append the view
				this.parent.$flowcontainer.prepend( fv.render( {year:t, animate:"appear", mt:args.mt} ).el );
				fv.renderClean();

			} else {

				this.views_collection.get(flow.get("id")).flowtipview.out();
				this.views_collection.get(flow.get("id")).updateRender( {year:t, animate:"changeYear", mt:args.mt} );

			}

		}, this);

		// Popups positioning
		this.stacks.dirtify();  
		this.stacks.unmessify();
		this.stackFlowTips();

		// Popups ghost clicks
			if (args.popups) {
				_.each(args.popups, function(id) {
					this.views_collection.get(id).flowtipview.over();
					this.views_collection.get(id).flowtipview.clickDot();
				}, this);
			}

	    return this;
	},

	loadFlows:function(vl_models) {
		var items_views = this.items_views.views_collection;
		// Dispatch the flows in the items views
		_.each(vl_models, function(flow) {

			if (!this.views_collection.get(flow.get("id"))) {

				// Inputs Outputs
				var ifrom_id = flow.get("from"), ito_id = flow.get("to");
				var f_id = flow.get("id");
				flow.get("type") !== "extraction" && items_views.get(ifrom_id).output.add(flow);
				flow.get("type") !== "waste" && items_views.get(ito_id).input.add(flow);
				flow.get("type") === "recyclage" && items_views.get(ifrom_id).recyclage.add(flow);
				flow.get("type") === "extraction" && items_views.get(ifrom_id).extraction.add(flow);
				flow.get("type") === "waste" && items_views.get(ifrom_id).waste.add(flow);

			}

		}, this)
	},

	unloadFlows:function(hl_models) {
		var items_views = this.items_views.views_collection;
		var self = this;

		// Dispatch the flows in the items views
		_.each(hl_models, function(flow) {
			// Inputs Outputs
			var ifrom_id = flow.get("from"), ito_id = flow.get("to");
			var f_id = flow.get("id");

			flow.get("type") !== "extraction" && items_views.get(ito_id).input.remove(f_id);
			flow.get("type") !== "waste" && items_views.get(ifrom_id).output.remove(f_id);
			flow.get("type") === "recyclage" && items_views.get(ifrom_id).recyclage.remove(f_id);
			flow.get("type") === "extraction" && items_views.get(ifrom_id).extraction.remove(f_id);
			flow.get("type") === "waste" && items_views.get(ifrom_id).waste.remove(f_id);

			self.views_collection.get(f_id).close();
			_.delay(function() {
				self.views_collection.get(f_id).remove();
				self.views_collection.remove(f_id)
			}, 300);
		})
	},

	close:function() {
		_.each(this.views_collection.models, function(view) {view.close();})
		this.stopListening();
	},

	findScale:function(args) {

		var max_f = 0, min_h = 10000, min_h_ref = 0;

		// For each territory
		_.each(this.items_views.views_collection.models, function(item) {
			var id = item.id;
			if (id !== "t0" && id !== "t1") {
				var input = item.input.models;
				var output = item.output.models;
				var is4 = 0, os4 = 0, is9 = 0, os9 = 0;
				// Sum input flows
				_.each(input, function(flow) {is4 += parseInt(flow.get("volume_o4")); is9 += parseInt(flow.get("volume_o9"));})
				// Sum output flows
				_.each(output, function(flow) {os4 += parseInt(flow.get("volume_o4")); os9 += parseInt(flow.get("volume_o9"));})
				// Find the maximum
				max_f = Math.max(max_f, is4, os4, is9, os9);
				// Find the minimum height
				min_h = item.h < min_h ? item.h : min_h;
				if (item.model.get("ref")) min_h_ref = item.h;
			}
		});

		// Find the overall maximum and the scaling factor
		var scale_vol = Math.max(2,max_f);
		var scale_ref = (min_h_ref || min_h)*0.95;
		var scale = Math.round(10000*scale_ref/scale_vol)/10000;


		Backbone.trigger("ui:scale", {scale:scale, unit:args.unit, virtual:args.virtual})


		return scale;

	},

	scaleFlows:function(args) {
		var vol_id = String(args.time) === "1" ? "volume_o4" : "volume_o9";
		_.each(args.target_flows, function(flow) {
			var v = flow.get(vol_id)*args.scale;
			flow.set("is_zero", false);
			if (v === 0) { v = 0; flow.set("is_zero", true); }
			else if (v < 2) { v=2; }
			flow.set("volume", Math.round(v*10)/10);
		});
	},

	offsetFlows:function(args) {

		var vl = [];
		_.each(args.target_flows, function(flow) {vl.push(flow.id)});

		var self = this;
		_.each(this.items_views.views_collection.models, function(item) {
			
			var id = item.id;

			function offset(args) {

				var type = args.type;

				var type_off = "offsetto";
				if (type === "output") {
					type_off = "offsetfrom"
				} else if (type === "recyclage") {
					type_off = "offsetrecy";
				} else if (type === "extraction") {
					type_off = "offsetextr";
				} else if (type === "waste") {
					type_off = "offsetwast";
				}


				var flows = args.item[type].models;
				flows = _.filter(flows, function(flow) {return (_.indexOf(vl, flow.id) > -1)});

				// Sorting
				flows = utils.mergeSort(flows, _.bind(self.idSort, self));
				flows = utils.mergeSort(flows, _.bind(self.volumeSort, self));

				// Offseting
				var sum = 0;
				var off = [];

				// Stack the flows one by one
				_.each(flows, function(flow) {
					var v = flow.get("volume");
					off.push(sum + v/2);
					sum += v;
				})

				// Then offset the flows
				var ref = args.ref ? args.ref : 0;

				_.each(flows, function(flow, index) {
					flow.set(type_off, off[index] - sum/2 + ref);
				})

			}

			offset({item:item, type:"input", ref:args.ref_to});
			offset({item:item, type:"output", ref:args.ref_from});
			offset({item:item, type:"recyclage", ref:args.ref_recy});
			offset({item:item, type:"extraction", ref:args.ref_extr});
			offset({item:item, type:"waste", ref:args.ref_wast});
		
		});
	},

	idSort:function(a, b) {
		var a_id = parseInt(a.get("id")),
			b_id = parseInt(b.get("id"));
		var r = (b_id < a_id);
		return r;
	},

	volumeSort:function(a, b) {
		var a_volume = parseInt(a.get("volume")),
			b_volume = parseInt(b.get("volume")),
			sib = this.areSiblings(a,b);
		var r = sib ? (a_volume > b_volume) : 0;
		return r;
	},

	masterInputSort:function(a, b) {

		var a_type = a.get("type"),
			b_type = b.get("type"),
			a_id = parseInt(a.get("id")),
			b_id = parseInt(b.get("id")),
			a_vol = a.get("volume"),
			b_vol = b.get("volume"),
			sib = this.areSiblings(a,b);

		var r = 0;

		if (a_type === b_type && sib)  {
			// if (sib) {
				r = (b_vol > a_vol);
			// } else {
			// 	r = b_id - a_id;
			// }
		} else if (a_type === "extraction" && b_type === "input") {
			r = -1;
		} else if (a_type === "recyclage" && b_type === "input") {
			r = +1;
		} else if (a_type === "input" && b_type === "extraction") {
			r = 1;
		} else if (a_type === "input" && b_type === "recyclage") {
			r = +1;
		} else {
			r = +(b_id > a_id);
		}

		return r;

	},

	masterOutputSort:function(a, b) {
		
		var a_type = a.get("type"),
			b_type = b.get("type"),
			a_id = parseInt(a.get("id")),
			b_id = parseInt(b.get("id")),
			a_vol = a.get("volume"),
			b_vol = b.get("volume"),
			sib = this.areSiblings(a,b);

		if (a_type === b_type && sib)  {
			// if (sib) {
				r = (b_vol > a_vol);
			// } else {
			// 	r = +b_id - a_id;
			// }
		} else if (a_type === "waste" && (b_type === "output" || b_type === "input")) {
			r = -1;
		} else if (b_type === "waste" && (a_type === "output" || a_type === "input")) {
			r = +1;
		} else if (a_type === "recyclage" && b_type === "output") {
			r = +1;
		} else if ((a_type === "output" || a_type === "input") && b_type === "waste") {
			r = -1;
		} else if (a_type === "output" && b_type === "recyclage") {
			r = -1;
		} else if (a_type === "recyclage" && b_type === "waste") {
			r = -1;
		} else if (a_type === "waste" && b_type === "recyclage") {
			r = -1;
		} else {
			r = (b_id < a_id);
		}

		return r;
	},

	volumeSort:function(a, b) {
		var sib = this.areSiblings(a,b);
		if (sib) {
			var sib_diff = - a.get("volume") + b.get("volume");
			return sib_diff;
		} else {
			return parseInt(a.get("id")) - parseInt(b.get("id"));
		}
	},

	areSiblings:function(f1, f2) {
		var si1 = f1.get("siblings"), si2 = f2.get("siblings");
		if (si1 && si2) {
			var sib = false;
			var len = si1.length;
			while(len--) {
				if (si1[len] === f2.get("id")) {sib = true; break;}
			}
			return sib;
		} else {
			return false;
		}
	},

	stackFlowTips:function() {

		function ySort(a, b) {
			return (a.midY - b.midY);
		}

		var fs = this.views_collection.models;
		fs.sort(ySort);
		var len = fs.length;
		while(len--) {this.views_collection.get(fs[len].id).flowtipview.zOrder(len + 100);}

	},

	loadChildren:function(args) {

		// Test if all children have valid volumes (ie non NAs)
		var pm = this.collection.get(args.parentid);
		var ch_ids = pm.get("children");
		var ch_models = _.filter(this.collection.models, function(model) {return (_.indexOf(ch_ids, model.id) > -1)});
		var valid = true;
		_.each(ch_models, function(model) {if (model.get("volume_o4") === -1 || model.get("volume_o9") === -1) {valid = false}})

		if (valid) {
			// Store the offset of the parent flow, used when rendering the children
			var of = pm.get("offsetfrom");
			var ot = pm.get("offsetto");
			var or = pm.get("offsetrecy");
			var oe = pm.get("offsetextr");
			var ow = pm.get("offsetwast");

			this.render({view_list:args.ids, hide_list:[args.parentid], time:"same", ref_from:of, ref_to:ot, ref_recy:or, ref_extr:oe, ref_wast:ow})
		}
	},

	nav:function(args) {
		var hl = [];
		if (args.hl[0] === "all") {
			_.each(this.views_collection.models, function(flow) {
				if ((_.indexOf(args.vl, flow.id) < 0)) {
					hl.push(flow.id);
				}
			});
		} else {
			hl = args.hl;
		}
		this.render({view_list:args.vl, hide_list:hl, time:args.time, popups:args.popups, scaling:args.scaling, mt:args.mt})
	},

	loadParent:function(args) {

		var self = this;

		// Retrieve the offset of the parent
		var pm = this.collection.get(args.parentid);

		var of = pm.get("offsetfrom");
		var ot = pm.get("offsetto");
		var or = pm.get("offsetrecy");
		var oe = pm.get("offsetextr");
		var ow = pm.get("offsetwast");

		// Search for siblings and other flows whose level is below the parent
		var hl = [];
		var pm_level = pm.get("level");
		var pm_type = pm.get("type");
		var pm_children = pm.get("children");

		if(typeof of === "undefined") {

			of = 0;
			ot = 0;
			or = 0;
			oe = 0;
			ow = 0;

			_.each(pm_children, function(id) {
				var flow = self.collection.get(id);
				of = of + flow.get("offsetfrom");
				ot = ot + flow.get("offsetto");
				or = or + flow.get("offsetrecy");
				oe = oe + flow.get("offsetextr");
				ow = ow + flow.get("offsetwast");
			})

			n = pm_children.length
			of = of/n;
			ot = ot/n;
			or = or/n;
			oe = oe/n;
			ow = ow/n;

		}

		var sub_level = [];
		_.each(this.views_collection.models, function(flow) {

			if (flow.model.get("type") === pm_type &&						// Hide only flow of the same type (ie input/recycling...)
				(_.indexOf(pm_children, flow.model.get("id")) !== -1) ||	// Hide children of the target parent or
				flow.model.get("level") === pm_level + 2) {  	

				hl.push(flow.id)

			}
		})

		this.render({view_list:[args.parentid], hide_list:hl, time:"same", ref_from:of, ref_to:ot, ref_recy:or, ref_extr:oe, ref_wast:ow})
	},

	changeYear:function(args) {
		var vl = [];
		_.each(this.views_collection.models, function(flow) {
			vl.push(flow.id);
		});
		this.render( {view_list:vl, hide_list:[], time:args.time, mt:args.mt} );
	},

	expand:function(args) {

		var vl = [];
		var hl = [];

		// Feed the view list with the leaves
		_.each(this.collection.models, function(model) {
			model.get("leaf") && (model.get("nature") === args.type) && vl.push(model.id);
		})

		// Feed the hide list with flows already drawn but that are not leaves
		_.each(this.views_collection.models, function(flow) {
			if ((_.indexOf(vl, flow.id) < 0)) {
				hl.push(flow.id);
			}
		});

		this.render( {view_list:vl, hide_list:hl, time:"same"} );

	},

	contract:function(args) {

		var vl = [];
		var hl = [];

		// Feed the view list with the leaves
		_.each(this.collection.models, function(model) {
			model.get("root") && (model.get("nature") === args.type) && vl.push(model.id);
		})

		// Feed the hide list with flows already drawn but that are not leaves
		_.each(this.views_collection.models, function(flow) {
			if ((_.indexOf(vl, flow.id) < 0)) {
				hl.push(flow.id);
			}
		});

		this.render( {view_list:vl, hide_list:hl, time:"same"} );

	}

});


var app = app || {};

app.FlowTipView = Backbone.View.extend({

	className: "flowtip",

	template: _.template('\
		<div class = "pulse"></div>\
      	<div class = "dot"></div>\
      	<div class = "mousebox"></div>\
      	<div class = "tip border-tip">\
        	<h3><%= name %></h3>\
        	<ul class = "label">\
          		<li><p class = "volume"></p> <p class = "unit"><%= unit %></p></li>\
          		<li id = "ungroup" class = "popbutton"><span>Détail du flux</span></li>\
          		<li id = "group" class = "popbutton"><span>Retour en arrière</span></li>\
        	</ul>\
        	<b class="border-notch notch"></b>\
        	<b class="notch"></b>\
    	</div>\
	'),

	events: {
		"mouseover": "over",
		"mouseout": "out",
		"click": "clickDot",
		"click #group": "group",
		"click #ungroup": "ungroup"
	},

	initialize: function(options) {
		this.parent = options.parent;
		this.content = _.pick( this.parent.model.attributes, "name", "volume", "unit", "children", "parent" );
		this.focus_color = utils.darkenColor(this.parent.model.get("a_color"), 0.55);
		this.rendered = false;

		this.pos = {"is_zero":this.parent.model.get("is_zero")};
	},

	close:function() {
		// Close buttons
		this.group_b && this.group_b.remove();
		this.ungroup_b && this.ungroup_b.remove();
		this.$trend && this.$trend.velocity("stop")
		this.stopListening();
	},

	cacheComponents:function() {
		this.$tip = this.$el.find(".tip");
		this.$dot = this.$el.find(".dot");
		this.$group = this.$el.find("#group");
		this.$ungroup = this.$el.find("#ungroup");
		this.$labels = this.$el.find("span");
		this.$volume = this.$el.find(".volume");
		this.$unit = this.$el.find(".unit");
		this.$label = this.$el.find(".label");
		return this;
	},

	// Render functions
	render: function(args) {

		this.renderContent()
			.cacheComponents()
			.renderVolume(args.year)
			.renderUnit()
			.styleComponents()
			.renderPosition()
			.renderBase()
			.renderTrend(args.mt)

		this.rendered = true;

		return this;
	},

	updateRender:function(args) {

		this.renderContent()
			.renderVolume(args.year)
			.renderBase()
			.correctPosition()
			.renderTrend(args.mt);

		return this;

	},

	renderPosition: function() {

		var mid = this.parent.mid;
		var noise_intensity = (this.parent.model.get("type") === "extraction" || this.parent.model.get("type") === "waste") ? 15 : 5;
		var noise = Math.floor(noise_intensity*(Math.random()-0.5))

		// noise = constrainNumber(noise-mid, Math.floor(this.parent.pulsePath.length)*0.25, Math.floor(this.parent.pulsePath.length)*0.75);

		var path = this.parent.pulsePath;
			len = path.length,
			mid = mid+noise,
			x = path[mid + noise].x,
			y = path[mid + noise].y;
		
		var vol = this.parent.model.get("volume");
		var vol_c = utils.constrainNumber(vol, 20, 60)*0.6;
		this.vol_c = vol_c;

		// Store parms for auto layout		
		this.pos["anchor"] = mid;
		this.pos["x"] = x;
		this.pos["y"] = y;
		this.pos["hc"] = vol_c/2;

		this.$el.css({ top: y-vol_c/2, left: x-vol_c/2 });
		return this;
	},


	renderContent: function() {

		// Check if first render or update render
		if (!this.rendered) {

			this.$el.html( this.template( this.content ) );

			// Append the trends icons if needed
			if (this.parent.model.get("nature") === "matter") {
				var trend = parseInt(this.parent.model.get("trend"));
				var html = ""
				if (trend === 0) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend flat\"></div></div>"
				} else if (trend === 1) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend plus\"></div></div>"
				} else if (trend === 2) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend plus\"></div>" + "<div id = \"tr2\" class = \"trend plus\"></div></div>"
				} else if (trend === - 1) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend minus\"></div></div>"
				} else if (trend === - 2) {
					html = "<div id = \"trend\" class = \"hidden\"><div id = \"tr1\" class = \"trend minus\"></div>" + "<div id = \"tr2\" class = \"trend minus\"></div></div>"
				}
				this.$trend = $(html).appendTo(this.$el);
      		}

		}
		return this;
	},

	renderVolume:function(year) {
		var y = String(year) === "1" ? "volume_o4" : "volume_o9";
		if (!this.parent.model.get("virtual") && this.parent.model.get(y) !== -1) {
			var vol = utils.formatVolume(this.parent.model.get(y), " ");
			this.$volume.html(vol);
		} else {
			this.$volume.addClass("hidden")
		}
		return this;
	},

	renderUnit:function() {
		if (this.parent.model.get("virtual") && this.parent.model.get("volume") !== -1) {
			this.$label.addClass("hidden");
		}
		return this;
	},

	attachButtons:function() {

		if (this.content.parent) {
			this.group_b = new app.ButtonView( {model:app.instance.ui.b_collection.get("group"), el:this.$group} );
		}

		if (this.content.children) {
			this.ungroup_b = new app.ButtonView( {model:app.instance.ui.b_collection.get("ungroup"), el:this.$ungroup} );
		}

		!this.content.parent && this.$group.css( {display:"none"} );
		!this.content.children && this.$ungroup.css( {display:"none"} );
	},

	renderBase: function() {
		var vol_c = this.vol_c;
		
		// Adapt the size of the button to the flow
		if (!this.rendered) {this.$el.css( {width:vol_c, height:vol_c} );}
		else {this.$el.velocity( {width:vol_c, height:vol_c}, {duration:200} )}

		// Hide button if the flow is zero
		if (this.parent.model.get("is_zero")) {
			this.$el.css( {display:"none"} )
		} else {
			this.$el.css( {display:"inline-block"} )
		}
		
		return this;
	},

	correctPosition: function() {

		var w = this.$tip.width(), h = this.$tip.height();
		var vol = this.vol_c;
		this.$tip.css({ top: -h  + vol*0.25 - 25, left: -w*0.5 + vol/2 -10 });
		this.$dot.css({ top: vol/2-4, left: vol/2-4 });
		this.$labels.css({"margin-top":-h-5});

		this.$trend && this.$trend.css({ top: vol/2-10, left: vol/2-4 + 10 })

		this.pos["w"] = w;
		this.pos["h"] = h;

		return this;
	},

	styleComponents:function() {
		this.$el.css( {"background-color":this.parent.model.get("a_color")} );
		!this.parent.model.get("children") && this.$dot.css( {"background-color":this.parent.model.get("n_color")} );
		return this;
	},

	renderTrend:function(mt) {

		if (this.$trend) {

			var self = this;
			var trend = this.$trend;
			var label = this.$label;
			var seq = [];

			if (mt) {

				// Show the trend icons and animate them
				seq.push({ elements: this.$el, properties: { opacity: 0 }, options: { duration: 100, complete:function() {label.addClass("hidden"); self.correctPosition();} } });
				seq.push({ elements: this.$el, properties: { opacity: 1 }, options: { duration: 100, complete:function() {trend.addClass("show_v")} } });
				seq.push({ elements: this.$trend, properties: { "top":"+=10" }, options: { loop:true } });

			} else {

				// Hide the trend icons and stop the animation
				seq.push({ elements: this.$el, properties: { opacity: 0 }, options: { duration: 100, complete:function() {trend.velocity("stop").velocity("reverse"); trend.removeClass("show_v"); label.removeClass("hidden"); self.correctPosition();} } });
				seq.push({ elements: this.$el, properties: { opacity: 1 }, options: { duration: 100 } });

			}

			$.Velocity.RunSequence(seq);
		}
	},

	zOrder:function(z) {
		this.$el.css({"z-index":z});
	},

	// Mouse events
	over:function() {
		this.$el.css( {"background-color":this.focus_color} );
		this.$tip.addClass("tip-displayed");
		this.parent.over();
	},
	
	out:function() {
		this.$el.css( {"background-color":this.parent.model.get("a_color")} );
		this.$tip.removeClass("tip-displayed");
		this.parent.out();
	},

	clickDot: function() {
		if (!this.clicked) {
			this.$el.off("mouseover mouseout");
			this.clicked = true;
		} else {
			this.delegateEvents();
			this.clicked = false;
		}
	},

	group:function() {
		Backbone.trigger("flows:parent", {parentid:this.parent.model.get("parent")})
	},

	ungroup:function() {
		Backbone.trigger("flows:children", {ids:this.parent.model.get("children"), parentid:this.parent.model.get("id")})
	}


});
var app = app || {};

app.IntroView = Backbone.View.extend({

	id:"intro",

	events:{
		"click":"close"
	},

	template: _.template('\
		<div id = "intro_back"></div>\
    	<div id = "top_left" class = "intro_box"><p><div class = "arrow-up"></div><%=topleft%></p></div>\
    	<div id = "top_right1" class = "intro_box"><div class = "arrow-right"></div><p><%=topright1%></p></div>\
    	<div id = "top_right2" class = "intro_box"><div class = "arrow-right"></div><p><%=topright2%></p></div>\
    	<div id = "top_right3" class = "intro_box"><div class = "arrow-right"></div><p><%=topright3%></p></div>\
    	<div id = "bottom" class = "intro_box"><div class = "arrow-down"></div><p><%=bottom%></p></div>\
	'),

	initialize:function() {

		_.bindAll(this, "resizeBack");

		this.content = {topleft:"Trois types de flux : matières, énergies, eaux",
						topright1:"Accès aux projets innovants",
						topright2:"<br>Trois échelles : Paris, Ile-de-France, Petite Couronne<br><br> ",
						topright3:"Les tendances d'évolution",
						bottom:"Les informations complémentaires sur les flux"};

	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			.attachResize();
		return this;
	},

	// Render functions
	renderContent: function(options) {
		this.$el.html( this.template(this.content) );
		return this;
	},

	cacheComponents:function() {
		this.$back = this.$el.find("#intro_back");
		this.$bottom = this.$el.find("#bottom");
		return this;
	},

	resizeBack:function() {
		var win = $(window), w = win.innerWidth(), h = win.innerHeight();
		this.$back.css({ width:w*0.97+'px', height:h*0.95+'px', top:0.025*h, left:0.015*w })
	},

	attachResize:function() {

		var win = $(window), w = win.innerWidth(), h = win.innerHeight();
			this.$back.css({ width:w*0.97+'px', height:h*0.95+'px', top:0.025*h, left:0.015*w })
		
		$(window).on("resize", this.resizeBack);
		return this;
	},

	// Removes all elements of the view
	close:function() {
		this.stopListening();
		$(window).off("resize", this.resizeBack);
		this.remove();
	}

});

var app = app || {};

app.ItemView = Backbone.View.extend({

	className:"item",
	template: _.template( '<p class = "label hidden"></p>' ),

	initialize:function(options) {

		this.listenTo(Backbone, "items:updatePositions", this.updatePositions);

		this.parent = options.parent;

		var flow_collection = Backbone.Collection.extend( {model:app.Flow} );
		this.input = new flow_collection();
		this.output = new flow_collection();
		this.recyclage = new flow_collection();
		this.extraction = new flow_collection();
		this.waste = new flow_collection();

		var self = this;
		var geom_url = this.model.get("geom");
		if (geom_url) {

			$.ajax({

				url:geom_url,
      			data: { get_param: 'value' },
      			dataType: 'json',

				success:function(data) {
					self.model.set(data);
					_.bind(self.createCanvas, self)(data);
					self.parent.parent.$itemcontainer.children(":first").prepend( self.render().el );
				},

				complete:function() {
					options.complete();
				}

			});

		} else {

			self.parent.parent.$itemcontainer.children(":first").prepend( self.render().el );
			options.complete();

		}
	},

	updatePositions:function(args) {
		var regex = /[+-]?\d+(\.\d+)?/g;
		var floats = args.mat.match(regex).map(function(v) { return parseFloat(v); });

		this.w = this.wBase * floats[0];
		this.h = this.hBase * floats[0];

		ws = args.ws;

		var z = this.parent.parent.projects_views.previous_zoom;

		var x_rp = parseFloat($("#rightpanel").css("left"));
		var x_focal = this.X - ws.clientX + x_rp;
		var x_scaled = x_focal*floats[0]/z
		var x_translated = x_scaled + ws.clientX - x_rp;

		var y_rp = parseFloat($("#rightpanel").css("top"));
		var y_focal = this.Y - ws.clientY + y_rp;
		var y_scaled = y_focal*floats[0]/z
		var y_translated = y_scaled + ws.clientY - y_rp;

		this.X = x_translated;
		this.Y = y_translated;
	},

	createCanvas:function(data) {

		//Create the raphael canvas to draw on according to current window size
		var ws = utils.getWindowSize();
		var w = ws.w, h = ws.h;

		//Compute necessary transformations to reach target size and location
		var scw = Math.sqrt(w/data.width*this.model.get("scale"));
		var sch = Math.sqrt(h/data.height*this.model.get("scale"));

		var scaling = this.model.get("force_w_scale") ? scw : Math.min(scw, sch);

		var w_mod = data.width*scaling*scaling ;
		var h_mod = data.height*scaling*scaling ;

		// Create the canvas
		this.r = Raphael(this.$el[0], w_mod, h_mod);
		$("svg", this.$el).css({position:"absolute"});

		this.scaling = scaling;
		this.w = w_mod * parseFloat(this.model.get("iw"));
		this.h = h_mod * parseFloat(this.model.get("ih"));
		this.wBase = this.w;
		this.hBase = this.h;

		this.model.set("w_mod", w_mod);
		this.model.set("h_mod", h_mod);

	},

	render:function() {
		this.renderContent()
			.cacheComponents()
			.renderGeometry()
			.renderSolution()
			.renderTip();
		return this;
	},

	renderContent:function() {
		this.$el.css("z-index", this.model.get("z"));
		this.$el.append( this.template() );
		return this;
	},

	cacheComponents:function() {
		this.$label = this.$el.find(".label");
		return this;
	},

	renderGeometry:function() {

		var r = this.r;
		var m = this.model;
		var scaling = this.scaling;

		if (m.get("geometry")) {

			// Load the geometry in a set
			r.setStart();
			r.add(m.get("geometry"));
			var polys = r.setFinish();

			// Scale
			var sgn = this.model.get("label") === "Plateforme Web" ? -1 : 1
			polys.transform(["t", - sgn*this.model.get("dx"), -sgn*this.model.get("dy")]);
			polys.transform(["...S", scaling, scaling, 0, 0]);
			this.polys = polys;

		}

		// Translate
		var ws = utils.getWindowSize();
		var w = ws.w, h = ws.h;
		var xw = eval(m.get("x")) - (m.get("width")/2 * scaling * scaling || 0);
		var yh = eval(m.get("y")) - (m.get("height")/2 * scaling * scaling || 0);

		this.$el.css({left:xw, top:yh});

		this.X = eval(m.get("x"));
		this.Y = eval(m.get("y"));
		this.Xbase = this.X;
		this.Ybase = this.Y;

		this.fax = this.X + (m.get("fax")*m.get("w_mod") || 0);
		this.fay = this.Y + (m.get("fay")*m.get("h_mod") || 0);

		return this;

	},

	renderSolution:function() {
	// Create the solution effect
	if (this.model.get("solution")) {
		var s = Raphael(this.el, this.w*1.3, this.h*1.5);
		$("svg", this.$el).css({position:"absolute"})
		this.$el.children().first().css({top: -this.h*0.25, left:-this.w*0.15, opacity:0})

		var a = this.w*1/2, b = this.h*1/2, dx = this.w*1.3/2, dy = this.h*1.5/2;

		function drawStick(t) {
			t = t*3.14/180;
			var dl = a*0.2;
			var X = dx + a*1.1 * Math.cos(t), Y = dy - b*1.1 * Math.sin(t);
			var XX = dx + (a+dl)* Math.cos(t), YY = dy - (b+dl) * Math.sin(t);
			s.path(["M",X,Y, "L",XX, YY]).attr({"stroke-width":3, stroke:"#FFC633"})
		}

		drawStick(30);
		drawStick(60);
		drawStick(90);
		drawStick(120);
		drawStick(150);

		this.$solution = this.$el.children().first();
		this.$solution.velocity({opacity:1}, {loop:true})

	}

	return this;
	},

	renderTip:function() {

		if (this.model.get("label")) {

			this.$label.addClass("show_v");

			var r = Raphael(this.el, 40, 30);
			$("svg", this.$el).css({position:"absolute"})
			this.$el.children().first().css({top:0.95*this.model.get("h_mod"),left:this.w/2 - 40, "z-index":1})

			var e = 15;
			var xoff = 40;

			var pp = r.path(["M", 40 - xoff, 0 + e,
				"L", 40, 0,
				"L", 40 - xoff/2, 0 + e,
				"Z"]);
			pp.attr({"stroke-width":0, fill:"#D8D8D9"})

			// var container = $(target_slide + " #middle #"+ this.id);
			this.$label.html(this.model.get("label"));
			this.$label.css({top:0.95*this.model.get("h_mod")+15,left:this.w/2 - 40})
		}

		return this;
	},

	close:function() {
		this.$solution && this.$solution.velocity("stop");
		this.stopListening();
	},

	appear:function(args, delay) {
		if (!this.onScreen) {
			this.$el.velocity("fadeIn", {duration:parseInt(args.time), delay:delay, queue:false, display:"block"});
			this.onScreen = true;
		}
	},

	disappear:function(args, delay) {
		this.$el.velocity("fadeOut", {duration:parseInt(args.time), delay:delay, queue:false})
		this.onScreen = false;
	},

	translate:function(args, delay) {
		var ws = utils.getWindowSize();
		var w = ws.w, h = ws.h;

		var m = this.model;
		var scaling = this.scaling;

		var xw = eval(args.x) - (m.get("width")/2 * scaling * scaling || 0);
		var yh = eval(args.y) - (m.get("height")/2 * scaling * scaling || 0);

		this.X = eval(args.x);
		this.Y = eval(args.y);

		this.fax = this.X + (m.get("fax")*m.get("w_mod") || 0);
		this.fay = this.Y + (m.get("fay")*m.get("h_mod") || 0);

		this.$el.velocity({left:xw, top:yh}, {duration:parseInt(args.time), delay:delay, queue:false});
	},

	hideGround:function() {
		for (var i = 0; i < this.polys.length; i++) {
			if (this.polys[i].attr('fill') === "#89807D") {
				this.polys[i].hide();
			}
		}
	},

	showGround:function() {
		for (var i = 0; i < this.polys.length; i++) {
			if (this.polys[i].attr('fill') === "#89807D") {
				this.polys[i].show();
			}
		}
	}

});

var app = app || {};

app.ItemProjectView = Backbone.View.extend({

	tagName:"li",
	className:"itemproject",

	events: function() {

		var events_hash = {};
		if (this.to_render) {
			_.extend(events_hash, {"mouseenter":"over",
									"mouseleave":"out",
									"click":"clk"});
		}
		return events_hash;
	},

	template: _.template('\
		<div class = "content">\
      		<div class = "gcontainer"><img class = "graphics" src=<%=imgurl%>></div>\
      		<div class = "logocontainer hidden">\
        	<div class = "mask"></div>\
        		<img src=<%=logourl%>>\
      		</div>\
      		<div class = "text">\
        		<h3 class = "name"><%=name%></h3>\
      		<div>\
    	</div>\
	'),

	initialize:function() {
		this.rendered = true;
		this.hasLogo = true;
		if (this.model.get("logo") == "amu") { this.model.set("logourl", "data/graphics/logoamusmall.png"); }
		else if (this.model.get("logo") == "adpd") { this.model.set("logourl", "data/graphics/adpd.png"); }
		else { this.model.set("logourl", ""); this.hasLogo = false }

		var global_ids = ["paris", "grandparis", "valdemarne", "px"];
		this.to_render = true;
		if(global_ids.indexOf(this.model.get("id")) > -1) {
			this.to_render = false;
		}
	},

	render:function() {
			this.renderContent()
				.cacheComponents()
		return this;
	},

	cacheComponents:function() {
		this.$logocontainer = this.$el.find(".logocontainer");
		// this.$logo = this.$el.find(".logocontainer");
		return this;
	},

	renderContent:function() {
		this.$el.html( this.template(this.model.attributes) );
		return this;
	},

	over:function() {
		Backbone.trigger("projects:focus", {id:this.model.get("id")})
	},

	hide:function() {
		this.$el.velocity("fadeOut", {duration:0});
		this.$el.addClass("item-hidden");
		this.rendered = false;
	},

	show:function() {
		this.$el.velocity("fadeIn", {duration:0, display:"inline-block"});
		this.rendered = true;
	},

	out:function() {
		Backbone.trigger("projects:unfocus", {id:this.model.get("id")})
	},

	focus:function() {
		this.$el.addClass("item-focused");
		this.to_render && this.hasLogo && this.$logocontainer.show();
		return this;
	},

	unfocus:function() {
		this.$el.removeClass("item-focused");
		this.to_render && this.hasLogo && this.$logocontainer.hide();
	},

	clk:function() {
		var id = this.model.get("id");
		var global_ids = ["paris", "grandparis", "valdemarne", "px"];
		(global_ids.indexOf(this.model.get("id")) < 0)  && Backbone.trigger("route:buildGo", {change:"project", id:id});
	},

	close:function() {
		this.stopListening();
	}

});
var app = app || {};

app.ItemsView = Backbone.View.extend({

	initialize:function(options) {
		this.parent = options.parent;

		var ViewsCollection = Backbone.Collection.extend( {model:app.ItemView} );
		this.views_collection = new ViewsCollection();

		this.listenTo(Backbone, "items:animate", this.animate);
	},

	render: function(options) {

		var len = this.collection.length;
		this.collection.each(function(item, index) {

			var complete = function() {Backbone.trigger("item:loaded")};
			this.views_collection.add({ id:item.get("id"), model:item, parent:this, complete:complete} );

		}, this);

	    return this;
	},

	close:function() {
		_.each(this.views_collection.models, function(view) {
			view.close();
			view.remove();
		})
		this.stopListening();
	},

	animate:function(args) {
		var iv = this.views_collection.get(args.target);
		iv && iv[args.action](args.parms, args.time);
	}

});
var app = app || {};

app.NavView = Backbone.View.extend({

	tagName:"li",
	className:"n_button",

	events:{
		"click":"clk"
	},

	template: _.template('\
		<div class="tip border-tip">\
      		<h3><%=title%></h3>\
      		<b class="border-notch notch"></b>\
      		<b class="notch"></b>\
    	</div>\
	'),

	initialize:function() {
		_.bindAll(this, "renderClean")
	},

	render:function() {
		this.$el.html( this.template(this.model.attributes) );
		!this.model.get("display_dot") && this.$el.addClass("hidden")
		return this;
	},

	renderClean:function() {
		var w = this.$el.find(".tip").width(), h = this.$el.find(".tip").height();
		this.$el.find(".tip").css({left:-w*0.5 - 7.5/2, top:-h - 25});
	},

	clk:function(args) {

		// Unclick other buttons
		this.$el.parent().children().each(function() {$(this).removeClass("n-clicked");});
		this.$el.addClass("n-clicked");

		// Load story
		!args.silent && Backbone.trigger("stories:go", {id:this.id});

	}

});
var app = app || {};

app.PopProjectView = Backbone.View.extend({

	className:"popproject",

	events:{
		"click":"clk",
		"mouseenter":"over",
		"mouseleave":"out"
	},

	template: _.template('\
		<div class="tip border-tip">\
			<div id = "mousebox"></div>\
			<p><%=name%></p>\
			<b class="border-notch notch"></b>\
			<b class="notch"></b>\
		</div>\
		<div id = "pin"></div>\
	'),

	initialize:function(options) {
		_.bindAll(this, "renderClean")
		this.item = options.item;
		this.id = this.model.get("id");
		this.rendered = true;
	},

	render:function() {
		this.renderContent()
		.cacheComponents()
		return this;
	},

	cacheComponents:function() {
		this.$pin = this.$el.find("#pin");
		this.$tip = this.$el.find(".tip");
		this.$pin.addClass(this.model.get("type"))
		return this;
	},

	renderContent:function() {
		this.$el.html( this.template(this.model.attributes) );
		return this;
	},

	renderGeometry:function() {

		var type = this.model.get("type") === "local" ? "local" : "global";
		var b_id = "pin" + type;
		this.pin_b = new app.ButtonView( {model:app.instance.ui.b_collection.get(b_id), el:this.$pin} );

		return this;
	},

	correctPosition:function() {
		var xt = this.item.X;
		var yt = this.item.Y;
		var wt = this.item.w;
		var ht = this.item.h;
		var wb = this.item.wBase;
		var hb = this.item.hBase;
		var s = this.item.scaling;

		var is_gp = this.item.model.get("geom");

		if (is_gp == "data/graphics/geom_grandparis.json") {
			var x = xt - wt/2 + 1*1069 * (parseFloat(this.model.get("x"))) * s*s * wt/wb + 344*s*s * wt/wb;
			var y = yt - ht/2 + 1*393 * (parseFloat(this.model.get("y"))) * s*s * ht/hb + 389*s*s * wt/wb;
		} else {
			var x = xt + wt*(parseFloat(this.model.get("x")) - 0.5);
			var y = yt + ht*(parseFloat(this.model.get("y")) - 0.5);
		}


		this.y = y;
		this.x = x;
		this.$el.css( {top:y, left:x} );
	},

	renderClean:function() {

		this.renderGeometry()
		.correctPosition();

		var w = this.$tip.width(), h = this.$tip.height();
		var offy = this.model.get("type") === "local" ? 60 : 40;
		var offx = this.model.get("type") === "local" ? 10 : 15;
		this.$tip.css( {left:-w*0.5 - offx, top:-h - offy} );
	},

	clk:function() {
		var id = this.id;
		if (id === "px") {
			Backbone.trigger("route:buildGo", {change:"root", id:"p"});
		} else if (id !== "p0") {
			Backbone.trigger("route:buildGo", {change:"project", id:id});
		}
	},

	show:function() {
		this.$el.velocity("fadeIn", {duration:200, display:"block"});
		this.rendered = true;
	},

	hide:function() {
		this.$el.velocity("fadeOut", {duration:200});
		this.rendered = false;
	},

	over:function() {
		Backbone.trigger("projects:focus", {id:this.id, freezePop:true});
		(this.id.length > 3 || this.id === "px") && this.$tip.addClass("show_h");
	},

	out:function() {
		Backbone.trigger("projects:unfocus", {id:this.id});
		(this.id.length > 3 || this.id === "px") && this.$tip.removeClass("show_h");
	},

	focus:function() {
		this.$el.velocity( {top:"-=10"}, {duration:300, loop:true} );
		return this;
	},

	unfocus:function() {
		this.$el.velocity("stop", true).velocity({top:this.y});
	},

	close:function() {
		this.stopListening();
		this.pin_b && this.pin_b.remove();
	},

	zOrder:function(z) {
		this.$el.css({"z-index":z});
	}

});
var app = app || {};

app.ProjectsView = Backbone.View.extend({

	template: _.template('\
		<div id = "leftpanel">\
		<div id = "header">\
		<div class="form-group">\
		<input type="text" class="form-control" placeholder="Recherche..."/>\
		</div>\
		<i class="icon-search form-control-feedback"></i>\
		<div id = "categorylist">\
		<ul></ul>\
		</div>\
		<div id = "categoryname">\
		<p></p>\
		</div>\
		<p id = "search_info"></p>\
		</div>\
		<div id = "content">\
		<ul id = "itemlist"></ul>\
		</div>\
		</div>\
		<div id = "rightpanel"></div>\
		'),

	events: {
		"keyup .form-control": "textSearch"
	},

	initialize:function(options) {

		this.parent = options.parent;

		this.items_views = options.items_views.views_collection;

		// Collection of pins (for the map on the right)
		var PopProjectsViewsCollection = Backbone.Collection.extend( {model:app.PopProjectView} );
		this.ppv_collection = new PopProjectsViewsCollection();

		// Collection of items (for the list on the left)
		var ItemProjectsViewsCollection = Backbone.Collection.extend( {model:app.ItemProjectView} );
		this.ipv_collection = new ItemProjectsViewsCollection();

		// Collection of categories
		var CategoriesViewsCollection = Backbone.Collection.extend( {model:app.CategoryView} );
		this.cat_collection = new CategoriesViewsCollection();

		// Listen for events of pins and items
		this.listenTo(Backbone, "projects:focus", this.focusProject);
		this.listenTo(Backbone, "projects:unfocus", this.unfocusProject);
		this.listenTo(Backbone, "projects:updatePositions", this.updateProjectsPositions);

		// Listen for events of category buttons
		this.listenTo(Backbone, "categories:focus", this.focusCategory);
		this.listenTo(Backbone, "categories:unfocus", this.unfocusCategory);
		this.listenTo(Backbone, "categories:clk", this.clkCategory);

		// Listen for panzoom events
		this.listenTo(Backbone, "map:pan", this.panMap);

		// Store name of projects for text search
		this.user_input = "";
		this.projects_ids = [];
		this.projects_names = [];
		this.collection.each(function(project, index) {
			this.projects_ids[index] = project.get("id");
			this.projects_names[index] = utils.formatString( project.get("name") );
		}, this);

		// Categories
		this.categoriesData = [
		{"icon": "icon-tous", "color":"#9e9e9", "label": "Tous les projets", "state":"tous_projets"},
		{"icon": "icon-nouveauxmodels", "color":"#b4b3b3", "label": "Nouveaux modèles économiques", "state":"nouveaux_modeles_economiques"},
		{"icon": "icon-eau", "color":"#99d2e9", "label": "Gestion durable de l'eau", "state":"gestion_durable_eau"},
		{"icon": "icon-energies", "color":"#fcea27", "label": "Récupération et valorisation énergétique", "state":"recuperation_valorisation_energetique"},
		{"icon": "icon-matieres", "color":"#cbbc9f", "label": "Réemploi et réutilisation matières", "state": "reemploi_reutilisation_matieres"},
		{"icon": "icon-dechetsverts", "color":"#cbbc9f", "label": "Valorisation biodéchets et agriculture urbaine", "state":"valorisation_biodechets_agriculture_urbaine"},
		{"icon": "icon-chantier", "color":"#9cc876", "label": "Recyclage et valorisation des déchets de chantier", "state": "recyclage_valorisation_dechets_chantier"}
		];

		this.clicked_cat = "Tous les projets";
		this.clicked_cat_id = 0;

		if (options.categoryState) {
			this.clicked_cat_id = _.findIndex(this.categoriesData, function(cat) { return cat.state == options.categoryState });
			this.clicked_cat = this.categoriesData[this.clicked_cat_id].label
		}
		

		this.cat_matchs = _.clone(this.projects_ids);
		this.search_matchs = _.clone(this.projects_ids);

		// Keep the panel hidden ?
		this.showpanel = options.showpanel;
		this.allow_pan = true;

		// Focus on project ?
		this.focus_on_project = options.focus_on_project;

	},

	render:function() {
		this.renderContent()
		.cacheComponents()
		.renderCategories()
		.renderPops()
		.renderItems()
		.attachPan()
		.slidePanel()
		.focusOnProject();
		return this;
	},

	slidePanel:function() {
		this.showpanel && this.$leftpanel.velocity({opacity:1}, {duration:200, delay:800, easing:"easeOut"})
		return this;
	},

	focusOnProject:function() {
		if (this.focus_on_project) {
			var ipv = this.ipv_collection.get(this.focus_on_project);
			this.focused_item = ipv.focus();
			this.focused_item.$el.velocity( "scroll", {container:this.$list, duration:0, offset:-64, "easing":"easeInOut"});
		}
		return this;
	},

	exitPanel:function() {
		this.showpanel && this.$leftpanel.velocity("fadeOut", {duration:300})
	},

	renderContent:function() {
		this.$el.append( this.template() );
		return this;
	},

	cacheComponents:function() {
		this.$leftpanel = this.$el.find("#leftpanel");
		this.$list = this.$leftpanel.find("#itemlist");
		this.$input = this.$leftpanel.find(".form-control");
		this.$categorylist = this.$leftpanel.find("#categorylist ul");
		this.$categoryname = this.$leftpanel.find("#categoryname p");
		this.$rightpanel = this.$el.find("#rightpanel");
		this.$search_info = this.$el.find("#search_info");
		return this;
	},

	attachPan:function() {

      	// Set up panzoom
      	// var pz = this.parent.$itemcontainer.panzoom();
      	this.parent.$itemcontainer.panzoom( "option", "increment", 0.2 );
      	this.pan_limits = [-0.5,0.5,-0.75,0.75];
      	this.parent.$itemcontainer.panzoom( "option", "limits", this.pan_limits );

      	// When the user pans the map, move the projects pins container
      	this.parent.$itemcontainer.on("panzoomstart", _.bind(this.storeTransform, this));
      	this.parent.$itemcontainer.on("panzoompan", _.bind(this.panMap, this));
      	this.parent.$itemcontainer.on("panzoomend", _.bind(this.endPan, this));
      	this.parent.$itemcontainer.on("panzoomzoom", _.bind(this.panMapAfterZoom, this));
      	// this.parent.$el.on("mousewheel.focal", _.bind(this.wheelZoom, this));

      	this.offsetX = 0;
      	this.offsetY = 0;

      	this.startX = 0;
      	this.startY = 0;

      	this.previous_zoom = 1;
      	this.next_zoom = 1;

      	return this;
      },

      panMap:function(e, pz, x, y) {

		// Gets and sets the offset
		function panPanel($el, pz, x, y) {

			var w = $("#itemcontainer").width(),
			h = $("#itemcontainer").height();

			var xl = this.pan_limits[0]*w,
			xr = this.pan_limits[1]*w,
			yt = this.pan_limits[2]*h,
			yb = this.pan_limits[3]*h;


			if (y < yt) {
				$el.css("top", yt);
			} else if (y > yb) {
				$el.css("top", yb);
			} else {
				$el.css("top", y + 1*(this.startY - this.offsetY));
			}

			if (x < xl) {
				$el.css("left", xl);
			} else if (x > xr) {
				$el.css("left", xr);
			} else {
				$el.css("left", x + 1*(this.startX - this.offsetX));
			}
		}

		function disablePan() {
			this.allow_pan = false;
		}

		// If the mouse points inside the map container, move it
		// if (this.allow_pan) {

			// Set the listeners to catch the moment when the mouse leaves the map container
			// this.$leftpanel.one("mouseover", _.bind(disablePan, this));
			// $("#territory").one("mouseleave", _.bind(disablePan, this));
			_.bind(panPanel, this)(this.$rightpanel, pz, x, y);
			// _.bind(this.endPan,this)(pz);

		// } else {

		// 	_.bind(panPanel,this)(this.$rightpanel, pz, x, y);
		// 	_.bind(this.endPan,this)(pz);
		// 	this.allow_pan = true;
		// 	return;
		// }

	},

	endPan:function(e, pz) {
		// this.$leftpanel.off("mouseover");
		// $("#territory").off("mouseleave");
		this.offsetX = parseFloat(this.$rightpanel.css("left"));
		this.offsetY = parseFloat(this.$rightpanel.css("top"));
	},

	storeTransform:function(e, pz) {
		var z = pz.getMatrix()[0]
		this.previous_zoom = z;
		this.offsetX = pz.getMatrix()[4];
		this.offsetY = pz.getMatrix()[5];
		this.startX = parseFloat(this.$rightpanel.css("left"));
		this.startY = parseFloat(this.$rightpanel.css("top"));
	},

	panMapAfterZoom:function(e, pz, x, y) {
		var z = parseFloat(pz.getMatrix()[0]);
		this.previous_zoom = this.next_zoom;
		if (Math.abs(z - this.previous_zoom) > 0.001) {this.next_zoom = z;}
	},

	updateProjectsPositions:function() {
		this.renderPops();
		Backbone.trigger("territory:updateProjects");
	},

	wheelZoom:function(e) {

		e.preventDefault();
		var delta = e.deltaY || e.originalEvent.wheelDelta;
		var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;

		var next_zoom = this.previous_zoom + delta/100*2;
		$("#zoom").find(".zoom-range").val(next_zoom*100-50);

		this.parent.$itemcontainer.panzoom("zoom", zoomOut, {
			increment:Math.abs(delta)/100*2,
			animate:false,
			focal:e
		});

		mat = this.parent.$itemcontainer.panzoom("getMatrix").input;
		var ws = {clientX:e.clientX, clientY:e.clientY};

		var pz = this.parent.$itemcontainer.panzoom("instance");

		_.bind(this.reloadPins(e, pz, mat, ws, zoomOut), this)();


	},

	reloadPins:function(e, pz, mat, ws, zoomOut) {
		var self = this;
		var doit;
		return function() {
			clearTimeout(self.doit);
			self.panMapAfterZoom(e, pz);
			self.doit = setTimeout(function() {
				Backbone.trigger("items:updatePositions", {mat:mat, ws:ws, z:zoomOut});
				Backbone.trigger("projects:updatePositions", {mat:mat, ws:ws, z:zoomOut});
			}, 200);
		};
	},

	renderPops:function() {

		// Render each project pin
		this.collection.each(function(project, index) {
			if (project.get("render")) {
				var ppv = this.ppv_collection.add( {id:project.get("id"), model:project, item:this.items_views.get(project.get("territory"))} );
				this.$rightpanel.append( ppv.render().el );
				_.defer(ppv.renderClean);
			}
		}, this);

		// Stack them from front to bottom to avoid unwanted overlap
		var self = this;
		_.defer(function() {

			function ySort(a, b) {
				var a_type = a.model.get("type"),
				b_type = b.model.get("type");

				if (a_type === b_type) {
					return (a.y - b.y)
				} else if (b_type == "global") {
					return -1
				} else {
					return 1
				}
			}

			var fs = self.ppv_collection.models;
			fs.sort(ySort);
			var len = fs.length;
			while(len--) {
				self.ppv_collection.get(fs[len].id).zOrder(len);
			}

		})

		return this;
	},

	renderCategories:function(args) {

		_.each(this.categoriesData, function(category, index) {
			var clk = index == this.clicked_cat_id ? true : false;
			var cv = this.cat_collection.add( {id:index, model:category, clicked:clk} );
			this.$categorylist.append( cv.render().el );
		}, this);

		return this;
	},

	renderItems:function() {

		var global_ids = ["paris", "grandparis", "valdemarne", "px"];

		this.collection.each(function(project, index) {
			var ipv = this.ipv_collection.add( {id:project.get("id"), model:project} );
			if (global_ids.indexOf(project.get("id")) < 0) {
				var it = ipv.render();
				this.$list.append( it.el );
				it.$el.velocity( "scroll", {container:this.$list, duration:0, offset:-64, "easing":"easeInOut"});
			}
		}, this);

		 this.filterItemsByCat(this.clicked_cat_id);

		return this;
	},

	showProject:function(project) {
		var pin = this.ppv_collection.get(project.model.attributes["id"]);
		!project.rendered && project.show();
		pin && !pin.rendered && pin.show();
	},

	hideProject:function(project) {
		var pin = this.ppv_collection.get(project.model.attributes["id"]);
		project.rendered && project.hide();
		pin && pin.rendered && pin.hide();
	},

	filterItemsByCat:function(cat_id) {

		// Loop through projects
		this.ipv_collection.each(function(project) {

			// If a category is clicked
			if (cat_id !== 0) {
				// Hide the projects that do not match the clicked category, show all the others
				if (_.indexOf(project.model.attributes["category"], cat_id) == -1) { this.hideProject(project); }
				else { this.showProject(project); }																	
			}
			// If no category is clicked, show all projects				
			else { this.showProject(project); }

		}, this);

	},

	filterItemsById:function() {

		var cat_id = this.clicked_cat_id;

		var ids_to_show = _.intersection(this.search_matchs, this.cat_matchs);
		var ids_to_hide = _.difference(this.projects_ids, ids_to_show);

		var projects_to_hide = _.select(this.ipv_collection.models, function(project) {
			return (_.indexOf(ids_to_hide, project.id) > -1);
		});

		var projects_to_show = _.select(this.ipv_collection.models, function(project) {
			return (_.indexOf(ids_to_show, project.id) > -1);
		});

		// Write search info box
		if (this.user_input.length > 2) {
			if (this.user_input !== "") {
				this.$search_info.html("<b>" + projects_to_show.length + "</b> résultats pour : <b>" + this.user_input.split(/[\s,]+/).join("</b> + <b>") + "</b>");
			}
		} else {
			this.$search_info.html("");
		}

		_.each(projects_to_hide, function(project) { this.hideProject(project) }, this);
		_.each(projects_to_show, function(project) { this.showProject(project) }, this);

	},

	textSearch:function(event) {

		// Format and split user input
		var user_input = this.$input.val();
		var user_input_clean = utils.formatString(user_input).split(/[\s,]+/);

		this.user_input = user_input;

		var index = [];
		var k = 0;

		// Search for occurences of each word
		_.each(user_input_clean, function(word) {

			// Find all projects names matching
			var matches = _.filter(this.projects_names, function(s) {
				return s.indexOf(word) !== -1;
			})

			var ids = [];
			var i = 0;

			// Find all index of matching names
			_.each(matches, function(match) {
				ids[i] = _.indexOf(this.projects_names, match);
				i++;
			}, this);

			index[k] = ids;
			k++;

		}, this);

		// Return the intersection of matches
		var pos = _.intersection.apply(_, index);
		var ids = [];
		k = 0;

		_.each(pos, function(id) {
			ids[k] = this.projects_ids[id];
			k++;
		}, this);

		this.search_matchs = ids;
		this.filterItemsById();

	},

	focusCategory:function(args) {
		this.$categoryname.html(args.label);
	},

	unfocusCategory:function(args) {
		this.$categoryname.html( this.clicked_cat );
	},

	clkCategory:function(args) {

		if (!args.options.silent) {

			this.cat_collection.each(function(cat) {
				cat.model.label != args.label && cat.unclk();
			})

			this.clicked_cat = args.label;
			this.clicked_cat_id = args.id;

			// Loop through projects
			this.cat_matchs = [];
			var k = 0;
			this.ipv_collection.each(function(project) {
				if (_.indexOf(project.model.attributes["category"], args.id) > -1) { this.cat_matchs[k] = project.id; k++; }
			}, this);

			this.filterItemsById();

		}

	},

	focusProject:function(args) {

		var global_ids = ["paris", "grandparis", "valdemarne", "px"];

		if (global_ids.indexOf(args.id) < 0) {

			var ipv = this.ipv_collection.get(args.id);

			// Unfocus previously focused element
			this.focused_pop && this.focused_pop.unfocus();
			this.focused_item && this.focused_item.unfocus();

			if (ipv.model.get("type") !== "global") {
				// Focus the target element and store that element
				this.focused_id = args.id;
				if (!args.freezePop) this.focused_pop = this.ppv_collection.get(args.id).focus();
			} else {
				// Focus the floating global element
				var coverage = ipv.model.get("coverage")
				this.focused_id = coverage;
				if (!args.freezePop) this.focused_pop = this.ppv_collection.get(coverage).focus();
			}

			this.focused_item = ipv.focus();
			if (args.freezePop) this.focused_item.$el.velocity( "scroll", {container:this.$list, duration:1000, offset:-64, "easing":"easeInOut"});
		}

		else if (args.id !== "px") {

			var projects_to_focus = _.select(this.ipv_collection.models, function(project) {
				return (project.model.get("type") === "global" && project.model.get("coverage") === args.id);
			});

			this.focused_items = {};
			var first = true;

			_.each(projects_to_focus, function(project) {
				this.focused_items[project.model.get("id")] = project;
				project.focus();
				if (first) { project.$el.velocity( "scroll", {container:this.$list, duration:1000, offset:-64, "easing":"easeInOut"}); first = !first; }
			}, this)

		}
	},

	unfocusProject:function(args) {

		var global_ids = ["paris", "grandparis", "valdemarne", "px"];

		if (global_ids.indexOf(args.id) < 0) {
			// Unfocus previously focused element
			this.focused_pop && this.focused_pop.unfocus();
			this.focused_item && this.focused_item.unfocus();
			this.focused_item && this.focused_item.$el.velocity("stop");
		} else {
			_.each(this.focused_items, function(focused_item) {
				focused_item.unfocus();
			})
		}

	},

	close:function() {

		this.$leftpanel.velocity("stop");
		this.focused_item && this.focused_item.$el.velocity("stop");
		this.focused_pop && this.focused_pop.$el.velocity("stop");

		_.each(this.ppv_collection.models, function(ppv) {
			ppv.close();
			ppv.remove();
		});

		_.each(this.ipv_collection.models, function(ipv) {
			ipv.close();
			ipv.remove();
		});

		this.stopListening();
	},

	updatePops:function() {
		this.$leftpanel.velocity("stop");
		this.focused_item && this.focused_item.$el.velocity("stop");
		this.focused_pop && this.focused_pop.$el.velocity("stop");

		_.each(this.ppv_collection.models, function(ppv) {
			ppv.close();
			ppv.remove();
		});
	}

});
var app = app || {};

app.PulseView = Backbone.View.extend({

	className: "pulse",

	initialize: function(options) {
		this.parent = options.parent;
		this.parms = _.pick(this.parent.model.attributes, "col", "sw");
	},

	// Render functions
	render: function() {
		this.renderPulse();
		return this;
	},

	renderPulse: function() {

		// TO DO : path to points function
		var path = this.parent.path,
			pupath = [],
			step = 10,
			len = path.getTotalLength(),
			l = 0;

		while(l < path.getTotalLength()) {
			var pos = path.getPointAtLength(l);
			pupath.push( {x:pos.x, y:pos.y} );
			l += step;
		}

		this.pulsePath = pupath;
		//////

		// var d = this.content.flowVolume.o4;
		var d = this.parms.sw;
		var offset = -Math.round(d/2);
		this.$el.css( {width:d,
							height:d,
							"margin-top":offset,
							"margin-left":offset,
							"background-color":this.parms.col
						} );

		// TO DO : animation function of the pulse

		function restart() {
			$.Velocity.RunSequence(seq);
		}

		var seq = [
			{ elements:this.$el, properties:{ top:pupath[0].y, left:pupath[0].x }, options:{ duration:0 } },
			{ elements:this.$el, properties:{ top:pupath[Math.floor((pupath.length-1)/4)].y, left:pupath[Math.floor((pupath.length-1)/4)].x }, options:{ duration:1000, easing:"linear" } },
			{ elements:this.$el, properties:{ top:pupath[Math.floor((pupath.length-1)/2)].y, left:pupath[Math.floor((pupath.length-1)/2)].x }, options:{ duration:1000, easing:"linear" } },
			{ elements:this.$el, properties:{ top:pupath[Math.floor(3*(pupath.length-1)/4)].y, left:pupath[Math.floor(3*(pupath.length-1)/4)].x }, options:{ duration:1000, easing:"linear" } },
			{ elements:this.$el, properties:{ top:pupath[pupath.length-1].y, left:pupath[pupath.length-1].x }, options:{ duration:1000, easing:"linear", complete:restart } },
		];

		$.Velocity.RunSequence(seq);

		return this;
	}

});
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
var app = app || {};

app.StartView = Backbone.View.extend({

	id:"start",

	template: _.template('\
  		<div id = "warning"><p><%= warningText %></p></div>\
		<div id = "backstart">\
			<div id = "rstart"></div>\
			<div id = "tstart">\
      			<h1><%= startTitle %></h1>\
      			<p><%= startText %></p>\
      			<div id = "launch"><p>Explorer</p></div>\
      			<div id = "demo"><p>Démo</p></div>\
    		</div>\
		</div>\
    	<div id = "foot_logos">\
      		<ul>\
        		<li><a href = "http://www.paris.fr/" target="_blank"><img src = "./data/graphics/logo-mdp.gif"/></a></li>\
      		</ul>\
    	</div>\
	'),

	events: {
		"click #launch": "launch",
		"click #demo": "demo",
		"mouseover #tstart": "addCircle"
	},

	initialize:function(options) {
		var ViewsCollection = Backbone.Collection.extend( {model:app.CircleView} );
		this.views_collection = new ViewsCollection();
	},

	// Render functions
	render: function(options) {
		this.$el.html( this.template( this.model.attributes ) );

		// this.$el.find("#demo").hide();

		options = options || {};
		this.adjustVertically(options);
		this.renderRaphael();
		return this;
	},

	adjustVertically:function(options) {
		var dz = options.dz || 0;
		if (dz < 0) {
			this.$el.addClass("up")
		} else if (dz > 0) {
			this.$el.addClass("down")
		} else {
			this.$el.addClass("middle")
		}
		return this;
	},

	renderRaphael:function() {
		var r_div = this.$el.find("#rstart");
		var r = Raphael(r_div[0], 800, 800);
		this.paper = r; 
		this.cx = 400, this.cy = 400;

		// Adds a circle randomly
		var t1 = Math.floor(500+Math.random()*500);
		var t2 = Math.floor(250+Math.random()*500);
		var self = this;
		this.clockAddCircle = setInterval(function() {self.addCircle();}, t1);
		this.clockKillCircle = setInterval(function() {self.killCircle();}, t2);
	},

	addCircle:function() {
		if (this.views_collection.models.length < 12) {
			var c = new app.Circle( {cx:this.cx, cy:this.cy} );
			var cv = this.views_collection.add( {model:c, paper:this.paper, circles:this.circles} );
			cv.render();
		}
	},

	killCircle:function() {
		if (this.views_collection.models.length > 0) {
			var n = Math.floor(this.views_collection.models.length*Math.random());
			var c = this.views_collection.at(n).close();
			this.views_collection.remove(c);
		}
	},

	stopAllListening:function() {
		this.stopListening();
	},

	// Removes all elements of the view
	close:function() {

		this.stopListening();

		clearInterval(this.clockAddCircle);
		clearInterval(this.clockKillCircle);

		_.each(this.views_collection.models, function(circle) {
			circle.close();
			circle.remove();
		})

		this.paper.remove();

	},

	transitionIn:function(options) {
		var callback = options.callback ? _.bind(this[options.callback], this) : function() {};
		this.$el.velocity( {top:"0%"}, {duration:1000, complete:callback} );
		$("#foot_logos").velocity("fadeIn", {duration:200});
	},

	transitionOut:function(options) {
		var dz = options.dz || 0, t = "0%";
		if (dz === 0) {
			options.callback();
			return;
		} else if (dz > 0) {
			t = "-100%";
		} else if (dz < 0) {
			t = "100%";
		}
		this.$el.velocity( {top:t}, {duration:1000, complete:options.callback} );
		$("#foot_logos").velocity("fadeOut", {duration:200});
	},

	// Interaction functions
	launch:function() {
		Backbone.trigger("route:buildGo", {change:"territory", id:"paris"});
	},

	demo:function() {
		Backbone.trigger("ui:demo");
	}

});

var app = app || {};

app.StoriesView = Backbone.View.extend({

	id:"footer",

	template: _.template('\
		<div id = "nav"><ul></ul></div>\
    	<div id = "title"><h2></h2><p></p></div>\
    	<div id = "story">\
      		<ul>\
        		<li id = "previous" class = "s_button"><span>Info précédente</span></li>\
        		<li id = "next" class = "s_button"><span>Plus d‘infos</span></li>\
        		<li id = "tcontainer"><p id = "s_text"></p></li>\
      		</ul>\
    	</div>\
	'),

	events: {
		"click #previous":"previous",
		"click #next":"next"
	},

	initialize: function(options) {

		this.listenTo(Backbone, "stories:go", this.go);

		var NavsViewsCollection = Backbone.Collection.extend( {model:app.NavView} );
		this.nv_collection = new NavsViewsCollection();

		this.i = -1;
		this.s = 0;

		//$('body').keyup(_.bind(utils.debounce(this.arrowKeyPressed, 150), this));

	},

	cacheComponents:function() {
		this.$title = this.$el.find("#title h2");
		this.$subtitle = this.$el.find("#title p");
		this.$text = this.$el.find("#s_text");
		this.$previous = this.$el.find("#previous");
		this.$next = this.$el.find("#next");
		this.$nav = this.$el.find("#nav ul");
		return this;
	},

	render:function() {

		this.renderContent()
		.cacheComponents()
		.renderNav()

		var self = this;
		_.defer(function() {self.attachButtons();});
		
		return this;
	},

	renderContent:function() {
		this.$el.html( this.template() );
		return this;
	},

	renderNav:function() {

		this.collection.each(function(story, index) {

			var nm = new Backbone.Model({id:index, title:story.get("title"), display_dot:story.get("display_dot")});
			var nv = this.nv_collection.add( {id:index, model:nm} );
			this.$nav.append( nv.render().el );
			_.defer(nv.renderClean)

		}, this);

		return this;
	},

	close:function() {
		_.each(this.nv_collection.models, function(nav) {nav.stopListening();nav.remove();})
		this.previous_b.remove();
		this.next_b.remove();
	},

	go:function(args) {
		var id = args.id === "last" ?  this.collection.models.length-1 : args.id;
		// Get the view list of the first story
		if (this.collection.models[id]) {
			var steps = this.collection.models[id].get("steps");
			steps.length > 1 && this.showNext();
			// Load the story
			this.injectContent(id, 0, 1);
			// Change the style of the nav button
			this.nv_collection.get(id).clk( {silent:true} );
		}
	},

nextStep:function(args) {

	var dir = args.dir;
	var steps = this.collection.models[this.i].get("steps");

		// Checks
		if ((this.s === 0 && dir === -1) ||
			(this.s === steps.length-1 && dir === 1))
			{return;}

		// Increment
		this.s = this.s + dir;
		var s = this.s;

		// Update buttons
		if (s === 0) {
			this.$previous.css( {display:"none"} );
			this.$next.css( {display:"inline-block"} );
		} else if (s > 0 && s < steps.length-1) {
			this.$previous.css( {display:"inline-block"} );
			this.$next.css( {display:"inline-block"} );
		} else {
			this.$next.css( {display:"none"} );
			this.$previous.css( {display:"inline-block"} );
		}

		this.injectContent(this.i, s, dir);

	},

	injectContent:function(i, s, dir) {

		// Inject content
		var self = this;
		this.i = i;
		var story = self.collection.models[i];
		var steps = dir === 1 ? story.get("steps") : story.get("b_steps");

		function inject() {
			return function() {
				self.$title.html(steps[s].subtitle);
				self.$text.html(steps[s].text.content);
			}
		}

		var disappear_title = {elements:this.$title, properties:{ opacity:0 }, options:{duration:200, complete:inject()} };
		var disappear_text = {elements:this.$text, properties:{ opacity:0 }, options:{duration:200, sequenceQueue:false} };
		var appear_title = {elements:this.$title, properties:{ opacity:1 }, options:{duration:200} };
		var appear_text = {elements:this.$text, properties:{ opacity:1 }, options:{duration:200, sequenceQueue:false} };

		$.Velocity.RunSequence([disappear_title, disappear_text, appear_title, appear_text]);

		// Animate the flows
		var step = steps[s], fs = step.flows, flen = fs.length;
		if (flen !== 0) {
			while (flen--) {
				(function(flen) {
					setTimeout(function() {

						var flows = fs[flen],
						type = flows.type,
						vl = flows.vl,
						hl = flows.hl,
						popups = flows.popups,
						year = flows.year === "o4" ? 1 : 2;
						scaling = flows.scaling,
						mt = flows.mt;

						Backbone.trigger("flows:nav", {vl:vl, hl:hl, popups:popups, time:year, scaling:scaling, mt:mt});
						Backbone.trigger("route:forceState", {state:{typeState:type, timeState:String(year)}});

					}, parseInt(fs[flen].time));})(flen)
				}
			}


		// Animate the items
		var step = steps[s], ts = step.territories, tlen = ts.length;
		if (tlen !== 0) {
			while (tlen--) {
				Backbone.trigger("items:animate", ts[tlen]);
			}
		}
	},

	attachButtons:function() {
		this.previous_b = new app.ButtonView( {model:app.instance.ui.b_collection.get("previous"), el:this.$previous} );
		this.next_b = new app.ButtonView( {model:app.instance.ui.b_collection.get("next"), el:this.$next} );
	},

	showNext:function() {
		this.$next.css( {display:"inline-block"} );
	},

	previous:function() {
		this.nextStep( {dir:-1} );
	},

	next:function() {
		this.nextStep( {dir:1} );
	},

	arrowKeyPressed:function(e) {
		var code = e.keyCode;
		if (code == 39 && $("#next").css("display") !== "none") {
			this.next();
		} else if (code == 37 && $("#previous").css("display") !== "none") {
			this.previous();
		}
	}

});
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

var app = app || {};

app.TerritoryView = Backbone.View.extend({

	id:"territory",

	template: _.template('\
		<div id = "leftpanel"></div>\
		<div id = "flowcontainer" class = "hidden"></div>\
  		<div id = "itemcontainer"><div id = "items"></div></div>\
  		<div id = "projectcontainer"></div>\
  		<div id = "popcontainer"></div>\
  		<div id = "storycontainer"></div>\
	'),

	initialize:function(options) {

		// Load intro if needed
		this.intro = options.intro;

		// Load core data of the view
		var data_url = this.model.get("data_url");
		var self = this;

		this.init_time = options.time;

		$.ajax({

			url:data_url,
      		data: { get_param: 'value' },
      		dataType: 'json',

      		success:function(data) {

				// Load Items
				var items = new Backbone.Collection(data.items);
				self.items_views = new app.ItemsView( {parent:self, collection:items} );
				self.items_number = items.length;

				// Load flows
				var flows = new Backbone.Collection(data.flows, {model:app.Flow});
				self.flows_views = new app.FlowsView( {parent:self, collection:flows, items_views:self.items_views} );

				// Load projects
				if (data.projects) {

					//Filter out hidden projects
    				var ps = _.filter(data.projects, function(p) {
      					return p.hidden !== true;
    				});

					var projects = new Backbone.Collection(ps);
					var showpanel = (self.model.get("id") === "projects");

					var p = {parent:self,
							 collection:projects,
							 items_views:self.items_views,
							 showpanel:showpanel,
							 focus_on_project:options.focus_on_project,
							 categoryState:options.categoryState};

					self.projects_views = new app.ProjectsView(p);
				}

				// Load stories
				var stories = new Backbone.Collection(data.stories[options.type]);//new app.StoryCollection(data.stories[options.type]);
				self.stories_views = new app.StoriesView( {collection:stories} );

				// Load view
				options.goto(self);

			}

		});

		this.listenTo(Backbone, "item:loaded", this.itemsCountDown);
		this.listenTo(Backbone, "territory:updateProjects", this.updateProjects);

	},

	updateProjects:function() {
		this.projects_views && this.$projectcontainer.append( this.projects_views.el );
	},

	itemsCountDown:function() {

		this.items_number--;

		if (this.items_number == 0) {

			this.projects_views && this.$projectcontainer.append( this.projects_views.render().el );

			Backbone.trigger("stories:go", {id:0});

			if (this.intro) {
				var iv = new app.IntroView();
				$("body").append( iv.render().el );
				iv.$back.velocity({opacity:0.6}, {duration:300, delay:750});
				this.iv = iv;
			}

			this.$storycontainer.velocity("fadeIn", {duration:300, delay:200});
			this.$flowcontainer.velocity("fadeIn", {duration:300, delay:200});
			this.$popcontainer.velocity("fadeIn", {duration:300, delay:200});
			$("#flowscale").velocity("fadeIn", {duration:300, delay:200});
		}


	},

	// Render functions
	render: function(options) {

		options = options || {};
		this.adjustVertically(options);

		this.$el.html( this.template() );

		this.$itemcontainer = this.$el.find("#itemcontainer");
		this.$items = this.$el.find("#items");
		this.$flowcontainer = this.$el.find("#flowcontainer");
		this.$projectcontainer = this.$el.find("#projectcontainer");
		this.$storycontainer = this.$el.find("#storycontainer");
		this.$popcontainer = this.$el.find("#popcontainer");

		this.items_views.render();
		this.$storycontainer.append( this.stories_views.render().el );

		return this;
	},

	adjustVertically:function(options) {
		var dz = options.dz || 0;
		if (dz < 0) {
			this.$el.addClass("up")
		} else if (dz > 0) {
			this.$el.addClass("down")
		} else {
			this.$el.addClass("middle")
		}
		return this;
	},

	stopAllListening:function() {
		// items:loaded listener
		this.stopListening();

		// items:animate listener
		this.items_views.stopListening();

		// Zoom handler
		if(this.$itemcontainer.panzoom()) {this.$itemcontainer.panzoom("destroy")}

		// flows:children flows:parent flows:changeYear flows:nav listeners
		this.flows_views.stopListening();

		// stories:go listener
		this.stories_views.stopListening();

		// project:focus projetc:unfocus listener
		this.projects_views && this.projects_views.stopListening();

		this.iv && this.iv.stopListening();
	},

	// Removes all elements of the view
	close:function() {

		this.items_views.close();
		this.flows_views.close();
		this.stories_views.close();
		
		this.items_views.remove();
		this.flows_views.remove();
		this.stories_views.remove();

		if (this.projects_views) {
			this.projects_views.close();
			this.projects_views.remove();
		}

		this.iv && this.iv.close();

		this.stopListening();
	},

	transitionIn:function(options) {

		var self = this;
		var callback = function() {
			// self.$storycontainer.velocity("fadeIn", {duration:300});
			// self.$flowcontainer.velocity("fadeIn", {duration:300});
		}

		this.$itemcontainer.velocity("fadeIn", {duration:300});
		// this.$storycontainer.velocity("fadeIn", {duration:300});
		// this.$flowcontainer.velocity("fadeIn", {duration:300});
		// this.$popcontainer.velocity("fadeIn", {duration:300});

		this.$el.velocity( {top:"0%"}, {duration:1000, complete:callback} );
	},

	transitionOut:function(options) {

		this.$itemcontainer.velocity("fadeOut", {duration:300, delay:300});
		this.$storycontainer.velocity("fadeOut", {duration:300, delay:300});
		this.$flowcontainer.velocity("fadeOut", {duration:300, delay:300});
		this.$popcontainer.velocity("fadeOut", {duration:300, delay:300});

		if (this.projects_views) {
			this.projects_views.exitPanel();
		}

		var dz = options.dz || 0, t = "0%";
		if (dz === 0) {
			options.callback();
			return;
		} else if (dz > 0) {
			t = "-100%";
		} else if (dz < 0) {
			t = "100%";
		}
		this.$el.velocity( {top:t}, {duration:1000, complete:options.callback} );

	}

});

var app = app || {};

app.UIView = Backbone.View.extend({

	el: "#ui",

  events:{
    "click #share":"popShare",
    "click #expand":"expandFlows",
    "click #contract":"contractFlows",
    "click #about_b": "about"
  },

  initialize:function(parent, options) {

    this.parent = parent;

    this.buttons = {};

    this.b_collection = new Backbone.Collection();

    this.listenTo(this.b_collection, 'add', this.addButton);
    this.b_collection.add(options.init);

    this.listenTo(Backbone, "ui:route", this.updateButtons);
    this.listenTo(Backbone, "ui:clickRadio", this.clickRadio);
    this.listenTo(Backbone, "ui:scale", this.updateScale);
    this.listenTo(Backbone, "ui:demo", this.demo);
    this.listenTo(Backbone, "ui:closeDemo", this.unloadDemo);

    this.renderScale();

    $("#share").on("click", _.bind(this.popShare, this));
    $("#expand").on("click", _.bind(this.expandFlows, this));
    $("#contract").on("click", _.bind(this.contractFlows, this));
    $("#about_b").on("click", _.bind(this.about, this));

    _.bindAll(this, "about", "unloadAbout", "demo", "unloadDemo");

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
        $("#fs_text").hide();

      } else if (!args.virtual) {

        $("#legend").velocity("fadeIn", {duration:200, display:"block", delay:1000});

        $("#fs_container").show();
        $("#fs_text").show();
        $("#fs_container div").css({height:hscale + 10})
        this.Rscale.attr({path:["M",30,hscale+5,"H",25,"V",5,"H",30], "stroke-width":3, "stroke":"#ccc"});
        $("#legend #fs_text p").html(utils.formatVolume(vscale, " ") + " " + args.unit);

      }

    },

    addButton:function(button) {
      if ($(button.get("el")).length > 0) {
        this.buttons[button.get("id")] = new app.ButtonView( {model:button, el:$(button.get("el"))} );
      }
    },

    showButtons:function(next, delay) {

      args = next.model ? next.model.get("ui_elements") : next;
      next = next.model ? next : this.parent.currentPage;

      var d = delay || 0;

      $("#legend").velocity("fadeOut", {duration:200});

      // Hide every button
      _.each(this.buttons, function(value) {
        var sc = value.model.get("show_class");
        value.$el.velocity("fadeOut", {duration:200})
      })

      // Reset the zoom
      next.$itemcontainer && next.$itemcontainer.panzoom("destroy");
      $("#zoom").find(".zoom-range").off();
      $("#zoom").find(".zoom-range").val(50);

      this.p_showed_buttons = this.showed_buttons;
      this.showed_buttons = args;

      var len = args.length;

      while(len--) {
        var bv = this.buttons[args[len]];
        var sc = bv.model.get("show_class");
        this.buttons[args[len]].$el.velocity("fadeIn", {display:sc, duration:200, delay:d});

        if (args[len] == "zoom") {

          var pz = next.$itemcontainer.panzoom();
          var self = this;
          self.startZoom = $("#zoom").find(".zoom-range").val();

          $("#zoom").find(".zoom-range").on("mousedown", function( e ) {
            self.startZoom = this.value*1;
          })

          $("#zoom").find(".zoom-range").on("mouseup", function( e ) {

            var delta = self.startZoom - this.value;
            self.startZoom = this.value;
            var zoomOut = (delta > 0);

            lpw = $("#leftpanel").width()
            ws = utils.getWindowSize();
            ws = {clientX: (lpw*0.5+ws.w*0.5), clientY:ws.h*0.5};

            pz.panzoom("zoom", zoomOut, {
              increment:Math.abs(delta)/100,
              animate:true,
              focal:ws
            });

            mat = pz.panzoom("getMatrix").input;
            Backbone.trigger("items:updatePositions", {mat:mat, ws:ws});
            Backbone.trigger("projects:updatePositions", {mat:mat, ws:ws});

          })
        } 
      }

      //$("#topright").velocity("fadeIn", {duration:350});
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

      // $("#trend_legend").removeClass("show_h");

    // Target state : 2012/Tendances ?
    if (state.timeState === "2") {

      // Move toggle on the right
      $toggle.addClass("toggle-right");

      // Change span content and display legend if needed
      if (state.typeState === "matter") {
        $label.html("2014");
        // $("#trend_legend").addClass("show_h");
      } else if (state.typeState === "energy") {
        $label.html("2014");
      } else {
        $label.html("2015");
      }

    // Else move toggle on the left and hide legend
  } else {
    $toggle.removeClass("toggle-right");

      // Change span content and display legend if needed
      if (state.typeState === "matter") {
        $label.html("2003");
      } else {
        $label.html("2004");
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

  about:function() {

    // Store all buttons shown, then hide all buttons of the ui
    this.showButtons(["about"]);

    // Toggle the X to exit the modal
    this.toggleX();

    // Create the view
    this.about_view = new app.AboutView();
    this.$el.first().append(this.about_view.render().el);

    // Bind the close call to the x button
    $("#about_b").off("click");
    $("#about_b").on("click", _.bind(this.unloadAbout, this));

  },

  unloadAbout:function() {

    this.showButtons(this.p_showed_buttons);

    this.toggleX();

    this.about_view.close();
    
    $("html, body").scrollTop(0);
    $("body").removeClass("scrollable");

    $("#about_b").off("click");
    $("#about_b").on("click", _.bind(this.about, this));

  },

  demo:function() {
    this.demo_view = new app.DemoView();
    this.$el.append(this.demo_view.render().el);
  },

  unloadDemo:function() {
    this.demo_view.close();
    this.demo_view.remove();
  },

  expandFlows:function() {
    // Broadcast a expand event for the flows view to catch
    Backbone.trigger("flows:expand", {type:app.instance.router.state.typeState});
  },

  contractFlows:function() {
    // Broadcast a contract event for the flows view to catch
    Backbone.trigger("flows:contract", {type:app.instance.router.state.typeState});
  }

});