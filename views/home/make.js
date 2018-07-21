function makeMachineFolders(netkit, lab) {
    for (let machine of netkit)
        lab.folders.push(machine.name)
}

function makeStartupFiles(netkit, lab) {
    for (let machine of netkit) {
        if (machine.name && machine.name != "")
            lab.file[machine.name + ".startup"] = ""
    }
}

/* -------------------------------------------------- */
/* -------------------- LAB CONF -------------------- */
/* -------------------------------------------------- */

function makeLabInfo(info, lab) {
    if (info) {
        lab.file["lab.conf"] = ""
        if (info.description && info.description != "")
            lab.file["lab.conf"] += 'LAB_DESCRIPTION="' + info.description + '"\n'
        if (info.version && info.version != "")
            lab.file["lab.conf"] += 'LAB_VERSION="' + info.version + '"\n'
        if (info.author && info.author != "")
            lab.file["lab.conf"] += 'LAB_AUTHOR="' + info.author + '"\n'
        if (info.email && info.email != "")
            lab.file["lab.conf"] += 'LAB_EMAIL="' + info.email + '"\n'
        if (info.web && info.web != "")
			lab.file["lab.conf"] += 'LAB_WEB="' + info.web + '"\n'
		if (lab.file["lab.conf"] != "") lab.file["lab.conf"] += '\n'
    }
}

function makeLabConfFile(netkit, lab) {
    if (!lab.file["lab.conf"])
        lab.file["lab.conf"] = ""
    for (let machine of netkit) {
        for (let interface of machine.interfaces.if) {
            if (interface.eth.number == 0 && (machine.type == 'controller' || machine.type == 'switch')){
                interface.eth.domain = 'SDNRESERVED'
                lab.file["lab.conf"] += machine.name + "[0]=" +"SDNRESERVED\n"
            } else if (interface.eth.domain && interface.eth.domain != ""){
                lab.file["lab.conf"] += machine.name + "[" + interface.eth.number + "]=" + interface.eth.domain + "\n"
            }
        }
		lab.file["lab.conf"] += "\n"
    }
}

/* --------------------------------------------------- */
/* ------------------ STARTUP FILES ------------------ */
/* --------------------------------------------------- */

function makeTerminal(netkit, lab) {
    for (let machine of netkit) {
        if (machine.name && machine.name != "" && machine.type == 'terminal' && machine.pc.dns && machine.pc.dns != "-") {
            lab.folders.push(machine.name + "/etc")
            lab.file[machine.name + "/etc/resolv.conf"] = "nameserver " + machine.pc.dns + "\n"
        }
    }
}

function makeWebserver(netkit, lab) {
    for (let machine of netkit) {
        if (machine.name && machine.name != "" && machine.type == 'ws') {
            if (machine.ws.userdir == true) {
                lab.folders.push(machine.name + "/home/guest/public_html")
                lab.file[machine.name + "/home/guest/public_html/index.html"] = '<html><head><title>Guest Home</title></head><body>Guest Home</body></html>'
                lab.file[machine.name + ".startup"] += "a2enmod userdir\n"
            }
            lab.file[machine.name + ".startup"] += "/etc/init.d/apache2 start\n"
        }
    }
}

function makeOther(netkit, lab) {
    for (let machine of netkit) {
        if (machine.name && machine.name != "" && machine.type == 'other' && machine.other.image) {
            lab.file["lab.conf"] += machine.name + "[image]=" + machine.other.image + "\n"
            for (let file of machine.other.files) {
                lab.file["/etc/scripts/" + file.name] = file.contents
            }
        }
    }
}

