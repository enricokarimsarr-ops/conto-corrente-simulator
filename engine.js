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

// -------------------------------------------------------------------------
// CARICAMENTO INVARIATO DEL MURO (Mantenuto originale come richiesto)
// -------------------------------------------------------------------------
const imgMuro = new Image();
imgMuro.src = 'muromatrix.png';

function applicaFallbackAsset() {
    // Funzione disattivata: il motore usa direttamente le immagini reali di sprites.js
    console.log("Asset grafici utente inizializzati.");
}

// -------------------------------------------------------------------------
// REQUISITI DI INPUT E RESET
// -------------------------------------------------------------------------
container.addEventListener('click', () => {
    if (typeof initAudio === 'function') initAudio(); 
    if (!gameOver) canvas.requestPointerLock();
});

window.addEventListener('keydown', e => {
    if (gameOver && e.key.toLowerCase() === 'r') resetGame();
});

// FUNZIONE DI MOVIMENTO E COLLISIONE PARETI
function movePlayer() {
    let baseSpeed = 0.045;
    let moveSpeed = (typeof getMoveSpeed === 'function') ? getMoveSpeed(baseSpeed) : baseSpeed;

    let moveX = 0;
    let moveY = 0;

    let attualeMappa = (typeof map !== 'undefined') ? map : gameMaps[currentLevel];
    if (!attualeMappa) return;

    if (keys['w'] || keys['arrowup']) {
        moveX += player.dirX * moveSpeed;
        moveY += player.dirY * moveSpeed;
    }
    if (keys['s'] || keys['arrowdown']) {
        moveX -= player.dirX * moveSpeed;
        moveY -= player.dirY * moveSpeed;
    }
    if (keys['a'] || keys['arrowleft']) {
        moveX -= player.planeX * moveSpeed;
        moveY -= player.planeY * moveSpeed;
    }
    if (keys['d'] || keys['arrowright']) {
        moveX += player.planeX * moveSpeed;
        moveY += player.planeY * moveSpeed;
    }

    let newX = player.x + moveX;
    let newY = player.y + moveY;

    if (attualeMappa[Math.floor(player.y)][Math.floor(newX)] === 0 || attualeMappa[Math.floor(player.y)][Math.floor(newX)] === 9) player.x = newX;
    if (attualeMappa[Math.floor(newY)][Math.floor(player.x)] === 0 || attualeMappa[Math.floor(newY)][Math.floor(player.x)] === 9) player.y = newY;
}

// -------------------------------------------------------------------------
// INTERAZIONE MANUALE CASSAFORTE (PILASTRO 2)
// -------------------------------------------------------------------------
function checkSafeInteraction() {
    if (gameOver || window.isTransitioning) return;
    
    items.forEach(item => {
        if (item.active && item.type === 'safe') {
            let idx = player.x - item.x;
            let idy = player.y - item.y;
            let idist = Math.sqrt(idx * idx + idy * idy);

            // Raggio d'azione utile per l'interazione davanti alla cassaforte
            if (idist < 1.0) {
                if (player.bankAccount > 0) {
                    player.savedFunds += player.bankAccount;
                    player.bankAccount = 0; // Tasche svuotate completamente! Salvati in cassaforte
                    if (typeof playSafeSound === 'function') playSafeSound();
                }
            }
        }
    });
}

