let ruleModal = new Vue({
	el: '#rule-modal',
	data: {
		visible: false,
		header: '',
		rule: {
			matches: [{
				name: 'any',
				value: ''
			}],
			action: {
				name: 'noselection',
				value: ''
			},
			priority: 0,
			idleTimeout: 0,
			hardTimeout: 0
		},
		originalRule: null,
		labels: [],
		deviceInfos: null
	},
	methods: {
		close() {
			this.visible = false
			this.header = ''
			this.originalRule = null
		},

		open(device, header) {
			this.visible = true
			this.header = header || 'Create new rule for ' + device

			this.labels = labelsDiv.labels
			this.deviceInfos = sdnData.getDeviceInfo(device)
			this.resetRuleValues()
		},

		makeNewMatchLine() {
			this.rule.matches.push({ name: 'noselection', value: '' })
		},

		removeLastMatchLine() {
			if (this.rule.matches.length > 1)
				this.rule.matches.pop()
		},

		resetRuleValues() {
			this.rule = {
				matches: [{ name: 'any', value: '' }],
				action: { name: 'noselection', value: '' },
				priority: 0,
				idleTimeout: 0,
				hardTimeout: 0
			}
		},

		makeRule() {
			if(!this.originalRule){
				if(this.rule.action.name != 'noselection' &&
					!this.rule.matches.some(match => match.name == 'noselection')){
					let rule = sdnData.addRule(
						this.deviceInfos.name,
						this.rule.matches,
						this.rule.action,
						this.rule.priority,
						this.rule.idleTimeout,
						this.rule.hardTimeout,
					)
					rulesDiv.packetRules.push(rule)
					this.close()
				}
			} else this.close()
		},

		editRule(rule) {
			if(!rule.deleted){
				this.originalRule = rule
				let device = rule.device
				this.open(device, 'Modifica la regola per ' + device)
				Object.assign(this.rule, rule)
			}
		},

		deleteRule(){
			this.originalRule.deleted = true
			this.close()
		}
	},

	components: {
		'dynamic-selection': {
			props: ['selection', 'value'],
			data() {
				return { content: this.value }
			},
			template:
				'<div>' +
					'<select v-model="content" v-if="selection == \'MPLS label\'"' +
						'@change="$emit(\'input\', content)" class="answer-selection">' +
						'<option v-for="label in $parent.labels" v-bind:value="label.name">' +
							'{{ label.name }}' +
						'</option>' +
					'</select>' +
					'<select v-model="content" v-else-if="selection == \'source port\'"' +
						'@change="$emit(\'input\', content)" class="answer-selection">' +
						'<option v-for="interface in $parent.deviceInfos.interfaces" ' +
							'v-bind:value="interface.number">' +
							'eth{{ interface.number }}' +
						'</option>' +
					'</select>' +
					'<input v-model="content" @change="$emit(\'input\', content)" ' +
						'v-else-if="![\'any\'].includes(selection)">' +
					'</input>' +
				'</div>'
		}
	}
})