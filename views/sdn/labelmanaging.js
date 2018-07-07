let labelsDiv = new Vue({
	el: '#details',
	data: {
		visible: true,
		newLabel: {
			show: false,
			name: '',
			color: ''
		},
		labels: []
	},
	methods: {
		createNewLabel() {
			if (this.newLabel.name && this.newLabel.color){
				let colorInputEl = this.$el.firstElementChild.firstElementChild
				let nameInputEl = colorInputEl.nextElementSibling
				if(colorInputEl.validity.valid && nameInputEl.validity.valid &&
					!this.labels.some(el => el.name == this.newLabel.name)){

					this.labels.push({
						name: this.newLabel.name,
						color: this.newLabel.color,
					})

					this.hideLabelMaker()
				}
			}
		},

		hide(){
			this.visible = false
			// TODO: triggera qui l'aggiornamento delle regole in details3
			// TODO: Poi usa sempre questo metodo per nascondere questo div piuttosto che 'labelsDiv.visible = false'
		},

		hideLabelMaker(){
			this.newLabel.show = false
			this.newLabel.name = ''
			this.newLabel.color = ''
			unhide(document.querySelectorAll('#sdn-horizontal-buttons button').item(4))
		},

		showLabelMaker(){
			this.newLabel.show = true
			hide(document.querySelectorAll('#sdn-horizontal-buttons button').item(4))
		},

		setAllEditButtonsDisabled(){
			for(let child of this.$children){
				child.toggleEdit(true)
			}
		},

		addNewRuleToActiveLabel(rule){
			let labelComponent = this.findActive()
			labelComponent.rules.push(rule)
			
			let label = this.labels.find(label => label.name == label.name)
			rule.matches[1] = { name: 'MPLS label', value: label.name, label }
		},

		findActive(){
			return this.$children.find(el => el.edit.active)
		},

		isEditing(){
			return Boolean(this.findActive())
		},

		reset(){
			this.hideLabelMaker()
			this.labels = []
		}
	},

	components: {'label-div': {
		props: ['name', 'color'],
		data: function(){
			return {
				// name
				// color	// <-- Questi 2 sono implicitamente definiti da props
				show: {
					active: false,
					text: 'Show'
				},
				edit: {
					active: false,
					text: 'Edit...'
				},
				remove: {
					active: false,
					text: 'Remove...'
				},
				rules: []
			}
		},
		template:
			'<div style="margin: 0 0 10px" v-on:mouseenter="highlightChildrenOnGraph()" v-on:mouseleave="unhighlightChildrenOnGraph()">' +
				'<div class="colorTag" v-bind:style="{ backgroundColor: color }"></div>' +
				'{{ name }}' +
				'<button v-bind:class="{ \'btn-danger\': remove.active }" ' +
					'v-on:click="toggleRemove()" ' +
					'v-if="edit.active">{{ remove.text }}</button>' +
				'<button v-bind:class="{ \'btn-success\': edit.active }" ' +
					'v-on:click="toggleEdit()">{{ edit.text }}</button>' +
				'<button v-on:click="toggleExpand()">{{ show.text }}</button>' +
	
				'<table v-show="show.active" style="margin-top: 15px; width: 100%;">' +
					'<thead>' +
						'<th>device</th>' +
						'<th>match</th>' +
						'<th>action</th>' +
						'<th v-if="remove.active" style="text-align: center; width: 5px">-</th>' +
					'</thead>' +
					'<tbody>' +
						'<label-rule v-for="rule in rules"' +
							'v-bind:device="rule.device" ' +
							'v-bind:matches="rule.matches" v-bind:action="rule.action">'+
						'</label-rule>' +
					'</tbody>' +
				'</table>' +
				'<hr>' +
			'</div>',
		methods: {
			toggleEdit(forceDisable) {
				if(this.edit.active || forceDisable){
					this.edit.active = false
					this.edit.text = 'Edit...'
					this.toggleRemove(true)
					
					discardPath()
					disableDragging()
				} else {
					this.$parent.setAllEditButtonsDisabled()
	
					this.edit.active = true
					this.edit.text = 'EDITING'
					this.toggleExpand(true)
	
					enablePathSelection()
				}
			},
			
			toggleRemove(forceDisable) {
				if(this.remove.active || forceDisable){
					this.remove.active = false
					this.remove.text = 'Remove...'
				} else {
					this.remove.active = true
					this.remove.text = 'REMOVING'
				}
			},
			
			toggleExpand(forceShow) {
				if(this.show.active && !forceShow){
					this.show.active = false
					this.show.text = 'Show'
				} else {
					this.show.active = true
					this.show.text = 'Hide'
				}
			},

			highlightChildrenOnGraph(){
				this.$children.forEach(el => el.highlightMeOnGraph())
			},

			unhighlightChildrenOnGraph(){
				this.$children.forEach(el => el.unhighlightMeOnGraph())
			}
		},

		components: {'label-rule': {
			props: ['device', 'matches', 'action'],
			template:
				'<tr v-on:mouseenter="highlightMeOnGraph" v-on:mouseleave="unhighlightMeOnGraph">' +
					'<td>{{ device }}</td>' +
					'<td>{{ matches[0].name }} {{ matches[0].value }} ' +
						'<span style="color: orange" v-if="matches.length > 2">+</span>' +
					'</td>' +
					'<td>{{ action.name }} {{ action.value }}</td>' +
					'<td v-if="$parent.remove.active">' +
						'<button class="btn-danger" ' +
						'v-on:click="removeMe()">-</button>' +
					'</td>' +
				'</tr>',
			methods: {
				removeMe(){
					let rule = this.$parent.rules.find(rule => 
						rule.device == this.device &&
						rule.matches[0].value == this.matches[0].value &&
						rule.action.value == this.action.value
					)
					rule.deleted = true
					this.$parent.rules.splice(this.$parent.rules.indexOf(rule), 1)
				},

				highlightMeOnGraph(){
					highlightSegmentOnGraph(this.device, this.matches[0].value, this.action.value)
				},

				unhighlightMeOnGraph(){
					if(!sdnData.pathHasAtLeastOneStep())
						removeNodesSelection()
				}
			}
		}}
	}}
})