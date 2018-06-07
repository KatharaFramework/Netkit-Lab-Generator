/* --------------------- CLICKING --------------------- */

function showSwitchDetails (d) {
    if(pathOutputDiv) setAllEditButtonsDisabled()
    let nodeLabelsData = getLabelsInfo().find(el => el.id == d.id)
    if(!nodeLabelsData){
        let { disclaimer } = openDetails()
        disclaimer.style.display = null
        disclaimer.innerText = 'Nessuna regola installata sullo switch ' + d.id
    } else {
        let { svg, packetLabellingDiv, labelForwardingDiv } = openDetails()
        fillRulesSVG(undefined/* TODO */, svg)
        showLabellingPacketsRules(packetLabellingDiv)
        showMovingLabelRules(nodeLabelsData.rules, labelForwardingDiv)
    }
}

function fillRulesSVG(data, svg){
    svg.style.display = null
    // if(svg.innerHTML == ""){
    //     svg.style.display = 'none'
    // } else svg.style.display = null
}

function showLabellingPacketsRules(reservedSpace){
    reservedSpace.style.display = null
    let addButton = reservedSpace.firstElementChild.nextElementSibling
    addButton.removeEventListener('click', createLabellingRule)
    addButton.addEventListener('click', createLabellingRule)
}

function createLabellingRule(){
    console.log('Clicked on me! ', this)
    // TODO
}

function showMovingLabelRules(data, reservedSpace){
    reservedSpace.style.display = null
    let counter = 1
    let rulesTableBody = reservedSpace.getElementsByTagName('tbody').item(0)

    for(let labelRule of data){
        /* -------- CREATE A ROW -------- */
        let ruleRow = rulesTableBody.appendChild(document.createElement('tr'))

        ruleRow.appendChild(document.createElement('td')).appendChild(document.createTextNode(counter++))
        let match = ruleRow.appendChild(document.createElement('td'))
        let action = ruleRow.appendChild(document.createElement('td'))
        let priority = ruleRow.appendChild(document.createElement('td'))
        let stats = ruleRow.appendChild(document.createElement('td'))

        /* ------- 'Match' column ------- */
        let label = match.appendChild(document.createElement('p'))
        let labelColor = label.appendChild(document.createElement('span'))
        labelColor.className = 'colorTag'
        labelColor.style.backgroundColor = labelRule.label.color
        label.appendChild(document.createTextNode(labelRule.label.id))
        match.appendChild(document.createElement('hr'))
        match.appendChild(document.createTextNode(labelRule.match))

        /* ------- Other columns------- */
        action.appendChild(document.createTextNode(labelRule.action))
        priority.appendChild(document.createTextNode(labelRule.priority))
        stats.appendChild(document.createTextNode('1'))
    }
}

// function showLinkDetails (d) {
//     if (d.source.type == "switch" && !pathOutputDiv) {
//         let {svg, textArea} = openDetails()
//         // TODO ? Forse non c'è bisogno
//     }
// }

function disableDragging(){
    d3.selectAll('g.nodes circle').call(d3.drag())
}

/* --------------------- MOVING --------------------- */

// Oss. Questi due metodi sono dipendenti dall'oggetto simulation del modulo simulation.js
function enableMovingNodes() {
    document.getElementsByClassName('sdnBehaviour').item(0).style.display = 'none'
    document.getElementsByClassName('sdnBehaviour').item(1).style.display = null

    d3.selectAll('g.nodes circle').call(  // call chiama la funzione passata per parametro esattamente una volta sola
        d3.drag().on('start', function (d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart()
        }).on("drag", function (d) {
            d.fx = d3.event.x
            d.fy = d3.event.y
            document.getElementsByClassName('sdnBehaviour').item(2)
                .style.display = null
        }).on('end',function(){
            if (!d3.event.active) simulation.alphaTarget(0)
        })
    )
}

function releaseNodes(){
    let released = false
    d3.selectAll('g.nodes circle').each(function(d){
        released = (released || d.fx)
        d.fx = null
        d.fy = null
    })

    if(released){
        document.getElementsByClassName('sdnBehaviour').item(2)
            .style.display = 'none'
        simulation.alphaTarget(0.1).restart()
        setTimeout(() => simulation.alphaTarget(0), 3000)
    }
}

/* ----------------- PATH SELECTION ----------------- */

let newPath = new Set()
let pendingStep = null
let pathOutputDiv = null        // This can be set in 'labelmanaging.js'

function enablePathSelection() {
    document.getElementsByClassName('sdnBehaviour').item(0)
        .style.display = null
    document.getElementsByClassName('sdnBehaviour').item(1)
        .style.display = 'none'

    disableDragging()

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
                if(!networksLocked && d.id == lastSelection && !data[i].classList.contains('selected')){
                    linkLock++
                    networksLocked = true

                    data[i].classList.add('selected')
                }
            })

        d3.selectAll('line.switch')
            .on('mouseover', function (d, i, data) {
                if(linkLock == 1 && d.target.id == lastSelection && !data[i].classList.contains('selected')){
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

function appendPathStep(options){   // options è: {device, ingressPort || egressPort }. Ogni campo è string||number
    if(!pendingStep){
        pendingStep = options
    } else {
        if(pendingStep.device != options.device)
            throw new Error("Path non conforme. Forse uno step precedente è rimasto in memoria")
        let step = {
            device: options.device,
            ingressPort: pendingStep.ingressPort,
            egressPort: options.egressPort
        }
        pendingStep = null
        newPath.add(step)
    }
}

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
        priority.innerText = "1"

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

// function drawLines(num, cx, cy, radius = 150) {
//     let lines = d3.select("#details2 svg").append('g')
//     let arcDegree = 2 * Math.PI / num
//     for (let i = 0; i < num; i++) {
//         // v-- Qui se sostituisco radius con cx, cy viene una stella che riempie lo spazio (male però)
//         let x2 = cx + radius * Math.cos(arcDegree * i)
//         let y2 = cy + radius * Math.sin(arcDegree * i)

//         lines.append('line')
//             .attr('x1', cx).attr('y1', cy)
//             .attr('x2', x2).attr('y2', y2)
//             .attr('class', 'axis')
//     }
// }

// function drawRadialAxis(num, top, right, bottom, left) {
//     let plot = d3.select("#details2 svg").append('g')
//     let horizontalSpaceBetween = (top + bottom) / (num + 2)
//     for (let i = 0; i < num; i++) {
//         let height = horizontalSpaceBetween * (i + 1)
//         plot.append('line')
//             .attr('x1', left).attr('y1', height)
//             .attr('x2', right).attr('y2', height)
//             .attr('class', 'axis')
//     }
// }