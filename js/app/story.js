function Story(app, data, callback) {

	this.app = app;
	this.territories = app.territories;
	this.flows = app.flows;
	this.projects = app.projects;
	app.story = this;
	this.seq = [];
	this.step = 0;

	this.tab = null;
	this.year = "o4";

		var self = this;

		this.changeYear = function(year, animate, first_pass, scaling) {

			return function(view_list, hide_list) {

				this.flows.stopAnimTrends();

				var tab = this.tab;
				if (tab === "matter" && year === "o9") {
					this.flows.stopAnimTrends();
				} else {
					var title = ""
					var story = [""]
					this.flows.stopAnimTrends();
					var popups = [];
					var vl = view_list || [""], hl = hide_list || [""];
					this.flows.changeYear(vl, hl, popups, title, story, year, animate, first_pass, scaling);
				}
			}
		}

		this.changeYear2 = function(year, animate, first_pass, scaling) {

			return function() {

				$("#trend_legend").empty();

				year = this.year === "o4" ? "o9" : "o4";
				this.year = year;

				this.flows.stopAnimTrends();

				if (this.tab === "matter" && year === "o9") {
					$("#time .toggle span").html("Tendances");
					var mat = app.story.narratives["matter"], len = mat.length;
					mat[len-1].button.click();
					// this.flows.hideBases();
					// this.flows.animTrends();
					console.log("animating")
				} else if (this.tab === "matter" && year === "o4") {
					this.flows.stopAnimTrends();
					console.log("stop animating")
					// this.flows.showBases();
				} else {
					console.log("stop animating")
					this.flows.stopAnimTrends();
					var title = ""
					var story = [""]
					var popups = [];
					this.flows.changeYear([], [], popups, title, story, year, animate, first_pass, scaling);
				}
			}
		}


			function Narrative(index, data, type, story) {

				this.index = index;
				this.title = data.title;
				this.type = type;
				this.display_dot = data.display_dot;

				// Append the navigation dot
				if (data.display_dot) {
					var html = "<li id = \""+this.title+"\" class = \"n_button\">" +
							"<div class=\"callout border-callout\"><h3>" +
							data.title +
							"</h3><b class=\"border-notch notch\"></b>" +
							"<b class=\"notch\"></b>" +
							"</div>" +
							"</li>";

				this.button = $(html).appendTo($("#nav ul"));

				// Reposition the tip
				var tip = $(".callout", this.button)
				var dim = tip.getHiddenDimensions();
				tip.css({left:-dim.width*0.45-7.5, top:-dim.height - 25})

				this.button.click(function() {
					$(this).parent().children().each(function() {$(this).removeClass("n-clicked");});
					$(this).addClass("n-clicked");
				})

				}

				// Store the steps and the state of the story
				this.steps = data.steps;
				this.b_steps = data.b_steps;
				this.i = -1;

				// Handler for a forward/backward move in the story
				this.nextStep = function(dir) {
					return function() {

					var step = this.steps[0];

					// If steps in the story
					if (this.steps.length > 1) {
						//If moving forward
						if (dir === 1) {
							this.i = this.i+1;
							step = this.steps[this.i];
						// If moving backward
						} else {
							this.i = this.i-1;
							step = this.b_steps[this.i];
						}
					// No steps in the story, just load the first
					} else {
						this.i = 0;
					}

					// When the story starts or returns to the beginning, hide the previous button
					if (this.i === 0) {
						app.ui.controls["#s_button.previous"].button.hide();
						$("#s_button.next span").html("Plus d'infos !")
					}

					// When the story is launched, change the next button label, display the previous button
					if (this.i > 0) {
						app.ui.controls["#s_button.previous"].button.show();
						app.ui.controls["#s_button.next"].button.show();
						$("#s_button.next span").html("Info suivante !")
					}

					//If the last step is reached, escape the step, hide the next button and preserve the step count
					if (this.i === this.steps.length - 1) {
						app.ui.controls["#s_button.next"].button.hide();
					}



					// Text
					function injectText() {
						$("#s_text").html("<p>"+step.text.content+"</p>");
						var time = 200;
						if (step.text.time) time = step.text.time;
						$("#s_text").delay(time).animate({opacity:1}, 200);
					};

					$("#s_text").animate({opacity:0}, 200, $.proxy(injectText, this));

					// Territories
					var ts = step.territories, tlen = ts.length;
					
					if (tlen !== 0) {
						while (tlen--) {
							(function(tlen) {
								setTimeout(function() {
								var t_target = eval("app.territories.list[\"" + ts[tlen].target + "\"]");
								eval("t_target." + ts[tlen].action + ".bind(t_target)")(ts[tlen].parms);
							}, parseInt(ts[tlen].time));})(tlen)
						}
					}
					

					//Flows

					var fs = step.flows, flen = fs.length;
						if (flen !== 0) {

							$("#legend").show();

							while (flen--) {
								(function(flen) {setTimeout(function() {

									var cy = $("#time .toggle > span");
									var ty = cy.html() === "2004" ? "o4" : "o9";
									if (ty !== fs[flen].year) {
										$("#time .toggle").toggleClass("toggle-right");
										var rep = fs[flen].year === "o4" ? "2004" : "2012";
										cy.html(rep);
										app.story.year = fs[flen].year;
									}
					
									app.flows.changeYear(fs[flen].vl, fs[flen].hl, fs[flen].popups, "", [""], fs[flen].year, fs[flen].anim, fs[flen].fp, fs[flen].scaling, fs[flen].anim_trend);
								}, parseInt(fs[flen].time));})(flen)
							}
						}
						else {$("#legend").hide();}

					// UI show and hide
					if (!app.intro) {
					var us = step.ui.show, ulen = us.length;
					if (ulen !== 0) {while (ulen--) {app.ui.controls["#"+us[ulen]].button.fadeIn(300);}}
					var uhs = step.ui.hide, uhlen = uhs.length;
					if (uhlen !== 0) {
						while (uhlen--) {
						app.ui.controls["#"+uhs[uhlen]].button.fadeOut(300);
					}}
					}

					// Functions
					var fus = step.functions,fulen = fus.length;
					if (fulen !== 0) {while (fulen--) {app.flows.list[fus[fulen]].popup.show_base = true;}}
					}
				};

				// Handler when switching to the narrative, need to reset all other narratives handlers
				this.loadNav = function() {
					return function() {

					// Load li navigation


					// Unload all flows, territories
					story.app.flows.unloadAll();
					// story.app.territories.hideAll();
					
					// Reset previous narrative
					// story.narratives[this.type][story.state].i = -1;
					story.state = this.index;

					// Inject title and subtitle of the narrative
					// $("#title").animate({opacity:0}, 200, function() {
						$("#title h2").html(data.title);
						$("#title p").html(data.subtitle);
					// });
					// $("#title").delay(200).animate({opacity:1}, 200);

					// Unbind previous story handlers
					app.ui.controls["#s_button.next"].button.off("click");
					app.ui.controls["#s_button.previous"].button.off("click");
					app.ui.controls["#go"].button.off("click","**");

					// Load new ones
					app.ui.controls["#s_button.next"].button.on('click', $.proxy(this.nextStep(1), this));
					app.ui.controls["#s_button.previous"].button.on('click', $.proxy(this.nextStep(-1), this));
					// app.ui.controls["#go"].button.on('click', $.proxy(this.autoplay,this));

					// Load first step
					$.proxy(this.nextStep(1), this)();

					}
				}

				// Bind mouse events for narrative access
				if (data.display_dot) this.button.on('click', $.proxy(this.loadNav(), this));
				
			}

			$("#time").on('click', $.proxy(this.changeYear2(this.year, true, false, false),this));
			
			$("#nav ul").empty();

			this.state = 0;
			this.narratives = {matter:[], energy:[], water:[]};

			function loadNarratives(story, stories, type) {
				var narr = [], len = stories[type].length, i = 0;
				for (;i<len;i++) {narr.push(new Narrative(i, stories[type][i], type, story));}
				return narr;
			}

			this.narratives.matter = loadNarratives(this, data.stories, "matter");
			this.narratives.energy = loadNarratives(this, data.stories, "energy");
			this.narratives.water = loadNarratives(this, data.stories, "water");


			function accessTab(type) {
				return function() {
					var nars = this.narratives;
					this.tab = type;

					$.proxy(nars[type][0].loadNav(), nars[type][0])();
					if (nars[type][0].button) nars[type][0].button.addClass("n-clicked");

					this.flows.showBases();
					this.flows.anim_trends = false;

					$("#flows").velocity("stop", true);
					$("#flows").css({top:0});

					for (var key in nars) {
						if (nars.hasOwnProperty(key)) {
							// Display li navigation
							var nar = nars[key], len = nar.length;
							var velo = key === type ? "fadeIn" : "fadeOut";
							var disp = key === type ? "inline-block" : "none";
							while(len--) {
								if (nar[len].display_dot) nar[len].button.velocity(velo, {duration:0, display:disp});
							}
						}
					}
				}
			}

			app.ui.controls["#matter"].button.on('click', $.proxy(accessTab("matter"), this))
			app.ui.controls["#water"].button.on('click', $.proxy(accessTab("water"), this))
			app.ui.controls["#energy"].button.on('click', $.proxy(accessTab("energy"), this))



			if (this.narratives.matter[0]) {
				$.proxy(accessTab("matter"), this)();
				// app.ui.controls["#matter"].button.click();
			}

			var s = 0;
			function nextNarr(story) {
				s++;
				if (s ===  story.narratives[story.tab].length) {return;}
				else {story.narratives[story.tab][s].button.click();}
			}

			function previousNarr(nars) {
				s--;
				nars[story.tab][s].button.click();}

			function prog(story) {
				return function(e) {
				    switch(e.which) {
				        case 37:previousNarr(story) // left
				        break;
				        case 39:nextNarr(story) // right
				        break;
				        default: return; // exit this handler for other keys
				    }
				    e.preventDefault(); // prevent the default action (scroll / move caret)
				}
			}

				// $(document).keydown(prog(this));



	// End of the data loading chain, hide the loader
	$("body").css({cursor:"default"})
	app.intro = false;

	callback();
}