function makeMachineFolder(netkit, lab) {
    for (let machineIndex in netkit) {
        lab["folder"][netkit[machineIndex].name] = "";
    }
    return lab;
}

function addLabInfo(info, lab) {
    if (info) {
        lab.file["lab.conf"] = "";
        if (info.description && info.description != "")
            lab.file["lab.conf"] += 'LAB_DESCRIPTION="' + info.description + '"\n';
        if (info.version && info.version != "")
            lab.file["lab.conf"] += 'LAB_VERSION="' + info.version + '"\n';
        if (info.author && info.author != "")
            lab.file["lab.conf"] += 'LAB_AUTHOR="' + info.author + '"\n';
        if (info.email && info.email != "")
            lab.file["lab.conf"] += 'LAB_EMAIL="' + info.email + '"\n';
        if (info.web && info.web != "")
            lab.file["lab.conf"] += 'LAB_WEB="' + info.web + '"\n';
    }
}

function makeLabConf(netkit, lab) {
    if (!lab.file["lab.conf"] || lab.file["lab.conf"] == "")
        lab.file["lab.conf"] = "";
    for (let machineIndex in netkit) {
        for (let i in netkit[machineIndex].interfaces.if) {
            if (netkit[machineIndex].interfaces.if[i].eth.domain && netkit[machineIndex].interfaces.if[i].eth.domain != "")
                lab.file["lab.conf"] += netkit[machineIndex].name + "[" + netkit[machineIndex].interfaces.if[i].eth.number + "]=" + netkit[machineIndex].interfaces.if[i].eth.domain + "\n";
        }
        if (lab.file["lab.conf"] != "")
            lab.file["lab.conf"] += "\n";
    }
    return lab;
}

function makeStartup(netkit, lab) {
    for (let machineIndex in netkit) {
        if (netkit[machineIndex].name && netkit[machineIndex].name != "")
            lab.file[netkit[machineIndex].name + ".startup"] = "";
    }
    return lab;
}

function makeStaticRouting(netkit, lab) {
    // generazione networking e routing statico
    for (let machineIndex in netkit) {
        if (netkit[machineIndex].name && netkit[machineIndex].name != "") {
            for (let interfaceIndex in netkit[machineIndex].interfaces.if) {
                //ifconfig eth_ SELFADDRESS/MASK up
                if ((netkit[machineIndex].interfaces.if[interfaceIndex].eth.domain)  && netkit[machineIndex].interfaces.if[interfaceIndex].eth.domain != "")
                    lab.file[netkit[machineIndex].name + ".startup"] += "ifconfig eth" + netkit[machineIndex].interfaces.if[interfaceIndex].eth.number +
                        (((netkit[machineIndex].interfaces.if[interfaceIndex].ip)  && netkit[machineIndex].interfaces.if[interfaceIndex].ip != "") ? " " + netkit[machineIndex].interfaces.if[interfaceIndex].ip : "") +
                        " up\n";
            }

            for (let g in netkit[machineIndex].gateways.gw) {
                if ((netkit[machineIndex].gateways.gw[g].gw)  && netkit[machineIndex].gateways.gw[g].gw != "") {
                    //route add default gw GATEWAY dev eth_
                    if (netkit[machineIndex].gateways.gw[g].route == "") {
                        lab.file[netkit[machineIndex].name + ".startup"] += "route add default gw " +
                            netkit[machineIndex].gateways.gw[g].gw + " dev eth" +
                            netkit[machineIndex].gateways.gw[g].if + "\n";
                    }
                    //route add -net NETADDRESS/MASK gw GATEADDRESS dev eth_
                    else {
                        lab.file[netkit[machineIndex].name + ".startup"] += "route add -net " + netkit[machineIndex].gateways.gw[g].route + " gw " +
                            netkit[machineIndex].gateways.gw[g].gw + " dev eth" +
                            netkit[machineIndex].gateways.gw[g].if + "\n";
                    }
                }
            }

            if ((netkit[machineIndex].interfaces.free)  && netkit[machineIndex].interfaces.free != "")
                lab.file[netkit[machineIndex].name + ".startup"] += "\n" + netkit[machineIndex].interfaces.free + "\n";
        }
    }

    return lab;
}

