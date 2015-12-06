function makeMachineFolder(nk, lab) {
    for (var mindex in nk) {
        lab["folder"][nk[mindex].name] = "";
    }
    return lab;
}

function makeLabConf(nk, lab) {
    lab["file"]["lab.conf"] = "";
    for (var mindex in nk) {
        for (var i in nk[mindex].interfaces.if) {
            lab["file"]["lab.conf"] += nk[mindex].name + "[" + nk[mindex].interfaces.if[i].eth.number + "]=" + nk[mindex].interfaces.if[i].eth.domain + "\n";
        }
        lab["file"]["lab.conf"] += "\n";
    }
    return lab;
}

function makeStartup(nk, lab) {
    for (var mindex in nk) {
        lab["file"][nk[mindex].name + ".startup"] = "";
    }
    return lab;
}

function makeStaticRouting(nk, lab) {
    // generazione networking e routing statico
    for (var mindex in nk) {

        for (var i in nk[mindex].interfaces.if) {
            //ifconfig eth_ SELFADDRESS/MASK up
            lab["file"][nk[mindex].name + ".startup"] += "ifconfig eth" + nk[mindex].interfaces.if[i].eth.number +
                " " + nk[mindex].interfaces.if[i].ip + " up\n";
        }

        for (var g in nk[mindex].gateways.gw) {
            if (typeof(nk[mindex].gateways.gw[g].gw) != "undefined" && nk[mindex].gateways.gw[g].gw != "") {
                //route add default gw GATEWAY dev eth_
                if (nk[mindex].gateways.gw[g].route == "") {
                    lab["file"][nk[mindex].name + ".startup"] += "route add default gw " +
                        nk[mindex].gateways.gw[g].gw + " dev eth" +
                        nk[mindex].gateways.gw[g].if + "\n";
                }
                //route add -net NETADDRESS/MASK gw GATEADDRESS dev eth_
                else {
                    lab["file"][nk[mindex].name + ".startup"] += "route add -net " + nk[mindex].gateways.gw[g].route + " gw " +
                        nk[mindex].gateways.gw[g].gw + " dev eth" +
                        nk[mindex].gateways.gw[g].if + "\n";
                }
            }
        }
    }

    return lab;
}

function makeTerminal(nk, lab) {
    for (var mindex in nk) {
        // terminale
        if (nk[mindex].type == 'terminale') {
            if (typeof(nk[mindex].pc.ns) != "undefined" && nk[mindex].pc.ns != "") {
                lab["folder"][nk[mindex].name + "/etc"] = "";
                lab["file"][nk[mindex].name + "/etc/resolv.conf"] = "nameserver " + nk[mindex].pc.dns + "\n";
            }
        }
    }
    return lab;
}

function makeWebserver(nk, lab) {
    for (var mindex in nk) {
        if (nk[mindex].type == 'ws') {
            if (nk[mindex].ws.userdir == true) {
                lab["folder"][nk[mindex].name + "/home/guest/public_html"] = "";
                lab["file"][nk[mindex].name + "/home/guest/public_html/index.html"] = '<html><head><title>Guest Home</title></head><body>Guest Home</body></html>';
                lab["file"][nk[mindex].name + ".startup"] += "a2enmod userdir\n";
            }
            lab["file"][nk[mindex].name + ".startup"] += "/etc/init.d/apache2 start\n";
        }
    }
    return lab;
}

