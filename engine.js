// =========================================================================
// LABYRINTH ECONOMY - MOTORE GRAFICO, FISICA E LOGICA DI GIOCO (CORE LOOP)
// =========================================================================

const canvas = document.getElementById('gameCanvas');
const container = document.getElementById('canvas-container');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

let zBuffer = new Array(width);
let gameOver = false;
let globalAnimTime = 0;
let gameTimer = 60; // Durata di un intero mese commerciale/fiscale (60 secondi)
let lastTime = performance.now();
let bankruptcyReason = "";

window.isTransitioning = false;

// Attivazione audio e lock del mouse su click
container.addEventListener('click', () => {
    if (typeof initAudio === 'function') initAudio(); 
    if (!gameOver) canvas.requestPointerLock();
});

// Ascolto della tastiera per il riavvio (R)
window.addEventListener('keydown', e => {
    if (gameOver && e.key.toLowerCase() === 'r') resetGame();
});

// FUNZIONE REINTEGRATA DI MOVIMENTO E COLLISIONE PARETI
function movePlayer() {
    let baseSpeed = 0.045;
    // Richiama la velocità modificata dinamicamente dal Moltiplicatore di Rischio in player.js
    let moveSpeed = (typeof getMoveSpeed === 'function') ? getMoveSpeed(baseSpeed) : baseSpeed;

    let moveX = 0;
    let moveY = 0;

    if (keys['w'] || keys['arrowup']) {
        moveX += player.dirX * moveSpeed;
        moveY += player.dirY * moveSpeed;
    }
    if (keys['s'] || keys['arrowdown']) {
        moveX -= player.dirX * moveSpeed;
        moveY -= player.dirY * moveSpeed;
    }
    if (keys['a'] || keys['arrowleft']) {
        // Movimento laterale (Strafe) sinistro
        moveX -= player.planeX * moveSpeed;
        moveY -= player.planeY * moveSpeed;
    }
    if (keys['d'] || keys['arrowright']) {
        // Movimento laterale (Strafe) destro
        moveX += player.planeX * moveSpeed;
        moveY += player.planeY * moveSpeed;
    }

    let newX = player.x + moveX;
    let newY = player.y + moveY;

    // Controllo collisioni (0 = Spazio libero, 9 = Varco di fine trimestre)
    if (map[Math.floor(player.y)][Math.floor(newX)] === 0 || map[Math.floor(player.y)][Math.floor(newX)] === 9) player.x = newX;
    if (map[Math.floor(newY)][Math.floor(player.x)] === 0 || map[Math.floor(newY)][Math.floor(player.x)] === 9) player.y = newY;
}

// LOGICA AGGIORNAMENTO ENTITÀ, MANAGEMENT DEL RISCHIO E SCADENZE
function updateEntities(dt) {
    // 1. Inseguimento del Mostro dell'Inflazione
    enemies.forEach(e => {
        if (e.alive) {
            let dx = player.x - e.x;
            let dy = player.y - e.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0.25) {
                let nx = e.x + (dx / dist) * e.speed;
                let ny = e.y + (dy / dist) * e.speed;
                if (map[Math.floor(ny)][Math.floor(nx)] === 0) {
                    e.x = nx; e.y = ny;
                }
            }
            
            // Se l'Inflazione ti afferra, prosciuga il conto corrente (€60 al secondo)
            if (dist < 0.45) {
                let drain = Math.floor(60 * dt);
                player.bankAccount -= drain;
                if (typeof playDrainSound === 'function') playDrainSound();
                
                if (player.bankAccount <= 0) {
                    player.bankAccount = 0;
                    bankruptcyReason = "L'Inflazione Galoppante ha prosciugato tutta la tua liquidità libera!";
                    gameOver = true;
                }
            }
        }
    });

    // 2. Interazione con gli elementi finanziari e Trappole
    items.forEach(item => {
        if (!item.active) return;

        // Comportamento Speciale: La Bolletta ha una scadenza temporale fissa!
        if (item.type === 'bill') {
            if (!item.timeLeft) item.timeLeft = 8.0; // 8 secondi per pagarla prima del collasso
            item.timeLeft -= dt;
            
            // Allarme visivo intermittente se la scadenza è vicina
            if (item.timeLeft < 3.0 && Math.floor(globalAnimTime * 5) % 2 === 0) {
                ctx.fillStyle = 'rgba(231, 76, 60, 0.18)';
                ctx.fillRect(0, 0, width, height);
            }

            if (item.timeLeft <= 0) {
                // Penale disastrosa: dimezza istantaneamente il Conto Corrente!
                player.bankAccount = Math.floor(player.bankAccount / 2);
                item.active = false;
                if (typeof playAlarmSound === 'function') playAlarmSound();
                
                if (player.bankAccount <= 0) {
                    bankruptcyReason = "Sei andato in bancarotta per insolvenza! Troppe bollette ignorate.";
                    gameOver = true;
                }
                respawnItem(item);
                return;
            }
        }

        let idx = player.x - item.x;
        let idy = player.y - item.y;
        let idist = Math.sqrt(idx * idx + idy * idy);

        if (idist < 0.45) {
            if (item.type === 'salary') {
                player.bankAccount += 350; // Stipendio incassato
                item.active = false;
                if (typeof playCashSound === 'function') playCashSound();
                respawnItem(item);
            } 
            else if (item.type === 'luxury') {
                // Gli Sfizi incrementano i punti felicità basandosi sul Moltiplicatore di Rischio attuale
                let points = Math.floor(100 * player.riskMultiplier);
                player.happinessScore += points;
                item.active = false;
                if (typeof playLuxurySound === 'function') playLuxurySound();
                respawnItem(item);
            } 
            else if (item.type === 'phishing') {
                // Attiva lo stato alterato di congelamento inserito in player.js
                player.isFrozen = true;
                player.frozenTimer = 180; // 3 secondi di blocco totale delle transazioni/movimenti
                item.active = false;
                if (typeof playGlitchSound === 'function') playGlitchSound();
                respawnItem(item);
            } 
            else if (item.type === 'bill') {
                item.active = false; // Bolletta saldata in tempo
                if (typeof playBillPaySound === 'function') playBillPaySound();
                respawnItem(item);
            } 
            else if (item.type === 'safe') {
                // Fondo di Emergenza: Sposta la liquidità a rischio al sicuro lasciando 200€ sul conto per spese correnti
                if (player.bankAccount > 200) {
                    let deposit = player.bankAccount - 200;
                    player.savedFunds += deposit;
                    player.bankAccount = 200;
                    if (typeof playSafeSound === 'function') playSafeSound();
                }
            }
        }
    });
}

