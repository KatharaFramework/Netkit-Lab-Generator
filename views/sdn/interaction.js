/* ---------------------------------------------------- */
/* --------------------- CLICKING --------------------- */
/* ---------------------------------------------------- */

function showSwitchDetails (d) {
    if(pathOutputDiv) {
        setAllEditButtonsDisabled()
        discardPath()
    }
    let nodeLabelsData = getLabelsInfo().find(el => el.id == d.id)
    let { title, disclaimer, svg, packetRulesDiv, labelForwardingDiv } = openDetails()
    title.innerHTML = d.id
    title.style.display = null
    let rulesAdded = showPacketsRules(d.id, packetRulesDiv)
    if(!nodeLabelsData && rulesAdded == 0){
        disclaimer.style.display = null
        disclaimer.innerText = 'Nessuna regola installata sullo switch ' + d.id
    } else {
        if(nodeLabelsData)
        showMovingLabelRules(nodeLabelsData.rules, labelForwardingDiv, rulesAdded + 1)
        fillRulesSVG(nodeLabelsData, svg)
    }
}

function disableDragging(){
    d3.selectAll('g.nodes circle').call(d3.drag())
}

/* -------------------------------------------------- */
/* --------------------- MOVING --------------------- */
/* -------------------------------------------------- */

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

/* -------------------------------------------------- */
/* ----------------- PATH SELECTION ----------------- */
/* -------------------------------------------------- */

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

        let priorityInput = priority.appendChild(document.createElement('input'))
        priorityInput.value = +1
        priorityInput.type = 'number'
        priorityInput.min = 1

        tableBody.appendChild(rule)

        rule.addEventListener('mouseenter', function() {
            highlightSegmentOnGraph(step.device, step.ingressPort, step.egressPort)
            console.log('perché questo event listenre sparisce?')
        })
        rule.addEventListener('mouseleave', discardPath)
    }
    togglePathButtons(false)
    discardPath()
}

function discardPath(){
    if(newPath.size) newPath = new Set()
    pendingStep = null
    removeNodesSelection()
    togglePathButtons(false)
}

/* -------------------------------------------------- */
/* ----------------- RULE HIGHLIGHT ----------------- */
/* -------------------------------------------------- */

function highlightSegmentOnGraph(device, from, to){
    d3.selectAll('circle.switch')
        .attr('class', function(d){ return (d.id == device) ? 'switch selected' : 'switch' })

    d3.selectAll('line.switch')
        .attr('class', function(d){
            return (d.source.id == device && (d.porta == from || d.porta == to)) ?
                'switch selected' : 'switch'
        })
}