function makeNameserver(nk, lab) {
    // generazione file e cartelle comuni
    for (var mindex in nk) {
        // ns
        if (nk[mindex].type == 'ns') {
            lab["file"][nk[mindex].name + ".startup"] += "/etc/init.d/bind start\n";
            lab["folder"][nk[mindex].name + "/etc/bind"] = "";
            lab["file"][nk[mindex].name + "/etc/bind/named.conf"] = "";
        }
    }

    //Gestione Nameserver
    //variabili d'appoggio comuni ai vari cicli
    var authority = [];
    var root;
    //Trovo il root-ns e lo salvo
    for (var mindex in nk) {
        if(nk[mindex].type=="ns" && nk[mindex].ns.authority && nk[mindex].ns.zone == "."){
            root = nk[mindex];
        }
    }
    //Se non ho root-ns evito di generare una configurazione incoerente
    //db.root in ogni macchina dns
    if(typeof(root)!="undefined"){

        for (var mindex in nk) {
            if(nk[mindex].type=='ns'){
                lab["file"][nk[mindex].name + "/etc/bind/db.root"] = "";
                if(nk[mindex].ns.authority && nk[mindex].ns.zone == "."){
                    lab["file"][nk[mindex].name + "/etc/bind/db.root"] += "$TTL   60000\n@    IN SOA "+root.interfaces.if[0].name +
                        " root."+root.interfaces.if[0].name + " 2006031201 28800 14400 3600000 0\n\n";
                }
                if(nk[mindex].ns.recursion){
                    lab["file"][nk[mindex].name + "/etc/bind/named.conf"] += 'options {\n allow-recursion {0/0; };\n};\n\n';
                }
                lab["file"][nk[mindex].name + "/etc/bind/db.root"] += ".    IN NS "+root.interfaces.if[0].name+"\n";
                lab["file"][nk[mindex].name + "/etc/bind/db.root"] += root.interfaces.if[0].name+"    IN A "+root.interfaces.if[0].ip.split("/")[0]+"\n";
                if(nk[mindex].ns.authority && nk[mindex].ns.zone == "."){
                    lab["file"][nk[mindex].name + "/etc/bind/named.conf"] += 'zone "." {\n type master;\n file "/etc/bind/db.root";\n};\n\n';
                } else {
                    lab["file"][nk[mindex].name + "/etc/bind/named.conf"] += 'zone "." {\n type hint;\n file "/etc/bind/db.root";\n};\n\n';
                }
            }
        }
        //entry in db.zona e named.conf per le altre macchine
        for (var mindex in nk) {
            if(nk[mindex].type=="ns" && nk[mindex].ns.authority){
                authority[nk[mindex].ns.zone] = nk[mindex];
                if(nk[mindex].ns.zone != "."){
                    lab["file"][nk[mindex].name + "/etc/bind/db"+nk[mindex].ns.zone.slice(0,-1)] = "$TTL   60000\n@    IN SOA "+nk[mindex].interfaces.if[0].name + " root."+nk[mindex].interfaces.if[0].name + " 2006031201 28800 14400 3600000 0\n\n"; //ho preso il nome dell'interfaccia eth0
                    lab["file"][nk[mindex].name + "/etc/bind/named.conf"] += 'zone "'+nk[mindex].ns.zone.slice(1,-1)+'" {\n type master;\n file "/etc/bind/db'+nk[mindex].ns.zone.slice(0,-1)+'";\n};\n\n';
                }
            }
        }
        //entry per l'alberatura delle zone (. conosce .com, .com conosce pippo.com, ecc)
        for (var mindex in nk) {
            for (var f in nk[mindex].interfaces.if){
                var ip = nk[mindex].interfaces.if[f].ip.split("/")[0];
                if(typeof(nk[mindex].interfaces.if[f].name)!="undefined"){

                    //Caso particolare per ns di primo livello
                    if( (typeof(nk[mindex].ns.zone) != "undefined") && nk[mindex].type=="ns" && nk[mindex].ns.authority && nk[mindex].ns.zone.split(".").length == 3) {
                        lab["file"][authority["."].name + "/etc/bind/db.root"] += nk[mindex].ns.zone.substring(1) + "    IN NS " + nk[mindex].interfaces.if[f].name + "\n";
                        lab["file"][authority["."].name + "/etc/bind/db.root"] += nk[mindex].interfaces.if[f].name + "    IN A " + ip + "\n";
                        lab["file"][nk[mindex].name + "/etc/bind/db"+nk[mindex].ns.zone.slice(0,-1)] += nk[mindex].ns.zone.substring(1) + "    IN NS " + nk[mindex].interfaces.if[f].name + "\n";
                        lab["file"][nk[mindex].name + "/etc/bind/db"+nk[mindex].ns.zone.slice(0,-1)] += nk[mindex].interfaces.if[f].name + "     IN A " + nk[mindex].interfaces.if[f].ip.split("/")[0] + "\n";
                    }
                    else {

                        var nome = nk[mindex].interfaces.if[f].name; //www.pluto.net.
                        var nomediviso = nome.split("."); //[0]www [1]pluto [2]net [3].
                        var a = ".";
                        for (var i = 1; i < nomediviso.length; i++) {
                            if (nomediviso[i] != "") {
                                a += nomediviso[i] + ".";
                            }
                        }

                        if (typeof(authority[a]) != "undefined" && typeof(authority[a].ns.zone) != "undefined") {

                            var fileExt = authority[a].ns.zone.slice(0, -1);

                            //Evito che entri in caso di root-ns
                            if (fileExt != "") {

                                //se è un NS inserisco il glue record
                                if (nk[mindex].type == "ns" && nk[mindex].ns.authority) {
                                    //Creo le linee relative a me stesso nel mio file db
                                    lab["file"][nk[mindex].name + "/etc/bind/db" + nk[mindex].ns.zone.slice(0, -1)] += nk[mindex].ns.zone.substring(1) + "    IN NS " + nk[mindex].interfaces.if[f].name + "\n";
                                    lab["file"][nk[mindex].name + "/etc/bind/db" + nk[mindex].ns.zone.slice(0, -1)] += nk[mindex].interfaces.if[f].name + "    IN A " + nk[mindex].interfaces.if[f].ip.split("/")[0] + "\n";
                                    lab["file"][authority[a].name + "/etc/bind/db" + fileExt] += nk[mindex].ns.zone.substring(1) + "    IN NS " + nk[mindex].interfaces.if[f].name + "\n";
                                }

                                //e poi inserisco anche il record A, altirmenti solo A
                                lab["file"][authority[a].name + "/etc/bind/db" + fileExt] += nk[mindex].interfaces.if[f].name + "    IN A " + ip + "\n";
                            }
                        }
                    }

                }
            }
        }
    }

    return lab;
}

