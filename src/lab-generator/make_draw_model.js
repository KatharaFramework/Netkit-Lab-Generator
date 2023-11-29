function ip_to_bin(ip) {
	let binary = "";
	for (let octet of ip.split(".")) {
		if (octet > 255) octet = 255;
		if (octet < 0) octet = 0;

		let app = parseInt(octet).toString(2);
		let pad = "00000000";
		app = pad.substring(0, pad.length - app.toString(2).length) + app.toString(2);
		binary += "" + app.toString(2);
	}
	return binary;
}

function network_from_binary_ip_mask(binary, netmask) {
	let network = "";
	for (let j = 0; j < 32; j++) {
		network += (netmask[j] == "1") ? binary[j] : "0";
	}
	return network;
}

function bin_to_ip(bin) {
	let ip = "";
	for (let i = 0; i < 32; i = i + 8) {
		let app = "";
		for (let k = 0; k < 8; k++)
			app += bin[i + k];
		ip += parseInt(app, 2) + ((i < 24) ? "." : "");
	}
	return ip;
}

function binary_netmask_from_decimal(dec) {
	let netmask = "";
	if (dec > 32) dec = 32;
	for (let j = 0; j < 32; j++) {
		netmask += ((j < dec) ? "1" : "0");
	}
	return netmask;
}

function get_network_from_ip_net(ip_net) {
	let [ip, net] = ip_net.split("/");
	if (net > 32) net = 32;
	if (net < 0) net = 0;
	let binary = ip_to_bin(ip);
	let netmask = binary_netmask_from_decimal(net);
	let network = network_from_binary_ip_mask(binary, netmask);
	let network_ip = bin_to_ip(network);
	return network_ip + "/" + net;
}

function find_destination_eth(lab, name, machine_name, eth_number) {
	for (let machineIndex in lab) {
		for (let interfaceIndex in lab[machineIndex].interfaces.if) {
			if (lab[machineIndex].interfaces.if[interfaceIndex].eth.domain == name && (lab[machineIndex].name != machine_name ||
				(lab[machineIndex].name != machine_name && lab[machineIndex].interfaces.if[interfaceIndex].eth.number != eth_number))) {
				return { "n": machineIndex, "f": interfaceIndex };
			}
		}
	}
	return null;
}

function get_eth_ip_difference(network, ip) {
	let net_split = network.split("/")[0];
	let ip_split = ip.split("/")[0];
	let net_split_i = net_split.split(".");
	let ip_split_i = ip_split.split(".");
	if (net_split_i.length != ip_split_i.length) return 0;
	for (let i in net_split_i) {
		if (net_split_i[i] != ip_split_i[i]) {
			if (i == 3) return ip_split_i[3];
			if (i == 2) return ip_split_i[2] + "." + ip_split_i[3];
			if (i == 1) return ip_split_i[1] + "." + ip_split_i[2] + "." + ip_split_i[3];
			if (i == 0) return ip_split;
		}
	}
	return 0;
}

function containsNodeWithID(id, list) {
	return list.some(el => el && el.id == id);
}

function containsEdge(from, to, list) {
	return list.some(el => el && el.from && el.from == from && el.to && el.to == to);
}

