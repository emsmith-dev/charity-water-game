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

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy:   { time: 40, dropletCount: 6, winScore: 10, label: 'Easy' },
    normal: { time: 30, dropletCount: 8, winScore: 16, label: 'Normal' },
    hard:   { time: 18, dropletCount: 10, winScore: 24, label: 'Hard' }
};

let currentDifficulty = 'normal';
let GAME_TIME = DIFFICULTY_SETTINGS[currentDifficulty].time;
let DROPLET_COUNT = DIFFICULTY_SETTINGS[currentDifficulty].dropletCount;
let WIN_SCORE = DIFFICULTY_SETTINGS[currentDifficulty].winScore;

let droplets = [];
let score = 0;
let timer = GAME_TIME;
let gameInterval, timerInterval;
let draggingDroplet = null;
let dragOffset = { x: 0, y: 0 };

const difficultySelect = document.getElementById('difficulty-select');
const gameContainer = document.getElementById('game-container');

// Add win condition and difficulty display
let winCondEl = document.getElementById('win-condition');
if (!winCondEl) {
    winCondEl = document.createElement('div');
    winCondEl.id = 'win-condition';
    winCondEl.style.textAlign = 'center';
    winCondEl.style.marginBottom = '8px';
    gameContainer.insertBefore(winCondEl, gameContainer.querySelector('header'));
}

function resizeCanvas() {
    // Fill the viewport except for UI above/below
    const dpr = window.devicePixelRatio || 1;
    // Calculate available height for canvas
    const containerRect = gameContainer.getBoundingClientRect();
    const buckets = document.getElementById('buckets');
    const bucketsRect = buckets.getBoundingClientRect();
    const uiAbove = canvas.offsetTop;
    const uiBelow = containerRect.bottom - bucketsRect.top + 10;
    const height = window.innerHeight - uiAbove - uiBelow;
    const width = window.innerWidth;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
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
    // Charity:Water blue and brown
    ctx.fillStyle = d.type === 'clean' ? '#005baa' : '#8d6e63';
    ctx.shadowColor = d.type === 'clean' ? '#ffd600' : '#bcaaa4';
    ctx.shadowBlur = d.type === 'clean' ? 16 : 10;
    ctx.fill();
    // Add yellow highlight for clean droplets
    if (d.type === 'clean') {
        ctx.beginPath();
        ctx.arc(d.x - 7, d.y - 7, DROPLET_RADIUS / 2.2, 0, 2 * Math.PI);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#ffd600';
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();
    // highlight if grabbed
    if (d.grabbed) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, DROPLET_RADIUS + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ffd600';
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
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.height / rect.height);
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
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.height / rect.height);
    draggingDroplet.x = x - dragOffset.x;
    draggingDroplet.y = y - dragOffset.y;
}

function handlePointerUp(e) {
    if (!draggingDroplet) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - rect.top) * (canvas.height / rect.height);
    const bucket = getBucketAt(x, y);
    if (bucket) {
        if (bucket === draggingDroplet.type) {
            score++;
            playSplash();
            // Remove droplet and spawn a new one, animate DOM droplet for feedback only
            const idx = droplets.indexOf(draggingDroplet);
            createDropletDOM(draggingDroplet.x, draggingDroplet.y, draggingDroplet.type);
            droplets.splice(idx, 1);
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
    // Show win message if reached
    if (score >= WIN_SCORE) {
        endGame(true);
    }
}


function updateTimer() {
    timerEl.textContent = `Time: ${timer}`;
}


function startGame() {
    // Get difficulty from select
    if (difficultySelect) {
        currentDifficulty = difficultySelect.value;
    }
    GAME_TIME = DIFFICULTY_SETTINGS[currentDifficulty].time;
    DROPLET_COUNT = DIFFICULTY_SETTINGS[currentDifficulty].dropletCount;
    WIN_SCORE = DIFFICULTY_SETTINGS[currentDifficulty].winScore;
    score = 0;
    timer = GAME_TIME;
    updateScore();
    updateTimer();
    gameOverEl.style.display = 'none';
    resizeCanvas();
    spawnDroplets();
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    // Show win condition and difficulty
    winCondEl.innerHTML = `<strong>Goal:</strong> ${WIN_SCORE} points &nbsp;|&nbsp; <strong>Difficulty:</strong> ${DIFFICULTY_SETTINGS[currentDifficulty].label}`;
    gameInterval = setInterval(gameLoop, 1000 / 60);
    timerInterval = setInterval(() => {
        timer--;
        updateTimer();
        if (timer <= 0) endGame(false);
    }, 1000);
}


function endGame(won = false) {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameOverEl.style.display = 'flex';
    if (won) {
        finalScoreEl.textContent = `You win! 🎉 Final Score: ${score}`;
    } else {
        finalScoreEl.textContent = `Your Score: ${score} <br>Goal was: ${WIN_SCORE}`;
    }
}

window.addEventListener('resize', () => {
    resizeCanvas();
    spawnDroplets();
    score = 0;
    timer = GAME_TIME;
    updateScore();
    updateTimer();
});
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        resizeCanvas();
        spawnDroplets();
        score = 0;
        timer = GAME_TIME;
        updateScore();
        updateTimer();
    }, 200);
});
canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
canvas.addEventListener('touchend', handlePointerUp, { passive: false });


document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    // Listen for difficulty change
    if (difficultySelect) {
        difficultySelect.addEventListener('change', () => {
            startGame();
        });
    }
    startGame();
});

// Expose startGame for Play Again button
window.startGame = startGame;

// Only used for disappear animation
function createDropletDOM(x, y, type) {
    const el = document.createElement('div');
    el.className = 'droplet-dom';
    el.style.position = 'absolute';
    el.style.pointerEvents = 'none';
    el.style.transition = 'opacity 0.25s, transform 0.25s';
    el.style.opacity = '1';
    el.style.zIndex = '10';
    el.style.left = (canvas.offsetLeft + x - DROPLET_RADIUS) + 'px';
    el.style.top = (canvas.offsetTop + y - DROPLET_RADIUS) + 'px';
    el.style.width = (DROPLET_RADIUS * 2) + 'px';
    el.style.height = (DROPLET_RADIUS * 2) + 'px';
    el.style.background = type === 'clean' ? 'rgba(0,91,170,0.12)' : 'rgba(141,110,99,0.12)';
    el.style.borderRadius = '50%';
    el.style.boxShadow = type === 'clean' ? '0 0 16px 4px #ffd60055' : '0 0 10px 2px #bcaaa455';
    gameContainer.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'scale(1.3)';
        setTimeout(() => el.remove(), 250);
    }, 10);
}
