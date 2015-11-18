$TTL   60000
@    IN SOA ns-eyesbook.com. root.ns-eyesbook.com. 2006031201 28800 14400 3600000 0

eyesbook.com.    IN NS ns-eyesbook.com.
ns-eyesbook.com.    IN A 192.168.0.5
www.eyesbook.com.    IN A 192.168.0.6
