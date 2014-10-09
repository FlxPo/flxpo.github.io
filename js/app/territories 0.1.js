// ------------------------------------------------------------------------------------

function Territories(app, target_slide, rmiddle, data, ws, final_callback) {

	this.app = app;
	app.territories = this;

	this.r = rmiddle;
	this.list = {};

	this.loadTerritories = function(data, ws) {
		var ts = data;
		var w = ws.w, h = ws.h;
		for (var i = 0, n = ts.length; i < n; i++) {
			var t = new Territory(	this.r,
									ts[i].name,
									ts[i].id,
									eval(ts[i].x),
									eval(ts[i].y),
									eval(ts[i].iw),
									eval(ts[i].ih),
									eval(ts[i].f_anchor_x),
									eval(ts[i].f_anchor_y),
									eval(ts[i].scale),
									ts[i].solution);
			this.list[ts[i].name] = t;
			//If a geometry has to be drawn

			if (ts[i].geom != "undefined") {
				if (i < n-1) {t.loadGeometry(this.app.online, ts[i].geom, t.display(target_slide).bind(t));}
				else {t.loadGeometry(this.app.online, ts[i].geom, t.display(target_slide, final_callback).bind(t));}
			}
		}
	}

	this.setOffsets = function(flows) {
		for (key in this.list) {
			this.list[key].setOffsets(this.list, flows.list);
		}
	}

	this.displayTerritories = function(view_list) {
		for (var i = 0; i < view_list.length; i++) {
			var k = view_list[i];
			this.list[k].appear();
		}
	}

	this.hideAll = function() {
		for (key in this.list) {
			if (this.list.hasOwnProperty(key)) {
				this.list[key].disappear();
			}
		}
	}

	// this.unmessify = function() {
	// 	for (key in this.list) {
	// 		if (this.list.hasOwnProperty(key) && key !== "left" && key !== "right") {
	// 			this.list[key].unmessify();
	// 		}
	// 	}
	// }


	this.loadTerritories(data, ws);
}


// ------------------------------------------------------------------------------------

function Territory(r, name, id, x, y, iw, ih, fax, fay, scale, solution) {
	this.r = r;

	this.name = name;
	this.id = id;
	this.x = x;
	this.y = y;

	this.solution = solution;

	this.iw = iw;
	this.ih = ih;
	this.fax = fax;
	this.fay = fay;
	this.f_anchor_x = fax ? 0 : x;
	this.f_anchor_y = fay ? 0 : y;
	this.projects = {};

	this.w = 0;
	this.h = 0;
	this.divw = 0;
	this.divh = 0;
	this.width = 0;
	this.height = 0;
	this.X = 0;
	this.Y = 0;

	this.scale = scale;

	this.inflows = {};
	this.outflows = {};
	this.inoffsets = [];
	this.outoffsets= [];

	this.polys = r.set();
	this.tip = r.set();

	this.bbox = null;
	this.ground = null;

	this.ellipse = null;

	this.container = null;
}


Territory.prototype.loadGeometry = function(online, target, callback) {
	var path = "./data/graphics/" + target;
	getData(online, path, callback);

	// For offline use
	// target = target.slice(0, -4);
	// callback(target)
}

Territory.prototype.appear = function() {
	this.container.show();
	// $("#content #middle #"+ this.id + ">p").show();
	this.updateTip();
}

Territory.prototype.followWindow = function() {
	var ws = getWindowSize();
	var ds = getDivSize("paris");
	// this.x = this.name == "left" ? 0 - (ws.w-ds)/2 : ws.w;
	// for (var key in this.outflows) {this.outflows[key].updateFlowPath();}
}

Territory.prototype.disappear = function() {
	this.container.hide();
}

Territory.prototype.transform = function(parms) {
	var ws = getWindowSize();
	var w = ws.w, h = ws.h;

	this.x = eval(parms.x);
	this.y = eval(parms.y);

	var l = this.x - this.w/2;
	var t= this.y - this.h;

	this.container.velocity({left:l, top:t}, eval(parms.time));
}

Territory.prototype.translate = function(parms) {
	var ws = getWindowSize();
	var w = ws.w, h = ws.h;
	this.container.animate({left:eval(parms.x) - this.w/2, top:eval(parms.y) - this.h/2}, parseInt(parms.time));

	this.x = eval(parms.x);
	this.y = eval(parms.y);

	this.f_anchor_x = this.x+this.fax*this.w;
	this.f_anchor_y = this.y+this.fay*this.h;

}

Territory.prototype.updateBBox = function(x, y) {
	this.x = this.x + x;
	this.y = this.y + y;
}

