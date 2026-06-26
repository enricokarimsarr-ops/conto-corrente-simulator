class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Elementi della UI
        this.balanceEl = document.getElementById('balance');
        this.levelEl = document.getElementById('current-level');
        this.statusEl = document.getElementById('status');

        // Stati di gioco
        this.currentLevelIndex = 0;
        this.balance = 500; // Capitale iniziale
        this.gameState = "PLAYING"; // PLAYING, GAMEOVER, WIN
        this.gameTime = 0;

        // Inizializza il giocatore e carica la mappa
        this.player = new Player();
        this.loadLevel(this.currentLevelIndex);

        // Ascolto dei tasti
        window.addEventListener('keydown', (e) => {
            if (this.gameState === "PLAYING") {
                this.player.handleInput(e.key);
            } else if (e.key === "Enter" || e.key === " ") {
                this.restartGame();
            }
        });

        // Avvia il loop
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    // Carica o resetta una mappa clonandola per poter modificare i numeri in tempo reale
    loadLevel(levelIndex) {
        if (levelIndex >= MAPS.length) {
            this.gameState = "WIN";
            return;
        }
        
        // Clona l'array bidimensionale per non sovrascrivere la mappa originale
        this.currentMap = MAPS[levelIndex].map(row => [...row]);
        this.player.reset();
        this.levelEl.innerText = this.currentLevelIndex + 1;
        this.updateUI();
    }

    // Aggiorna i testi a schermo
    updateUI() {
        this.balanceEl.innerText = this.balance;
        
        if (this.balance <= 0) {
            this.balanceEl.style.color = "#ff3333";
            this.statusEl.innerText = "Bancarotta";
            this.statusEl.style.color = "#ff3333";
            this.gameState = "GAMEOVER";
            AudioManager.playGameOver();
        } else if (this.balance > 1200) {
            this.statusEl.innerText = "Benestante";
            this.statusEl.style.color = "#f1c40f";
            this.balanceEl.style.color = "#4cd137";
        } else {
            this.statusEl.innerText = "Stabile";
            this.statusEl.style.color = "#00a8ff";
            this.balanceEl.style.color = "#4cd137";
        }
    }

    // Gestione delle collisioni di Pac-Man con gli oggetti economici
    checkCollisions() {
        // Calcola in quale cella si trova esattamente il centro del player
        let centerX = this.player.x + TILE_SIZE / 2;
        let centerY = this.player.y + TILE_SIZE / 2;
        let gridX = Math.floor(centerX / TILE_SIZE);
        let gridY = Math.floor(centerY / TILE_SIZE);

        let tile = this.currentMap[gridY][gridX];

        if (tile === 2) { 
            // Raccolto un Risparmio
            this.currentMap[gridY][gridX] = 0; // Svuota la cella
            this.balance += 10;
            AudioManager.playCoin();
            this.updateUI();
            this.checkLevelCompletion();
        } 
        else if (tile === 3) { 
            // Attivato un Investimento
            this.currentMap[gridY][gridX] = 0;
            this.balance += 100;
            AudioManager.playInvestment();
            this.updateUI();
            this.checkLevelCompletion();
        } 
        else if (tile === 4) { 
            // Beccata una Bolletta!
            this.currentMap[gridY][gridX] = 0;
            this.balance -= 150;
            AudioManager.playBill();
            this.updateUI();
        }
    }

    // Controlla se la mappa è stata svuotata da monete e investimenti
    checkLevelCompletion() {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.currentMap[r][c] === 2 || this.currentMap[r][c] === 3) {
                    return; // C'è ancora roba da raccogliere
                }
            }
        }
        // Se arriviamo qui, il livello è finito!
        this.currentLevelIndex++;
        this.loadLevel(this.currentLevelIndex);
    }

    // Reset completo in caso di Game Over
    restartGame() {
        this.currentLevelIndex = 0;
        this.balance = 500;
        this.gameState = "PLAYING";
        this.loadLevel(this.currentLevelIndex);
    }

    // Schermate di testo per Game Over o Vittoria
    drawOverlay(message, subMessage, color) {
        this.ctx.fillStyle = "rgba(12, 16, 32, 0.85)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = color;
        this.ctx.font = "bold 28px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 10);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "16px sans-serif";
        this.ctx.fillText(subMessage, this.canvas.width / 2, this.canvas.height / 2 + 30);
    }

    // Il Game Loop principale
    loop() {
        this.gameTime += 16.67; // Approssimazione di un frame a 60fps

        // 1. Pulisci lo schermo
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === "PLAYING") {
            // 2. Aggiorna logica
            this.player.update(this.currentMap);
            this.checkCollisions();

            // 3. Disegna elementi
            Sprites.drawMap(this.ctx, this.currentMap, this.gameTime);
            this.player.draw(this.ctx);
            
        } else if (this.gameState === "GAMEOVER") {
            Sprites.drawMap(this.ctx, this.currentMap, this.gameTime);
            this.drawOverlay("BANCAROTTA!", "Conto in rosso. Premi SPAZIO per ricominciare", "#ff3333");
        } else if (this.gameState === "WIN") {
            this.drawOverlay("OBIETTIVO COSTRUITO!", "Hai completato l'educazione finanziaria!", "#4cd137");
        }

        requestAnimationFrame(this.loop);
    }
}

// Avvia l'intero motore di gioco al caricamento della pagina
window.onload = () => {
    new GameEngine();
};
