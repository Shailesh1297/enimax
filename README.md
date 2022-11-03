# Screenshots

 #### Android ####
 <p align="middle">
  <img src="https://user-images.githubusercontent.com/107899019/199632645-08b20486-a60c-430c-90ef-c619c030a6f5.png" height="600">
  <img src="https://user-images.githubusercontent.com/107899019/199632627-181af73f-5bea-42d4-82b6-ec133568bf2b.png" height="600">
  <img src="https://user-images.githubusercontent.com/107899019/199632758-c246eb8d-8cff-4591-bcd4-05881fb50751.png" height="600">
  <img src="https://user-images.githubusercontent.com/107899019/196063736-ab26fb3e-574e-42ae-b6e9-a62633a302ac.jpg" width="600">
</p>

 #### Firefox extension ####
  <img src="https://user-images.githubusercontent.com/107899019/199632435-9e0708c1-11f8-4581-8ceb-f3e524fde913.png" width="100%">

 #### Chromium extension ####
  <img src="https://user-images.githubusercontent.com/107899019/199632586-9696e718-0634-4213-99c2-a81164a87672.png" width="100%">



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

