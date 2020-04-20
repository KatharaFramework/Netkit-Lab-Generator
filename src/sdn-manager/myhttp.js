const { exec } = require("child_process");

var myhttp = {
	nomeContainerController: undefined,

	setController: (nomeContainer) => this.nomeContainerController = nomeContainer,

	makeRequest: function (method, path, params, callback) {
		if (method == "GET") this.get(path, params, callback);
		else if (method == "POST") this.post(path, params, callback);
	},

	get: function(path, params, callback){
		console.log("GET " + path + " <- " + JSON.stringify(params));
		this._myExec("curl http://localhost:8080/" + path + this._makeQueryString(params), callback);
	},

	post: function(path, params, callback){
		console.log("POST " + path + " <- " + JSON.stringify(params));
		this._myExec("curl -X POST -d '" + JSON.stringify(params) + "' http://localhost:8080/" + path, callback);
	},
	
	_myExec: function (comando, callback){
		let dockerCMD = "docker exec " + nomeContainerController + " bash -c \"" + comando.replace(/"/g, '\\"') + "\"";
		console.log("EXEC: " + dockerCMD);
	
		exec(dockerCMD, function(err, stdout, stderr) {
			console.log("RES -> " + stdout);
			if(callback) callback(stdout);
		});
	},

	_makeQueryString: function (params) {
		var queryString = "?";
		for (var par in params) {
			queryString += par + "=" + params[par] + "&";
		}
		return queryString;
	}
};
