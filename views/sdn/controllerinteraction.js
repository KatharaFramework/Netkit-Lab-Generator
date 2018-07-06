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
		open: function (section) {
			this.close()
			this.visible = true
			if (section == 1) this.howtoVisibility = true
			else if (section == 2) this.controllerSection.visible = true
			else if (section == 3) {
				this.rulesSection.visible = true
				this.filterRulesByDevice()
			}
		},

		close: function () {
			this.visible = false
			this.howtoVisibility = false
			this.controllerSection.visible = false
			this.rulesSection.visible = false

			this.rulesSection.filter = ''
		},

		connect: function(){
			let bottoniDiv = document.getElementById('sdn-vertical-buttons')
			bottoniDiv.children[0].disabled = false
			bottoniDiv.children[1].disabled = false
		
			this.controllerSection.connected = true
			this.controllerSection.buttonText = 'Connected'
		},

		filterRulesByDevice: function () {
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
	alert('done!')
}

function getFromController() {
	// TODO
	sdnData.getRules().forEach(
		rule => rule.stats = Math.floor(Math.random() * 100 + 1)
	)
}