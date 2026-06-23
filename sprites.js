// =========================================================
// GESTIONE ELEMENTI ECONOMICI E MINACCE (STRUTTURA DEFINITIVA)
// =========================================================

// 1. CARICAMENTO ASSET GRAFICI (Un file reale distinto per ogni tipo)
const immaginiGioco = {};

function caricaImmagine(chiave, percorso) {
    immaginiGioco[chiave] = new Image();
    immaginiGioco[chiave].src = percorso;
}

// Assicurati che i nomi dei file nella tua cartella corrispondano a questi:
caricaImmagine('salary', 'soldi.png');         // Soldi da raccogliere (Aumenta Liquidità/Conto)
caricaImmagine('luxury', 'lusso.png');         // Sfizi / Beni di lusso (Aumenta Felicità)
caricaImmagine('safe', 'cassaforte.png');     // Cassaforte (Sposta fondi nel Fondo protetto)
caricaImmagine('bill', 'bolletta.png');       // Bolletta imprevista (Scadenza a tempo)
caricaImmagine('phishing', 'fishhook.png');   // Amo da pesca statico (Trappola informatica che congela)
caricaImmagine('inflation', 'mostro.png');     // Mostro dell'inflazione (Nemico mobile nel labirinto)

let enemies = [];
let items = [];

// 2. DATABASE DEI LIVELLI (Mappatura coerente al 100%)
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
    // Clona gli oggetti per evitare di modificare permanentemente il database durante il gameplay
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
    }, 7000); 
}

// 3. MOTORE DI RENDERING AGGIORNATO (Senza ricicli confusi)
function drawSprites(ctx, player, width, height, zBuffer, globalAnimTime) {
    let sprites = [];
    // Raggruppa solo le entità attive sulla mappa
    items.forEach(item => { if (item.active) sprites.push({ x: item.x, y: item.y, type: item.type }); });
    enemies.forEach(enemy => { if (enemy.alive) sprites.push({ x: enemy.x, y: enemy.y, type: enemy.type, health: enemy.health }); });

    // Ordinamento dal più lontano al più vicino (algoritmo del pittore fondamentale per il Raycasting)
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
            
            // Effetto ondeggiamento verticale oscillante continuo (floating)
            let bobbing = Math.sin(globalAnimTime * 2.0) * 12;
            
            // Gestione scala: l'Inflazione Boss del livello 3 (health > 10) appare gigante
            let scale = (sprite.type === 'inflation' && sprite.health > 10) ? 2.5 : 1.0; 
            
            let spriteHeight = Math.abs(Math.floor(height / transformY)) * scale;
            let spriteWidth = Math.abs(Math.floor(height / transformY)) * scale;

            let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
            let drawStartY = Math.floor(-spriteHeight / 2 + height / 2 + bobbing);

            // Controllo della visibilità tramite Z-Buffer (evita che gli sprite varchino i muri)
            let centroX = Math.floor(spriteScreenX);
            if (centroX >= 0 && centroX < width && transformY < zBuffer[centroX]) {
                
                let img = immaginiGioco[sprite.type];
                
                // Se il file d'immagine esiste ed è caricato correttamente, disegnalo
                if (img && img.complete && img.naturalWidth !== 0) {
                    ctx.drawImage(img, drawStartX, drawStartY, spriteWidth, spriteHeight);
                } else {
                    // FALLBACK: Se dimentichi un file PNG nella cartella, disegna un cubo colorato di emergenza
                    if (sprite.type === 'inflation' || sprite.type === 'phishing' || sprite.type === 'bill') {
                        ctx.fillStyle = '#e74c3c'; // Rosso per le minacce/scadenze
                    } else if (sprite.type === 'luxury') {
                        ctx.fillStyle = '#f1c40f'; // Oro per gli sfizi
                    } else {
                        ctx.fillStyle = '#2ecc71'; // Verde per i guadagni/sicurezza
                    }
                    ctx.fillRect(drawStartX, drawStartY, spriteWidth, spriteHeight);
                }
            }
        }
    });
}

LoadLevelSprites(1);
