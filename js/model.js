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
        "rip":{"en":false, "connected":false, "ospf": false, "bgp": false, "network":[""], "route":[""]},
        "ospf":{"en":false, "connected":false, "rip": false, "bgp": false, "if":[], "network":[""], "area":["0.0.0.0"], "stub":[false]},
        "bgp":{
            "en":false,
            "as":"",
            "network":[""],
            "remote":[{
                "neighbor":"",
                "as":"",
                "description":"",
                "prefix_out":"", //l'oggetto p_list corrispondente
                "prefix_in":"", //Come sopra3
            }],
            "p_list": [] // each element is {"name":"", "rules":[""]}
        }
    }
};