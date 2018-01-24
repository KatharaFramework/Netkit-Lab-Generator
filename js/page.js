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
    var href = elem.getAttribute("href").replace("#",'');
    var tab_id = "tab-" + elem.getAttribute("href").replace("#",'');
    var tab = document.getElementById(href);
    tab.className += " active";
    var col1 = document.getElementById("col1");
    var minimap = document.getElementById("minimap");
    var body = document.getElementById("logos");
    if(href == "home") {
        col1.classList.remove("ng-hide");
        minimap.classList.remove("ng-hide");
        body.classList.add("bodypadded");
    }
    else {
        col1.classList.add("ng-hide");
        minimap.classList.add("ng-hide");
        body.classList.remove("bodypadded");
    }
}

function collapseDisclaimer(e) {
    e.preventDefault();
    var disclaimer = document.getElementById("disclaimer");
    disclaimer.classList.add("ng-hide");
    var mock_disclaimer = document.getElementById("mock-disclaimer");
    mock_disclaimer.classList.add("ng-hide");
}

function toggle_submenu(e, number, total) {
    var toggled = false;
    var mock_main_menu = document.getElementById("mock-main-menu");
    for(var i=0; i<total; i++) {
        var current_submenu = document.getElementById("submenu-"+i);
        if(i==number) {
            toggled = true;
            current_submenu.classList.remove("ng-hide");
        }
        else {
            current_submenu.classList.add("ng-hide");
        }
    }
    if(toggled) {
        mock_main_menu.classList.add("mock-submenu");
    }
    else {
        mock_main_menu.classList.remove("mock-submenu");
    }
}

function toggle_tab_and_submenu(event, elem, total_submenus) {
    toggle_submenu(event, -1, total_submenus);
    toggle_tab(event, elem);
}

function close_modal(e){
    e.preventDefault();
    var modal = document.getElementById("command-modal");
    modal.classList.add("ng-hide");
}

function show_modal(){
    var modal = document.getElementById("command-modal");
    modal.classList.remove("ng-hide");
}