// -------------------------------------------------------------------------
// AGGIORNAMENTO ENTITÀ, LOGICA FINANZIARIA E SCADENZE
// -------------------------------------------------------------------------
function updateEntities(dt) {
    let attualeMappa = (typeof map !== 'undefined') ? map : gameMaps[currentLevel];
    if (!attualeMappa) return;

    // 1. COMPORTAMENTO NEMICI (Muove SOLO l'Inflazione!)
    enemies.forEach(e => {
        if (e.alive) {
            let dx = player.x - e.x;
            let dy = player.y - e.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            // Solo il mostro dell'inflazione insegue il giocatore
            if (e.type === 'inflation') {
                if (dist > 0.25) {
                    let nx = e.x + (dx / dist) * e.speed;
                    let ny = e.y + (dy / dist) * e.speed;
                    if (attualeMappa[Math.floor(ny)][Math.floor(nx)] === 0) {
                        e.x = nx; e.y = ny;
                    }
                }
            }
            
            // EFFETTO INFLAZIONE (Erosione in percentuale sulla liquidità libera)
            if (dist < 0.45 && e.type === 'inflation') {
                let loss = player.bankAccount * 0.05 * dt;
                if (loss < 1 * dt && player.bankAccount > 0) loss = 1 * dt;
                
                player.bankAccount -= loss;
                if (typeof playDrainSound === 'function') playDrainSound();
                
                // FIX LOGICA: Perdi solo se vai sotto zero. Se hai 0€ perché hai depositato, l'inflazione non ti uccide!
                if (player.bankAccount < 0) {
                    player.bankAccount = 0;
                    bankruptcyReason = "L'Inflazione Galoppante ti ha mandato in debito profondo!";
                    gameOver = true;
                }
            }
        }
    });

    // 2. INTERAZIONE ELEMENTI FINANZIARI (Oggetti statici e trappole)
    items.forEach(item => {
        if (!item.active) return;

        // Comportamento Scadenza Bolletta
        if (item.type === 'bill') {
            if (!item.timeLeft) item.timeLeft = 8.0; 
            item.timeLeft -= dt;
            
            if (item.timeLeft < 3.0 && Math.floor(globalAnimTime * 5) % 2 === 0) {
                ctx.fillStyle = 'rgba(231, 76, 60, 0.18)';
                ctx.fillRect(0, 0, width, height);
            }

            if (item.timeLeft <= 0) {
                // FIX LOGICA: La bolletta scaduta applica una sanzione fissa di 150€.
                player.bankAccount -= 150; 
                item.active = false;
                if (typeof playAlarmSound === 'function') playAlarmSound();
                
                // Si va in Game Over solo se la sanzione ti manda sotto zero (in rosso)
                if (player.bankAccount < 0) {
                    bankruptcyReason = "Sei andato in bancarotta per insolvenza! Una bolletta arretrata ti ha mandato in rosso.";
                    gameOver = true;
                }
                respawnItem(item);
                return;
            }
        }

        let idx = player.x - item.x;
        let idy = player.y - item.y;
        let idist = Math.sqrt(idx * idx + idy * idy);

        // Collisione ed assorbimento oggetti
        if (idist < 0.45) {
            if (item.type === 'salary') {
                player.bankAccount += 350; 
                item.active = false;
                if (typeof playCashSound === 'function') playCashSound();
                respawnItem(item);
            } 
            else if (item.type === 'luxury') {
                let points = Math.floor(100 * player.riskMultiplier);
                player.happinessScore += points;
                item.active = false;
                if (typeof playLuxurySound === 'function') playLuxurySound();
                respawnItem(item);
            } 
            else if (item.type === 'phishing') {
                player.isFrozen = true;
                player.frozenTimer = 180; // 3 secondi di rallentamento/congelamento transazioni
                item.active = false;
                if (typeof playGlitchSound === 'function') playGlitchSound();
                respawnItem(item);
            } 
            else if (item.type === 'bill') {
                item.active = false; 
                if (typeof playBillPaySound === 'function') playBillPaySound();
                respawnItem(item);
            }
        }
    });
}

// RIGENERAZIONE PROTETTA ELEMENTI
function respawnItem(item) {
    if (gameOver) return;
    setTimeout(() => {
        let attualeMappa = (typeof map !== 'undefined') ? map : gameMaps[currentLevel];
        if (gameOver || !attualeMappa) return;
        
        let x, y, tentativi = 0;
        do {
            x = Math.floor(Math.random() * 14) + 1;
            y = Math.floor(Math.random() * 14) + 1;
            tentativi++;
        } while (attualeMappa[y] && attualeMappa[y][x] !== 0 && tentativi < 100);

        item.x = x + 0.5;
        item.y = y + 0.5;
        item.active = true;
        if (item.type === 'bill') item.timeLeft = 8.0;
    }, 6000);
}

// MOTORE DI RENDERING 3D (RAYCASTING PSEUDO-3D)
function renderWalls() {
    let attualeMappa = (typeof map !== 'undefined') ? map : gameMaps[currentLevel];
    if (!attualeMappa) return;

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
            if (attualeMappa[mapY] && attualeMappa[mapY][mapX] > 0) hit = 1;
        }

        if (side === 0) perpWallDist = (sideDistX - deltaDistX);
        else perpWallDist = (sideDistY - deltaDistY);

        zBuffer[x] = perpWallDist;

        let lineHeight = Math.floor(height / perpWallDist);
        let drawStart = -lineHeight / 2 + height / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + height / 2;
        if (drawEnd >= height) drawEnd = height - 1;

        let wallX; 
        if (side === 0) wallX = player.y + perpWallDist * rayDirY;
        else wallX = player.x + perpWallDist * rayDirX;
        wallX -= Math.floor(wallX);

        let texX = Math.floor(wallX * imgMuro.width);
        if (side === 0 && rayDirX > 0) texX = imgMuro.width - texX - 1;
        if (side === 1 && rayDirY < 0) texX = imgMuro.width - texX - 1;

        if (attualeMappa[mapY][mapX] === 9) {
            ctx.strokeStyle = '#2ecc71';
            ctx.beginPath(); ctx.moveTo(x, drawStart); ctx.lineTo(x, drawEnd); ctx.stroke();
        } else if (imgMuro.complete) {
            ctx.drawImage(imgMuro, texX, 0, 1, imgMuro.height, x, drawStart, 1, drawEnd - drawStart);
            if (side === 1) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
            }
        } else {
            ctx.strokeStyle = side === 1 ? '#11171d' : '#1c252e';
            ctx.beginPath(); ctx.moveTo(x, drawStart); ctx.lineTo(x, drawEnd); ctx.stroke();
        }

        ctx.fillStyle = '#06090c'; ctx.fillRect(x, 0, 1, drawStart);
        ctx.fillStyle = '#0f1418'; ctx.fillRect(x, drawEnd, 1, height - drawEnd);
    }
}

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
            if (typeof LoadCorporateLevel === 'function') LoadCorporateLevel(currentLevel);
            if (typeof LoadLevelSprites === 'function') LoadLevelSprites(currentLevel);
            
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

