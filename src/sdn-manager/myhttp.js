var myhttp = new (/** @class */ (function () {

	function MyHTTPRequester() {
		this.requester = null;
		this.lastResponse = null;
		this.lastRequest = {
			method: null,
			path: null,
			params: null
		};
		this.busy = false;
		this.queue = [];
		this.url = document.location.origin + "/";
	}

	MyHTTPRequester.prototype.set = function (containerName) {
		this.requester = new XMLHttpRequest();
		this.makeRequest("POST", "setup/", { controllersIP: containerName });
	};

	MyHTTPRequester.prototype.isReady = function () { return this.requester !== null; };

	MyHTTPRequester.prototype.makeRequest = function (method, path, params, callback) {
		var _this = this;
		if (params === void 0) { params = {}; }
		if (this.busy) {
			// console.log('+1 queued')
			this.queue.push({ method: method, path: path, params: params, callback: callback });
		}
		else {
			this.busy = true;
			this.lastRequest = { method: method, path: path, params: params };
			this.requester.onreadystatechange = function () {
				// readyState può essere (da 0 a 4): UNSENT, OPENED, HEADERS_RECEIVED, LOADING, DONE
				if (_this.requester.readyState == 4) {
					if (_this.requester.status == 200) {
						_this.lastResponse = _this.requester.responseText;
						// console.log('---> ' + this.lastResponse)
						if (callback)
							callback(_this.lastResponse);
					}
					else {
						// console.log('-x-> ' + this.requester.status)
						if (callback)
							callback(null, _this.requester.status);
					}
					_this.busy = false;
					var pendingRequest = _this.queue.shift();
					if (pendingRequest) {
						_this.makeRequest(pendingRequest.method, pendingRequest.path, pendingRequest.params, pendingRequest.callback);
					}
				}
			};
			var url = this.url;
			if (path === "setup/")
				url += path;
			else {
				url += "gw/";
				params.path = path;
			}
			// console.log('$', method, url, params)
			if (method == "GET") {
				url += this._makeQueryString(params);
				this.requester.open(method, url);
			}
			else if (method == "POST") {
				this.requester.open(method, url);
				this.requester.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			}
			this.requester.send(method == "POST" ? JSON.stringify(params) : null);
		}
	};

	MyHTTPRequester.prototype._makeQueryString = function (params) {
		var queryString = "?";
		for (var par in params) {
			queryString += par + "=" + params[par] + "&";
		}
		return queryString;
	};

	return MyHTTPRequester;
}()))();