function makeNameserver(netkit, lab) {
    //Gestione Nameserver
    //variabili d'appoggio comuni ai vari cicli
    let authority = []
    let nsroot

    // generazione file e cartelle comuni
    for (let machine of netkit) {
        if (machine.name && machine.name != "" && machine.type == 'ns') {
            lab.file[machine.name + ".startup"] += "/etc/init.d/bind start\n"
            lab.folders.push(machine.name + "/etc/bind")
            lab.file[machine.name + "/etc/bind/named.conf"] = ""
        }
        //Trovo il root-ns e lo salvo
        if (machine.name && machine.name != "" && machine.type == "ns" && machine.ns.authority && machine.ns.zone == ".") {
            nsroot = machine
        }
    }

    //Se non ho root-ns evito di generare una configurazione incoerente
    //db.root in ogni macchina dns
    if (nsroot) {
        for (let machine of netkit) {
            if (machine.name && machine.name != "" && machine.type == 'ns') {
                lab.file[machine.name + "/etc/bind/db.root"] = ""
                if (machine.ns.authority && machine.ns.zone == ".") {
                    lab.file[machine.name + "/etc/bind/db.root"] += "$TTL   60000\n@    IN SOA " + nsroot.interfaces.if[0].name +
                        " root." + nsroot.interfaces.if[0].name + " 2006031201 28800 14400 3600000 0\n\n"
                }
                if (machine.ns.recursion) {
                    lab.file[machine.name + "/etc/bind/named.conf"] += 'options {\n allow-recursion {0/0; };\n};\n\n'
                }
                lab.file[machine.name + "/etc/bind/db.root"] += ".    IN NS " + nsroot.interfaces.if[0].name + "\n"
                lab.file[machine.name + "/etc/bind/db.root"] += nsroot.interfaces.if[0].name + "    IN A " + nsroot.interfaces.if[0].ip.split("/")[0] + "\n"
                if (machine.ns.authority && machine.ns.zone == ".") {
                    lab.file[machine.name + "/etc/bind/named.conf"] += 'zone "." {\n type master;\n file "/etc/bind/db.root";\n};\n\n'
                } else {
                    lab.file[machine.name + "/etc/bind/named.conf"] += 'zone "." {\n type hint;\n file "/etc/bind/db.root";\n};\n\n'
                }
            }

        }
        //entry in db.zona e named.conf per le altre macchine
        for (let machine of netkit) {
            if (machine.name && machine.name != "" && machine.type == "ns" && machine.ns.authority) {
                authority[machine.ns.zone] = machine
                if (machine.ns.zone != ".") {
                    lab.file[machine.name + "/etc/bind/db" + machine.ns.zone.slice(0, -1)] = "$TTL   60000\n@    IN SOA " + machine.interfaces.if[0].name + " root." + machine.interfaces.if[0].name + " 2006031201 28800 14400 3600000 0\n\n" //ho preso il nome dell'interfaccia eth0
                    lab.file[machine.name + "/etc/bind/named.conf"] += 'zone "' + machine.ns.zone.slice(1, -1) + '" {\n type master;\n file "/etc/bind/db' + machine.ns.zone.slice(0, -1) + '";\n};\n\n'
                }
            }
        }
        //console.log(authority)
        //entry per l'alberatura delle zone (. conosce .com, .com conosce pippo.com, ecc)
        for (let machine of netkit) {
            if (machine.name && machine.name != "") {
                for (let f in machine.interfaces.if) {
                    let ip
                    if (machine.interfaces.if[f].ip)
                        ip = machine.interfaces.if[f].ip.split("/")[0]
                    if (machine.interfaces.if[f].name) { //Entrano tutte le interfacce di tutte le macchine con un nome ns
                        //Caso particolare per ns di primo livello
                        if (machine.ns.zone && machine.type == "ns" && machine.ns.authority && machine.ns.zone.split(".").length == 3) {
                            lab.file[authority["."].name + "/etc/bind/db.root"] +=
                                machine.ns.zone.substring(1) + "    IN NS "
                                + machine.interfaces.if[f].name + "\n" + machine.interfaces.if[f].name
                                + "    IN A " + ip + "\n"
                            lab.file[machine.name + "/etc/bind/db" + machine.ns.zone.slice(0, -1)] +=
                                machine.ns.zone.substring(1) + "    IN NS "
                                + machine.interfaces.if[f].name + "\n" + machine.interfaces.if[f].name
                                + "     IN A " + machine.interfaces.if[f].ip.split("/")[0] + "\n"
                        }
                        else {
                            let nome = machine.interfaces.if[f].name //www.pluto.net.
                            let nomediviso = nome.split(".") //[0]www [1]pluto [2]net [3].
                            let a = "."

                            //Questo for toglie il primo pezzo www.pluto.net. => pluto.net.
                            for (let i = 1; i < nomediviso.length; i++) {
                                if (nomediviso[i] != "") {
                                    a += nomediviso[i] + "."
                                }
                            }

                            if (authority[a] && authority[a].ns.zone) {
                                let fileExt = authority[a].ns.zone.slice(0, -1)
                                //Evito che entri in caso di root-ns
                                if (fileExt != "") {
                                    //se è un NS inserisco il glue record
                                    if (machine.type == "ns" && machine.ns.authority) {
                                        //Creo le linee relative a me stesso nel mio file db
                                        let aSup = "."
                                        let nomediviso2 = authority[a].ns.zone.split(".")
                                        //Questo for toglie il primo pezzo .www.pluto.net. => pluto.net.
                                        for (let i = 2; i < nomediviso2.length; i++) {
                                            if (nomediviso2[i] != "") {
                                                aSup += nomediviso2[i] + "."
                                            }
                                        }
                                        lab.file[authority[aSup].name + "/etc/bind/db" + authority[aSup].ns.zone.slice(0, -1)] +=
                                            machine.ns.zone.substring(1) + "    IN NS " + machine.interfaces.if[f].name + "\n"
                                            + machine.interfaces.if[f].name + "    IN A " + machine.interfaces.if[f].ip.split("/")[0] + "\n"
                                            + machine.ns.zone.substring(1) + "    IN NS " + machine.interfaces.if[f].name + "\n"
                                    }
                                    //e poi inserisco anche il record A, altirmenti solo A
                                    lab.file[authority[a].name + "/etc/bind/db" + fileExt] += machine.interfaces.if[f].name + "    IN A " + ip + "\n"
                                }
                            }
                        }

                    }
                }
            }
        }
    }
}

