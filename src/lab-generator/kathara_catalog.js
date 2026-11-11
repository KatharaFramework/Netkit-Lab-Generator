/* Curated originals from KatharaFramework/Kathara-Labs (main branch).
 * Limited subset of native labs can be represented by Netkit-Lab-Generator.
 * Source and conversion limitations are exposed in the UI.
 */
var KatharaCatalog = (function () {
	"use strict";
	const entries = [
  {
    "id": "two-computers",
    "title": "Two Computers",
    "description": "A simple example two computers on a single lan",
    "source": "https://github.com/KatharaFramework/Kathara-Labs/tree/main/main-labs/basic-topics/two-computers/kathara-lab_two-computers",
    "limitations": [
      "Wireshark container, image choice and fixed MAC addresses are not imported."
    ],
    "labConf": "LAB_DESCRIPTION=\"A simple example two computers on a single lan\"\nLAB_VERSION=3.0\nLAB_AUTHOR=\"L. Ariemma, T. Caiazzi\"\nLAB_EMAIL=contact@kathara.org\nLAB_WEB=http://www.kathara.org/\n\npc1[0]=\"A/00:00:00:00:00:01\"\npc1[image]=\"kathara/core\"\npc1[ipv6]=\"false\"\n\npc2[0]=\"A/00:00:00:00:00:02\"\npc2[image]=\"kathara/core\"\npc2[ipv6]=\"false\"\n\nwireshark[bridged]=true\nwireshark[port]=\"3000:3000\"\nwireshark[image]=\"lscr.io/linuxserver/wireshark\"\nwireshark[num_terms]=0",
    "startup": {}
  },
  {
    "id": "basic-ipv4",
    "title": "Basic IPv4",
    "description": "Basic IPv4 configurations, ping, traceroute, and arp",
    "source": "https://github.com/KatharaFramework/Kathara-Labs/tree/main/main-labs/basic-topics/basic-ipv4/kathara-lab_basic-ipv4",
    "limitations": [
      "Wireshark container, image choice and fixed MAC addresses are not imported."
    ],
    "labConf": "LAB_DESCRIPTION=\"Basic IPv4 configurations, ping, traceroute, and arp\"\nLAB_VERSION=3.0\nLAB_AUTHOR=\"L. Ariemma, T. Caiazzi, G. Di Battista, M. Patrignani, M. Pizzonia, F. Ricci, M. Rimondini\"\nLAB_EMAIL=contact@kathara.org\nLAB_WEB=http://www.kathara.org/\n\nr1[0]=\"A/00:00:00:00:00:a1\"\nr1[1]=\"B/00:00:00:00:00:b1\"\nr1[image]=\"kathara/core\"\nr1[ipv6]=\"false\"\n\nr2[0]=\"C/00:00:00:00:00:c1\"\nr2[1]=\"B/00:00:00:00:00:b2\"\nr2[image]=\"kathara/core\"\nr2[ipv6]=\"false\"\n\npc1[0]=\"A/00:00:00:00:00:01\"\npc1[image]=\"kathara/core\"\npc1[ipv6]=\"false\"\n\npc2[0]=\"C/00:00:00:00:00:02\"\npc2[image]=\"kathara/core\"\npc2[ipv6]=\"false\"\n\npc3[0]=\"C/00:00:00:00:00:03\"\npc3[image]=\"kathara/core\"\npc3[ipv6]=\"false\"\n\nwireshark[bridged]=true\nwireshark[port]=\"3000:3000\"\nwireshark[image]=\"lscr.io/linuxserver/wireshark\"\nwireshark[num_terms]=0\n",
    "startup": {
      "r1.startup": "# to eth0 an IPv4 address is assigned\nip address add 195.11.14.1/24 dev eth0\n\n# to eth1 an IPv4 address is assigned\nip address add 100.0.0.9/30 dev eth1\n\n# the routing table is set\nip route add 200.1.1.0/24 via 100.0.0.10 dev eth1\n",
      "r2.startup": "# to eth0 an IPv4 address is assigned\nip address add 200.1.1.1/24 dev eth0\n\n# to eth1 an IPv4 address is assigned\nip address add 100.0.0.10/30 dev eth1\n\n# the routing table is set\nip route add 195.11.14.0/24 via 100.0.0.9 dev eth1\n",
      "pc1.startup": "# to eth0 an IPv4 address is assigned\nip address add 195.11.14.5/24 dev eth0\n\n# a default router is selected\nip route add default via 195.11.14.1\n",
      "pc2.startup": "# to eth0 an IPv4 address is assigned\nip address add 200.1.1.7/24 dev eth0\n\n# a default router is selected\nip route add default via 200.1.1.1 dev eth0\n",
      "pc3.startup": "# to eth0 an IPv4 address is assigned\nip address add 200.1.1.3/24 dev eth0\n\n# a default router is selected\nip route add default via 200.1.1.1 dev eth0\n"
    }
  },
  {
    "id": "static-routing",
    "title": "Static Routing (exercise)",
    "description": "A simple example showing how to configure static routes",
    "source": "https://github.com/KatharaFramework/Kathara-Labs/tree/main/main-labs/basic-topics/static-routing/kathara-lab_static-routing",
    "limitations": [
      "Commented-out routes are intentionally NOT activated; image selection is not preserved."
    ],
    "labConf": "LAB_DESCRIPTION=\"A simple example showing how to configure static routes\"\nLAB_VERSION=3.0\nLAB_AUTHOR=\"T. Caiazzi, G. Di Battista, M. Patrignani, M. Pizzonia, F. Ricci, M. Rimondini\"\nLAB_EMAIL=contact@kathara.org\nLAB_WEB=http://www.kathara.org/\n\nr1[0]=\"A\"\nr1[1]=\"B\"\nr1[image]=\"kathara/core\"\n\nr2[0]=\"C\"\nr2[1]=\"B\"\nr2[image]=\"kathara/core\"\n\npc1[0]=\"A\"\npc1[image]=\"kathara/core\"\n\npc2[0]=\"C\"\npc2[image]=\"kathara/core\"\n",
    "startup": {
      "r1.startup": "ip address add 195.11.14.1/24 dev eth0\nip address add 100.0.0.9/30 dev eth1\n#ip route add 200.1.1.0/24 via 100.0.0.10 dev eth1\n",
      "r2.startup": "ip address add 200.1.1.1/24 dev eth0\nip address add 100.0.0.10/30 dev eth1\n#ip route add 195.11.14.0/24 via 100.0.0.9 dev eth1\n",
      "pc1.startup": "ip address add 195.11.14.5/24 dev eth0\n#ip route add default via 195.11.14.1 dev eth0\n",
      "pc2.startup": "ip address add 200.1.1.7/24 dev eth0\n#ip route add default via 200.1.1.1 dev eth0\n"
    }
  }
];

	function parseExample(entry) {
		const fields = {};
		for (const line of entry.labConf.split("\n")) {
			const match = line.match(/^LAB_(DESCRIPTION|VERSION|AUTHOR|EMAIL|WEB)=(.*)$/);
			if (match) fields[match[1].toLowerCase()] = match[2].trim().replace(/^"|"$/g, "");
		}

		const machines = new Map();
		for (const line of entry.labConf.split("\n")) {
			// Only collision-domain connectivity is represented here; suffixes
			// after / are pinned MAC addresses in native Kathará labs.
			const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\[(\d+)\]=["']?([^"'\n]+)["']?$/);
			if (!match || match[1] === "wireshark") continue;
			const name = match[1];
			const ethIndex = Number(match[2]);
			if (!machines.has(name)) {
				const machine = JSON.parse(JSON.stringify(backbone));
				machine.name = name;
				machine.type = /^r\d+$/.test(name) ? "router" : "terminal";
				machine.row = machines.size + 1;
				machine._uid = machine.row;
				machine.interfaces.if = [];
				machines.set(name, machine);
			}
			const machine = machines.get(name);
			machine.interfaces.if.push({
				eth: { number: ethIndex, domain: match[3].split("/")[0] },
				ip: ""
			});
		}
		for (const machine of machines.values()) {
			machine.interfaces.if.sort((a, b) => a.eth.number - b.eth.number);
			machine.interfaces.counter = machine.interfaces.if.length;
			const script = entry.startup[machine.name + ".startup"] || "";
			const gateways = [];
			for (const rawLine of script.split("\n")) {
				const line = rawLine.trim();
				if (!line || line.startsWith("#")) continue;
				let match = line.match(/^ip (?:-4 )?address add (\S+) dev eth(\d+)$/);
				if (match) {
					const iface = machine.interfaces.if.find(i => i.eth.number === Number(match[2]));
					if (iface) iface.ip = match[1];
					continue;
				}
				match = line.match(/^ip (?:-4 )?route add (\S+) via (\S+)(?: dev eth(\d+))?$/);
				if (match) {
					gateways.push({
						route: match[1] === "default" ? "" : match[1],
						gw: match[2],
						if: match[3] === undefined ? 0 : Number(match[3])
					});
				}
			}
			machine.gateways.gw = gateways.length ? gateways : [{route:"",if:0}];
			machine.gateways.counter = machine.gateways.gw.length;
		}
		return {
			labInfo: Object.assign({description: entry.title, version: "", author: "", email: "", web: "", toggle: "enable"}, fields),
			netkit: Array.from(machines.values())
		};
	}

	return {
		list: function () {
			return entries.map(e => ({id:e.id,title:e.title,description:e.description,source:e.source,limitations:e.limitations.slice()}));
		},
		load: function (id) {
			const entry = entries.find(e => e.id === id);
			if (!entry) throw new Error("Unknown Kathará example: " + id);
			return parseExample(entry);
		}
	};
})();
