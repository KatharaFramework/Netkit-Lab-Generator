let ruleModal = new Vue({
	el: '#rule-modal',
	data: {
		visible: false,
		header: 'TODO: see open(...)',
		device: '',
		rule: {
			matches: [{
				name: 'any',
				value: ''
			}],
			action: {
				name: 'noselection',
				value: ''
			},
			priority: 1,
			idleTimeout: 100,
			hardTimeout: 500
		},
		queue: []
	},
	methods: {
		close: function(){
			this.visible = false
			if(this.queue.length){
				this.prompt(this.queue.pop())
			}
		},

		open: function(device, header){
			this.resetRuleValues()
			this.visible = true
			this.device = device
			this.header = header || 'Create new rule for ' + device
		},

		prompt: function(partialRule){	// es. {action: {name: 'MPLS label'}}
			// TODO: Controlla
			// TODO: Imposta l'header
			if(this.visible){
				this.queue.push(partialRule)
			} else {
				this.open()
				Object.assign(this.rule, partialRule)
			}
		},

		makeNewLine: function(){
			this.rule.matches.push({name: 'noselection', value: ''})
		},

		removeLastLine: function(){
			if(this.rule.matches.length > 1)
				this.rule.matches.pop()
		},

		resetRuleValues: function(){
			this.rule = {
				matches: [{ name: 'any', value: '' }],
				action: { name: 'noselection', value: '' },
				priority: 1,
				idleTimeout: 100,
				hardTimeout: 500
			}
		},

		makeRule: function(){
			let rule = sdnData.addRule(
				this.device,
				this.rule.matches,
				this.rule.action,
				this.rule.priority,
				this.rule.idleTimeout,
				this.rule.hardTimeout,
			)
			rulesDiv.packetRules.push(rule)
			this.close()
		}
	}
})

function setInputPattern(value, inputEl) {
    // TODO: Ho già provato a fare 'switch(value){case ...: ...}' ma non va. Eventualmente riprova
    // TODO: Completare
    // TODO: Ricordati di ammettere valori tipo: 192.*
	let newPattern
	if (value == "any") {
		inputEl.hidden = true
		return
	} else if (value == "noselection") {
        inputEl.hidden = true
        return
    } else if (value == "MAC source") {
        newPattern = ".*"
    } else if (value == "MAC destination") {
        newPattern = ".*"
    } else if (value == "eth type") {
        newPattern = ".*"
    } else if (value == "MPLS label") {
        newPattern = ".*"
    } else if (value == "MPLS tc") {
        newPattern = ".*"
    } else if (value == "vlan id") {
        newPattern = ".*"
    } else if (value == "IP source") {
        newPattern = ".*"
    } else if (value == "IP destination") {
        newPattern = ".*"
    } else if (value == "IP port") {
        newPattern = ".*"
    } else if (value == "TCP source port") {
        newPattern = ".*"
    } else if (value == "TCP destination port") {
        newPattern = ".*"
    } else if (value == "set MPLS label") {
		newPattern = '(' + labelsDiv.labels.map(el => el.name).join(')|(') + ')'
		// TODO: Anziché un pattern inserire un menu a selezione
    } else if (value == "forward to port") {
        newPattern = ".*"
    } else if (value == "send to controller") {
        newPattern = ".*"
    } else if (value == "drop") {
        inputEl.hidden = true
        return
    } else if (value == "process l2") {
        newPattern = ".*"
    } else if (value == "process l3") {
        newPattern = ".*"
    } else if (value == "set field") {
        newPattern = ".*"
    } else if (value == "push header") {
        newPattern = ".*"
    } else if (value == "pop header") {
        newPattern = ".*"
    }
    inputEl.pattern = newPattern
    inputEl.hidden = false
}