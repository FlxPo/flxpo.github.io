var app = app || {};

app.CircleView = Backbone.View.extend({

	initialize:function(options) {
		this.paper = options.paper;
		// this.circles = options.circles;
		// this.index = options.circles.length;
	},

	// Render functions
	render: function(options) {

		// Load the attributes of the circle and append the circle to the canvas
		var m = this.model.toJSON();
		var path = this.paper.path();
		path.attr({path:["M", m.x, m.y-m.rad, "A", m.rad, m.rad, 0,1,1,m.x-0.1, m.y-m.rad, "Z"], stroke:m.col, 'stroke-width':m.sw, opacity:m.op});
		path.toBack();
		this.path = path;

		// Load pulse
		// this.pulse = new app.PulseView( {parent:this} )

		// Launch
		// this.pulse.render();
		// $("#appcontainer").append(this.pulse.el)
		this.transitionIn();
		// this.transitionOut();
	},

	transitionIn:function() {
		var m = this.model.toJSON();
		this.path.animate({transform:["s",4,4, m.x, m.y], 'stroke-width': m.sw}, 400 + Math.round(Math.random()*400), "elastic");
	},

	transitionOut:function() {

		// var path = this.path;
		// var m = this.model.toJSON();

		// // When the path disappears, remove the DOM element, remove the list item
		// var closeOnComplete = function() {
		// 	// return function() {
		// 		this.path.remove();
		// 		// this.pulse.remove();
		// 		this.circles.splice(self.index, 1);
		// 		this.remove();
		// }
		// var callback = _.bind(closeOnComplete, this);

		// // Kill the path after a random amount of time
		// setTimeout(function() {
		// 			var t = 400 + Math.floor(Math.random()*400);
		// 			path.animate( {transform:["s",0.5,0.5, m.x, m.y]}, t, "ease-in", callback);
		// }, Math.floor(Math.random()*4000));

	},

	close:function() {

		var closeOnComplete = function() {
			this.path.remove();
			this.stopListening();
			delete this.$el;
			delete this.el;
		}

		var m = this.model.toJSON();
		var t = 500 + Math.floor(Math.random()*500);
		this.path.animate( {transform:["s",0.5,0.5, m.x, m.y]}, t, "ease-in", _.bind(closeOnComplete, this));
	
		return this;


	}

});
