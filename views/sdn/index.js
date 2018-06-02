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

function resetButtons(){
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    bottoni.item(0).style.display = null    // Bottone per muovere i nodi
    bottoni.item(2).style.display = 'none'  // Bottone per rilasciare i nodi
    bottoni.item(1).style.display = 'none'  // Bottone per selezionare il path
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

/* -------------------- LABEL MANAGING -------------------- */

function createNewLabel(){
    document.getElementsByClassName('sdnBehaviour').item(3).style.display = 'none'
    let row = d3.create('div')
    row.append('input')
        .attr('type', 'text')
        .attr('placeholder', 'color')
    row.append('input')
        .attr('type', 'text')
        .attr('placeholder', 'name')
    row.append('button')
        .text('Add')
        .on('click', function(){
            createNewDefinedLabel(row.nodes().pop())
        })
    row.append('button')
        .text('Ignore')
        .on('click', function(){
            row.remove()
            document.getElementsByClassName('sdnBehaviour').item(3).style.display = null
        })
    document.getElementById('details').appendChild(row.node())
}

function createNewDefinedLabel(rawElement){
    let details = document.getElementById('details')
    let [colorInputEl, nameInputEl] = rawElement.getElementsByTagName('input')
    if (colorInputEl.value && nameInputEl.value){
        let labelNode = document.createElement('p')
        let showDiv = document.createElement('div')
        let colorTag = document.createElement('div')
        let showButton = document.createElement('button')
        let editButton = document.createElement('button')
        
        colorTag.className = 'colorTag'
        colorTag.style.backgroundColor = colorInputEl.value

        showButton.innerText = "Show/Hide"
        showButton.addEventListener('click', function(){
            let prevStatus = showDiv.style.display
            showDiv.style.display = (prevStatus == 'block') ? 'none' : 'block'
            // TODO: magari evidenzia anche sul grafo il path che segue
        })

        editButton.innerText = "Edit"
        editButton.addEventListener('click', setActiveStatus)

        function setActiveStatus(){
            details.querySelectorAll('#details div p button.btn-success')
                .forEach(el => setDisabledStatus.bind(el)())

            this.classList.add('btn-success')
            this.innerText = 'EDITING'
            showDiv.style.display = 'block'

            pathOutputDiv = this.parentElement.nextElementSibling

            enablePathSelection()
            let newThis = this.cloneNode(true)
            newThis.addEventListener('click', setDisabledStatus)
            this.parentNode.replaceChild(newThis, this)
        }

        function setDisabledStatus(){
            this.classList.remove('btn-success')
            this.innerText = 'Edit'
            
            pathOutputDiv = null

            disableBehaviours()
            let newThis = this.cloneNode(true)
            newThis.addEventListener('click', setActiveStatus)
            this.parentNode.replaceChild(newThis, this)
        }

        showDiv.className = 'label-details'
        showDiv.appendChild(createTable('device', 'match', 'action', 'priority'))

        labelNode.appendChild(colorTag)
        labelNode.appendChild(document.createTextNode(nameInputEl.value.trim()))
        labelNode.appendChild(editButton)
        labelNode.appendChild(showButton)
        
        rawElement.innerHTML = ""
        rawElement.append(labelNode)
        rawElement.append(showDiv)
        
        details.appendChild(document.createElement('hr'))
        document.getElementsByClassName('sdnBehaviour').item(3).style.display = null
    }
}

function createTable(...headers){
    let table = document.createElement('table')
    let head = table.createTHead()
    for(let header of headers){
        head.appendChild(document.createElement('th')
        ).innerText = header
    }
    table.createTBody()
    return table
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

    linksGroup.append('title').text(function (d) { return "eth" + d.porta })

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

    /* ---------------------- NODE ---------------------- */

    nodesGroup.on('click', function (d) {
        if (d.type == "switch" && !pathOutputDiv) {
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
        if (d.source.type == "switch" && !pathOutputDiv) {
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

/* --------------------------------------------------------- */
/* -------------------- GRAPH BEHAVIOUR -------------------- */
/* --------------------------------------------------------- */

function disableBehaviours(){
    d3.selectAll('g.nodes circle').call(d3.drag())
}

/* -------------------- MOVING -------------------- */

function enableMovingNodes() {
    document.getElementsByClassName('sdnBehaviour').item(0)
        .style.display = 'none'
    document.getElementsByClassName('sdnBehaviour').item(1)
        .style.display = null
    document.getElementsByClassName('sdnBehaviour').item(2)
        .style.display = null

    d3.selectAll('g.nodes circle').call(  // chiama la funzione passata per parametro esattamente una volta sola
        d3.drag().on('start', function (d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart()
        }).on("drag", function (d) {
            d.fx = d3.event.x
            d.fy = d3.event.y
        })
    )
}

function releaseNodes(){
    document.getElementsByClassName('sdnBehaviour').item(2)
        .style.display = 'none'
    d3.selectAll('g.nodes circle').attr('', function(d){ d.fx = null; d.fy = null})
}

/* -------------------- SELECTING -------------------- */

let newPath = new Set()

function enablePathSelection() {
    document.getElementsByClassName('sdnBehaviour').item(0)
        .style.display = null
    document.getElementsByClassName('sdnBehaviour').item(1)
        .style.display = 'none'

    disableBehaviours()

    if(pathOutputDiv){
        let machineLocked = true
        let networksLocked = true

        let linkLock = 0
        let lastSelection = null

        d3.selectAll("circle.network").call(
            d3.drag().on("start", function (d, i, data) {
                    data[i].classList.add('selected')
                    linkLock = 1
                    lastSelection = d.id
                    togglePathButtons(false)
                })
                .on("end", function () {
                    if(linkLock == 1 && newPath.size > 0) togglePathButtons(true)
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
    }
}

let pendingStep = null

function appendPathStep(options){   // options è: {device, ingressPort || egressPort }. Ogni campo è string||number
    if(!pendingStep){
        pendingStep = options
    } else {
        if(pendingStep.device != options.device) throw new Error("Path non conforme. Forse uno step precedente è rimasto in memoria")
        let step = {
            device: options.device,
            ingressPort: pendingStep.ingressPort,
            egressPort: options.egressPort
        }
        pendingStep = null
        newPath.add(step)
    }
}

let pathOutputDiv = null

function applyPath() {
    let thisLabelData = {
        devices: new Set(),
        rules: []
    }
    let tableBody = pathOutputDiv.getElementsByTagName('tbody').item(0)
    for(let step of newPath){
        let rule = document.createElement('tr')
        let device = rule.appendChild(document.createElement('td'))
        let match = rule.appendChild(document.createElement('td'))
        let action = rule.appendChild(document.createElement('td'))
        let priority = rule.appendChild(document.createElement('td'))

        device.innerText = step.device
        match.innerText = "ingressPort eth" + step.ingressPort
        action.innerText = "egressPort eth" + step.egressPort
        // let pInput = priority.appendChild(document.createElement('input'))
        // pInput.setAttribute('type', 'number')

        tableBody.appendChild(rule)
    }
    togglePathButtons(false)
    discardPath()
}

function discardPath(){
    newPath = new Set()
    pendingStep = null
    for(let el of document.querySelectorAll('svg .selected')){
        el.classList.remove('selected')
    }
    togglePathButtons(false)
}



/* */

// function assignImage(d) {
//     switch (d.type){
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
//             console.error("tipo " + d.type + " non riconosciuto")
//     }
// }