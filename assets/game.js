// Charity:Water Droplet Sort Game
// Focus: JavaScript logic for droplets, buckets, swiping, timer, and scoring

const canvas = document.getElementById('droplet-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

const BUCKETS = {
    clean: { x: 0.1, w: 0.35 },
    dirty: { x: 0.55, w: 0.35 }
};
const DROPLET_RADIUS = 22;
const DROPLET_TYPES = ['clean', 'dirty'];
const GAME_TIME = 30; // seconds
const DROPLET_COUNT = 8;

let droplets = [];
let score = 0;
let timer = GAME_TIME;
let gameInterval, timerInterval;
let draggingDroplet = null;
let dragOffset = { x: 0, y: 0 };

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

function randomDroplet() {
    const type = DROPLET_TYPES[Math.random() < 0.5 ? 0 : 1];
    return {
        x: Math.random() * (canvas.width - 2 * DROPLET_RADIUS) + DROPLET_RADIUS,
        y: Math.random() * (canvas.height - 2 * DROPLET_RADIUS) + DROPLET_RADIUS,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        type,
        grabbed: false
    };
}

function spawnDroplets() {
    droplets = [];
    for (let i = 0; i < DROPLET_COUNT; i++) {
        droplets.push(randomDroplet());
    }
}

function drawDroplet(d) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(d.x, d.y, DROPLET_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = d.type === 'clean' ? '#03a9f4' : '#8d6e63';
    ctx.shadowColor = d.type === 'clean' ? '#b3e5fc' : '#bcaaa4';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
    // highlight if grabbed
    if (d.grabbed) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, DROPLET_RADIUS + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// Buckets are visually in the DOM, so no need to draw them on canvas
function drawBuckets() {}

function moveDroplets() {
    for (let d of droplets) {
        if (!d.grabbed) {
            d.x += d.vx;
            d.y += d.vy;
            // bounce off walls
            if (d.x < DROPLET_RADIUS || d.x > canvas.width - DROPLET_RADIUS) d.vx *= -1;
            if (d.y < DROPLET_RADIUS || d.y > canvas.height - DROPLET_RADIUS - 70) d.vy *= -1;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBuckets();
    for (let d of droplets) drawDroplet(d);
}

function gameLoop() {
    moveDroplets();
    draw();
}

function pointInDroplet(x, y, d) {
    return Math.hypot(x - d.x, y - d.y) < DROPLET_RADIUS;
}

function getBucketAt(x, y) {
    for (let [type, b] of Object.entries(BUCKETS)) {
        const bx = b.x * canvas.width;
        const bw = b.w * canvas.width;
        const by = canvas.height - 70;
        if (x > bx && x < bx + bw && y > by) return type;
    }
    return null;
}

function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    for (let d of droplets) {
        if (pointInDroplet(x, y, d)) {
            draggingDroplet = d;
            d.grabbed = true;
            dragOffset.x = x - d.x;
            dragOffset.y = y - d.y;
            break;
        }
    }
}

function handlePointerMove(e) {
    if (!draggingDroplet) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    draggingDroplet.x = x - dragOffset.x;
    draggingDroplet.y = y - dragOffset.y;
}

function handlePointerUp(e) {
    if (!draggingDroplet) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - rect.left;
    const y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - rect.top;
    const bucket = getBucketAt(x, y);
    if (bucket) {
        if (bucket === draggingDroplet.type) {
            score++;
            playSplash();
            // Remove droplet and spawn a new one
            droplets = droplets.filter(d => d !== draggingDroplet);
            setTimeout(() => {
                droplets.push(randomDroplet());
            }, 150); // slight delay for feedback
        } else {
            score = Math.max(0, score - 1);
        }
    }
    draggingDroplet.grabbed = false;
    draggingDroplet = null;
    updateScore();
}
// Play splash sound for feedback
function playSplash() {
    const splash = document.getElementById('splash-sound');
    if (splash) {
        splash.currentTime = 0;
        splash.play();
    }
}

function updateScore() {
    scoreEl.textContent = `Score: ${score}`;
}

function updateTimer() {
    timerEl.textContent = `Time: ${timer}`;
}

function startGame() {
    score = 0;
    timer = GAME_TIME;
    updateScore();
    updateTimer();
    gameOverEl.style.display = 'none';
    resizeCanvas();
    spawnDroplets();
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameInterval = setInterval(gameLoop, 1000 / 60);
    timerInterval = setInterval(() => {
        timer--;
        updateTimer();
        if (timer <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameOverEl.style.display = 'flex';
    finalScoreEl.textContent = `Your Score: ${score}`;
}

window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
canvas.addEventListener('touchend', handlePointerUp, { passive: false });

document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    startGame();
});

// Expose startGame for Play Again button
window.startGame = startGame;
