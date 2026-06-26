// =========================================================================
// LABYRINTH ECONOMY - GIOCATORE, STATO FINANZIARIO E INPUT TASTIERA/MOUSE
// =========================================================================

// Configurazione del profilo economico e di posizionamento del giocatore
let player = { 
    x: 1.5, 
    y: 1.5, 
    dirX: 1.0, 
    dirY: 0.0, 
    planeX: 0.0, 
    planeY: 0.66, 
    bankAccount: 1000,     // Liquidità corrente (Mostrato come #health nella UI)
    savedFunds: 0,         // Fondo di Emergenza Protetto (Mostrato come #shield nella UI)
    riskMultiplier: 1.0,   // Moltiplicatore Punti proporzionale (Mostrato come #ammo nella UI)
    happinessScore: 0,     // Punti Felicità / Vittoria (Mostrato come #score nella UI)
    isFrozen: false,       // Stato alterato: blocco transazioni da attacco Phishing
    frozenTimer: 0         // Contatore dei frame per la durata del blocco informatico
};

// Registro degli input in tempo reale
let keys = {};
let mouseSensitivity = 0.0025;

/**
 * GESTIONE DINAMICA DELLA VELOCITÀ CORRETTA
 * Previene l'immobilità a 0€ fornendo una velocità fluida di movimento.
 */
function getMoveSpeed(baseSpeed) {
    // Se l'account è congelato dal phishing, la velocità si riduce drasticamente per simulare l'attacco
    if (player.isFrozen) return 0.01; 
    
    // Alziamo la base minima a 0.035 così quando depositi tutto a 0€ puoi comunque correre a cercare stipendi
    const baseMinima = 0.035; 
    
    // Bonus proporzionale alla liquidità corrente nel portafoglio
    let speedBonus = player.bankAccount * 0.00005; 
    
    // Ritorna la velocità calcolata, con un tetto massimo (0.12) per evitare glitch fisici nei muri
    return Math.min(baseMinima + speedBonus, 0.12);
}

/**
 * LOGICA STATO FINANZIARIO E MOLTIPLICATORI
 * Aggiorna i coefficienti economici. Richiamata nel loop principale.
 */
function updatePlayerFinanceState() {
    // 1. Gestione del timer di sblocco dal Phishing
    if (player.isFrozen) {
        player.frozenTimer--;
        if (player.frozenTimer <= 0) {
            player.isFrozen = false;
            player.frozenTimer = 0;
        }
    }

    // 2. Calcolo del Moltiplicatore Punti (riskMultiplier)
    // È direttamente proporzionale al Conto Corrente (Es: 1000€ = x1.0, 2000€ = x2.0)
    // Sotto i 100€ scende sotto l'1.0, fino a un minimo di stabilità di 0.1
    player.riskMultiplier = Math.max(0.1, parseFloat((player.bankAccount / 1000).toFixed(1)));
}

/**
 * INTERAZIONE CASSAFORTE (FONDO DI EMERGENZA)
 * Sposta tutta la liquidità volatile dalle tasche alla cassaforte blindata.
 */
function executeSafeDeposit() {
    if (player.bankAccount > 0) {
        player.savedFunds += player.bankAccount;
        player.bankAccount = 0; // Tasche completamente vuote!
        
        if (typeof playScoreSound === 'function') {
            playScoreSound();
        }
    }
}

// =========================================================================
// GESTIONE INPUT (MOUSE & TASTIERA)
// =========================================================================

// Rotazione della visuale 3D tramite Raycasting con il movimento del mouse
document.addEventListener('mousemove', e => {
    let canvas = document.getElementById('gameCanvas');
    
    if (document.pointerLockElement === canvas && (typeof gameOver === 'undefined' || !gameOver)) {
        let mouseX = e.movementX;
        let rotSpeed = mouseX * mouseSensitivity;
        
        // Rotazione del vettore di direzione (DirX/DirY)
        let oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(rotSpeed) - player.dirY * Math.sin(rotSpeed);
        player.dirY = oldDirX * Math.sin(rotSpeed) + player.dirY * Math.cos(rotSpeed);
        
        // Rotazione del vettore del piano della telecamera (PlaneX/PlaneY)
        let oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed);
        player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
    }
});

// Ascolto e registrazione continua della pressione dei tasti
window.addEventListener('keydown', e => {
    let keyName = e.key.toLowerCase();
    keys[keyName] = true;
    
    // Mappatura dei tasti di interazione (Spazio o 'E') per la Cassaforte
    if (keyName === ' ' || keyName === 'e') {
        if (typeof checkSafeInteraction === 'function') {
            checkSafeInteraction();
        }
    }
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});
