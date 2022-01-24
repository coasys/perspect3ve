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
          address: 'QmWxQXz8M62TG1Ba7L49uVXMgabzMx4AP4Y56gy3PRvGpW',
          meta: {
            author: 'did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n',
            timestamp: '2021-10-07T21:39:36.607Z',
            data: {
              name: 'Social Context',
              address: 'QmWxQXz8M62TG1Ba7L49uVXMgabzMx4AP4Y56gy3PRvGpW',
              description: 'Holochain based LinkLanguage. First full implementation of a LinkLanguage, for collaborative Neighbourhoods where every agent can add links. No membrane. Basic template for all custom Neighbourhoods in this first iteration of the Perspect3vism test network.',
              author: 'did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n',
              templated: false,
              templateSourceLanguageAddress: null,
              templateAppliedParams: null,
              possibleTemplateParams: [ 'uuid', 'name', 'description' ],
              sourceCodeLink: "https://github.com/juntofoundation/Social-Context'"
            },
            proof: {
              signature: "e933e34f88694816ea91361605c8c2553ceeb96e847f8c73b75477cc7d9bacaf11eae34e38c2e3f474897f59d20f5843d6f1d2c493b13552093bc16472b0ac33",
              key: "#zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n",
              valid: true
            }
          },
          bundle: fs.readFileSync(path.join('src', 'languages', 'social-context', 'build', 'bundle.js')).toString()
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