Territory.prototype.hideGround = function() {
	for (var i = 0; i < this.polys.length; i++) {
		if (this.polys[i].attr('fill') === "#89807D") {
			this.polys[i].hide();
		}
	}
}


Territory.prototype.showGround = function() {
	for (var i = 0; i < this.polys.length; i++) {
		if (this.polys[i].attr('fill') === "#89807D") {
			this.polys[i].show();
		}
	}
}

Territory.prototype.showTip = function() {
	this.tip.show();
	$("#content #middle #"+ this.id + " p").show();
}

Territory.prototype.hideTip = function() {
	this.tip.hide();
	$("#content #middle #"+ this.id + " p").hide();
}


Territory.prototype.display = function(target_slide, callback) {

	var self = this;


	return function(data) {

	// var r = this.r;
	var html = "<div id = \"" + this.id + "\" class = \"territory\"></div>";

	$(html).appendTo($(target_slide + " #middle"));
	var container = $(target_slide + " #middle #"+ this.id);

	//Create the raphael canvas to draw on according to current window size
	var ws = getWindowSize();
	var w = ws.w, h = ws.h;
	this.divw = w;
	this.divh = h;

	//Compute necessary transformations to reach target size and location
	var scaling = Math.sqrt(w/data.width*this.scale);

	var xw = this.x - data.width/2 * scaling * scaling;
	var yh = this.y - data.height/2 * scaling * scaling;

	this.w = data.width*scaling*scaling;
	this.h = data.height*scaling*scaling;

	// Create the canvas
	var r = Raphael(container[0], this.w + 75, this.h + 50);
	this.r = r;

	$("svg", container).css({position:"absolute"})

	//Load the geometry in a set
	r.setStart();
	r.add(data.geometry);
	var polys = r.setFinish();

	//Apply transforms and store the bounding box
	polys.transform(["t", -data.dx, -data.dy]);
	polys.transform(["...S", scaling, scaling, 0, 0]);

	container.css({left:xw, top:yh})
	this.container = container;

	//Add the ellipse to intercept mouse events
	// var ell = r.ellipse(this.x, this.y, this.w/2, this.h/2).attr({fill:"#FFFFFF", opacity:0}).toFront();
	// this.ellipse = ell;
	// polys.push(ell);

	//Store the geometry and its bounding box
	this.polys = polys;
	// this.polys.hide();

	this.width = this.w;
	this.height = this.h;
	this.X = this.x;
	this.Y = this.y;

	this.f_anchor_x = this.x+this.fax*this.w;
	this.f_anchor_y = this.y+this.fay*this.h;


	// Create the solution effect
	if (this.solution) {
		var s = Raphael(container[0], this.w*1.3, this.h*1.5);
		$("svg", container).css({position:"absolute"})
		container.children().first().css({top: -this.h*0.25, left:-this.w*0.15})

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

		container.children().first().velocity({opacity:0}, {loop:true})

	}


	if (!(typeof data == "undefined")) {
		this.displayTip(target_slide);
		// this.tip.hide();
	}

	if (typeof callback == "function") {
			callback();
	}

	}
	
}

Territory.prototype.updateCRS = function() {
	for (var key in this.inflows) {
		var f = this.inflows[key];
		if (!f.is_zero) {
			f.adaptFlowPath(false);
			f.popup.adaptSizePosition();
		}
	}
	for (var key in this.outflows) {
		var f = this.outflows[key];
		if (!f.is_zero) {
			f.adaptFlowPath(false);
			f.popup.adaptSizePosition();
		}
	}
}


Territory.prototype.displayTip = function(target_slide) {

	var r = this.r;
	var x = this.w/2;
	var y = this.h*0.95;
	var e = 20;
	var xoff = 40;

	var pp = r.path(["M", x - xoff, y + e,
		"L", x, y,
		"L", x - xoff/2, y + e,
		"Z"]).hide();
	pp.attr({"stroke-width":0, fill:"#D8D8D9"})
	this.tip.push(pp);

	var container = $(target_slide + " #middle #"+ this.id);
	$("<p>"+this.name+"</p>").appendTo(container);
	$("p", container).css({top:0.95*this.h  + 20,left:this.w/2 - 40})

	// if (this.solution) $("p", container).css({"background-color":"#FFC633"})
		this.tip.show();

	// p.attr({width:$("p", container).width()+20});
}

Territory.prototype.updateTip = function() {
	// var container = $(target_slide + " #middle #"+ this.id);
	// p.attr({width:$("p", container).width()+20});
}

Territory.prototype.updateTipScale = function(ds) {
	// var x = this.x;
	// var corry = 0;
	// if (this.name === "Paris") {corry = -this.h/20;}
	// var y = this.y + this.h/2 + corry;
	// this.tip.transform(["...S", 1-2*ds, 1-2*ds, x, y]);
}

