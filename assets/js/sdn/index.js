let d3 = require('d3')

/* ------------------------------------------------------------------------ */
/* --------------------------- WINDOW BEHAVIOUR --------------------------- */
/* ------------------------------------------------------------------------ */

function loadSDNPage() {
    let remote = require('electron').remote
    let thisWin = remote.getCurrentWindow()
    let disclaimer = document.getElementById("sdnDisclaimer")

    thisWin.on('resize', function () {
        if (thisWin.getBounds().height < 850 || thisWin.getBounds().width < 1200) {
            disclaimer.classList.remove('hidden')
        } else {
            disclaimer.classList.add('hidden')
        }
    })

    thisWin.emit('resize')
}

function getData(config) {
    let data = {
        nodes: [], links: []
    }

    let controllerFound = false

    config = JSON.parse(config)
    for (let macchina of config[0].netkit) {
        let nome = macchina.name
        let tipo = macchina.type
        
        if(tipo == "controller") controllerFound = true
        data.nodes.push({ id: nome, type: tipo })
        for (let interfaccia of macchina.interfaces.if) {
            data.links.push({ source: { id: nome, eth: interfaccia.eth.number }, target: { id: interfaccia.eth.domain } })
        }
    }

    if(!controllerFound) console.log("Warning: controller not found!") // TODO (sistemare)
    startSimulation(data)
}

/* --------------------------------------------------------------------- */
/* --------------------------- D3 SIMULATION --------------------------- */
/* --------------------------------------------------------------------- */

let svg = d3.select("#mainSVG")
let width = +svg.attr('width')
let height = +svg.attr('height')

let svg2 = d3.select("#secondarySVG")
let width2 = +svg2.attr('width')
let height2 = +svg2.attr('height')

function startSimulation(data) {
    svg.html("")
    svg2.html("")

    /* ------------------------- NODES ------------------------- */

    // v-- Dati originali: {id, type}
    let nodes = data.nodes
    let nodesGroup = svg.append('g')
        .attr('class', 'terminal')
        .selectAll('circle')
        .data(nodes)
        .enter()
            .append('circle')
            .attr('class', function (d) { return d.type })

    // v-- Nuovo array (da data.links): {source, target}
    let links = data.links.map(function (link) { return { source: link.source.id, target: link.target.id } })
    let linksGroup = svg.append('g')
        .attr('class', 'link')
        .selectAll('line')
        .data(links)
        .enter()
            .append('line')

    // v-- Nuovo array (da links, a sua volta da data.links): {id, type}
    let networks = Array.from(new Set(links.map(link => link.target)))
        .map(function (id) { return { id: id, type: "network" } })
    let networksGroup = svg.append('g')
        .attr('class', 'network')
        .selectAll('circle')
        .data(networks)
        .enter()
            .append('circle')

    networksGroup
        .append("title")
        .text(function (d) { return d.id })

    nodesGroup
        .append("title")
        .text(function (d) { return d.id })

    /* ---------------------- SIMULATION ---------------------- */

    let allNodes = nodes.concat(networks).concat(links) // {id, type}

    let simulation = d3.forceSimulation(allNodes)   // <-- Da ora ogni nodo ha in più: index, x, y, vx, vy
        .force("link", d3.forceLink(links).id(function (d) { return d.id }))
        // ^-- specificando id posso riferirmi ai nodi attraverso il loro campo 'id' piuttosto che al loro indice nell'array dei nodi
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))

    simulation.force("link")
        .distance(function (d, i, data) {
            if (d.source.id == "controller") return 200
            return 500 / data.length
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

        networksGroup
            .attr("cx", function (d) { return d.x })
            .attr("cy", function (d) { return d.y })
    })

    linksGroup.attr('class', function (d) { return d.source.type })

    /* --------------------------------------------------- */
    /* --------------------- DETAILS --------------------- */
    /* --------------------------------------------------- */

    /* ---------------------- NODE ---------------------- */

    nodesGroup.on('click', function(d){
        svg2.html("")

        function drawLines(num, cx, cy, radius = 150){
            let lines = svg2.append('g')
            let arcDegree = 2*Math.PI/num
            for(let i = 0; i < num; i++){
                // v-- Qui se sostituisco radius con cx, cy viene una stella che riempie lo spazio (male però)
                let x2 = cx + radius*Math.cos(arcDegree*i)
                let y2 = cy + radius*Math.sin(arcDegree*i)
                
                lines.append('line')
                .attr('x1', cx).attr('y1', cy)
                .attr('x2', x2).attr('y2', y2)
                .attr('class', 'axis')
            }
        }

        let [middleX, middleY] = [width/2, height2/2]
        let radius = Math.max(middleX, middleY)/2
        let cx = middleX > middleY ? middleX/2 : middleX
        let cy = middleY > middleX ? middleY/2 : middleY

        // v-- Se non voglio che il radar prenda solo la metà di sopra, basta mettere radius al posto di cx, cy
        drawLines(10, cx, cy, radius)
    })

    /* -------------------- LINKS -------------------- */

    linksGroup.on('click', function(d){
        svg2.html("")

        function drawAxis(num, top, right, bottom, left){
            let plot = svg2.append('g')
            let horizontalSpaceBetween = (top + bottom)/(num + 2)
            for(let i = 0; i < num; i++){
                let height = horizontalSpaceBetween*(i+1)
                plot.append('line')
                    .attr('x1', left).attr('y1', height)
                    .attr('x2', right).attr('y2', height)
                    .attr('class', 'axis')
            }
        }

        drawAxis(10, 0, width2, (height2/2), 0)
    })

    /* -------------------- PATH SELECTION -------------------- */
    
    let selectedNodesIndexes = new Set()
    let selectedArcsIndexes = new Set()
    let locked = true

    nodesGroup.call(
        d3.drag()
        .on("start", function(d, i){
            locked = false
            selectedNodesIndexes.add(i)
        })
        .on("end", function(){
            locked = true
            selectedNodesIndexes = new Set()
            selectedArcsIndexes = new Set()
        }))

    nodesGroup.on('mouseover', function(d, i, data){
        if(!locked) selectedNodesIndexes.add(i)
        for(let index of selectedNodesIndexes){
            data[index].classList.add('selected')
        }
    })

    linksGroup.on('mouseover', function(d, i, data){
        if(!locked) selectedArcsIndexes.add(i)
        for(let index of selectedArcsIndexes){
            data[index].classList.add('selected')
        }
    })
}