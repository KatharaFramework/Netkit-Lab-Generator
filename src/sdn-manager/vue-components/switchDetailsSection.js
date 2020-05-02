const switchDetailsSection = new Vue({
	el: "#switchDetailsSection",
	data: {
		visible: false,

		device: null,
		packetRules: [],
		labelRules: [],

		activeSection: 1,	// 1: Pacchetti 2: Statistiche 3: Inspect
		responseTextareaContent: "",

		columnsVisibility: {
			idleTimeout: false,
			hardTimeout: false,
			tableId: false,
			statistics: false
		}
	},
	methods: {
		open(device){
			controllerAndRulesSection.close();

			this.close();
			this.visible = true;
			this.device = device;

			let rules = dataStore.getSwitchRules(device);
			if(rules){
				this.packetRules = rules.filter(rule =>
					!( rule.matches.some(match => match.label)
						|| rule.actions.some(action => action.label)
					));
				this.labelRules = rules.filter(
					rule => !this.packetRules.includes(rule));
			}
		},

		close(){
			this.visible = false;
			this.device = null;
			this.packetRules = [];
			this.labelRules = [];
			this.activeSection = 1;
			this.responseTextareaContent = "";
		},

		switchTab(tabNumber){
			this.activeSection = tabNumber;
			if(tabNumber == 2) this.updateSVG();
		},

		/* ------------------------------------------------------ */
		/* ------------------------ RULES ----------------------- */
		/* -------------------- (& controller) ------------------ */

		submitRule(rule, callback){
			ryuActions.addFlowEntry(rule, (err) => {
				if(!err){
					rule.submitted = true;
					rule.edited = false;
					rule.deleted = false;

					if(callback) callback();
				} else {
					console.error(err.message);
				}
			});
		},

		updateRule(rule){
			this.removeSubmittedRule(rule,
				() => this.submitRule(rule));
		},

		removeSubmittedRule(rule, callback){
			ryuActions.removeFlowEntry(rule,
				() => {
					rule.submitted = false;
					rule.edited = false;
					rule.deleted = true;

					if(callback) callback();
				});
		},

		highlightRuleOnGraph(index){
			highlightSegmentOnGraph(
				this.device,
				this.labelRules[index].matches.find(match => match.name == "source port").value,
				this.labelRules[index].actions.find(action => action.name == "forward to port").value
			);
		},

		/* ----------------------------------------------------- */
		/* ------------------------ SVG ------------------------ */
		/* ----------------------------------------------------- */

		updateSVG(){
			let svg = d3.select("#switchDetailsSection svg");
			svg.node().innerHTML = "";
			let padding = 45;
			let width = svg.attr("width") - padding;
			let height = svg.attr("height") - padding;

			let counter = 1;
			let data = this.packetRules.concat(this.labelRules).map(function(el){ return { num: counter++, stats: el.stats };}).slice(1);

			let x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
				y = d3.scaleLinear().rangeRound([height, 0]);

			let g = svg.append("g")
				.attr("transform", "translate(20, 5)");

			x.domain(data.map(function (d) { return d.num; }));
			y.domain([0, d3.max(data, function (d) { return d.stats; })]);

			g.append("g")
				.attr("class", "x-axis")
				.attr("transform", "translate(0," + (height + 5) + ")")
				.call(d3.axisBottom(x));

			g.append("g")
				.attr("class", "y-axis")
				.call(d3.axisLeft(y).ticks(10))
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", "0.71em")
				.attr("text-anchor", "end")
				.text("stats");

			g.selectAll(".bar")
				.data(data)
				.enter().append("rect")
				.attr("class", "bar")
				.attr("x", function (d) { return x(d.num); })
				.attr("y", function (d) { return y(d.stats); })
				.attr("width", x.bandwidth())
				.attr("height", function (d) { return height - y(d.stats); })
				.attr("fill", "var(--main-color)");
		},

		/* ----------------------------------------------------- */
		/* ----------------------- OTHER ----------------------- */
		/* ----------------------------------------------------- */

		popupModal(index, group){
			if(index != undefined && group != undefined){
				let rules = (group == "packetRules" ? this.packetRules : this.labelRules);
				ruleModal.editRule(rules[index]);
			} else ruleModal.open(this.device);
		},

		askRyu(action){
			let responsePromise = (action == "stats/table") ?
				ryuActions.getTablesFilteredNotEmpty(this.device)
				: ryuActions.getFromSwitchCustom(action, this.device);

			responsePromise.then(response => {this.responseTextareaContent = JSON.stringify(response, null, 4);});
		}
	},

	components: {
		"rule-element": {
			props: ["name", "value", "label"],
			template:
				"<div>" +
					"<hr>" +
					"<span v-if=\"label\" class=\"colorTag\" " +
						"v-bind:style=\"{ backgroundColor: label.color }\">" +
					"</span>" +
					"<span>{{ name }} </span>" +
					"{{ value }}" +
				"</div>"
		},
	}
});