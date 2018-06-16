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
        editButton.addEventListener('click', changeEditButtonBehaviour)

        deleteButton.style.display = "none"
        deleteButton.innerText = "Remove..."
        deleteButton.addEventListener('click', changeRemoveButtonBehaviour)

        showDiv.className = 'label-details'
        showDiv.appendChild(createTable('device', 'match', 'action'))

        labelNode.appendChild(colorTag)
        labelNode.appendChild(document.createTextNode(nameInputEl.value))
        labelNode.appendChild(deleteButton)
        labelNode.appendChild(editButton)
        labelNode.appendChild(showButton)

        labelNode.addEventListener('mouseenter', function(){
            let rows = this.parentElement.querySelectorAll('tr')
            for(let row of rows) row.dispatchEvent(new Event('mouseenter'))
        })
        labelNode.addEventListener('mouseleave', function(){
            let rows = this.parentElement.querySelectorAll('tr')
            for(let row of rows) row.dispatchEvent(new Event('mouseleave'))
        })

        rawElement.innerHTML = ""
        rawElement.append(labelNode)
        rawElement.append(showDiv)

        details.appendChild(document.createElement('hr'))
        unhide(document.getElementsByClassName('sdnBehaviour').item(4))
    }
}

/* ---------------- BUTTONS BEHAVIOUR ---------------- */

/* ----- edit button ----- */

function changeEditButtonBehaviour() {
    if(this.innerText == 'Edit'){
        setAllEditButtonsDisabled()
        this.classList.add('btn-success')
        this.innerText = 'EDITING'
        this.parentElement.nextElementSibling.style.display = 'block'

        unhide(this.previousElementSibling)
        
        sdnData.setPathOutputDiv(this.parentElement.nextElementSibling)
    
        enablePathSelection()
    } else {
        this.classList.remove('btn-success')
        this.innerText = 'Edit'
        
        hide(this.previousElementSibling)
        
        sdnData.setPathOutputDiv(null)
        
        disableDragging()
    }
}

function setAllEditButtonsDisabled() {
    details.querySelectorAll('#details > div > p button.btn-success')
        .forEach(el => changeEditButtonBehaviour.call(el))
    setAllRemoveButtonsDisabled()
}

/* ----- remove button ----- */

function changeRemoveButtonBehaviour() {
    if(this.innerText == 'Remove...'){
        this.className = "btn-danger"
        this.innerText = "Click to remove"
    
        for (let child of this.parentElement.parentElement.querySelectorAll('tr'))
            child.addEventListener('click', removeMe)
    } else {
        this.classList.remove('btn-danger')
        this.innerText = 'Remove...'
    
        for (let child of this.parentElement.parentElement.querySelectorAll('tr'))
            child.removeEventListener('click', removeMe)
    }
}

function setAllRemoveButtonsDisabled(){
    details.querySelectorAll('#details > div > p button.btn-danger')
        .forEach(el => changeRemoveButtonBehaviour.call(el))
}

function removeMe(){
    this.remove()
    removeNodesSelection()
}