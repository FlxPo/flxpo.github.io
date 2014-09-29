$(document).ready(function() {
	// Create the global Brain - App object
	$.getJSON("data/views_nav.json", function(data) {
		var brain = new Brain(data);
	});

	// For offline use
	// var brain = new Brain(views_nav)
})