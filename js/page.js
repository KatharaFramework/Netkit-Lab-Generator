function toggle_tab(event, elem) {
    event.preventDefault();
    var elems = document.getElementsByClassName("tab-pane");
    for(var j in elems) {
        try {
            elems[j].className = elems[j].className.replace("active", '');
        }
        catch(e) { }
    }
    var tab_elems = document.getElementsByClassName("tab-label");
    for(var k in tab_elems) {
        try {
            tab_elems[k].className = tab_elems[k].className.replace("active", '');
        }
        catch(e) { }
    }
    var id = elem.getAttribute("href").replace("#",'');
    var tab_id = "tab-" + elem.getAttribute("href").replace("#",'');
    var tab = document.getElementById(id);
    var label = document.getElementById(tab_id);
    tab.className += " active";
    label.className += " active";
}