function makeZebraFolders(nk, lab){
    //TODO dopo sposto qui la generazione della cartella e degli script comuni di zebra
}

function makeRouter(nk, lab) {
    // TODO bgpd stuff (file in zebra folder, line in zebra config, stuff in bgpd.conf file)
    // routing dinamico RIP e OSPF
    for (var mindex in nk) {

        if (nk[mindex].type == 'router') {

            if (nk[mindex].routing.rip.en || nk[mindex].routing.ospf.en || nk[mindex].routing.bgp.en) {
                lab["file"][nk[mindex].name + ".startup"] += "/etc/init.d/zebra start\n";
                lab["folder"][nk[mindex].name + "/etc/zebra"] = "";
                lab["file"][nk[mindex].name + "/etc/zebra/daemons"] = "zebra=yes\n";

                lab["file"][nk[mindex].name + "/etc/zebra/zebra.conf"] = "";
                lab["file"][nk[mindex].name + "/etc/zebra/zebra.conf"] += "hostname zebra\n";
                lab["file"][nk[mindex].name + "/etc/zebra/zebra.conf"] += "password zebra\n";
                lab["file"][nk[mindex].name + "/etc/zebra/zebra.conf"] += "enable password zebra\n";
                lab["file"][nk[mindex].name + "/etc/zebra/zebra.conf"] += "\nlog file /var/log/zebra/zebra.log\n";
            }

            
            if (nk[mindex].routing.rip.en) {
                lab["file"][nk[mindex].name + "/etc/zebra/daemons"] += "ripd=yes\n";
                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] = "";

                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "hostname ripd\n";
                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "password zebra\n";
                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "enable password zebra\n";

                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "\n";

                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "router rip\n";

                for (var n in nk[mindex].routing.rip.network)
                    lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "network " + nk[mindex].routing.rip.network[n] + "\n";

                for (var r in nk[mindex].routing.rip.route) {
                    if (typeof(nk[mindex].routing.rip.route[r]) != "undefined" && nk[mindex].routing.rip.route[r] != "")
                        lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "route " + nk[mindex].routing.rip.route[r] + "\n";
                }

                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "\n";
            }

            if (nk[mindex].routing.ospf.en) {
                lab["file"][nk[mindex].name + "/etc/zebra/daemons"] += "ospfd=yes\n";
                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] = "";

                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "hostname ospfd\n";
                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "password zebra\n";
                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "enable password zebra\n";

                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "\n";

                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "router ospf\n";

                for (var m in nk[mindex].routing.ospf.network) {
                    lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "network " + nk[mindex].routing.ospf.network[m] + " area " + nk[mindex].routing.ospf.area[m] + "\n";
                    if (nk[mindex].routing.ospf.stub[m]) {
                        lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "area " + nk[mindex].routing.ospf.area[m] + " stub\n";
                    }
                }
                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "\n";
            }

            if (nk[mindex].routing.bgp.en) {
                makeBgpConfiguration(nk[mindex], lab);
            }

            //nb: mantenere l'ordine
            if (nk[mindex].routing.rip.en && nk[mindex].routing.rip.connected) {
                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "redistribute connected\n";
            }

            if (nk[mindex].routing.ospf.en && nk[mindex].routing.ospf.connected) {
                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "redistribute connected\n";
            }

            if (nk[mindex].routing.rip.en && nk[mindex].routing.rip.ospf) {
                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "redistribute ospf\n";
            }
            if (nk[mindex].routing.rip.en && nk[mindex].routing.rip.bgp) {
                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "redistribute bgp\n";
            }

            if (nk[mindex].routing.ospf.en && nk[mindex].routing.ospf.rip) {
                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "redistribute rip\n";
            }
            if (nk[mindex].routing.ospf.en && nk[mindex].routing.ospf.bgp) {
                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "redistribute bgp\n";
            }

            //nb: i costi vanno qui alla fine
            if (nk[mindex].routing.ospf.en) {
                for (var face in nk[mindex].routing.ospf.if) {
                    if (nk[mindex].routing.ospf.if[face].cost != "" && typeof(nk[mindex].routing.ospf.if[face].cost) != "undefined") {
                        lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "interface eth" + nk[mindex].routing.ospf.if[face].interface + "\n";
                        lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "ospf cost " + nk[mindex].routing.ospf.if[face].cost + "\n";
                    }
                }
            }

            //nb: e infine i log
            if (nk[mindex].routing.rip.en) {
                lab["file"][nk[mindex].name + "/etc/zebra/ripd.conf"] += "\nlog file /var/log/zebra/ripd.log\n";
            }

            if (nk[mindex].routing.ospf.en) {
                lab["file"][nk[mindex].name + "/etc/zebra/ospfd.conf"] += "\nlog file /var/log/zebra/ospfd.log\n";
            }
        }
    }

    return lab;
}

