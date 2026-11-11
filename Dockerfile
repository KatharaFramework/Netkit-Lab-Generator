# Browser-only deployment of Netkit Lab Generator.
# Electron and Kathará are not installed in this container.
# Download official native ZIP archives at a pinned Kathara-Labs revision.
# These are the ORIGINAL labs, not the editable conversions in the UI.
FROM alpine:3.22 AS lab-archives
RUN apk add --no-cache curl unzip
ARG KATHARA_LABS_REV=63a2258e0ad6725ce4771f63439c543e5bd12656
RUN set -eux; \
    mkdir -p /labs; \
    base="https://raw.githubusercontent.com/KatharaFramework/Kathara-Labs/${KATHARA_LABS_REV}/main-labs/basic-topics"; \
    curl -fsSL --retry 3 "$base/two-computers/kathara-lab_two-computers.zip" -o /labs/a_simple_example_two_computers_on_a_single_lan.zip; \
    curl -fsSL --retry 3 "$base/basic-ipv4/kathara-lab_basic-ipv4.zip" -o /labs/basic_ipv4_configurations_ping_traceroute_and_arp.zip; \
    curl -fsSL --retry 3 "$base/static-routing/kathara-lab_static-routing.zip" -o /labs/a_simple_example_showing_how_to_configure_static_routes.zip; \
    unzip -t /labs/a_simple_example_two_computers_on_a_single_lan.zip; \
    unzip -t /labs/basic_ipv4_configurations_ping_traceroute_and_arp.zip; \
    unzip -t /labs/a_simple_example_showing_how_to_configure_static_routes.zip; \
    cp /labs/a_simple_example_two_computers_on_a_single_lan.zip /labs/two-computers.zip; \
    cp /labs/basic_ipv4_configurations_ping_traceroute_and_arp.zip /labs/basic-ipv4.zip; \
    cp /labs/a_simple_example_showing_how_to_configure_static_routes.zip /labs/static-routing.zip

FROM nginxinc/nginx-unprivileged:stable-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY src/ /usr/share/nginx/html/src/
COPY images/ /usr/share/nginx/html/images/
COPY examples/ /usr/share/nginx/html/examples/
COPY --from=lab-archives /labs/ /usr/share/nginx/html/labs/

EXPOSE 8080
