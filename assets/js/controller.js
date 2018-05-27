var changed = true

var app = angular.module('napp', [])
app.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data):/)
    }
])

app.controller('nc', function ($location, $anchorScroll, $scope) {

    $scope.app = "include/app.html"

    $scope.scrollTo = function (e, hash) {
        e.preventDefault()
        $location.hash(hash)
        $anchorScroll()
    }

    $scope.labInfo = JSON.clone(labInfo)
    $scope.netkit = []
    $scope.counter = 0
    $scope.labInfo.toggle = "enable"

    $scope.minimap_transform = 1
    $scope.compensationScale = []

    $scope.updateMimimapRatio = function (x) {
        var ratio = window.innerHeight / (x + document.getElementById('minimap-body').offsetHeight)
        if (ratio < 1) $scope.minimap_transform = ratio
        else $scope.minimap_transform = 1
    }

    $scope.changeScale = function (index, enter) {
        $scope.compensationScale[index] = enter ? { transform: "scale(1, " + 1 / $scope.minimap_transform + ")" } : { transform: "scale(1, 1)" }
    }

    $scope.addMachine = function () {
        $scope.counter++
        var p = JSON.clone(backbone)
        p.row = $scope.counter
        p._uid = Math.floor((Math.random() * 1000000000000000) + 1)
        $scope.netkit.push(p)

        changed = true
        $scope.updateMimimapRatio(31)
    }

    $scope.addMachine()

    $scope.removeMachine = function () {
        if ($scope.netkit.length > 1 && confirm("Are you sure you want to remove the machine?")) {
            $scope.netkit.pop()
            $scope.counter--

            changed = true
            $scope.updateMimimapRatio(-31)
        }
    }

    $scope.addInterface = function (machine) {
        machine.interfaces.if.push({ "eth": { "number": machine.interfaces.counter } })
        machine.interfaces.counter++

        changed = true
    }

    $scope.removeInterface = function (machine) {
        if (machine.interfaces.counter > 1 && confirm("Are you sure you want to remove the interface?")) {
            machine.interfaces.if.pop()
            machine.interfaces.counter--

            changed = true
        }
    }

    $scope.addGateway = function (machine) {
        machine.gateways.counter++
        machine.gateways.gw.push({ "route": "", "if": 0 })
    }

    $scope.removeGateway = function (machine) {
        if (machine.gateways.counter > 1 && confirm("Are you sure you want to remove the gateway?")) {
            machine.gateways.gw.pop()
            machine.gateways.counter--
        }
    }

    $scope.addFile = function (machine) {
        machine.other.fileCounter++
        machine.other.files.push({ "name": "", "contents": "" })
    }

    $scope.removeFile = function (machine) {
        if (machine.other.fileCounter > 0 && confirm("Are you sure you want to remove the file?")) {
            machine.other.files.pop()
            machine.other.fileCounter--
        }
    }

    $scope.addRipNetwork = function (machine) {
        machine.routing.rip.network.push("")

        changed = true
    }

    $scope.removeRipNetwork = function (machine) {
        if (machine.routing.rip.network.length > 1 && confirm("Are you sure you want to remove the network?")) {
            machine.routing.rip.network.pop()

            changed = true
        }
    }

    $scope.addRipRoute = function (machine) {
        machine.routing.rip.route.push("")
    }

    $scope.removeRipRoute = function (machine) {
        if (machine.routing.rip.route.length > 1 && confirm("Are you sure you want to remove the route?")) {
            machine.routing.rip.route.pop()
        }
    }

    $scope.addOspfNetwork = function (machine) {
        machine.routing.ospf.network.push("")
        machine.routing.ospf.area.push("0.0.0.0")
        machine.routing.ospf.stub.push(false)

        changed = true
    }

    $scope.removeOspfNetwork = function (machine) {
        if (machine.routing.ospf.network.length > 1 && confirm("Are you sure you want to remove the network?")) {
            machine.routing.ospf.network.pop()
            machine.routing.ospf.area.pop()
            machine.routing.ospf.stub.pop()

            changed = true
        }
    }

    $scope.addBgpNetwork = function (machine) {
        machine.routing.bgp.network.push("")

        changed = true
    }

    $scope.removeBgpNetwork = function (machine) {
        if (machine.routing.bgp.network.length > 1 && confirm("Are you sure you want to remove the network?")) {
            machine.routing.bgp.network.pop()

            changed = true
        }
    }

    $scope.addBgpNeighbor = function (machine) {
        machine.routing.bgp.remote.push({ "neighbor": "", "as": "", "description": ""/*, "p_list":[{"name":"", "direction":""}]*/ })
    }

    $scope.removeBgpNeighbor = function (machine) {
        if (machine.routing.bgp.remote.length > 1 && confirm("Are you sure you want to remove the neighbor?")) {
            machine.routing.bgp.remote.pop()
        }
    }

    $scope.addBgpRule = function (rules) {
        rules.push("")
    }

    $scope.removeBgpRule = function (rules) {
        if (rules.length > 0 && confirm("Are you sure you want to remove the last rule?")) {
            rules.pop()
        }
    }

    $scope.makeDownload = function (text, filename) {
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" })
        saveAs(blob, filename)
    }

    $scope.generateScript = function (netkitData, labInfoData) {
        return makeScript(makeFileStructure(netkitData, labInfoData))
    }

    $scope.generateConfig = function (netkitData, labInfoData) {
        var all = [{ "labInfo": labInfoData, "netkit": netkitData }]
        return JSON.stringify(all, undefined, 4)
    }

    $scope.generateZip = function (netkitData, labInfoData) {
        return makeZip(makeFileStructure(netkitData, labInfoData))
    }

    $scope.makeGraph = function (netkitData) {
        return makeGraph(netkitData)
    }

    $scope.makeGraphIfChanged = function (netkitData) {
        if (changed) {
            console.log("Reloading graph")
            changed = false
            return makeGraph(netkitData)
        }
    }

    $scope.toggleGraphUpdate = function () {
        if ($scope.labInfo.toggle == "disable") {
            $scope.labInfo.toggle = "enable"
        }
        else $scope.labInfo.toggle = "disable"
    }

    $scope.loadSDN = function(netkitData, labInfoData){
        getData($scope.generateConfig(netkitData, labInfoData))
    }

    $scope.import = function () {
        try {
            var f = document.getElementById('file').files[0]
            var r = new FileReader()
            if (typeof (f) != "undefined") {
                r.onloadend = function (e) {
                    try {
                        var app = JSON.parse(e.target.result.substring(e.target.result.indexOf("["))) // rimozione caratteri di codifica prima di '['
                        $scope.netkit = app[0].netkit
                        $scope.counter = $scope.netkit.length
                        $scope.labInfo = app[0].labInfo
                        $scope.$apply()

                        changed = true
                    }
                    catch (err) {
                        alert("Error: " + err)
                    }
                }
                r.readAsBinaryString(f)
            }
            else alert("No file selected")
        }
        catch (err) {
            alert("Error in File Reader: " + err)
        }
    }

})