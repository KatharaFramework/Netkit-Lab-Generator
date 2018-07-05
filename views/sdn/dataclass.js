class SDNData {
    constructor() {
        this.simulation = null

        this.newPath = new Set()
        this._pendingStep = null

        this.rules = []
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
            this.newPath.add(step)
        }
    }

    pathHasAtLeastOneStep() {
        return this.newPath.size > 0
    }

    discardPath() {
		if (this.newPath.size)
			this.newPath = new Set()
        this._pendingStep = null
    }

	/* --------------------------------------------- */
    /* ------------------- RULES ------------------- */
	/* --------------------------------------------- */

    addRule() {
		let device,
			matches,
			actions,
			priority = 0,
			idleTimeout = 5000,
			hardTimeout = 10000,
			stats = 0

		if(arguments.length == 3){
			[device, matches, actions] = arguments
		} else if(arguments.length == 6){
			[device, matches, actions, priority, idleTimeout, hardTimeout] = arguments
		}

		if(!Array.isArray(matches)) matches = [matches]
		if(!Array.isArray(actions)) actions = [actions]
		
		let rule = { device, matches, actions, priority, idleTimeout, hardTimeout, stats }
		this.rules.push(rule)
		return rule
    }

    getDeviceRules(deviceName) {
        return this.rules.filter(rule => rule.device == deviceName)
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
            return this.newPath
    }

    getRules(){
        return this.rules
    }
}