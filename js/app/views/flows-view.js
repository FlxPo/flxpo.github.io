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
		this.offsetFlows( {target_flows:vl_models, ref_from:args.ref_from, ref_to:args.ref_to, ref_recy:args.ref_recy, ref_extr:args.ref_extr, ref_wast:args.ref_wast} );

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
				// type === "input" ? utils.mergeSort(flows, _.bind(self.masterInputSort, self)) : utils.mergeSort(flows, _.bind(self.masterOutputSort, self));
				
				flows = utils.mergeSort(flows, _.bind(self.idSort, self));
				flows = utils.mergeSort(flows, _.bind(self.volumeSort, self));
				// console.log(flows)

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
		// console.log(b_id + " " + a_id + " " + r);
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

		console.log(b_id + " " + b_type + " " + a_id + " " + a_type + " " + r);
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

		console.log(b_id + " " + b_type + " " + a_id + " " + a_type + " " + r);
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

		var sub_level = [];
		_.each(this.views_collection.models, function(flow) {console.log(flow.id);if (flow.id != args.parentid && flow.model.get("level") !== pm_level && flow.model.get("type") === pm_type) hl.push(flow.id)})

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