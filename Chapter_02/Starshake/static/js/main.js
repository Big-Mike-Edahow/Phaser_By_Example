// main.js

import Bootloader from "./scenes/bootloader.js";
import Outro from "./scenes/outro.js";
import Splash from "./scenes/splash.js";
import Transition from "./scenes/transition.js";
import Game from "./scenes/game.js";

const config = {
    width: 1000,
    height: 800,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    autoRound: false,
    parent: "game-canvas",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: [Bootloader, Splash, Transition, Game, Outro],
    title: "Starshake",
    version: "1.0",
};

const game = new Phaser.Game(config);