function makeTerminal(netkit, lab) {
    for (let machineIndex in netkit) {
        if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "") {
            if (netkit[machineIndex].type == 'terminal') {
                if ((netkit[machineIndex].pc.dns)  && netkit[machineIndex].pc.dns != "-") {
                    lab["folder"][netkit[machineIndex].name + "/etc"] = "";
                    lab.file[netkit[machineIndex].name + "/etc/resolv.conf"] = "nameserver " + netkit[machineIndex].pc.dns + "\n";
                }
            }
        }
    }
    return lab;
}

function makeWebserver(netkit, lab) {
    for (let machineIndex in netkit) {
        if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "")
            if (netkit[machineIndex].type == 'ws') {
                if (netkit[machineIndex].ws.userdir == true) {
                    lab["folder"][netkit[machineIndex].name + "/home/guest/public_html"] = "";
                    lab.file[netkit[machineIndex].name + "/home/guest/public_html/index.html"] = '<html><head><title>Guest Home</title></head><body>Guest Home</body></html>';
                    lab.file[netkit[machineIndex].name + ".startup"] += "a2enmod userdir\n";
                }
                lab.file[netkit[machineIndex].name + ".startup"] += "/etc/init.d/apache2 start\n";
            }
    }
    return lab;
}

function makeOther(netkit, lab) {
    for (let machineIndex in netkit) {
        if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "") {
            if (netkit[machineIndex].type == 'other') {
                if ((netkit[machineIndex].other.image) ) {
                    // TODO
                    lab.file["lab.conf"] += netkit[machineIndex].name + "[image]=" + netkit[machineIndex].other.image + "\n";
                    for (let findex in netkit[machineIndex].other.files) {
                        lab.file["/etc/scripts/" + netkit[machineIndex].other.files[findex].name] = netkit[machineIndex].other.files[findex].contents;
                    }
                }
            }
        }
    }
    return lab;
}

