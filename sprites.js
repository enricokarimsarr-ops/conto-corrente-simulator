// =========================================================
// GESTIONE ELEMENTI ECONOMICI E MINACCE (CON IMMAGINI REALI)
// =========================================================

// 1. CARICAMENTO ASSET GRAFICI
const immaginiGioco = {};

function caricaImmagine(chiave, percorso) {
    immaginiGioco[chiave] = new Image();
    immaginiGioco[chiave].src = percorso;
}

// Carichiamo i tuoi file PNG
caricaImmagine('salary', 'soldi.png');
caricaImmagine('safe', 'cassaforte.png');
caricaImmagine('inflation', 'fishhook.png'); // Usiamo l'amo da pesca per il mostro dell'inflazione!
caricaImmagine('bill', 'fishhook.png');      // Puoi cambiarlo con un'altra immagine se vuoi
caricaImmagine('phishing', 'fishhook.png');  // Puoi cambiarlo con un'altra immagine se vuoi

let enemies = [];
let items = [];

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

// 2. MOTORE DI DISEGNO AGGIORNATO PER IMMAGINI PNG
function drawSprites(ctx, player, width, height, zBuffer, globalAnimTime) {
    let sprites = [];
    items.forEach(item => { if (item.active) sprites.push({ x: item.x, y: item.y, type: item.type }); });
    enemies.forEach(enemy => { if (enemy.alive) sprites.push({ x: enemy.x, y: enemy.y, type: enemy.type, health: enemy.health }); });

    // Ordina gli sprite dal più lontano al più vicino
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
            
            // Effetto ondeggiamento verticale (floating)
            let bobbing = Math.sin(globalAnimTime * 2.0) * 12;
            let scale = (sprite.type === 'inflation' && sprite.health > 10) ? 2.0 : 1.0; 
            
            let spriteHeight = Math.abs(Math.floor(height / transformY)) * scale;
            let spriteWidth = Math.abs(Math.floor(height / transformY)) * scale;

            let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
            let drawStartY = Math.floor(-spriteHeight / 2 + height / 2 + bobbing);

            // Controllo dello Z-Buffer: disegna l'immagine solo se non è nascosta dietro un muro
            // Controlliamo il centro dell'oggetto per semplicità e performance con le immagini intere
            let centroX = Math.floor(spriteScreenX);
            if (centroX >= 0 && centroX < width && transformY < zBuffer[centroX]) {
                
                // Seleziona l'immagine corretta caricata in precedenza
                let img = immaginiGioco[sprite.type];
                
                // Gestione di sicurezza se un'immagine non ha un file dedicato (es. luxury)
                if (!img) img = immaginiGioco['salary']; 

                // DISEGNA L'IMMAGINE PNG SUL CANVAS
                ctx.drawImage(img, drawStartX, drawStartY, spriteWidth, spriteHeight);
            }
        }
    });
}

LoadLevelSprites(1);
