# Netkit Lab Generator
A client-side JavaScript tool to configure a netkit lab and generate all the files you need.

Simply fill the form and download the bash script or the .zip file with the whole lab. 
It is also possible to export and import the form configuration for future changes.

Created by

   * Gaetano Bonofiglio (Kidel)
   * Lorenzo Ariemma (lorenzo93)
   * Veronica Iovinella (Neeja)

***

### FAQ

* **Q**: How can I make a machine that is both a web server and a  name server?
* **A**: Two machines with the same name are considered as the same machine. For any shared file, the configuration lines of the second machine are added right after the ones of the first machine. For any file that is not shared there is no conflict.