all: build-mac-arm build-mac-x64 build-win-x64 build-win-arm64 build-linux-x64 build-linux-arm64

build-mac-arm:
	yarn electron-forge make --arch arm64 --platform darwin

build-mac-x64:
	yarn electron-forge make --arch x64 --platform darwin

build-win-x64:
	yarn electron-forge make --arch x64 --platform win32

build-win-arm64:
	yarn electron-forge make --arch arm64 --platform win32

build-linux-x64:
	yarn electron-forge make --arch x64 --platform linux

build-linux-arm64:
	yarn electron-forge make --arch arm64 --platform linux