// ----- All nodes have, somehow, to be a source and a destination ------
// ----------------------------------------------------------------------
// NODES: each machine; each eth of each machine; each collision domain; 
// each ospf/rip/as is a sticknote, so it's a node too;
// each ip on collision domain is a white note, so it's another node.
function generate_nodes_edges(lab) {
	let nodes = [];
	let edges = [];

	let ifNameAt = document.getElementById("ifNameAt");
	let ifOspfCost = document.getElementById("ifOspfCost");
 	let routingLabel = document.getElementById("routingLabel");

	let pendingDomainNodes = [];

	for (let m in lab) {
		let machine = lab[m];
		if (machine.name == "") continue;
		//each machine is a node. beware of duplicates
		let id = "machine-" + machine.name;
		if (!containsNodeWithID(id, nodes)) {
			nodes.push({
				id: id,
				label: (machine.type == "other") ? machine.name + " (" + machine.other.image + ")" : machine.name,
				group: machine.type
			});
		}

		if (machine.type == "router") {
			if (machine.routing.rip.en) {
				if (!containsNodeWithID("label-rip-" + machine.name, nodes) && routingLabel.checked) {
					nodes.push({
						id: "label-rip-" + machine.name,
						label: "RIP",
						group: "rip",
						value: 2
					});
					let r_app_to = "label-rip-" + machine.name;
					if (!containsEdge(id, r_app_to, edges))
						edges.push({
							from: id,
							to: r_app_to,
							length: LENGTH_CLOSE, width: WIDTH_SCALE / 100, dashes: true
						});
				}
			}
			if (machine.routing.ospf.en) {
				if (!containsNodeWithID("label-ospf-" + machine.name, nodes) && routingLabel.checked) {
					nodes.push({
						id: "label-ospf-" + machine.name,
						label: "OSPF",
						group: "ospf",
						value: 2
					});
					let r_app_to = "label-ospf-" + machine.name;
					if (!containsEdge(id, r_app_to, edges))
						edges.push({
							from: id,
							to: r_app_to,
							length: LENGTH_CLOSE, width: WIDTH_SCALE / 100, dashes: true
						});
				}
			}
			if (machine.routing.bgp.en) {
				if (!containsNodeWithID("label-bgp-" + machine.name, nodes) && routingLabel.checked) {
					nodes.push({
						id: "label-bgp-" + machine.name,
						label: "AS " + machine.routing.bgp.as + "\n" + machine.routing.bgp.network,
						group: "bgp",
						value: 2
					});
					let r_app_to = "label-bgp-" + machine.name;
					if (!containsEdge(id, r_app_to, edges))
						edges.push({
							from: id,
							to: r_app_to,
							length: LENGTH_CLOSE, width: WIDTH_SCALE / 100, dashes: true
						});
				}
			}
		}
		//for each interface of the machine
		for (let interface of machine.interfaces.if) {
			let domain_name = interface.eth.domain;
			if (!domain_name || domain_name == "") continue;

			let if_name = (ifNameAt.checked ? "@" : "eth") + interface.eth.number;
			let domain_id = "domain-" + domain_name;
			let app_to = "iplabel-" + domain_name + "-domain_ip";
			let domain_ip, if_ip;
			if(interface.ip){
				domain_ip = get_network_from_ip_net(interface.ip);
				if_ip = get_eth_ip_difference(domain_ip, interface.ip);
			}
      
			let ifCost = "";
			if (machine.type == "router") {
				if (machine.routing.ospf.en && ifOspfCost.checked) {
					let cost = machine.routing.ospf.if.filter(ifn => ifn.interface == interface.eth.number)[0];
					ifCost = cost ? cost.cost : "";
				}
			}

			// the domain is a new node. beware of duplicates.
			// domain should have a child node with the ip description
			// so edge for that and the eth
			if (!containsNodeWithID(domain_id, nodes)) {
				let domainNode = {
					id: domain_id,
					label: domain_name,
					group: "domain",
					value: 5
				};
				if(machine.type == "switch") pendingDomainNodes.push(domainNode);
				else nodes.push(domainNode);

				if(interface.ip){
					nodes.push({
						id: "iplabel-" + domain_name + "-domain_ip",
						label: domain_ip,
						group: "domain-ip",
						value: 4
					});
					//connecting domain and its label
					if (!containsEdge(domain_id, app_to, edges)) {
						edges.push({
							from: domain_id,
							to: app_to,
							length: LENGTH_CLOSE, width: WIDTH_SCALE / 100, dashes: true
						});
					}
				}
			}
			//each eth is a new node, linked to its domain and its machine. can't be duplicated
			let ifLabel = if_ip ? if_ip + (ifNameAt.checked ? "" : "\n") + if_name : if_name;

			if (ifCost) {
				ifLabel += "\nCost: " + ifCost;
			}

      		nodes.push({
				id: "eth-" + id + "-" + if_name + "-" + m,
				label: ifLabel,
				group: "eth",
				value: 2
			});
			//eth to domain
			let app_to_eth = "eth-" + id + "-" + if_name + "-" + m;
			if (!containsEdge(domain_id, app_to_eth, edges)) {
				edges.push({
					from: domain_id,
					to: app_to_eth,
					length: LENGTH_SERVER, width: WIDTH_SCALE
				});
			}
			// eth to machine
			if (!containsEdge(id, app_to_eth, edges)) {
				edges.push({
					from: id,
					to: app_to_eth,
					length: LENGTH_CLOSE, width: WIDTH_SCALE
				});
			}
		}
	}

	pendingDomainNodes.forEach(domainNode => { if(!containsNodeWithID(domainNode.id, nodes)) nodes.push(domainNode);});

	return { nodes, edges };
}

function makeGraph(netkit) {
	var graph = generate_nodes_edges(netkit);
	draw(graph.nodes, graph.edges);
}
