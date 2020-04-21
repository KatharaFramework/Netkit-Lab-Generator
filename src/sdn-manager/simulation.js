/* ------------------------- PREPARE RAW DATA ------------------------- */

function loadSDN(forceStart) {
	myhttp.setController(document.querySelector("#connect input").value);

	if(!sdnData.isReady() || forceStart) {
		ryuActions.getTopology().then(machinesConfig => {	// TODO: Riscrivere 'getTopology' e i due metodi per la topologia che seguono in questo file
			if(!sdnData.isReady() || forceStart){
				// Preparo i dati
				let simulationData = makeNodesAndEdges(machinesConfig);
				sdnData.set(machinesConfig);

				// Preparo l'interfaccia
				hide(document.getElementById("connect"));
				resetButtons();

				// Avvio la simulazione
				startSimulation(simulationData);

			}
		});
	} else if (confirm("Are you sure?")) {
		// Resetto i dati e ricarico la simulazione
		for (let svg of document.getElementsByTagName("svg")) svg.innerHTML = "";

		labelsSection.reset();
		switchDetailsSection.close();
		controllerAndRulesSection.close();

		loadSDN(true);
	}
}

function makeNodesAndEdges(machines){
	let data = { nodes: [], links: [] };
	let networks = new Set();

	// Costruisco un nodo per ogni macchina con id e tipo
	for (let machine of machines) {
		if(machine.type != "controller"){
			let node = { id: machine.name, type: machine.type };
			data.nodes.push(node);

			// Scorro le interfacce
			machine.interfaces.if.forEach(function (interfaccia) {
				let nomeDominio = interfaccia.eth.domain;
				if(nomeDominio != "SDNRESERVED"){
					// Per ogni interfaccia creo un collegamento tra un nodo macchina e un nodo dominio
					data.links.push({ source: node, target: nomeDominio, porta: interfaccia.eth.number });
					// Mi salvo tutti i nomi delle reti che incontro
					networks.add(nomeDominio);
				}
			});
		}
	}

	// Creo i nodi dominio con id e tipo
	networks.forEach(domainName => {
		if(domainName.includes("Network")) data.nodes.push({ id: domainName, type: "network edge" });	// TODO: E' un rimedio temporaneo
		else data.nodes.push({ id: domainName, type: "network" });
	});

	findEdgeNetworks(data);
	return data;
}

function findEdgeNetworks(data) {
	// Divido le reti in base al loro tipo:
	// - edge = comunica con qualche macchinario non-sdn;
	// - external = non fa parte della sottorete sdn.

	data.nodes.forEach(function (node) {
		if (node.type == "network") {
			let isInternal = false;
			let isExternal = false;
			for (let link of data.links) {
				if (link.target == node.id) {
					if (link.source.type == "switch") isInternal = true;
					else if (link.source.type != "switch") isExternal = true;
				}

				if (isInternal && isExternal) {
					node.type += " edge";
					break;
				}
			}
			if (!isInternal) node.type += " external";
		}
	});
}

