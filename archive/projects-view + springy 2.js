var app = app || {};

app.ProjectsView = Backbone.View.extend({

	events:{
		// "mouseover":"over"
	},

	initialize:function(options) {

		this.items_views = options.items_views.views;

		var PopProjectsViewsCollection = Backbone.Collection.extend( {model:app.PopProjectView} );
		this.ppv_collection = new PopProjectsViewsCollection();

		// this.once("mouseover", this.over);

	},

	render:function() {
		this.renderContent()
			// .springy();
		return this;
	},

	renderContent:function() {

		this.collection.each(function(project, index) {
			var pv = this.ppv_collection.add( {id:project.get("id"), model:project, item:this.items_views[project.get("territory")]} );
			this.$el.append( pv.render().el );
			_.defer(pv.renderClean);
		}, this);

		return this;
	},

	over:function() {
		if (!this.springing) {
			this.springy();
			this.springing = true;
		}
	},

	springy:function() {

		// make a new graph
		var graph = new Springy.Graph();

		// make some nodes
		var nodes = [];
		var ref_node = null;
		this.pv_collection.each(function(project, index) {
			if (project.model.get("type") === "global") {
				var n = graph.newNode({label: index, pin:project});
				nodes.push(n);
				if (project.model.get("id") === "p3") {
					n.data.mass = 100;
					ref_node = n;
				}
			}
		})

		// Get reference coordinates
		var xref = parseFloat(ref_node.data.pin.$el.css("left"));
		var yref = parseFloat(ref_node.data.pin.$el.css("top"));

		_.each(nodes, function(node) {
			node.data.pos = {x:(parseFloat(node.data.pin.$el.css("left"))-xref)/30,
							y:(parseFloat(node.data.pin.$el.css("top"))-yref)/30}
		});

		// Reposition raphael canvas
		// this.$rcanvas.css( {left:xref-400} );
		var r = this.r;

		var layout = new Springy.Layout.ForceDirected(graph, 4000, 10000, 0.01);

		// connect them with an edge
		var edges = [];
		// _.each(nodes, function(node1) {
		// 	_.each(nodes, function(node2) {
		// 		if (node1.id !== node2.id) {
		// 			var exist = false;
		// 			_.each(edges, function(edge) {
		// 				if (edge.node1 === node2.id && edge.node2 === node1.id) {
		// 					exist = true;
		// 				}
		// 			})
		// 			if (!exist) {
		// 				var p = r.path();
		// 				graph.newEdge(node1, node2, p);
		// 				edges.push({node1:node1.id, node2:node2.id})
		// 			}
		// 		}
		// 	});
		// })

			_.each(nodes, function(node) {
				if (node.id !== "p3") {
					var p = r.path().attr({"stroke-dasharray":"-", stroke:"#ddd", "stroke-width":2});
					graph.newEdge(ref_node, node, p);
					edges.push({node1:ref_node.id, node2:node.id})
				}
			});



		var renderer = new Springy.Renderer(layout,
			function clear() {
			},
			function drawEdge(edge, p1, p2) {
				edge.data.attr( {path:["M",edge.source.data.x-7.5,edge.source.data.y-7.5,"L",edge.target.data.x-7.5,edge.target.data.y-7.5]} )
			},
			function drawNode(node, p) {
				var pin = node.data.pin;
				if (pin.model.get("id") !== "p3") {
					var dy = yref + p.y*30;
					var dx = xref + p.x*30;
					
					// Constrain
					if (dy - yref > 0) {dy = yref}
					if (dy < 75) {dy = 75;}

					// var ddy = dy-yref, ddx = dx-xref;
					// var dist = Math.sqrt(ddy*ddy + ddx*ddx);
					// if (dist < 30) {
					// 	dx = node.data.x;
					// 	dy = node.data.y;
					// }

					pin.$el.velocity( {top:dy, left:dx}, {duration:0} );
					node.data.x = dx;
					node.data.y = dy;
				} else {
					p.x = 0;
					p.y = 0;
					node.data.x = xref;
					node.data.y = yref;
				}
			}
			);

		renderer.start();

		return this;
	}

});