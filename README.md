# Screenshots

 #### Android ####
 <p align="middle">
  <img src="https://user-images.githubusercontent.com/107899019/226094073-c032f713-5613-4e8d-b6d9-31d2e0772a77.png" height="600">
  <img src="https://user-images.githubusercontent.com/107899019/226094101-3f79c55a-f95c-46f4-9358-c781ee1ba928.png" height="600">
  <img src="https://user-images.githubusercontent.com/107899019/226094138-9a01edae-891b-4040-9dfe-e74e0ae0f5c3.png" height="600">
  <img src="https://user-images.githubusercontent.com/107899019/226094153-867e9d44-c7e2-40cd-b606-4e2113d52429.png" width="600">
</p>

 #### Chromium extension ####
  <img src="https://user-images.githubusercontent.com/107899019/226093972-17563841-c5fc-4093-ac51-39febde97461.png" width="100%">




# How to build

After cloning the repository, run the following commands:

```
npm install -g cordova
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


# Recovering old data

`v1.1.6` uses an SQLite database instead of an IndexedDB to store downloaded-videos' data. Do the following to recover your data: 
1. Open the app and then open the `settings`.
2. Click on `Restore Data` and it should take care of the rest.

If you have any issues, you can create an issue, or post it on the discord server.

# Indirect contributors
[Consumet](https://github.com/consumet) and [Aniyomi](https://github.com/jmir1/aniyomi-extensions) were really helpful when I was trying to fix Zoro and Fmovies!

# Discord server
You can join the [discord server](https://discord.gg/cumVkBuU57) if you have any issues, or would like to request a feature.
