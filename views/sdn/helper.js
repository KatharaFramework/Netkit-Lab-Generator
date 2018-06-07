function closeDetailsAndClean() {
    document.getElementById('details').style.display = 'inline-block'
    document.getElementById('details2').style.display = 'none'
    let details = getDetailsElements()
    for(let el in details)
        details[el].style.display = 'none'
    details.svg.innerHTML = ""
    // TODO: clean packet labelling div
    details.labelForwardingDiv.getElementsByTagName('tbody').item(0).innerHTML = ""
}

function openDetails() {
    closeDetailsAndClean()
    document.getElementById('details').style.display = 'none'
    document.getElementById('details2').style.display = 'inline-block'
    return getDetailsElements()
}

function getDetailsElements() {
    let details2 = document.getElementById('details2')
    let rules = document.getElementById('rules')
    return {
        svg: details2.firstElementChild.nextElementSibling,
        packetLabellingDiv: rules.firstElementChild,
        labelForwardingDiv: rules.lastElementChild,
        disclaimer: details2.lastElementChild
    }
}

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

function cleanSVGs(){
    for (let svg of document.getElementsByTagName('svg'))
        svg.innerHTML = ""
}