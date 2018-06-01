let d3 = require('d3')

/* ------------------------------------------------------------------------ */
/* --------------------------- WINDOW BEHAVIOUR --------------------------- */
/* ------------------------------------------------------------------------ */

function closeDetails() {
    document.getElementById('details').style.display = 'inline-block'
    document.getElementById('secondarySVG').style.display = 'none'
}

function openDetails() {
    svg2.html("")
    svg2.append('text')
        .text('X').attr('fill', 'red')
        .attr('x', width2 - 10).attr('y', 10)
        .style('cursor', 'pointer')
        .on('click', closeDetails)

    document.getElementById('details').style.display = 'none'
    document.getElementById('secondarySVG').style.display = 'inline-block'
}

function createNewLabel(name, color, path, whiteText = false){
    let details = document.getElementById('details')
    let labelNode = document.createElement('p')
    let colorTag = '<div class="colorTag" style="background-color:' + color + '"></div> '
    labelNode.innerHTML = colorTag + name
    labelNode.innerHTML += ' <button>Select</button>'
    details.appendChild(labelNode)
    details.appendChild(document.createElement('hr'))
}

/* --------------------------------------------------------------------- */
/* --------------------------- D3 SIMULATION --------------------------- */
/* --------------------------------------------------------------------- */

/* ------------------------- PREPARE RAW DATA ------------------------- */

let labels = []

function loadSDN(config) {
    config = JSON.parse(config)

    let data = { nodes: [], links: [] }

    let networks = new Set()
    for (let macchina of config[0].netkit) {
        let id = macchina.name
        let type = macchina.type
        macchina.interfaces.if.forEach(function (interfaccia) {
            let nomeDominio = interfaccia.eth.domain
            networks.add(nomeDominio)
            data.links.push({ source: id, target: nomeDominio, porta: interfaccia.eth.number })    // Creo i link macchina-dominio
        })

        data.nodes.push({ id, type })   // Creo i nodi delle macchine
    }

    networks.forEach(domainName => data.nodes.push({ id: domainName, type: "network" }))   // Creo i nodi delle reti

    startSimulation(data) 
    resetButtons()
}

function resetButtons(){
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    bottoni.item(0).style.display = null    // Bottone per muovere i nodi
    bottoni.item(1).style.display = 'none'  // Bottone per rilasciare i nodi
    bottoni.item(2).style.display = 'none'  // Bottone per selezionare il path
    bottoni.item(3).style.display = null    // Bottone per aggiungere etichette
    togglePathButtons(false)
}

function togglePathButtons(display){
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    if(display){
        bottoni.item(4).style.display = null  // Bottone per confermare un path
        bottoni.item(5).style.display = null  // Bottone per annullare un path
    } else {
        bottoni.item(4).style.display = 'none'
        bottoni.item(5).style.display = 'none'
    }
}

let svg = d3.select("#mainSVG")
let width = +svg.attr('width')
let height = +svg.attr('height')

let svg2 = d3.select("#secondarySVG")
let width2 = +svg2.attr('width')
let height2 = +svg2.attr('height')

let simulation

