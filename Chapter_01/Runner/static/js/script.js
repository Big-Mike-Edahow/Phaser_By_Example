// script.js

class Game extends Phaser.Scene {
    constructor() {
        super({ key: "game" });
        this.player = null;
        this.score = 0;
        this.scoreText = null;
    }

    init(data) {
        this.name = data.name;
        this.number = data.number;
    }

    preload() {
        this.registry.set("score", "0");
        this.load.setBaseURL('static');
        this.load.audio("coin", "sounds/coin.mp3");
        this.load.audio("jump", "sounds/jump.mp3");
        this.load.audio("dead", "sounds/dead.mp3");
        this.load.audio("theme", "sounds/theme.mp3");
        this.load.spritesheet("coin", "images/game/coin.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.bitmapFont(
            "arcade",
            "fonts/arcade.png",
            "fonts/arcade.xml"
        );
        this.score = 0;
    }

    create() {
        this.width = this.sys.game.config.width;
        this.height = this.sys.game.config.height;
        this.center_width = this.width / 2;
        this.center_height = this.height / 2;

        this.cameras.main.setBackgroundColor(0x87ceeb);
        this.obstacles = this.add.group();
        this.coins = this.add.group();
        this.generator = new Generator(this);
        this.SPACE = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
        this.player = new Player(this, this.center_width - 100, this.height - 200);
        this.scoreText = this.add.bitmapText(
            this.center_width,
            10,
            "arcade",
            this.score,
            20
        );

        this.physics.add.collider(
            this.player,
            this.obstacles,
            this.hitObstacle,
            () => {
                return true;
            },
            this
        );

        this.physics.add.overlap(
            this.player,
            this.coins,
            this.hitCoin,
            () => {
                return true;
            },
            this
        );

        this.loadAudios();
        this.playMusic();

        // Listen to the mouse click or touch event.
        this.input.on("pointerdown", (pointer) => this.jump(), this);

        /* We use `updateScoreEvent` to update the score every 100ms so the
           player can see the score increasing as long as he survives. */
        this.updateScoreEvent = this.time.addEvent({
            delay: 100,
            callback: () => this.updateScore(),
            callbackScope: this,
            loop: true,
        });
    }

    /* This method is called when the player hits an obstacle. We stop
       the updateScoreEvent so the score doesn't increase anymore. And
       obviously, we finish the scene. */
    hitObstacle(player, obstacle) {
        this.updateScoreEvent.destroy();
        this.finishScene();
    }

    /* This method is called when the player hits a coin. We
       play a sound, update the score, and destroy the coin. */
    hitCoin(player, coin) {
        this.playAudio("coin");
        this.updateScore(1000);
        coin.destroy();
    }

    /* We use this `loadAudios` method to load all the audio
    files that we need for the game. Then we'll play them
    using the `playAudio` method. */
    loadAudios() {
        this.audios = {
            jump: this.sound.add("jump"),
            coin: this.sound.add("coin"),
            dead: this.sound.add("dead"),
        };
    }

    playAudio(key) {
        this.audios[key].play();
    }

    /* This method is specific to the music. We use
       it to play the theme music in a loop. */
    playMusic(theme = "theme") {
        this.theme = this.sound.add(theme);
        this.theme.stop();
        this.theme.play({
            mute: false,
            volume: 1,
            rate: 1,
            detune: 0,
            seek: 0,
            loop: true,
            delay: 0,
        });
    }

    /* This is the game loop. The function is called every frame.
       Here is where we can check if a key was pressed or the
       situation of the player to act accordingly. We use the
       `update` method to check if the player pressed the space key. */
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.SPACE)) {
            this.jump();
        } else if (this.player.body.blocked.down) {
            this.jumpTween?.stop();
            this.player.rotation = 0;
            // ground
        }
    }

    /* This is the method that we use to make the player jump. A jump is just
       a velocity in the Y-axis. Gravity will do the rest. We also play a
       jumping sound and we add a tween to rotate the player while jumping. */
    jump() {
        if (!this.player.body.blocked.down) return;
        this.player.body.setVelocityY(-300);

        this.playAudio("jump");
        this.jumpTween = this.tweens.add({
            targets: this.player,
            duration: 1000,
            angle: { from: 0, to: 360 },
            repeat: -1,
        });
    }

    /*  - Stop the theme music
        - Play the dead sound
        - Set the score in the registry to show it in the `gameover` scene.
        - Start the `gameover` scene. */
    finishScene() {
        this.theme.stop();
        this.playAudio("dead");
        this.registry.set("score", "" + this.score);
        this.scene.start("gameover");
    }

    /* This method is called every 100ms and it is used
    to update the score and show it on the screen. */
    updateScore(points = 1) {
        this.score += points;
        this.scoreText.setText(this.score);
    }
}

class Player extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y, number) {
        super(scene, x, y, 32, 32, 0x00ff00);
        this.setOrigin(0.5);
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.body.collideWorldBounds = true;
        this.setScale(1);
        this.jumping = false;
        this.invincible = false;
        this.health = 10;
        this.body.mass = 10;
        this.body.setDragY = 10;
    }
}

