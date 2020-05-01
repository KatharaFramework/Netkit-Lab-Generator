const ruleModal = new Vue({
	el: "#rule-modal",
	data: {
		visible: false,
		header: "",
		rule: {
			matches: [{
				name: "any",
				value: ""
			}],
			actions: [{
				name: "noselection",
				value: ""
			}],
			priority: 0,
			table: 0,
			idleTimeout: 0,
			hardTimeout: 0
		},
		originalRule: null,
		labels: [],
		deviceInfos: null
	},
	methods: {
		open(device, header) {
			this.visible = true;
			this.header = header || "Create new rule for " + device;

			this.labels = labelsSection.labels;
			this.deviceInfos = dataStore.getDeviceInfo(device);
			this._resetRuleValues();
		},

		close() {
			this.visible = false;
			this.header = "";
			this.originalRule = null;
		},

		_resetRuleValues() {
			this.rule = {
				matches: [{ name: "any", value: "" }],
				actions: [{ name: "noselection", value: "" }],
				priority: 0,
				table: 0,
				idleTimeout: 0,
				hardTimeout: 0
			};
		},

		/* ----------------------------------------------------------- */
		/* -------------------------- RULES -------------------------- */
		/* ----------------------------------------------------------- */

		makeRule() {
			if(!this.originalRule){
				if(!this.rule.actions.some(action => action.name == "noselection") &&
					!this.rule.matches.some(match => match.name == "noselection")){
					let isLabelRule = false;

					for(let field of this.rule.actions.concat(this.rule.matches)){
						if(field.name.includes("MPLS")){
							field.label = this.labels.find(label => label.name == field.value);
							isLabelRule = true;
						}
					}

					let rule = dataStore.createAndStoreRule(
						this.deviceInfos.name,
						this.rule.matches,
						this.rule.actions,
						this.rule.priority,
						this.rule.table,
						this.rule.idleTimeout,
						this.rule.hardTimeout,
					);

					if(isLabelRule) switchDetailsSection.labelRules.push(rule);
					else switchDetailsSection.packetRules.push(rule);

					this.close();
				}
			} else {
				Object.assign(this.originalRule, this.rule);
				this.originalRule.edited = true;
				this.close();
			}
		},

		editRule(rule) {
			if(!rule.deleted){
				// Uso original rule per memorizzare l'oggetto che voglio modificare. Dopo aver fatto le modifiche lo sovrascriverò
				this.originalRule = rule;
				let device = rule.device;
				this.open(device, "Modifica la regola per " + device);
				Object.assign(this.rule, rule);
				// TODO: ^^ Non copia l'oggetto completamente: azioni e match sono quelli della regola originale => 
				// ... ogni modifica nel modal viene immediatamente propagata senza aspettare la pressione del pulsante di conferma => correggi
			}
		},

		deleteRule(){
			this.originalRule.deleted = true;
			this.close();
		},

		/* ----------------------------------------------------------- */
		/* -------------------- MATCHES & ACTIONS -------------------- */
		/* ----------------------------------------------------------- */

		makeNewMatchLine() {
			this.rule.matches.push({ name: "noselection", value: "" });
		},

		removeLastMatchLine() {
			if (this.rule.matches.length > 1)
				this.rule.matches.pop();
		},

		makeNewActionLine(){
			this.rule.actions.push({ name: "noselection", value: "" });
		},

		removeLastActionLine(){
			if (this.rule.actions.length > 1)
				this.rule.actions.pop();
		}
	},

	components: {
		"dynamic-selection": {
			props: ["selection", "value"],
			data() {
				return { content: this.value };
			},
			template:
				"<div>" +

					"<select v-model=\"content\" v-if=\"['MPLS label', 'set MPLS label'].includes(selection)\" " +
				// In questi casi vengono mostrate tutte le label
						"@change=\"$emit('input', content)\" class=\"answer-selection\">" +
						"<option v-for=\"label in $parent.labels\" v-bind:value=\"label.name\">" +
							"{{ label.name }}" +
						"</option>" +
					"</select>" +

					"<select v-model=\"content\" v-else-if=\"['source port', 'forward to port'].includes(selection)\" " +
				// In questi casi vengono mostrate tutte le interfacce
						"@change=\"$emit('input', content)\" class=\"answer-selection\">" +
						"<option v-for=\"interface in $parent.deviceInfos.interfaces\" " +
							"v-bind:value=\"interface.number\">" +
							"eth{{ interface.number }}" +
						"</option>" +
					"</select>" +

					"<input v-model=\"content\" v-else-if=\"['MAC source', 'MAC destination'].includes(selection)\" " +
				// In questi casi viene mostrato un input che ha come pattern un indirizzo MAC
						"type=\"text\" @change=\"$emit('input', content)\" " +
						"pattern=\"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$\">" +

					"<input v-model=\"content\" v-else-if=\"['IPv4 source', 'IPv4 destination'].includes(selection)\" " +
				// In questi casi viene mostrato un input che ha come pattern un indirizzo IPv4
						"type=\"text\" @change=\"$emit('input', content)\" " +
						"pattern=\"^(^$)|(((^|\.)((25[0-5])|(2[0-4]\\d)|(1\\d\\d)|([1-9]?\\d))){4}(/[0-9]+)?$)\">" +

					"<input v-model=\"content\" v-else-if=\"['TCP source port', 'TCP destination port'].includes(selection)\" " +
				// In questi casi viene mostrato un input che ha come pattern una porta TCP
						"type=\"text\" @change=\"$emit('input', content)\" " +
						"min=\"0\" max=\"65534\">" +

				/* ---------------------------------------------------------------------------------------------- */
				/*		'<input v-model="content" v-else-if="[\'ethertype\'].includes(selection)"' +
			/*		// In questi casi viene mostrato un input numerico (vincolato da min e max di ethertype)
			/*			'type="number" @change="$emit(\'input\', content)" ' +
			/*			'min="0">' +	// TODO: Non ho messo il max perché non lo conosco
			/* ---------------------------------------------------------------------------------------------- */
				/* ---------------- Si può scegliere quale dei due blocchi usare (sopra o sotto) ---------------- */
				/* ---------------------------------------------------------------------------------------------- */
				/**/	"<select v-model=\"content\" v-else-if=\"['ethertype'].includes(selection)\" " +
				/**/	// In questi casi vengono mostrati alcuni ethertype predefiniti
				/**/		"@change=\"$emit('input', content)\" >" +
				/**/		"<option value=\"ARP\">ARP</option>" +
				/**/		"<option value=\"IPv4\">IPv4</option>" +
				/**/		"<option value=\"MPLS\">MPLS</option>" +
				/**/		"<option value=\"LLDP\">LLDP</option>" +
				/**/	"</select>" +
				/* ---------------------------------------------------------------------------------------------- */

					"<input v-model=\"content\" v-else-if=\"['send to table'].includes(selection)\" " +
						"type=\"number\" @change=\"$emit('input', content)\" " +
						"min=\"0\" max=\"252\" >" +

					"<input v-model=\"content\" v-else-if=\"['set field'].includes(selection)\" " +
				// In questo caso viene mostrato un testo con un vincolo sul pattern
						"type=\"text\" @change=\"$emit('input', content)\" " +
						"pattern=\".+:.+\">" +

					"<input v-model=\"content\" v-else-if=\"!['any', 'noselection', 'send to controller', 'drop', 'pop MPLS label'].includes(selection)\" " +
				// In tutti i casi, tranne quelli indicati, viene mostrato un campo testuale libero
						"type=\"text\" @change=\"$emit('input', content)\" >" +

				"</div>"
		}
	}
});