//Calculates the offset necessary for edges not to overlap
Territory.prototype.setOffsets = function(territories, flows) {

	var inflows = this.inflows;
	var outflows = this.outflows;
	var x = this.x;
	var y = this.y;

	var inoff = [];
	var outoff = [];
	var extr = [];
	var recy = [];
	var wast = [];

	for(var key in inflows) {
		if (inflows.hasOwnProperty(key)) {

		var inflow = inflows[key];
		var territory = territories[inflow.from];
		var angle = Math.atan2(- territory.y + y, territory.x - x);
		if (angle > 0) {
			angle = 2*3.14 - angle;
		} else {
			angle = - angle;
		}

		if (territory.y === y & territory.x === x) {
			angle = -1;
		}

		if (inflow.type === "extraction") {angle = 1000; extr.push({id: key, volume: inflow.scaled_volume, offset:0, si:inflow.siblings, type:inflow.type});}
		if (inflow.type === "recyclage") {recy.push({id: key, volume: inflow.scaled_volume, offset:0, si:inflow.siblings, type:inflow.type});}
		if (inflow.type !== "waste") {inoff.push({id: key, volume: inflow.scaled_volume, ang: angle, si:inflow.siblings, type:inflow.type});}
	
		}
	}

	for(var key in outflows) {
		if (outflows.hasOwnProperty(key)) {

		var outflow = outflows[key];
		var territory = territories[outflow.to];
		var angle = Math.atan2(- territory.y + y, territory.x - x);
		if (angle > 0) {
			angle = 3.14 + angle;
		} else {
			angle = angle + 3.14;
		}
		if (territory.y == y & territory.x == x) {
			angle = -1;
		}

		if (outflow.type === "waste") {angle = 1000; wast.push({id: key, volume: outflow.scaled_volume, offset:0, si:outflow.siblings, type:outflow.type});}
		if (outflow.type !== "extraction") {outoff.push({id: key, volume: outflow.scaled_volume, ang: angle, si:outflow.siblings, type:outflow.type});}
	
		}
	}

	// Sort by angle, then id
	var outsort = function(a,b) {
		if (a.ang != 0) {
			if (Math.abs(b.ang - a.ang) < 0.01) {
				return (parseInt(b.id) - parseInt(a.id));
			} else {
				return -(a.ang - b.ang);
			}
		} else {
			return 1;
		}
	};

	var insort = function(a,b) {
		if (a.ang != 0) {
			if (Math.abs(b.ang - a.ang) < 0.01) {
				var id_diff = parseInt(b.id) - parseInt(a.id);
				return id_diff;
			} else {
				return +(b.ang - a.ang);
			}
		} else {
			return 1;
		}
	};

	var volsort = function(a, b) {
		var sib = areSiblings(a,b);
		if (sib) {
			var sib_diff = - a.volume + b.volume
			return sib_diff;
		} else {
			return 0;
		}
	}

	// Sorting by angle and id
	inoff.sort(insort);
	outoff.sort(outsort);

	// Sorting by volume amongst siblings
	inoff.sort(volsort);
	outoff.sort(volsort);

	var inlen = inoff.length;
	var outlen = outoff.length;

	var insum = 0;
	var outsum = 0;

	for(var i = 0; i < inlen; i++) {
		var ino = inoff[i];
		ino.offset = insum + ino.volume/2;
		insum += ino.volume;
	}

	for(var i = 0; i < outlen; i++) {
		var outo = outoff[i];
		outo.offset = outsum + outo.volume/2;
		outsum += outo.volume;
	}

	for(var i = 0; i < inlen; i++) {
		flows[inoff[i].id].offsetto = inoff[i].offset - insum/2;
		flows[inoff[i].id].angto = Math.round(inoff[i].ang* 180 / 3.14 * 100)/100;
	}

	for(var i = 0; i < outlen; i++) {
		flows[outoff[i].id].offsetfrom = outoff[i].offset - outsum/2;
		flows[outoff[i].id].angfrom = Math.round(outoff[i].ang* 180 / 3.14 * 100)/100;
	}

	// Get sum of recycling flows
	var recylen = recy.length, i = recylen, recysum = 0;
	while(i--) {recy[i].offset = recysum + recy[i].volume/2; recysum += recy[i].volume;} i = recylen;
	while(i--) {flows[recy[i].id].offsetrecy = recy[i].offset - recysum/2}

	// Get sum of waste flows
	var wastlen = wast.length, i = wastlen, wastsum = 0;
	while(i--) {wast[i].offset = wastsum + wast[i].volume/2; wastsum += wast[i].volume;} i = wastlen;
	while(i--) {flows[wast[i].id].offsetwast = wast[i].offset - wastsum/2}

	// Get sum of extraction flows
	var extrlen = extr.length, i = extrlen, extrsum = 0;
	while(i--) {extr[i].offset = extrsum + extr[i].volume/2; extrsum += extr[i].volume;} i = extrlen;
	while(i--) {flows[extr[i].id].offsetextr = extr[i].offset - extrsum/2}

	for(var i = 0; i < outlen; i++) {
		outoff[i].offset -= outsum/2;
		flows[outoff[i].id].offsetfrom = outoff[i].offset;
		flows[outoff[i].id].angfrom = Math.round(outoff[i].ang* 180 / 3.14 * 100)/100;
	}


	
	this.inoffsets = inoff;
	this.outoffsets = outoff;
}