function makeNameserver(netkit, lab) {
    // generazione file e cartelle comuni
    for (let machineIndex in netkit) {
        if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "")
            if (netkit[machineIndex].type == 'ns') {
                lab.file[netkit[machineIndex].name + ".startup"] += "/etc/init.d/bind start\n";
                lab["folder"][netkit[machineIndex].name + "/etc/bind"] = "";
                lab.file[netkit[machineIndex].name + "/etc/bind/named.conf"] = "";
            }
    }

    //Gestione Nameserver
    //variabili d'appoggio comuni ai vari cicli
    var authority = [];
    var nsroot;
    //Trovo il root-ns e lo salvo
    for (let machineIndex in netkit) {
        if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "")
            if (netkit[machineIndex].type == "ns" && netkit[machineIndex].ns.authority && netkit[machineIndex].ns.zone == ".") {
                nsroot = netkit[machineIndex];
            }
    }
    //Se non ho root-ns evito di generare una configurazione incoerente
    //db.root in ogni macchina dns
    if ((nsroot) ) {

        for (let machineIndex in netkit) {
            if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "") {
                if (netkit[machineIndex].type == 'ns') {
                    lab.file[netkit[machineIndex].name + "/etc/bind/db.root"] = "";
                    if (netkit[machineIndex].ns.authority && netkit[machineIndex].ns.zone == ".") {
                        lab.file[netkit[machineIndex].name + "/etc/bind/db.root"] += "$TTL   60000\n@    IN SOA " + nsroot.interfaces.if[0].name +
                            " root." + nsroot.interfaces.if[0].name + " 2006031201 28800 14400 3600000 0\n\n";
                    }
                    if (netkit[machineIndex].ns.recursion) {
                        lab.file[netkit[machineIndex].name + "/etc/bind/named.conf"] += 'options {\n allow-recursion {0/0; };\n};\n\n';
                    }
                    lab.file[netkit[machineIndex].name + "/etc/bind/db.root"] += ".    IN NS " + nsroot.interfaces.if[0].name + "\n";
                    lab.file[netkit[machineIndex].name + "/etc/bind/db.root"] += nsroot.interfaces.if[0].name + "    IN A " + nsroot.interfaces.if[0].ip.split("/")[0] + "\n";
                    if (netkit[machineIndex].ns.authority && netkit[machineIndex].ns.zone == ".") {
                        lab.file[netkit[machineIndex].name + "/etc/bind/named.conf"] += 'zone "." {\n type master;\n file "/etc/bind/db.root";\n};\n\n';
                    } else {
                        lab.file[netkit[machineIndex].name + "/etc/bind/named.conf"] += 'zone "." {\n type hint;\n file "/etc/bind/db.root";\n};\n\n';
                    }
                }
            }

        }
        //entry in db.zona e named.conf per le altre macchine
        for (let machineIndex in netkit) {
            if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "")
                if (netkit[machineIndex].type == "ns" && netkit[machineIndex].ns.authority) {
                    authority[netkit[machineIndex].ns.zone] = netkit[machineIndex];
                    if (netkit[machineIndex].ns.zone != ".") {
                        lab.file[netkit[machineIndex].name + "/etc/bind/db" + netkit[machineIndex].ns.zone.slice(0, -1)] = "$TTL   60000\n@    IN SOA " + netkit[machineIndex].interfaces.if[0].name + " root." + netkit[machineIndex].interfaces.if[0].name + " 2006031201 28800 14400 3600000 0\n\n"; //ho preso il nome dell'interfaccia eth0
                        lab.file[netkit[machineIndex].name + "/etc/bind/named.conf"] += 'zone "' + netkit[machineIndex].ns.zone.slice(1, -1) + '" {\n type master;\n file "/etc/bind/db' + netkit[machineIndex].ns.zone.slice(0, -1) + '";\n};\n\n';
                    }
                }
        }
        //console.log(authority);
        //entry per l'alberatura delle zone (. conosce .com, .com conosce pippo.com, ecc)
        for (let machineIndex in netkit) {
            if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "")
                for (let f in netkit[machineIndex].interfaces.if) {
                    var ip;
                    if ((netkit[machineIndex].interfaces.if[f].ip) ) {
                        ip = netkit[machineIndex].interfaces.if[f].ip.split("/")[0];
                    }
                    if ((netkit[machineIndex].interfaces.if[f].name) ) { //Entrano tutte le interfacce di tutte le macchine con un nome ns

                        //Caso particolare per ns di primo livello
                        if (((netkit[machineIndex].ns.zone) ) && netkit[machineIndex].type == "ns" && netkit[machineIndex].ns.authority && netkit[machineIndex].ns.zone.split(".").length == 3) {
                            lab.file[authority["."].name + "/etc/bind/db.root"] += netkit[machineIndex].ns.zone.substring(1) + "    IN NS " + netkit[machineIndex].interfaces.if[f].name + "\n";
                            lab.file[authority["."].name + "/etc/bind/db.root"] += netkit[machineIndex].interfaces.if[f].name + "    IN A " + ip + "\n";
                            lab.file[netkit[machineIndex].name + "/etc/bind/db" + netkit[machineIndex].ns.zone.slice(0, -1)] += netkit[machineIndex].ns.zone.substring(1) + "    IN NS " + netkit[machineIndex].interfaces.if[f].name + "\n";
                            lab.file[netkit[machineIndex].name + "/etc/bind/db" + netkit[machineIndex].ns.zone.slice(0, -1)] += netkit[machineIndex].interfaces.if[f].name + "     IN A " + netkit[machineIndex].interfaces.if[f].ip.split("/")[0] + "\n";
                        }
                        else {

                            var nome = netkit[machineIndex].interfaces.if[f].name; //www.pluto.net.
                            var nomediviso = nome.split("."); //[0]www [1]pluto [2]net [3].
                            var a = ".";

                            //Questo for toglie il primo pezzo www.pluto.net. => pluto.net.
                            for (let i = 1; i < nomediviso.length; i++) {
                                if (nomediviso[i] != "") {
                                    a += nomediviso[i] + ".";
                                }
                            }

                            if ((authority[a]) != "undefined" && typeof (authority[a].ns.zone) ) {

                                var fileExt = authority[a].ns.zone.slice(0, -1);

                                //Evito che entri in caso di root-ns
                                if (fileExt != "") {

                                    //se è un NS inserisco il glue record
                                    if (netkit[machineIndex].type == "ns" && netkit[machineIndex].ns.authority) {
                                        //Creo le linee relative a me stesso nel mio file db
                                        var aSup = ".";
                                        var nomediviso2 = authority[a].ns.zone.split(".");

                                        //Questo for toglie il primo pezzo .www.pluto.net. => pluto.net.
                                        for (let i = 2; i < nomediviso2.length; i++) {
                                            if (nomediviso2[i] != "") {
                                                aSup += nomediviso2[i] + ".";
                                            }
                                        }

                                        lab.file[authority[aSup].name + "/etc/bind/db" + authority[aSup].ns.zone.slice(0, -1)] += netkit[machineIndex].ns.zone.substring(1) + "    IN NS " + netkit[machineIndex].interfaces.if[f].name + "\n";
                                        lab.file[authority[aSup].name + "/etc/bind/db" + authority[aSup].ns.zone.slice(0, -1)] += netkit[machineIndex].interfaces.if[f].name + "    IN A " + netkit[machineIndex].interfaces.if[f].ip.split("/")[0] + "\n";
                                        lab.file[authority[a].name + "/etc/bind/db" + fileExt] += netkit[machineIndex].ns.zone.substring(1) + "    IN NS " + netkit[machineIndex].interfaces.if[f].name + "\n";
                                    }

                                    //e poi inserisco anche il record A, altirmenti solo A
                                    lab.file[authority[a].name + "/etc/bind/db" + fileExt] += netkit[machineIndex].interfaces.if[f].name + "    IN A " + ip + "\n";
                                }
                            }
                        }

                    }
                }
        }
    }

    return lab;
}