function makeRouter(netkit, lab) {
    // routing dinamico RIP e OSPF
    for (let machine of netkit) {
        if (machine.name && machine.name != "" && machine.type == 'router') {
            if (machine.routing.rip.en || machine.routing.ospf.en || machine.routing.bgp.en) {
                lab.file[machine.name + ".startup"] += "/etc/init.d/zebra start\n"
                lab.folders.push(machine.name + "/etc/zebra")
                lab.file[machine.name + "/etc/zebra/daemons"] = "zebra=yes\n"

                lab.file[machine.name + "/etc/zebra/zebra.conf"] = "hostname zebra\n"
                    + "password zebra\n"
                    + "enable password zebra\n"
                    + "\nlog file /var/log/zebra/zebra.log\n"
            }

            if (machine.routing.rip.en) {
                lab.file[machine.name + "/etc/zebra/daemons"] += "ripd=yes\n"

                lab.file[machine.name + "/etc/zebra/ripd.conf"] = "hostname ripd\n"
                    + "password zebra\n"
                    + "enable password zebra\n"
                    + "\n"
                    + "router rip\n"

                for (let network of machine.routing.rip.network)
                    lab.file[machine.name + "/etc/zebra/ripd.conf"] += "network " + network + "\n"

                for (let route of machine.routing.rip.route) {
                    if (route && route != "")
                        lab.file[machine.name + "/etc/zebra/ripd.conf"] += "route " + route + "\n"
                }
                lab.file[machine.name + "/etc/zebra/ripd.conf"] += "\n"
            }

            if (machine.routing.ospf.en) {
                lab.file[machine.name + "/etc/zebra/daemons"] += "ospfd=yes\n"

                lab.file[machine.name + "/etc/zebra/ospfd.conf"] = "hostname ospfd\n"
                    + "password zebra\n"
                    + "enable password zebra\n"
                    + "\n"
                    + "router ospf\n"

                for (let m /* non trasformare in un for... of */ in machine.routing.ospf.network) {
                    lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "network " + machine.routing.ospf.network[m] + " area " + machine.routing.ospf.area[m] + "\n"
                    if (machine.routing.ospf.stub[m])
                        lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "area " + machine.routing.ospf.area[m] + " stub\n"
                }
                lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "\n"
            }

            if (machine.routing.bgp.en) makeBgpConf(machine, lab)

            //nb: mantenere l'ordine
            if (machine.routing.rip.en && machine.routing.rip.connected) {
                lab.file[machine.name + "/etc/zebra/ripd.conf"] += "redistribute connected\n"
            }
            if (machine.routing.ospf.en && machine.routing.ospf.connected) {
                lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "redistribute connected\n"
            }
            if (machine.routing.rip.en && machine.routing.rip.ospf) {
                lab.file[machine.name + "/etc/zebra/ripd.conf"] += "redistribute ospf\n"
            }
            if (machine.routing.rip.en && machine.routing.rip.bgp) {
                lab.file[machine.name + "/etc/zebra/ripd.conf"] += "redistribute bgp\n"
            }
            if (machine.routing.ospf.en && machine.routing.ospf.rip) {
                lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "redistribute rip\n"
            }
            if (machine.routing.ospf.en && machine.routing.ospf.bgp) {
                lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "redistribute bgp\n"
            }

            //nb: i costi vanno qui alla fine
            if (machine.routing.ospf.en) {
                for (let interface of machine.routing.ospf.if) {
                    if (interface.cost != "" && interface.cost) {
                        lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "interface eth" + interface.interface + "\n"
                        lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "ospf cost " + interface.cost + "\n"
                    }
                }
            }

            //Free conf
            if (machine.routing.ospf.en) {
                if (machine.routing.ospf.free && machine.routing.ospf.free != "")
                    lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "\n" + machine.routing.ospf.free + "\n"
            }
            if (machine.routing.rip.en) {
                if (machine.routing.rip.free && machine.routing.rip.free != "")
                    lab.file[machine.name + "/etc/zebra/ripd.conf"] += "\n" + machine.routing.rip.free + "\n"
            }
            //nb: e infine i log
            if (machine.routing.rip.en) {
                lab.file[machine.name + "/etc/zebra/ripd.conf"] += "\nlog file /var/log/zebra/ripd.log\n"
            }
            if (machine.routing.ospf.en) {
                lab.file[machine.name + "/etc/zebra/ospfd.conf"] += "\nlog file /var/log/zebra/ospfd.log\n"
            }
        }
    }
}

