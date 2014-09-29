function Flows(app, rback, data, callback) {

	this.r = rback;

	this.territories = app.territories;

	this.app = app;
	app.flows = this;

	this.list = {};
	this.year = "o4";
	this.scale;

	this.title = null;
	this.story = [];

	this.scale_legend = null;
	this.data = {};

	this.anim_trends = false;

	this.popflows_container = $("#flows");
	this.poptrends_container = $("#trends");

	this.root_list = { matter:[], energy:[], water:[] };
	this.leaf_list = { matter:[], energy:[], water:[] };

	this.loadData = function(data) {

		// Prepare stacks
		this.stacks = new Stacks();

		// Store the flows
		var i = 0, ii = data.length;
		for (; i < ii; i++) {
			var d = data[i];
			this.data[d.id] = d;

			if (eval(d.root)) this.root_list[d.nature].push(d.id);
			if (eval(d.leaf) && d.volume_o4 !== "NA" && d.volume_o9 !== "NA") this.leaf_list[d.nature].push(d.id);
		}

		console.log(this.root_list)

	}

	this.loadFlows = function(view_list, hide_list) {
		// Create, store the flows and attach them to the territories

		console.log(view_list)

		// If tab changing remove all currently displayed flows
		if (hide_list[0] === "tab") {
			for (var key in this.list) {
				this.list[key].unload();
				delete this.list[key];
			}
		}

		var i = 0, ii = view_list.length;
		for (; i < ii; i++) {
			var key = view_list[i];
			if (!(key in this.list)) {
				var d = this.data[key];
				var f = new Flow(this, this.r, d, this.territories);
				this.territories.list[d.from].outflows[d.id] = f;
				this.territories.list[d.to].inflows[d.id] = f;
				this.list[d.id] = f;

				// Feed or create stacks
				var stacks = this.stacks.list, len = stacks.length;

				// If zero stack exists
				if (len === 0) {

					// Create the first stack
					var stack = new Stack({type:d.type, t1:d.from, t2:d.to});
					stack.addToStack(f);
					this.stacks.list.push(stack);
					f.stack = stack;

				} else {

					while(len--) {

						// If one stack with same type and linked territories exists
						if ( stacks[len].type === d.type
							&& (stacks[len].t1 === d.from || stacks[len].t2 === d.from)
							&& (stacks[len].t1 === d.to || stacks[len].t2 === d.to) ) {

							// Add the flow to the stack
							stacks[len].addToStack(f);
							f.stack = stacks[len];
							break;

						// Otherwise, create a stack and add the flow to it
						}  else if (len === 0) {

							var stack = new Stack( { type:d.type, t1:d.from, t2:d.to } );
							stack.addToStack(f);
							this.stacks.list.push(stack);
							f.stack = stack;

						}

					}
				}

			}
		}

		for (var key in this.list) {
			if (hide_list.indexOf(key) !== -1) {

				this.list[key].unload();
				delete this.list[key];

			}
		}

	}

	this.displayFlows = function(view_list, hide_list, popups, year, animate, first_pass, scaling) {

		this.loadFlows(view_list, hide_list);

		// Find the appropriate scale given flows to visualize
		if (first_pass && this.scale != null) {this.scale_legend.remove();}
		var scale = scaling ? this.findScale(view_list) : this.scale;
		this.scale = scale;

		for (var key in this.list) {
			var f = this.list[key];
			f.scaleFlow(year, scale);
		}

		this.territories.setOffsets(this);

		for (var key in this.list) {
			var f = this.list[key];
			f.adaptFlowPath(animate, year);
			f.popup.adaptSizePosition(first_pass);
		}

		// Popups management
		if (animate) this.stacks.dirtify();
		this.stacks.unmessify();
		this.stackPopups();

		if (popups) {
			var len = popups.length;
			while (len--) {
				this.list[popups[len]].popup.clickbase();
			}
		}
	}

	this.unloadAll = function() {
		for (var key in this.list) {
			this.list[key].unload();
		}
	}

	this.stackPopups = function() {

		function ySort(a, b) {
			return (a.midY - b.midY);
		}

		var fs = this.list;
		var fs_arr = [];
		for (var key in fs) {
			if (fs.hasOwnProperty(key)) {
				fs_arr.push(fs[key]);
			}
		}

		fs_arr.sort(ySort);
		var len = fs_arr.length;
		while(len--) {fs[fs_arr[len].id].popup.stackPopup(len + 10);}
	}

	this.changeYear = function(view_list, hide_list, popups, title, story, year, animate, first_pass, scaling, anim_trend) {

		this.stopAnimTrends();
		console.log(anim_trend)
		anim_trend && this.animTrends();

		this.year = year;
		this.displayFlows(view_list, hide_list, popups, year, animate, first_pass, scaling);
	}

	this.findScale = function(view_list) {

		var max_f = 0, min_h = 10000;

		// For each territory
		$.each(this.territories.list, function(k, t) {
			if (k !== "left" && k !== "right") {
				var is4 = 0, os4 = 0, is9 = 0, os9 = 0;
				// Sum input flows
				$.each(t.inflows, function(ke, f) {is4 += f.volume.o4; is9 += f.volume.o9;})
				// Sum output flows
				$.each(t.outflows, function(ke, f) {os4 += f.volume.o4; os9 += f.volume.o9;})
				// Find the maximum
				max_f = Math.max(max_f, is4, os4, is9, os9);

				// Find the minimum height
				min_h = t.h < min_h ? t.h : min_h;
			}
		});

		// Find the overall maximum and the scaling factor
		var scale_vol = Math.max(2,max_f);
		var scale_ref = min_h*0.95;
		var scale = Math.round(10000*scale_ref/scale_vol)/10000;

		// Adapt the legend
		var vscale = Math.round(0.0001 * 80/scale) / 0.0001
		var hscale = vscale*scale;
		var unit = this.list[view_list[0]].unit;

		var paper = Raphael($("#fs_container div")[0], 100, hscale + 10);
		this.scale_legend = $("#fs_container div > svg");
		var scale_icon = paper.path();
		scale_icon.attr({path:["M",30,hscale+5,"H",25,"V",5,"H",30], "stroke-width":3, "stroke":"#ccc"});

		if ($("#legend #fs_text p").length > 0) {$("#legend #fs_text p").html(thousandSeparator(vscale, " ") + " " + unit);}
		else {$("<p>" + thousandSeparator(vscale, " ") + " " + unit + "</p>").appendTo($("#legend #fs_text"));}

		return scale;
	}

	this.animTrends = function() {
		this.anim_trends = true;
		// $(".trendplus, .trendminus").show();

		this.poptrends_container.show();

		this.poptrends_container
				.velocity({ top:0 },{ duration:0 })
				.velocity({ top:10 },{ loop:true });

		var tp = "<tr><td><div id = \"trendplus\"></td><td></div><p>Tendance à la hausse</p></td></tr>";
		var tm = "<tr><td><div id = \"trendminus\"></td><td></div><p>Tendance à la baisse</p></td></tr>";
		var tf = "<tr><td><div id = \"trendflat\"></td><td></div><p>Tendance stable</p></td></tr>";

		$(tp+tf+tm).appendTo($("#trend_legend"));

	}

	this.hideBases = function() {
		var flist = this.list;
		for (var key in flist) {
			if (flist.hasOwnProperty(key)) {
				flist[key].popup.hideBase();
			}
		}
	}

	this.showBases = function() {
		var flist = this.list;
		for (var key in flist) {
			if (flist.hasOwnProperty(key)) {
				flist[key].popup.showBase();
			}
		}
	}

	this.stopAnimTrends = function() {

		$("#trend_legend table").empty();
		// $(".trendplus, .trendminus").hide();

		this.poptrends_container.hide();

		this.poptrends_container
				.velocity("stop", true)
				.velocity({ top:0 },{ duration:0 });
		
		this.anim_trends = false;
	}

	this.loadData(data);
	callback();

}




