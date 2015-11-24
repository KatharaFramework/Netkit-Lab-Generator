var backbone = {
    "name":"",
    "row":1,
    "type":"router",
    "interfaces":{"counter":1, "if":[{"eth":{"number":0}, "ip":""}]},
    "gateways":{"counter":1, "gw":[{"route":"", "if":0}]},
    "pc":{"dns":""},
    "ws":{"userdir":false},
    "ns":{"recursion":true, "authority":true},
    "routing":{
        "rip":{"en":false, "connected":false, "ospf": false, "network":[""], "route":[""]},
        "ospf":{"en":false, "connected":false, "rip": false, "if":[], "network":[""], "area":["0.0.0.0"], "stub":[false]}
    }
};