/* -------------------------------------------------------- */
/* --------------------- NODE DETAILS --------------------- */
/* -------------------------------------------------------- */

/* -------------- PACKET RULES -------------- */

function createPacketRule(callback) {
    let modal = document.getElementById('rule-modal')

    let device = document.getElementById('details2').querySelector('h3').innerHTML
    let match = modal.getElementsByTagName('select').item(0).value
    let action = modal.getElementsByTagName('select').item(1).value

    let vals = modal.getElementsByTagName('input')
    let matchVal = vals.item(0).value
    let actionVal = vals.item(1).value
    let priorityVal = vals.item(2).value
    let idleTimeoutVal = vals.item(3).value
    let hardTimeoutVal = vals.item(4).value

    let rule = sdnData.addRule(
        device,
        { match, value: matchVal },
        { action, value: actionVal },
        priorityVal,
        idleTimeoutVal,
        hardTimeoutVal,
        false
    )

    let table = document.getElementById('rules').firstElementChild.lastElementChild
    let tbody = table.lastElementChild
    unhide(table)
    callback(tbody, rule, 'NEW')
    
    hide(document.querySelector('#details2 .disclaimer'))
    close_modal('rule-modal')
}

function showPacketsRules(rules, div, counter) {
    let tbody = div.querySelector('tbody')
    for (let rule of rules)
        appendPacketRule(tbody, rule, counter++)
}

function appendPacketRule(div, rule, counter) {
    let row = div.appendChild(document.createElement('tr'))

    row.appendChild(document.createElement('td')).textContent = counter
    row.appendChild(document.createElement('td')).textContent = rule.match.match + ' ' + rule.match.matchVal
    row.appendChild(document.createElement('td')).textContent = rule.action.action + ' ' + rule.action.actionVal
    row.appendChild(document.createElement('td')).textContent = rule.priority
    row.appendChild(document.createElement('td')).textContent = rule.idleTimeout
    row.appendChild(document.createElement('td')).textContent = rule.hardTimeout
    row.appendChild(document.createElement('td')).textContent = rule.stats
}

/* ------------ LABELS ONLY RULES ------------ */

function showMovingLabelRules(data, reservedSpace, counter) {
    let rulesTableBody = reservedSpace.getElementsByTagName('tbody').item(0)

    for (let labelRule of data) {
        /* -------- CREATE A ROW -------- */
        let ruleRow = rulesTableBody.appendChild(document.createElement('tr'))

        ruleRow.appendChild(document.createElement('td')).appendChild(document.createTextNode(counter++))
        let match = ruleRow.appendChild(document.createElement('td'))
        ruleRow.appendChild(document.createElement('td')).textContent = labelRule.action.action + " " + labelRule.action.value
        ruleRow.appendChild(document.createElement('td')).textContent = labelRule.priority
        ruleRow.appendChild(document.createElement('td')).textContent = labelRule.idleTimeout
        ruleRow.appendChild(document.createElement('td')).textContent = labelRule.hardTimeout
        ruleRow.appendChild(document.createElement('td')).textContent = labelRule.stats

        /* ------- 'Match' column ------- */
        let label = match.appendChild(document.createElement('p'))
        let labelColor = label.appendChild(document.createElement('span'))
        labelColor.className = 'colorTag'
        labelColor.style.backgroundColor = labelRule.match.label.color
        label.appendChild(document.createTextNode(labelRule.match.label.name))
        match.appendChild(document.createElement('hr'))
        match.appendChild(document.createTextNode(labelRule.match.match + " " + labelRule.match.value))
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

    svg.node().style.display = null
}