function startSimulation(data) {
	let svg = d3.select("#sdnGraph");
	svg.node().style.display = "";

	/* --------------------- PREPARE LINKS --------------------- */

	let linksGroup = svg.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(data.links)
		.enter().append("line");

	linksGroup.append("title").text(function (d) { return "eth" + d.porta; });

	/* --------------------- PREPARE NODES --------------------- */

	let nodesGroup = svg.append("g")
		.attr("class", "nodes")
		.selectAll("circle")
		.data(data.nodes)
		.enter().append("circle")
		.attr("r", function(d){
			if(d.type == "network" || d.type == "network edge") return 15;
			return 25;
		})
		.attr("class", function (d) { return d.type; });
	// .attr("xlink:href", assignImage)

	nodesGroup.append("title").text(function (d) { return d.id; });

	/* ------------------- CREATE SIMULATION ------------------- */

	let simulation = d3.forceSimulation(data.nodes) // <-- Da ora ogni nodo ha in più: index, x, y, vx, vy
		.force("link", d3.forceLink(data.links)
			.id(function (d) { return d.id; }))      // <-- specificando id posso riferirmi ai nodi attraverso il loro campo 'id' piuttosto che al loro indice nell'array dei nodi
		.force("attraction", d3.forceManyBody())
		.force("repulsion", d3.forceCollide())
		.force("center", d3.forceCenter(450, 400));

	/* Adjusting parameters */
	simulation.force("link")
		.distance(function (d) {
			if(d.source.type == "switch") return 80;
			return 60;
		});

	simulation.force("attraction")
		.strength(200);

	simulation.force("repulsion")
		.radius(70);
	/* ---------------------- */

	// Specifico come si aggiorna la simulazione ad ogni passo
	simulation.on("tick", function () {
		linksGroup
			.attr("x1", function (d) { return d.source.x; })
			.attr("y1", function (d) { return d.source.y; })
			.attr("x2", function (d) { return d.target.x; })
			.attr("y2", function (d) { return d.target.y; });

		nodesGroup
			.attr("cx", function (d) {
				if(d.x < 25) return 25;
				else if (d.x > 875) return 875;	// 900 (dimensione orizzontale del SVG) - 25 (raggio massimo di un nodo)
				else return d.x;
			})
			.attr("cy", function (d) {
				if(d.y < 0) return 25;
				else if (d.y > 775)	return 775;	// 800 (dimensione verticale del SVG) - 25 (raggio massimo di un nodo)
				else return d.y;
			});
	});

	// Avvio la simulazione
	sdnData.setSimulation(simulation);

	// Classifico i link in base ai nodi che esso collega
	linksGroup.attr("class", function (d) { return d.target.type + " " + d.source.type; }); // <-- Solo dopo aver creato la simulazione ogni link è collegato ai suoi nodi

	// Aggiungo l'interazione al click ai nodi
	d3.selectAll("g.nodes circle.switch").on("click", d => switchDetailsSection.open(d.id));

	// Aggiungo al nodo HTML che rappresenta l'SVG alcune definizioni: non le metto direttamente nell'HTML per semplicita nel processo di reset del grafico
	appendMarkersDefinitions(svg);
}

function appendMarkersDefinitions(svg){
	// Creando ora una definizione di un marcatore potrò poi usara quando necessario.
	// Questi marcatori sono le punte delle frecce che indicheranno il verso del flusso.

	let defs = svg.append("defs");
	defs.append("marker")	// Questo marcatore va bene con marker-start
		.attr("id", "markerArrow1")
		.attr("markerWidth", "10").attr("markerHeight", "10")
		.attr("refY", "3").attr("refX", "-5")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M5,1 L5,5 L1,3 L5,1")	// Triangolo con punta a destra
		.style("fill", "red");

	defs.append("marker")	// Questo marcatore va bene con marker-end
		.attr("id", "markerArrow2")
		.attr("markerWidth", "10").attr("markerHeight", "10")
		.attr("refY", "3").attr("refX", "9")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M1,1 L1,5 L5,3 L1,1")	// Triangolo con punta a sinistra
		.style("fill", "red");
}

/* --------------------------------------------------- */
/* --------------- INTERACT WITH GRAPH --------------- */
/* --------------------------------------------------- */

/* ---------------------- MOVE ---------------------- */

function enableMovingNodes() {
	hide(document.getElementById("b1"));
	unhide(document.getElementById("b2"));
	let simulation = sdnData.getSimulation();

	d3.selectAll("g.nodes circle").call(  // call chiama la funzione passata per parametro esattamente una volta sola
		d3.drag().on("start", function () {
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
		}).on("drag", function (d) {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
			enableButtons("b3");
		}).on("end", function () {
			if (!d3.event.active) simulation.alphaTarget(0);
		})
	);
}