function makeBgpConf(router, lab) {

    lab.file[router.name + "/etc/zebra/daemons"] += "bgpd=yes\n";
    lab.file[router.name + "/etc/zebra/bgpd.conf"] = "";

    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "hostname bgpd\n";
    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "password zebra\n";
    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "enable password zebra\n";

    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "\n";

    // Inserimento nome AS
    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "router bgp " + router.routing.bgp.as + "\n\n";

    // Inserimento tutte le Network su cui annunciare BGP
    for (let n in router.routing.bgp.network) {
        if ((router.routing.bgp.network[n])  && router.routing.bgp.network[n] != "") {
            lab.file[router.name + "/etc/zebra/bgpd.conf"] += "network " + router.routing.bgp.network[n] + "\n";
        }
    }

    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "\n";

    //Inserisco tutti i Neibourgh
    for (let r in router.routing.bgp.remote) {
        if ((router.routing.bgp.remote[r])  && router.routing.bgp.remote[r].neighbor != "" && router.routing.bgp.remote[r].as != "") {
            //Aggiungo il remote-as
            lab.file[router.name + "/etc/zebra/bgpd.conf"] += "neighbor " + router.routing.bgp.remote[r].neighbor + " remote-as " + router.routing.bgp.remote[r].as + "\n";

            //Aggiungo la descrizione
            if ((router.routing.bgp.remote[r].description)  && router.routing.bgp.remote[r].description != "") {
                lab.file[router.name + "/etc/zebra/bgpd.conf"] += "neighbor " + router.routing.bgp.remote[r].neighbor + " description " + router.routing.bgp.remote[r].description + "\n";
            }
        }
    }
    //Free conf
    if ((router.routing.bgp.free)  && router.routing.bgp.free != "")
        lab.file[router.name + "/etc/zebra/bgpd.conf"] += "\n" + router.routing.bgp.free + "\n";
    //

    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "\nlog file /var/log/zebra/bgpd.log\n\n";
    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "debug bgp\ndebug bgp events\ndebug bgp filters\ndebug bgp fsm\ndebug bgp keepalives\ndebug bgp updates";

    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "\n";

}


