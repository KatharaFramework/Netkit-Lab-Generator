# Netkit Lab Generator
A client-side JavaScript tool to configure a netkit lab and generate all the files you need.

Simply fill the form and download the bash script or the .zip file with the whole lab. 
It is also possible to export and import the form configuration for future changes.

Now supports network topology preview (requires a modern browser).

[Demo](http://bytearound.com/jobs/nlg/) (may not always be up to date).

[Screenshot](https://raw.githubusercontent.com/Kidel/Netkit-Lab-Generator/master/images/screenshot.png)

Created by

   * Gaetano Bonofiglio (Kidel)
   * Lorenzo Ariemma (lorenzo93)
   * Veronica Iovinella (Neeja)

### Links

 * [**Netkit Home**](http://wiki.netkit.org/index.php/Main_Page)
 * [**Netkit on GitHub**](https://github.com/maxonthegit/netkit-core)

***

### FAQ

* **Q**: How can I make a machine that is both a web server and a  name server?
* **A**: Two machines with the same name are considered as the same machine. For any shared file, the configuration lines of the second machine are added right after the ones of the first machine. For any file that is not shared there is no conflict.
