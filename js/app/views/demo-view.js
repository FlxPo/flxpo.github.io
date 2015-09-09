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
