function lastElem(arr) {
	return arr[arr.length - 1];
}

function toggle_tab(href) {
	toggle_submenu(-1);

	for (let elem of document.querySelectorAll(".tab-pane")) {
		elem.classList.remove("active");
	}
	for (let elem of document.querySelectorAll(".tab-label")) {
		elem.classList.remove("active");
	}

	let currentTab = document.getElementById(href);
	currentTab.classList.add("active");

	let rightControls = document.getElementById("left-controls");
	if (href == "home") {
		rightControls.classList.remove("ng-hide");
	} else {
		rightControls.classList.add("ng-hide");
	}

	if (href == "home") _toggleActive(0);
	if (href == "graph") _toggleActive(1);
	if (href == "sdn") _toggleActive(5);
}

function _toggleActive (offset){
	let li = document.querySelectorAll("#main-nav > ul.navbar-nav > li");
	for(let i = 0; i < li.length; i++) {
		if(i === offset) li[i].classList.add("active");
		else li[i].classList.remove("active");
	}
}

function toggle_submenu(number) {
	let hidden = false;
	for (let i = 0; i < 3; i++) {
		if (i == number) {
			let current_submenu = document.getElementById("submenu-" + i);
			current_submenu.classList.toggle("ng-hide");
			document.querySelectorAll("#main-nav > ul.navbar-nav > li")[2+i].classList.add("active");
			if(current_submenu.classList.contains("ng-hide")) {
				document.querySelectorAll("#main-nav > ul.navbar-nav > li")[2+i].classList.remove("active");
				hidden = true;
			}
		} else {
			document.querySelectorAll("#main-nav > ul.navbar-nav > li")[2+i].classList.remove("active");
			document.getElementById("submenu-" + i).classList.add("ng-hide");
		}
	}

	let mockMainMenu = document.getElementById("mock-main-menu");
	if (hidden || number == -1) {
		mockMainMenu.classList.remove("mock-submenu");
	} else {
		mockMainMenu.classList.add("mock-submenu");
	}
}

function close_modal(id) {
	document.getElementById(id).classList.add("ng-hide");
}

function isElectron() {
	return window && window.process && window.process.type;
}

function copyLab(){
	let script = document.getElementById("sh_script").value;
	electron.ipcRenderer.send("script:copy", script, "script.sh");
}

function executeStart(e) {
	e.preventDefault();

	if(!document.getElementById("lstart").classList.contains("disabledLink")){
		let sdnTabButton = document.getElementById("connect");

		copyLab();
		toggle_submenu(-1);
		_executeGeneric(e, "execute");

		if (!sdnTabButton.classList.contains("hidden")
			&& document.querySelector("#netkit input[data-ng-model=\"machine.ryu.rest\"]").checked
			&& document.querySelector("#netkit input[data-ng-model=\"machine.ryu.topology\"]").checked)
			sdnTabButton.classList.remove("disabledLink");
	}
}

function executeClean(e) {
	if(!document.getElementById("lclean").classList.contains("disabledLink")){
		toggle_submenu(-1);
		toggle_tab("home");

		_executeGeneric(e, "clean");
		if (!document.getElementById("connect").classList.contains("disabledLink")) {
			document.getElementById("connect").classList.add("disabledLink");
		}
	}
}

function startSDNManager(e){
	let sdnTabButton = document.getElementById("connect");
	if (!sdnTabButton.classList.contains("disabledLink")){
		electron.ipcRenderer.send("sdn:start");
	}
}

function _executeGeneric(e, command) {
	e.preventDefault();
	let modal = document.getElementById("command-modal");
	modal.classList.remove("ng-hide");
	setTimeout(
		() => document.querySelector("#command-modal .modal-footer button").disabled = false,
		2000
	);
	electron.ipcRenderer.send("script:" + command);
}

function setNetworkOptions() {
  let smoothEnabled = document.getElementById("smoothEnabled");
  let smoothType = document.getElementById("smoothType");
  let physicsEnabled = document.getElementById("physicsEnabled");
  let physicsGConstant = document.getElementById("physicsGravitationalConstant");
  document.getElementById("physicsGravitationalConstantValue").value = parseInt(physicsGConstant.value);

  let edges = {}
  let physics = {}

  if (smoothEnabled.checked) {
    edges = {
      smooth: {
        type: smoothType.value
      }
    }
  } else {
    edges = {
      smooth: false
    }
  }

  if (physicsEnabled.checked) {
    physics = {
      enabled: true,
      barnesHut: {
        gravitationalConstant: parseInt(physicsGConstant.value)
      }
    }
  } else {
    physics = {
      enabled: false
    }
  }

  network.setOptions({edges, physics})
}