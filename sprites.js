// =========================================================
// GESTIONE ELEMENTI ECONOMICI E MINACCE (STRUTTURA DEFINITIVA)
// =========================================================

// 1. CARICAMENTO ASSET GRAFICI (Un file reale distinto per ogni tipo)
const immaginiGioco = {};

function caricaImmagine(chiave, percorso) {
    immaginiGioco[chiave] = new Image();
    immaginiGioco[chiave].src = percorso;
}

// Caricamento dei file con i NOMI ORIGINALI della tua cartella
caricaImmagine('salary', 'soldi.png');          // Guadagno base
caricaImmagine('luxury1', 'oro.png');           // Primo sfizio
caricaImmagine('luxury2', 'diamanti.png');      // Secondo sfizio
caricaImmagine('luxury3', 'scarpe.png');        // Terzo sfizio
caricaImmagine('safe', 'cassafortevera1.png');   // Cassaforte per protezione fondi
caricaImmagine('bill', 'Boletta1.png.png');     // Bolletta imprevista a tempo (doppia estensione)
caricaImmagine('phishing', 'Pishing.png');      // Trappola phishing (senza la prima 'h')
caricaImmagine('inflation', 'inflazione.png');  // Mostro mobile dell'inflazione

let enemies = [];
let items = [];

// 2. DATABASE DEI LIVELLI
const levelSpritesDatabase = {
    1: {
        enemies: [
            { x: 14.5, y: 1.5,  alive: true, speed: 0.022, hitFrame: 0, type: 'inflation', health: 1 },
            { x: 8.5,  y: 5.5,  alive: true, speed: 0.018, hitFrame: 0, type: 'inflation', health: 1 },
            { x: 13.5, y: 13.5, alive: true, speed: 0.025, hitFrame: 0, type: 'inflation', health: 1 }
        ],
        items: [
            { x: 4.5,  y: 1.5,  type: 'salary',   active: true }, 
            { x: 1.5,  y: 13.5, type: 'luxury',   active: true }, 
            { x: 9.5,  y: 9.5,  type: 'safe',     active: true }, 
            { x: 14.5, y: 7.5,  type: 'bill',     active: true }, 
            { x: 6.5,  y: 11.5, type: 'phishing', active: true }  
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
    
    // Quando carichiamo gli oggetti, assegniamo una variante estetica casuale (1, 2 o 3) a quelli di tipo 'luxury'
    items = levelData.items.map(item => {
        let newItem = { ...item };
        if (newItem.type === 'luxury') {
            newItem.variant = Math.floor(Math.random() * 3) + 1;
        }
        return newItem;
    });
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
                
                // Cambia casualmente l'aspetto del lusso anche quando riappare (respawn)
                if (item.type === 'luxury') {
                    item.variant = Math.floor(Math.random() * 3) + 1;
                }
                
                spawned = true;
            }
        }
    }, 7000); 
}

// 3. MOTORE DI RENDERING SINCRETICO AGGIORNATO
function drawSprites(ctx, player, width, height, zBuffer, globalAnimTime) {
    let sprites = [];
    items.forEach(item => { if (item.active) sprites.push({ x: item.x, y: item.y, type: item.type, variant: item.variant }); });
    enemies.forEach(enemy => { if (enemy.alive) sprites.push({ x: enemy.x, y: enemy.y, type: enemy.type, health: enemy.health }); });

    // Ordina dal più lontano al più vicino
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
            
            // Effetto oscillazione verticale
            let bobbing = Math.sin(globalAnimTime * 2.0) * 12;
            let scale = (sprite.type === 'inflation' && sprite.health > 10) ? 2.5 : 1.0; 
            
            let spriteHeight = Math.abs(Math.floor(height / transformY)) * scale;
            let spriteWidth = Math.abs(Math.floor(height / transformY)) * scale;

            let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
            let drawStartY = Math.floor(-spriteHeight / 2 + height / 2 + bobbing);

            let centroX = Math.floor(spriteScreenX);
            if (centroX >= 0 && centroX < width && transformY < zBuffer[centroX]) {
                
                // Determina la chiave corretta dell'immagine (gestendo la variante per il lusso)
                let chiaveImmagine = sprite.type;
                if (sprite.type === 'luxury') {
                    chiaveImmagine = 'luxury' + (sprite.variant || 1);
                }
                
                let img = immaginiGioco[chiaveImmagine];
                
                // Se l'immagine è caricata a schermo, la disegna
                if (img && img.complete && img.naturalWidth !== 0) {
                    ctx.drawImage(img, drawStartX, drawStartY, spriteWidth, spriteHeight);
                } else {
                    // FALLBACK VISIVO BEN DISTINTO IN CASO DI IMMAGINI MANCANTI
                    if (sprite.type === 'inflation' || sprite.type === 'phishing' || sprite.type === 'bill') {
                        ctx.fillStyle = '#e74c3c'; // ROSSO per pericoli e bollette
                    } else if (sprite.type === 'luxury') {
                        ctx.fillStyle = '#f1c40f'; // ORO/GIALLO per gli sfizi di lusso
                    } else if (sprite.type === 'safe') {
                        ctx.fillStyle = '#3498db'; // BLU per la cassaforte
                    } else {
                        ctx.fillStyle = '#2ecc71'; // VERDE SMERALDO solo per i soldi (salary)
                    }
                    ctx.fillRect(drawStartX, drawStartY, spriteWidth, spriteHeight);
                }
            }
        }
    });
}

LoadLevelSprites(1);