function makeOVSwitch(netkit, lab) {
    for (let machine of netkit) {
        if (machine.name && machine.name != "" && machine.type == 'switch') {
			lab.file[machine.name + ".startup"] += "\n" +
				// "sleep 10\n\n" +		// TODO: Gabriele l'ha messo...
                "service openvswitch-switch start\n\n" +
                "ovs-vsctl add-br br0\n" +
                machine.interfaces.if.map(function(el){
					if (el.eth.number != 0) return "ovs-vsctl add-port br0 eth" + el.eth.number
				}).join('\n') +
				"\n" +
				machine.interfaces.if.map(function(el){
					if (el.eth.number != 0) return "ifconfig eth" + el.eth.number + " up"
				}).join('\n') +
				"\n\n" +
				"ovs-vsctl set bridge br0 protocols=[OpenFlow13]\n" +
				"ovs-vsctl set-controller br0 tcp:192.168.100.1:6633\n"
        }
    }
}

function makeRyuController(netkit, lab) {
    for (let machine of netkit) {
        if (machine.name && machine.name != "" && machine.type == 'controller') {
			lab.folders.push(machine.name + "/etc/ryu")
			lab.file[machine.name + "/etc/ryu/custom_app.py"] = ""	// TODO: Riempire il file. Come fare?
			lab.file[machine.name + ".startup"] += "\n" +
				"ryu-manager /etc/ryu/custom_app.py\n"
        }
    }
}

/* --------------------------------------------------- */
/* ------------------ AUX FUNCTIONS ------------------ */
/* --------------------------------------------------- */

function makeStaticRouting(netkit, lab) {
    // generazione networking e routing statico
	let switchCounter = 2
    for (let machine of netkit) {
        if (machine.name && machine.name != "") {
            for (let interface of machine.interfaces.if) {
                if (interface.eth.number == 0){
					if (machine.type == 'switch'){
						interface.ip = "192.168.100." + switchCounter++ + "/24"	// TODO: E se non bastano 200+ switch?
					} else if(machine.type == 'controller'){
						interface.ip = "192.168.100.1/24"
					}
                }
                //ifconfig eth_ SELFADDRESS/MASK up
                if (interface.eth.domain && interface.eth.domain != "" && interface.ip && interface.ip != ""){
                    lab.file[machine.name + ".startup"] += "ifconfig eth" + interface.eth.number + " " + interface.ip + " up\n"
                }
            }

            for (let gateway of machine.gateways.gw) {
                if (gateway.gw && gateway.gw != "") {
                    //route add default gw GATEWAY dev eth_
                    if (gateway.route == "") {
                        lab.file[machine.name + ".startup"] += "route add default gw " +
                            gateway.gw + " dev eth" +
                            gateway.if + "\n"
                    }
                    //route add -net NETADDRESS/MASK gw GATEADDRESS dev eth_
                    else {
                        lab.file[machine.name + ".startup"] += "route add -net " + gateway.route + " gw " +
                            gateway.gw + " dev eth" +
                            gateway.if + "\n"
                    }
                }
            }

            if (machine.interfaces.free && machine.interfaces.free != "")
                lab.file[machine.name + ".startup"] += "\n" + machine.interfaces.free + "\n"
        }
    }
}

