var LENGTH_MAIN = 350,
    LENGTH_SERVER = 150,
    LENGTH_SUB = 50,
    LENGTH_CLOSE = 0.0001,
    WIDTH_SCALE = 3,
    GREEN = 'green',
    RED = '#C5000B',
    ORANGE = '#f1db8d',
    GRAY = 'gray',
    LGRAY = "#dddddd",
    LLGRAY = "#efefef",
    WHITE = "#fafafa",
    BLUE = "#2B7CE9",
    BLACK = '#2B1B17';
var DIR = "images/";

// Called when the Visualization API is loaded.
function draw(nodes, edges) {
    // create a network
    var container = document.getElementById('mynetwork');
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        nodes: {
            scaling: {
                min: 16,
                max: 32
            }
        },
        edges: {
            color: BLACK
        },
        physics:{
            enabled: true,
            barnesHut:{gravitationalConstant:-1200}
            //, stabilization: {iterations:200000}
        },
        groups: {
            'router': {
                color: ORANGE,
                image: DIR + 'router.png',
                shape: 'image',
                font: {strokeWidth: 2, strokeColor: 'white', size: 15},
                value: 6
            },
            'terminale': {
                color: BLUE,
                image: DIR + 'terminal.png',
                shape: 'image',
                font: {strokeWidth: 2, strokeColor: 'white'},
                value: 8
            },
            'ns': {
                color: GREEN,
                image: DIR + 'nameserver.png',
                shape: 'image',
                font: {strokeWidth: 2, strokeColor: 'white'},
                value: 8
            },
            'ws': {
                color: RED,
                image: DIR + 'webserver.png',
                shape: 'image',
                font: {strokeWidth: 2, strokeColor: 'white'},
                value: 8
            },
            'domain': {
                color: BLACK,
                font: {color:'#dddddd'}
            },
            'eth': {
                color: WHITE,
                shape: 'box'
            },
            'domain-ip': {
                color: LGRAY,
                shape: 'box'
            },
            'ospf': {
                color: ORANGE,
                shape: 'box'
            },
            'rip': {
                color: ORANGE,
                shape: 'box'
            },
            'bgp': {
                color: ORANGE,
                shape: 'box'
            }
        }
    };
    network = new vis.Network(container, data, options);
}