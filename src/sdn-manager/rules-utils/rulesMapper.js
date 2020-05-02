var rulesMapper = {

	/* ---------------------------------------------------------------- */
	/* ------------------------- RULES TO RYU ------------------------- */
	/* ---------------------------------------------------------------- */

	makeMatch: function (matches, offset) {
		if (![20000, 10000].includes(offset))
			throw new Error("Implicit protocol not recognized");
		var ofmatch = {};
		if (matches[0].name != "any") {
			for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
				var match = matches_1[_i];
				switch (match.name) {
					case "MPLS label": // mpls_label	{"mpls_label": 3, "eth_type": 34888}
						ofmatch.mpls_label = (this.mapperMPLS.nameToValue(match.value) + offset);
						ofmatch.eth_type = 34887;
						break;
					case "source port": // in_port		{"in_port": 7}
						ofmatch.in_port = +match.value;
						if (offset)
							ofmatch.eth_type = (offset == 10000 ? 2054 : 2048);
						break;
					case "MAC source": // eth_src		{"eth_src": "aa:bb:cc:11:22:33"}
						ofmatch.eth_src = match.value;
						break;
					case "MAC destination": // eth_dst		{"eth_dst": "aa:bb:cc:11:22:33/00:00:00:00:ff:ff"}
						ofmatch.eth_dst = match.value;
						break;
					case "IPv4 source": // ipv4_src		{"ipv4_src": "192.168.0.1", "eth_type": 2048}
						ofmatch.ipv4_src = match.value;
						ofmatch.eth_type = 2048;
						break;
					case "IPv4 destination": // ipv4_dst		{"ipv4_dst": "192.168.10.10/255.255.255.0", "eth_type": 2048}
						ofmatch.ipv4_dst = match.value;
						ofmatch.eth_type = 2048;
						break;
					case "TCP source port": // tcp_src		{"tcp_src": 3, "ip_proto": 6, "eth_type": 2048}
						ofmatch.tcp_src = +match.value;
						ofmatch.ip_proto = 6;
						ofmatch.eth_type = 2048;
						break;
					case "TCP destination port": // tcp_dst		{"tcp_dst": 5, "ip_proto": 6, "eth_type": 2048}
						ofmatch.tcp_dst = +match.value;
						ofmatch.ip_proto = 6;
						ofmatch.eth_type = 2048;
						break;
					case "ethertype":
						console.warn("ethertype may be overwritten");
						if (match.value == "ARP")
							ofmatch.eth_type = 2054;
						else if (match.value == "IPv4")
							ofmatch.eth_type = 2048;
						else if (match.value == "MPLS")
							ofmatch.eth_type = 34887;
						else if (match.value == "LLDP")
							ofmatch.eth_type = 35020;
						else
							throw new Error("Did not find a mapping to a known ethertype (" + match.value + ")");
						break;
					default:
						throw new Error("Did not find a mapping to a known match (" + match.name + " " + match.value + ")");
				}
			}
		}
		return ofmatch;
	},

	makeActions: function (actions, offset) {
		var ofactions = [];
		if (actions[0].name != "drop") {
			for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
				var action = actions_1[_i];
				switch (action.name) {
					case "set MPLS label": // PUSH_MPLS	{"type": "PUSH_MPLS", "ethertype": 34887}
						ofactions.push({
							type: "PUSH_MPLS",
							ethertype: 34887
						});
						ofactions.push({
							type: "SET_FIELD",
							field: "mpls_label",
							value: (this.mapperMPLS.nameToValue(action.value) + offset)
						});
						break;
					case "pop MPLS label": // POP_MPLS		{"type": "POP_MPLS", "ethertype": 2054}
						ofactions.push({
							type: "POP_MPLS",
							ethertype: (offset == 10000 ? "2054" : "2048")
						});
						break;
					case "forward to port": // OUTPUT		{"type": "OUTPUT", "port": 3}
						ofactions.push({
							type: "OUTPUT",
							port: action.value
						});
						break;
					case "send to controller":
						ofactions.push({
							type: "OUTPUT",
							port: "CONTROLLER"
						});
						break;
					case "send to table": // GOTO_TABLE		{"type": "GOTO_TABLE", "table_id": 8}
						ofactions.push({
							type: "GOTO_TABLE",
							table_id: action.value
						});
						break;
					default:
						throw new Error("Did not find a mapping to a known action (" + action.name + " " + action.value + ")");
				}
			}
		}
		return ofactions;
	},

	/* ---------------------------------------------------------------- */
	/* ------------------------- RYU TO RULES ------------------------- */
	/* ---------------------------------------------------------------- */

	reverseMatch: function (match) {
		var reversedMatches = [];
		for (var matchKey in match) {
			switch (matchKey) {
				case "dl_type":
					if (match.dl_type == 2054)
						reversedMatches.push({ name: "ethertype", value: "ARP" });
					else if (match.dl_type == 2048)
						reversedMatches.push({ name: "ethertype", value: "IPv4" });
					else if (match.dl_type == 34887)
						reversedMatches.push({ name: "ethertype", value: "MPLS" });
					else if (match.dl_type == 35020)
						reversedMatches.push({ name: "ethertype", value: "LLDP" });
					else
						throw new Error("Did not find a reverse mapping to a known ethertype (" + match[matchKey] + ")");
					break;
				case "dl_dst":
					reversedMatches.push({ name: "MAC destination", value: String(match.dl_dst) });
					break;
				case "in_port":
					reversedMatches.push({ name: "source port", value: String(match.in_port) });
					break;
				case "mpls_label":
					reversedMatches.push({ name: "MPLS label", value: this.mapperMPLS.valueToName(match.mpls_label) });
					break;
				default:
					throw new Error("OpenFlow Match not recognized. Cannot map to a valid simMatch");
			}
		}
		if (!reversedMatches.length) {
			reversedMatches.push({ name: "any", value: "" });
		}
		return reversedMatches;
	},

	reverseActions: function (actions) {
		var reversedActions = [];
		for (var _i = 0, actions_2 = actions; _i < actions_2.length; _i++) {
			var action = actions_2[_i];
			var columnIndex = action.indexOf(":");
			var name_1 = action.substring(0, columnIndex);
			var value = action.substring(columnIndex + 1);
			switch (name_1) {
				case "OUTPUT":
					if (value == "CONTROLLER") {
						reversedActions.push({ name: "send to controller", value: "" });
					}
					else {
						reversedActions.push({ name: "forward to port", value: +value });
					}
					break;
				case "PUSH_MPLS":
					reversedActions.push({ name: "set MPLS label", value: "err: see set-field" });
					break;
				case "SET_FIELD":
					var _a = value.replace(/[{} 	]/g, "").split(":"), whichField = _a[0], otherValue = _a[1];
					if (whichField === "mpls_label") {
						var labelName = this.mapperMPLS.valueToName(otherValue);
						reversedActions.push({ name: "set field", value: "mpls:" + labelName });
					}
					else {
						throw new Error("Error while mapping rules @ SET_FIELD: cannot map this field to a known one");
					}
					break;
				case "POP_MPLS":
					var protocolName = (value === "2054" ? "ARP" :
						value === "2048" ? "IPv4" :
							"Unknown");
					reversedActions.push({ name: "pop MPLS label", value: protocolName });
					break;
				case "GOTO_TABLE":
					reversedActions.push({ name: "send to table", value: value });
					break;
				default:
					throw new Error("OpenFlow Action not recognized. Cannot map to a valid simAction");
			}
		}
		if (!reversedActions.length) {
			reversedActions.push({ name: "drop", value: "" });
		}
		return reversedActions;
	},

	/* --------------------------------------------------------------- */
	/* ---------------------------- OTHER ---------------------------- */
	/* --------------------------------------------------------------- */

	mapperMPLS: {
		_counter: Math.floor(Math.random() * 990) + 9,
		_map: {},
		nameToValue: function (labelName) {
			if (!this._map[labelName])
				this._map[labelName] = ++this._counter;
			return (+this._map[labelName]);
		},
		valueToName: function (value) {
			value = (value % 10000);
			for (var labelName in this._map)
				if (this._map[labelName] == value)
					return labelName;
			var newName = "L" + (++this._counter);
			this._map[newName] = +value;
			return newName;
		}
	}
};