function Flow(flows, r, data, territories) {	
	//Properties

	this.r = r;

	this.id = data.id;

	this.flows = flows;

	this.name = data.name;
	this.type = data.type;
	this.unit = data.unit;

	this.trend = parseInt(data.trend);

	this.from = data.from;
	this.to = data.to;
	this.xfrom = 0;
	this.xto = 0;

	var vo4 = data.volume_o4;
	var vo9 = data.volume_o9;
	this.volume = {};
	this.volume["o4"] = vo4 === "NA" ? -1 : parseInt(vo4.replace(/\s+/g, ''));
	this.volume["o9"] = vo9 === "NA" ? -1 : parseInt(vo9.replace(/\s+/g, ''));

	this.scaled_volume = 0;
	this.volume_label = "";

	this.rflowpath = null;
	this.pulse = null;
	this.counter = 0;
	this.pulsing = false;
	this.p = 0;

	this.tfrom = territories.list[data.from];
	this.tto = territories.list[data.to];

	this.offsetfrom = 0;
	this.offsetto = 0;
	this.offsetrecy = 0;
	this.offsetwast = 0;
	this.offsetextr;

	this.h = Math.random();
	this.s = 0.6;//0.2 + 0.8*Math.random();
	this.l = 0.5;
	// typeof color == "undefined" ? this.color = Raphael.hsl(this.h, this.s, this.l) : this.color = color;
	this.focus_color = darkenColor(data.color, 0.6);
	this.normal_color = darkenColor(data.color, 0.7);
	// this.color = data.color

	this.popup = null;

	this.angto = 0;
	this.angfrom = 0;

	this.hovered = true;

	this.scaling = 0.01;

	this.len = 0;
	this.pulsepath = [];

	this.hidden = true;

	this.too_small = false;
	this.is_zero;
	this.curr_y = 0;

	this.clicked = false;

	this.mid = 0;
	this.mid_corr = parseFloat(data.mid_corr) || 0.5;
	switch (this.type) {
		case "extraction": this.mid_corr = 0.4 + (Math.random()-0.5)/5; break;
		case "waste": this.mid_corr = 0.55; break;
		case "input": this.mid_corr = 0.25 + (Math.random())/2; break;
		case "output": this.mid_corr = 0.9 + (Math.random())/5; break;
		case "recyclage": this.mid_corr = 0.5; break;
	}

	this.level = data.level;

	var ch = data.children;
	var pa = data.parent;
	var si = data.siblings;
	this.children = ch === "" ? undefined : ch.split(";");
	this.parent = pa === "" ? undefined : pa;
	this.siblings =  si === "" ? undefined : si.split(";").concat(this.id);

	this.stack = null;

	this.createFlowElements(territories);
}

