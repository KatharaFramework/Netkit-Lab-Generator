const dataStore = {
	_katharaConfig: null,
	simulation: null,
	_rules: [],

	_path: {
		steps: [],
		pendingStep: null,
		startsFromEdge: false,
		endsOnEdge: false
	},

	set(katharaConfig){
		this._katharaConfig = katharaConfig;
		katharaConfig.forEach(machine => this.retrieveRulesOnTheSwitch(machine.name));
	},

	isReady(){ return this._katharaConfig !== null},

	/* --------------------------------------------- */
	/* ------------------- PATHS ------------------- */
	/* --------------------------------------------- */

	appendPathStep(options) {  
		// options è: {device, ingressPort || egressPort }. Ogni campo è string || number
		if (!this._path.pendingStep) {
			this._path.pendingStep = options;
		} else {
			let step = {
				device: options.device,
				ingressPort: this._path.pendingStep.ingressPort,
				egressPort: options.egressPort,
				isStart: false,
				isEnd: false
			};
			this._path.pendingStep = null;
			this._path.steps.push(step);
		}
	},

	pathHasAtLeastOneStep() {
		return this._path.steps.length > 0;
	},

	discardPath() {
		if (this._path.steps.length)
			this._path.steps = [];
		this._path.pendingStep = null;
		this._path.startsFromEdge = false;
		this._path.endsOnEdge = false;
	},

	setEdgeProperties(startsFromEdge, endsOnEdge){
		if(startsFromEdge) this._path.startsFromEdge = true;
		if(endsOnEdge) this._path.endsOnEdge = true;
	},

	getPath() {
		if (this.pathHasAtLeastOneStep()){
			if(this._path.startsFromEdge) this._path.steps[0].isStart = true;
			if(this._path.endsOnEdge) this._path.steps[this._path.steps.length - 1].isEnd = true;

			return this._path.steps;
		}
	},

	/* ----------------------------------------------- */
	/* -------------------- RULES -------------------- */
	/* ----------------------------------------------- */

	/**
	 * Crea una nuova regola e la memorizza.
	 * Il numero di parametri di questo metodo non è stabilito, ma in base al loro numero
	 * è determinato il loro significato:
	 * 3 parametri => device, matches, actions
	 * 7 parametri => device, matches, actions, priority, table, idleTimeout, hardTimeout
	 * 8 parametri => device, matches, actions, priority, table, idleTimeout, hardTimeout, stats
	 * 
	 * Nel caso di 8 parametri si suppone che la regola sia stata creata a partire da una regola OpenFlow,
	 * per cui l'ultimo parametro è la statistica di attivazioni della regola nell'ambiente Kathara.
	 */
	createAndStoreRule(...values) {
		let rule = ruleUtils.simulatedRules.createNewRule(...values);
		this.storeRule(rule);
		return rule;
	},

	storeRule(rule){
		ruleUtils.simulatedRules.addAPointerToLabelInTheRuleMPLSFields_andAddLablesToLabelsSection(rule);
		this._rules.push(rule);
	},

	/* ------------------- IMPORT ------------------- */

	importRules(rules){
		for (let rule of rules){
			let newRule = this.createAndSaveRule(rule.device, rule.matches, rule.actions, rule.priority, rule.table, rule.idleTimeout, rule.hardTimeout);
			ruleUtils.simulatedRules.addAPointerToLabelInTheRuleMPLSFields_andAddLablesToLabelsSection(newRule, true);	// TODO: Controlla che funzioni
		}
	},

	/* ------------------------------------------------ */
	/* ------------------ CONTROLLER ------------------ */
	/* ------------------- (& rules) ------------------- */

	submitAllRules() {
		if(confirm("Every new/edited rule is going to be installed in the controller. Would you like to procede?")){
			this.getRules().forEach(rule => {
				if(!rule.submitted || rule.edited){
					ryuActions.addFlowEntry(rule, function(err){
						if(!err){
							rule.submitted = true;
							rule.edited = false;
							rule.deleted = false;
						}
					});
				} else if(rule.deleted && rule.submitted){
					ryuActions.removeFlowEntry(rule, () => {
						rule.submitted = false;
					});
				}
			});
		}
	},

	retrieveRulesOnTheSwitch(switchName){
		ryuActions.getSwitchRules(switchName).then(rules => {
			let simulatedRules = rules.map(rule =>
				ruleUtils.simulatedRules.makeSimulatedRuleFromOpenFlowOne(switchName, rule));

			let mergedRules = ruleUtils.simulatedRules.mergeMPLSRulesWithDifferentProtocolMatch(simulatedRules);
			mergedRules.forEach(newRule => this.storeRule(newRule));
		});
	},

	/* ---------------------------------------------- */
	/* --------------- NETWORK CONFIG --------------- */
	/* ---------------------------------------------- */

	getDeviceInfo(deviceName) {
		let deviceInfos = this._katharaConfig.find(
			deviceInfos => deviceInfos.name == deviceName
		);
		return {
			interfaces: deviceInfos.interfaces.if.map(function (interfaccia) {
				return {
					number: interfaccia.eth.number,
					domain: interfaccia.eth.domain,
					ip: interfaccia.ip
				};
			}),
			name: deviceInfos.name,
			type: deviceInfos.type
		};
	},

	/* --------------------------------------------- */
	/* ------------- GETTERS & SETTERS ------------- */
	/* --------------------------------------------- */

	getSimulation() {
		return this.simulation;
	},

	setSimulation(simulation) {
		this.simulation = simulation;
	},

	getRules(){
		this._rules = this._rules.filter(rule => !rule.deleted || rule.submitted);
		return this._rules;
	},

	getSwitchRules(deviceName) {
		return this.getRules().filter(rule => rule.device == deviceName);
	},

	getSubmittedRules(){
		return this.getRules().filter(rule => rule.submitted);
	}
}