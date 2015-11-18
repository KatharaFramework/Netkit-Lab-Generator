$TTL   60000
@    IN SOA ns-com.com. root.ns-com.com. 2006031201 28800 14400 3600000 0

com.    IN NS ns-com.com.
ns-com.com.     IN A 192.168.0.4
eyesbook.com.    IN NS ns-eyesbook.com.
ns-eyesbook.com.    IN A 192.168.0.5
