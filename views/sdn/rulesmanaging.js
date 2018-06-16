function createMatchRepresentation(matches, hasLabel = false){
    if(hasLabel){
        let match = matches[0]
        let cellContents = [
            document.createElement('p'),
            document.createElement('hr'),
            document.createTextNode(match.match + " " + match.value)
        ]
        
        let labelColor = cellContents[0].appendChild(document.createElement('span'))
        cellContents[0].appendChild(document.createTextNode(match.label.name))

        labelColor.className = 'colorTag'
        labelColor.style.backgroundColor = match.label.color

        return cellContents
    } else {
        let len = matches.length
        let cellContents = []
        matches.forEach(function(match, index){
            cellContents.push(document.createTextNode(match.match + " " + match.value))
            if(len > index +1) cellContents.push(document.createElement('hr'))
        })
        return cellContents
    }
}

/* -------------------------------------------------------- */
/* --------------------- NODE DETAILS --------------------- */
/* -------------------------------------------------------- */

/* -------------- PACKET RULES -------------- */

function createPacketRule(callback) {
    let device = document.querySelector('#details2 h3').innerText

    let inputDivs = document.querySelectorAll('#rule-modal .modal-body .half')
    let matchDiv = inputDivs.item(0)
    let actionDiv = inputDivs.item(1)
    let priorityDiv = inputDivs.item(2)
    let idleTimeoutDiv = inputDivs.item(3)
    let hardTimeoutDiv = inputDivs.item(4)

    let matches = []
    for(let i = 3; i < matchDiv.children.length; i += 2){
        matches.push({
            match: matchDiv.children[i].value,
            value: matchDiv.children[i+1].value
        })
    }

    let rule = sdnData.addRule(
        device,
        matches,
        {
            action: actionDiv.lastElementChild.previousElementSibling.value,
            value: actionDiv.lastElementChild.value
        },
        priorityDiv.lastElementChild.value,
        idleTimeoutDiv.lastElementChild.value,
        hardTimeoutDiv.lastElementChild.value,
        0,
        false
    )

    let table = document.getElementById('rules').firstElementChild.lastElementChild
    let tbody = table.lastElementChild
    callback(tbody, rule, 'NEW')
    
    hide(document.querySelector('#details2 .disclaimer'))
    unhide(table)
}

function showPacketsRules(rules, div, counter) {
    let tbody = div.querySelector('tbody')
    for (let rule of rules)
        appendPacketRule(tbody, rule, counter++)
}

function appendPacketRule(div, rule, counter) {
    div.appendChild(
        createRow(
            counter,
            createMatchRepresentation(rule.matches),
            rule.action.action + ' ' + rule.action.value,
            rule.priority, 
            rule.idleTimeout,
            rule.hardTimeout,
            rule.stats
        ).row
    )
}

/* ------------ LABELS ONLY RULES ------------ */

function showMovingLabelRules(data, reservedSpace, counter) {
    let rulesTableBody = reservedSpace.getElementsByTagName('tbody').item(0)

    for (let labelRule of data) {
        rulesTableBody.appendChild(
            createRow(
                counter++,
                createMatchRepresentation(labelRule.matches, true),
                labelRule.action.action + " " + labelRule.action.value,
                labelRule.priority,
                labelRule.idleTimeout,
                labelRule.hardTimeout,
                labelRule.stats
            ).row
        )
    }
}

/* -------------- SVG -------------- */

function fillRulesSVG(rulesData) {
    let svg = d3.select('#details2 svg')
    let padding = 10
    let width = svg.attr('width') - (padding + 5)
    let height = svg.attr('height') - padding

    let counter = 1
    let data = rulesData.map(function(el){ return { num: counter++, stats: el.stats }})

    let x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0])

    let g = svg.append("g")
        .attr("transform", "translate(" + (padding + 10) + ", -" + (padding - 5) + ")")

    x.domain(data.map(function (d) { return d.num }))
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
        .attr("x", function (d) { return x(d.num) })
        .attr("y", function (d) { return y(d.stats) })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.stats) })

    unhide(svg.node())
}