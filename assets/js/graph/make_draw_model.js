function ip_to_bin(ip) {
    let ipfields = ip.split(".")
    let binary = ""

    for (let key in ipfields) {
        if (ipfields[key] > 255) ipfields[key] = 255
        if (ipfields[key] < 0) ipfields[key] = 0

        let app = parseInt(ipfields[key]).toString(2)
        let pad = "00000000"
        app = pad.substring(0, pad.length - app.toString(2).length) + app.toString(2)
        binary = binary + "" + app.toString(2)
    }
    return binary
}

function network_from_binary_ip_mask(binary, netmask) {
    let network = ""
    for (let j = 0; j < 32; j++) {
        if (netmask[j] == '1') network += binary[j]
        else network += '0'
    }
    return network
}

function bin_to_ip(bin) {
    let ip = ""
    for (let i = 0; i < 32; i = i + 8) {
        let app = ""
        for (let k = 0; k < 8; k++)
            app += bin[i + k]
        ip += parseInt(app, 2) + ((i < 24) ? "." : "")
    }
    return ip
}

function binary_netmask_from_decimal(dec) {
    if (dec > 32) dec = 32
    let netmask = ""
    for (let j = 0; j < 32; j++) {
        netmask = netmask + ((j < dec) ? '1' : '0')
    }
    return netmask
}

function get_network_from_ip_net(ip_net) {
    if (!ip_net || ip_net == null) return ""
    let split = ip_net.split("/")
    let ip = split[0]
    let net = split[1]
    if (net > 32) net = 32
    if (net < 0) net = 0
    let binary = ip_to_bin(ip)
    let netmask = binary_netmask_from_decimal(net)
    let network = network_from_binary_ip_mask(binary, netmask)
    let network_ip = bin_to_ip(network)
    return network_ip + "/" + net
}

function find_destination_eth(lab, name, machine_name, eth_number) {
    for (let n in lab) {
        //for each interface of the machine
        for (let f in lab[n].interfaces.if) {
            if (lab[n].interfaces.if[f].eth.domain == name && (lab[n].name != machine_name ||
                (lab[n].name != machine_name && lab[n].interfaces.if[f].eth.number != eth_number))) {
                return { "n": n, "f": f }
            }
        }
    }
    return null
}

function get_eth_ip_difference(network, ip) {
    if (!network || network == null) return ""
    if (!ip || ip == null) return ""
    let net_split = network.split("/")[0]
    let ip_split = ip.split("/")[0]
    let net_split_i = net_split.split(".")
    let ip_split_i = ip_split.split(".")
    if (net_split_i.length != ip_split_i.length) return 0
    for (let i in net_split_i) {
        if (net_split_i[i] != ip_split_i[i]) {
            if (i == 3) return ip_split_i[i]
            if (i == 2) return ip_split_i[i] + "." + ip_split_i[i + 1]
            if (i == 1) return ip_split_i[i] + "." + ip_split_i[i + 1] + "." + ip_split_i[i + 2]
            if (i == 0) return ip_split
        }
    }
    return 0
}

function same_edge(obj1, obj2) {
    try {
        return (obj2.from == obj1.from && obj2.to == obj1.to)
    }
    catch (e) {
        return false
    }
}

function same_node(obj1, obj2) {
    try {
        return (obj2.id == obj1.id)
    }
    catch (e) {
        return false
    }
}

function contains_node(obj, list) {
    for (let i = 0; i < list.length; i++) {
        if (same_node(obj, list[i])) {
            return true
        }
    }
    return false
}

function contains_edge(obj, list) {
    for (let i = 0; i < list.length; i++) {
        if (same_edge(obj, list[i])) {
            return true
        }
    }
    return false
}

