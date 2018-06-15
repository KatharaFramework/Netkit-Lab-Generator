class SDNData {
    constructor() {
        this.simulation = null

        this.newPath = new Set()
        this._pendingStep = null
        this.pathOutputDiv = null

        this.rules = []
    }

    /* PATHS */

    appendPathStep(options) {   // options è: {device, ingressPort || egressPort }. Ogni campo è string||number
        if (!this._pendingStep) {
            this._pendingStep = options
        } else {
            if (this._pendingStep.device != options.device)
                throw new Error("Path non conforme. Forse uno step precedente è rimasto in memoria")
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

    isEditingLabels() {
        return this.pathOutputDiv != null
    }

    discardPath() {
        if (this.newPath.size) this.newPath = new Set()
        this._pendingStep = null
    }

    /* RULES */

    addRule() {
        let device, matches, action, priority, idleTimeout, hardTimeout, stats, isLabelForwarding
        if(arguments.length == 8){
            [device, matches, action, priority, idleTimeout, hardTimeout, stats, isLabelForwarding] = arguments
        } else if (arguments.length > 10 && (arguments.length % 2 == 0)){
            console.error('TODO in addRule')
        } else {
            throw new Error('Utilizzo incorretto di addRule')
        }

        let deviceRules = this.getDeviceRules(device)
        let newRule = {
            matches, action,
            idleTimeout, hardTimeout,
            // TODO: Rimuovi Math
            priority, stats: (stats || Math.floor(Math.random()*100)),
            isLabelForwarding
        }

        if (deviceRules) {
            deviceRules.push(newRule)
        } else {
            this.rules.push({
                deviceName: device,
                rules: [newRule]
            })
        }
        return newRule
    }

    getDeviceRules(deviceName) {
        let deviceRules = this.rules.find(el => el.deviceName == deviceName)
        if (deviceRules) return deviceRules.rules
    }

    changePriority(val){
        // TODO
    }

    _isSameRule(first, second) {
        // TODO
    }

    _isOverrideRule(newRule, oldRule) {
        // TODO?
    }

    /* --------- GETTERS & SETTERS --------- */

    getSimulation() {
        return this.simulation
    }

    setSimulation(simulation) {
        this.simulation = simulation
    }

    getPathOutputDiv(){
        return this.pathOutputDiv
    }

    setPathOutputDiv(el){
        this.pathOutputDiv = el
    }

    getPathSteps() {
        if (this.pathHasAtLeastOneStep())
            return this.newPath
    }
}