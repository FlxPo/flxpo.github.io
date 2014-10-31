var app = app || {};

app.Item = Backbone.Model.extend({

	defaults:function() {
		return {
			input:[],
			extraction:[],
			recycling:[],
			waste:[],
			output:[]
		}
	}

});