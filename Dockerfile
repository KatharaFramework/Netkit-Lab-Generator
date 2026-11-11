# Browser-only deployment of Netkit Lab Generator.
# Electron and Kathará are not installed in this container.
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY src/ /usr/share/nginx/html/src/
COPY images/ /usr/share/nginx/html/images/
COPY examples/ /usr/share/nginx/html/examples/

EXPOSE 8080
