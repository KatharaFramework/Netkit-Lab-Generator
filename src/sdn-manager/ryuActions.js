const { exec } = require("child_process");

const ryuActions = {
	getTopology: function () {
		let myhttp = this;
		return new Promise(function (resolve/* , reject */) {
			let machines = [];
			let statsAPIcounter = 0;

			myhttp.get("v1.0/topology/links", {}, function (response){
				let domainCounter = 1;
				let macMapping = {};

				for(let machine of JSON.parse(response)){	// TODO: Scrivi meglio qui e sotto (*)
					let {src, dst} = machine;
					if(!macMapping[src.hw_addr]){
						macMapping[src.hw_addr] = {
							domain: domainCounter++,
							dpid: src.dpid
						};
					}
					macMapping[dst.hw_addr] = {
						domain: macMapping[src.hw_addr].domain,
						dpid: dst.dpid
					};
				}

				myhttp.get("stats/switches", {}, function (response) {
					let switchNames = JSON.parse(response);
					for (let switchName of switchNames) {
						let machine = {
							type: "switch",
							name: switchName,
							interfaces: { if: [] }
						};

						myhttp.get("stats/portdesc/" + switchName, {}, function (response) {
							statsAPIcounter++;
							let switchDescription = JSON.parse(response);
							switchDescription[switchName].forEach(port => {
								let match = port.name.match(/^eth(\d)$/);	// TODO: Va bene così? Se le porte non hanno questo nome non sono analizzate
								if (match && match[1]) {
									if(macMapping[port.hw_addr]) {
										machine.alternativeName = macMapping[port.hw_addr].dpid;	// TODO: Se puoi migliora anche qui
										// TODO: Questo è anche il caso in cui la porta si affaccia sul mondo esterno => Aggiungere la classe 'edge' al nodo
									}
									machine.interfaces.if.push({
										eth: {
											domain: macMapping[port.hw_addr] ?	// TODO: Così non mi piace (* vedi sopra).
												("SDN " + macMapping[port.hw_addr].domain) :	// TODO: C'è da intervinire anche in 'makeNodesAndEdges' di simulation.js
												("Network " + domainCounter++),
											number: match[1]
										}
									});
								} else {
									console.warn("Ignoring port '" + port.name + "'");
								}
							});

							machines.push(machine);
							if (statsAPIcounter == switchNames.length) {
								resolve(machines);
							}
						});
					}
				});
			});
		});
	},

	getSwitchRules: function (switchName) {
		// Ottengo tutte le regole installate su uno switch
		return new Promise((resolve) => {
			this.getFromSwitchCustom("stats/flow", switchName)
				.then(switchRules => resolve(switchRules));
		});
	},

	getTablesFilteredNotEmpty: function (switchName) {
		// Ottengo tutte le tables di uno switch ma tolgo tutte quelle vuote
		return new Promise((resolve) => {
			this.getFromSwitchCustom("stats/table", switchName)
				.then(function (tables) {
					resolve(tables.filter(table => table["active_count"] != 0));
				});
		});
	},

	getFromSwitchCustom: function (what, switchName) {
		// Metodo generico per ottenre informazioni da uno switch
		let myhttp = this;
		return new Promise(function (resolve) {
			myhttp.get(what + "/" + switchName, {}, function (response) {
				resolve(JSON.parse(response)[switchName]);
			});
		});
	},

	updateStatisticsAll: function() {
		let myhttp = this;
		myhttp.get("stats/switches", {}, function (response) {
			let switchNames = JSON.parse(response);
			for (let switchName of switchNames) {
				myhttp.get("stats/flow/" + switchName, {}, function (response){
					response = JSON.parse(response);
					// TODO
				});
			}
		});
	},

	addFlowEntry: function (rule, callback) {
		let myhttp = this;
		let openflowRules = [];
		rules = this._splitMPLSRule(rule);
		rules.forEach((rule, index) => {
			let openflow_rule = ruleUtils.openFlowRules.makeOpenFlowRuleFromSimulatedOne(rule, 10000 * (index + 1));
			openflowRules.push(openflow_rule);
			// Installo la nuova regola nel controller
			myhttp.post("stats/flowentry/add", openflow_rule);

		});

		rule.openflowRules = openflowRules;
		callback();
	},

	_splitMPLSRule: function(rule){
		// Le regole MPLS devono essere sdoppiate perché ce ne deve essere 1 per protocollo.
		// Per ora i protocolli che vogliamo includere sono: IPv4, ARP
		if(rule.actions.concat(rule.matches).some(field => field.name.includes("MPLS"))){
			return [rule, rule];
		} else return [rule];
	},

	removeFlowEntry: function (rule, callback){
		let myhttp = this;
		// TODO: Non riesco a rimuovere la regola installata di default (quella che invia gli LLDP al controller). E' colpa mia o non si può fare?
		if(rule.openflowRules.length == 0) throw new Error("La regola non risulta installata");

		rule.openflowRules.forEach(openflowRule => {
			ruleUtils.openFlowRules.removeNonStaticFields(openflowRule);
			myhttp.post("stats/flowentry/delete_strict", openflowRule, (/*response, errorCode */) => callback());
		});
	},
	
	/* ----------------------------------------------------------- */
	/* ----------------- RYU COMMUNICATION ----------------------- */
	/* ----------------------------------------------------------- */
	
	nomeContainerController: null,
	
	setController: (nomeContainer) => this.nomeContainerController = nomeContainer,
	
	makeCustom(method, path, params, callback){
		if (method == "GET") this.get(path, params, callback);
		else if (method == "POST") this.post(path, params, callback);
	},
	
	get: function(path, params, callback){
		console.log("GET " + path + " <- " + JSON.stringify(params));
		this._myExec("curl http://localhost:8080/" + path + this._makeQueryString(params), callback);
		// callback(JSON.stringify(mockRequests.find(el => el.endpoint == path).answer))	// DEV
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
		for (let par in params) {
			queryString += par + "=" + params[par] + "&";
		}
		return queryString;
	}
}


