const
	LENGTH_MAIN = 350,
	LENGTH_SERVER = 150,
	LENGTH_SUB = 50,
	LENGTH_CLOSE = 0.0001,
	WIDTH_SCALE = 3,
	GREEN = "green",
	RED = "#C5000B",
	ORANGE = "#f1db8d",
	GRAY = "gray",
	LGRAY = "#dddddd",
	LLGRAY = "#efefef",
	WHITE = "#fafafa",
	BLUE = "#2B7CE9",
	BLACK = "#2B1B17";

const DIR = "src/static/images/";

// Called when the Visualization API is loaded.
function draw(nodes, edges) {
	let container = document.getElementById("mynetwork");

	let data = {
		nodes,
		edges
	};

	let options = {
		nodes: {
			scaling: {
				min: 16,
				max: 32
			}
		},
		edges: {
      smooth: {
        type: "dynamic"
      },
			color: BLACK
		},
		physics: {
			enabled: true,
			barnesHut: { gravitationalConstant: -1200 }
		},
    interaction: {
      multiselect: true
    },
		groups: {
			"terminal": {
				image: DIR + "terminal.png",
				shape: "image",
			},
			"router": {
				image: DIR + "router.png",
				shape: "image",
			},
			"ns": {
				image: DIR + "nameserver.png",
				shape: "image",
			},
			"ws": {
				image: DIR + "webserver.png",
				shape: "image",
				value: 8
			},
			"switch": {
				image: DIR + "switch.png",
				shape: "image",
			},
			"controller": {
				image: DIR + "controller.png",
				shape: "image",
			},
			"other": {
				image: DIR + "other.png",
				shape: "image",
			},
			"domain": {
				color: BLACK,
				font: { color: "#dddddd" }
			},
			"eth": {
				color: WHITE,
				shape: "box"
			},
			"domain-ip": {
				color: LGRAY,
				shape: "box"
			},
			"ospf": {
				color: ORANGE,
				shape: "box"
			},
			"rip": {
				color: ORANGE,
				shape: "box"
			},
			"bgp": {
				color: ORANGE,
				shape: "box"
			}
		}
	};

	network = new vis.Network(container, data, options);
  
  document.getElementById("smoothEnabled").checked = true;
  document.getElementById("smoothType").value = "dynamic";
  document.getElementById("physicsEnabled").checked = true;
  document.getElementById("physicsGravitationalConstant").value = -1200;
  document.getElementById("physicsGravitationalConstantValue").value = -1200;
}
