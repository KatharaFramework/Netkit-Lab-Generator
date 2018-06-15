/* ---------------------------------------------------- */
/* ------------------ LABEL CREATION ------------------ */
/* ---------------------------------------------------- */

function createNewLabel() {
    let createLabelButton = document.getElementsByClassName('sdnBehaviour').item(4)
    hide(createLabelButton)
    let row = d3.create('div')
    row.append('input').attr('placeholder', 'color')
        .attr('type', 'text').attr('pattern', '(#[0-9]{3,6})|([A-z]+)|(rgba?.*)')
    row.append('input').attr('placeholder', 'name')
        .attr('type', 'text').attr('pattern', '[A-z0-9]+')
    row.append('button').text('Add')
        .on('click', function () { createNewDefinedLabel(row.nodes().pop()) })
    row.append('button').text('Ignore')
        .on('click', function () { row.remove(); unhide(createLabelButton)})
    document.getElementById('details').appendChild(row.node())
}

function createNewDefinedLabel(rawElement) {
    let details = document.getElementById('details')
    let [colorInputEl, nameInputEl] = rawElement.getElementsByTagName('input')
    if (colorInputEl.value && nameInputEl.value &&
        colorInputEl.validity.valid && nameInputEl.validity.valid) {
        let labelNode = document.createElement('p')
        let showDiv = document.createElement('div')
        let colorTag = document.createElement('div')
        let showButton = document.createElement('button')
        let editButton = document.createElement('button')
        let deleteButton = document.createElement('button')

        colorTag.className = 'colorTag'
        colorTag.style.backgroundColor = colorInputEl.value

        showButton.innerText = "Show/Hide"
        showButton.addEventListener('click', function () {
            let prevStatus = showDiv.style.display
            showDiv.style.display = (prevStatus == 'block') ? 'none' : 'block'
        })

        editButton.innerText = "Edit"
        editButton.addEventListener('click', function(){ editButtonBehaviour(this, false) })

        deleteButton.style.display = "none"
        deleteButton.innerText = "Remove..."
        deleteButton.addEventListener('click', enableRemove)

        showDiv.className = 'label-details'
        showDiv.appendChild(createTable('device', 'match', 'action'))

        labelNode.appendChild(colorTag)
        labelNode.appendChild(document.createTextNode(nameInputEl.value.trim()))
        labelNode.appendChild(deleteButton)
        labelNode.appendChild(editButton)
        labelNode.appendChild(showButton)

        rawElement.innerHTML = ""
        rawElement.append(labelNode)
        rawElement.append(showDiv)

        details.appendChild(document.createElement('hr'))
        unhide(document.getElementsByClassName('sdnBehaviour').item(4))
    }
}

/* ---------------- BUTTONS BEHAVIOUR ---------------- */

/* ----- edit button ----- */

function editButtonBehaviour(buttonEl, forceStop) {
    if(buttonEl.innerText == 'Edit' && !forceStop){
        setAllEditButtonsDisabled()
        buttonEl.classList.add('btn-success')
        buttonEl.innerText = 'EDITING'
        buttonEl.parentElement.nextElementSibling.style.display = 'block'

        buttonEl.previousElementSibling.style.display = null
        
        sdnData.setPathOutputDiv(buttonEl.parentElement.nextElementSibling)
    
        enablePathSelection()
    } else {
        buttonEl.classList.remove('btn-success')
        buttonEl.innerText = 'Edit'
        
        buttonEl.previousElementSibling.style.display = 'none'
        disableRemove.bind(buttonEl.previousElementSibling)()
        
        sdnData.setPathOutputDiv(null)
        
        disableDragging()
    }
}

function setAllEditButtonsDisabled() {
    details.querySelectorAll('#details > div > p button.btn-success')
        .forEach(el => editButtonBehaviour(el, true))
}

/* ----- remove button ----- */

function enableRemove() {   // TODO: Pensa a come sostiturie questi due metodi con 1 solo (simlmente ad editButton)
    this.className = "btn-danger"
    this.innerText = "Click to remove"

    if (this.style.display != 'none') {
        for (let child of this.parentElement.nextElementSibling.children[0].children[1].children) {
            child.addEventListener('click', function () { this.remove() })
        }
    }

    this.removeEventListener('click', enableRemove)
    this.addEventListener('click', disableRemove)
}

function disableRemove() {
    this.classList.remove('btn-danger')
    this.innerText = 'Remove...'

    for (let child of this.parentElement.nextElementSibling.children[0].children[1].children) {
        let newThis = child.cloneNode(true)
        child.parentNode.replaceChild(newThis, child)
    }

    this.removeEventListener('click', disableRemove)
    this.addEventListener('click', enableRemove)
}