// INTERFACCIA UTENTE E SCHERMATE DI STATO
function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(7, 18, 12, 0.96)'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#2ecc71'; ctx.font = "bold 34px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText("ANNO FISCALE COMPLETATO!", width / 2, height / 2 - 50);
    
    ctx.fillStyle = '#ecf0f1'; ctx.font = "17px 'Courier New'";
    ctx.fillText("Strategia finanziaria eccellente. Sei stabile ed immune alle crisi.", width / 2, height / 2 - 10);
    ctx.fillText("Punteggio Felicità Raggiunto: " + Math.floor(player.happinessScore), width / 2, height / 2 + 25);
    ctx.fillText("Fondo di Riserva accumulato: " + Math.floor(player.savedFunds) + "€", width / 2, height / 2 + 50);
    
    ctx.fillStyle = '#7f8c8d'; ctx.font = "14px 'Courier New'";
    ctx.fillText("Premi 'R' per avviare una nuova simulazione di investimento", width / 2, height / 2 + 110);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(20, 10, 12, 0.97)'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e74c3c'; ctx.font = "bold 36px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText("DICHIARAZIONE DI BANCAROTTA", width / 2, height / 2 - 40);
    
    ctx.fillStyle = '#ecf0f1'; ctx.font = "16px 'Courier New'";
    let reason = bankruptcyReason || "Il saldo del tuo conto corrente è sceso al di sotto dello zero.";
    ctx.fillText(reason, width / 2, height / 2 + 15);
    
    ctx.fillStyle = '#f1c40f';
    ctx.fillText("Punteggio Felicità Finale: " + Math.floor(player.happinessScore), width / 2, height / 2 + 50);
    
    ctx.fillStyle = '#7f8c8d'; ctx.font = "13px 'Courier New'";
    ctx.fillText("Premi 'R' per rifinanziare il debito (Ricomincia)", width / 2, height / 2 + 110);
}

function drawMinimap() {
    let size = 4;
    let attualeMappa = (typeof map !== 'undefined') ? map : gameMaps[currentLevel];
    if (!attualeMappa) return;

    ctx.fillStyle = 'rgba(11, 16, 22, 0.75)'; ctx.fillRect(10, 10, 16 * size, 16 * size);

    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            if (attualeMappa[y] && attualeMappa[y][x] === 1) { ctx.fillStyle = '#232d37'; ctx.fillRect(10 + x*size, 10 + y*size, size, size); } 
            else if (attualeMappa[y] && attualeMappa[y][x] === 9) { ctx.fillStyle = '#2ecc71'; ctx.fillRect(10 + x*size, 10 + y*size, size, size); }
        }
    }
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(10 + Math.floor(player.x * size) - 1, 10 + Math.floor(player.y * size) - 1, 3, 3);
    enemies.forEach(e => { if (e.alive) { ctx.fillStyle = '#e74c3c'; ctx.fillRect(10 + Math.floor(e.x * size) - 1, 10 + Math.floor(e.y * size) - 1, 3, 3); } });
    items.forEach(i => { if (i.active) { ctx.fillStyle = '#00ffff'; ctx.fillRect(10 + Math.floor(i.x * size) - 1, 10 + Math.floor(i.y * size) - 1, 2, 2); } });
}

function updateUI() {
    document.getElementById('health').innerText = Math.floor(player.bankAccount);
    document.getElementById('shield').innerText = Math.floor(player.savedFunds);
    document.getElementById('ammo').innerText = player.riskMultiplier.toFixed(1);
    document.getElementById('score').innerText = Math.floor(player.happinessScore);
    document.getElementById('timer').innerText = Math.ceil(gameTimer);
}

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
    if (typeof LoadCorporateLevel === 'function') LoadCorporateLevel(currentLevel);
    if (typeof LoadLevelSprites === 'function') LoadLevelSprites(currentLevel);
    
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
        if (player.bankAccount < 0) drawGameOverScreen();
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
    
    if (typeof drawSprites === 'function') {
        drawSprites(ctx, player, width, height, zBuffer, globalAnimTime);
    }
    
    // INTEGRAZIONE: Prompt a schermo vicino alla Cassaforte
    let vicinoCassaforte = false;
    items.forEach(item => {
        if (item.active && item.type === 'safe') {
            let dist = Math.sqrt((player.x - item.x)**2 + (player.y - item.y)**2);
            if (dist < 1.0) vicinoCassaforte = true;
        }
    });
    if (vicinoCassaforte) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = "bold 15px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("[PREMI SPAZIO o E PER DEPOSITARE NELLA CASSAFORTE]", width / 2, height - 75);
    }

    drawMinimap();
    updateUI();
}

// Avvio iniziale
requestAnimationFrame(gameLoop);
