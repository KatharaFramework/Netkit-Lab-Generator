class SDNData {
    constructor(kataraConfig) {
		this._kataraConfig = kataraConfig.netkit
        this.simulation = null

        this._newPath = new Set()
        this._pendingStep = null

        this._rules = []
    }

	/* --------------------------------------------- */
    /* ------------------- PATHS ------------------- */
	/* --------------------------------------------- */

    appendPathStep(options) {  
		// options è: {device, ingressPort || egressPort }. Ogni campo è string || number
        if (!this._pendingStep) {
            this._pendingStep = options
        } else {
            let step = {
                device: options.device,
                ingressPort: this._pendingStep.ingressPort,
                egressPort: options.egressPort
            }
            this._pendingStep = null
            this._newPath.add(step)
        }
    }

    pathHasAtLeastOneStep() {
        return this._newPath.size > 0
    }

    discardPath() {
		if (this._newPath.size)
			this._newPath = new Set()
        this._pendingStep = null
    }

	/* --------------------------------------------- */
    /* ------------------- RULES ------------------- */
	/* --------------------------------------------- */

    addRule() {
		let device,
			matches,
			action,
			priority = 0,
			idleTimeout = 5000,
			hardTimeout = 10000,
			stats = 0

		if(arguments.length == 3){
			[device, matches, action] = arguments
		} else if(arguments.length == 6){
			[device, matches, action, priority, idleTimeout, hardTimeout] = arguments
		}

		if(!Array.isArray(matches)) matches = [matches]
		
		let rule = { device, matches, action, priority, idleTimeout, hardTimeout, stats }
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

	/* --------------------------------------------- */
    /* ------------- GETTERS & SETTERS ------------- */
	/* --------------------------------------------- */

    getSimulation() {
        return this.simulation
    }

    setSimulation(simulation) {
        this.simulation = simulation
    }

    getPathSteps() {
        if (this.pathHasAtLeastOneStep())
            return this._newPath
    }

    getRules(){
        return this._rules
    }
}