Flow.prototype.unload = function() {

	// Stack removal
	this.stack.flows = _.filter(this.stack.flows, function(flow) {
		return (flow.id !== this.id)
	}, this);

	// Flows list removal
	delete this.flows.list[this.id];

	// Graphic elements removal
	var fp = this.rflowpath;
	fp.animate({"stroke-width":0}, 400, function() {fp.remove()});
	this.pulse.stop();
	this.pulse.remove();
	this.popup.trend.remove();
	this.popup.remove();

	// Territories dependancies
	delete this.tfrom.outflows[this.id];
	delete this.tto.inflows[this.id];
}

Flow.prototype.createFlowElements = function(territories) {

	// Create the pulse elements
	this.pulse = this.r.circle(0, 0, this.scaled_volume/2).attr({stroke:"none", fill:"#FFFFFF", opacity:0.2});
	this.pulse.show();

	// Create the path of the flow
	this.rflowpath = this.r.path();
	this.rflowpath.attr({"stroke-width": 0, "stroke":this.normal_color});
	this.rflowpath.toBack();

	this.popup = new Popflow(this);

}

Flow.prototype.scaleFlow = function(year, scale) {

	if (!scale) {scale = this.scale}
	var f = this;

	//Change the scale
	f.scale = scale;

	// Scale the width of the flow
	f.scaled_volume = f.volume[year] * scale;
	if (f.scaled_volume < 2) {f.too_small = true;f.scaled_volume=2;} else {f.too_small = false;}
	if (f.volume[year] === 0) {f.is_zero = true;f.scaled_volume=0;} else {f.is_zero = false;}

	// Relabel
	f.volume_label = f.volume[year] === -1 ? "Valeur inconnue" : thousandSeparator(f.volume[year], " ") + " " + f.unit;

	// Resize the pulse
	f.pulse.attr({r:f.scaled_volume/2})
}

