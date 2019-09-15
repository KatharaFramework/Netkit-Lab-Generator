function lastElem(arr) {
	return arr[arr.length - 1]
}

function toggle_tab(href) {
	toggle_submenu(-1)

	for (let elem of document.querySelectorAll(".tab-pane")) {
		elem.classList.remove("active")
	}
	for (let elem of document.querySelectorAll(".tab-label")) {
		elem.classList.remove("active")
	}

	let currentTab = document.getElementById(href)
	currentTab.classList.add("active")
	
	let rightControls = document.getElementById("left-controls")
	if (href == "home") {
		rightControls.classList.remove("ng-hide")
	} else {
		rightControls.classList.add("ng-hide")
	}

	if (href == "home") _toggleActive(0)
	if (href == "graph") _toggleActive(1)
	if (href == "sdn") _toggleActive(5)
}

function _toggleActive (offset){
	let li = document.querySelectorAll('#main-nav > ul.navbar-nav > li')
	for(let i = 0; i < li.length; i++) {
		if(i === offset) li[i].classList.add('active')
		else li[i].classList.remove('active')
	}
}

function toggle_submenu(number) {
	let hidden = false
	for (let i = 0; i < 3; i++) {
		if (i == number) {
			let current_submenu = document.getElementById("submenu-" + i)
			current_submenu.classList.toggle("ng-hide")
			document.querySelectorAll('#main-nav > ul.navbar-nav > li')[2+i].classList.add('active')
			if(current_submenu.classList.contains("ng-hide")) {
				document.querySelectorAll('#main-nav > ul.navbar-nav > li')[2+i].classList.remove('active')
				hidden = true
			}
		} else {
			document.querySelectorAll('#main-nav > ul.navbar-nav > li')[2+i].classList.remove('active')
			document.getElementById("submenu-" + i).classList.add("ng-hide")
		}
	}
	
	let mockMainMenu = document.getElementById("mock-main-menu")
	if (hidden || number == -1) {
		mockMainMenu.classList.remove("mock-submenu")
	} else {
		mockMainMenu.classList.add("mock-submenu")
	}
}

function close_modal(id) {
	document.getElementById(id).classList.add("ng-hide")
}

function isElectron() {
	return window && window.process && window.process.type
}

function copyLab(){
	let script = document.getElementById('sh_script').value
	electron.ipcRenderer.send('script:copy', script, 'script.sh')
}

function executeStart(e) {
	e.preventDefault()

	if(!document.getElementById('lstart').classList.contains('disabledLink')){
		let connectButton = document.getElementById('connect')
		
		copyLab()
		toggle_submenu(-1)
		executeGeneric(e, "execute")
		
		if(!connectButton.classList.contains('hidden') 
			&& document.querySelector('#netkit input[data-ng-model="machine.ryu.rest"]').checked
			&& document.querySelector('#netkit input[data-ng-model="machine.ryu.topology"]').checked)
			connectButton.classList.remove("disabledLink")
	}
}

function executeClean(e) {
	if(!document.getElementById('lclean').classList.contains('disabledLink')){
		toggle_submenu(-1)
		toggle_tab("home")

		executeGeneric(e, "clean")
		if(!document.getElementById('connect').classList.contains("disabledLink")){
			document.getElementById('connect').classList.add("disabledLink")
			detachInterfaceToController()
		}
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

function attachInterfaceToController(attachButton, detachButton, customIPInput){
	if(!attachButton.classList.contains('btn-success') && attachButton.innerText != '...'){
		customIPInput.style.display = 'none'
	
		electron.ipcRenderer.send('sdn:connect', customIPInput.value)
		attachButton.innerText = '...'
	
		setTimeout(function() {
			attachButton.classList.remove('btn-default')
			attachButton.classList.add('btn-success')
			attachButton.innerText = 'Attached'
	
			detachButton.classList.remove('hidden')
		}, 2000)
	}
}

function detachInterfaceToController(detachButton, attachButton, customIPInput){
	if(!attachButton || !customIPInput || !detachButton){
		let schedaAttachDetach = document.querySelector('#sdn .schede').firstElementChild.lastElementChild
		customIPInput = schedaAttachDetach.firstElementChild.nextElementSibling
		attachButton = customIPInput.nextElementSibling
		detachButton = attachButton.nextElementSibling
	}

	if(!detachButton.classList.contains('hidden') && detachButton.innerText != '...'){
		electron.ipcRenderer.send('sdn:disconnect')
		detachButton.innerText = '...'
	
		setTimeout(function() {
			detachButton.classList.add('hidden')
			detachButton.innerText = 'Detach'
	
			attachButton.innerText = 'Attach interface'
			attachButton.classList.remove('btn-success')
			attachButton.classList.add('btn-default')
	
			customIPInput.style.display = ''
		}, 2000)
	}
}