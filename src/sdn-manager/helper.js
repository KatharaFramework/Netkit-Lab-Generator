function toggleSecondaryTopbar() {
	let secondaryTopbar = document.getElementById("secondaryTopbar");
	if (!secondaryTopbar.style.zIndex) {
		secondaryTopbar.style.top = "5rem";
		secondaryTopbar.style.zIndex = "1";
	} else {
		secondaryTopbar.style.top = null;
		secondaryTopbar.style.zIndex = null;
	}
}

function hide(...element) {
	element.forEach(el => el.style.display = "none")
}

function unhide(...element) {
	element.forEach(el => el.style.display = null)
}

function enableButtons(...ids) {
	ids.forEach(id => document.getElementById(id).disabled = false)
}

function disableButtons(...ids) {
	ids.forEach(id => document.getElementById(id).disabled = true)
}

function downloadString(string, filename) {
	let element = document.body.appendChild(document.createElement("a"));
	element.setAttribute("href", "data:text/plaincharset=utf-8," + encodeURIComponent(string));
	element.setAttribute("download", filename);
	element.style.display = "none";
	element.click();
	document.body.removeChild(element);
}