class Generator {
    constructor(scene) {
        this.scene = scene;
        this.scene.time.delayedCall(2000, () => this.init(), null, this);
        this.pinos = 0;
    }

    init() {
        this.generateCloud();
        this.generateObstacle();
        this.generateCoin();
    }

    /* This is the function that generates the clouds. It creates a new cloud,
    and then calls itself again after a random amount of time.
    This is done using the Phaser `time.delayedCall` function. */
    generateCloud() {
        new Cloud(this.scene);
        this.scene.time.delayedCall(
            Phaser.Math.Between(2000, 3000),
            () => this.generateCloud(),
            null,
            this
        );
    }

    generateObstacle() {
        this.scene.obstacles.add(
            new Obstacle(
                this.scene,
                800,
                this.scene.height - Phaser.Math.Between(32, 128)
            )
        );
        this.scene.time.delayedCall(
            Phaser.Math.Between(1500, 2500),
            () => this.generateObstacle(),
            null,
            this
        );
    }

    generateCoin() {
        this.scene.coins.add(
            new Coin(
                this.scene,
                800,
                this.scene.height - Phaser.Math.Between(32, 128)
            )
        );
        this.scene.time.delayedCall(
            Phaser.Math.Between(500, 1500),
            () => this.generateCoin(1),
            null,
            this
        );
    }
}

/* This is a game object that represents a cloud. It's a simple rectangle
with a random size and position. We use a tween to move it from right to
left, and then destroy it when it's out of the screen. */
class Cloud extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        const finalY = y || Phaser.Math.Between(0, 100);
        super(scene, x, finalY, 98, 32, 0xffffff);
        scene.add.existing(this);
        const alpha = 1 / Phaser.Math.Between(1, 3);

        this.setScale(alpha);
        this.init();
    }

    init() {
        this.scene.tweens.add({
            targets: this,
            x: { from: 800, to: -100 },
            duration: 2000 / this.scale,
            onComplete: () => {
                this.destroy();
            },
        });
    }
}

/* This is a game object that represents an obstacle. It works exactly
like the cloud, but it's a red rectangle that is part of the obstacles
group that we created in the `game` scene. It can kill the player if
it touches it. */
class Obstacle extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y, 32, 32, 0xff0000);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        const alpha = 1 / Phaser.Math.Between(1, 3);

        this.init();
    }

    init() {
        this.scene.tweens.add({
            targets: this,
            x: { from: 820, to: -100 },
            duration: 2000,
            onComplete: () => {
                this.destroy();
            },
        });
    }
}

/* This is a game object that represents a coin. It's an animated sprite
that is part of the coins group that we created in the `game` scene.
It moves like the previous cloud and the obstacle objects. It can
increase the player's score if it touches it. */
class Coin extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "coin");
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        const alpha = 1 / Phaser.Math.Between(1, 3);

        this.init();
    }

    init() {
        this.scene.tweens.add({
            targets: this,
            x: { from: 820, to: -100 },
            duration: 2000,
            onComplete: () => {
                this.destroy();
            },
        });
        if (!this.scene.anims.exists('coin')) {
            const coinAnimation = this.scene.anims.create({
                key: "coin",
                frames: this.scene.anims.generateFrameNumbers("coin", {
                    start: 0,
                    end: 7,
                }),
                frameRate: 8,
            });
        }
        this.play({ key: "coin", repeat: -1 });
    }
}

class GameOver extends Phaser.Scene {
    constructor() {
        super({ key: "gameover" });
    }

    create() {
        this.width = this.sys.game.config.width;
        this.height = this.sys.game.config.height;
        this.center_width = this.width / 2;
        this.center_height = this.height / 2;

        this.cameras.main.setBackgroundColor(0x87ceeb);

        this.add
            .bitmapText(
                this.center_width,
                50,
                "arcade",
                this.registry.get("score"),
                25
            )
            .setOrigin(0.5);
        this.add
            .bitmapText(
                this.center_width,
                this.center_height,
                "arcade",
                "GAME OVER",
                45
            )
            .setOrigin(0.5);
        this.add
            .bitmapText(
                this.center_width,
                250,
                "arcade",
                "Press SPACE or Click to restart!",
                15
            )
            .setOrigin(0.5);
        this.input.keyboard.on("keydown-SPACE", this.startGame, this);
        this.input.on("pointerdown", (pointer) => this.startGame(), this);
    }

    showLine(text, y) {
        let line = this.introLayer.add(
            this.add
                .bitmapText(this.center_width, y, "pixelFont", text, 25)
                .setOrigin(0.5)
                .setAlpha(0)
        );
        this.tweens.add({
            targets: line,
            duration: 2000,
            alpha: 1,
        });
    }

    startGame() {
        this.scene.start("game");
    }
}

const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 300,
    parent: "game-canvas",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 350 },
            debug: true,
        },
    },
    scene: [Game, GameOver],
};

const game = new Phaser.Game(config);
