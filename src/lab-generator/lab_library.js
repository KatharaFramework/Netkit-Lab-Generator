/* Local laboratory snapshots. This database never uploads user data. */
var LabLibrary = (function () {
	"use strict";
	const DB_NAME = "netkit-lab-library";
	const STORE = "labs";

	function createLabSnapshot(info, machines) {
		if (!info || typeof info.description !== "string" || !info.description.trim())
			throw new Error("A lab description is required before saving");
		if (!Array.isArray(machines))
			throw new Error("The lab machines must be an array");
		// JSON deep-cloning avoids saving Angular references that may later be edited.
		const data = JSON.parse(JSON.stringify({ labInfo: info, netkit: machines }));
		return {
			id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2),
			name: info.description.trim(),
			savedAt: new Date().toISOString(),
			labInfo: data.labInfo,
			netkit: data.netkit
		};
	}

	function open() {
		return new Promise(function (resolve, reject) {
			if (!window.indexedDB) {
				reject(new Error("IndexedDB is unavailable in this browser"));
				return;
			}
			const request = window.indexedDB.open(DB_NAME, 1);
			request.onupgradeneeded = function () {
				if (!request.result.objectStoreNames.contains(STORE))
					request.result.createObjectStore(STORE, { keyPath: "id" });
			};
			request.onsuccess = function () { resolve(request.result); };
			request.onerror = function () { reject(request.error || new Error("Cannot open lab library")); };
		});
	}

	async function query(mode, action) {
		const db = await open();
		try {
			return await new Promise(function (resolve, reject) {
				const tx = db.transaction(STORE, mode);
				const request = action(tx.objectStore(STORE));
				request.onerror = function () { reject(request.error || new Error("Library operation failed")); };
				tx.oncomplete = function () { resolve(request.result); };
				tx.onabort = function () { reject(tx.error || new Error("Library transaction aborted")); };
				tx.onerror = function () { reject(tx.error || new Error("Library transaction failed")); };
			});
		} finally {
			db.close();
		}
	}

	return {
		createLabSnapshot: createLabSnapshot,
		save: function (info, machines) {
			const snapshot = createLabSnapshot(info, machines);
			return query("readwrite", function (store) { return store.put(snapshot); }).then(function () { return snapshot; });
		},
		list: function () {
			return query("readonly", function (store) { return store.getAll(); }).then(function (labs) {
				return labs.sort(function (a, b) { return b.savedAt.localeCompare(a.savedAt); });
			});
		},
		get: function (id) {
			return query("readonly", function (store) { return store.get(id); });
		},
		remove: function (id) {
			return query("readwrite", function (store) { return store.delete(id); });
		}
	};
})();
var createLabSnapshot = LabLibrary.createLabSnapshot;
