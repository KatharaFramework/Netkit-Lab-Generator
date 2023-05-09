# Netkit Lab Generator
A tool to configure a Kathará or a Netkit lab and generate all the files you need and the topology graph. 

It works as stand-alone HTML file or using Electron for some advanced capabilities (like the ability to directly run a lab from inside the UI).

![Screenshot (graph)](https://raw.githubusercontent.com/Kidel/Netkit-Lab-Generator/master/images/screencapture-201801143.png)

Simply fill the form and download the bash script or the .zip file with the whole lab. 
It is also possible to export and import the form configuration for future changes.

Now supports network topology preview (requires a modern browser or the Electrum release).

* [Demo](https://www.kathara.org/tools/nlg/) **(may not always be up to date)**
* [Example configuration](https://raw.githubusercontent.com/Kidel/Netkit-Lab-Generator/master/examples/example_lab.config) (can be imported to generate the files or the graph)
* [Screenshot (form)](https://raw.githubusercontent.com/Kidel/Netkit-Lab-Generator/master/images/screencapture-201801261.png)
* [Screenshot (graph)](https://raw.githubusercontent.com/Kidel/Netkit-Lab-Generator/master/images/screencapture-201801143.png)


#### Created by

   * https://github.com/KatharaFramework/Netkit-Lab-Generator/graphs/contributors

### Links

 * [**Kathará Home**](https://www.kathara.org)
 * [**Netkit Home**](http://wiki.netkit.org/index.php/Main_Page)
 * [**Netkit on GitHub**](https://github.com/maxonthegit/netkit-core)

***

### FAQ

* **Q**: How can I make a machine that is both a web server and a name server?
* **A**: Two machines with the same name are considered as the same machine. For any shared file, the configuration lines of the second machine are added right after the ones of the first machine. For any file that is not shared there is no conflict.
