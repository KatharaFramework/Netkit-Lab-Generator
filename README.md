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

### Docker (browser-only deployment)

The app can be served as a **static web application** using an unprivileged
Nginx Alpine container. No Node.js runtime, Electron, Kathará daemon or Docker
socket is required inside the container.

With Docker Compose:

```sh
docker compose up -d --build
```

Then open **http://localhost:8080** from the Docker host.

With Docker alone:

```sh
docker build -t netkit-lab-generator:local .
docker run -d --name netkit-lab-generator -p 8080:8080 \
  --restart unless-stopped netkit-lab-generator:local
```

Check that the service responds:

```sh
curl -fI http://localhost:8080/
```

Stop a Compose deployment using `docker compose down`.

**Important limitations:**

- This image serves only the browser UI. The Electron-only **Run on Host**
  feature cannot start Kathará containers from this web server. Generated
  laboratory scripts and ZIP files are still downloadable to run separately
  on a machine with Kathará installed.
- **My saved laboratories** uses IndexedDB in each visitor's browser; there
  is no server-side storage volume. Export a `.config` backup if the data
  must survive a browser-profile reset or be moved between computers.
- Chrome's native file save picker requires a secure context such as
  `https://` or `http://localhost`. When browsing over ordinary HTTP from
  another computer, the app falls back to the browser's normal download flow.
- Exposing the container on a public network should be done behind a
  HTTPS reverse proxy with appropriate access controls.
