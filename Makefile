all: build-mac-arm build-mac-x64 build-win-x64 build-win-arm64 build-linux-x64 build-linux-arm64

build-mac-arm: install-deps
	yarn electron-forge make --arch arm64 --platform darwin

build-mac-x64: install-deps
	yarn electron-forge make --arch x64 --platform darwin

build-win-x64: install-deps
	yarn electron-forge make --arch x64 --platform win32

build-win-arm64: install-deps
	yarn electron-forge make --arch arm64 --platform win32

build-linux-x64: install-deps
	yarn electron-forge make --arch x64 --platform linux

build-linux-arm64: install-deps
	yarn electron-forge make --arch arm64 --platform linux

install-deps:
	npm install

start: install-deps
	npm start