function removeNodesSelection() {
    document.querySelectorAll("svg .selected")
        .forEach(function (el) { return el.classList.remove("selected", "straight", "reversed"); });
}
/* ----------------------------------------------------------- */
/* ------------------------- BUTTONS ------------------------- */
/* ----------------------------------------------------------- */
function resetButtons() {
    unhide(document.getElementById("b1"), // Bottone per muovere i nodi
    document.getElementById("b4") // Bottone per aggiungere etichette
    );
    hide(document.getElementById("b2") // Bottone per selezionare il path
    );
    disableButtons("b3", // Bottone per rilasciare i nodi
    "b5", // Bottone per inviare le regole al controller
    "b6" // Bottone per ricevere le regole dal controller
    );
}
function togglePathButtons(enable) {
    if (enable)
        enableButtons("b5", "b6");
    else
        disableButtons("b5", "b6");
}
/* ---------------------------------------------------- */
/* --------------------- GENERIC----------------------- */
/* ---------------------------------------------------- */
/**
 * Hides one or more DOM elements
 */
function hide() {
    var elements = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        elements[_i] = arguments[_i];
    }
    for (var _a = 0, elements_1 = elements; _a < elements_1.length; _a++) {
        var el = elements_1[_a];
        el.style.display = "none";
    }
}
/**
 * Removes the 'display:none' attibute to one or more DOM elements
 */
function unhide() {
    var elements = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        elements[_i] = arguments[_i];
    }
    for (var _a = 0, elements_2 = elements; _a < elements_2.length; _a++) {
        var el = elements_2[_a];
        el.style.display = null;
    }
}
function enableButtons() {
    var el_IDs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        el_IDs[_i] = arguments[_i];
    }
    for (var _a = 0, el_IDs_1 = el_IDs; _a < el_IDs_1.length; _a++) {
        var id = el_IDs_1[_a];
        var el = document.getElementById(id);
        el.disabled = false;
    }
}
function disableButtons() {
    var el_IDs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        el_IDs[_i] = arguments[_i];
    }
    for (var _a = 0, el_IDs_2 = el_IDs; _a < el_IDs_2.length; _a++) {
        var id = el_IDs_2[_a];
        var el = document.getElementById(id);
        el.disabled = true;
    }
}
/* ---------------------------------------------------- */
/* -------------------- NON-HTML ---------------------- */
/* ---------------------------------------------------- */
function downloadString(string, filename) {
    var element = document.body.appendChild(document.createElement("a"));
    element.setAttribute("href", "data:text/plaincharset=utf-8," + encodeURIComponent(string));
    element.setAttribute("download", filename);
    element.style.display = "none";
    element.click();
    document.body.removeChild(element);
}
function getQueryParameters() {
    var params = {};
    var qpIndex = document.URL.indexOf("?") + 1;
    if (qpIndex != 0) {
        var pairs = document.URL.substring(qpIndex, document.URL.length).split("&");
        for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
            var pair = pairs_1[_i];
            var _a = pair.split("="), name_1 = _a[0], val = _a[1];
            params[name_1] = val;
        }
    }
    return params;
}
