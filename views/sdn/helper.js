function removeNodesSelection(){
    for (let el of document.querySelectorAll('svg .selected'))
    el.classList.remove('selected')
}

/* ----------------------------------------------------------- */
/* ----------------------- TOP BUTTONS ----------------------- */
/* ----------------------------------------------------------- */

function resetButtons(){
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    bottoni.item(0).style.display = null    // Bottone per muovere i nodi
    bottoni.item(2).style.display = 'none'  // Bottone per rilasciare i nodi
    bottoni.item(1).style.display = 'none'  // Bottone per selezionare il path
    bottoni.item(3).style.display = null    // Bottone per aggiungere etichette
    bottoni.item(4).style.display = 'none'  // Bottone per confermare un path
    bottoni.item(5).style.display = 'none'  // Bottone per annullare un path
}

function togglePathButtons(display){
    let bottoni = document.getElementsByClassName('sdnBehaviour')
    if(display){
        bottoni.item(4).style.display = null
        bottoni.item(5).style.display = null
    } else {
        bottoni.item(4).style.display = 'none'
        bottoni.item(5).style.display = 'none'
    }
}

/* --------------------------------------------------------- */
/* --------------------- DETAILS DIV ----------------------- */
/* --------------------------------------------------------- */

function openDetails() {
    closeDetailsAndClean()
    document.getElementById('details').style.display = 'none'
    document.getElementById('details2').style.display = 'inline-block'
    return getDetailsSections()
}

function closeDetailsAndClean() {
    document.getElementById('details').style.display = 'inline-block'
    document.getElementById('details2').style.display = 'none'
    let details = getDetailsSections()
    for(let el in details)
        details[el].style.display = 'none'
    details.svg.innerHTML = ""
    details.packetRulesDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
    details.labelForwardingDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
}

function getDetailsSections() {
    let details2 = document.getElementById('details2')
    let rules = document.getElementById('rules')
    return {
        title: details2.firstElementChild.nextElementSibling,
        svg: details2.firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling,
        disclaimer: details2.lastElementChild,
        packetRulesDiv: rules.firstElementChild,
        labelForwardingDiv: rules.lastElementChild
    }
}

function cleanSVGs(){
    for (let svg of document.getElementsByTagName('svg'))
        svg.innerHTML = ""
}

/* ---------------------------------------------------- */
/* --------------------- GENERIC----------------------- */
/* ---------------------------------------------------- */

function createTable(...headers){
    let table = document.createElement('table')
    let head = table.createTHead()
    for(let header of headers){
        head.appendChild(document.createElement('th')
        ).innerText = header
    }
    table.createTBody()
    return table
}

function getLabelsInfo(){
    let data = []
    for (let el of document.getElementById('details').children) {
        if(el.tagName == 'DIV' && el.firstChild.tagName != 'INPUT'){
            let labelColor = el.firstChild.childNodes.item(0).style.backgroundColor
            let labelName = el.firstChild.childNodes.item(1).textContent
            for(let ruleRow of el.getElementsByTagName('tr')){
                // Ogni child di ruleRow è una cella della riga: device, match, action, priority
                let device = ruleRow.children.item(0).firstChild.textContent
                let match = ruleRow.children.item(1).firstChild.textContent
                let action = ruleRow.children.item(2).firstChild.textContent
                let priority = ruleRow.children.item(3).firstChild.value

                let rule = {
                    label: {id: labelName, color: labelColor},
                    match, action, priority
                }

                let el = data.find(el => el.id == device)
                if(el) {
                    el.rules.push(rule)
                } else {
                    data.push({id: device, rules: [rule]})
                }
            }
        }
    }
    return data
}