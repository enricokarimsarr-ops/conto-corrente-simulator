// =========================================================
// GESTIONE ELEMENTI ECONOMICI E MINACCE (SPRITE PROCEDURALI)
// =========================================================

let enemies = [];
let items = [];

const levelSpritesDatabase = {
    1: {
        enemies: [
            // Il mostro dell'Inflazione (ex Drone)
            { x: 14.5, y: 1.5,  alive: true, speed: 0.022, hitFrame: 0, type: 'inflation', health: 1 },
            { x: 8.5,  y: 5.5,  alive: true, speed: 0.018, hitFrame: 0, type: 'inflation', health: 1 },
            { x: 13.5, y: 13.5, alive: true, speed: 0.025, hitFrame: 0, type: 'inflation', health: 1 }
        ],
        items: [
            { x: 4.5,  y: 1.5,  type: 'salary',   active: true }, // Stipendio
            { x: 1.5,  y: 13.5, type: 'luxury',   active: true }, // Sfizio
            { x: 9.5,  y: 9.5,  type: 'safe',     active: true }, // Cassaforte (Fondo)
            { x: 14.5, y: 7.5,  type: 'bill',     active: true }, // Bolletta
            { x: 6.5,  y: 11.5, type: 'phishing', active: true }  // Truffa Phishing
        ]
    },
    2: {
        enemies: [
            { x: 4.5,  y: 3.5,  alive: true, speed: 0.026, hitFrame: 0, type: 'inflation', health: 1 },
            { x: 11.5, y: 3.5,  alive: true, speed: 0.026, hitFrame: 0, type: 'inflation', health: 1 },
            { x: 13.5, y: 13.5, alive: true, speed: 0.030, hitFrame: 0, type: 'inflation', health: 1 }
        ],
        items: [
            { x: 1.5,  y: 5.5,  type: 'salary',   active: true },
            { x: 14.5, y: 5.5,  type: 'luxury',   active: true },
            { x: 7.5,  y: 7.5,  type: 'safe',     active: true },
            { x: 7.5,  y: 13.5, type: 'bill',     active: true },
            { x: 3.5,  y: 9.5,  type: 'phishing', active: true }
        ]
    },
    3: {
        enemies: [
            // Iper-Inflazione Galoppante (Il Boss)
            { x: 8.5, y: 8.5, alive: true, speed: 0.035, hitFrame: 0, type: 'inflation', health: 99 }
        ],
        items: [
            { x: 1.5,  y: 7.5,  type: 'salary', active: true },
            { x: 14.5, y: 7.5,  type: 'luxury', active: true },
            { x: 7.5,  y: 1.5,  type: 'safe',   active: true },
            { x: 7.5,  y: 14.5, type: 'bill',   active: true }
        ]
    }
};

function LoadLevelSprites(levelNumber) {
    const levelData = levelSpritesDatabase[levelNumber];
    if (!levelData) return;
    enemies = levelData.enemies.map(enemy => ({ ...enemy }));
    items = levelData.items.map(item => ({ ...item }));
}

function respawnItem(item) {
    setTimeout(() => {
        if (typeof gameOver !== 'undefined' && gameOver) return;
        let spawned = false;
        while (!spawned) {
            let rx = Math.floor(Math.random() * 14) + 1;
            let ry = Math.floor(Math.random() * 14) + 1;
            if (typeof map !== 'undefined' && map[ry][rx] === 0) {
                item.x = rx + 0.5;
                item.y = ry + 0.5;
                item.active = true;
                spawned = true;
            }
        }
    }, 7000); // Rigenera gli elementi economici ogni 7 secondi
}

