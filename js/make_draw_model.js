function ip_to_bin(ip) {
    var ipfields = ip.split(".");
    var binary = "";

    for (var key in ipfields) {
        if (ipfields[key]>255) ipfields[key] = 255;
        if (ipfields[key]<0) ipfields[key] = 0;

        var app = parseInt(ipfields[key]).toString(2);
        var pad = "00000000";
        app = pad.substring(0, pad.length - app.toString(2).length) + app.toString(2);
        binary = binary + "" + app.toString(2);
    }
    return binary;
}
function network_from_binary_ip_mask(binary, netmask) {
    var network = "";
    for (var j = 0; j<32; j++) {
        if(netmask[j]=='1') network+=binary[j];
        else network+='0';
    }
    return network;
}

function bin_to_ip(bin) {
    var ip = "";
    for (var i=0; i<32; i=i+8){
        var app = "";
        for(var k = 0; k<8; k++) app += bin[i+k];
        ip += parseInt(app,2) + ((i<24) ? ".": "");
    }
    return ip;
}

function binary_netmask_from_decimal(dec) {
    if (dec>32) dec = 32;
    var netmask = "";
    for (var j = 0; j<32; j++) { netmask = netmask + ((j<dec) ? '1':'0'); }
    return netmask;
}

function get_network_from_ip_net(ip_net) {
    var split = ip_net.split("/");
    var ip = split[0];
    var net = split[1];
    if(net > 32) net = 32;
    if(net <0) net = 0;
    var binary = ip_to_bin(ip);
    var netmask = binary_netmask_from_decimal(net);
    var network = network_from_binary_ip_mask(binary, netmask);
    var network_ip = bin_to_ip(network);
    return network_ip+"/"+net;
}

function find_destination_eth(lab, name, machine_name, eth_number){
    for (var n in lab) {
        //for each interface of the machine
        for (var f in lab[n].interfaces.if){
            if(lab[n].interfaces.if[f].eth.domain==name && (lab[n].name!=machine_name ||
                (lab[n].name!=machine_name && lab[n].interfaces.if[f].eth.number!=eth_number))) {
                return {"n":n, "f":f};
            }
        }
    }
    return null;
}

function get_eth_ip_difference(network, ip) {
    var net_split = network.split("/")[0];
    var ip_split = ip.split("/")[0];
    net_split = net_split.split(".");
    ip_split = ip_split.split(".");
    if(net_split.length != ip_split.length) return 0;
    for(var i in net_split) {
        if(net_split[i]!=ip_split[i]) return ip_split[i];
    }
    return 0;
}

function same_edge(obj1, obj2){
    try {
        return (obj2.type == obj1.type &&
        obj2.machine == obj1.machine &&
        obj2.eth_number == obj1.eth_number &&
        obj2.domain == obj1.domain);
    }
    catch (e) {
        return false;
    }
}

function contains_edge(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (same_edge(list[i], obj)) {
            return true;
        }
    }
    return false;
}

// TODO: eth -> internet still not working do we care?
function get_edges(lab) {
    var sources = [];
    var destinations = [];
    try {
        //for each machine in the lab
        for (var m in lab) {
            //for each interface of the machine
            for (var e in lab[m].interfaces.if) {
                var name = lab[m].interfaces.if[e].eth.domain;
                var edge_ip = get_network_from_ip_net(lab[m].interfaces.if[e].ip);
                var ip_diff = get_eth_ip_difference(edge_ip, lab[m].interfaces.if[e].ip);

                var source = {
                    "type": "eth-eth",
                    "machine": lab[m].name,
                    "eth_number": lab[m].interfaces.if[e].eth.number,
                    "domain": name,
                    "edge_ip": edge_ip,
                    "ip": ip_diff,
                    "warnings":""
                };
                if(name!=""){
                    var edge_ee = {
                        "type": "machine-eth",
                        "machine": lab[m].name,
                        "eth_number": lab[m].interfaces.if[e].eth.number,
                        "domain": name,
                        "edge_ip": edge_ip,
                        "ip": ip_diff,
                        "warnings": ""
                    };
                }
                sources.push(edge_ee);
                destinations.push(edge_ee);
                if(!contains_edge(source, destinations)) {
                    // now look for the same domain for a different machine or at least a different eth
                    var app = find_destination_eth(lab, name, lab[m].name, lab[m].interfaces.if[e].eth.number);
                    try {
                        var edge_ip_d = get_network_from_ip_net(lab[app.n].interfaces.if[app.f].ip);
                        var destination = {
                            "type": "eth-eth",
                            "realtype": "",
                            "machine": lab[app.n].name,
                            "eth_number": lab[app.n].interfaces.if[app.f].eth.number,
                            "domain": name,
                            "edge_ip": edge_ip_d,
                            "ip": get_eth_ip_difference(edge_ip_d, lab[app.n].interfaces.if[app.f].ip),
                            "warnings": ""
                        };
                    }
                    catch (e) {
                        // no destination found
                        var destination = source;
                        destination.realtype = "internet";
                        destination.warnings += " internet?,";
                        source.warnings += " to internet?,";
                    }
                    if (destination.edge_ip != source.edge_ip) {
                        destination.warnings += " different subnet,";
                        source.warnings += " different subnet,";
                    }
                    // found a destination
                    if (app != null) {
                        sources.push(source);
                        destinations.push(destination);
                    }

                }
            }
        }
    }
    catch(e) {
        console.log(e);
        return [];
    }
    return destinations;
}

function generate_nodes(lab) {
    //each machine is a node. each machine of each eth is a node
    var nodes = [];
    try {
        //for each machine in the lab
        for (var m in lab) {
            var node = {
                "type": "node-machine",
                "machine": lab[m].name,
                "machine-type": lab[m].type,
                "warnings": ""
            };
            nodes.push(node);
            //for each interface of the machine
            for (var e in lab[m].interfaces.if) {
                var name = lab[m].interfaces.if[e].eth.domain;
                var edge_ip = get_network_from_ip_net(lab[m].interfaces.if[e].ip);
                var node = {
                    "type": "node-eth",
                    "machine": lab[m].name,
                    "eth_number": lab[m].interfaces.if[e].eth.number,
                    "domain": name,
                    "edge_ip": edge_ip,
                    "ip": get_eth_ip_difference(edge_ip, lab[m].interfaces.if[e].ip),
                    "warnings": ""
                };
                nodes.push(node);
            }
        }
        return nodes;
    }
    catch(e) {
        return [];
    }
}

// TODO
// now we can really populate nodes and edges for vis
/*

 nodes.push({id: 201, label: '192.168.0.201', group: 'desktop', value: 1});
 edges.push({from: 2, to: 201, length: LENGTH_SUB, color: GRAY, width: WIDTH_SCALE});

 */

function make_draw_data(nodes, edges) {
    //edges is basically only destinations


    // for each node in nodes I make a node, lol
    // and for each destination in destinations I make and edge
}