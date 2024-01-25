var changed = true;

var app = angular.module("napp", []);

app.config(["$compileProvider",
	function ($compileProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data):/);
	}
]);

app.controller("nc", function ($location, $anchorScroll, $scope) {

	$scope.app = "include/app.html";
	$scope.labInfo = JSON.clone(labInfo);
	$scope.netkit = [];
	$scope.counter = 0;
	$scope.labInfo.toggle = "enable";

	$scope.scrollTo = function (e, hash) {
		e.preventDefault();
		$location.hash(hash);
		$anchorScroll();
	};

	$scope.addMachine = function () {
		$scope.counter++;
		var p = JSON.clone(backbone);
		p.row = $scope.counter;
		p._uid = Math.floor((Math.random() * (1000 ** 5)) + 1);
		$scope.netkit.push(p);

		changed = true;
	};

	$scope.addMachine();

	$scope.removeMachine = function () {
		if ($scope.netkit.length > 1 && confirm("Are you sure you want to remove the machine?")) {
			$scope.netkit.pop();
			$scope.counter--;

			changed = true;
		}
	};

	$scope.addInterface = function (machine) {
		machine.interfaces.if.push({ "eth": { "number": machine.interfaces.counter } });
		machine.interfaces.counter++;

		changed = true;
	};

	$scope.removeInterface = function (machine) {
		if (machine.interfaces.counter > 1 && confirm("Are you sure you want to remove the interface?")) {
			machine.interfaces.if.pop();
			machine.interfaces.counter--;

			changed = true;
		}
	};

	$scope.addGateway = function (machine) {
		machine.gateways.counter++;
		machine.gateways.gw.push({ "route": "", "if": 0 });
	};

	$scope.removeGateway = function (machine) {
		if (machine.gateways.counter > 1 && confirm("Are you sure you want to remove the gateway?")) {
			machine.gateways.gw.pop();
			machine.gateways.counter--;
		}
	};

	$scope.addFile = function (machine) {
		machine.other.fileCounter++;
		machine.other.files.push({ "name": "", "contents": "" });
	};

	$scope.removeFile = function (machine) {
		if (machine.other.fileCounter > 0 && confirm("Are you sure you want to remove the file?")) {
			machine.other.files.pop();
			machine.other.fileCounter--;
		}
	};

	$scope.addRipNetwork = function (machine) {
		machine.routing.rip.network.push("");
		changed = true;
	};

	$scope.removeRipNetwork = function (machine) {
		if (machine.routing.rip.network.length > 1 && confirm("Are you sure you want to remove the network?")) {
			machine.routing.rip.network.pop();
			changed = true;
		}
	};

	$scope.addRipRoute = function (machine) {
		machine.routing.rip.route.push("");
	};

	$scope.removeRipRoute = function (machine) {
		if (machine.routing.rip.route.length > 1 && confirm("Are you sure you want to remove the route?")) {
			machine.routing.rip.route.pop();
		}
	};

	$scope.addOspfNetwork = function (machine) {
		machine.routing.ospf.network.push("");
		machine.routing.ospf.area.push("0.0.0.0");
		machine.routing.ospf.stub.push(false);

		changed = true;
	};

	$scope.removeOspfNetwork = function (machine) {
		if (machine.routing.ospf.network.length > 1 && confirm("Are you sure you want to remove the network?")) {
			machine.routing.ospf.network.pop();
			machine.routing.ospf.area.pop();
			machine.routing.ospf.stub.pop();

			changed = true;
		}
	};

	$scope.addBgpNetwork = function (machine) {
		machine.routing.bgp.network.push("");

		changed = true;
	};

	$scope.removeBgpNetwork = function (machine) {
		if (machine.routing.bgp.network.length > 1 && confirm("Are you sure you want to remove the network?")) {
			machine.routing.bgp.network.pop();

			changed = true;
		}
	};

	$scope.addBgpNeighbor = function (machine) {
		machine.routing.bgp.remote.push({ "neighbor": "", "as": "", "description": ""/*, "p_list":[{"name":"", "direction":""}]*/ });
	};

	$scope.removeBgpNeighbor = function (machine) {
		if (machine.routing.bgp.remote.length > 1 && confirm("Are you sure you want to remove the neighbor?")) {
			machine.routing.bgp.remote.pop();
		}
	};

	$scope.addBgpRule = function (rules) {
		rules.push("");
	};

	$scope.removeBgpRule = function (rules) {
		if (rules.length > 0 && confirm("Are you sure you want to remove the last rule?")) {
			rules.pop();
		}
	};

	$scope.makeDownload = function (text, filename) {
		var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
		saveAs(blob, filename, true);
	};

	$scope.generateScript = function (netkitData, labInfoData) {
		return makeScript(makeFilesStructure(netkitData, labInfoData));
	};

	$scope.generateConfig = function (netkitData, labInfoData) {
		var all = [{ "labInfo": labInfoData, "netkit": netkitData }];
		return JSON.stringify(all, undefined, 4);
	};

	$scope.generateZip = function (netkitData, labInfoData) {
		return makeZip(makeFilesStructure(netkitData, labInfoData));
	};

	$scope.makeGraph = function (netkitData) {
		return makeGraph(netkitData);
	};

	$scope.makeGraphIfChanged = function (netkitData) {
		if (changed) {
			changed = false;
			return makeGraph(netkitData);
		}
	};

	$scope.toggleOVSwitchSelection = function (netkitData, thisType) {
		return netkitData.some(machine => machine.type == "controller") && thisType != "controller";
	};

	$scope.toggleControllerSelection = function (netkitData, thisType) {
		return !netkitData.some(machine => machine.type == "controller") || thisType == "controller";
	};

	$scope.toggleGraphUpdate = function () {
		if ($scope.labInfo.toggle == "disable") {
			$scope.labInfo.toggle = "enable";
		}
		else $scope.labInfo.toggle = "disable";
	};

	$scope.import = function () {
		let fileElement = document.getElementById("file");
		try {
			let filePath = fileElement.files[0];
			if (filePath) {
				let fileReader = new FileReader();
				fileReader.onloadend = function (e) {
					try {
						let app = JSON.parse(e.target.result.substring(e.target.result.indexOf("["))); // rimozione caratteri di codifica prima di '['
						$scope.netkit = app[0].netkit;
						$scope.counter = $scope.netkit.length;
						$scope.labInfo = app[0].labInfo;
						$scope.$apply();

						changed = true;
					}
					catch (err) {
						alert("Error: " + err);
					}
				};
				fileElement.value = "";
				fileReader.readAsBinaryString(filePath);
			} else {
				fileElement.click();
			}
		}
		catch (err) {
			alert("Error in File Reader: " + err);
		}
	};
});
