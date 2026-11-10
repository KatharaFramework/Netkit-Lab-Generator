// Validate a single IPv4 or IPv6 CIDR address without external dependencies.
function validateIpNet(value) {
	if (value === "") return true;
	if (typeof value !== "string") return false;
	const parts = value.split("/");
	if (parts.length !== 2 || !/^[0-9]+$/.test(parts[1])) return false;
	const prefix = Number(parts[1]);
	const ip = parts[0];
	if (ip.includes(":")) {
		if (prefix > 128 || !/^[0-9a-fA-F:]+$/.test(ip)) return false;
		if ((ip.match(/::/g) || []).length > 1) return false;
		const compressed = ip.includes("::");
		const halves = compressed ? ip.split("::") : [ip];
		const left = halves[0] ? halves[0].split(":") : [];
		const right = compressed && halves[1] ? halves[1].split(":") : [];
		const groups = left.concat(right);
		if (groups.some(group => !/^[0-9a-fA-F]{1,4}$/.test(group))) return false;
		return compressed ? groups.length < 8 : groups.length === 8;
	}
	if (prefix > 32) return false;
	const octets = ip.split(".");
	return octets.length === 4 &&
		octets.every(octet => /^(0|[1-9][0-9]{0,2})$/.test(octet) && Number(octet) <= 255);
}

// A next-hop gateway is an address literal, not a CIDR prefix.
function validateIpAddress(value) {
	if (value === "") return true;
	if (typeof value !== "string" || value.includes("/")) return false;
	return validateIpNet(value + (value.includes(":") ? "/128" : "/32"));
}