function generate_nodes_edges(lab) {
    let edges = []
    //each machine is a node. each eth of each machine is a node. each collision domain is a node. each ospf/rip/as is a sticknote, so a node also.
    //each ip on collision domain is a white note, so another node
    //all nodes have, somehow, to be a source and a destination
    let nodes = []
    try {
        for (let m in lab) {
            if (lab[m].name == "") continue
            //each machine is a node. beware of duplicates
            let id = 'machine-' + lab[m].name
            if (!contains_node({ id: id }, nodes)) {
                nodes.push({
                    id: id,
                    label: (lab[m].type == "other") ? lab[m].name + " (" + lab[m].other.image + ")" : lab[m].name,
                    group: lab[m].type
                })
            }
            if (lab[m].type == 'router') {
                if (lab[m].routing.rip.en) {
                    if (!contains_node({ id: 'label-rip-' + lab[m].name }, nodes)) {
                        nodes.push({
                            id: 'label-rip-' + lab[m].name,
                            label: 'RIP',
                            group: 'rip',
                            value: 2
                        })
                        let r_app_to = 'label-rip-' + lab[m].name
                        if (!contains_edge({ from: id, to: r_app_to }, edges))
                            edges.push({
                                from: id,
                                to: r_app_to,
                                length: LENGTH_CLOSE, width: WIDTH_SCALE / 100, dashes: true
                            })
                    }
                }
                if (lab[m].routing.ospf.en) {
                    if (!contains_node({ id: 'label-ospf-' + lab[m].name }, nodes)) {
                        nodes.push({
                            id: 'label-ospf-' + lab[m].name,
                            label: 'OSPF',
                            group: 'ospf',
                            value: 2
                        })
                        let r_app_to = 'label-ospf-' + lab[m].name
                        if (!contains_edge({ from: id, to: r_app_to }, edges))
                            edges.push({
                                from: id,
                                to: r_app_to,
                                length: LENGTH_CLOSE, width: WIDTH_SCALE / 100, dashes: true
                            })
                    }
                }
                if (lab[m].routing.bgp.en) {
                    if (!contains_node({ id: 'label-bgp-' + lab[m].name }, nodes)) {
                        nodes.push({
                            id: 'label-bgp-' + lab[m].name,
                            label: "AS " + lab[m].routing.bgp.as + "\n" + lab[m].routing.bgp.network,
                            group: 'bgp',
                            value: 2
                        })
                        let r_app_to = 'label-bgp-' + lab[m].name
                        if (!contains_edge({ from: id, to: r_app_to }, edges))
                            edges.push({
                                from: id,
                                to: r_app_to,
                                length: LENGTH_CLOSE, width: WIDTH_SCALE / 100, dashes: true
                            })
                    }
                }
            }
            //for each interface of the machine
            for (let interface of lab[m].interfaces.if) {
                let domain_name = interface.eth.domain
                if (!domain_name || domain_name == "") continue
                let if_name = "eth" + interface.eth.number
                let domain_ip = get_network_from_ip_net(interface.ip)
                if (!interface.ip || interface.ip == "") continue
                let if_ip = get_eth_ip_difference(domain_ip, interface.ip)
                // the domain is a new node. beware of duplicates.
                // domain should have a child node with the ip description
                // so edge for that and the eth
                let domain_id = 'domain-' + domain_name
                if (!contains_node({ id: domain_id }, nodes)) {
                    nodes.push({
                        id: domain_id,
                        label: domain_name,
                        group: 'domain',
                        value: 5
                    })
                    nodes.push({
                        id: "iplabel-" + domain_name + "-domain_ip",
                        label: domain_ip,
                        group: 'domain-ip',
                        value: 4
                    })
                    //connecting domain and its label
                    let app_to = "iplabel-" + domain_name + "-domain_ip"
                    if (!contains_edge({ from: domain_id, to: app_to }, edges)) {
                        edges.push({
                            from: domain_id,
                            to: app_to,
                            length: LENGTH_CLOSE, width: WIDTH_SCALE / 100, dashes: true
                        })
                    }
                }
                //each eth is a new node, linked to its domain and its machine. can't be duplicated
                nodes.push({
                    id: "eth-" + id + "-" + if_name + "-" + m,
                    label: if_ip + "\n" + if_name,  /*TODO: br and line?*/
                    group: 'eth',
                    value: 2
                })
                //eth to domain
                let app_to_eth = "eth-" + id + "-" + if_name + "-" + m
                if (!contains_edge({ from: domain_id, to: app_to_eth }, edges)) {
                    edges.push({
                        from: domain_id,
                        to: app_to_eth,
                        length: LENGTH_SERVER, width: WIDTH_SCALE
                    })
                }
                // eth to machine
                if (!contains_edge({ from: id, to: app_to_eth }, edges)) {
                    edges.push({
                        from: id,
                        to: app_to_eth,
                        length: LENGTH_CLOSE, width: WIDTH_SCALE
                    })
                }
            }
        }
        return { nodes: nodes, edges: edges }
    }
    catch (e) {
        console.log({ err: e })
        return { nodes: [], edges: [] }
    }
}

