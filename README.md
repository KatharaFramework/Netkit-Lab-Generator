# Netkit Lab Generator
A **client-side JavaScript** tool to configure a netkit lab and generate all the files you need.

![Angular 1](https://angular.io/resources/images/logos/standard/logo-nav.png)

Simply fill the form and download the bash script or the .zip file with the whole lab. 
It is also possible to export and import the form configuration for future changes.

Now supports network topology preview (requires a modern browser).

* [Demo](http://bytearound.com/jobs/nlg/) (may not always be up to date)
* [Example configuration](https://raw.githubusercontent.com/Kidel/Netkit-Lab-Generator/master/examples/example_lab.config) (can be imported to generate the files or the graph)
* [Screenshot (form)](https://raw.githubusercontent.com/Kidel/Netkit-Lab-Generator/master/images/screencapture-1460378558427.png)
* [Screenshot (graph)](https://raw.githubusercontent.com/Kidel/Netkit-Lab-Generator/master/images/screencapture-1460378572119.png)


####Created by

   * Gaetano Bonofiglio (Kidel)
   * Veronica Iovinella (Neeja)
   * Lorenzo Ariemma (lorenzo93)

### Links

 * [**Netkit Home**](http://wiki.netkit.org/index.php/Main_Page)
 * [**Netkit on GitHub**](https://github.com/maxonthegit/netkit-core)

***

### FAQ

* **Q**: How can I make a machine that is both a web server and a  name server?
* **A**: Two machines with the same name are considered as the same machine. For any shared file, the configuration lines of the second machine are added right after the ones of the first machine. For any file that is not shared there is no conflict.
