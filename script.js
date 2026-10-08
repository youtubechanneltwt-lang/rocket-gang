const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menuBtn = document.getElementById("menuBtn");
const pauseBtn = document.getElementById("pauseBtn");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const highScoreText = document.getElementById("highScore");
const finalScoreText = document.getElementById("finalScore");

let W, H;

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

let rocket;
let asteroids = [];
let coins = [];
let powerups = [];
let stars = [];
let particles = [];

let score = 0;
let lives = 3;
let gameRunning = false;
let paused = false;
let lastTime = 0;
let asteroidTimer = 0;
let coinTimer = 0;
let powerTimer = 0;

let highScore = Number(localStorage.getItem("rocketHighScore")) || 0;
highScoreText.textContent = highScore;

const keys = {};

document.addEventListener("keydown", e => {
    keys[e.code] = true;

    if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)
    ) {
        e.preventDefault();
    }

    if (e.code === "KeyP") {
        togglePause();
    }
});

document.addEventListener("keyup", e => {
    keys[e.code] = false;
});

class Rocket {
    constructor() {
        this.x = W * 0.18;
        this.y = H / 2;
        this.width = 55;
        this.height = 30;
        this.speed = 7;
        this.invincible = 0;
    }

    update() {
        if (keys["ArrowUp"] || keys["KeyW"]) {
            this.y -= this.speed;
        }

        if (keys["ArrowDown"] || keys["KeyS"]) {
            this.y += this.speed;
        }

        if (keys["ArrowLeft"] || keys["KeyA"]) {
            this.x -= this.speed;
        }

        if (keys["ArrowRight"] || keys["KeyD"]) {
            this.x += this.speed;
        }

        if (keys["Space"]) {
            this.x += 3;
        }

        this.x = Math.max(20, Math.min(W - this.width - 20, this.x));
        this.y = Math.max(30, Math.min(H - this.height - 30, this.y));

        if (this.invincible > 0) {
            this.invincible--;
        }
    }

    draw() {

        if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
            return;
        }

        ctx.save();

        ctx.shadowColor = "#00eaff";
        ctx.shadowBlur = 20;

        // Rocket body
        const gradient = ctx.createLinearGradient(
            this.x,
            this.y,
            this.x + this.width,
            this.y
        );

        gradient.addColorStop(0, "#eeeeee");
        gradient.addColorStop(0.5, "#00eaff");
        gradient.addColorStop(1, "#ffffff");

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 15);
        ctx.lineTo(this.x + 45, this.y);
        ctx.lineTo(this.x + this.width, this.y + 15);
        ctx.lineTo(this.x + 45, this.y + 30);
        ctx.closePath();
        ctx.fill();

        // Window
        ctx.fillStyle = "#071c55";
        ctx.beginPath();
        ctx.arc(this.x + 34, this.y + 15, 7, 0, Math.PI * 2);
        ctx.fill();

        // Flame
        ctx.shadowColor = "#ff7b00";
        ctx.shadowBlur = 15;

        ctx.fillStyle = "#ff9d00";

        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 10);
        ctx.lineTo(this.x - 25, this.y + 15);
        ctx.lineTo(this.x, this.y + 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#fff";

        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 12);
        ctx.lineTo(this.x - 13, this.y + 15);
        ctx.lineTo(this.x, this.y + 18);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

function createStars() {
    stars = [];

    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5
        });
    }
}

function drawStars() {

    ctx.fillStyle = "#ffffff";

    stars.forEach(star => {

        star.x -= star.speed;

        if (star.x < 0) {
            star.x = W;
            star.y = Math.random() * H;
        }

        ctx.globalAlpha = Math.random() * 0.8 + 0.2;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
}

function spawnAsteroid() {

    const size = Math.random() * 35 + 20;

    asteroids.push({
        x: W + size,
        y: Math.random() * (H - 80) + 40,
        size: size,
        speed: Math.random() * 3 + 4,
        rotation: Math.random() * 6,
        rotationSpeed: Math.random() * 0.05
    });
}

function drawAsteroids() {

    asteroids.forEach((a, index) => {

        a.x -= a.speed;
        a.rotation += a.rotationSpeed;

        ctx.save();

        ctx.translate(a.x, a.y);
        ctx.rotate(a.rotation);

        ctx.fillStyle = "#777";
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 3;

        ctx.beginPath();

        for (let i = 0; i < 8; i++) {

            const angle = (Math.PI * 2 / 8) * i;
            const radius = a.size * (0.7 + Math.random() * 0.3);

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        if (a.x < -100) {
            asteroids.splice(index, 1);
        }
    });
}

function spawnCoin() {

    coins.push({
        x: W + 30,
        y: Math.random() * (H - 100) + 50,
        size: 10,
        speed: 5
    });
}

function drawCoins() {

    coins.forEach((coin, index) => {

        coin.x -= coin.speed;

        ctx.save();

        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 20;

        ctx.fillStyle = "#ffd700";

        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";

        ctx.beginPath();
        ctx.arc(
            coin.x - 3,
            coin.y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

        if (coin.x < -30) {
            coins.splice(index, 1);
        }
    });
}

function spawnPowerup() {

    const types = ["shield", "boost", "life"];

    powerups.push({
        x: W + 30,
        y: Math.random() * (H - 100) + 50,
        size: 15,
        speed: 4,
        type: types[Math.floor(Math.random() * types.length)]
    });
}

function drawPowerups() {

    powerups.forEach((p, index) => {

        p.x -= p.speed;

        ctx.save();

        ctx.shadowColor =
            p.type === "shield"
                ? "#00eaff"
                : p.type === "boost"
                    ? "#ff6600"
                    : "#ff3399";

        ctx.shadowBlur = 25;

        ctx.fillStyle =
            p.type === "shield"
                ? "#00eaff"
                : p.type === "boost"
                    ? "#ff6600"
                    : "#ff3399";

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            p.type === "shield"
                ? "S"
                : p.type === "boost"
                    ? "B"
                    : "+",
            p.x,
            p.y
        );

        ctx.restore();

        if (p.x < -40) {
            powerups.splice(index, 1);
        }
    });
}

function createExplosion(x, y) {

    for (let i = 0; i < 35; i++) {

        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 40,
            size: Math.random() * 5 + 2
        });
    }
}

function drawParticles() {

    particles.forEach((p, index) => {

        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = "#ff8c00";

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life <= 0) {
            particles.splice(index, 1);
        }
    });

    ctx.globalAlpha = 1;
}