Flow.prototype.animateChangeYear = function() {
	this.rflowpath.animate({'stroke-width':this.scaled_volume}, 500, "");
}

Flow.prototype.adaptFlowPath = function(animate, year, first_pass) {
	var path = this.getFlowPath();
	this.rflowpath.attr({'stroke-dasharray':""})
	if (!this.hidden) {this.rflowpath.show();}
	if (animate) {
		this.rflowpath.animate({path: path},500);
		this.rflowpath.animate({'stroke-width':this.scaled_volume}, 500, "");
	} else {
		this.rflowpath.attr({path: path})
		if (!this.is_zero) {
			this.rflowpath.animate({'stroke-width':this.scaled_volume}, 500, "backOut");
			this.rflowpath.animate({'stroke-opacity': 1}, 200);
		}
	}

	this.rflowpath.attr({"stroke":this.normal_color});

	if (this.volume[year] === -1) {this.rflowpath.attr({path:path,'stroke-dasharray': "-"});}
}

Flow.prototype.getFlowPath = function() {

	var pastmy = this.midY;

	// _____________________________________________________________________________________________
	//
	// Defining parameters for the path

	var tfrom = this.tfrom;					// Origin territory
	var tto = this.tto;						// Destination territory

											// Territory base coordinates
	var xf = tfrom.f_anchor_x;						// Origin x
	var xt = tto.f_anchor_x;							// Destination x
	var yf = tfrom.f_anchor_y;						// Origin y
	var yt = tto.f_anchor_y;							// Destination y
	
	var offsetfrom = this.offsetfrom;		// Origin y offset
	var offsetto = this.offsetto;			// Destination y offset

	var corr = 1;
	if (tfrom.name == "Paris") {corr = 0.85};
											// Starting path point coordinates
	var xfrom = xf + corr*tfrom.w/2*tfrom.iw;				// Origin x
	var xto = xt - corr*tto.w/2*tto.iw;					// Destination x
	var yfrom = yf + offsetfrom;			// Origin y + offset
	var yto = yt + offsetto;				// Destination y + offset

	this.xfrom = xfrom;
	this.xto = xto;
	this.yfrom = yfrom;
	this.yto = yto;

	var dxfrom = Math.abs(xto - xfrom)/2 + sign(yf - yt)*offsetfrom;	// Origin bezier x offset (to approximate parallel paths when origin = destination)
	var dxto = Math.abs(xto - xfrom)/2 - sign(yf - yt)*offsetto;		// Destination bezier x offset

	// _____________________________________________________________________________________________
	//
	// Building the path from the origin territory to the destination territory

	var flowpath = [];

	if (this.type === "extraction") {
		flowpath.push(['M', xf - tfrom.w*0.15, yf]);
	} else {
		flowpath.push(['M', xf, yfrom]);
		if (this.type !== "waste") {flowpath.push(['L', xfrom, yfrom]);}
		else {flowpath.push(['L', xfrom*0.95, yfrom]);}
	}

	var deltaX = Math.abs(xto - xfrom);
	var deltaY = Math.abs(yto - yfrom);
	var midX = (xfrom + xto)/2;
	var midY = (yfrom + yto)/2;

	// If feeding and feeding nodes are different (= type of flow different from input or output)
	if (!(this.from === this.to)) {

		// If feeding node is 10% further on the right than feeded node
		if (xfrom > xt*0.9) {

			// Feeding node exit tangent
			flowpath.push(['C', xfrom + tfrom.w*tfrom.iw/2, yfrom,

			// Right tangent of middle point,  middle point, left tangent of middle point
			midX + (deltaX+deltaY)*0.75, yfrom - tfrom.h*tfrom.ih * sign(yt - yf)*0.6,
			midX, yfrom - tfrom.h*tfrom.ih * sign(yt - yf)*0.6]);
			flowpath.push(['C', midX - (deltaX+deltaY)*0.75, yfrom - tfrom.h*tfrom.ih * sign(yt - yf)*0.6,

			// Feeded node entrance tangent and position
			xto - tto.w*tto.iw/2, yto,
			xto, yto]);

		} else {

			// Feeding node exit tangent
			flowpath.push(['C', xfrom + dxfrom + corr*tfrom.w*tfrom.iw/8 + deltaY/2 - deltaX/2, yfrom,

			// Feeded node entrance tangent and position
			xto - dxto - corr*tto.w*tto.iw/8 - deltaY/2 + deltaX/2, yto,
			xto, yto]);

		}
	} else {
		if(this.type === "recyclage") {
			flowpath.push(['C', xfrom + tfrom.w/4 + this.offsetrecy * 2, yfrom,
								xf + tfrom.w/2 + this.offsetrecy * 3, yf+ tfrom.h/1.25 + this.offsetrecy * 2,
								xf, yf + tfrom.h/1.25 + this.offsetrecy * 2]);
			flowpath.push(['C', xf - tfrom.w/2 - this.offsetrecy * 3, yf + tfrom.h/1.25 + this.offsetrecy * 2,
								xto - tfrom.w/4 - this.offsetrecy * 2, yto,
								xto, yto]);
		} else if (this.type === "extraction") {
			flowpath.push(['C', xf, yf - tfrom.h*1.5,
								xto - tfrom.w/4, yto,
								xto, yto]);
		} else {
			flowpath.push(['C', xf + tfrom.w*0.75 - this.offsetwast*3.5, yfrom,
								xt + tfrom.w*0.1, yfrom - tfrom.h*1.5 + this.offsetwast*4.5,
								xt + tfrom.w*0.1 + this.offsetwast, yfrom - tfrom.h*0.15 + this.offsetwast]);
		}
	}

	flowpath.push(['L', xt, yto]);

	var rmpath = this.r.path(flowpath);
	var len = rmpath.getTotalLength();

	// Find the approximate midpoint of the flow
	var midp = rmpath.getPointAtLength(Math.floor(this.mid_corr*len));
	midX = midp.x;
	midY = midp.y;

	this.midX = Math.round(midX);
	this.midY = Math.round(midY);

	var delta_y = Math.abs(this.midY - pastmy);

	if (!this.pulsing || delta_y > 2) {

		var i = 0;
		var pulsepath = [];
		while(i <= len) {
			var pos = rmpath.getPointAtLength(i);
			pulsepath.push(pos);
			i = i + 15;
		}
		this.pulsepath = pulsepath;
		this.plen = pulsepath.length;
		this.mid = Math.floor(0.45*this.plen + Math.random()*this.plen*0.1);

		if (delta_y > 2) {this.pulse.stop();}

		var self = this;
		function animPulse() {
			if(self.p === self.plen-1) {self.p=0;self.pulse.hide();} else {self.p++;self.pulse.show();}
			self.pulse.animate({cx:self.pulsepath[self.p].x, cy:self.pulsepath[self.p].y}, 100, animPulse)
		}
		
		if (!this.flows.app.ie89) animPulse();

		this.pulsing = true;

	}


	// Find the real midpoint for inputs and outputs
	if (this.type === "input" || this.type === "output") {
		var target_x = (xfrom + xto)/2;
		var target_y = this.midY;

		var k = 10;
		var d1 = 2000;
		var d2 = 1000;

		while (d2 < d1) {
			k++;
			d1 = d2;
			var dpx = target_x - this.pulsepath[k].x;
			var dpy = target_y - this.pulsepath[k].y;
			d2 = Math.sqrt(dpx*dpx + dpy*dpy);
		}

		this.mid = k;
		this.midX = this.pulsepath[k].x;
		this.midY = this.pulsepath[k].y;
	}


	rmpath.remove();

	return flowpath;
}