function makeBgpConfiguration(router, lab){
    
    lab["file"][router.name + "/etc/zebra/daemons"] += "bgpd=yes\n";
    lab["file"][router.name + "/etc/zebra/bgpd.conf"] = "";

    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "hostname bgpd\n";
    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "password zebra\n";
    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "enable password zebra\n";

    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "\n";

    // Inserimento nome AS
    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "router bgp " + router.routing.bgp.as + "\n\n";

    // Inserimento tutte le Network su cui annunciare BGP
    for (var n in router.routing.bgp.network) {
        lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "network " + router.routing.bgp.network[n] + "\n";
    }

    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "\n";

    //Inserisco tutti i Neibourgh
    for (var r in router.routing.bgp.remote) {
        if (typeof(router.routing.bgp.remote[r]) != "undefined" && router.routing.bgp.remote[r].neighbor != "" && router.routing.bgp.remote[r].as != "") {
            //Aggiungo il remote-as
            lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "neighbor " + router.routing.bgp.remote[r].neighbor + " remote-as " + router.routing.bgp.remote[r].as + "\n";
            
            //Aggiungo la descrizione
            if(typeof(router.routing.bgp.remote[r].description) != "undefined" && router.routing.bgp.remote[r].description != ""){
                lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "neighbor " + router.routing.bgp.remote[r].neighbor + " description " + router.routing.bgp.remote[r].description + "\n";
            }
            
            //Aggiungo la prefix in
            if(typeof(router.routing.bgp.remote[r].prefix_in) != "undefined" && router.routing.bgp.remote[r].prefix_in!=""){
               lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "neighbor " + router.routing.bgp.remote[r].neighbor + " prefix-list " + router.routing.bgp.remote[r].prefix_in + " in\n";
            }

            //Aggiungo la prefix out
            if(typeof(router.routing.bgp.remote[r].prefix_in) != "undefined" && router.routing.bgp.remote[r].prefix_out!=""){
               lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "neighbor " + router.routing.bgp.remote[r].neighbor + " prefix-list " + router.routing.bgp.remote[r].prefix_out + " out\n";
            }

        }
    }

    //Inserisco le prefix lists
    for(var p in router.routing.bgp.p_list) {
        if(typeof(router.routing.bgp.p_list[p])!="undefined" && router.routing.bgp.p_list[p].name != "") {
            for (var prule in router.routing.bgp.p_list[p].rules){
                if(typeof(router.routing.bgp.p_list[p].rules[prule])!="undefined" && router.routing.bgp.p_list[p].rules[prule] != "") {
                    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "ip prefix-list " + router.routing.bgp.p_list[p].name + " " + router.routing.bgp.p_list[p].rules[prule] + "\n";
                }
            }   
        }
    }

    //Aggiungo cazzatelle
    /*
    route-map dontUseMe permit 10
    set as-path prepend  20 20 20 
    */

    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "\nlog file /var/log/zebra/bgpd.log\n\n";
    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "debug bgp\ndebug bgp events\ndebug bgp filters\ndebug bgp fsm\ndebug bgp keepalives\ndebug bgp updates";

    lab["file"][router.name + "/etc/zebra/bgpd.conf"] += "\n";

}