function collision(a, b) {

    return (
        a.x < b.x + b.size &&
        a.x + a.width > b.x - b.size &&
        a.y < b.y + b.size &&
        a.y + a.height > b.y - b.size
    );
}

function updateGame(time) {

    if (!gameRunning) return;

    if (paused) {
        requestAnimationFrame(updateGame);
        return;
    }

    const delta = time - lastTime;
    lastTime = time;

    rocket.update();

    drawStars();
    rocket.draw();

    asteroidTimer += delta;
    coinTimer += delta;
    powerTimer += delta;

    const difficulty = Math.min(score / 1000, 3);

    if (asteroidTimer > 800 - difficulty * 150) {
        spawnAsteroid();
        asteroidTimer = 0;
    }

    if (coinTimer > 1200) {
        spawnCoin();
        coinTimer = 0;
    }

    if (powerTimer > 6000) {
        spawnPowerup();
        powerTimer = 0;
    }

    drawAsteroids();
    drawCoins();
    drawPowerups();
    drawParticles();

    checkCollisions();

    score += 0.03;

    scoreText.textContent = Math.floor(score);

    requestAnimationFrame(updateGame);
}

function checkCollisions() {

    asteroids.forEach((a, index) => {

        if (rocket.invincible <= 0 && collision(rocket, a)) {

            createExplosion(rocket.x, rocket.y);

            asteroids.splice(index, 1);

            lives--;
            livesText.textContent = lives;

            rocket.invincible = 100;

            if (lives <= 0) {
                endGame();
            }
        }
    });

    coins.forEach((coin, index) => {

        if (
            rocket.x < coin.x + coin.size &&
            rocket.x + rocket.width > coin.x - coin.size &&
            rocket.y < coin.y + coin.size &&
            rocket.y + rocket.height > coin.y - coin.size
        ) {

            score += 100;
            coins.splice(index, 1);
        }
    });

    powerups.forEach((p, index) => {

        if (
            rocket.x < p.x + p.size &&
            rocket.x + rocket.width > p.x - p.size &&
            rocket.y < p.y + p.size &&
            rocket.y + rocket.height > p.y - p.size
        ) {

            if (p.type === "shield") {
                rocket.invincible = 400;
            }

            if (p.type === "boost") {
                score += 300;
            }

            if (p.type === "life") {
                lives = Math.min(5, lives + 1);
                livesText.textContent = lives;
            }

            powerups.splice(index, 1);
        }
    });
}

function startGame() {

    score = 0;
    lives = 3;

    scoreText.textContent = "0";
    livesText.textContent = "3";

    asteroids = [];
    coins = [];
    powerups = [];
    particles = [];

    rocket = new Rocket();

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    gameRunning = true;
    paused = false;

    lastTime = performance.now();

    requestAnimationFrame(updateGame);
}

function endGame() {

    gameRunning = false;

    const finalScore = Math.floor(score);

    finalScoreText.textContent = finalScore;

    if (finalScore > highScore) {

        highScore = finalScore;

        localStorage.setItem(
            "rocketHighScore",
            highScore
        );

        highScoreText.textContent = highScore;
    }

    gameOverScreen.classList.remove("hidden");
}

function togglePause() {

    if (!gameRunning) return;

    paused = !paused;

    pauseBtn.textContent = paused ? "▶" : "Ⅱ";
}

startBtn.addEventListener("click", startGame);

restartBtn.addEventListener("click", startGame);

menuBtn.addEventListener("click", () => {

    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
});

pauseBtn.addEventListener("click", togglePause);

document.querySelectorAll("#mobileControls button").forEach(button => {

    const key = button.dataset.key;

    button.addEventListener("touchstart", e => {
        e.preventDefault();
        keys[key] = true;
    });

    button.addEventListener("touchend", e => {
        e.preventDefault();
        keys[key] = false;
    });

    button.addEventListener("mousedown", () => {
        keys[key] = true;
    });

    button.addEventListener("mouseup", () => {
        keys[key] = false;
    });

    button.addEventListener("mouseleave", () => {
        keys[key] = false;
    });
});

createStars();

function backgroundAnimation() {

    if (!gameRunning) {

        ctx.clearRect(0, 0, W, H);

        drawStars();

    }

    requestAnimationFrame(backgroundAnimation);
}

backgroundAnimation();
