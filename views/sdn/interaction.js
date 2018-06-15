/* ---------------------------------------------------- */
/* --------------------- CLICKING --------------------- */
/* ---------------------------------------------------- */

function showSwitchDetails(d) {
    if (sdnData.isEditingLabels()) {
        setAllEditButtonsDisabled()
        discardPath()
    }

    let nodeRules = sdnData.getDeviceRules(d.id)
    let { title, svg, disclaimer, packetRulesDiv, labelForwardingDiv } = openDetails(2)
    title.innerHTML = d.id
    disclaimer.innerText = 'Nessuna regola installata sullo switch ' + d.id
    
    if (!nodeRules) {
        hide(svg, packetRulesDiv.lastElementChild/*the table*/, labelForwardingDiv)
    } else {
        hide(disclaimer)
        let packetsData = nodeRules.filter(el => !el.isLabelForwarding)
        let labelsData = nodeRules.filter(el => el.isLabelForwarding)

        if(packetsData.length) {
            unhide(packetRulesDiv.lastElementChild)
            showPacketsRules(packetsData, packetRulesDiv, 1)
        } else hide(packetRulesDiv.lastElementChild/*the table*/)

        if(labelsData.length)
            showMovingLabelRules(labelsData, labelForwardingDiv, packetsData.length + 1)
        else hide(labelForwardingDiv)

        fillRulesSVG(nodeRules)
    }
}

/* -------------------------------------------------- */
/* --------------------- MOVING --------------------- */
/* -------------------------------------------------- */

// Oss. Questi due metodi sono dipendenti dall'oggetto simulation del modulo simulation.js
function enableMovingNodes() {
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    hide(bottoni.item(1))
    unhide(bottoni.item(2))
    let simulation = sdnData.getSimulation()

    d3.selectAll('g.nodes circle').call(  // call chiama la funzione passata per parametro esattamente una volta sola
        d3.drag().on('start', function () {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart()
        }).on("drag", function (d) {
            d.fx = d3.event.x
            d.fy = d3.event.y
            unhide(bottoni.item(3))
        }).on('end', function () {
            if (!d3.event.active) simulation.alphaTarget(0)
        })
    )
}

function releaseNodes() {
    let released = false
    d3.selectAll('g.nodes circle').each(function (d) {
        released = (released || d.fx)
        d.fx = null
        d.fy = null
    })

    if (released) {
        let simulation = sdnData.getSimulation()
        hide(document.getElementsByClassName('sdnBehaviour').item(3))
        simulation.alphaTarget(0.1).restart()
        setTimeout(() => simulation.alphaTarget(0), 3000)
    }
}

/* -------------------------------------------------- */
/* ----------------- PATH SELECTION ----------------- */
/* -------------------------------------------------- */

function disableDragging() {
    d3.selectAll('g.nodes circle').call(d3.drag())
}

function enablePathSelection() {
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    unhide(bottoni.item(1))
    hide(bottoni.item(2))
    disableDragging()

    if (sdnData.isEditingLabels()) {
        let machineLocked = true
        let networksLocked = true
        let linkLock = 0
        let lastSelection = null

        d3.selectAll("circle.network:not(.control):not(.external)").call(
            d3.drag().on("start", function (d, i, data) {
                data[i].classList.add('selected')
                linkLock = 1
                lastSelection = d.id
                togglePathButtons(false)
            })
                .on("end", function () {
                    if (linkLock == 1 && sdnData.pathHasAtLeastOneStep())
                        togglePathButtons(true)
                    else discardPath()
                    machineLocked = true
                    networksLocked = true
                    linkLock = 0
                }))

        d3.selectAll('circle.network:not(.control):not(.external)')  // Link lock è 0
            .on('mouseover', function (d, i, data) {
                if (!networksLocked && d.id == lastSelection && !data[i].classList.contains('selected')) {
                    linkLock++
                    networksLocked = true

                    data[i].classList.add('selected')
                }
            })

        d3.selectAll('line.switch:not(.control)')
            .on('mouseover', function (d, i, data) {
                if (linkLock == 1 && d.target.id == lastSelection && !data[i].classList.contains('selected')) {
                    linkLock++
                    machineLocked = false

                    lastSelection = d.source.id
                    data[i].classList.add('selected') // Seleziona una rete. La prossima sarà una macchina
                    sdnData.appendPathStep({ device: d.source.id, ingressPort: d.porta })
                } else if (linkLock == 3 && d.source.id == lastSelection) {
                    linkLock = 0
                    networksLocked = false

                    lastSelection = d.target.id
                    data[i].classList.add('selected') // Seleziona una macchina. La prossima sarà una rete
                    sdnData.appendPathStep({ device: d.source.id, egressPort: d.porta })
                }
            })

        d3.selectAll('circle.switch')   // linkLock è 2
            .on('mouseover', function (d, i, data) {
                if (!machineLocked && d.id == lastSelection) {
                    linkLock++
                    machineLocked = true

                    data[i].classList.add('selected')
                }
            })
    }
}

function applyPath() {
    let tableBody = sdnData.getPathOutputDiv().getElementsByTagName('tbody').item(0)
    let labelInfo = tableBody.parentElement.parentElement.previousElementSibling
    let label = {
        color: labelInfo.firstElementChild.style.backgroundColor,
        name: labelInfo.firstElementChild.nextSibling.nodeValue
    }
    for (let step of sdnData.getPathSteps()) {
        let rule = document.createElement('tr')
        let device = rule.appendChild(document.createElement('td'))
        let match = rule.appendChild(document.createElement('td'))
        let action = rule.appendChild(document.createElement('td'))

        device.innerText = step.device
        match.innerText = "ingressPort eth" + step.ingressPort
        action.innerText = "egressPort eth" + step.egressPort

        tableBody.appendChild(rule)
        sdnData.addRule(
            step.device,
            [{ match: 'ingressPort', value: step.ingressPort, label }],
            { action: 'egressPort', value: step.egressPort },
            0, 10000, 10000, 0, true)

        rule.addEventListener('mouseenter', function () {
            highlightSegmentOnGraph(step.device, step.ingressPort, step.egressPort)
            console.log('perché questo event listenre sparisce?')   // TODO
        })
        rule.addEventListener('mouseleave', discardPath)
    }
    togglePathButtons(false)
    discardPath()
}

function discardPath() {
    sdnData.discardPath()
    removeNodesSelection()
    togglePathButtons(false)
}

/* -------------------------------------------------- */
/* ----------------- RULE HIGHLIGHT ----------------- */
/* -------------------------------------------------- */

function highlightSegmentOnGraph(device, from, to) {
    d3.selectAll('circle.switch')
        .attr('class', function (d) {
            return (d.id == device) ? 'switch selected' : 'switch'
        })

    d3.selectAll('line.switch:not(.control)')
        .attr('class', function (d) {
            return (d.source.id == device && (d.porta == from || d.porta == to)) ?
                'switch selected' : 'switch'
        })
}