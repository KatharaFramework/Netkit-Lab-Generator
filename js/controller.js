var app = angular.module('napp', []);
app.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data):/);
    }
]);

app.controller('nc', function($scope) {

    $scope.app = "include/app.html";

    $scope.labInfo = JSON.clone(labInfo);
    $scope.netkit = [JSON.clone(backbone)];
    $scope.counter = 1;
    $scope.labInfo.toggle = "enable";

    $scope.addMachine = function() {
        $scope.counter++;
        var p = JSON.clone(backbone);
        p.row=$scope.counter;
        $scope.netkit.push(p);
    };

    $scope.removeMachine = function() {
        if($scope.netkit.length>1 && confirm("Are you sure you want to remove the machine?")) {
            $scope.netkit.pop();
            $scope.counter--;
        }
    };

    $scope.addInterface = function(machine) {
        machine.interfaces.if.push({"eth":{"number":machine.interfaces.counter}});
        machine.interfaces.counter++;
    };

    $scope.removeInterface = function(machine) {
        if(machine.interfaces.counter>1 && confirm("Are you sure you want to remove the interface?")) {
            machine.interfaces.if.pop();
            machine.interfaces.counter--;
        }
    };

    $scope.addGateway = function(machine) {
        machine.gateways.counter++;
        machine.gateways.gw.push({"route":"", "if":0});
    };

    $scope.removeGateway = function(machine) {
        if(machine.gateways.counter>1 && confirm("Are you sure you want to remove the gateway?")) {
            machine.gateways.gw.pop();
            machine.gateways.counter--;
        }
    };

    $scope.addRipNetwork = function(machine) {
        machine.routing.rip.network.push("");
    };

    $scope.removeRipNetwork = function(machine) {
        if(machine.routing.rip.network.length>1 && confirm("Are you sure you want to remove the network?")) {
            machine.routing.rip.network.pop();
        }
    };

    $scope.addRipRoute = function(machine) {
        machine.routing.rip.route.push("");
    };

    $scope.removeRipRoute = function(machine) {
        if(machine.routing.rip.route.length>1 && confirm("Are you sure you want to remove the route?")) {
            machine.routing.rip.route.pop();
        }
    };

    $scope.addOspfNetwork = function(machine) {
        machine.routing.ospf.network.push("");
        machine.routing.ospf.area.push("0.0.0.0");
        machine.routing.ospf.stub.push(false);
    };

    $scope.removeOspfNetwork = function(machine) {
        if(machine.routing.ospf.network.length>1 && confirm("Are you sure you want to remove the network?")) {
            machine.routing.ospf.network.pop();
            machine.routing.ospf.area.pop();
            machine.routing.ospf.stub.pop();
        }
    };

    $scope.addBgpNetwork = function(machine) {
        machine.routing.bgp.network.push("");
    };

    $scope.removeBgpNetwork = function(machine) {
        if(machine.routing.bgp.network.length>1 && confirm("Are you sure you want to remove the network?")) {
            machine.routing.bgp.network.pop();
        }
    };

    $scope.addBgpNeighbor = function(machine) {
        machine.routing.bgp.remote.push({"neighbor":"", "as":"", "description":""/*, "p_list":[{"name":"", "direction":""}]*/});
    };

    $scope.removeBgpNeighbor = function(machine) {
        if(machine.routing.bgp.remote.length>1 && confirm("Are you sure you want to remove the neighbor?")) {
            machine.routing.bgp.remote.pop();
        }
    };

    $scope.addBgpRule = function(rules) {
        rules.push("");
    };

    $scope.removeBgpRule = function(rules) {
        if(rules.length>0 && confirm("Are you sure you want to remove the last rule?")) {
            rules.pop();
        }
    };

    $scope.makeDownload = function(text, filename) {
        var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
        saveAs(blob, filename);
    };

    $scope.generateScript = function(nk, li) {
        return makeScript(makeFileStructure(nk, li));
    };

    $scope.generateConfig = function(nk, li) {
        var all = [{"labInfo": li, "netkit": nk}];
        return JSON.stringify(all, undefined, 4);
    };

    $scope.generateZip = function(nk, li) {
        return makeZip(makeFileStructure(nk, li));
    };

    $scope.makeGraph = function(nk) {
        return makeGraph(nk);
    };

    $scope.toggleGraphUpdate = function () {
        if($scope.labInfo.toggle=="disable"){
            $scope.labInfo.toggle = "enable";
        }
        else $scope.labInfo.toggle="disable";
    };

    $scope.import = function() {
        try {
            var f = document.getElementById('file').files[0];
            var r = new FileReader();
            if (typeof(f) != "undefined") {
                r.onloadend = function (e) {
                    try {
                        var app = JSON.parse(e.target.result.substring(e.target.result.indexOf("["))); // rimozione caratteri di codifica prima di '['
                        $scope.netkit = app[0].netkit;
                        $scope.counter = $scope.netkit.length;
                        $scope.labInfo = app[0].labInfo;
                        $scope.$apply();
                    }
                    catch (err) {
                        alert("Error: " + err);
                    }
                };
                r.readAsBinaryString(f);
            }
            else alert("No file selected");
        }
        catch (err) {
            alert("Error in File Reader: " + err);
        }
    };

});