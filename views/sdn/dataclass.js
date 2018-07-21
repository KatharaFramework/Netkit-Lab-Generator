class SDNData {
    constructor(kataraConfig) {
		this._kataraConfig = kataraConfig
		this.simulation = null
		
		this._path = {
			steps: [],
			pendingStep: null,
			startsFromEdge: false,
			endsOnEdge: false
		}

		this._rules = []
		this._ruleId = 0
    }

	/* --------------------------------------------- */
    /* ------------------- PATHS ------------------- */
	/* --------------------------------------------- */

    appendPathStep(options) {  
		// options è: {device, ingressPort || egressPort }. Ogni campo è string || number
        if (!this._path.pendingStep) {
            this._path.pendingStep = options
        } else {
            let step = {
                device: options.device,
                ingressPort: this._path.pendingStep.ingressPort,
				egressPort: options.egressPort,
				isStart: false,
				isEnd: false
            }
            this._path.pendingStep = null
            this._path.steps.push(step)
        }
    }

    pathHasAtLeastOneStep() {
        return this._path.steps.length > 0
    }

    discardPath() {
		if (this._path.steps.length)
			this._path.steps = []
		this._path.pendingStep = null
		this._path.startsFromEdge = false
		this._path.endsOnEdge = false
	}

	setPathEdgeProps(startsFromEdge, endsOnEdge){
		if(startsFromEdge) this._path.startsFromEdge = true
		if(endsOnEdge) this._path.endsOnEdge = true
	}

    getPath() {
        if (this.pathHasAtLeastOneStep()){
			if(this._path.startsFromEdge)
				this._path.steps[0].isStart = true
			if(this._path.endsOnEdge)
				this._path.steps[this._path.steps.length - 1].isEnd = true

            return this._path.steps
		}
    }

	/* --------------------------------------------- */
    /* ------------------- RULES ------------------- */
	/* --------------------------------------------- */

    addRule() {
		let device,
			matches,
			actions,
			priority = 0,
			idleTimeout = 0,
			hardTimeout = 0,
			stats = 0

		if(arguments.length == 3){
			[device, matches, actions] = arguments
		} else if(arguments.length == 6){
			[device, matches, actions, priority, idleTimeout, hardTimeout] = arguments
		}

		if(!Array.isArray(matches)) matches = [matches]
		if(!Array.isArray(actions)) actions = [actions]
		
		let rule = { device, matches, actions, priority, idleTimeout, hardTimeout, stats }
		this._rules.push(rule)
		return rule
    }

    getDeviceRules(deviceName) {
        return this._rules.filter(rule => rule.device == deviceName)
    }

	/* ---------------------------------------------- */
    /* --------------- NETWORK CONFIG --------------- */
	/* ---------------------------------------------- */

	getDeviceInfo(deviceName) {
		let deviceInfos = this._kataraConfig.find(
			deviceInfos => deviceInfos.name == deviceName
		)
		return {
			interfaces: deviceInfos.interfaces.if.map(function (interfaccia) {
				return {
					number: interfaccia.eth.number,
					domain: interfaccia.eth.domain,
					ip: interfaccia.ip
				}
			}),
			name: deviceInfos.name,
			type: deviceInfos.type
		}
	}

	getControllerName(){
		for (let machine of this._kataraConfig){
			if(machine.type == 'controller') return machine.name
		}
	}

	/* --------------------------------------------- */
    /* ------------- GETTERS & SETTERS ------------- */
	/* --------------------------------------------- */

    getSimulation() {
        return this.simulation
    }

    setSimulation(simulation) {
        this.simulation = simulation
    }

    getRules(){
		this._rules = this._rules.filter(rule => !rule.deleted)
		return this._rules
    }
}