// const mockRequests = [	// DEV
// 	{
// 		method: "GET",
// 		endpoint: "v1.0/topology/links",
// 		answer: [{ src: { hw_addr: "e6:80:13:d5:a8:87", name: "eth1", port_no: "00000001", dpid: "0000c6ed2074a040" }, dst: { hw_addr: "f6:8b:7a:94:bd:2f", name: "eth1", port_no: "00000001", dpid: "00003a443fcbef41" } }, { src: { hw_addr: "f6:8b:7a:94:bd:2f", name: "eth1", port_no: "00000001", dpid: "00003a443fcbef41" }, dst: { hw_addr: "e6:80:13:d5:a8:87", name: "eth1", port_no: "00000001", dpid: "0000c6ed2074a040" } }]
// 	},
// 	{
// 		method: "GET",
// 		endpoint: "stats/switches",
// 		answer: [218721754062912, 64064802516801]
// 	},
// 	{
// 		method: "GET",
// 		endpoint: "stats/portdesc/218721754062912",
// 		answer: { 218721754062912: [{ hw_addr: "c6:ed:20:74:a0:40", curr: 0, supported: 0, max_speed: 0, advertised: 0, peer: 0, port_no: "LOCAL", curr_speed: 0, name: "br0", state: 1, config: 1 }, { hw_addr: "e6:80:13:d5:a8:87", curr: 2112, supported: 0, max_speed: 0, advertised: 0, peer: 0, port_no: 1, curr_speed: 10000000, name: "eth1", state: 0, config: 0 }, { hw_addr: "e6:7f:53:cf:e0:3e", curr: 2112, supported: 0, max_speed: 0, advertised: 0, peer: 0, port_no: 2, curr_speed: 10000000, name: "eth2", state: 0, config: 0 }] }
// 	},
// 	{
// 		method: "GET",
// 		endpoint: "stats/portdesc/64064802516801",
// 		answer: { 64064802516801: [{ hw_addr: "3a:44:3f:cb:ef:41", curr: 0, supported: 0, max_speed: 0, advertised: 0, peer: 0, port_no: "LOCAL", curr_speed: 0, name: "br0", state: 1, config: 1 }, { hw_addr: "f6:8b:7a:94:bd:2f", curr: 2112, supported: 0, max_speed: 0, advertised: 0, peer: 0, port_no: 1, curr_speed: 10000000, name: "eth1", state: 0, config: 0 }, { hw_addr: "62:73:3c:96:1a:ae", curr: 2112, supported: 0, max_speed: 0, advertised: 0, peer: 0, port_no: 2, curr_speed: 10000000, name: "eth2", state: 0, config: 0 }] }
// 	},
// 	{
// 		method: "GET",
// 		endpoint: "stats/flow/218721754062912",
// 		answer: { 218721754062912: [{ actions: ["OUTPUT:CONTROLLER"], idle_timeout: 0, "cookie": 0, packet_count: 33, hard_timeout: 0, byte_count: 1980, duration_sec: 29, duration_nsec: 452000000, priority: 65535, length: 96, flags: 0, table_id: 0, match: { dl_type: 35020, dl_dst: "01:80:c2:00:00:0e" } }] }
// 	},
// 	{
// 		method: "GET",
// 		endpoint: "stats/flow/64064802516801",
// 		answer: { "64064802516801": [{ actions: ["OUTPUT:CONTROLLER"], idle_timeout: 0, "cookie": 0, packet_count: 35, hard_timeout: 0, byte_count: 2100, duration_sec: 30, duration_nsec: 400000000, priority: 65535, length: 96, flags: 0, table_id: 0, match: { dl_type: 35020, dl_dst: "01:80:c2:00:00:0e" } }] }
// 	}
// ]
