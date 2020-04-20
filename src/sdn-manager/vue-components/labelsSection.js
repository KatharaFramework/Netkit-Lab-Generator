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
			if(name && color){
				if(!this.labels.some(el => el.name == name))
					this.labels.push({ name, color });
			} else if (this.newLabel.name && this.newLabel.color){
				this._createLabelFromHTML();
			}
		},

		getLabelColor(labelName){
			let label = this.labels.find(label => label.name == labelName);
			if(label) return label.color;
		},

		_createLabelFromHTML(){
			let colorInputEl = this.$el.lastElementChild.firstElementChild;
			let nameInputEl = colorInputEl.nextElementSibling;
			if(colorInputEl.validity.valid && nameInputEl.validity.valid &&
				!this.labels.some(el => el.name == this.newLabel.name)){

				this.labels.push({
					name: this.newLabel.name,
					color: this.newLabel.color,
				});

				this.hideLabelMaker();
			}
		},

		/* ----------------------------------------------------------- */
		/* -------------------------- RULES -------------------------- */
		/* ----------------------------------------------------------- */

		addRuleStep(step){
			let rule = sdnData.createAndStoreRule(
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
	},

	components: {"label-div": {
		props: ["name", "color"],
		data: function(){
			return {
				buttons: {
					show: {
						active: false,
						text: "Show"
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
		template:
			"<div style=\"margin: 0 0 10px\" v-on:mouseenter=\"highlightChildrenOnGraph()\" v-on:mouseleave=\"unhighlightChildrenOnGraph()\">" +
				"<div class=\"colorTag\" v-bind:style=\"{ backgroundColor: color }\"></div>" +
				"{{ name }}" +
				"<button v-bind:class=\"{ 'btn-danger': buttons.remove.active }\" " +
					"v-on:click=\"toggleRemove()\" " +
					"v-if=\"buttons.edit.active\">{{ buttons.remove.text }}</button>" +
				"<button v-bind:class=\"{ 'btn-success': buttons.edit.active }\" " +
					"v-on:click=\"toggleEdit()\">{{ buttons.edit.text }}</button>" +
				"<button v-on:click=\"toggleExpand()\">{{ buttons.show.text }}</button>" +
	
				"<table v-show=\"buttons.show.active\" style=\"margin-top: 15px; width: 100%; max-width: 378px\">" +
					"<thead>" +
						"<th>device</th>" +
						"<th>match</th>" +
						"<th>auto tag</th>" +
						"<th>action</th>" +
						"<th>auto untag</th>" +
						"<th v-if=\"buttons.remove.active\" style=\"text-align: center; width: 5px\">-</th>" +
					"</thead>" +
					"<tbody>" +
						"<label-rule v-for=\"rule in rules\" " +
							"v-if=\"!rule.deleted\"" +
							"v-bind:device=\"rule.device\" " +
							"v-bind:matches=\"rule.matches\" " +
							"v-bind:actions=\"rule.actions\">"+
						"</label-rule>" +
					"</tbody>" +
				"</table>" +
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
					
					discardPath();
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
					this.buttons.remove.text = "REMOVING";
				}
			},
			
			toggleExpand(forceShow) {
				if(this.buttons.show.active && !forceShow){
					this.buttons.show.active = false;
					this.buttons.show.text = "Show";
				} else {
					this.buttons.show.active = true;
					this.buttons.show.text = "Hide";
				}
			},
	
			/* --------------------------------------------------------- */
			/* ------------------------- RULES ------------------------- */
			/* --------------------------------------------------------- */
	
			highlightChildrenOnGraph(){
				this.$children.forEach(el => el.highlightMeOnGraph());
			},
	
			unhighlightChildrenOnGraph(){
				this.$children.forEach(el => el.unhighlightMeOnGraph());
			}
		},
	
		components: {"label-rule": {
			props: ["device", "matches", "actions"],
			data: function(){
				return {
					autoTag: this.actions.some(action => action.name == "set MPLS label") ? "Yes" : "No",
					autoUntag: this.actions.some(action => action.name == "pop MPLS label") ? "Yes" : "No"
				};
			},
			template:
				"<tr v-on:mouseenter=\"highlightMeOnGraph\" v-on:mouseleave=\"unhighlightMeOnGraph\">" +
					"<td style=\"overflow: hidden; text-overflow: ellipsis; max-width: 75px; color: var(--main-color); text-decoration: underline; cursor: pointer;\" " +
						"v-on:click=\"switchDetailsSection.open(device)\" > " +
						"{{ device }}" +
					"</td>" +
					"<td>" +
						"{{ matches.find(match => match.name == \"source port\").name }} {{ matches.find(match => match.name == \"source port\").value }} " +
						"<span class=\"hint hint-match\" v-if=\"matches.length > (autoTag == 'Yes' ? 1 : 2)\">" +
							"+ " +
						"</span>" +
					"</td>" +
					"<td>{{ autoTag }}</td>" +
					"<td>forward to port {{ actions.find(action => action.name == 'forward to port').value }} " +
						"<span class=\"hint hint-action\" v-if=\"actions.length > ((autoUntag == 'Yes' || autoTag == 'Yes') ? 2 : 1)\">" +
							"+ " +
						"</span>" +
					"</td>" +
					"<td>{{ autoUntag }}</td>" +
					"<td v-if=\"$parent.buttons.remove.active\">" +
						"<button class=\"btn-danger\" " +
						"v-on:click=\"removeMe()\">-</button>" +
					"</td>" +
				"</tr>",
			methods: {
				// TODO: Questi metodi si possono spostare tutti dentro 'labelComponent'... è più elegante
				removeMe(){
					let rule = this.$parent.rules.find(rule =>
						rule.device == this.device &&
						rule.matches == this.matches
					);
					rule.deleted = true;
					this.$parent.rules.splice(this.$parent.rules.indexOf(rule), 1);
				},
		
				highlightMeOnGraph(){
					highlightSegmentOnGraph(
						this.device,
						this.matches.find(match => match.name == "source port").value,
						this.actions.find(action => action.name == "forward to port").value
					);
				},
		
				unhighlightMeOnGraph(){
					if(!sdnData.pathHasAtLeastOneStep())
						removeNodesSelection();
				}
			}
		}}
	}}
});

// TODO: In questa componente vue (solo qui ci sono) cambia $parent con $emit dove possibile