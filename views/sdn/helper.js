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
}

function togglePathButtons(displayBool) {
    let bottoni = document.getElementsByClassName('sdnBehaviour')
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

function openDetails(num) {
    closeDetailsAndClean(3)
    hide(document.getElementById('details'))
    switch(num){
        case 2:
            unhide(document.getElementById('details2'))
            let details = getDetails2Sections()
            for(let el in details) unhide(details[el])
            return details
        case 3:
            unhide(document.getElementById('details3')) // TODO: details3 è gestito a sezioni
            return document.getElementById('details3')
    }
}

function closeDetailsAndClean(num) {    // TODO: eventualmente togli 'num'
    hide(document.getElementById('details2'), document.getElementById('details3'))
    unhide(document.getElementById('details'))

    let details = getDetails2Sections()
    details.svg.innerHTML = ""
    details.packetRulesDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
    details.labelForwardingDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
}

function getDetails2Sections() {
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
/* ------------------- RULES MODAL--------------------- */
/* ---------------------------------------------------- */

function cleanRulesModal(){
    let matchDiv = document.querySelector('#rule-modal .modal-body .half')
    while(matchDiv.children.length != 5)
        modalRemoveLine(matchDiv)
}

function modalMakeNewLine(parent){
    parent.appendChild(parent.lastElementChild.previousElementSibling.cloneNode(true))
    parent.appendChild(parent.lastElementChild.previousElementSibling.cloneNode(true))
}

function modalRemoveLine(parent){
    if(parent.children.length > 5){
        parent.lastElementChild.remove()
        parent.lastElementChild.remove()
    }
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

function createRow(...tdContents){
    let row = document.createElement('tr')
    let cells = []
    for (let content of tdContents){
        let cell = row.appendChild(document.createElement('td'))
        
        if (typeof content == 'object'){
            if(Array.isArray(content)){
                // content è un array
                for(let child of content) cell.appendChild(child)
                // content è un nodo
            } else cell.appendChild(content)
            // content è testo semplice
        } else cell.textContent = content

        cells.push(cell)
    }
    return {row, cells}
}

function hide(...elements){
    for (let el of elements)
        el.style.display = 'none'
}

function unhide(...elements){
    for (let el of elements)
        el.style.display = null
}