function releaseNodes() {
	let released = false;
	d3.selectAll("g.nodes circle").each(function (d) {
		released = (released || d.fx);
		d.fx = null;
		d.fy = null;
	});

	if (released) {
		let simulation = sdnData.getSimulation();
		disableButtons("b3");
		simulation.alphaTarget(0.1).restart();
		setTimeout(() => simulation.alphaTarget(0), 3000);
	}
}

/* ----------------- PATH SELECTION ----------------- */

function disableDragging() {
	d3.selectAll("g.nodes circle").call(d3.drag());
}

function enablePathSelection() {
	unhide(document.getElementById("b1"));
	hide(document.getElementById("b2"));
	disableDragging();

	if (labelsSection.isEditing()) {
		let machineLocked = true;
		let networksLocked = true;
		let linkLock = 0;
		let lastSelection = null;
		let startsFromEdge = false;
		let lastSelectedIsEdge = false;

		d3.selectAll("circle.network:not(.external)").call(d3.drag()
			.on("start", function (d, i, data) {
				discardPath();

				if(data[i].classList.contains("edge"))
					startsFromEdge = true;
				data[i].classList.add("selected");

				linkLock = 1;
				lastSelection = d.id;
				togglePathButtons(false);
			})
			.on("end", function (/* d, i, data */) {
				if (linkLock == 1 && sdnData.pathHasAtLeastOneStep()){
					if(startsFromEdge)
						sdnData.setEdgeProperties(true, false);
					if(lastSelectedIsEdge)
						sdnData.setEdgeProperties(false, true);

					togglePathButtons(true);
				} else discardPath();

				startsFromEdge = false;
				lastSelectedIsEdge = false;
				machineLocked = true;
				networksLocked = true;
				linkLock = 0;
			}));

		d3.selectAll("circle.network:not(.external)")  // Link lock è 0
			.on("mouseover", function (d, i, data) {
				if (!networksLocked && d.id == lastSelection && !data[i].classList.contains("selected")) {
					linkLock++;
					networksLocked = true;

					if(data[i].classList.contains("edge"))
						lastSelectedIsEdge = true;
					else lastSelectedIsEdge = false;

					data[i].classList.add("selected");
				}
			});

		d3.selectAll("line.switch")
			.on("mouseover", function (d, i, data) {
				if (linkLock == 1 && d.target.id == lastSelection && !data[i].classList.contains("selected")) {
					linkLock++;
					machineLocked = false;

					lastSelection = d.source.id;
					data[i].classList.add("selected"); // Seleziona una rete. La prossima sarà una macchina
					sdnData.appendPathStep({ device: d.source.id, ingressPort: d.porta });
				} else if (linkLock == 3 && d.source.id == lastSelection) {
					linkLock = 0;
					networksLocked = false;

					lastSelection = d.target.id;
					data[i].classList.add("selected"); // Seleziona una macchina. La prossima sarà una rete
					sdnData.appendPathStep({ device: d.source.id, egressPort: d.porta });
				}
			});

		d3.selectAll("circle.switch")   // linkLock è 2
			.on("mouseover", function (d, i, data) {
				if (!machineLocked && d.id == lastSelection) {
					linkLock++;
					machineLocked = true;

					data[i].classList.add("selected");
				}
			});
	}
}

function applyPath() {
	sdnData.getPath().forEach(step => labelsSection.addRuleStep(step));

	togglePathButtons(false);
	discardPath();
}

function discardPath() {
	sdnData.discardPath();
	removeNodesSelection();
	togglePathButtons(false);
}

/* ----------------- RULE HIGHLIGHT ----------------- */

function highlightSegmentOnGraph(device, from, to) {
	d3.selectAll("circle.switch")
		.each(function(d, i, nodes){
			if (d.id == device) nodes[i].classList.add("selected");
		});

	d3.selectAll("line.switch")
		.each(function(d, i, nodes){
			if (d.source.id == device){
				if (d.porta == from){
					nodes[i].classList.add("selected");
					nodes[i].classList.add("straight");
				} else if (d.porta == to){
					nodes[i].classList.add("selected");
					nodes[i].classList.add("reversed");
				}
			}
		});
}