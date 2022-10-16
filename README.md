# Screenshots

 #### Android ####
 <p align="middle">
  <img src="https://user-images.githubusercontent.com/107899019/196063730-4554d20b-6fb8-4bfa-b073-6e3505bc52bd.jpg" height="600">
  <img src="https://user-images.githubusercontent.com/107899019/196063734-295d1793-fbad-40f0-b029-a3263a3fb864.jpg" height="600">
  <img src="https://user-images.githubusercontent.com/107899019/196063736-ab26fb3e-574e-42ae-b6e9-a62633a302ac.jpg" width="600">
</p>

 #### Firefox extension ####
  <img src="https://user-images.githubusercontent.com/107899019/196063742-d2d2a173-9baf-424e-8edf-1c657f9be79c.png" width="600">

 #### Chromium extension ####
  <img src="https://user-images.githubusercontent.com/107899019/196063743-8d61241d-9b50-4fe3-aba1-459d8ee627bc.png" width="600">


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

