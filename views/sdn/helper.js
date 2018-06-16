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

function openDetails(num, subsection) {
    closeDetailsAndClean()
    hide(document.getElementById('details'))
    switch(num){
        case 2:
            unhide(document.getElementById('details2'))
            let details = getDetails2Sections()
            for(let el in details) unhide(details[el])
            return details
        case 3:
            let details3 = document.getElementById('details3')
            let subsections = details3.querySelectorAll('div')
            unhide(subsections.item(subsection - 1), details3)
            return "TODO?"
    }
}

function closeDetailsAndClean() {
    /* details2 sections */
    hide(document.getElementById('details2'))
    let details = getDetails2Sections()
    details.svg.innerHTML = ""
    details.packetRulesDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
    details.labelForwardingDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
    
    /* details3 sections */
    let details3 = document.getElementById('details3')
    for(let section of details3.querySelectorAll('div')) hide(section)
    hide(details3)

    /* unhide main (details) */
    unhide(document.getElementById('details'))
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

function setInputPattern(value, inputEl) {
    // TODO: Ho già provato a fare 'switch(value){case ...: ...}' ma non va. Eventualmente riprova
    // TODO: Ammettere anche valori "192.*"
    let newPattern
    if (value == "noselection") { inputEl.disabled = true; return }
    else if (value == "MAC source") { newPattern = "([0-9A-F]{4}:){4}" }           // TODO: non sono sicuro che sia così
    else if (value == "MAC destination") { newPattern = "([0-9A-F]{4}:){4}" }      // TODO: non sono sicuro che sia così
    else if (value == "eth type") { newPattern = "ciao" }
    else if (value == "MPLS label") { newPattern = "ciao" }
    else if (value == "MPLS tc") { newPattern = "ciao" }
    else if (value == "vlan id") { newPattern = "ciao" }
    else if (value == "IP source") { newPattern = "([0-2]?[0-9]{,2}\.){4}" }       // TODO: quello che ho messo ora è (0-299.){4}
    else if (value == "IP destination") { newPattern = "([0-2]?[0-9]{,2}\.){4}" }  // TODO: quello che ho messo ora è (0-299.){4}
    else if (value == "IP port") { newPattern = "[0-6]?[0-9]{,4}" } // 0 - 65535   // TODO: quello che ho messo ora è 0-69999
    else if (value == "TCP source port") { newPattern = "[0-6]?[0-9]{,4}" }
    else if (value == "TCP destination port") { newPattern = "[0-6]?[0-9]{,4}" }
    else if (value == "set MPLS label") { newPattern = "ciao" }
    else if (value == "forward to port") { newPattern = "[0-6]?[0-9]{,4}" }    // 0 - 65535    // TODO: quello che ho messo ora è 0-69999
    else if (value == "send to controller") { newPattern = "ciao" }
    else if (value == "drop") { inputEl.disabled = true; return }
    else if (value == "process l2") { newPattern = "ciao" }
    else if (value == "process l3") { newPattern = "ciao" }
    else if (value == "set field") { newPattern = "ciao" }
    else if (value == "push header") { newPattern = "ciao" }
    else if (value == "pop header") { newPattern = "ciao" }
    inputEl.pattern = newPattern
    inputEl.disabled = false
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