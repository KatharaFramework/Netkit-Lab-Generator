function createNewLabel(){
    document.getElementsByClassName('sdnBehaviour').item(3).style.display = 'none'
    let row = d3.create('div')
    row.append('input')
        .attr('type', 'text')
        .attr('placeholder', 'color')
    row.append('input')
        .attr('type', 'text')
        .attr('placeholder', 'name')
    row.append('button')
        .text('Add')
        .on('click', function(){
            createNewDefinedLabel(row.nodes().pop())
        })
    row.append('button')
        .text('Ignore')
        .on('click', function(){
            row.remove()
            document.getElementsByClassName('sdnBehaviour').item(3).style.display = null
        })
    document.getElementById('details').appendChild(row.node())
}

function createNewDefinedLabel(rawElement){
    let details = document.getElementById('details')
    let [colorInputEl, nameInputEl] = rawElement.getElementsByTagName('input')
    if (colorInputEl.value && nameInputEl.value){
        let labelNode = document.createElement('p')
        let showDiv = document.createElement('div')
        let colorTag = document.createElement('div')
        let showButton = document.createElement('button')
        let editButton = document.createElement('button')
        let deleteButton = document.createElement('button')
        
        colorTag.className = 'colorTag'
        colorTag.style.backgroundColor = colorInputEl.value

        showButton.innerText = "Show/Hide"
        showButton.addEventListener('click', function(){
            let prevStatus = showDiv.style.display
            showDiv.style.display = (prevStatus == 'block') ? 'none' : 'block'
            // TODO: magari evidenzia anche sul grafo il path che segue
        })

        editButton.innerText = "Edit"
        editButton.addEventListener('click', setActiveStatus)

        deleteButton.style.display = "none"
        deleteButton.innerText = "Remove..."
        deleteButton.addEventListener('click', enableRemove)

        showDiv.className = 'label-details'
        showDiv.appendChild(createTable('device', 'match', 'action', 'priority'))

        labelNode.appendChild(colorTag)
        labelNode.appendChild(document.createTextNode(nameInputEl.value.trim()))
        labelNode.appendChild(deleteButton)
        labelNode.appendChild(editButton)
        labelNode.appendChild(showButton)
        
        rawElement.innerHTML = ""
        rawElement.append(labelNode)
        rawElement.append(showDiv)
        
        details.appendChild(document.createElement('hr'))
        document.getElementsByClassName('sdnBehaviour').item(3).style.display = null
    }
}

function setActiveStatus(){
    setAllEditButtonsDisabled()

    this.classList.add('btn-success')
    this.innerText = 'EDITING'
    this.parentElement.nextElementSibling.style.display = 'block'

    this.previousElementSibling.style.display = null

    pathOutputDiv = this.parentElement.nextElementSibling

    enablePathSelection()

    let newThis = this.cloneNode(true)
    newThis.addEventListener('click', setDisabledStatus)
    this.parentNode.replaceChild(newThis, this)
}

function setDisabledStatus(){
    this.classList.remove('btn-success')
    this.innerText = 'Edit'

    this.previousElementSibling.style.display = 'none'
    disableRemove.bind(this.previousElementSibling)()
    
    pathOutputDiv = null

    disableDragging()

    let newThis = this.cloneNode(true)
    newThis.addEventListener('click', setActiveStatus)
    this.parentNode.replaceChild(newThis, this)
}

function setAllEditButtonsDisabled() {
    details.querySelectorAll('#details > div > p button.btn-success')
        .forEach(el => setDisabledStatus.bind(el)())
}

function enableRemove(){
    this.className = "btn-danger"
    this.innerText = "Click to remove"

    if(this.style.display != 'none'){
        for (let child of this.parentElement.nextElementSibling.children[0].children[1].children){
            child.addEventListener('click', function(){ this.remove() })
        }
    }

    this.removeEventListener('click', enableRemove)
    this.addEventListener('click', disableRemove)
}

function disableRemove(){
    this.classList.remove('btn-danger')
    this.innerText = 'Remove...'

    for (let child of this.parentElement.nextElementSibling.children[0].children[1].children){
        let newThis = child.cloneNode(true)
        child.parentNode.replaceChild(newThis, child)
    }
    
    this.removeEventListener('click', disableRemove)
    this.addEventListener('click', enableRemove)
}

function getLabelsInfo(){
    let data = []
    for (let el of document.getElementById('details').children) {
        if(el.tagName == 'DIV'){
            let labelColor = el.firstChild.childNodes.item(0).style.backgroundColor
            let labelName = el.firstChild.childNodes.item(1).textContent
            for(let ruleRow of el.getElementsByTagName('tr')){
                // Ogni child di ruleRow è una cella della riga: device, match, action, priority
                let device = ruleRow.children.item(0).firstChild.textContent
                let match = ruleRow.children.item(1).firstChild.textContent
                let action = ruleRow.children.item(2).firstChild.textContent
                let priority = ruleRow.children.item(3).firstChild.textContent // TODO: priority deve ancora essere trattato. Potrebbe non essere un nodo testuale

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

// function getLabels(){
//     let labels = []
//     for (let el of document.getElementById('details').children) {
//         if(el.tagName == 'DIV'){
//             let labelColor = el.firstChild.childNodes.item(0).style.backgroundColor
//             let labelName = el.firstChild.childNodes.item(1).textContent
//             labels.push({id: labelName, color: labelColor})
//         }
//     }
// }