function startSimulation(data) {
    svg.html("")
    svg2.html("")

    /* --------------------- PREPARE LINKS --------------------- */

    let linksGroup = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .enter()
        .append('line')

    linksGroup.append('title').text(function (d) { return d.porta })

    /* --------------------- PREPARE NODES --------------------- */

    let nodesGroup = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(data.nodes)
        .enter()
        .append('circle')
        .attr('class', function (d) { return d.type })
    // .attr("xlink:href", assignImage)

    nodesGroup.append("title").text(function (d) { return d.id })

    /* ------------------- CREATE SIMULATION ------------------- */

    simulation = d3.forceSimulation(data.nodes)                               // <-- Da ora ogni nodo ha in più: index, x, y, vx, vy
        .force("link", d3.forceLink(data.links)
            .id(function (d) { return d.id }))    // <-- specificando id posso riferirmi ai nodi attraverso il loro campo 'id' piuttosto che al loro indice nell'array dei nodi
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))

    simulation.force("link")
        .distance(function (d, i, data) {
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

    linksGroup.attr('class', function (d) { return d.source.type }) // <-- Solo dopo aver creato la simulazione ogni link è collegato ai suoi nodi

    /* --------------------------------------------------- */
    /* --------------------- DETAILS --------------------- */
    /* --------------------------------------------------- */

    enablePathSelection()

    /* ---------------------- NODE ---------------------- */

    nodesGroup.on('click', function (d) {
        if (d.type == "switch") {
            let [middleX, middleY] = [width2 / 2, height2 / 2]
            let radius = Math.max(middleX, middleY) / 2
            let cx = middleX > middleY ? middleX / 2 : middleX
            let cy = middleY > middleX ? middleY / 2 : middleY

            openDetails()
            drawLines(10, cx, cy, radius)
        }
    })

    /* -------------------- LINKS -------------------- */

    linksGroup.on('click', function (d) {
        if (d.source.type == "switch") {
            openDetails()
            drawRadialAxis(10, 0, width2, (height2 / 2), 0)
        }
    })
}

function drawLines(num, cx, cy, radius = 150) {
    let lines = svg2.append('g')
    let arcDegree = 2 * Math.PI / num
    for (let i = 0; i < num; i++) {
        // v-- Qui se sostituisco radius con cx, cy viene una stella che riempie lo spazio (male però)
        let x2 = cx + radius * Math.cos(arcDegree * i)
        let y2 = cy + radius * Math.sin(arcDegree * i)

        lines.append('line')
            .attr('x1', cx).attr('y1', cy)
            .attr('x2', x2).attr('y2', y2)
            .attr('class', 'axis')
    }
}

function drawRadialAxis(num, top, right, bottom, left) {
    let plot = svg2.append('g')
    let horizontalSpaceBetween = (top + bottom) / (num + 2)
    for (let i = 0; i < num; i++) {
        let height = horizontalSpaceBetween * (i + 1)
        plot.append('line')
            .attr('x1', left).attr('y1', height)
            .attr('x2', right).attr('y2', height)
            .attr('class', 'axis')
    }
}

/* -------------------------------------------------------- */
/* -------------------- PATH SELECTION -------------------- */
/* -------------------------------------------------------- */

function enableMovingNodes() {
    document.getElementsByClassName('sdnBehaviour').item(0)
        .style.display = 'none'
    document.getElementsByClassName('sdnBehaviour').item(2)
        .style.display = null

    d3.selectAll('g.nodes circle').call(  // chiama la funzione passata per parametro esattamente una volta sola
        d3.drag().on('start', function (d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
        }).on("drag", function (d) {
            d.fx = d3.event.x
            d.fy = d3.event.y
        })
    )
}

let newPath = new Set() 

function enablePathSelection() {
    let machineLocked = true
    let networksLocked = true

    let linkLock = 0
    let lastSelection = null

    document.getElementsByClassName('sdnBehaviour').item(0)
        .style.display = null
    document.getElementsByClassName('sdnBehaviour').item(2)
        .style.display = 'none'

    d3.selectAll('g.nodes circle').call(d3.drag())     // Rimuovo il precedente comportamento al drag

    d3.selectAll("circle.network").call(
        d3.drag().on("start", function (d, i, data) {
                data[i].classList.add('selected')
                linkLock = 1
                lastSelection = d.id
                togglePathButtons(false)
            })
            .on("end", function () {
                if(linkLock == 1 && newPath.size > 1) togglePathButtons(true)
                else discardPath()
                lockAll()
            }))

    d3.selectAll('circle.network')  // Link lock è 0
        .on('mouseover', function(d, i, data){
            if(!networksLocked && d.id == lastSelection){
                linkLock++
                networksLocked = true

                data[i].classList.add('selected')
            }
        })

    d3.selectAll('line.switch')
        .on('mouseover', function (d, i, data) {
            if(linkLock == 1 && d.target.id == lastSelection){
                linkLock++
                machineLocked = false

                lastSelection = d.source.id
                data[i].classList.add('selected') // Seleziona una rete. La prossima sarà una macchina
                appendPathStep({device: d.source.id, ingressPort: d.porta})
            } else if(linkLock == 3 && d.source.id == lastSelection){
                linkLock = 0
                networksLocked = false

                lastSelection = d.target.id
                data[i].classList.add('selected') // Seleziona una macchina. La prossima sarà una rete
                appendPathStep({device: d.source.id, egressPort: d.porta})
            }
        })

    d3.selectAll('circle.switch')   // linkLock è 2
        .on('mouseover', function(d, i, data){
            if(!machineLocked && d.id == lastSelection){
                linkLock++
                machineLocked = true

                data[i].classList.add('selected')
            }
        })

    function lockAll(){
        machineLocked = true
        networksLocked = true
        linkLock = 0
    }

    function appendPathStep(options){   // options è: {device, ingressPort || egressPort }. Ogni campo è string||number
        let step = {device: options.device}
        if(options.hasOwnProperty('ingressPort')) step.ingressPort = options.ingressPort
        else step.egressPort = options.egressPort
        newPath.add(step)
    }
}

function discardPath(){
    newPath = new Set()
    for(let el of document.querySelectorAll('svg .selected')){
        el.classList.remove('selected')
    }
    togglePathButtons(false)
}

function applyPath() {
    for(let step of newPath)
        console.log(step)
    togglePathButtons(false)
    discardPath()
}



/* */

// function assignImage(datum) {
//     switch (datum.type){
//         case "terminal":
//             return "assets/images/terminal.png"
//         case "ns":
//             return "assets/images/nameserver.png"
//         case "router":
//             return "assets/images/router.png"
//         case "ws":
//             return "assets/images/webserver.png"
//         case "controller":
//             return "assets/images/other.png"     // TODO: sostituire
//         case "switch":
//             return "assets/images/other.png"     // TODO: sostituire
//         default:
//             console.error("tipo " + datum.type + " non riconosciuto")
//     }
// }