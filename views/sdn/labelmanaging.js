/* ---------------------------------------------------- */
/* ------------------ LABEL CREATION ------------------ */
/* ---------------------------------------------------- */

function createNewLabel() {
    document.getElementsByClassName('sdnBehaviour').item(3).style.display = 'none'
    let row = d3.create('div')
    row.append('input').attr('placeholder', 'color')
        .attr('type', 'text').attr('pattern', '(#[0-9]{3,6})|([A-z]+)|(rgba?.*)')
    row.append('input').attr('placeholder', 'name')
        .attr('type', 'text').attr('pattern', '[A-z0-9]+')
    row.append('button').text('Add')
        .on('click', function () { createNewDefinedLabel(row.nodes().pop()) })
    row.append('button').text('Ignore')
        .on('click', function () {
            row.remove()
            document.getElementsByClassName('sdnBehaviour').item(3)
                .style.display = null
        })
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
        editButton.addEventListener('click', setActiveStatus)

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
        document.getElementsByClassName('sdnBehaviour').item(3).style.display = null
    }
}

/* ---------------- BUTTONS BEHAVIOUR ---------------- */

/* ----- edit button ----- */

function setActiveStatus() {
    setAllEditButtonsDisabled()

    this.classList.add('btn-success')
    this.innerText = 'EDITING'
    this.parentElement.nextElementSibling.style.display = 'block'

    this.previousElementSibling.style.display = null

    sdnData.setPathOutputDiv(this.parentElement.nextElementSibling)

    enablePathSelection()

    let newThis = this.cloneNode(true)
    newThis.addEventListener('click', setDisabledStatus)
    this.parentNode.replaceChild(newThis, this)
}

function setDisabledStatus() {
    this.classList.remove('btn-success')
    this.innerText = 'Edit'

    this.previousElementSibling.style.display = 'none'
    disableRemove.bind(this.previousElementSibling)()

    sdnData.setPathOutputDiv(null)

    disableDragging()

    let newThis = this.cloneNode(true)
    newThis.addEventListener('click', setActiveStatus)
    this.parentNode.replaceChild(newThis, this)
}

function setAllEditButtonsDisabled() {
    details.querySelectorAll('#details > div > p button.btn-success')
        .forEach(el => setDisabledStatus.bind(el)())
}

/* ----- remove button ----- */

function enableRemove() {
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