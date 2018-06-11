/* --------------------------------------------------- */
/* --------------------- DETAILS --------------------- */
/* --------------------------------------------------- */

function createNewLabel() {
    document.getElementsByClassName('sdnBehaviour').item(3).style.display = 'none'
    let row = d3.create('div')
    row.append('input').attr('placeholder', 'color')
        .attr('type', 'text').attr('pattern', '(#[0-9]{3,6})|([A-z]+)|(rgba?.*)')  // TODO: il pattern rgb(a?) non è completo
    row.append('input').attr('placeholder', 'name')
        .attr('type', 'text').attr('pattern', '[A-z0-9]+')
    row.append('button').text('Add')
        .on('click', function () { createNewDefinedLabel(row.nodes().pop()) })
    row.append('button').text('Ignore')
        .on('click', function () {
            row.remove()
            document.getElementsByClassName('sdnBehaviour').item(3).style.display = null
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

/* ---------------- BUTTONS BEHAVIOUR ---------------- */

/* ----- edit button ----- */
function setActiveStatus() {
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

function setDisabledStatus() {
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

/* ---------------------------------------------------- */
/* --------------------- DETAILS2 --------------------- */
/* ---------------------------------------------------- */

let packetRules = []

function fillRulesSVG() {
    let svg = d3.select('#details2 svg')
    let padding = 10
    let width = svg.attr('width') - (padding + 5)
    let height = svg.attr('height') - padding

    let data = [
        { label: 'label1', stats: 12 },
        { label: 'label2', stats: 5 },
        { label: 'label3', stats: 1 },
        { label: 'label4', stats: 8 },
        { label: 'label5', stats: 16 },
        { label: 'label6', stats: 11 },
        { label: 'label7', stats: 3 },
        { label: 'label8', stats: 5 },
        { label: 'label9', stats: 7 },
        { label: 'label10', stats: 7 },
        { label: 'label11', stats: 12 },
    ]

    let x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0])
    
    let g = svg.append("g")
        .attr("transform", "translate(" + (padding + 10) + ", -" + (padding - 5) + ")")

    x.domain(data.map(function (d) { return d.label }))
    y.domain([0, d3.max(data, function (d) { return d.stats })])

    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (height + 5) + ")")
        .call(d3.axisBottom(x))

    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("stats")

    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr('class', 'bar')
        .attr("x", function (d) { return x(d.label) })
        .attr("y", function (d) { return y(d.stats) })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.stats) })

    svg.node().style.display = null
}

function showPacketsRules(device, reservedSpace) {
    reservedSpace.style.display = null
    let thisDevicePacketRules = packetRules.filter(el => el.device == device)
    if (thisDevicePacketRules.length) {
        let i = 1
        for (let rule of thisDevicePacketRules) {
            showPacketRule(i++, rule.match, rule.matchVal, rule.action, rule.actionVal)
        }
    } else reservedSpace.lastElementChild.style.display = 'none'
    return thisDevicePacketRules.length
}

function createPacketRule() {
    let modal = document.getElementById('rule-modal')
    let match = modal.getElementsByTagName('select').item(0).value
    let action = modal.getElementsByTagName('select').item(1).value
    let matchVal = modal.getElementsByTagName('input').item(0).value
    let actionVal = modal.getElementsByTagName('input').item(1).value

    let device = document.getElementById('details2').firstElementChild.nextElementSibling.innerHTML
    packetRules.push({ device, match, matchVal, action, actionVal }) // TODO: per ora non gestisco la priorità
    showPacketRule('NEW', match, matchVal, action, actionVal)
    close_modal('rule-modal')
}

function showPacketRule(num, match, matchVal, action, actionVal, priorityVal = 1) {
    document.getElementById('details2').lastElementChild.style.display = 'none'
    let table = document.getElementById('rules').firstElementChild.lastElementChild
    table.style.display = null
    let tbody = table.lastElementChild
    let row = tbody.appendChild(document.createElement('tr'))

    row.appendChild(document.createElement('td')).textContent = num
    row.appendChild(document.createElement('td')).textContent = match + ' ' + matchVal
    row.appendChild(document.createElement('td')).textContent = action + ' ' + actionVal
    let priority = row.appendChild(document.createElement('td'))

    let priorityInput = priority.appendChild(document.createElement('input'))
    priorityInput.value = +priorityVal // TODO: per ora non gestisco la priorità
    priorityInput.type = 'number'
    priorityInput.min = 1

    row.appendChild(document.createElement('td')).textContent = '0'
}

function showMovingLabelRules(data, reservedSpace, counter = 1) {
    reservedSpace.style.display = null
    let rulesTableBody = reservedSpace.getElementsByTagName('tbody').item(0)

    for (let labelRule of data) {
        /* -------- CREATE A ROW -------- */
        let ruleRow = rulesTableBody.appendChild(document.createElement('tr'))

        ruleRow.appendChild(document.createElement('td')).appendChild(document.createTextNode(counter++))
        let match = ruleRow.appendChild(document.createElement('td'))
        let action = ruleRow.appendChild(document.createElement('td'))
        let priority = ruleRow.appendChild(document.createElement('td'))
        let stats = ruleRow.appendChild(document.createElement('td'))

        /* ------- 'Match' column ------- */
        let label = match.appendChild(document.createElement('p'))
        let labelColor = label.appendChild(document.createElement('span'))
        labelColor.className = 'colorTag'
        labelColor.style.backgroundColor = labelRule.label.color
        label.appendChild(document.createTextNode(labelRule.label.id))
        match.appendChild(document.createElement('hr'))
        match.appendChild(document.createTextNode(labelRule.match))

        /* ------- Other columns------- */
        action.appendChild(document.createTextNode(labelRule.action))
        priority.appendChild(document.createTextNode(labelRule.priority))
        stats.appendChild(document.createTextNode('0'))
    }
}