function makeFileStructure(nk) {
    var lab = [];
    lab["folder"] = [];
    lab["file"] = [];
    lab["warning"] = 0;
    lab["error"] = 0;

    makeMachineFolder(nk, lab);
    makeLabConf(nk, lab);
    makeStartup(nk, lab);
    makeStaticRouting(nk, lab);
    makeTerminal(nk, lab);
    makeRouter(nk, lab);
    makeWebserver(nk, lab);
    makeNameserver(nk, lab);

    return lab;
}

function makeScript(lab){
    var text="";
    text += "# Ricordati di usare prima 'chmod +x' (o 'chmod 500') sullo script per renderlo eseguibile. Lo script si autodistrugge al termine\n";
    text += "\n";
    text += "#! /bin/sh\n";
    for(var folderName in lab["folder"]){
        text += "mkdir -p " + folderName + "\n";
    }
    for(var fileName in lab["file"]){
        text += "touch " + fileName + "\n";
        var lines = lab["file"][fileName].split("\n");
        for(var lineIndex in lines) {
            text += "echo '" + lines[lineIndex] + "' >> " + fileName + "\n";
        }
    }
    text += "rm $0\n";

    return text;
}

function makeZip(lab){
    var zip = new JSZip();

    for(var folderName in lab["folder"]){
        zip.folder(folderName);
    }
    for(var fileName in lab["file"]){
        zip.file(fileName, lab["file"][fileName]);
    }
    var content = zip.generate({type:"blob"});
    saveAs(content, "lab.zip");
}