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