// Territory.prototype.unmessify = function() {

// 	// Input Flows
// 	var inflows = this.inflows;
// 	var a_inflows = [];

// 	// Store in array
// 	for (var key in inflows) {
// 		if (inflows.hasOwnProperty(key) && inflows[key].type === "input") {
// 			a_inflows.push({id:key, pos:inflows[key].popup.pos, path:inflows[key].pulsepath});
// 		}
// 	}
// 	var t = 0
// 	var steps = 10;
// 	while (steps--) {

// 	// For each flow label
// 	var i = a_inflows.length;
// 	while(i-- && !a_inflows[i].pos.zero) {

// 		var xr_bound = inflows[a_inflows[i].id].tto.x - inflows[a_inflows[i].id].tto.w/2 - 25;
// 		var xl_bound = inflows[a_inflows[i].id].tfrom.x + inflows[a_inflows[i].id].tfrom.w/2 + 50;

// 		// console.log(xl_bound + " " + xr_bound)

// 		var f1 = a_inflows[i].pos;
// 		var DX = 0, DY = 0, s = 0;

// 		//---------------------------------------------------------
// 		// Look for overlap with other flow labels
// 		var j = a_inflows.length;
// 		while(j--) {
// 			//-----------------------------------------------------
// 			if (i !== j && !a_inflows[j].pos.zero) {
// 				var f2 = a_inflows[j].pos;
// 				// Test overlap
// 				var dx = (f1.w+f2.w + 25)/2 - Math.abs(f1.x - f2.x);
// 				var dy = (f1.h+f2.h + 50)/2 - Math.abs(f1.y - f2.y);
				
// 				var overlap = (dx > 0) && (dy > 0);
// 				// Add dx, dy to displacement vector
// 				if (overlap) {
// 					var dirx = Math.sign(f1.x - f2.x);
// 					var diry = Math.sign(f1.y - f2.y);
// 					s = 1
// 					DX = DX + dirx * dx/s;
// 					DY = DY + diry * dy/s;
// 				}
// 			}//-----------------------------------------------------
// 		} //--------------------------------------------------------
	
// 		var k = a_inflows[i].pos.anchor;

// 		if (DX !== 0 || DY !== 0) {

// 		// Resulting unconstrained position
// 		var X = a_inflows[i].pos.x + DX/s;
// 		var Y = a_inflows[i].pos.y + DY/s;

// 		// Look for the nearest flow path anchor
// 		var dir = Math.sign(DX);
// 		var d1 = 2;
// 		var d2 = 1;

// 		while (d2 < d1 && (a_inflows[i].path[k].x - a_inflows[i].pos.w/2 > xl_bound) && (a_inflows[i].path[k].x < xr_bound)) {
// 			k = k + dir;
// 			d1 = d2;
// 			var dpx = X - a_inflows[i].path[k].x;
// 			var dpy = Y - a_inflows[i].path[k].y;
// 			d2 = Math.sqrt(dpx*dpx + dpy*dpy);
// 		}

// 		a_inflows[i].pos.anchor = k;
// 		a_inflows[i].pos.x = a_inflows[i].path[k].x - a_inflows[i].pos.hc;
// 		a_inflows[i].pos.y = a_inflows[i].path[k].y - a_inflows[i].pos.hc;
// 		}

// 		// Store results whan last step is reached and update positioning
// 		if (steps === 0) {
// 			inflows[a_inflows[i].id].popup.base.css({top:a_inflows[i].path[k].y - a_inflows[i].pos.hc, left:a_inflows[i].path[k].x - a_inflows[i].pos.hc});
// 			inflows[a_inflows[i].id].midX = a_inflows[i].pos.x;
// 			inflows[a_inflows[i].id].midY = a_inflows[i].pos.y;
// 		}

// 	}
// 	}
// }