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
			visible: false,
			rules: '',
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
				this.rulesSection.visible = true
				this.filterRulesByDevice()
			}
		},

		close() {
			this.visible = false
			this.howtoVisibility = false
			this.controllerSection.visible = false
			this.rulesSection.visible = false

			this.rulesSection.filter = ''
		},

		connect(){
			let bottoniDiv = document.getElementById('sdn-vertical-buttons')
			bottoniDiv.children[0].disabled = false
			bottoniDiv.children[1].disabled = false
		
			this.controllerSection.connected = true
			this.controllerSection.buttonText = 'Connected'
		},

		filterRulesByDevice() {
			if(!this.rulesSection.filter) {
				this.rulesSection.rules = JSON.stringify(
					sdnData.getRules().filter(rule => !rule.deleted), null, 4
				)
			} else {
				this.rulesSection.rules = JSON.stringify(
					sdnData.getRules().filter(rule => !rule.deleted && rule.device == this.rulesSection.filter),
					null, 4
				)
			}
		}
	}
})

function submitToController() {
	// TODO
	confirm('Rules are going to be installed in the controller')
}

function getFromController() {
	// TODO
	sdnData.getRules().forEach(
		rule => rule.stats = Math.floor(Math.random() * 100 + 1)
	)
}