// MOTORE DI RENDERING 3D (RAYCASTING PSEUDO-3D MATEMATICO)
function renderWalls() {
    for (let x = 0; x < width; x++) {
        let cameraX = 2 * x / width - 1;
        let rayDirX = player.dirX + player.planeX * cameraX;
        let rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);

        let sideDistX, sideDistY;
        let deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
        let deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);
        let perpWallDist;

        let stepX, stepY;
        let hit = 0;
        let side;

        if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; } 
        else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; } 
        else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

        while (hit === 0) {
            if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; } 
            else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            if (map[mapY][mapX] > 0) hit = 1;
        }

        if (side === 0) perpWallDist = (sideDistX - deltaDistX);
        else perpWallDist = (sideDistY - deltaDistY);

        zBuffer[x] = perpWallDist;

        let lineHeight = Math.floor(height / perpWallDist);
        let drawStart = -lineHeight / 2 + height / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + height / 2;
        if (drawEnd >= height) drawEnd = height - 1;

        // Palette cromatica stile Matrix Finanziaria
        let wallColor = side === 1 ? '#11171d' : '#1c252e';
        if (map[mapY][mapX] === 9) wallColor = '#2ecc71'; // Varco verde smeraldo di fine trimestre

        ctx.strokeStyle = wallColor;
        ctx.beginPath(); ctx.moveTo(x, drawStart); ctx.lineTo(x, drawEnd); ctx.stroke();

        // Disegno pavimenti e soffitti scuri per massimizzare il contrasto degli sprite
        ctx.fillStyle = '#06090c'; ctx.fillRect(x, 0, 1, drawStart);
        ctx.fillStyle = '#0f1418'; ctx.fillRect(x, drawEnd, 1, height - drawEnd);
    }
}

// STRUTTURA DEL TRAGUARDO DI FINE MESE
function handleLevelCompletion() {
    if (window.isTransitioning) return;
    window.isTransitioning = true;

    if (currentLevel < 3) {
        let transDiv = document.getElementById('floor-transition');
        document.getElementById('transition-title').innerText = "TRIMESTRE Q" + currentLevel + " CONCLUSO!";
        document.getElementById('transition-subtitle').innerText = "Bilancio in attivo. I mercati si stanno evolvendo, preparati all'incremento della volatilità.";
        transDiv.classList.add('active');

        if (typeof playWinSound === 'function') playWinSound();

        setTimeout(() => {
            currentLevel++;
            LoadCorporateLevel(currentLevel);
            LoadLevelSprites(currentLevel);
            
            // Riposizionamento asset di sicurezza
            player.x = 1.5; player.y = 1.5;
            player.dirX = 1.0; player.dirY = 0.0;
            player.planeX = 0.0; player.planeY = 0.66;
            gameTimer = 60;
            window.isTransitioning = false;
            transDiv.classList.remove('active');
        }, 4000);
    } else {
        gameOver = true;
        drawVictoryScreen();
    }
}

