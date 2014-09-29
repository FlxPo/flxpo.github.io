function Projects(app, data, callback) {

	this.app = app;
	this.territories = app.territories;
	this.flows = app.flows;
	app.projects = this;
	this.list = {};

	this.loadProjects = function(data) {

		//Follow window resizing
		// addEvent(window, 'resize', this.updateMapping.bind(this));

		var ps = data;
		for (var i = 0, n = ps.length; i < n; i++) {
			var d = ps[i];
			var p = new Project(this, this.r, this.territories.list[d.territory], d.id, d.name, d.type, d.x, d.y, d.view);
			this.list[d.id] = p;
			// p.mapToTerritory();
			// p.appear();
		}

		// this.setJumps();
	}

	this.setJumps = function() {
		var self = this;
		for (key in this.list) {
			console.log(key)
			var project = this.list[key];
			var jump = function() {self.territories.app.jumpToView(key).bind(self.territories.app)()}
			if (key === "p00") {
				jump = function() {
					self.app.ui.controls["#projects"].button.trigger("click");
				}
			}
			project.pin.click(jump);
		}
	}

	this.updateMapping = function(ds) {
		for (key in this.list) {
			var project = this.list[key];
			project.updateMapping(ds);
		}
	}

	this.groupPins = function() {

	}

	this.ungroupPins = function() {
		
	}

	this.loadProjects(data);
	callback();
}

function Project(projects, r, t, id, name, local, px, py, view) {
	this.view = view;
	this.projects = projects;
	this.id = id;
	this.local = local;
	this.r = r;
	this.t = t;
	this.name = name;
	this.px = px;
	this.py = py;
	this.x = 0;
	this.y = 0;

	this.otw = t.w;

	this.ellipse = null;
	this.button = null;
	this.tip = null;
	this.poputext = null;
	this.pin = null;

	this.pop = new Popproject(this);
}

Project.prototype.updateMapping = function(ds) {

	var xt = this.t.x;
	var yt = this.t.y;
	var wt = this.t.w;
	var ht = this.t.h;

	this.x = xt + wt * (this.px - 0.5);
	this.y = yt + ht * (this.py - 0.5);

	this.pin.transform(["T", this.x, this.y]);
	this.tip.transform(["T", this.x, this.y]);
	this.popuptext.transform(["T", this.x, this.y]);

}

Project.prototype.mapToTerritory = function () {
	this.t.projects[this.name] = this;

	var xt = this.t.x;
	var yt = this.t.y;
	var wt = this.t.w;
	var ht = this.t.h;

	this.x = xt + wt * (this.px - 0.5);
	this.y = yt + ht * (this.py - 0.5);

	var mx = this.x;
	var my = this.y;
	var w = this.name.length * 8 + 20;
	var h = 25;
	var off = 0;
	this.local == "globalplus" ? off = 15 : off = 30;

	this.tip = this.r.rect(mx - w/2, my - h - off, w, h, 5).toFront();

	this.tip.attr({fill:"#FFFFFF", 'opacity': 0.8, 'stroke':'#000000', 'stroke-opacity':0.1}).hide();;
	this.popuptext = this.r.text(0, 0, this.name).attr({"font-family": "Open Sans", "font-size":"14pt"});
	this.popuptext.attr({x: mx, y: my - off - h + 12}).hide().toFront();

	var data = null;
	eval(icons[this.local].geodata);

	this.pin = this.r.add(data);
	this.pin.transform("T"+this.x+","+this.y);
	this.pin.animate({opacity:0}, 0);
	this.pin.hover(this.showInfo, this.hideInfo, this, this);
	// this.pin.hide();

	function setID(e) {e.node.id = "clickable";}
	this.pin.forEach(setID, "")

}

Project.prototype.appear = function () {
	this.pop.base.velocity("fadeIn", { duration: 300 })
	// this.pin.show();
	// this.pin.animate({opacity:1}, 100);
	// this.pin.animate({transform:"...s4,4"}, 300, "elastic");
}

Project.prototype.disappear = function () {
	this.pin.animate({opacity:0}, 100);
	// this.pin.animate({transform:"...s0.25,0.25"}, 300, "elastic");
}

Project.prototype.showInfo = function() {
	this.tip.show();
	this.popuptext.show();
}

Project.prototype.hideInfo = function() {
	this.tip.hide();
	this.popuptext.hide();
}

function Popproject(project) {

		this.project = project;

		var id = project.id,
			name = project.name,
			ui = project.projects.app.ui;

		var buttons = "";

		var html = "<div id =\"" + id + "\" class = \"popproject\">" +
			"<div class=\"callout border-callout\">" +

			"<div id = \"mousebox\"></div>"+
			"<p>" + name + "</p>"+

			"<b class=\"border-notch notch\"></b>" +
			"<b class=\"notch\"></b>"+
			"</div>"+
			"<div id = \"pin"+project.local+"\"></div></div>";

		this.button = $(html).appendTo($("#pins"));

		new ui.button("#pin"+project.local, ui.projectpop["#pin"+project.local], "#"+id);

		var base = $("#"+id),
			tip = $(".callout", base),
			pin = $("#pin"+project.local, base);

		var xt = project.t.x;
		var yt = project.t.y;
		var wt = project.t.w;
		var ht = project.t.h;

		var x = xt + wt * (project.px - 0.5);
		var y = yt + ht * (project.py - 0.5);

		var offy = project.local === "local" ? 60 : 35;
		base.css({left:x, top:y});
		var dim = tip.getHiddenDimensions();
		tip.css({left:-dim.width*0.45 - 15, top:-dim.height -  offy});

		var app = project.projects.app;

		var jump = function() {app.jumpToView(project.view).bind(app)()}
		if (id === "p00") {jump = function() {app.ui.controls["#projects"].button.trigger("click");}}
		
		base.on("click", jump);

		// base.click($.proxy(app.jumpToView(project.view), app))
		// base.hide();

		this.base = base;
}