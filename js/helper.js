if (typeof JSON.clone !== "function") {
    JSON.clone = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };
}

function lastElem(arr) {
    return arr[arr.length - 1];
}

function highlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 4);
    }
    else {
        json = JSON.stringify(JSON.parse(json), undefined, 4);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function ip_to_bin(ip) {
    var ipfields = ip.split(".");
    var binary = "";

    for (var key in ipfields) {
        if (ipfields[key]>255) ipfields[key] = 255;
        if (ipfields[key]<0) ipfields[key] = 0;

        var app = parseInt(ipfields[key]).toString(2);
        var pad = "00000000";
        app = pad.substring(0, pad.length - app.toString(2).length) + app.toString(2);
        binary = binary + "" + app.toString(2);
    }
    return binary;
}
function network_from_binary_ip_mask(binary, netmask) {
    var network = "";
    for (var j = 0; j<32; j++) {
        if(netmask[j]=='1') network+=binary[j];
        else network+='0';
    }
    return network;
}

function bin_to_ip(bin) {
    var ip = "";
    for (var i=0; i<32; i=i+8){
        var app = "";
        for(var k = 0; k<8; k++) app += bin[i+k];
        ip += parseInt(app,2) + ((i<24) ? ".": "");
    }
    return ip;
}

function binary_netmask_from_decimal(dec) {
    if (dec>32) dec = 32;
    var netmask = "";
    for (var j = 0; j<32; j++) { netmask = netmask + ((j<dec) ? '1':'0'); }
    return netmask;
}

function get_network_from_ip_net(ip_net) {
    var split = ip_net.split("/");
    var ip = split[0];
    var net = split[1];
    if(net > 32) net = 32;
    if(net <0) net = 0;
    var binary = ip_to_bin(ip);
    var netmask = binary_netmask_from_decimal(net);
    var network = network_from_binary_ip_mask(binary, netmask);
    var network_ip = bin_to_ip(network);
    return network_ip+"/"+net;
}
