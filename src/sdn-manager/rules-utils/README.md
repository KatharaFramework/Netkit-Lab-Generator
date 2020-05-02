https://ryu.readthedocs.io/en/latest/app/ofctl_rest.html#description-of-actions-on-request-messages

# MATCHES
WHAT | EXAMPLE 
--- | ---
{} | vuol dire match con ogni cosa
{in_port: 1} | Match con la porta
in_phy_port | {"in_phy_port": 5, "in_port": 3}
metadata | {"metadata": 12345} or {"metadata": "0x1212/0xffff"}
eth_type | {"eth_type": 2048}
vlan_vid | 
vlan_pcp | {"vlan_pcp": 3, "vlan_vid": 3}
ip_dscp | {"ip_dscp": 3, "eth_type": 2048}
ip_ecn | {"ip_ecn": 0, "eth_type": 34525}
ip_proto | {"ip_proto": 5, "eth_type": 34525}
udp_src | {"udp_src": 2, "ip_proto": 17, "eth_type": 2048}
udp_dst | {"udp_dst": 6, "ip_proto": 17, "eth_type": 2048}
sctp_src | {"sctp_src": 99, "ip_proto": 132, "eth_type": 2048}
sctp_dst | {"sctp_dst": 99, "ip_proto": 132, "eth_type": 2048}
icmpv4_type | {"icmpv4_type": 5, "ip_proto": 1, "eth_type": 2048}
icmpv4_code | {"icmpv4_code": 6, "ip_proto": 1, "eth_type": 2048}
arp_op | {"arp_op": 3, "eth_type": 2054}
arp_spa | {"arp_spa": "192.168.0.11", "eth_type": 2054}
arp_tpa | {"arp_tpa": "192.168.0.44/24", "eth_type": 2054}
arp_sha | {"arp_sha": "aa:bb:cc:11:22:33", "eth_type": 2054}
arp_tha | {"arp_tha": "aa:bb:cc:11:22:33/00:00:00:00:ff:ff", "eth_type": 2054}
ipv6_src | {"ipv6_src": "2001::aaaa:bbbb:cccc:1111", "eth_type": 34525}
ipv6_dst | {"ipv6_dst": "2001::ffff:cccc:bbbb:1111/64", "eth_type": 34525}
ipv6_flabel | {"ipv6_flabel": 2, "eth_type": 34525}
icmpv6_type | {"icmpv6_type": 3, "ip_proto": 58, "eth_type": 34525}
icmpv6_code | {"icmpv6_code": 4, "ip_proto": 58, "eth_type": 34525}
ipv6_nd_target | {"ipv6_nd_target": "2001::ffff:cccc:bbbb:1111", "icmpv6_type": 135, "ip_proto": 58, "eth_type": 34525}
ipv6_nd_sll | {"ipv6_nd_sll": "aa:bb:cc:11:22:33", "icmpv6_type": 135, "ip_proto": 58, "eth_type": 34525}
ipv6_nd_tll | {"ipv6_nd_tll": "aa:bb:cc:11:22:33", "icmpv6_type": 136, "ip_proto": 58, "eth_type": 34525}
mpls_tc | {"mpls_tc": 2, "eth_type": 34888}
mpls_bos | {"mpls_bos": 1, "eth_type": 34888}
pbb_isid | {"pbb_isid": 5, "eth_type": 35047} or{"pbb_isid": "0x05/0xff", "eth_type": 35047}
tunnel_id | {"tunnel_id": 7} or {"tunnel_id": "0x07/0xff"}
ipv6_exthdr | {"ipv6_exthdr": 3, "eth_type": 34525} or {"ipv6_exthdr": "0x40/0x1F0", "eth_type": 34525}
pbb_uca | {"pbb_uca": 1, "eth_type": 35047}

# ACTIONS
WHAT | EXAMPLE 
--- | ---
[] | vuol dire drop
OUTPUT | [{type: "OUTPUT", port: 2}]
COPY_TTL_OUT | {"type": "COPY_TTL_OUT"}
COPY_TTL_IN | {"type": "COPY_TTL_IN"}
SET_MPLS_TTL | {"type": "SET_MPLS_TTL", "mpls_ttl": 64}
DEC_MPLS_TTL | {"type": "DEC_MPLS_TTL"}
PUSH_VLAN | {"type": "PUSH_VLAN", "ethertype": 33024}
POP_VLAN | {"type": "POP_VLAN"}
SET_QUEUE | {"type": "SET_QUEUE", "queue_id": 7}
GROUP | {"type": "GROUP", "group_id": 5}
SET_NW_TTL | {"type": "SET_NW_TTL", "nw_ttl": 64}
DEC_NW_TTL | {"type": "DEC_NW_TTL"}
PUSH_PBB | {"type": "PUSH_PBB", "ethertype": 35047}
POP_PBB | {"type": "POP_PBB"}
COPY_FIELD | {"type": "COPY_FIELD", "n_bits": 32, "src_offset": 1, "dst_offset": 2, "src_oxm_id": "eth_src", "dst_oxm_id": "eth_dst"}
METER | {"type": "METER", "meter_id": 3}
EXPERIMENTER | {"type": "EXPERIMENTER", "experimenter": 101, "data": "AAECAwQFBgc=", "data_type": "base64"}
WRITE_METADATA | {"type": "WRITE_METADATA", "metadata": 0x3, "metadata_mask": 0x3}
METER | {"type": "METER", "meter_id": 3}
WRITE_ACTIONS | {"type": "WRITE_ACTIONS", actions":[{"type":"POP_VLAN",},{ "type":"OUTPUT", "port": 2}]}
CLEAR_ACTIONS | {"type": "CLEAR_ACTIONS"}

# ETHERTYPES
HEX | PROTOCOL | DECIMAL 
--- | --- | ---
0x0800 | IPv4 | 2048
0x0806 | ARP | 2054
0x8847 | MPLS unicast | 34887
0x8848 | MPLS multicast | 34888
0x88cc | LLDP | 35020