// SCHERMATE FINALI DI STATO
function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(7, 18, 12, 0.96)'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#2ecc71'; ctx.font = "bold 34px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText("ANNO FISCALE COMPLETATO!", width / 2, height / 2 - 50);
    
    ctx.fillStyle = '#ecf0f1'; ctx.font = "17px 'Courier New'";
    ctx.fillText("Strategia finanziaria eccellente. Sei stabile ed immune alle crisi.", width / 2, height / 2 - 10);
    ctx.fillText("Punteggio Felicità Raggiunto: " + player.happinessScore, width / 2, height / 2 + 25);
    ctx.fillText("Fondo di Riserva accumulato: " + player.savedFunds + "€", width / 2, height / 2 + 50);
    
    ctx.fillStyle = '#7f8c8d'; ctx.font = "14px 'Courier New'";
    ctx.fillText("Premi 'R' per avviare una nuova simulazione di investimento", width / 2, height / 2 + 110);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(20, 10, 12, 0.97)'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e74c3c'; ctx.font = "bold 36px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText("DICEHIARAZIONE DI BANCAROTTA", width / 2, height / 2 - 40);
    
    ctx.fillStyle = '#ecf0f1'; ctx.font = "16px 'Courier New'";
    let reason = bankruptcyReason || "Il saldo del tuo conto corrente è sceso al di sotto dello zero.";
    ctx.fillText(reason, width / 2, height / 2 + 15);
    
    ctx.fillStyle = '#f1c40f';
    ctx.fillText("Punteggio Felicità Finale: " + player.happinessScore, width / 2, height / 2 + 50);
    
    ctx.fillStyle = '#7f8c8d'; ctx.font = "13px 'Courier New'";
    ctx.fillText("Premi 'R' per rifinanziare il debito (Ricomincia)", width / 2, height / 2 + 110);
}

// MINIMAPPA LOGICA DELLA VOLATILITÀ
function drawMinimap() {
    let size = 4;
    ctx.fillStyle = 'rgba(11, 16, 22, 0.75)'; ctx.fillRect(10, 10, 16 * size, 16 * size);

    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            if (map[y][x] === 1) { ctx.fillStyle = '#232d37'; ctx.fillRect(10 + x*size, 10 + y*size, size, size); } 
            else if (map[y][x] === 9) { ctx.fillStyle = '#2ecc71'; ctx.fillRect(10 + x*size, 10 + y*size, size, size); }
        }
    }
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(10 + Math.floor(player.x * size) - 1, 10 + Math.floor(player.y * size) - 1, 3, 3);
    enemies.forEach(e => { if (e.alive) { ctx.fillStyle = '#e74c3c'; ctx.fillRect(10 + Math.floor(e.x * size) - 1, 10 + Math.floor(e.y * size) - 1, 3, 3); } });
    items.forEach(i => { if (i.active) { ctx.fillStyle = '#00ffff'; ctx.fillRect(10 + Math.floor(i.x * size) - 1, 10 + Math.floor(i.y * size) - 1, 2, 2); } });
}

function updateUI() {
    document.getElementById('health').innerText = player.bankAccount;
    document.getElementById('shield').innerText = player.savedFunds;
    document.getElementById('ammo').innerText = player.riskMultiplier.toFixed(1);
    document.getElementById('score').innerText = player.happinessScore;
    document.getElementById('timer').innerText = Math.ceil(gameTimer);
}

// SISTEMA DI RESET COMPRENSIVO
function resetGame() {
    player.bankAccount = 1000;
    player.savedFunds = 0;
    player.happinessScore = 0;
    player.riskMultiplier = 1.0;
    player.isFrozen = false;
    player.frozenTimer = 0;
    player.x = 1.5; player.y = 1.5;
    player.dirX = 1.0; player.dirY = 0.0;
    player.planeX = 0.0; player.planeY = 0.66;
    
    currentLevel = 1;
    LoadCorporateLevel(currentLevel);
    LoadLevelSprites(currentLevel);
    gameTimer = 60;
    gameOver = false;
    bankruptcyReason = "";
    window.isTransitioning = false;
    
    let transDiv = document.getElementById('floor-transition');
    if (transDiv) transDiv.classList.remove('active');
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// LOOP CENTRALE DEL SIMULATORE
function gameLoop(currentTime) {
    if (gameOver) {
        if (player.bankAccount <= 0) drawGameOverScreen();
        else drawVictoryScreen();
        return;
    }

    requestAnimationFrame(gameLoop);

    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (!window.isTransitioning) {
        gameTimer -= dt;
        if (gameTimer <= 0) {
            gameTimer = 0;
            handleLevelCompletion();
            return;
        }

        globalAnimTime += dt;

        if (typeof updatePlayerFinanceState === 'function') updatePlayerFinanceState();
        movePlayer();
        updateEntities(dt);
    }

    ctx.clearRect(0, 0, width, height);
    renderWalls();
    if (typeof drawSprites === 'function') drawSprites(ctx, player, width, height, zBuffer, globalAnimTime);
    drawMinimap();
    updateUI();
}

// Iniezione e avvio
requestAnimationFrame(gameLoop);
