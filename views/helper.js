function lastElem(arr) {
    return arr[arr.length - 1]
}

function toggle_tab(e, selectedTab) {
    toggle_submenu(-1)
    for (let elem of document.querySelectorAll(".tab-pane")) {
        elem.classList.remove("active")
    }
    for (let elem of document.querySelectorAll(".tab-label")) {
        elem.classList.remove("active")
    }

    let href = selectedTab.getAttribute("href").replace("#", '')
    let currentTab = document.getElementById(href)
    currentTab.classList.add("active")
    
    let rightControls = document.getElementById("right-controls")
    if (href == "home") {
        rightControls.classList.remove("ng-hide")
    } else {
        rightControls.classList.add("ng-hide")
    }
}

function toggle_submenu(number, total = 3) {
    let mock_main_menu = document.getElementById("mock-main-menu")
    let hidden = false
    for (let i = 0; i < total; i++) {
        let current_submenu = document.getElementById("submenu-" + i)
        if (i == number) {
            current_submenu.classList.toggle("ng-hide")
            if(current_submenu.classList.contains("ng-hide")) hidden = true
        } else {
            current_submenu.classList.add("ng-hide")
        }
    }

    if (hidden || number == -1) {
        mock_main_menu.classList.remove("mock-submenu")
    } else {
        mock_main_menu.classList.add("mock-submenu")
    }
}

function close_modal(id) {
	document.getElementById(id).classList.add("ng-hide")
}

function isElectron() {
    return window && window.process && window.process.type
}

function copyLab(e) {
	e.preventDefault()
	
    let script = document.getElementById('sh_script').value
	electron.ipcRenderer.send('script:copy', script, 'script.sh')

    document.getElementById('lstart').classList.remove("disabledLink")
	document.getElementById('lclean').classList.remove("disabledLink")
	
	let hasController = false, hasSwitch = false
	for(let machineType of document.querySelectorAll('#netkit tr p input[data-ng-model="machine.type"]:checked')){
		if(machineType.value == 'controller'){
			hasController = true
		} else if (machineType.value == 'switch'){
			hasSwitch = true
		}
		
		if(hasController && hasSwitch){
			document.getElementById('connect').classList.remove("hidden")
			break
		}
	}
}

function executeStart(e) {
	if(!document.getElementById('lstart').classList.contains('disabledLink')){
		toggle_submenu(-1)
		
		executeGeneric(e, "execute")

		let connectButton = document.getElementById('connect')
		if(!connectButton.classList.contains('hidden'))
			connectButton.classList.remove("disabledLink")
	}
}

function executeClean(e) {
	if(!document.getElementById('lclean').classList.contains('disabledLink')){
		toggle_submenu(-1)
		toggle_tab(null, document.querySelector('[href="#home"]'))

		executeGeneric(e, "clean")
		document.getElementById('connect').classList.add("disabledLink")
	}
}

function executeGeneric(e, command){
    e.preventDefault()
	let modal = document.getElementById("command-modal")
	modal.classList.remove("ng-hide")
	setTimeout(
		() => document.querySelector('#command-modal .modal-footer button').disabled = false,
		2000
	)
	electron.ipcRenderer.send('script:' + command)
}

function attachInterfaceToController(attachButton, detachButton){
	electron.ipcRenderer.send('sdn:connect')
	attachButton.innerText = '...'

	setTimeout(function() {
		attachButton.classList.remove('btn-default')
		attachButton.classList.add('btn-success')
		attachButton.innerText = 'Attached'

		detachButton.classList.remove('hidden')
	}, 3000)
}

function detachInterfaceToController(detachButton, attachButton){
	electron.ipcRenderer.send('sdn:disconnect')
	detachButton.innerText = '...'

	setTimeout(function() {
		detachButton.classList.add('hidden')
		detachButton.innerText = 'Detach'

		attachButton.innerText = 'Attach interface'
		attachButton.classList.remove('btn-success')
		attachButton.classList.add('btn-default')
	}, 3000)
}