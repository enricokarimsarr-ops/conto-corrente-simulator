// =========================================================================
// LABYRINTH ECONOMY - GIOCATORE, PROFILO DI RISCHIO E INPUT TASTIERA/MOUSE
// =========================================================================

// Configurazione iniziale del profilo finanziario del trader/giocatore
let player = { 
    x: 1.5, 
    y: 1.5, 
    dirX: 1.0, 
    dirY: 0.0, 
    planeX: 0.0, 
    planeY: 0.66, 
    bankAccount: 1000,     // Corrisponde a #health nella UI (Liquidità corrente)
    savedFunds: 0,         // Corrisponde a #shield nella UI (Fondo di Emergenza protetto)
    riskMultiplier: 1.0,   // Corrisponde a #ammo nella UI (Moltiplicatore delle speculazioni)
    happinessScore: 0,     // Corrisponde a #score nella UI (Punti Felicità/Vittoria)
    isFrozen: false,       // Stato alterato: blocco delle transazioni da attacco Phishing
    frozenTimer: 0         // Contatore per la durata del blocco informatico
};

// Registro dei tasti premuti in tempo reale e sensibilità del puntatore
let keys = {};
let mouseSensitivity = 0.0025;

// GESTIONE DINAMICA DELLA VELOCITÀ (Richiamata da engine.js ad ogni frame)
function getMoveSpeed(baseSpeed) {
    // Se l'account è congelato a causa del phishing, la velocità di movimento si azzera istantaneamente
    if (player.isFrozen) return 0; 
    
    // Più il moltiplicatore di rischio è alto, più il giocatore si muove velocemente nel labirinto
    return baseSpeed * (1 + (player.riskMultiplier - 1) * 0.4);
}

// LOGICA STATO FINANZIARIO E PROFILO DI RISCHIO (Richiamata nel loop principale)
function updatePlayerFinanceState() {
    // 1. Gestione del timer di sblocco dal Phishing
    if (player.isFrozen) {
        player.frozenTimer--;
        if (player.frozenTimer <= 0) {
            player.isFrozen = false;
            player.frozenTimer = 0;
        }
    }

    // 2. Controllo Manuale del Rischio (Meccanica di Speculazione)
    // Tenendo premuto SHIFT o lo SPAZIO, il giocatore forza investimenti aggressivi ad alto rischio
    if (keys['shift'] || keys[' ']) {
        if (player.riskMultiplier < 3.0) {
            player.riskMultiplier += 0.02; // Incremento progressivo della volatilità del portfolio
        }
    } else {
        // Se si gioca in modo prudente (tasti rilasciati), il profilo di rischio si stabilizza verso la linea base
        if (player.riskMultiplier > 1.0) {
            player.riskMultiplier -= 0.015;
        }
    }
}

// GESTIONE DEL MOUSE (Rotazione matematica della visuale pseudo-3D tramite Raycasting)
document.addEventListener('mousemove', e => {
    let canvas = document.getElementById('gameCanvas');
    // Esegue la rotazione solo se il mouse è catturato (Pointer Lock) e il gioco è attivo
    if (document.pointerLockElement === canvas && typeof gameOver !== 'undefined' && !gameOver) {
        let mouseX = e.movementX;
        let rotSpeed = mouseX * mouseSensitivity;
        
        // Calcolo della rotazione del vettore di direzione (DirX/DirY)
        let oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(rotSpeed) - player.dirY * Math.sin(rotSpeed);
        player.dirY = oldDirX * Math.sin(rotSpeed) + player.dirY * Math.cos(rotSpeed);
        
        // Calcolo della rotazione del vettore del piano della telecamera (PlaneX/PlaneY)
        let oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed);
        player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
    }
});

// GESTIONE EVENTI TASTIERA (Mappatura continua degli input)
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});
