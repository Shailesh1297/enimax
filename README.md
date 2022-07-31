# How to build

After cloning the repository, run the following commands:

```
npm install -g cordova
npm install
```

```
cordova platform add android@9.0.0
```

This will take care of pretty much eveything.

To finally build the apk, run:

```
cordova build android
```

# Chrome extension
You can also install the chrome extension: [https://github.com/enimax-anime/enimax-chrome-extension](https://github.com/enimax-anime/enimax-chrome-extension)

# Firefox extension
You can also install the firefox extension: [https://github.com/enimax-anime/enimax-firefox-extension](https://github.com/enimax-anime/enimax-firefox-extension)


# Synchronizing across devices

You can set up your own server: [https://github.com/enimax-anime/enimax-server](https://github.com/enimax-anime/enimax-server).

After your remote server has been set up:
1. Open the app and then open the settings.
2. Click on `Change server`.
3. Turn off the `Local` setting.
4. Enter the URL of your server with the port number (If the URL does not have a specific port number, just enter the URL without it).
5. Then you'll be prompted to enter the URL without the port number.



# Download

If you just want to download the pre-built app, go to the [releases](https://github.com/enimax-anime/enimax/releases) page.