function drawSprites(ctx, player, width, height, zBuffer, globalAnimTime) {
    let sprites = [];
    items.forEach(item => { if (item.active) sprites.push({ x: item.x, y: item.y, type: item.type }); });
    enemies.forEach(enemy => { if (enemy.alive) sprites.push({ x: enemy.x, y: enemy.y, type: enemy.type, hitFrame: enemy.hitFrame }); });

    sprites.sort((a, b) => {
        let distA = ((player.x - a.x) * (player.x - a.x) + (player.y - a.y) * (player.y - a.y));
        let distB = ((player.x - b.x) * (player.x - b.x) + (player.y - b.y) * (player.y - b.y));
        return distB - distA;
    });

    sprites.forEach(sprite => {
        let spriteX = sprite.x - player.x; 
        let spriteY = sprite.y - player.y;
        let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY); 

        if (transformY > 0) {
            let spriteScreenX = Math.floor((width / 2) * (1 + transformX / transformY));
            
            // Effetto ondeggiamento per oggetti economici fluttuanti ed entità
            let bobbing = Math.sin(globalAnimTime * 2.0) * 12;
            let scale = (sprite.type === 'inflation' && sprite.health > 10) ? 2.0 : 1.0; // Il Boss dell'inflazione è enorme
            
            let spriteHeight = Math.abs(Math.floor(height / transformY)) * scale;
            let drawStartY = Math.max(0, -spriteHeight / 2 + height / 2 + bobbing);
            let drawEndY = Math.min(height - 1, spriteHeight / 2 + height / 2 + bobbing);

            let spriteWidth = Math.abs(Math.floor(height / transformY)) * scale;
            let drawStartX = Math.max(0, Math.floor(-spriteWidth / 2 + spriteScreenX));
            let drawEndX = Math.min(width - 1, Math.floor(spriteWidth / 2 + spriteScreenX));

            let sHeight = drawEndY - drawStartY;

            for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                if (transformY < zBuffer[stripe]) {
                    let relX = (stripe - drawStartX) / spriteWidth;

                    // ------------------------------------------
                    // ENTITÀ: MOSTRO DELL'INFLAZIONE (Ombra/Nebbia viola-oscura)
                    // ------------------------------------------
                    if (sprite.type === 'inflation') {
                        // Crea un'ombra eterea usando linee ad opacità variabile o tratteggio speculare
                        let wave = Math.sin(globalAnimTime * 5 + stripe) * 0.1;
                        if (relX > 0.15 + wave && relX < 0.85 - wave) {
                            ctx.fillStyle = (Math.floor(stripe + globalAnimTime * 15) % 2 === 0) ? '#1a052e' : '#000000';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.1, 1, sHeight * 0.9);
                            
                            // Occhi rossi incandescenti dell'inflazione
                            if (relX > 0.40 && relX < 0.60 && Math.floor(globalAnimTime * 4) % 2 === 0) {
                                ctx.fillStyle = '#ff3333';
                                ctx.fillRect(stripe, drawStartY + sHeight * 0.25, 1, sHeight * 0.06);
                            }
                        }
                    } 
                    // ------------------------------------------
                    // OGGETTO: LO STIPENDIO (Sacchetto di monete verdi)
                    // ------------------------------------------
                    else if (sprite.type === 'salary') {
                        // Corpo del sacco rotondo
                        if (relX > 0.25 && relX < 0.75) {
                            ctx.fillStyle = '#27ae60'; // Verde denaro
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.3, 1, sHeight * 0.6);
                        }
                        // Nodo superiore del sacco
                        if (relX > 0.40 && relX < 0.60) {
                            ctx.fillStyle = '#2ecc71';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.18, 1, sHeight * 0.12);
                        }
                        // Simbolo del Dollaro / Euro disegnato al centro (linea gialla oro)
                        if (relX > 0.47 && relX < 0.53) {
                            ctx.fillStyle = '#f1c40f';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.4, 1, sHeight * 0.4);
                        }
                    }
                    // ------------------------------------------
                    // OGGETTO: LO SFIZIO (Console di gioco / Oggetto di lusso)
                    // ------------------------------------------
                    else if (sprite.type === 'luxury') {
                        // Chassis della console (Sleek design viola cyberpunk)
                        if (relX > 0.20 && relX < 0.80) {
                            ctx.fillStyle = '#8e44ad';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.4, 1, sHeight * 0.4);
                        }
                        // Striscia led ciano neon attiva
                        if (relX > 0.25 && relX < 0.75) {
                            ctx.fillStyle = '#00ffff';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.45, 1, sHeight * 0.08);
                        }
                    }
                    // ------------------------------------------
                    // OGGETTO: LA BOLLETTA (Lettera gialla fluttuante)
                    // ------------------------------------------
                    else if (sprite.type === 'bill') {
                        // Busta da lettere rettangolare
                        if (relX > 0.20 && relX < 0.80) {
                            ctx.fillStyle = '#f1c40f'; // Giallo avviso
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.3, 1, sHeight * 0.4);
                        }
                        // Punto esclamativo rosso di pericolo al centro
                        if (relX > 0.46 && relX < 0.54) {
                            ctx.fillStyle = '#c0392b';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.38, 1, sHeight * 0.18);
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.60, 1, sHeight * 0.06);
                        }
                    }
                    // ------------------------------------------
                    // OGGETTO: IL PHISHING (Premio falso glitchato)
                    // ------------------------------------------
                    else if (sprite.type === 'phishing') {
                        if (relX > 0.25 && relX < 0.75) {
                            // Cambia colore freneticamente tra ciano e magenta per simulare il glitch visivo
                            ctx.fillStyle = (Math.floor(globalAnimTime * 25) % 2 === 0) ? '#ff00ff' : '#00ffff';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.25, 1, sHeight * 0.65);
                        }
                    }
                    // ------------------------------------------
                    // INTERAZIONE: FONDO DI EMERGENZA (Cassaforte d'acciaio)
                    // ------------------------------------------
                    else if (sprite.type === 'safe') {
                        // Struttura blindata grigia
                        if (relX > 0.15 && relX < 0.85) {
                            ctx.fillStyle = '#7f8c8d'; // Acciaio opaco
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.15, 1, sHeight * 0.8);
                        }
                        // Interno della porta
                        if (relX > 0.22 && relX < 0.78) {
                            ctx.fillStyle = '#34495e';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.22, 1, sHeight * 0.66);
                        }
                        // Manopola a combinazione circolare dorata
                        if (relX > 0.42 && relX < 0.58) {
                            ctx.fillStyle = '#f1c40f';
                            if (Math.floor((stripe) / 2) % 2 === 0) {
                                ctx.fillRect(stripe, drawStartY + sHeight * 0.45, 1, sHeight * 0.15);
                            }
                        }
                    }
                }
            }
        }
    });
}

LoadLevelSprites(1);
