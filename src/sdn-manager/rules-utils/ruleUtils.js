const ruleUtils = {

	/* ------------------------------------------------------------------- */
	/* ------------------------- SIMULATED RULES ------------------------- */
	/* ------------------------------------------------------------------- */
	simulatedRules: {
		/**
		 * "Simulated" rules are easier to read because they have a graphical representation of their label
		 * which consists in label name and label color. This method takes a rule and creates the field
		 * (inside existing fields "matches" and "actions") that hosts this representation.
		 * Eventually it adds new discovered labels to the list of known ones
		 * 
		 * Le regole "simulated" sono di più semplice comprensione perché hanno una rappresentazione grafica
		 * dell'etichetta (colore e nome). Questo metodo si occupa di creare il campo all'interno del match MPLS
		 * o dell'azione MPLS che permette l'individuazione del nome e del colore corretti dell'etichetta.
		 * Infine aggiunge le etichette nuove alla lista delle etichette conosciute.
		 */
		addAPointerToLabelInTheRuleMPLSFields_andAddLablesToLabelsSection: function (rule, forceOverride){
			let labelNames = [];
			for(let field of rule.matches.concat(rule.actions)){
				if(!field.label || forceOverride){
					if(field.name.includes("MPLS")){
						// Cerco il nome dell'etichetta associata all'azione di POP
						if(field.name == "pop MPLS label"){
							// L'azione di POP ha il parametro ethertype e non l'etichetta => cerco l'etichetta nel match
							let mplsMatch = rule.matches.find(match => match.name == "MPLS label");						
							if (mplsMatch) field.value = mplsMatch.value;
						}

						// Cerco il nome dell'etichetta associata all'azione di PUSH
						if(field.name == "set MPLS label"){
							// L'azione di PUSH è composta di due regole: 1) metti l'etichetta 2) edita il suo campo tag
							let mplsMatch = rule.actions.find(action => action.name == "set field" && action.value.includes("mpls"));
							if (mplsMatch) field.value = mplsMatch.value.match(/:(\w+)/)[1];
						}

						// Oss. Anche se non sto esaminando una POP o una PUSH posso trovare un'etichetta
						let labelName = field.value;

						// Ora ho il nome; cerco il colore oppure lo creo (se è un'etichetta non incontrata in precedenza)
						let labelColor = labelsSection.getLabelColor(labelName);
						if(!labelColor){
							labelColor = "#" + Math.floor(Math.random() * 899 + 100);
							labelsSection.createNewLabel(labelName, labelColor);
						}

						// Aggiungo un campo "label" all'azione o al match così potrò ricostruire nome e colore nella grafica
						field.label = { name: labelName, color: labelColor };

						// Metto da parte tutte le nuove etichette così dopo le potrò aggiungere all'elenco generale (laeblsSection)
						if(!labelNames.includes(labelName)){
							labelNames.push(labelName);
						}

					} else if(field.name == "set field" && field.value.includes("mpls")){
						// Attacco un campo "label" anche all'azione "set field"
						let labelName = field.value.match(/:(\w+)/)[1];
						field.label = {
							name: labelName,
							color: labelsSection.getLabelColor(labelName)
						};
						//Oss. Non aggiungo l'etichetta all'elenco perché immagino che già ci sia (ogni set field segue una PUSH)
					}
				}
			}

			setTimeout(() => {
				// Devo ritardare l'aggiunta perché Vue.js potrebbe non aver ancora creato l'elemento label
				labelNames.forEach( labelName => labelsSection.addRuleToChosenLabel(rule, labelName) );
			}, 1000);
		},

		/**
		 * Creates and returns the structure of a new simulated rule after filling its filds.
		 * Some arguments are optional but they must be: 3, 7 or 8.
		 */
		createNewRule: function(...values){
			let device,
				matches,
				actions,
				priority = 0,
				table = 0,
				idleTimeout = 0,
				hardTimeout = 0,
				stats = 0,
				deleted = false,
				submitted = false,
				edited = false;

			if(values.length == 3){
				[device, matches, actions] = values;
			} else if(values.length == 7){
				[device, matches, actions, priority, table, idleTimeout, hardTimeout] = values;
			} else if(values.length == 8){
				[device, matches, actions, priority, table, idleTimeout, hardTimeout, stats] = values;
				submitted = true;
			} else  throw new Error("dataStore createNewRule: arguments lenght mismatch");

			let { checkedMatches, checkedActions } = this.checkActionsAndMatches(matches, actions);
			matches = checkedMatches;
			actions = checkedActions;

			let rule = { device, matches, actions, priority, table, idleTimeout, hardTimeout, stats, deleted, submitted, edited };

			this.checkRuleHasOneLabelOnly(rule);
			return rule;
		},

		checkActionsAndMatches: function(matches, actions){
			matches = JSON.parse(JSON.stringify(matches));
			actions = JSON.parse(JSON.stringify(actions));

			if(!Array.isArray(matches)) matches = [matches];
			if(!Array.isArray(actions)) actions = [actions];

			let checkedFields = { checkedMatches: matches, checkedActions: actions };
			return checkedFields;
		},

		/**
		 * Checks that the rule only sets 1 mpls label and
		 * that it does not add a new label if  it already has one
		 */
		checkRuleHasOneLabelOnly: function(rule){
			let error = new Error("This version of Kathara-SDN only supports 1 label per rule");

			// Se la regola fa match su un'etichetta MPLS non posso settare un'altra etichetta
			if(rule.matches.some(match => match.name.includes("MPLS")) &&
				rule.actions.some(action => action.name == "set MPLS label")){
				throw error;
			}

			// Non posso fare due volte 'set MPLS label'
			let setsNewMPLS = false;
			for(let action of rule.actions){
				if (action.name == "set MPLS label") {
					if(setsNewMPLS) throw error;
					else setsNewMPLS = true;
				}
			}
		},

		makeSimulatedRuleFromOpenFlowOne: function(switchName, openflowRule){
			let newRule = this.createNewRule(
				switchName,
				rulesMapper.reverseMatch(openflowRule.match),
				rulesMapper.reverseActions(openflowRule.actions),
				openflowRule.priority,
				openflowRule.table_id,
				openflowRule.idle_timeout,
				openflowRule.hard_timeout,
				openflowRule.packet_count
			);
			newRule.openflowRules = [openflowRule];

			// Le regole openflow di PUSH hanno due azioni: 1) metti il protocollo MPLS 2) cambio il campo MPLS inserendo la label
			// Nelle regole simulate voglio che la label sia direttamente nell'azione di PUSH
			let setFieldAction = newRule.actions.find(action => action.name === "set field");
			if(setFieldAction){
				let [fieldName, fieldValue] = setFieldAction.value.split(":");
				if(fieldName === "mpls"){
					newRule.actions.forEach(action => {
						if (action.name === "set MPLS label") action.value = fieldValue;
					});
				}
			}

			return newRule;
		},

		mergeMPLSRulesWithDifferentProtocolMatch: function(rules){
			let matchedRules = [];
			let mergedRules = [];
			rules.forEach(rule1 => {

				// Con queste due righe evito di rileggere regole già analizzate o già accoppiate
				if(!matchedRules.includes(rule1)){
					matchedRules.push(rule1);

					// Cerco la regola corrispondente a rule1
					let sibling = rules.find(rule2 => !matchedRules.includes(rule2) && this.isSameRule(rule1, rule2, true));

					if(sibling){
						// Se la trovo la unisco a rule1 e ne memorizzo una sola
						matchedRules.push(sibling);
						mergedRules.push(this.mergeMPLSSiblingRules(rule1, sibling));
					} else {
						// Se non la trovo, la riporto in output perché è una regola a sé stante
						mergedRules.push(rule1);
					}
				}
			});
			return mergedRules;
		},

		isSameRule: function(rule1, rule2, ignoreDifferentProtocolsOfSameMPLSRule){
			let matches1 = rule1.matches,
				actions1 = rule1.actions;

			let matches2 = rule2.matches,
				actions2 = rule2.actions;

			let ignoreMatchEthertype = rule1.actions.some(action => action.name === "set MPLS label");

			return rule1.device === rule2.device && rule1.priority === rule2.priority
				&& rule1.table === rule2.table && rule1.idleTimeout === rule2.idleTimeout
				&& rule1.hardTimeout === rule2.hardTimeout
				&& this.isSameActions(actions1, actions2, ignoreDifferentProtocolsOfSameMPLSRule)
				&& this.isSameMatches(matches1, matches2, ignoreDifferentProtocolsOfSameMPLSRule && ignoreMatchEthertype);
		},

		isSameActions: function(actions1, actions2, ignoreDifferentProtocolsOfSameMPLSActions){
			// Conta anche l'indice: le azioni devono essere nello stesso ordine
			return actions1.length === actions2.length &&
			actions1.every((action1, index) => this.isSameAction(action1, actions2[index], ignoreDifferentProtocolsOfSameMPLSActions));
		},

		isSameMatches: function(matches1, matches2, ignoreDifferentProtocolsOfSameMPLSMatches){
			let ignoreEthertype = ignoreDifferentProtocolsOfSameMPLSMatches
				|| matches1.some(match => match.name === "MPLS label");

			let match2CheHannoFattoMatch = [];
			return matches1.length === matches2.length &&
				matches1.every(match1 => {
					matches2.some(match2 => {
						if(match2CheHannoFattoMatch.includes(match2)) return false;

						if(this.isSameMatch(match1, match2, ignoreEthertype)){
							match2CheHannoFattoMatch.push(match2);
							return true;
						}
					});
				});
		},

		isSameAction: function(action1, action2, ignoreDifferentProtocolsOfSameMPLSAction){
			return (action1.name === action2.name) && (action1.value === action2.value
				|| (ignoreDifferentProtocolsOfSameMPLSAction && action1.name === "pop MPLS label"));
		},

		isSameMatch: function(match1, match2, ignoreEthertype){
			return match1.name === match2.name
				&& (match1.value === match2.value 
					|| (ignoreEthertype && match1.name === "ethertype"));
		},

		mergeMPLSSiblingRules: function(rule1, rule2){
			let isMPLSMatch = rule1.matches.some(match => match.name === "MPLS label");
			let isPOPMPLS = rule1.actions.some(action => action.name === "pop MPLS label");	// TODO: non lo uso. Serve?
			let isPUSHMPLS = rule1.actions.some(action => action.name === "set MPLS label");

			let mergedMatches = [];
			rule1.matches.forEach(match => {
				if(!(isMPLSMatch && match.name === "ethertype" && match.value === "MPLS")
					&& !(isPUSHMPLS && match.name === "ethertype")){
					mergedMatches.push(match);
				}
			});

			// Unire le actions vuol dire unire "PUSH MPLS label" e "set field",
			// ovvero rimuovere "set field"
			let meregdActions = [];
			rule1.actions.forEach(action => {
				if(action.name != "set field") meregdActions.push(action);
			});

			let newRule = this.createNewRule(
				rule1.device,
				mergedMatches,
				meregdActions,
				rule1.priority,
				rule1.table,
				rule1.idleTimeout,
				rule1.hardTimeout,
				(+rule1.stats + +rule2.stats)
			);
			newRule.openflowRules = rule1.openflowRules.concat(rule2.openflowRules);

			return newRule;
		}
	},



	/* ------------------------------------------------------------------ */
	/* ------------------------- OPENFLOW RULES ------------------------- */
	/* ------------------------------------------------------------------ */
	openFlowRules: {
		makeOpenFlowRuleFromSimulatedOne: function(simRule, offset){
			return {
				dpid: simRule.device,
				table_id: +simRule.table,
				idle_timeout: simRule.idleTimeout,
				hard_timeout: simRule.hardTimeout,
				priority: simRule.priority,
				match: rulesMapper.makeMatch(simRule.matches, offset),
				actions: rulesMapper.makeActions(simRule.actions, offset)
			};
		},

		removeNonStaticFields: function(ofRule){
			// Una regola in uso ha molti campi dinamici come ad esempio le statistiche.
			// Per poter fare match su una regola esistente mi limito a cercare i campi statici,
			// quindi rimuovo quelli dinamici
			if(ofRule.packet_count != undefined) delete ofRule.packet_count;
			if(ofRule.byte_count != undefined) delete ofRule.byte_count;
			if(ofRule.duration_sec != undefined) delete ofRule.duration_sec;
			if(ofRule.duration_nsec != undefined) delete ofRule.duration_nsec;
			if(ofRule.length != undefined) delete ofRule.length;

			// TODO: Questi due non so se sono statici... Per ora li rimuovo
			if(ofRule.flags != undefined) delete ofRule.flags;
			if(ofRule.cookie != undefined) delete ofRule.cookie;
		}
	}
};