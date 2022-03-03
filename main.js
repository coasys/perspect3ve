require = require("esm")(module/*, options*/)
module.exports = require("./main.js")
const { Crypto } = require("@peculiar/webcrypto");
global.crypto = new Crypto();
const { app, BrowserWindow } = require('electron')
const express = require('express')
const ad4m = require('@perspect3vism/ad4m-executor')

const fs = require('fs')
const path = require('path')

const worldLinkLanguageHash = 'QmchPr6NgxFUrrETHrd49DSRdfFMdn6A5sw2JSXhujy4gS'
let bootstrapFixtures = {
  worldPerspective: JSON.parse(fs.readFileSync('./bootstrap/world.perspective.json')),
  worldLinkLanguageHash,
  worldLinkLinguageBundle:  fs.readFileSync(path.join('./bootstrap/', worldLinkLanguageHash, 'bundle.js')),
  worldLinkLinguageMeta: JSON.parse(fs.readFileSync(path.join('./bootstrap/', worldLinkLanguageHash, 'meta.json'))),
}

let ad4mCore
app.whenReady().then(() => {
  ad4m
  .init({
    appDataPath: app.getPath("appData"),
    resourcePath: __dirname,
    appDefaultLangPath: "./src/languages",
    ad4mBootstrapLanguages: {
      agents: "agent-expression-store",
      languages: "languages",
      perspectives: "perspective-language",
      neighbourhoods: "neighbourhood-store"
    },
    ad4mBootstrapFixtures: {
      languages: [
        {
          address: bootstrapFixtures.worldLinkLanguageHash,
          meta: bootstrapFixtures.worldLinkLinguageMeta,
          bundle: bootstrapFixtures.worldLinkLinguageBundle
        },
        {
          address: 'QmfDoeJgiG5Hs4DJcwPqDWbwU2Ks8zLSJjv7bR8is84Qt5',
          meta: {
            "author": "did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n",
            "timestamp": "2022-01-24T17:44:56.058Z",
            "data": {
              "name": "Social Context",
              "address": "QmfDoeJgiG5Hs4DJcwPqDWbwU2Ks8zLSJjv7bR8is84Qt5",
              "description": "Holochain based LinkLanguage. First full implementation of a LinkLanguage, for collaborative Neighbourhoods where every agent can add links. No membrane. Basic template for all custom Neighbourhoods in this first iteration of the Perspect3vism test network.",
              "possibleTemplateParams": ["uuid","name","description"],
              "sourceCodeLink": "https://github.com/juntofoundation/Social-Context"},
              "proof": {
                "signature": "88269fae7990dbd2fdbeb11431333120bc9bd49ae7c7619c19990dce4fca2f054fea4c6da0f331fb14a1be7c6218732c64da24969a551174f603f487290e30ad",
                "key": "#zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n",
                "valid": true
              }
            },
          bundle: fs.readFileSync(path.join('src', 'languages', 'social-context', 'build', 'bundle.js')).toString()
        },
        {
          address: 'QmRENn31FvsZZx99tg8nd8oM52MmGYa1tLUYaDvYdjnJsb',
          meta: {
            "author": "did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n",
            "timestamp":"2022-01-24T17:47:46.855Z",
            "data":{
              "name":"Direct Message Language",
              "address":"QmRENn31FvsZZx99tg8nd8oM52MmGYa1tLUYaDvYdjnJsb",
              "description":"Template source for personal, per-agent DM languages. Holochain based.",
              "possibleTemplateParams":["recipient_did","recipient_hc_agent_pubkey"],
              "sourceCodeLink":"https://github.com/perspect3vism/direct-message-language"
            },
            "proof":{
              "signature":"d5f120f0cd225386499c54addd0bd9e5b0706c448d6211c2cf94333f8c78734612f8a3606e8e188ffb370fca6bd6ae301337384b24809febb1d12c38c6cdebcf",
              "key":"#zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n",
              "valid":true
            }
          },
          bundle: fs.readFileSync(path.join('src', 'languages', 'direct-message-language', 'build', 'bundle.js')).toString()
        }
      ],
      perspectives: [{
        address: '__world',
        expression: bootstrapFixtures.worldPerspective
      }]
    },
    appBuiltInLangs: [
      "social-context",
      "note-ipfs",
      "virtual-icons"
    ],
    mocks: false
  })
  .then((core) => {
    ad4mCore = core

    console.log(
      "\x1b[36m%s\x1b[0m",
      "Starting account creation splash screen"
    );

    const splash = createSplash()
    ad4mCore.waitForAgent().then(async () => {
      console.log(
        "\x1b[36m%s\x1b[0m",
        "Agent has been init'd. Controllers now starting init..."
      );
      ad4mCore.initControllers();
      console.log("\x1b[32m", "Controllers init complete!");

      console.log(
        "\x1b[36m%s\x1b[0m",
        "Initializing languages..."
      );
      await ad4mCore.initLanguages()
      console.log("\x1b[32m", "All languages initialized!");


      createWindow()
      splash.close()
    });
  });

})

function createSplash () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    },
    minimizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
  })

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/public/splash.html`)

  // Open the DevTools.
  //win.webContents.openDevTools()

  return win
}

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  })

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/public/index.html`)

  // Open the DevTools.
  win.webContents.openDevTools()

  return win
}

function serveUI() {
  const expressApp = express()
  expressApp.use(express.static(`${__dirname}/public`))
  expressApp.listen(9090)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  await ad4mCore.exit()
  app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

serveUI()