const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const config = {
	controller: {
		nomeContainer: '',
		set: false
	}
};

app.use(express.static("src"));
app.use(bodyParser.json());

app.post("/setup/", function(request, response){
	console.log("POST <- " + JSON.stringify(request.body));
	
	let nomeContainer = request.body.controllersIP;

	config.controller.nomeContainer = nomeContainer;
	config.controller.set = true;

	response.send("Added controller's name");
});

app.use(function(_, res, next){
	if(!config.controller.set){
		console.log("err: request made before configuration");
		res.send("SET CONTROLLER'S IP FIRST");
	} else next();
});

app.get("/gw/", function(request, response){
	let params = request.query;
	let path = params.path;
	
	console.log("GET " + path + " <- " + JSON.stringify(params));	
	
	curlGET(path, function(risposta, errore){
		if(errore) response.send(errore);
		else response.send(risposta);
	});
});

app.post("/gw/", function(request, response){
	let params = request.body;
	let path = params.path;
	
	console.log("POST " + path + " <- " + JSON.stringify(params));

	delete params.path;

	curlPOST(path, params, () => response.send("Sent!"));
});

app.listen(8080, () => console.log("Server started on port 8080!"));

/* ------------------------------------------------ */
/* --------------------- HTTP --------------------- */
/* ------------------------------------------------ */

const { exec } = require("child_process");

function curlGET(URI, callback){
	myExec("curl http://localhost:8080/" + URI, function(err, stdout, stderr) {
		console.log("RES -> " + stdout)
		callback(stdout, null, null);
	})
}

function curlPOST(path, data, callback) {
	myExec("curl -X POST -d '" + JSON.stringify(data) + "' http://localhost:8080/" + path, function(/* err, stdout, stderr */) {
		callback()
	});
}

function myExec(comando, callback){
	let dockerCMD = "docker exec " + config.controller.nomeContainer + " bash -c \"" + comando.replace(/"/g, '\\"') + "\"";
	console.log("EXEC: " + dockerCMD);

	exec(dockerCMD, callback);
}