const http = require('http')

function get(url /* string */, parametri /* object */, callback /* res, err, info */) {
    let query_url = url + '?'
    for (let chiave in parametri) {
        query_url += chiave + '=' + parametri[chiave] + '&'
    }
    http.get(query_url, function (res) {
        let info = { url: query_url, codice: res.statusCode, msg: res.statusMessage }
        if (res.statusCode == 200) {
            let risCompleta = ''
            res.on('data', (parziale) => risCompleta += parziale)
            res.on('end', () => callback(JSON.parse(risCompleta), null, info))
        } else {
            if (res.statusCode == 429) callback(null, 'Servizio temporaneamente non disponibile')
            else callback(null, 'Errore ' + res.statusCode + ' nella richiesta', info)
        }
    }).on('error', (/* err */) => callback(null, "Errore nel 'get' di http"))
}

/* --------------------------------------------------------------- */
/* --------------------------------------------------------------- */

module.exports = {
	getInfo(){
		// TODO: L'indirizzo è sempre lo stesso? non so...
		get('http://172.24.0.2:8080/stats/switches', {}, function(res, err){
			console.log(res, err)
		})
	}
}