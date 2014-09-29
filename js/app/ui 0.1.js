function UI(app) {

	var controls = {}, flowpop = {}, projectpop = {};
	this.flowpop = flowpop;
	this.projectpop = projectpop;
	this.controls = controls;
	this.app = app;

	// Button constructor
	function Button(key, val, target) {

		// Raphael object on target button
		var button = target ? $(target+" "+key) : $(key);
		var b_w = button.width();
		var b_h = button.height();
		var r = Raphael(button[0], b_w, b_h);

		// Button properties
		this.label = $(key + "> span");
		this.button = button;
		this.bang = val.bang;
		this.clicked = false;
		this.colors = [];
		this.colors.push(val["bg-col-n"], val["bg-col-a"], val["bg-col-c"]);
		
		// Create geometry, translate and scale
		var b = r.add(val.geometry);
		var scale = Math.min(b_w/val.width, b_w/val.height)*val.scale;
		b.transform(["...T", b_w/2 - val.width/2, b_w/2 - val.height/2])
		b.transform(["...S", scale, scale, b_w/2, b_w/2])

		if (val.geometry_grey) {

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

		// Style the base and apply mouse events
		button.css({"background-color": val["bg-col-n"]});

		this.enterButton = function() {
			this.button.css({"background-color": val["bg-col-a"]});
			if (val.geometry_grey) {
				var len = this.items.length;
				while(len--) {
					this.items[len].attr({"fill":this.e_colors[len]});
					this.items[len].attr({"stroke":this.strokes[len]});
				}
			}
		}
		
		this.leaveButton = function() {
			this.button.css({"background-color": val["bg-col-n"]});
			if (val.geometry_grey) {
				var len = this.items.length;
				while(len--) {
					this.items[len].attr({"fill":this.grey_colors[len]});
					this.items[len].attr({"stroke":this.grey_strokes[len]});
				}
			}
		}

		// this.enterButton = enterleave("enter", val["path-col-a"], val["path-col-n"], true)
		// this.leaveButton = enterleave("leave", val["path-col-a"], val["path-col-n"], true)

		var clickButton = function() {
			if(!this.bang) {
				if (!this.clicked) {
					this.button.css({"background-color": this.colors[1]});
					this.button.off('mouseenter', $.proxy(this.enterButton, this));
					this.button.off('mouseleave', $.proxy(this.leaveButton, this));
				} else {
					this.button.css({"background-color": "#eee"});
					this.button.on('mouseenter', $.proxy(this.enterButton, this));
					this.button.on('mouseleave', $.proxy(this.leaveButton, this));
				}
				this.clicked = !this.clicked;
			}
		}

		button.click($.proxy(clickButton, this));
		button.on('mouseenter', $.proxy(this.enterButton, this)),
		button.on('mouseleave', $.proxy(this.leaveButton, this));

		// Handlers for showing or hiding
		this.fadeIn = function() {this.button.fadeIn('fast')}
		this.fadeOut = function() {this.button.fadeOut('fast')}

		// Hide the button by default
		// this.button.hide();
	}

	this.button = Button;

	// Inject all button data to html/css with the button constructor
	$.getJSON("data/graphics/button.json", function(data) {

		// For offline use
		// var data = buttons;

		$.each(data.controls, function(key,val) {
			controls[key] = new Button(key, val);
			// controls[key].button.hide();
		});
		$.each(data.flowpop, function(key,val) {
			flowpop[key] = val;
		});
		$.each(data.projectpop, function(key,val) {
			projectpop[key] = val;
		});

		var y = "2004";

		controls["#time"] = new Object();
		controls["#time"].button = $("#time");

		function timeChange() {
    		var to = $(this).children(".toggle").toggleClass("toggle-right");
    		var cy = $("#time .toggle > span");
			var ty = cy.html() === "2004" ? "2012" : "2004";
    		$("span", to).html(ty);
		}

		$("#time").on("click", timeChange);

		// function matterException() {
		// 	if (app.story.tab === "matter") {
		// 		$("#time").off();
		// 		var mat = app.story.narratives["matter"], len = mat.length;
		// 		mat[len-1].button.click();
		// 	}
		// }

		// $("#time").on("click", $.proxy(matterException, app));

		function floorChange() {
			$(this).parent().children().each(function() {$(this).removeClass("zt-clicked");});
			$(this).addClass("zt-clicked");
		}
		$("#idf, #pc, #paris, #projects").on("click", floorChange);

		$("#idf").click($.proxy(app.jumpToView("idf"), app));
		$("#pc").click($.proxy(app.jumpToView("pc"), app));
		$("#paris").click($.proxy(app.jumpToView("paris"), app));
		$("#projects").click($.proxy(app.jumpToView("projects"), app));

		$("#matter, #energy, #water").on("click", function() {
			$(this).parent().children().each(function() {$(this).removeClass("f_button-clicked");});
			$(this).addClass("f_button-clicked");
		})

		// Tab behavior of the matter energy water buttons
		function unClick(mew_left, len) {
			return function() {
				var j = len - 1;
				while (j--) {
					controls[mew_left[j]].button.on('mouseenter', $.proxy(controls[mew_left[j]].enterButton, controls[mew_left[j]]));
					controls[mew_left[j]].button.on('mouseleave', $.proxy(controls[mew_left[j]].leaveButton, controls[mew_left[j]]));
					controls[mew_left[j]].leaveButton();
					controls[mew_left[j]].clicked = false;
				}
			}
		}

		var mew = ["#matter", "#energy", "#water"];
		var len = 3;
		var i = 3;
		while (i--) {
			var mew_left = mew.slice();
			mew_left.splice(mew_left.indexOf(mew_left[i]), 1);
			controls[mew[i]].button.click(unClick(mew_left, len));
		}

		mew = ["#projects", "#paris", "#pc", "#idf"];
		var len = 4;
		var i = 4;
		while (i--) {
			var mew_left = mew.slice();
			mew_left.splice(mew_left.indexOf(mew_left[i]), 1);
			controls[mew[i]].button.click(unClick(mew_left, len));
		}

		$("#contract").click(function() {
			app.story.changeYear(app.story.year, false, false, false).bind(app.story)(app.flows.root_list[app.story.tab], ["tab"]);
		})

		$("#expand").click(function() {
			app.story.changeYear(app.story.year, false, false, false).bind(app.story)(app.flows.leaf_list[app.story.tab], ["tab"]);
		})

		controls["#info"] = new Object();
		controls["#info"].button = $("#info");

		controls["#like"] = new Object();
		controls["#like"].button = $("#like");

		function loadInfo() {
			var html = '<div id = "info_back"></div><div><div id = "info_content"><h2 style = \"text-align:center\">Informations sur cette visualisation</h2>'
			+'<ul>'
			+ '<li>Les données sur les flux d’énergies et d’eaux sont celles de la Ville de Paris.</li>'
			+ '<br>'
			+ "<li>Les données de 2003 sur les flux de matières représentées dans cette infographie sont extraites du rapport de Sabine Barles, professeure d'urbanisme à l’université Paris 1 Panthéon-Sorbonne (UMR Géographie-Cités) : <a href = \"./data/Barles-EI-Paris.pdf\" target = \"_blank\">« Mesurer la performance écologique des villes et des territoires : le métabolisme de Paris et de l’Île-de-France »</a>.</li>"
			+ '<br>'
			+ "<li>Les tendances relatives à l’évolution des flux de matières ont été évaluées avec l’aide de Laurent Georgeault doctorant de l’université Paris 1 et chargé de mission à l’Institut de l’économie circulaire.</li>"
			+ '</ul>'
			+ '<h3>Pour plus d’information, voir aussi :</h3>'
			+ "<ul><li>BARLES, S. <a href = \"http://www.developpementdurable.revues.org/10090\" target = \"_blank\">« L’écologie territoriale et les enjeux de la dématérialisation des sociétés : l’apport de l’analyse des flux de matières »</a>, Développement durable des territoires 5(1), 2014, en ligne, [consulté le 22 févr. 2014].</li>"
			+ '<br>'
			+ "<li>REPELLIN, P., DURET, B., BARLES, S. <a href = \"http://www.statistiques.developpement-durable.gouv.fr/publications/p/2101/1161/comptabilite-flux-matieres-regions-departements-guide.html\" target = \"_blank\">Comptabilité des flux de matières dans les régions et les départements.</a> Guide méthodologique. La Défense : Ministère de l’Écologie, du Développement durable et de l’Énergie – CGDD (coll. « Repères »), 2014. 114 p. En ligne, [consulté le 18 juin 2014].</li>"
			+ "</ul>"
			+ "<ul id = \"credits\">"
			+ "<li><h3>Maîtrise d’ouvrage :</h3><p>Agence d’écologie urbaine – Mairie de Paris<br>(contact : <a href =\"mailto:entreprisesresponsables@paris.fr\">entreprisesresponsables@paris.fr</a>)<br></p><a href =\"http://www.paris.fr/\" target = \"_blank\"><img src = \"./data/graphics/logo-mdp.gif\"/></a></li>"
			+ "<li><h3>Conception :</h3><p>Elioth<br>(contact : <a href =\"mailto:elioth@elioth.fr\">elioth@elioth.fr</a>)</p><a href =\"http://elioth.com/\" target = \"_blank\"><img src = \"./data/graphics/logo-elioth.png\"/></a></li>"
			+ '</ul></div>';

			$("#legend").after(html);

			// Sparkling circles

			var r_div = $("#info_back");

			var win = $(window);
			var W = win.innerWidth(), H = win.innerHeight();
			var r = Raphael(r_div[0], W, H);

			// Adds a circle to the animation
			var addCircle = function(rad, set) {
				// Random parameters
				var alfa = Math.random()*2*Math.PI;
				var rad = Math.floor(25 + Math.random()*40)/2;
				var center = Math.floor(rad*(1.5*Math.random() - 1));
				var sw = Math.floor(5 + 20*Math.random());
				var x = Math.random() < 0.5 ? W*0.1 + center * Math.cos(alfa) : 0.9*W - center * Math.cos(alfa);
				var y = Math.floor(0.1*H + Math.random()*H*0.8);

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

			var int_id = setInterval(function() {
				setTimeout(addCircleToSet(r, ps), Math.floor(Math.random()*500));
				setTimeout(addCircleToSet(r, ps), Math.floor(Math.random()*1000));
			}, 1000);

			$("#info_content").on('mouseover', addCircleToSet(r, ps))


			function unloadInfo() {
				$("#like").show();
				$("#info span").html("i")
				$("#info").toggleClass("x-info")
				$("#info_back").remove();
				$("#info_content").remove();
				$("#info").click(loadInfo);
			}

			$("#like").hide();
			$("#info span").html("x")
			$("#info").toggleClass("x-info")
			$("#info").off("click");
			$("#info").click(unloadInfo);
		}

		$("#info").click(loadInfo);

		function sharePopUp() {
			var w = window.screen.availWidth;
			var h = window.screen.availHeight;
			window.open("html/share.html",'popUpWindow',"height=100,width=400,left="+ w/2 +",top="+ h/2 +",resizable=no,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no,status=no")
		}
		$("#like").on('click', sharePopUp);

	});
}