Flow.prototype.appear = function() {
	this.rflowpath.animate({'stroke-width':this.scaled_volume}, 600, "elastic");
}

Flow.prototype.disappear = function() {
	this.rflowpath.hide();
	this.popup.hideAll();
}





function Popflow(flow) {

		this.flow = flow;

		this.show_base = false;

		var id = flow.id,
			name = flow.name,
			volume = flow.scaled_volume,
			ui = flow.flows.app.ui;

		var buttons = "";
		var na_children = false;
		if (flow.children) {
			var children = flow.children, len = children.length;
			while(len--) {
				if (flow.flows.data[children[len]].volume_o4 === "NA") na_children = true;
			}
			if (!na_children) buttons = buttons + "<li id = \"plus\" class = \"popbutton\"><span>Détail du flux</span></li>"
		}

		this.na_children = na_children;
		
		if (flow.parent) {buttons = buttons + "<li id = \"less\" class = \"popbutton\"><span>Retour en arrière</span></li></ul>"}


		var trend_icons = "";

		if (this.flow.trend) {

			var trend_id = "trendflat";
			if (this.flow.trend === -1 || this.flow.trend === -2) {
				trend_id = "trendminus";
			} else if (this.flow.trend === 1 || this.flow.trend === 2) {
				trend_id = "trendplus";
			}

			trend_icons = "<div class = \""+trend_id+"\"></div>";

			if (this.flow.trend === -2 || this.flow.trend === 2) {
				trend_icons = trend_icons.concat(trend_icons);
			}

		}

		var html = "<div id =\"" + id + "\" class = \"popflow\">" +
			"<div class=\"callout border-callout\">" +

			"<div class = \"mousebox\"></div>"+
			"<h3>" + name + "</h3>"+
			"<ul><li><p id = \"volume\">"+volume+"</p></li>"+
			buttons + "</ul>"+

			"<b class=\"border-notch notch\"></b>" +
			"<b class=\"notch\"></b>"+
			"</div>"+
			"<div id = \"dot\"></div></div>";

		this.button = $(html).appendTo($("#flows"));

		var html2 = "<div id =\"" + id + "\" class = \"poptrend\">"+trend_icons+"</div>";
		this.trend = $(html2).appendTo($("#trends"));

		//Attach buttons
		if (flow.parent) new ui.button("#less", ui.flowpop["#less"], "#"+id);
		if (flow.children && !na_children) new ui.button("#plus", ui.flowpop["#plus"], "#"+id);

		// Add tip
		var base = $("#"+id+ ".popflow"),
			tip = $(".callout", base),
			dot = $("#dot", base),
			plus = $("#"+id+" #plus"),
			less = $("#"+id+" #less"),
			trend = $("#"+id+ ".poptrend"),
			labels = $("span", base);

		if (this.flow.trend === -2 || this.flow.trend === 2) {
			trend.children().first().css({"margin-top":15});
		}

		if (!flow.children) dot.css({"background-color":flow.normal_color});

		this.col = darkenColor(flow.focus_color, 0.55)
		base.css({"background-color":flow.focus_color})
		// tip.css({ "border-color": flow.focus_color })

		// Bind mouse behavior
		this.clicked = false;

		this.enterbase = function() {
			base.css({"background-color":this.col})
			this.flow.rflowpath.attr({"stroke":this.flow.focus_color})
		}
		
		this.exitbase = function() {
			this.flow.rflowpath.attr({"stroke":this.flow.normal_color})
			base.css({"background-color":this.flow.focus_color})
		}
		
		this.clickbase = function() {
			this.base.toggleClass("popflow-clicked");

			if (this.clicked) {
				base.css({"background-color":this.flow.focus_color})
				this.flow.rflowpath.attr({"stroke":this.flow.normal_color})
				base.on('mouseenter', $.proxy(this.enterbase, this));
				base.on('mouseleave', $.proxy(this.exitbase, this));
			} else {
				base.css({"background-color":this.col})
				this.flow.rflowpath.attr({"stroke":this.flow.focus_color})
				base.off("mouseenter mouseleave");
			}

			this.clicked = !this.clicked;
		};

		base.on('mouseenter', $.proxy(this.enterbase, this));
		base.on('mouseleave', $.proxy(this.exitbase, this));
		base.on('mousedown', $.proxy(this.clickbase, this))

		plus.on('click', $.proxy(this.clickPlus, this))
		less.on('click', $.proxy(this.clickLess, this))

		// trend.hide();

		// Store objects
		this.base = base;
		this.tip = tip;
		this.dot = dot;
		this.trend = trend;
		this.labels = labels;

		// Store label positioning
		this.pos = null;
}

