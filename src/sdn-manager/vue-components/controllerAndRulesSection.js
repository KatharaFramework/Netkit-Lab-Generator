const controllerAndRulesSection = new Vue({
	el: "#controllerAndRulesSection",
	data: {
		visible: false,
		// HOW TO
		howtoVisibility: false,
		// CONTROLLER
		controllerSection: {
			visible: false,
			request: {
				method: "GET",
				path: "",
				params: "",
				paramsValidity: true
			},
			output: "",
			history: []
		},
		// SHOW RULES
		rulesSection: {
			visible: 0,
			rules: "",
			submittedRules: "",
			filter: ""
		}
	},
	methods: {
		open(sectionNumber) {
			switchDetailsSection.close();

			this.close();
			this.visible = true;

			if (sectionNumber == 1) {
				this.howtoVisibility = true;
			} else if (sectionNumber == 2) {
				this.controllerSection.visible = true;
			} else if (sectionNumber == 3) {
				this.rulesSection.visible = 1;	// 0: nascosto; 1: regole simulate; 2: regole installate
				this.showRulesFilteredByDevice();
			}
		},

		close() {
			this.visible = false;

			this.howtoVisibility = false;
			this.controllerSection.visible = false;

			this.rulesSection.visible = 0;
			this.rulesSection.filter = "";
		},

		showRulesFilteredByDevice() {
			let rules = this.rulesSection.visible == 1 ? dataStore.getRules() : dataStore.getSubmittedRules();
			rules = this._makeCleanRulesFromExistingOnes(rules);

			let representation = JSON.stringify(
				rules.filter(rule =>
					this.rulesSection.filter ? (rule.device == this.rulesSection.filter) : true),
				null, 4
			);

			if(this.rulesSection.visible == 1) this.rulesSection.rules = representation;
			else if(this.rulesSection.visible == 2) this.rulesSection.submittedRules = representation;
		},

		showSimulatedRules(){
			this.rulesSection.filter = "";
			this.rulesSection.visible = 1;
			this.showRulesFilteredByDevice();
		},

		showSubmittedRules(){
			this.rulesSection.filter = "";
			this.rulesSection.visible = 2;
			this.showRulesFilteredByDevice();
		},

		exportJSON(){
			let rules = this._makeCleanRulesFromExistingOnes(dataStore.getRules());
			downloadString(JSON.stringify(rules), "rules.JSON");
		},

		importRules(){
			let fileInput = document.getElementById("rules-file");
			try {
				let filePath = fileInput.files[0];
				if (filePath) {
					let fileReader = new FileReader();
					fileReader.onloadend = function (event) {
						try {
							let res = event.target.result;
							let rules = JSON.parse(res
								.substring(res.indexOf("[")));
							dataStore.importRules(rules);
						}
						catch (err) {
							alert("Error: " + err);
						}
					};
					fileInput.value = "";
					fileReader.readAsBinaryString(filePath);
				} else {
					fileInput.click();
				}
			}
			catch (err) {
				alert("Error in File Reader: " + err);
			}
		},

		_makeCleanRulesFromExistingOnes(rules){
			rules = JSON.parse(JSON.stringify(rules));
			for(let rule of rules){
				if(rule.stats != undefined) delete rule.stats;
				if(rule.deleted != undefined) delete rule.deleted;
				if(rule.submitted != undefined) delete rule.submitted;
				if(rule.edited != undefined) delete rule.edited;
				if(rule.openflowRules != undefined) delete rule.openflowRules;
			}
			return rules;
		},

		makeRequest(){
			arguments[0].preventDefault();
			if(this.controllerSection.request.path
				&& !(this.controllerSection.request.method == "POST" && this.controllerSection.request.params == "")){
				try {
					let params;
					if(this.controllerSection.request.method == "POST"){
						params = JSON.parse(this.controllerSection.request.params);
					} else params = {};

					this.controllerSection.output = "Request sent...";
					ryuActions.makeCustom(
						this.controllerSection.request.method,
						this.controllerSection.request.path,
						params,
						(response) => { this._setHTTPResponse(response); }
					);

					this._addToHistory();

					this.controllerSection.request.path = "";
					this.controllerSection.request.params = "";

				} catch (err) {
					this.controllerSection.output = "Error while parsing parameteres";
				}
			}
		},

		repeat(index){
			let historyElement = this.controllerSection.history[index];
			this.controllerSection.request.method = historyElement.method;
			this.controllerSection.request.path = historyElement.path;
		},

		checkParams(){
			try {
				JSON.parse(this.controllerSection.request.params);
				this.controllerSection.request.paramsValidity = true;
			} catch (e){
				this.controllerSection.request.paramsValidity = false;
			}
		},

		_setHTTPResponse(response){
			try {
				this.controllerSection.output =
					JSON.stringify(
						JSON.parse(response), null, 4
					);
			} catch (e){
				this.controllerSection.output = response;
			}
		},

		_addToHistory(){
			let historyElement = {
				method: this.controllerSection.request.method,
				path: this.controllerSection.request.path
			};

			this.controllerSection.history.unshift(historyElement);

			if(this.controllerSection.history.length > 5)
				this.controllerSection.history.pop();
		}
	}
});