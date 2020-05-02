# About
TODO

# Struttura del progetto
Questo progetto si divide in due parti distinte che collaborano per realizzare uno strumento visuale per il controllo di reti virtuali ed in particolare dei loro traffici di dati.
Queste due parti sono:
- un'interfaccia web che ha lo scopo di permettere all'utilizzatore di controllare una rete virtuale di switch Open VSwitch e (un solo) controller Ryu e di analizzare le sue regole OpenFlow;
- un web server che si occupa di ospitare la web app e di tradurre le richieste da essa provenienti in richieste per il controller Ryu. Questo sarà a sua volta ospitato in un container docker creato ad hoc.

Il codice per la prima parte (l'interfaccia) è incluso nella cartella <code>src</code>, mentre il codice per il web server e per l'immagine docker sono collocati nella root direcotry di questo progetto.

## Docker image
TODO

## Web interface
Per la realizzazione dell'interfaccia web è stato utilizzato il framework Vue.js che permette di dividere l'intera applicazione in delle più piccole e più semplici da mantenere "componenti".
TODO

# Installazione

L'installazione di questo progetto coincide con la creazione dell'immagine docker che andrà ad ospitare il server e la web application.
Costruire o aggiornare l'immagine docker è semplice: basta eseguire lo script <code>build.sh</code> con il comando <code>sh build.sh</code>.

### Kathara-SDN-Interface e Netkit-Lab-Generator

Quest'applicazione è stata sviluppata insieme a Netkit-Lab-Generator, un'altra interfaccia che semplifica la creazione di reti virtuali ed eventualmente (nel caso di reti OpenFlow) del lancio di questo secondo strumento.

Infatti Netkit-Lab-Generator avvia un container a partire dall'immagine docker che deve essere stata costruita precedentemente e lo collega al nodo docker che rappresenta la macchina Ryu della rete virtuale. Dopodiché permette la connessione all'applicazione web tramite web browser.


<hr>

# TODOs
* Nuovo:
	* Creare un server fake per semplificare lo sviluppo

	* Migliorare il grafico con forme complesse anziché pallini
	* Colorare i path che già sono stati creati con il colore della label a cui appartengono

* Limitazioni da rimuovere:
	* Funziona con 1 label al massimo

* Alcune cose non funzionano come dovrebbero:
	* Il pulsante "Update statistics" per ora genera delle statistiche casuali (per scelta). Correggere.

* Altre cose devono ancora essere implementate:
	* Questo README va scritto completamente.
	* Molti "TODO" sono sparsi nel codice. Ricercali e correggili