Popflow.prototype.adaptSizePosition = function(first_pass) {
	if (!this.flow.is_zero) {this.base.show();this.trend.show()}
	else {this.base.hide();this.trend.hide()}

	$("#volume", this.base).html(this.flow.volume_label)

	if (this.flow.stack.dirty) {

	var c = constrainNumber(this.flow.scaled_volume, 20, 60)*0.6;

	var path = this.flow.pulsepath;
	var len = path.length;
	// var mid = Math.floor((0.4+Math.random()/5)*len);
	// var mid = Math.floor(len*0.5);
	// var x = path[mid].x, y = path[mid].y;
	var mid = this.flow.mid;
	var x = this.flow.midX, y = this.flow.midY;

	this.base.css({width:c, height:c, left:x-c/2, top:y-c/2});

	// this.trend.css({width:c, height:c, left:x-c/2, top:y-c/2});

	var dim = this.tip.getHiddenDimensions();
	this.tip.css({left:-dim.width*0.45 + c/2 - 15, top:-dim.height - 25 + c*0.25});
	// this.tip.css({left:-dim.width*0.45 + c/2 - 15, top:-dim.height - + c*0.25});

	this.dot.css({left:c/2 - 4, top:c/2 - 4});
	// this.trend.css({left:c/2 - 13, top:0});

	this.labels.css({"margin-top":-dim.height-5});

	this.pos = {"anchor":mid,
				"x":x,
				"y":y,
				"w":dim.width,
				"h":dim.height,
				"hc":c/2,
				"zero":this.flow.is_zero};

			}

	if (this.show_base) this.base.click();
	
}

