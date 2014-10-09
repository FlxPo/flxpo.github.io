
// Top layer of the application, handles the views and the transitions between them

function Brain(views_nav) {

	//--------------------------------------------------------------------------------------
	// Properties

	this.view = null;
	this.views_nav = views_nav;			// Maps the navigation between views
	this.curr_v = "start";		// View displayed on load
	this.resize_enter = true;
	this.online = window.navigator.onLine;
	this.ie89 = false;

	this.current_focus = true;
	this.first_pass = true;
	this.intro = false;

	if(document.all && !window.atob) {this.ie89 = true;}

	//--------------------------------------------------------------------------------------
	// Methods

	// Returns the function to display the view called "name"
	this.jumpToView = function(name) {
		return function() {

			// Launch loader cursor
			if (name !== "start") $("body").css({cursor:"progress"})

			function animNext(a, dir) {
				return function() {

					function switchContents(previous_slide) {
						return function() {
							$(previous_slide).css({top:"100%"});

							if ($(previous_slide + " #start")) {
								$(previous_slide + " #start").remove();
								$(previous_slide + " #backstart").remove();
								$("#warning").remove();
							}

							$(previous_slide + " #back").empty();
							$(previous_slide + " #middle").empty();
							$(previous_slide + " #front").empty();

							$("#flows, #pins").velocity({opacity:1}, {duration:400});
							$("#back", next_slide).velocity({opacity:1}, {duration:400});

							this.current_focus = !this.current_focus;
						}
					}

					var alen = a.length;
					while(alen--) {$(a[alen].target).velocity(a[alen].effect, a[alen].parms);}

					var previous_slide = this.current_focus ? "#content" : "#next_content";
					var next_slide = this.current_focus ? "#next_content" : "#content";

					$(next_slide + "_outer").css({display:"inline"});

					if (dir === "up") {
						$(next_slide).css({top:"-100%"});
					} else if (dir === "down") {
						$(next_slide).css({top:"100%"});
					} else {
						$(next_slide).css({top:"0%"});
					}

					var ps = "-100%", ns = "0%";
					if (dir === "up") {ps = "100%"; ns = "0%";}

					if (dir !== "same") {
						$(previous_slide).velocity({"top":ps}, { "delay": 400, "duration": 1000, "display": "inline", complete: switchContents(previous_slide).bind(this)});
						$(next_slide).velocity({"top":ns}, { "delay": 400, "duration": 1000, "display": "inline" });
						$("#back", previous_slide).velocity({opacity:0}, {duration:400});
						$("#back", next_slide).velocity({opacity:0}, {duration:400});
					} else {
						switchContents(previous_slide).bind(this)();
					}
				}
			}

			// To show/create the next view
			var target_slide = this.current_focus ? "#next_content" : "#content";

			$("#flows, #pins").velocity({opacity:0}, {duration:50, complete:function(){$("#flows, #pins").empty()}});
			$("#fs_container div").empty();

			var dir = "up";
			if (this.views_nav[name].elevation - this.views_nav[this.curr_v].elevation < 0) dir = "down";
			if (this.views_nav[name].elevation - this.views_nav[this.curr_v].elevation === 0) dir = "same";

			var fp = this.first_pass;
			this.view = new View(this, name, this.views_nav[name].previous, this.views_nav[name].next, fp, target_slide, animNext(this.views_nav[this.curr_v].anim, dir).bind(this));
			this.curr_v = name;
		}
	}

function reloadView(self) {
	var doit;
	return function() {
		if (self.curr_v !== "start") {
			clearTimeout(doit);
			doit = setTimeout(function() {
			self.jumpToView(self.curr_v).bind(self)();
			}, 500);
		}
	}
}

	//--------------------------------------------------------------------------------------
	// Initialisation
	// drawLoader();
	this.ui = new UI(this);					// Interface object holding buttons, zooming management functions...
	
	var self = this;
	setTimeout(function() {self.jumpToView("start").bind(self)();}, 50);
	addEvent(window, 'resize', reloadView(this));
}

