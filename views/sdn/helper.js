function removeNodesSelection() {
    for (let el of document.querySelectorAll('svg .selected')){
		el.classList.remove('selected', 'straight', 'reversed')
	}
}

/* ----------------------------------------------------------- */
/* ----------------------- TOP BUTTONS ----------------------- */
/* ----------------------------------------------------------- */

function resetButtons() {
    let bottoni = document.querySelectorAll('#sdn-horizontal-buttons button')
    unhide(
        bottoni.item(1),    // Bottone per muovere i nodi
        bottoni.item(4)     // Bottone per aggiungere etichette
    )
    hide(
        bottoni.item(0),    // Bottone per caricare la configurazione
        bottoni.item(2),    // Bottone per selezionare il path
        bottoni.item(3),    // Bottone per rilasciare i nodi
        bottoni.item(5),    // Bottone per confermare un path
        bottoni.item(6)     // Bottone per annullare un path
	)

	document.getElementById('sdn-vertical-buttons').classList.remove('hidden')
	let hideNetworkButton = document.querySelectorAll('#sdn-vertical-buttons button').item(2)
	hideNetworkButton.innerText = 'Hide external network'
	hideNetworkButton.stato = false
}

function togglePathButtons(displayBool) {
    let bottoni = document.querySelectorAll('#sdn-horizontal-buttons button')
    if (displayBool) 
        unhide(
            bottoni.item(5),
            bottoni.item(6))
    else 
        hide(
            bottoni.item(5),
            bottoni.item(6)
    )
}

/* --------------------------------------------------------- */
/* --------------------- DETAILS DIV ----------------------- */
/* --------------------------------------------------------- */

function closeDetailsSections() {
    controllerDiv.close()
	rulesDiv.close()
}

function cleanSVGs() {
    for (let svg of document.getElementsByTagName('svg'))
        svg.innerHTML = ""
}

/* ---------------------------------------------------- */
/* --------------------- GENERIC----------------------- */
/* ---------------------------------------------------- */

function hide(...elements){
    for (let el of elements)
        el.style.display = 'none'
}

function unhide(...elements){
    for (let el of elements)
        el.style.display = null
}