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