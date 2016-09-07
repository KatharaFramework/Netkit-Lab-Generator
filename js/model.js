var labInfo = {
    "description": "",
    "version": "",
    "author": "",
    "email": "",
    "web": ""
};

var backbone = {
    "name":"",
    "row":1,
    "type":"router",
    "interfaces":{"counter":1, "if":[{"eth":{"number":0, "domain":""}, "ip":""}], "free": ""},
    "gateways":{"counter":1, "gw":[{"route":"", "if":0}]},
    "pc":{"dns":"-"},
    "ws":{"userdir":false},
    "ns":{"recursion":true, "authority":true},
    "routing":{
        "rip":{"en":false, "connected":false, "ospf": false, "bgp": false, "network":[""], "route":[""], "free": ""},
        "ospf":{"en":false, "connected":false, "rip": false, "bgp": false, "if":[], "network":[""], "area":["0.0.0.0"], "stub":[false], "free": ""},
        "bgp":{
            "en":false,
            "as":"",
            "network":[""],
            "remote":[{
                "neighbor":"",
                "as":"",
                "description":""
            }],
            "free": ""
        }
    }
};