function makeRouter(netkit, lab) {
    // routing dinamico RIP e OSPF
    for (let machineIndex in netkit) {
        if ((netkit[machineIndex].name)  && netkit[machineIndex].name != "")
            if (netkit[machineIndex].type == 'router') {

                if (netkit[machineIndex].routing.rip.en || netkit[machineIndex].routing.ospf.en || netkit[machineIndex].routing.bgp.en) {
                    lab.file[netkit[machineIndex].name + ".startup"] += "/etc/init.d/zebra start\n";
                    lab["folder"][netkit[machineIndex].name + "/etc/zebra"] = "";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/daemons"] = "zebra=yes\n";

                    lab.file[netkit[machineIndex].name + "/etc/zebra/zebra.conf"] = "";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/zebra.conf"] += "hostname zebra\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/zebra.conf"] += "password zebra\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/zebra.conf"] += "enable password zebra\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/zebra.conf"] += "\nlog file /var/log/zebra/zebra.log\n";
                }


                if (netkit[machineIndex].routing.rip.en) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/daemons"] += "ripd=yes\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] = "";

                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "hostname ripd\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "password zebra\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "enable password zebra\n";

                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "\n";

                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "router rip\n";

                    for (let n in netkit[machineIndex].routing.rip.network)
                        lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "network " + netkit[machineIndex].routing.rip.network[n] + "\n";

                    for (let r in netkit[machineIndex].routing.rip.route) {
                        if ((netkit[machineIndex].routing.rip.route[r])  && netkit[machineIndex].routing.rip.route[r] != "")
                            lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "route " + netkit[machineIndex].routing.rip.route[r] + "\n";
                    }

                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "\n";
                }

                if (netkit[machineIndex].routing.ospf.en) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/daemons"] += "ospfd=yes\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] = "";

                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "hostname ospfd\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "password zebra\n";
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "enable password zebra\n";

                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "\n";

                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "router ospf\n";

                    for (let m in netkit[machineIndex].routing.ospf.network) {
                        lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "network " + netkit[machineIndex].routing.ospf.network[m] + " area " + netkit[machineIndex].routing.ospf.area[m] + "\n";
                        if (netkit[machineIndex].routing.ospf.stub[m]) {
                            lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "area " + netkit[machineIndex].routing.ospf.area[m] + " stub\n";
                        }
                    }
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "\n";
                }

                if (netkit[machineIndex].routing.bgp.en) {
                    makeBgpConf(netkit[machineIndex], lab);
                }

                //nb: mantenere l'ordine
                if (netkit[machineIndex].routing.rip.en && netkit[machineIndex].routing.rip.connected) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "redistribute connected\n";
                }

                if (netkit[machineIndex].routing.ospf.en && netkit[machineIndex].routing.ospf.connected) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "redistribute connected\n";
                }

                if (netkit[machineIndex].routing.rip.en && netkit[machineIndex].routing.rip.ospf) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "redistribute ospf\n";
                }
                if (netkit[machineIndex].routing.rip.en && netkit[machineIndex].routing.rip.bgp) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "redistribute bgp\n";
                }

                if (netkit[machineIndex].routing.ospf.en && netkit[machineIndex].routing.ospf.rip) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "redistribute rip\n";
                }
                if (netkit[machineIndex].routing.ospf.en && netkit[machineIndex].routing.ospf.bgp) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "redistribute bgp\n";
                }

                //nb: i costi vanno qui alla fine
                if (netkit[machineIndex].routing.ospf.en) {
                    for (let face in netkit[machineIndex].routing.ospf.if) {
                        if (netkit[machineIndex].routing.ospf.if[face].cost != "" && (netkit[machineIndex].routing.ospf.if[face].cost) ) {
                            lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "interface eth" + netkit[machineIndex].routing.ospf.if[face].interface + "\n";
                            lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "ospf cost " + netkit[machineIndex].routing.ospf.if[face].cost + "\n";
                        }
                    }
                }

                //Free conf
                if (netkit[machineIndex].routing.ospf.en) {
                    if ((netkit[machineIndex].routing.ospf.free)  && netkit[machineIndex].routing.ospf.free != "")
                        lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "\n" + netkit[machineIndex].routing.ospf.free + "\n";
                }
                if (netkit[machineIndex].routing.rip.en) {
                    if ((netkit[machineIndex].routing.rip.free)  && netkit[machineIndex].routing.rip.free != "")
                        lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "\n" + netkit[machineIndex].routing.rip.free + "\n";
                }
                //

                //nb: e infine i log
                if (netkit[machineIndex].routing.rip.en) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ripd.conf"] += "\nlog file /var/log/zebra/ripd.log\n";
                }

                if (netkit[machineIndex].routing.ospf.en) {
                    lab.file[netkit[machineIndex].name + "/etc/zebra/ospfd.conf"] += "\nlog file /var/log/zebra/ospfd.log\n";
                }
            }
    }

    return lab;
}