function View(app, name, previous, next, first_pass, target_slide, animNext) {

	function loadView(name) {

		// Creating the elements of the starting page
		if (name == "start") {

			// Injecting warning
			$("<div id = \"warning\"><p>Ce site est optimisé pour Firefox, Chrome et Internet Explorer 9+</p></div>").appendTo($("#content"));

			// Positionning div containing the elements
			var center_div = $("#tstart");
			$("<h1>Métabolisme Urbain de Paris</h1>").appendTo(center_div);
			$("<p>Visualisez les flux de matières, d’énergies ou d’eaux et découvrez des projets innovants pour mieux comprendre les interactions de la ville avec son environnement.</p>").appendTo(center_div);

			var r_div = $("#rstart");
			var w = r_div.width();
			var r = Raphael($("#rstart")[0], w, w);
			var cx = w/2, cy = w/2;

			// Adds a circle to the animation
			var addCircle = function(rad, set) {
				// Random parameters
				var alfa = Math.random()*2*Math.PI;
				var rad = Math.floor(25 + Math.random()*40)/2;
				var center = Math.floor(175+ rad*(1.5*Math.random() - 1));
				var sw = Math.floor(5 + 20*Math.random());
				var x = Math.floor(cx + center * Math.cos(alfa));
				var y = Math.floor(cy + center * Math.sin(alfa));
				var op = Math.floor((0.4 + Math.random()/3)*100)/100;
				var h = 0.36 + 0.2*Math.random()
				var col =  Raphael.hsl(h, 1, 0.4);//Math.random() > 0.5 ? "#0062a2" : "#c8042d" //

				// Display and styling 
				var circle = r.path().toBack();
				circle.attr({path:["M", x, y-rad, "A", rad, rad, 0,1,1,x-0.1, y-rad, "Z"], stroke:col, 'stroke-width':sw, opacity:op});
				circle.animate({transform:["s",4,4, x, y], 'stroke-width': sw}, 400 + Math.round(Math.random()*400), "elastic");

				// Bind the pulse
				var pupath = r.path(["M", x, y-rad*4, "A", rad*4, rad*4, 0,1,1,x-0.1, y-rad*4, "Z"]).hide();
				var pulse = r.circle(0,0, sw/2).attr({fill:col, stroke:"none", opacity:op}).toBack().hide();

				var len = pupath.getTotalLength();
				var i = 0;
				var pulsepath = [];
				while(i <= len) {
					var pos = pupath.getPointAtLength(i);
					pulsepath.push(pos);
					i = i + 10;
				}

				pupath.remove();

				var plen = pulsepath.length;

				var self = this;
				var p = Math.round(Math.random()*plen/2);
				function animPulse() {
					if(p === plen-1) {
						p=0;
						pulse.hide();
					} else {
						p++;
						if (p>1) pulse.show();
					}
					pulse.animate({cx:pulsepath[p].x, cy:pulsepath[p].y}, 15)
					setTimeout(function() {animPulse();},30);
				}
				if (!app.ie89) animPulse();

				setTimeout(function() {
					pulse.remove();
					circle.animate({transform:["s",0.5,0.5, x, y]}, 400 + Math.floor(Math.random()*400), "ease-in", function() {set.exclude(cs);cs.remove();});
				}, Math.floor(Math.random()*4000));


				var cs = r.set();
				cs.push(circle);
				cs.push(pulse);
				return cs;
			}

			// Hover behavior, add a circle everytime hoverin/hoverout is fired
			var ps = r.set();
			var addCircleToSet = function(r,set) {return function() {if(set.items.length < 12) set.push(addCircle(r, set));}}

			$("#tstart").on('mouseover', addCircleToSet(r, ps))
			var int_id = setInterval(function() {
				setTimeout(addCircleToSet(r, ps), Math.floor(Math.random()*1000));
				setTimeout(addCircleToSet(r, ps), Math.floor(Math.random()*2000));
			}, 2000);
			
			$("#backstart").velocity({ opacity: 1 }, { duration: 300, display:"inline"});

			// To launch the app
			var b = $("<div id = \"launch\"><p>Explorer</p></div>").appendTo(center_div);
			b.click(function() {
				clearInterval(int_id);
				app.ui.controls["#paris"].button.click();
			})

			// To launch the demo
			var d = $("<div id = \"demo\"><p>Démo</p></div>").appendTo(center_div);
			d.click(function() {

				// Launch loader icon
				$("body").css({cursor:"progress"});

				// Append containers
				var win = $(window);
				$("<div id=\"video_container\"><iframe id = \"video\" src=\"//www.youtube.com/embed/L0b4YYBH28A?list=UU4e6cfcOXGycjRLZbbSwwoA\" frameborder=\"0\" allowfullscreen</iframe></div>").appendTo($("body"));
				
				// Size conatiners
				var w = win.innerWidth(), h = win.innerHeight();
				$('#video_container').css({ left:w*0.25+'px', top:h*0.25+'px' });
				$('#video').css({ width:w*0.5+'px', height:h*0.5+'px' });

				// Wait for load to display
				$("iframe").load(function() {

					// Stop loader icon and fade in content
					$("body").css({cursor:"default"});
					$('#video_container').velocity("fadeIn", { duration: 300 });

					// When video ends, 
					// setTimeout(function() {
					// 	$('#video_container').velocity("fadeOut", { duration: 300, complete:app.jumpToView("paris").bind(app) });;
					// }, 2000);
				})

				$(window).resize(function() {
					var win = $(window), w = win.innerWidth(), h = win.innerHeight();
					$('#video_container').css({ left:w*0.25+'px', top:h*0.25+'px' });
					$('#video').css({ width:w*0.5+'px', height:h*0.5+'px' });
				});
			})

		}

		else {

			
			$("#flows, #pins").show();

			// Stop previous velocity animations on territories
			if (app.territories) {
			var tlist = app.territories.list;
			for (var key in tlist) {
				if (tlist.hasOwnProperty(key)) {
					if(tlist[key].solution) {
						tlist[key].container.children().first().velocity("stop", true);
					}
				}
			}
			}

			// -------------------------------------------------------------------------
			// Create the elements of the view

			// Create the graphics area
			var ws = getWindowSize();

			var rback = Raphael($(target_slide+" #back")[0], ws.w, ws.h);
			rback.setViewBox(0, 0, ws.w, ws.h, false);

			var rmiddle = Raphael($(target_slide+" #middle")[0], ws.w, ws.h);
			rmiddle.setViewBox(0, 0, ws.w, ws.h, false);

			// var rfront = Raphael($(target_slide+" #front")[0], ws.w, ws.h);
			// rfront.setViewBox(0, 0, ws.w, ws.h, false);

			rs = {};
			rs['rback'] = rback;
			rs['rmiddle'] = rmiddle;
			// rs['rfront'] = rfront;


			function createAllElements(app, target_slide, rs, animNext) {

				return function(data) {

					function creator(type, callback) {
						return function() {
							switch(type) {
								case "territories": object = new Territories(app, target_slide, rs['rmiddle'], data.territories, ws, callback); break;
								case "flows": object = new Flows(app, rs['rback'], data.flows, callback); break;
								case "projects": object = new Projects(app, data.projects, callback); break;
								case "story": object = new Story(app, data.story, callback); break;
							}
						}
					}

					var s = creator("story", animNext);
					var p = creator("projects", s);
					var f = creator("flows", p);
					var t = creator("territories", f);

					setTimeout(function() {t();}, 50);
				}
			}

			getData(this.online, "./data/"+name+"_view_en.json", createAllElements(app, target_slide, rs, animNext));
			// For offline use
			// createAllElements(app, target_slide, rs, animNext)(name+"_view_en");

			if (name === "paris" && app.first_pass) {

				app.ui.controls["#matter"].enterButton();
				$("#matter").off("mouseleave")
				$("#matter").toggleClass("f_button-clicked");

				app.intro = true;
				app.first_pass = false;

				var back = $("<div id = \"intro_back\"></div><div id = \"intro_mouse\"></div>").appendTo($("body"));
				var win = $(window);
				var w = win.innerWidth(), h = win.innerHeight();
				back.css({ width:w*0.97+'px', height:h*0.95+'px', top:0.025*h, left:0.015*w })
				back.velocity({opacity:0.7}, {duration:300, delay:2500});


				$(window).resize(function() {
					var win = $(window), w = win.innerWidth(), h = win.innerHeight();
					back.css({ width:w*0.97+'px', height:h*0.95+'px', top:0.025*h, left:0.015*w })
				});

				var html = "<div id = \"intro_container\">"+
							"<div id = \"intro_slide\"></div>"+
								"</div></div>";

				var container = $(html).appendTo($("body"));
				container.velocity("fadeIn", {duration:300, delay:2500});

				var islide = $("#intro_slide")

				function addSlide(box, text, textbox, id) {

					var bot = id === "b4" ? $("#footer").getHiddenDimensions().height + 150 : textbox.bottom;

					var html = "<div class = \"intro_text\">";

					if (textbox.arrow === "up") {
						html = html + "<div class = \"arrow-up\"></div>"
					} else if (textbox.arrow === "down") {
						html = html + "<div class = \"arrow-down\"></div>"
					} else if (textbox.arrow === "right") {
						html = html + "<div class = \"arrow-right\"></div>"
					} else {
						html = html + "<div class = \"arrow-left\"></div>"
					}

					html = html + "</div>"


					var div = $(html).appendTo(islide);
					$("<p>"+text+"</p>").appendTo(div);
					div.css({top:textbox.top, bottom:bot, left:textbox.left, right:textbox.right, width:textbox.width, height:textbox.height, "border-left":textbox["border-left"], "border-right":textbox["border-right"], "border-bottom":textbox["border-bottom"], "border-top":textbox["border-top"]})
				
					if (id === "b4") {
						$(window).resize(function() {
							var bot = $("#footer").height();
							div.css({ bottom: bot+50 });
						});
					}
				}

				function killIntro() {
					$("#intro_slide, #intro_back").velocity("fadeOut", {duration: 300, complete:function() {$("#intro_slide, #intro_container, #intro_back").remove()}});
					$("#intro_mouse").remove();
				}

				$("#intro_mouse").on('click', killIntro)

				$.getJSON("data/intro.json", function(data) {
					var steps = [];
					$.each(data, function(key,val) {
						addSlide(val.box, val.text, val.textbox, val.id)
					});

					// For offline use
					// var steps = [];
					// $.each(intro, function(key,val) {
					// 	steps.push(data[key]);
					// }

				});


			}		


	}
}

loadView(name);
}