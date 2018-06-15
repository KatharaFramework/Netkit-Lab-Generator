/* ------------------------- PREPARE RAW DATA ------------------------- */

function loadSDN(config) {
    config = JSON.parse(config)[0]
    let data = { nodes: [], links: [] }
    let networks = new Set()

    for (let macchina of config.netkit) {
        let node = { id: macchina.name, type: macchina.type }
        data.nodes.push(node)   // Creo i nodi delle macchine

        macchina.interfaces.if.forEach(function (interfaccia) {
            let nomeDominio = interfaccia.eth.domain
            networks.add(nomeDominio)
            data.links.push({ source: node, target: nomeDominio, porta: interfaccia.eth.number })    // Creo i link macchina-dominio
        })
    }

    networks.forEach(domainName => data.nodes.push({ id: domainName, type: "network" }))   // Creo i nodi delle reti
    findEdgeNetworks(data)

    cleanSVGs()
    resetButtons()
    document.getElementById('details').innerHTML = ""
    closeDetailsAndClean(3)

    sdnData = new SDNData() // TODO: Aprire un alert per chiedere conferma?
    startSimulation(data)
}

function findEdgeNetworks(data) {
    data.nodes.forEach(function (node) {
        if (node.type == "network") {
            let isInternal = false
            let isExternal = false
            let isController = false
            for (let link of data.links) {
                if (link.target == node.id) {
                    if (link.source.type == 'switch') isInternal = true
                    else if (link.source.type == 'controller') isController = true
                    else if (link.source.type != 'switch') isExternal = true
                }

                if (isInternal && isExternal) {
                    node.type += ' edge'
                    break
                }
            }
            if (isInternal && isController) node.type += ' control'
            if (!isInternal) node.type += ' external'
        }
    })
}

function startSimulation(data) {
    let svg = d3.select("#sdnGraph")

    /* --------------------- PREPARE LINKS --------------------- */

    let linksGroup = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .enter().append('line')

    linksGroup.append('title').text(function (d) { return "eth" + d.porta })

    /* --------------------- PREPARE NODES --------------------- */

    let nodesGroup = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(data.nodes)
        .enter().append('circle')
        .attr('class', function (d) { return d.type })
    // .attr("xlink:href", assignImage)

    nodesGroup.append("title").text(function (d) { return d.id })

    /* ------------------- CREATE SIMULATION ------------------- */

    let simulation = d3.forceSimulation(data.nodes) // <-- Da ora ogni nodo ha in più: index, x, y, vx, vy
        .force("link", d3.forceLink(data.links)
            .id(function (d) { return d.id }))      // <-- specificando id posso riferirmi ai nodi attraverso il loro campo 'id' piuttosto che al loro indice nell'array dei nodi
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(+svg.attr('width') / 2, +svg.attr('height') / 2))

    simulation.force("link")
        .distance(function (d) {
            switch (d.source.type) {
                case "controller": return 200
                case "switch": return 60
                default: return 40
            }
        })

    simulation.force("charge")
        .strength(-100)

    simulation.on('tick', function () {
        linksGroup
            .attr("x1", function (d) { return d.source.x })
            .attr("y1", function (d) { return d.source.y })
            .attr("x2", function (d) { return d.target.x })
            .attr("y2", function (d) { return d.target.y })

        nodesGroup
            .attr("cx", function (d) { return d.x })
            .attr("cy", function (d) { return d.y })
    })

    sdnData.setSimulation(simulation)

    linksGroup.attr('class', function (d) { return d.target.type + " " + d.source.type }) // <-- Solo dopo aver creato la simulazione ogni link è collegato ai suoi nodi

    d3.selectAll('g.nodes circle.switch').on('click', showSwitchDetails)
}

function toggleExternalVisibility(thisButton){
    let externalNodes = d3.selectAll('g.nodes circle.external, g.nodes circle:not(.switch):not(.network):not(.controller)')
    let externalLinks = d3.selectAll('g.links line.external')
    if(thisButton.stato){
        externalNodes.attr('hidden', null)
        externalLinks.attr('hidden', null)
        thisButton.innerText = 'Hide external network'
        thisButton.stato = false
    } else {
        externalNodes.attr('hidden', '')
        externalLinks.attr('hidden', '')
        thisButton.innerText = 'Show external network'
        thisButton.stato = true
    }

}