function makeFileStructure(netkit, labInfo) {
    var lab = [];
    lab["folder"] = [];
    lab.file = [];
    lab["warning"] = 0;
    lab["error"] = 0;

    addLabInfo(labInfo, lab);

    makeMachineFolder(netkit, lab);
    makeLabConf(netkit, lab);
    makeStartup(netkit, lab);
    makeStaticRouting(netkit, lab);
    makeTerminal(netkit, lab);
    makeRouter(netkit, lab);
    makeWebserver(netkit, lab);
    makeNameserver(netkit, lab);
    makeOther(netkit, lab);

    if (labInfo.toggle == "disable") {
        makeGraph(netkit);
    }

    return lab;
}

function makeScript(lab) {
    var text = "";
    text += "#! /bin/sh\n";
    text += "# Remember to use 'chmod +x' (o 'chmod 500') on the .sh file. The script will self-destruct\n";
    text += "\n";
    text += 'rm -rf "$(dirname "$0")/lab"\n';
    text += 'mkdir "$(dirname "$0")/lab"\n';
    text += 'cd "$(dirname "$0")/lab"\n';
    text += "\n";
    for (let folderName in lab["folder"]) {
        text += "mkdir -p " + folderName + "\n";
    }
    for (let fileName in lab.file) {
        text += "touch " + fileName + "\n";
        var lines = lab.file[fileName].split("\n");
        for (let lineIndex in lines) {
            text += "echo '" + lines[lineIndex] + "' >> " + fileName + "\n";
        }
    }
    text += "rm \"$0\"\n";

    return text;
}

function makeZip(lab) {
    var zip = new JSZip();

    for (let folderName in lab["folder"]) {
        zip.folder(folderName);
    }
    for (let fileName in lab.file) {
        zip.file(fileName, lab.file[fileName]);
    }
    var content = zip.generate({ type: "blob" });
    saveAs(content, "lab.zip");
}

function makeGraph(netkit) {
    var graph = generate_nodes_edges(netkit);
    //console.log(graph);
    draw(graph.nodes, graph.edges);
}