function makeBgpConf(router, lab) {
    lab.file[router.name + "/etc/zebra/daemons"] += "bgpd=yes\n"

    lab.file[router.name + "/etc/zebra/bgpd.conf"] = ""
        + "hostname bgpd\n"
        + "password zebra\n"
        + "enable password zebra\n"
        + "\n"

        // Inserimento nome AS
        + "router bgp " + router.routing.bgp.as + "\n\n"

    // Inserimento tutte le Network su cui annunciare BGP
    for (let network of router.routing.bgp.network) {
        if (network && network != "") {
            lab.file[router.name + "/etc/zebra/bgpd.conf"] += "network " + network + "\n"
        }
    }

    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "\n"

    //Inserisco tutti i Neibourgh
    for (let remote in router.routing.bgp.remote) {
        if (remote && remote.neighbor != "" && remote.as != "") {
            //Aggiungo il remote-as
            lab.file[router.name + "/etc/zebra/bgpd.conf"] += "neighbor " + remote.neighbor + " remote-as " + remote.as + "\n"

            //Aggiungo la descrizione
            if ((remote.description) && remote.description != "") {
                lab.file[router.name + "/etc/zebra/bgpd.conf"] += "neighbor " + remote.neighbor + " description " + remote.description + "\n"
            }
        }
    }
    //Free conf
    if (router.routing.bgp.free && router.routing.bgp.free != "")
        lab.file[router.name + "/etc/zebra/bgpd.conf"] += "\n" + router.routing.bgp.free + "\n"

    lab.file[router.name + "/etc/zebra/bgpd.conf"] += "\nlog file /var/log/zebra/bgpd.log\n\n"
        + "debug bgp\ndebug bgp events\ndebug bgp filters\ndebug bgp fsm\ndebug bgp keepalives\ndebug bgp updates\n"
}

function makeFilesStructure(netkit, labInfo) {
    var lab = []		// <------ EHHHH????????????    TODO: sistemare (se ho tempo/voglia di ricontrollare bene tutto)
    lab.folders = []
    lab.file = []
    lab["warning"] = 0
    lab["error"] = 0

    makeLabInfo(labInfo, lab)

    makeMachineFolders(netkit, lab)
    makeLabConfFile(netkit, lab)
    makeStartupFiles(netkit, lab)
    makeStaticRouting(netkit, lab)
    makeTerminal(netkit, lab)
    makeRouter(netkit, lab)
    makeWebserver(netkit, lab)
    makeNameserver(netkit, lab)
    makeOther(netkit, lab)
    makeOVSwitch(netkit, lab)
    makeRyuController(netkit, lab)

    if (labInfo.toggle == "disable")
        makeGraph(netkit)

    return lab
}

function makeScript(lab) {
    let text = "#! /bin/sh\n"
        + "# Remember to use 'chmod +x' (o 'chmod 500') on the .sh file. The script will self-destruct\n"
        + "\n"
        + 'rm -rf "$(dirname "$0")/lab"\n'
        + 'mkdir "$(dirname "$0")/lab"\n'
        + 'cd "$(dirname "$0")/lab"\n'
        + "\n"

    for (let folderName of lab.folders) {
        text += "mkdir -p " + folderName + "\n"
    }

    for (let fileName in lab.file) {
        text += "touch " + fileName + "\n"
        let lines = lab.file[fileName].split("\n")
        for (let line of lines) {
            text += "echo '" + line + "' >> " + fileName + "\n"
        }
    }

    text += "rm \"$0\"\n"
    return text
}

function makeZip(lab) {
    let zip = new JSZip()

    for (let folderName of lab.folders) {
        zip.folder(folderName)
    }
    for (let fileName in lab.file) {
        zip.file(fileName, lab.file[fileName])
    }
    let content = zip.generate({ type: "blob" })
    saveAs(content, "lab.zip")
}