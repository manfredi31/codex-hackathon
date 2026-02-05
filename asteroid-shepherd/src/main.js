import Phaser from "phaser";

const WIDTH = 960;
const HEIGHT = 640;
const START_ASTEROIDS = 3;
const ASTEROID_CAP = 20;
const SPAWN_INTERVAL_MS = 12000;
const STATION_HP = 3;
const SCORE_TICK_MS = 1000;

const query = new URLSearchParams(window.location.search);
const isTest = query.get("test") === "1";
const startingSeed = Number.parseInt(query.get("seed"), 10) || 1337;

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.ship = null;
    this.asteroids = null;
    this.stations = [];
    this.scoreText = null;
    this.hpGraphics = null;
    this.score = 0;
    this.gameOver = false;
    this.elapsedMs = 0;
    this.spawnElapsed = 0;
    this.scoreElapsed = 0;
    this.speedMultiplier = 1;
    this.testMode = isTest;
    this.fixedDelta = 1000 / 60;
    this.restartKey = null;
    this.isRestarting = false;
    this.windowRestartHandler = null;
    this.restartButton = null;
    this.restartPanel = null;
    this.restartPanelMessage = null;
  }

  preload() {
    this.createTextures();
  }

  create() {
    this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);
    this.physics.world.setFPS(60);
    this.score = 0;
    this.gameOver = false;
    this.elapsedMs = 0;
    this.spawnElapsed = 0;
    this.scoreElapsed = 0;
    this.speedMultiplier = 1;

    if (this.testMode) {
      Phaser.Math.RND.seed = startingSeed;
    }

    this.createStations();
    this.createShip();
    this.createAsteroids();

    this.scoreText = this.add
      .text(16, 16, "Score 0", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "20px",
        color: "#e6f1ff",
      })
      .setDepth(10);

    this.hpGraphics = this.add.graphics().setDepth(10);
    this.updateStationUI();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("A,D,W,S");
    this.restartKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      true
    );

    this.restartPanel = document.getElementById("restart-panel");
    this.restartButton = document.getElementById("restart-btn");
    this.restartPanelMessage = this.restartPanel?.querySelector("p") || null;
    if (this.restartPanel) {
      this.restartPanel.classList.remove("active");
      this.restartPanel.setAttribute("aria-hidden", "true");
    }
    if (this.restartPanelMessage) {
      this.restartPanelMessage.textContent = "All stations lost";
    }
    if (this.restartButton) {
      this.restartButton.onclick = () => this.restartGame();
    }

    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.gameOver) {
        this.restartGame();
      }
    });

    this.events.once("postupdate", () => {
      if (window.__TEST__) {
        window.__TEST__.ready = true;
      }
    });

    if (this.testMode) {
      this.setupTestSeam();
    }
  }

  update(_, delta) {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.restartGame();
      }
      return;
    }

    const dt = this.testMode ? this.fixedDelta : delta;
    this.updateGameClock(dt);
    this.handleInput(dt);
    this.wrapObject(this.ship, 20);
    this.asteroids.children.iterate((asteroid) => {
      if (asteroid) {
        this.wrapObject(asteroid, asteroid.displayWidth * 0.5);
      }
    });
  }

  updateGameClock(delta) {
    this.elapsedMs += delta;
    this.spawnElapsed += delta;
    this.scoreElapsed += delta;

    this.speedMultiplier = 1 + Math.min(0.6, this.elapsedMs / 180000);

    while (this.spawnElapsed >= SPAWN_INTERVAL_MS) {
      this.spawnElapsed -= SPAWN_INTERVAL_MS;
      if (this.asteroids.countActive(true) < ASTEROID_CAP) {
        this.spawnAsteroid();
      }
    }

    while (this.scoreElapsed >= SCORE_TICK_MS) {
      this.scoreElapsed -= SCORE_TICK_MS;
      const alive = this.stations.filter((station) => station.active).length;
      if (alive > 0) {
        this.score += alive;
        this.scoreText.setText(`Score ${this.score}`);
      }
    }
  }

  handleInput(delta) {
    const rotateLeft = this.cursors.left.isDown || this.keys.A.isDown;
    const rotateRight = this.cursors.right.isDown || this.keys.D.isDown;
    const thrust = this.cursors.up.isDown || this.keys.W.isDown;
    const brake = this.cursors.down.isDown || this.keys.S.isDown;

    if (rotateLeft) {
      this.ship.rotation -= 0.004 * delta;
    }
    if (rotateRight) {
      this.ship.rotation += 0.004 * delta;
    }

    if (thrust) {
      const force = 0.07 * delta;
      const vec = new Phaser.Math.Vector2();
      this.physics.velocityFromRotation(
        this.ship.rotation - Math.PI / 2,
        force,
        vec
      );
      this.ship.body.velocity.add(vec);
    }

    if (brake) {
      this.ship.body.velocity.scale(0.96);
    }
  }

  createTextures() {
    const gfx = this.add.graphics();

    gfx.fillStyle(0x54f1ff, 1);
    gfx.beginPath();
    gfx.moveTo(16, 0);
    gfx.lineTo(32, 32);
    gfx.lineTo(0, 32);
    gfx.closePath();
    gfx.fillPath();
    gfx.generateTexture("ship", 32, 32);
    gfx.clear();

    const asteroidColors = [0x6e7a8a, 0x8c99ad, 0xb4bfcc];
    const sizes = [18, 28, 40];
    sizes.forEach((radius, idx) => {
      gfx.fillStyle(asteroidColors[idx], 1);
      gfx.fillCircle(radius, radius, radius);
      gfx.lineStyle(2, 0x2e3645, 1);
      gfx.strokeCircle(radius, radius, radius - 2);
      gfx.generateTexture(`asteroid-${radius}`, radius * 2, radius * 2);
      gfx.clear();
    });

    gfx.fillStyle(0xf6c453, 1);
    gfx.fillRoundedRect(0, 0, 48, 24, 6);
    gfx.lineStyle(2, 0x463620, 1);
    gfx.strokeRoundedRect(1, 1, 46, 22, 6);
    gfx.generateTexture("station", 48, 24);
    gfx.destroy();
  }

  createShip() {
    this.ship = this.physics.add.image(WIDTH / 2, HEIGHT / 2, "ship");
    this.ship.setDamping(true);
    this.ship.setDrag(0.95);
    this.ship.setMaxVelocity(260);
    this.ship.setBounce(1);
    this.ship.setCollideWorldBounds(false);
    this.ship.body.setAllowGravity(false);
    this.ship.body.setSize(26, 26, true);
    this.ship.rotation = 0;
  }

  createAsteroids() {
    this.asteroids = this.physics.add.group();
    for (let i = 0; i < START_ASTEROIDS; i += 1) {
      this.spawnAsteroid();
    }

    this.physics.add.collider(this.asteroids, this.asteroids);
    this.physics.add.collider(this.ship, this.asteroids, this.onShipHit, null, this);
    this.physics.add.collider(this.asteroids, this.stations, this.onAsteroidHitStation, null, this);
  }

  createStations() {
    const positions = [
      { x: 120, y: 100 },
      { x: WIDTH - 140, y: 120 },
      { x: 140, y: HEIGHT - 120 },
      { x: WIDTH - 160, y: HEIGHT - 140 },
    ];

    this.stations = positions.map((pos, idx) => {
      const station = this.physics.add.staticImage(pos.x, pos.y, "station");
      station.setData("hp", STATION_HP);
      station.setData("id", idx);
      station.refreshBody();
      return station;
    });
  }

  spawnAsteroid() {
    const sizes = [18, 28, 40];
    const radius = Phaser.Math.RND.pick(sizes);
    const x = Phaser.Math.Between(80, WIDTH - 80);
    const y = Phaser.Math.Between(80, HEIGHT - 80);
    const asteroid = this.asteroids.create(x, y, `asteroid-${radius}`);

    asteroid.setCircle(radius);
    asteroid.setBounce(1);
    asteroid.setCollideWorldBounds(false);
    asteroid.body.setAllowGravity(false);

    const speed = Phaser.Math.Between(30, 70) * this.speedMultiplier;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    asteroid.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    asteroid.setData("lastStationHit", 0);

    return asteroid;
  }

  onShipHit(ship, asteroid) {
    const impulse = new Phaser.Math.Vector2(
      asteroid.x - ship.x,
      asteroid.y - ship.y
    ).normalize();

    asteroid.body.velocity.add(impulse.scale(180));
    ship.body.velocity.add(impulse.scale(-60));
  }

  onAsteroidHitStation(asteroid, station) {
    const now = this.time.now;
    const lastHit = asteroid.getData("lastStationHit") || 0;
    if (now - lastHit < 400) {
      return;
    }

    asteroid.setData("lastStationHit", now);

    const hp = station.getData("hp") - 1;
    station.setData("hp", hp);

    if (hp <= 0) {
      station.disableBody(true, true);
    }

    this.updateStationUI();

    if (this.stations.every((s) => !s.active)) {
      this.triggerGameOver();
    }
  }

  updateStationUI() {
    this.hpGraphics.clear();
    const barWidth = 100;
    const barHeight = 10;
    const startX = WIDTH - barWidth - 20;
    const startY = 16;

    this.stations.forEach((station, index) => {
      const hp = station.active ? station.getData("hp") : 0;
      const y = startY + index * 18;

      this.hpGraphics.fillStyle(0x2b3240, 1);
      this.hpGraphics.fillRoundedRect(startX, y, barWidth, barHeight, 4);

      if (hp > 0) {
        const width = (hp / STATION_HP) * barWidth;
        this.hpGraphics.fillStyle(0xf6c453, 1);
        this.hpGraphics.fillRoundedRect(startX, y, width, barHeight, 4);
      }
    });
  }

  triggerGameOver() {
    this.gameOver = true;
    this.physics.pause();
    this.attachWindowRestart();
    this.showRestartPanel();

    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 10, "All stations lost", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "34px",
        color: "#ffb347",
      })
      .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 + 28, "Press Space or click Restart", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "18px",
        color: "#d5dbe7",
      })
      .setOrigin(0.5);
  }

  attachWindowRestart() {
    if (this.windowRestartHandler) {
      return;
    }

    this.windowRestartHandler = (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        this.restartGame();
      }
    };

    window.addEventListener("keydown", this.windowRestartHandler, { once: true });
  }

  restartGame() {
    if (this.isRestarting) return;
    this.isRestarting = true;
    window.location.reload();
  }

  showRestartPanel() {
    if (!this.restartPanel) return;
    this.restartPanel.classList.add("active");
    this.restartPanel.setAttribute("aria-hidden", "false");
  }

  wrapObject(sprite, padding) {
    if (!sprite) return;
    const half = padding || 0;

    if (sprite.x < -half) sprite.x = WIDTH + half;
    if (sprite.x > WIDTH + half) sprite.x = -half;
    if (sprite.y < -half) sprite.y = HEIGHT + half;
    if (sprite.y > HEIGHT + half) sprite.y = -half;
  }

  setupTestSeam() {
    const scene = this;
    window.__TEST__ = {
      ready: false,
      seed: startingSeed,
      setSeed(seed) {
        window.__TEST__.seed = seed;
        Phaser.Math.RND.seed = seed;
      },
      getState() {
        return {
          score: scene.score,
          stationsAlive: scene.stations.filter((s) => s.active).length,
          asteroids: scene.asteroids.countActive(true),
          gameOver: scene.gameOver,
        };
      },
      advanceTime(ms) {
        scene.updateGameClock(ms);
      },
      destroyStations() {
        scene.stations.forEach((station) => {
          station.setData("hp", 0);
          station.disableBody(true, true);
        });
        scene.updateStationUI();
        scene.triggerGameOver();
      },
    };

    Phaser.Math.RND.seed = startingSeed;
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#0a111c",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [GameScene],
};

new Phaser.Game(config);
