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
			priority: 1,
			idleTimeout: 100,
			hardTimeout: 500
		},
		labels: [],
		deviceInfos: null
	},
	methods: {
		close() {
			this.visible = false
			this.header = ''
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
				priority: 1,
				idleTimeout: 100,
				hardTimeout: 500
			}
		},

		makeRule() {
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
		},

		editRule(partialRule, header, device) {
			if (!device) device = partialRule.device
			this.open(device, header)
			Object.assign(this.rule, partialRule)
		}
	},

	components: {
		'dynamic-selection': {
			props: ['selection'],
			data() {
				return { content: '' }
			},
			template:
				'<div>' +
					'<select v-model="content" v-if="selection == \'MPLS label\'"' +
						'@change="$emit(\'input\', content)" class="answer-selection">' +
						'<option v-for="label in $parent.labels" v-bind:value="label.name">' +
							'{{ label.name }}' +
						'</option>' +
					'</select>' +
					'<input v-model="content" @change="$emit(\'input\', content)" ' +
						'v-else-if="![\'any\'].includes(selection)">' +
					'</input>' +
				'</div>'
		}
	}
})