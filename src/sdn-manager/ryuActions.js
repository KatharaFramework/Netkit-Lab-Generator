const ryuActions = {
	/* -------------------------------------------------------------- */
	/* ---------------------------- GETs ---------------------------- */
	/* -------------------------------------------------------------- */
	getTopology: function () {
		return new Promise(function (resolve/* , reject */) {
			let machines = [];
			let statsAPIcounter = 0;

			myhttp.makeRequest("GET", "v1.0/topology/links", {}, function (response /*, errorCode */){
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

				myhttp.makeRequest("GET", "stats/switches", {}, function (response /*, errorCode */) {
					let switchNames = JSON.parse(response);
					for (let switchName of switchNames) {
						let machine = {
							type: "switch",
							name: switchName,
							interfaces: { if: [] }
						};

						myhttp.makeRequest("GET", "stats/portdesc/" + switchName, {}, function (response /*, errorCode */) {
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
			this.getFromSwitchCustom(switchName, "stats/flow")
				.then(switchRules => resolve(switchRules));
		});
	},

	getTablesFilteredNotEmpty: function (switchName) {
		// Ottengo tutte le tables di uno switch ma tolgo tutte quelle vuote
		return new Promise((resolve) => {
			this.getFromSwitchCustom(switchName, "stats/table")
				.then(function (tables) {
					resolve(tables.filter(table => table["active_count"] != 0));
				});
		});
	},

	getFromSwitchCustom: function (switchName, what) {
		// Metodo generico per ottenre informazioni da uno switch
		return new Promise(function (resolve) {
			myhttp.makeRequest("GET", what + "/" + switchName, {}, function (response /*, errorCode */) {
				resolve(JSON.parse(response)[switchName]);
			});
		});
	},
	
	updateStatisticsAll: function() {
		myhttp.makeRequest("GET", "stats/switches", {}, function (response /*, errorCode */) {
			let switchNames = JSON.parse(response);
			for (let switchName of switchNames) {
				myhttp.makeRequest("GET", "stats/flow/" + switchName, {}, function (response /*, errorCode */){
					response = JSON.parse(response);
					// TODO
				});
			}
		});
	},

	/* --------------------------------------------------------------- */
	/* ---------------------------- POSTs ---------------------------- */
	/* --------------------------------------------------------------- */

	addFlowEntry: function (rule, callback) {
		let openflowRules = [];
		rules = this._splitMPLSRule(rule);
		rules.forEach((rule, index) => {
			let openflow_rule = ruleUtils.openFlowRules.makeOpenFlowRuleFromSimulatedOne(rule, 10000 * (index + 1));
			openflowRules.push(openflow_rule);
			// Installo la nuova regola nel controller
			myhttp.makeRequest("POST", "stats/flowentry/add", openflow_rule);
			
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
		// TODO: Non riesco a rimuovere la regola installata di default (quella che invia gli LLDP al controller). E' colpa mia o non si può fare?
		if(rule.openflowRules.length == 0) throw new Error("La regola non risulta installata");

		rule.openflowRules.forEach(openflowRule => {
			ruleUtils.openFlowRules.removeNonStaticFields(openflowRule);
			myhttp.makeRequest("POST", "stats/flowentry/delete_strict", openflowRule, (/*response, errorCode */) => callback());
		}
		);
	}
};