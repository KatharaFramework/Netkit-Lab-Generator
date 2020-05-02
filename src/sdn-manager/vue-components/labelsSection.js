const labelsSection = new Vue({
	el: "#labelsSection",
	data: {
		newLabel: {
			show: false,
			name: "",
			color: ""
		},
		labels: []
	},
	methods: {
		hideLabelMaker(){
			this.newLabel.show = false;
			this.newLabel.name = "";
			this.newLabel.color = "";
			enableButtons("b4");
		},

		showLabelMaker(){
			this.newLabel.show = true;
			disableButtons("b4");
		},

		setAllEditButtonsDisabled(){
			for(let child of this.$children) child.toggleEdit(true);
		},

		isEditing(){
			return Boolean(this._findActiveLabelComponent());
		},

		reset(){
			this.hideLabelMaker();
			this.labels = [];

			labelsSection.setAllEditButtonsDisabled();
			discardPath();
		},

		/* ------------------------------------------------------------ */
		/* -------------------------- LABELS -------------------------- */
		/* ------------------------------------------------------------ */

		createNewLabel(name, color) {
			if(!name || !color){
				if(!this.newLabel.name || !this.newLabel.color) return;
				this.createNewLabel(this.newLabel.name, this.newLabel.color);
			} else {
				if(!this.labels.some(el => el.name == name))
					this.labels.push({ name, color });

				this.hideLabelMaker();
			}
		},

		getLabelColor(labelName){
			let label = this.labels.find(label => label.name == labelName);
			if(label) return label.color;
		},

		/* ----------------------------------------------------------- */
		/* -------------------------- RULES -------------------------- */
		/* ----------------------------------------------------------- */

		addRuleStep(step){
			let rule = dataStore.createAndStoreRule(
				step.device,
				[{ name: "source port", value: step.ingressPort }],
				[{ name: "forward to port", value: step.egressPort }]
			);
			this._addRuleToActiveLabelList_and_addLabeltoRule(rule, step.isStart, step.isEnd);
		},

		_addRuleToActiveLabelList_and_addLabeltoRule(rule, isStart, isEnd){
			let labelComponent = this._findActiveLabelComponent();

			let label = this.labels.find(label => label.name == labelComponent.name);

			// AutoTag
			if(isStart) rule.actions.unshift({ name: "set MPLS label", value: label.name, label });
			else rule.matches.push({ name: "MPLS label", value: label.name, label });

			// AutoUnTag
			if(isEnd) rule.actions.unshift({ name: "pop MPLS label", value: label.name, label });

			labelComponent.rules.push(rule);
		},

		_findActiveLabelComponent(){
			return this.$children.find(el => el.buttons.edit.active);
		},

		addRuleToChosenLabel(rule, labelName){
			let labelComponent = this.$children.find(el => el.name == labelName);
			labelComponent.rules.push(rule);
		}

		// TODO: Aggiungere la possibilità di cancellare una label
	},

	components: {"label-div": {
		props: ["name", "color"],
		data: function(){
			return {
				buttons: {
					show: {
						active: false,
						text: "More"
					},
					edit: {
						active: false,
						text: "Edit..."
					},
					remove: {
						active: false,
						text: "Remove..."
					}
				},
				rules: []
			};
		},
		computed: {
			validRules() {
				return this.rules.filter(rule => !rule.deleted)
			}
		},
		template:
			"<div id=\"labelsdiv\" v-on:mouseenter=\"highlightAllRulesOnGraph\"  onmouseleave=\"removeNodesSelection()\">" +
				"<div style=\"display: flex\">" +
					"<div class=\"colorTag\" v-bind:style=\"{ backgroundColor: color }\"></div>" +
					"<input style=\"font-size: large; margin: auto 1rem;\" v-model=\"name\" :disabled=\"!buttons.edit.active\"></input>" +
					"<button style=\"margin-left: auto;\" v-on:click=\"toggleEdit()\"" +
						"v-bind:class=\"{ 'btn btn-success': buttons.edit.active, 'btn btn-default': !buttons.edit.active }\" >" +
						"{{ buttons.edit.text }}</button>" +
					"<button class=\"btn btn-default\"" +
						"v-on:click=\"toggleExpand()\">	{{ buttons.show.text }}</button>" +
				"</div>" +

				"<table v-show=\"buttons.show.active\" style=\"margin-top: 15px; width: 100%;\">" +
					"<thead>" +
						"<th>device</th>" +
						"<th>match</th>" +
						"<th>action</th>" +
						"<th v-if=\"buttons.remove.active\" style=\"text-align: center; width: 5px\">-</th>" +
					"</thead>" +
					"<tbody>" +
						"<tr v-for=\"rule in validRules\" v-on:mouseenter=\"highlightRuleOnGraph(rule)\" onmouseleave=\"removeNodesSelection()\">" +
							"<td style=\"overflow: hidden; text-overflow: ellipsis; max-width: 75px; color: var(--main-color); text-decoration: underline; cursor: pointer;\" " +
								"v-on:click=\"switchDetailsSection.open(rule.device)\" > " +
								"{{ rule.device }}" +
							"</td>" +
							"<td>" +
								"{{ rule.matches.find(match => match.name == \"source port\").name }} {{ rule.matches.find(match => match.name == \"source port\").value }} " +
								"<span class=\"hint hint-match\" v-if=\"rule.matches.length > 2\">" +
									"+ " +
								"</span>" +
							"</td>" +
							"<td>forward to port {{ rule.actions.find(action => action.name == 'forward to port').value }} " +
								"<span class=\"hint hint-action\" v-if=\"rule.actions.length > 1\">" +
									"+ " +
								"</span>" +
							"</td>" +
							"<td v-if=\"buttons.remove.active\" v-on:click=\"removeRule(rule)\" class=\"remove-slider\">" +
							"-</td>" +
						"</tr>" +
						"<tr v-show=\"validRules.length==0\"><td colspan=\"3\">No rules defined yet</td></tr>" +
					"</tbody>" +
				"</table>" +
				"<div v-show=\"buttons.edit.active && validRules.length!=0 && buttons.show.active\" style=\"margin: 10px auto; width: fit-content;\">" +
					"<button v-bind:class=\"{ 'btn btn-danger': buttons.remove.active, 'btn btn-default' : !buttons.remove.active }\" " +
						"v-on:click=\"toggleRemove()\">{{ buttons.remove.text }}</button>" +
				"</div>" +
				"<hr>" +
			"</div>",
		methods: {
			/* --------------------------------------------------------- */
			/* ------------------------ BUTTONS ------------------------ */
			/* --------------------------------------------------------- */

			toggleEdit(forceDisable) {
				if(this.buttons.edit.active || forceDisable){
					this.buttons.edit.active = false;
					this.buttons.edit.text = "Edit...";
					this.toggleRemove(true);

					disableDragging();
				} else {
					this.$parent.setAllEditButtonsDisabled();

					this.buttons.edit.active = true;
					this.buttons.edit.text = "EDITING";
					this.toggleExpand(true);

					enablePathSelection();
				}
			},

			toggleRemove(forceDisable) {
				if(this.buttons.remove.active || forceDisable){
					this.buttons.remove.active = false;
					this.buttons.remove.text = "Remove...";
				} else {
					this.buttons.remove.active = true;
					this.buttons.remove.text = "Done";
				}
			},

			toggleExpand(forceShow) {
				if(this.buttons.show.active && !forceShow){
					this.buttons.show.active = false;
					this.buttons.show.text = "More";
				} else {
					this.buttons.show.active = true;
					this.buttons.show.text = "Less";
				}
			},

			/* --------------------------------------------------------- */
			/* ------------------------- RULES ------------------------- */
			/* --------------------------------------------------------- */

			highlightAllRulesOnGraph(){
				removeNodesSelection();
				this.rules.filter(rule => !rule.deleted).forEach(rule => this.highlightRuleOnGraph(rule))
			},

			removeRule(rule){
				rule.deleted = true;
				if(this.validRules.length == 0) this.toggleRemove(true);
			},

			highlightRuleOnGraph(rule){
				highlightSegmentOnGraph(
					rule.device,
					rule.matches.find(match => match.name == "source port").value,
					rule.actions.find(action => action.name == "forward to port").value
				);
			}
		}
	}}
});