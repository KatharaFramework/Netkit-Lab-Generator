var app = angular.module('napp', []);
app.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data):/);
    }
]);

app.controller('nc', function($scope) {

    $scope.app = "include/app.html";

    $scope.netkit = [JSON.clone(backbone)];
    $scope.counter = 1;

    $scope.addMachine = function() {
        $scope.counter++;
        var p = JSON.clone(backbone);
        p.row=$scope.counter;
        $scope.netkit.push(p);
    };

    $scope.removeMachine = function() {
        if($scope.netkit.length>1 && confirm("Sicuro di voler rimuovere la macchina?")) {
            $scope.netkit.pop();
            $scope.counter--;
        }
    };

    $scope.addInterface = function(machine) {
        machine.interfaces.if.push({"eth":{"number":machine.interfaces.counter}});
        machine.interfaces.counter++;
    };

    $scope.removeInterface = function(machine) {
        if(machine.interfaces.counter>1 && confirm("Sicuro di voler rimuovere l'interfaccia?")) {
            machine.interfaces.if.pop();
            machine.interfaces.counter--;
        }
    };

    $scope.addGateway = function(machine) {
        machine.gateways.counter++;
        machine.gateways.gw.push({"route":"", "if":0});
    };

    $scope.removeGateway = function(machine) {
        if(machine.gateways.counter>1 && confirm("Sicuro di voler rimuovere il gateway?")) {
            machine.gateways.gw.pop();
            machine.gateways.counter--;
        }
    };

    $scope.addRipNetwork = function(machine) {
        machine.routing.rip.network.push("");
    };

    $scope.removeRipNetwork = function(machine) {
        if(machine.routing.rip.network.length>1 && confirm("Sicuro di voler rimuovere il network?")) {
            machine.routing.rip.network.pop();
        }
    };

    $scope.addRipRoute = function(machine) {
        machine.routing.rip.route.push("");
    };

    $scope.removeRipRoute = function(machine) {
        if(machine.routing.rip.route.length>1 && confirm("Sicuro di voler rimuovere la route?")) {
            machine.routing.rip.route.pop();
        }
    };

    $scope.addOspfNetwork = function(machine) {
        machine.routing.ospf.network.push("");
        machine.routing.ospf.area.push("0.0.0.0");
        machine.routing.ospf.area.stub(false);
    };

    $scope.removeOspfNetwork = function(machine) {
        if(machine.routing.ospf.network.length>1 && confirm("Sicuro di voler rimuovere il network?")) {
            machine.routing.ospf.network.pop();
            machine.routing.ospf.area.pop();
            machine.routing.ospf.stub.pop();
        }
    };

    $scope.makeDownload = function(text, filename) {
        var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
        saveAs(blob, filename);
    };

    $scope.generateScript = function(nk) {
        return makeScript(makeFileStructure(nk));
    };

    $scope.generateConfig = function(nk) {
        return JSON.stringify(nk, undefined, 4);
    };

    $scope.generateZip = function(nk) {
        return makeZip(makeFileStructure(nk));
    };

    $scope.import = function() {
        try {
            var f = document.getElementById('file').files[0];
            var r = new FileReader();
            if (typeof(f) != "undefined") {
                r.onloadend = function (e) {
                    try {
                        $scope.netkit = JSON.parse(e.target.result.substring(e.target.result.indexOf("["))); // rimozione caratteri di codifica
                        $scope.counter = $scope.netkit.length;
                        $scope.$apply();
                    }
                    catch (err) {
                        alert("Errore: " + err);
                    }
                };
                r.readAsBinaryString(f);
            }
            else alert("Nessun file selezionato");
        }
        catch (err) {
            alert("Errore File Reader: " + err);
        }
    }
});