Popflow.prototype.clickPlus = function() {
	var flows = this.flow.flows;
	var y = flows.year;
	var sto = flows.app.story;

	sto.changeYear(y, false, false, false).bind(sto)(this.flow.children, [this.flow.id]);
}

Popflow.prototype.clickLess = function() {
	var flows = this.flow.flows;
	var y = flows.year;
	var sto = flows.app.story;

	var pa = flows.data[this.flow.parent];

	// Search for siblings and other flows whose level is below the parent
	var sib = this.flow.siblings;
	var sub_level = [];
	for (var key in flows.list) {if (flows.list[key].level !== pa.level && flows.list[key].type === this.flow.type) sub_level.push(flows.list[key].id)}

	var hide_list = sib.concat(sub_level);

	sto.changeYear(y, false, false, false).bind(sto)([this.flow.parent], hide_list);
}

Popflow.prototype.remove = function() {
	this.base.remove();
}

Popflow.prototype.stackPopup = function(z) {
	this.base.css({"z-index":z});
}

Popflow.prototype.hideBase = function() {
	this.base.css({"background-color":"transparent"})
	this.dot.css({"background-color":"transparent"})
	this.tip.css({"opacity":0})
}

Popflow.prototype.showBase = function() {
	this.base.css({"background-color":this.flow.focus_color})
	if (this.na_children || this.flow.children) {
		this.dot.css({"background-color":this.flow.focus_color});
	} else {
		this.dot.css({"background-color":"#fff"});
	}
	this.tip.css({"opacity":1})
}