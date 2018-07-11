let controllerDiv = new Vue({
	el: '#details3',
	data: {
		visible: false,
		howtoVisibility: false,
		controllerSection: {
			visible: false,
			connected: false,
			buttonText: 'Connetti',
			ip: ''
		},
		rulesSection: {
			visible: 0,
			rules: '',
			submittedRules: {
				rules: [],
				representation: ''
			},
			filter: ''
		}
	},
	methods: {
		open(section) {
			rulesDiv.close()

			this.close()
			this.visible = true
			if (section == 1) this.howtoVisibility = true
			else if (section == 2) this.controllerSection.visible = true
			else if (section == 3) {
				this.rulesSection.visible = 1
				this.filterRulesByDevice()
			}
		},

		close() {
			this.visible = false
			this.howtoVisibility = false
			this.controllerSection.visible = false
			this.rulesSection.visible = 0

			this.rulesSection.filter = ''
		},

		connect(){
			let bottoniDiv = document.getElementById('sdn-vertical-buttons')
			bottoniDiv.children[0].classList.remove('disabled')
			bottoniDiv.children[1].classList.remove('disabled')
		
			this.controllerSection.connected = true
			this.controllerSection.buttonText = 'Connected'
		},

		filterRulesByDevice() {
			let rules = this.rulesSection.visible == 1 ? sdnData.getRules() : this.rulesSection.submittedRules.rules
			let representation

			if(!this.rulesSection.filter) {
				representation = JSON.stringify(
					rules.filter(rule => !rule.deleted), null, 4
				)
			} else {
				representation = JSON.stringify(
					rules.filter(rule => !rule.deleted && rule.device == this.rulesSection.filter),null, 4
				)
			}

			if(this.rulesSection.visible == 1) this.rulesSection.rules = representation
			else if(this.rulesSection.visible == 2) this.rulesSection.submittedRules.representation = representation
		},

		showSimulatedRules(){
			this.rulesSection.filter = ''
			this.rulesSection.visible = 1
			this.filterRulesByDevice()
		},

		showSubmittedRules(){
			this.rulesSection.filter = ''
			this.rulesSection.visible = 2
			this.filterRulesByDevice()
		},

		submit(){
			this.rulesSection.submittedRules.rules = JSON.parse(JSON.stringify(sdnData.getRules()))
		}
	}
})

function submitToController() {
	// TODO
	confirm('Rules are going to be installed in the controller')
	controllerDiv.submit()
}

function getFromController() {
	// TODO
	sdnData.getRules().forEach(
		rule => rule.stats = Math.floor(Math.random() * 100 + 1)
	)
}