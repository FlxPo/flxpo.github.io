function Stacks() {

	// To store all stacks
	this.list = [];

	// To compute the popup positions
	this.unmessify = function(flows) {

		var list = this.list, len = list.length;
		while(len--) {
			var stack = list[len];
			if (stack.dirty) {
				stack.unmessify();
			}
		}

	}

	this.dirtify = function() {

		var list = this.list, len = list.length;
		while(len--) {
			var stack = list[len];
			stack.dirty = true;
		}


	}
}

function Stack(stack) {

	// Standard/extraction/waste/recycling flows
	this.type = stack.type;

	// Territories linked by the flow
	this.t1 = stack.t1;
	this.t2 = stack.t2;

	// Collection of flows
	this.flows = [];

	// To add a flow to the stack
	this.addToStack = function(flow) {
		this.flows.push(flow);
		this.dirty = true;
	}

	this.dirty = true;

}

Stack.prototype.unmessify = function() {

	this.dirty = false;
		
		var a_inflows = this.flows;

		// var t = 0;
		var steps = 10;
		while (steps--) {

			// t++;

			// setTimeout(function() {

		// For each flow label
		var i = a_inflows.length;
		while(i-- && !a_inflows[i].popup.pos.zero) {

			function checkBounds(flow, position, width) {
				var check = false;
				var xfrom = flow.xfrom, xto = flow.xto, yfrom = flow.yfrom, yto = flow.yto;
				if ( flow.type === "input" || flow.type === "output" ) {
					if ( (position.x - 0.75*width > xfrom) && (position.x + 0.75*width < xto) ) { check = true; }
				} else if ( flow.type === "waste" ) {
					if ( (position.x - width/2 > xfrom) && (position.y < yto) ) { check = true; }
				} else if ( flow.type === "extraction" ) {
					if ( (position.x - width/2 < xto) && (position.y < yfrom) ) { check = true; }
				} else {
					if ( (position.x - width/2 < xfrom) && (position.x - width/2 > xto) ) { check = true; }
				}
				return check;
			}

			var f1 = a_inflows[i].popup.pos;
			var DX = 0, DY = 0, s = 0;
			var mid = a_inflows[i].mid;

			//---------------------------------------------------------
			// Look for overlap with other flow labels
			var j = a_inflows.length;
			while(j--) {
				//-----------------------------------------------------
				if (i !== j && !a_inflows[j].popup.pos.zero) {
					var f2 = a_inflows[j].popup.pos;
					// Test overlap
					var dx = (f1.w+f2.w + 25)/2 - Math.abs(f1.x - f2.x);
					var dy = (f1.h+f2.h + 50)/2 - Math.abs(f1.y - f2.y);
					
					var overlap = (dx > 0 && dy > 0);
					// Add dx, dy to displacement vector
					if (overlap) {
						var dirx = Math.sign(f1.x - f2.x);
						var diry = Math.sign(f1.y - f2.y);
						s = 2
						DX = DX + dirx * dx/s;
						DY = DY + diry * dy/s;
					}
				}//-----------------------------------------------------
			} //--------------------------------------------------------
		
			var k = a_inflows[i].popup.pos.anchor;

			if (DX !== 0 || DY !== 0) {

			// Resulting unconstrained position
			var X = a_inflows[i].popup.pos.x + DX/s;
			var Y = a_inflows[i].popup.pos.y + DY/s;

			// console.log(a_inflows[i].id + " " + DX)

			// Look for the nearest flow pulsepath anchor
			var dir = 0;
			if (a_inflows[i].type === "input" || a_inflows[i].type === "output") {
				dir = Math.sign(DX);
			} else if (a_inflows[i].type === "recyclage") {
				dir = -Math.sign(DX);
			}

			var d1 = 2000;
			var d2 = 1000;

			while (d2 < d1 && checkBounds(a_inflows[i], {x:a_inflows[i].pulsepath[k].x, y:a_inflows[i].pulsepath[k].x}, a_inflows[i].popup.pos.w) ) {
				k = k + dir;
				d1 = d2;
				var dpx = X - a_inflows[i].pulsepath[k].x;
				var dpy = Y - a_inflows[i].pulsepath[k].y;
				d2 = Math.sqrt(dpx*dpx + dpy*dpy);
			}

			a_inflows[i].popup.pos.anchor = k;
			a_inflows[i].popup.pos.x = a_inflows[i].pulsepath[k].x - a_inflows[i].popup.pos.hc;
			a_inflows[i].popup.pos.y = a_inflows[i].pulsepath[k].y - a_inflows[i].popup.pos.hc;

			mid = k;

			}

			// Store results when last step is reached and update positioning
			if (steps === 0) {

				a_inflows[i].mid = mid;

				a_inflows[i].popup.base.css({top:a_inflows[i].pulsepath[k].y - a_inflows[i].popup.pos.hc, left:a_inflows[i].pulsepath[k].x - a_inflows[i].popup.pos.hc});
				a_inflows[i].popup.trend.css({top:a_inflows[i].pulsepath[k].y - a_inflows[i].popup.pos.hc, left:a_inflows[i].pulsepath[k].x + a_inflows[i].popup.pos.hc});

				a_inflows[i].midX = a_inflows[i].popup.pos.x;
				a_inflows[i].midY = a_inflows[i].popup.pos.y;
			}

		}

		// },t*1000); 

		}
	}