function removeNodesSelection() {
    for (let el of document.querySelectorAll('svg .selected'))
        el.classList.remove('selected')
}

/* ----------------------------------------------------------- */
/* ----------------------- TOP BUTTONS ----------------------- */
/* ----------------------------------------------------------- */

function resetButtons() {
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    unhide(
        bottoni.item(0),    // Bottone per muovere i nodi
        bottoni.item(3)     // Bottone per aggiungere etichette
    )
    hide(
        bottoni.item(1),    // Bottone per selezionare il path
        bottoni.item(2),    // Bottone per rilasciare i nodi
        bottoni.item(4),    // Bottone per confermare un path
        bottoni.item(5)     // Bottone per annullare un path
    )
}

function togglePathButtons(displayBool) {
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    if (displayBool) 
        unhide(
            bottoni.item(4),
            bottoni.item(5))
    else 
        hide(
            bottoni.item(4),
            bottoni.item(5)
    )
}

/* --------------------------------------------------------- */
/* --------------------- DETAILS DIV ----------------------- */
/* --------------------------------------------------------- */

function openDetails() {
    closeDetailsAndClean()
    hide(document.getElementById('details'))
    unhide(document.getElementById('details2'))
    
    let details = getDetailsSections()
    for(let el in details) unhide(details[el])
    return details
}

function closeDetailsAndClean() {
    hide(document.getElementById('details2'))
    unhide(document.getElementById('details'))

    let details = getDetailsSections()
    details.svg.innerHTML = ""
    details.packetRulesDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
    details.labelForwardingDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
}

function getDetailsSections() {
    let details2 = document.getElementById('details2')
    let rules = document.getElementById('rules')
    return {
        title: details2.querySelector('h3'),
        svg: details2.querySelector('svg'),
        disclaimer: details2.querySelector('.disclaimer'),
        packetRulesDiv: rules.firstElementChild,
        labelForwardingDiv: rules.lastElementChild
    }
}

function cleanSVGs() {
    for (let svg of document.getElementsByTagName('svg'))
        svg.innerHTML = ""
}

/* ---------------------------------------------------- */
/* --------------------- GENERIC----------------------- */
/* ---------------------------------------------------- */

function createTable(...headers) {
    let table = document.createElement('table')
    let head = table.createTHead()
    for (let header of headers) {
        head.appendChild(document.createElement('th'))
            .innerText = header
    }
    table.createTBody()
    return table
}

function createRow(...tdVals){
    let row = document.createElement('tr')
    for (let val of tdVals){
        if (typeof val == 'object'){
            let cell = document.createElement('td')
            cell.appendChild(val)
            row.appendChild(cell)
        } else {
            row.appendChild(document.createElement('td')).textContent = val
        }
    }
    return row
}

function hide(...elements){
    for (let el of elements)
        el.style.display = 'none'
}

function unhide(...elements){
    for (let el of elements)
        el.style.display = null
}