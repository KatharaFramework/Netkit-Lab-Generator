/* ---------------------------------------------------- */
/* --------------------- CLICKING --------------------- */
/* ---------------------------------------------------- */

function showSwitchDetails(d) {
	if (labelsDiv.isEditing()) {
		labelsDiv.setAllEditButtonsDisabled()
		discardPath()
	}

	controllerDiv.close()
	rulesDiv.open(d.id)
}

/* -------------------------------------------------- */
/* --------------------- MOVING --------------------- */
/* -------------------------------------------------- */

// Oss. Questi due metodi sono dipendenti dall'oggetto simulation del modulo simulation.js
function enableMovingNodes() {
	let bottoni = document.querySelectorAll('#sdn-horizontal-buttons button')
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
		hide(document.querySelectorAll('#sdn-horizontal-buttons button').item(3))
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
	let bottoni = document.querySelectorAll('#sdn-horizontal-buttons button')
	unhide(bottoni.item(1))
	hide(bottoni.item(2))
	disableDragging()

	if (labelsDiv.isEditing()) {
		let machineLocked = true
		let networksLocked = true
		let linkLock = 0
		let lastSelection = null
		let startsFromEdge = false
		let lastSelectedIsEdge = false

		d3.selectAll("circle.network:not(.external)").call(d3.drag()
			.on("start", function (d, i, data) {
				discardPath()

				if(data[i].classList.contains('edge'))
					startsFromEdge = true
				data[i].classList.add('selected')

				linkLock = 1
				lastSelection = d.id
				togglePathButtons(false)
			})
			.on("end", function (d, i, data) {
				if (linkLock == 1 && sdnData.pathHasAtLeastOneStep()){
					if(startsFromEdge)
						sdnData.setPathEdgeProps(true, false)
					if(lastSelectedIsEdge)
						sdnData.setPathEdgeProps(false, true)

					togglePathButtons(true)
				} else discardPath()

				startsFromEdge = false
				lastSelectedIsEdge = false
                machineLocked = true
                networksLocked = true
				linkLock = 0
			}))

		d3.selectAll('circle.network:not(.external)')  // Link lock è 0
			.on('mouseover', function (d, i, data) {
				if (!networksLocked && d.id == lastSelection && !data[i].classList.contains('selected')) {
					linkLock++
					networksLocked = true

					if(data[i].classList.contains('edge'))
						lastSelectedIsEdge = true
					else lastSelectedIsEdge = false

					data[i].classList.add('selected')
				}
			})

		d3.selectAll('line.switch')
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
	sdnData.getPath().forEach(step => labelsDiv.addStep(step))

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
		.each(function(d, i, nodes){
			if (d.id == device) nodes[i].classList.add('selected')
		})

	d3.selectAll('line.switch')
		.each(function(d, i, nodes){
			if (d.source.id == device){
				if (d.porta == from){
					nodes[i].classList.add('selected')
					nodes[i].classList.add('straight')
				} else if (d.porta == to){
					nodes[i].classList.add('selected')
					nodes[i].classList.add('reversed')
				}
			}
		})
}